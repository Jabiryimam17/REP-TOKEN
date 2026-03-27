import ethers from "./connect.js";
import dotenv from "dotenv";
dotenv.config({path: "../.env"});
export default async function main(registry, access_manager) {

    const coordinator = process.env.COORDINATOR;
    const subscription_id=process.env.SUBSCRIPTION_ID;
    const vrf_wrapper=process.env.VRF_WRAPPER;
    const link_token = process.env.LINK_TOKEN;
    const verifier = await ethers.deployContract("VerifierSystem", [coordinator, subscription_id, vrf_wrapper, link_token, registry, access_manager]);
    await verifier.waitForDeployment();
    await add_stakes(verifier);

    const verifier_address=await verifier.getAddress();
    console.log("Verifier deployed to:", verifier_address);
    await add_categories(verifier);
    return verifier_address;

}

export async function add_categories(verifier) {
        const categories = ["Web Development", "Graphic Design", "Content Writing", "Digital Marketing", "Data Analysis", "Mobile App Development", "SEO Services", "Video Editing", "Translation Services", "Virtual Assistance"];
        for (const category of categories) {
            const tx_add_category = await verifier.add_category(category);
            await tx_add_category.wait();
        }
}
export async function add_stakes(verifier) {
    const stake_amounts = [
        ethers.parseUnits("0", 18),
        ethers.parseUnits("100", 18),
        ethers.parseUnits("500", 18),
        ethers.parseUnits("1000", 18),
        ethers.parseUnits("5000", 18),
        ethers.parseUnits("10000", 18),
        ethers.parseUnits("50000", 18),
        ethers.parseUnits("100000", 18)
    ];
    const tx_add_stakes = await verifier.add_stack_levels(stake_amounts);
    await tx_add_stakes.wait();
}
export async function deploy_verifier_single(registry_address, access_manager) {
    const registry_abi = [
        "function set_verifier(address _verifier_manager) external"
    ]
    const [deployer] = await ethers.getSigners();
    const registry_contract = new ethers.Contract(registry_address, registry_abi, deployer);
    const new_verifier_address=await main(registry_address, access_manager);
    const tx=await registry_contract.set_verifier(new_verifier_address);
    await tx.wait();

    console.log("Registry updated with new VerifierManager:", new_verifier_address);
    return new_verifier_address;
}

await deploy_verifier_single('0x7915f54253485bba062a49fD3Ce1B296552f7948','0x40D2Cd6BaCE480DF49bAFcCE1635d3CeB3168b99');
