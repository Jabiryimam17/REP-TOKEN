export default async function main(verifier) {
    const verifier_address = await verifier.getAddress();
    const verifier_selectors = [
        "set_deadlines(uint256,uint256)",
        "set_up_vrf(uint256,uint16,bytes32,uint32,address,address)",
        "add_stack_level(uint256)",
        "add_stack_levels(uint256[])",
        "set_slash_bps(uint256)",
        "add_category(string)",
        "add_verifier(uint16,address)",
        "post_job(bytes32,uint8,uint256,uint256)"
    ]


    return verifier_selectors.map((signature, index) => ({
        target: verifier_address,
        signature: signature,
        selector: verifier.interface.getFunction(signature).selector
    }));
}