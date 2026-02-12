// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IRegistry} from "./Registry.sol";
contract RewardVault is ReentrancyGuard, AccessManaged {
    using SafeERC20 for IERC20;
    uint256 public reward_rate;
    uint256 public last_reward_time;
    uint256 public acc_reward_per_share;
    uint256 public total_staked;
    IRegistry public registry;

    struct liqudator {
        uint256 amount;
        uint256 reward_debt;
    }

    mapping(address => liqudator) public liqudators;

    constructor(address _registry,address _access_manager, uint256 _reward_rate)  AccessManaged(_access_manager) {
        registry = IRegistry(_registry);
        reward_rate = _reward_rate;
        last_reward_time = block.timestamp;
    }
    function set_reward_rate(uint256 _reward_rate) public restricted {
        update_pool();
        reward_rate = _reward_rate;
    }

    function _reward_token() internal view returns (IERC20) {
        return IERC20(registry.get_rpt());
    }

    function _lp_token() internal view returns (IERC20) {
        return IERC20(registry.get_lp_token());
    }
    function update_pool() internal {
        if (total_staked==0) {
            last_reward_time=block.timestamp;
            return;
        }
        uint time_elapsed = block.timestamp - last_reward_time;
        uint reward= time_elapsed*reward_rate;
        acc_reward_per_share += reward * 1e12 / total_staked;
        last_reward_time = block.timestamp;
    }

    function stake(uint256 amount) public nonReentrant {
        require(amount > 0, "Cannot stake 0");
        liqudator storage user = liqudators[msg.sender];
        update_pool();
        uint256 pending = user.amount * acc_reward_per_share / 1e12 - user.reward_debt;
        user.amount += amount;
        total_staked += amount;
        user.reward_debt = user.amount * acc_reward_per_share / 1e12;
        if (pending > 0) _reward_token().safeTransfer(msg.sender, pending);
        _lp_token().safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public nonReentrant {
        require(amount > 0, "Can't withdraw empty");
        liqudator storage user= liqudators[msg.sender];
        require(user.amount >= amount, "Not enough staked");
        update_pool();

        uint256 pending=user.amount * acc_reward_per_share/1e12 - user.reward_debt;
        
        user.amount-=amount;
        user.reward_debt=user.amount * acc_reward_per_share/1e12;
        total_staked -= amount;
        _lp_token().safeTransfer(msg.sender, amount);
        if (pending > 0) _reward_token().safeTransfer(msg.sender, pending);
    }

}
