import {abi as access_manager_abi} from "../abis/RPTAccessManager.json" with {type: "json"};
import connect_wallet from "./connect_wallet.service.js";
import {ethers, JsonRpcProvider, Wallet} from "ethers";
import {get_addresses} from "./system_addresses.service.js";
import axios from "axios";

const {provider} = await connect_wallet();


async function main(fund_amount_gwei) {
    const addresses = await get_addresses();
    const {provider} = await connect_wallet();

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || undefined;

// 1️⃣ Create temporary hot wallet
    const temp_wallet = Wallet.createRandom().connect(provider);
    let nonce = await provider.getTransactionCount(temp_wallet.address, "latest");
// 2️⃣ Deployer / Admin signer (MetaMask once)
    const {signer} = await connect_wallet();

    const FUND_AMOUNT = ethers.parseUnits(fund_amount_gwei.toString() || "1000000", "gwei");
    await fund_temp_wallet(signer, temp_wallet, FUND_AMOUNT);
    const access_manager_admin = new ethers.Contract(
        addresses.access_manager_address,
        access_manager_abi,
        signer
    );


    const access_manager_temp = access_manager_admin.connect(temp_wallet);


    await grant_admin(temp_wallet, access_manager_admin, gasPrice);
    return {temp_wallet, access_manager_admin, access_manager_temp, nonce, gasPrice};
}

export default async function create_roles(input, fund_amount_gwei) {
    let temp_wallet, access_manager_admin, access_manager_temp, nonce, gasPrice;
    const {signer} = await connect_wallet();

    try {
        ({temp_wallet, access_manager_admin, access_manager_temp, nonce, gasPrice} = await main(fund_amount_gwei));

        for (const role of input) {
            await (await access_manager_temp.labelRole(
                role.id,
                role.label,
                {nonce: nonce++, gasPrice}
            )).wait();

            await (await access_manager_temp.setRoleAdmin(
                role.id,
                role.admin,
                {nonce: nonce++, gasPrice}
            )).wait();
            console.assert((await access_manager_temp.getRoleAdmin(role.id)) === role.admin)


            await (await access_manager_temp.setRoleGuardian(
                role.id,
                role.guardian,
                {nonce: nonce++, gasPrice}
            )).wait();

            console.assert((await access_manager_temp.getRoleGuardian(role.id)) === role.guardian)
            await (await access_manager_temp.setGrantDelay(
                role.id,
                role.grant_delay,
                {nonce: nonce++, gasPrice}
            )).wait();


            for (const tr of role.target_roles) {
                await (await access_manager_temp.setTargetFunctionRole(
                    tr.target,
                    tr.selectors,
                    role.id,
                    {nonce: nonce++, gasPrice}
                )).wait();
                console.assert((await access_manager_temp.getTargetFunctionRole(tr.target, tr.selectors[0])) === role.id);

            }
        }
        console.log("✅ Access configuration completed securely");
    } catch (error) {
        console.error("❌ Error in create_roles:", error);
        throw error;
    } finally {
        if (temp_wallet && access_manager_admin) {
            try {
                await revoke_admin(temp_wallet.address, access_manager_admin, temp_wallet, gasPrice);
            } catch (e) {
                console.error("Failed to revoke admin in finally block:", e);
            }
        }
        if (temp_wallet && signer) {
            await refund_remains(temp_wallet, signer);
        }
    }
}


export async function assign_addresses(input, fund_amount_gwei) {
    let temp_wallet, access_manager_admin, access_manager_temp, gasPrice;
    const {signer} = await connect_wallet();

    try {
        ({temp_wallet, access_manager_admin, access_manager_temp, gasPrice} = await main(fund_amount_gwei));
        for (const role of input) {
            const id = role.id;
            for (const account of role.accounts) {
                await (await access_manager_temp.grantRole(id, account.address, account.duration, {gasPrice})).wait();
            }
        }
        console.log("✅ Address assignments completed successfully");
    } catch (error) {
        console.error("❌ Error in assign_addresses:", error);
        throw error;
    } finally {
        if (temp_wallet && access_manager_admin) {
            try {
                await revoke_admin(temp_wallet.address, access_manager_admin, temp_wallet, gasPrice);
            } catch (e) {
                console.error("Failed to revoke admin in finally block:", e);
            }
        }
        if (temp_wallet && signer) {
            await refund_remains(temp_wallet, signer);
        }
    }
}


async function revoke_admin(address, access_manager_admin, temp_wallet, gasPrice) {
// 7️⃣ Revoke temp wallet admin access
    await (await access_manager_admin.revokeRole(
        0,
        temp_wallet.address,
        {gasPrice}
    )).wait();

    const {isMember,} = await access_manager_admin.hasRole(0, temp_wallet.address);

    console.assert(isMember === false);
}

async function fund_temp_wallet(signer, temp_wallet, FUND_AMOUNT) {
    // Fetch fee data to avoid unsupported RPC methods (like eth_maxPriorityFeePerGas)
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || undefined;

    // 1. Send the transaction and wait for it to be broadcast to the network
    const tx = await signer.sendTransaction({
        to: temp_wallet.address,
        value: FUND_AMOUNT,
        gasPrice: gasPrice // Force legacy gas price to avoid EIP-1559 errors on some RPCs
    });

    // 2. Wait for the transaction to be mined (included in a block)
    await tx.wait();

}

async function grant_admin(temp_wallet, access_manager_admin, gasPrice) {// 4️⃣ Grant ADMIN_ROLE (0) to temp wallet
    await (await access_manager_admin.grantRole(
        0,
        temp_wallet.address,
        0,
        {gasPrice}
    )).wait();
}

async function refund_remains(temp_wallet, signer) {
    try {
        const balance = await provider.getBalance(temp_wallet.address);
        if (balance === 0n) return;

        // Estimate gas for a simple transfer
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");
        const gasLimit = 21000n; // Standard ETH transfer gas limit
        const gasCost = gasPrice * gasLimit;

        if (balance <= gasCost) {
            console.log("Balance too low to refund after gas costs");
            return;
        }

        const refundAmount = balance - gasCost;

        console.log(`Refunding ${ethers.formatEther(refundAmount)} ETH to ${signer.address}`);

        const tx = await temp_wallet.sendTransaction({
            to: signer.address,
            value: refundAmount,
            gasLimit: gasLimit,
            gasPrice: gasPrice
        });
        await tx.wait();
        console.log("Refund completed");
    } catch (e) {
        console.error("Failed to refund remains:", e);
    }
}
export async function roles_admin_guardian_delay(roles_ids) {
    const addresses = await get_addresses();
    const {signer} = await connect_wallet();
    const access_manager_admin = new ethers.Contract(
        addresses.access_manager_address,
        access_manager_abi,
        signer
    );

    const roles_admins = await Promise.all(roles_ids.map(async (id) => {
        const admin = await access_manager_admin.getRoleAdmin(id);
        return {id, admin: admin.toString()};
    }));
    const roles_guardians = await Promise.all(roles_ids.map(async (id) => {
        const guardian = await access_manager_admin.getRoleGuardian(id);
        return {id, guardian: guardian.toString()};
    }));
    const roles_delays = await Promise.all(roles_ids.map(async (id) => {
        const delay = await access_manager_admin.getRoleGrantDelay(id);
        return {id, delay: delay.toString()};
    }))
    return {roles_admins, roles_guardians, roles_delays};
}

export async function get_roles_assignments() {
    try {
        const response = await axios.get("http://localhost:3333/api/auth/roles_assignments", {withCredentials: true});
        return response.data;
    } catch (error) {
        console.error("Error fetching roles assignments:", error);
        return [];
    }
}