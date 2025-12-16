// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RewardVault is ReentrancyGuard{
    using SafeERC20 for IERC20;
    IERC20 public lptoken;
    IERC20 public reward_token;
    uint256 public reward_rate;
    uint256 public last_reward_time;
    uint256 public acc_reward_per_share;
    uint256 public total_staked;

    struct UserInfo {
        uint256 amount;
        uint256 reward_debt;
    }

    mapping(address => UserInfo) public user_infos;

    constructor(IERC20 _lptoken, IERC20 _reward_token, uint256 _reward_rate) {
        lptoken = _lptoken;
        reward_token = _reward_token;
        reward_rate = _reward_rate;
        last_reward_time = block.timestamp;
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
        UserInfo storage user = user_infos[msg.sender];
        update_pool();
        uint256 pending = user.amount * acc_reward_per_share / 1e12 - user.reward_debt;
        user.amount += amount;
        total_staked += amount;
        user.reward_debt = user.amount * acc_reward_per_share / 1e12;
        if (pending > 0) reward_token.safeTransfer(msg.sender, pending);
        lptoken.safeTransferFrom(msg.sender, address(this), amount);

    }

    function withdraw(uint256 amount) public nonReentrant {
        require(amount > 0, "Can't withdraw empty");
        UserInfo storage user=user_infos[msg.sender];
        require(user.amount >= amount, "Not enough staked");
        update_pool();

        uint256 pending=user.amount * acc_reward_per_share/1e12 - user.reward_debt;
        
        user.amount-=amount;
        user.reward_debt=user.amount * acc_reward_per_share/1e12;
        total_staked -= amount;
        lptoken.safeTransfer(msg.sender, amount);
        if (pending > 0) reward_token.safeTransfer(msg.sender, pending);
    }

}
