export default async function main(rpt) {
    const rpt_address = await rpt.getAddress();
    const rpt_selectors = [
        "mint(address,uint256)",
        "burn(address,uint256)"
    ];

    return rpt_selectors.map((signature) => ({
        target: rpt_address,
        signature: signature,
        selector: rpt.interface.getFunction(signature).selector
    }));
}