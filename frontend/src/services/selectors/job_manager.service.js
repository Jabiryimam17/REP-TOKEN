export default async function main(job_manager) {
    const job_manager_address = await job_manager.getAddress();
    const job_manager_selectors = [
        "set_freelancer_fee_portion(uint256)",
        "set_client_fee_portion(uint256)",
        "reset_levels((uint32,uint256,uint256,uint256,uint256)[])",
        "update_level((uint32,uint256,uint256,uint256,uint256),uint256)",
        "append_level((uint32,uint256,uint256,uint256,uint256))",
        "register_freelancer(address)"
    ]
    return job_manager_selectors.map((signature, index) => ({
        target: job_manager_address,
        signature:signature,
        selector: job_manager.interface.getFunction(signature).selector
    }));
}
