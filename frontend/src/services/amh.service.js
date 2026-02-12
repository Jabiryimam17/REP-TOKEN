import {abi as access_manager_abi} from "../abis/RPTAccessManager.json" with {type: "json"};
import connect_wallet from "./connect_wallet.service.js";
import {ethers, JsonRpcProvider, Wallet} from "ethers";
import addresses from "./system_addresses.service.js";

const provider = new JsonRpcProvider("http://localhost:8545");

// 1️⃣ Create temporary hot wallet
const temp_wallet = Wallet.createRandom().connect(provider);

// 2️⃣ Deployer / Admin signer (MetaMask once)
const {signer} = await connect_wallet();

const FUND_AMOUNT = ethers.parseEther("0.05");


const access_manager_admin = new ethers.Contract(
    addresses.access_manager_address,
    access_manager_abi,
    signer
);



const access_manager_temp = access_manager_admin.connect(temp_wallet);



let nonce = await provider.getTransactionCount(temp_wallet.address, "latest");
export default async function main(input) {

    await fund_temp_wallet();
    await grant_admin();

    for (const role of input) {
        await (await access_manager_temp.labelRole(
            role.id,
            role.label,
            {nonce: nonce++}
        )).wait();

        // assert(await access_manager_temp.get)
        await (await access_manager_temp.setRoleAdmin(
            role.id,
            role.admin,
            {nonce: nonce++}
        )).wait();
        console.assert((await access_manager_temp.getRoleAdmin(role.id)) === role.admin)


        await (await access_manager_temp.setRoleGuardian(
            role.id,
            role.guardian,
            {nonce: nonce++}
        )).wait();

        console.assert((await access_manager_temp.getRoleGuardian(role.id)) === role.guardian)
        await (await access_manager_temp.setGrantDelay(
            role.id,
            role.grant_delay,
            {nonce: nonce++}
        )).wait();


        for (const tr of role.target_roles) {
            await (await access_manager_temp.setTargetFunctionRole(
                tr.target,
                tr.selectors,
                role.id,
                {nonce: nonce++}
            )).wait();
            console.assert((await access_manager_temp.getTargetFunctionRole(tr.target, tr.selectors[0])) === role.id);

        }
    }

    await revoke_admin(temp_wallet.address);


    console.log("✅ Access configuration completed securely");
}


export async function assign_addresses(input) {
    await grant_admin();
    for (const role of input) {
        const id = role.id;
        for (const account of role.accounts) {
            await (await access_manager_temp.grantRole(id, account.address, account.duration)).wait();
        }
    }
    await revoke_admin(temp_wallet.address);
}


async function revoke_admin(address) {
// 7️⃣ Revoke temp wallet admin access
    await (await access_manager_admin.revokeRole(
        0,
        temp_wallet.address
    )).wait();

    const {isMember,} = await access_manager_admin.hasRole(0, temp_wallet.address);

    console.assert(isMember === false);
}

async function fund_temp_wallet() {
    await (await signer.sendTransaction({
        to: temp_wallet.address,
        value: FUND_AMOUNT
    }).wait());
}

async function grant_admin() {// 4️⃣ Grant ADMIN_ROLE (0) to temp wallet
    await (await access_manager_admin.grantRole(
        0,
        temp_wallet.address,
        0
    )).wait();
}