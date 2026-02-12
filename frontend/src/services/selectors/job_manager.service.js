export default async function main(job_manager) {
    const job_manager_address = await job_manager.getAddress();
    const job_manager_selectors = ["set_client_fee_portion(uint)", "append_level", "register_freelancer(address, uint)"]
    return job_manager_selectors.map((signature, index) => ({
        target: job_manager_address,
        signature:signature,
        selector: job_manager.interface.getFunction(signature).selector
    }));
}
