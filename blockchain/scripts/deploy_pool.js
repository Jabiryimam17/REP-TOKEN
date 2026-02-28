import ethers from './connect.js';
import dotenv from 'dotenv';
dotenv.config({path:'../.env'});
import IUniswapV2Factory from '@uniswap/v2-core/build/IUniswapV2Factory.json';
export default async function main(ethiocoin_address, rpt_address) {
    console.log("Deploying pool...");
    const [deployer] = await ethers.getSigners();

    const factory_address=process.env.UNISWAP_FACTORY;
    const router_address=process.env.UNISWAP_ROUTER;
    const factory = new ethers.Contract(factory_address, IUniswapV2Factory.abi, deployer);



    const tx_pool = await factory.createPair(ethiocoin_address, rpt_address);
    await tx_pool.wait();
    const pool_address = await factory.getPair(ethiocoin_address, rpt_address);
    console.log("Pool deployed to:", pool_address);


    return {factory_address, router_address, pool_address};
}
