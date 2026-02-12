import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";
import HardhatIgnitionEthersPlugin from "@nomicfoundation/hardhat-ignition-ethers";
export default defineConfig({
    plugins: [hardhatToolboxMochaEthersPlugin, HardhatIgnitionEthersPlugin],
    solidity: {
        // Hardhat looks here to find a compiler that matches each file's pragma
        compilers: [
            {
                version: "0.8.28",
                settings: {
                    optimizer: { enabled: true, runs: 200 },
                },
            },
            {
                version: "0.5.16", // Required for UniswapV2Factory
                settings: {
                    optimizer: { enabled: true, runs: 200 },
                },
            },
            {
                version: "0.6.6", // Required for UniswapV2Router
                settings: {
                    optimizer: { enabled: true, runs: 200 },
                },
            },
        ],
    },
    networks: {
        localhost: {
            type:'http',
            url: "http://127.0.0.1:8545",
        },
        sepolia: {
            type:'http',
            url: configVariable("SEPOLIA_RPC_URL"),
            accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
        }
    },
});
