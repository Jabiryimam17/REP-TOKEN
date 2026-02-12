import ethers from './connect.js';

export default async function main(ethiocoin_address, rpt_address, ethiocoin, rpt) {
    console.log("Deploying pool...");
    const [deployer] = await ethers.getSigners();

    const factory = await ethers.deployContract("UniswapV2Factory", [deployer.address]);
    await factory.waitForDeployment();
    const factory_address = await factory.getAddress();
    console.log("Factory deployed to:", factory_address);

    const weth = await ethers.deployContract("WETH9");
    await weth.waitForDeployment();
    const weth_address = await weth.getAddress();
    console.log("WETH deployed to:", weth_address);

    const router = await ethers.deployContract("UniswapV2Router02", [factory_address, weth_address]);
    await router.waitForDeployment();
    const router_address = await router.getAddress();
    console.log("Router deployed to:", router_address);

    // ✅ Use parseUnits with correct decimals
    const amount = ethers.parseUnits("100", 18); // 100 tokens

    // Approve router to spend tokens
    await ethiocoin.approve(router_address, amount);
    await rpt.approve(router_address, amount);

    console.log("Allowance ETH:", await ethiocoin.allowance(deployer.address, router_address));
    console.log("Allowance RPT:", await rpt.allowance(deployer.address, router_address));

    // Create pair manually if you want
    const tx_pool = await factory.createPair(ethiocoin_address, rpt_address);
    await tx_pool.wait();
    const pool_address = await factory.getPair(ethiocoin_address, rpt_address);
    console.log("Pool deployed to:", pool_address);

    const deadline = Math.floor(Date.now() / 1000) + 600;

    // ✅ Actually add liquidity (not staticCall)
    const tx_liquidify = await router.addLiquidity(
        ethiocoin_address,
        rpt_address,
        amount,
        amount,
        0n,
        0n,
        deployer.address,
        deadline
    );
    await tx_liquidify.wait();

    console.log("Liquidity added successfully");

    return { factory_address, pool_address, router_address, weth_address };
}
