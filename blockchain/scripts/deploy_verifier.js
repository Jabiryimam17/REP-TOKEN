import ethers from "./connect.js";
import dotenv from "dotenv";
dotenv.config();
export default async function main(registry, access_manager) {

    const coordinator = process.env.COORDINATOR;
    const subscription_id=process.env.SUBSCRIPTION_ID;
    const verifier = await ethers.deployContract("VerifierSystem", [coordinator, subscription_id, registry, access_manager]);
    await verifier.waitForDeployment();
    const verifier_address=await verifier.getAddress();
    console.log("Verifier deployed to:", verifier_address);
    return verifier_address;

}