export default async function main(verifier) {
    const verifier_address = await verifier.getAddress();
    const verifier_selectors = ["add_verifier(uint16,address)"]

    return verifier_selectors.map((signature, index) => ({
        target: verifier_address,
        signature: signature,
        selector: verifier.interface.getFunction(signature).selector
    }));
}