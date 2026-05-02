export default async function main(registry) {
    const registry_address = await registry.getAddress();
    const registry_selectors = [
        "set_rpt(address)",
        "set_treasury(address)",
        "set_job_manager(address)",
        "set_verifier(address)",
        "set_reward_vault(address)",
        "set_ethiocoin(address)"
    ]
    return registry_selectors.map((signature, index) => ({
        target: registry_address,
        signature: signature,
        selector: registry.interface.getFunction(signature).selector
    }));
}