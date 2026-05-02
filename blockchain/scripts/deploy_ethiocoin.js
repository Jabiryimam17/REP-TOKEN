import ethers from './connect.js';

export default async function () {

    const ethiocoin = await ethers.deployContract("EthioCoin");
    await ethiocoin.waitForDeployment();
    const ethiocoin_address = await ethiocoin.getAddress();
    console.log("Ethiocoin deployed to:", ethiocoin_address);
    return {ethiocoin, ethiocoin_address};
}
