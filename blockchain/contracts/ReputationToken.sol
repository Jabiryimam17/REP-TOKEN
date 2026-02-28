// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IRegistry} from "./Registry.sol";

contract ReputationToken is ERC20,AccessManaged {
    constructor(address _access_manager) ERC20("ReputationToken", "RPT")  AccessManaged(_access_manager) {
         _mint(msg.sender, 1000000 * 10 ** decimals()); // Mint initial supply to the deployer
    }

    function mint(address to, uint256 amount) public restricted {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public restricted {
        _burn(from, amount);
    }
}
