// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Uniswap.t
 * @dev 
 */
import {UniswapV2Factory} from "../contracts/UniswapV2Factory.sol";
import {UniswapV2Router02} from "../contracts/UniswapV2Router02.sol";
import {WETH9} from "../contracts/WETH9.sol";
import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {EthioCoin} from "../contracts/EthioCoin.sol";
import {ReputationToken} from "../contracts/ReputationToken.sol";

contract UniswapTest is Test {
    UniswapV2Factory public factory;
    UniswapV2Router02 public router;
    WETH9 public weth;
    EthioCoin public ethioCoin;
    ReputationToken public reputationToken;
    address public owner;

    function setUp() public {
        owner = address(this);
        // Deploy WETH
        weth = new WETH9();

        // Deploy Uniswap Factory
        factory = new UniswapV2Factory(address(this));

        // Deploy Uniswap Router
        router = new UniswapV2Router02(address(factory), address(weth));

        // Deploy test tokens
        ethioCoin = new EthioCoin();
        reputationToken = new ReputationToken();

    }

    function test_create_pair() public {
        // Create a pair for EthioCoin and ReputationToken
        address pair = factory.createPair(address(ethioCoin), address(reputationToken));
        console.log("Pair created at:", pair);
    }
}
