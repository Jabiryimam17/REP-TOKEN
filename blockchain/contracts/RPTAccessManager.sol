// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;
import {AccessManager} from "@openzeppelin/contracts/access/manager/AccessManager.sol";
contract RPTAccessManager is AccessManager {
    constructor() AccessManager(msg.sender) {
    }
}
