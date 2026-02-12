import {network} from "hardhat";
const {ethers, networkName}=await network.connect();
console.log("Deploying contracts on the ", networkName, " network.")
export default ethers;