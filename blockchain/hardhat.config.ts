import "./env.js";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config"; // Remove configVariable
import HardhatIgnitionEthersPlugin from "@nomicfoundation/hardhat-ignition-ethers";

export default defineConfig({
    plugins: [hardhatToolboxMochaEthersPlugin, HardhatIgnitionEthersPlugin],
    solidity: {
        compilers: [
            { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 } } },
            { version: "0.5.16", settings: { optimizer: { enabled: true, runs: 200 } } },
            { version: "0.6.6", settings: { optimizer: { enabled: true, runs: 200 } } },
        ],
    },
    networks: {
        localhost: {
            type: 'http',
            url: "http://127.0.0.1:8545",
        },

        sepolia: {
            type: 'http',
            // Use process.env instead of configVariable
            url: process.env.SEPOLIA_RPC_URL || "",
            accounts: process.env.PRIVATE_KEY_REGISTRANT ? [process.env.PRIVATE_KEY_REGISTRANT] : [],
        }
    },
});
