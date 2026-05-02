import {ethers} from "ethers";
import access_manager_interface from "#abis/RPTAccessManager.json" with {type: "json"};
import connect_wallet from "#utils/connect_wallet.util.js";
import db from "#models/index.js";
import addresses from "#utils/system_addresses.util.js"
import {
    listen_job_acceptances,
    listen_job_closure,
    listen_job_completes,
    listen_job_disputes,
    listen_job_expiration_cancels,
    listen_job_posts,
    listen_job_unhired_cancels,
    listen_pendings,
    listen_transfer_freelancer_addresses
} from "#services/collect_job_events.service.js";
import {
    listen_dispute_resolves,
    listen_disputes,
    listen_transfer_verifiers_addresses,
    listen_verifiers_selection
} from "#services/collect_verifier_events.service.js";

const MAX_BLOCKS = 5000;






async function return_last_block() {
    const [rows] = await db.query("SELECT * from configs where id=0");
    return rows[0];
}

export async function listen_role_assignment() {
    try {
        const {abi: access_manager_abi} = access_manager_interface;
        const {access_manager_address} = addresses;
        const provider = await connect_wallet();
        const access_manager = new ethers.Contract(
            access_manager_address,
            access_manager_abi,
            provider
        );

        const current_block = await provider.getBlockNumber();
        const last_block = await return_last_block();
        let from_block = last_block.roles_assignments;
        from_block = (from_block === 0 || from_block === undefined || from_block === null) ? current_block - 10 : from_block;

        // 2. Safe block (reorg protection)
        const CONFIRMATIONS = 6;
        let safe_block = Math.min(current_block - CONFIRMATIONS, from_block + MAX_BLOCKS);

        if (safe_block <= from_block) return;

        // 3. Fetch events
        const revoked_events = await access_manager.queryFilter(
            access_manager.filters.RoleRevoked(),
            from_block + 1,
            safe_block
        );

        const granted_events = await access_manager.queryFilter(
            access_manager.filters.RoleGranted(),
            from_block + 1,
            safe_block
        );

        // 4. Merge + correct sort
        const events = [...revoked_events, ...granted_events];
        events.sort((a, b) => {
            if (a.blockNumber !== b.blockNumber) {
                return a.blockNumber - b.blockNumber;
            }
            return a.index - b.index;
        });

        // 5. Process events
        for (const event of events) {
            const {roleId: role_id, account} = event.args;
            const address = Buffer.from(account.slice(2), "hex");

            // Fetch current state (needed for your logic)
            const [[role]] = await db.query(
                "SELECT * FROM contract_roles WHERE role_id=? AND subject=?",
                [role_id, address]
            );

            if (event.fragment.name === "RoleGranted") {
                const {delay, since, newMember} = event.args;


                if (!role) {
                    // New entry
                    await db.query(`
                        INSERT INTO contract_roles
                        (role_id, subject, action, delay, granted_time, new_member, block_number, log_index, tx_hash)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        role_id,
                        address,
                        "GRANTED",
                        delay,
                        since,
                        newMember,
                        event.blockNumber,
                        event.index,
                        event.transactionHash
                    ]);

                } else if (role.action === "REVOKED") {
                    // Re-granted after revoke
                    await db.query(`
                        UPDATE contract_roles
                        SET action=?,
                            delay=?,
                            granted_time=?,
                            new_member=?,
                            block_number=?,
                            log_index=?,
                            tx_hash=?
                        WHERE role_id = ?
                          AND subject = ?
                    `, [
                        "GRANTED",
                        delay,
                        since,
                        newMember,
                        event.blockNumber,
                        event.index,
                        event.transactionHash,
                        role_id,
                        address
                    ]);

                } else {
                    // Existing active role → only delay update (your logic)
                    await db.query(`
                        UPDATE contract_roles
                        SET delay=?,
                            block_number=?,
                            log_index=?,
                            tx_hash=?
                        WHERE role_id = ?
                          AND subject = ?
                    `, [
                        delay,
                        event.blockNumber,
                        event.index,
                        event.transactionHash,
                        role_id,
                        address
                    ]);
                }

            } else if (event.fragment.name === "RoleRevoked") {

                if (role) {
                    await db.query(`
                        UPDATE contract_roles
                        SET action=?,
                            block_number=?,
                            log_index=?,
                            tx_hash=?
                        WHERE role_id = ?
                          AND subject = ?
                    `, [
                        "REVOKED",
                        event.blockNumber,
                        event.index,
                        event.transactionHash,
                        role_id,
                        address
                    ]);
                } else {
                    // Edge case: revoke without prior insert
                    await db.query(`
                        INSERT INTO contract_roles
                            (role_id, subject, action, block_number, log_index, tx_hash)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        role_id,
                        address,
                        "REVOKED",
                        event.blockNumber,
                        event.index,
                        event.transactionHash
                    ]);
                }
            }
        }

        // 6. Save progress
        await db.query(
            "UPDATE configs SET roles_assignments=? WHERE id=0",
            [safe_block]
        );
    } catch (e) {
        console.error("Role assignment listener error:", e);
    }
}

const listeners = [
    listen_job_posts,
    listen_pendings,
    listen_job_acceptances,
    listen_job_unhired_cancels,
    listen_job_expiration_cancels,
    listen_job_disputes,
    listen_job_completes,
    listen_job_closure,
    listen_transfer_freelancer_addresses,
    listen_disputes,
    listen_dispute_resolves,
    listen_verifiers_selection,
    listen_transfer_verifiers_addresses,
    listen_role_assignment
];
// await listen_role_assignment();
export default async function listen_all() {
    while (true) {
        for (const fn of listeners) {
            try {
                await fn();
            } catch (e) {
                console.error(`Error in listener ${fn.name}:`, e);
            }
            await new Promise((resolve) => setTimeout(resolve, 1000*60*2));
        }
        await new Promise((resolve) => setTimeout(resolve, 1000*60*5));
    }
}




