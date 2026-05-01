//SPDX-License-Identifier:UNLICENSED
pragma solidity ^0.8.20;
import {RewardVault} from "../contracts/RewardVault.sol";
import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {EthioCoin} from "../contracts/EthioCoin.sol";
import {ReputationToken} from "../contracts/ReputationToken.sol";
import {Registry} from "../contracts/Registry.sol";
import {AccessManager} from "@openzeppelin/contracts/access/manager/AccessManager.sol";

contract RewardVaultTest is Test {
    address public admin;
    EthioCoin public lptoken;
    address public lp_owner;
    ReputationToken public reward_token;
    address public treasure=address(1);
    address user=address(2);
    RewardVault public reward_vault;
    AccessManager public access_manager;
    Registry public registry;
    uint public reward_rate;
    function setUp() public {
        admin=address(this);
        reward_rate = 317*10**3;
        lptoken =new EthioCoin();
        lp_owner = lptoken.owner();
        access_manager = new AccessManager(admin);
        registry = new Registry(address(access_manager));
        reward_token = new ReputationToken(address(access_manager));
        registry.set_rpt(address(reward_token));
        registry.set_pool(address(lptoken));
        reward_vault=new RewardVault(address(registry), address(access_manager), reward_rate);
    }

    // we assume for all tests that reward_token and lptoken works as expected
    function test_last_reward_time_stamp() public view {
        require(block.timestamp == reward_vault.last_reward_time());
    }
    function test_stake_fail_zero_stake() public {
        vm.expectRevert();
        reward_vault.stake(0);
    }

    function test_update_pool() public {
        vm.prank(admin);
        reward_token.transfer(address(reward_vault), 10**18);
        vm.prank(lp_owner);
        lptoken.transfer(user, 10**9);
        vm.startPrank(user);
        lptoken.approve(address(reward_vault), 10**9);
        reward_vault.stake(10**8);
        uint addition_time=1000;
        vm.warp(block.timestamp+addition_time);
        uint prev_total_stake=reward_vault.total_staked();
        reward_vault.stake(10**8);
        require(reward_vault.acc_reward_per_share()==addition_time*(reward_vault.reward_rate())*10**12/prev_total_stake);// time_diff*reward_rate)1e12/total_stake // tesing update pool
        require(reward_token.balanceOf(user)==317*1e6);
        vm.stopPrank();
    }

    function test_stake_one_person() public {
        test_update_pool();
        (uint prev_amount, uint prev_reward_debt)=reward_vault.liqudators(user);
        vm.warp(block.timestamp+1000);
        uint prev_balance=reward_token.balanceOf(user);

        vm.prank(user);
        reward_vault.stake(10**8);
        uint arps =reward_vault.acc_reward_per_share();
        require(reward_token.balanceOf(user)==prev_balance+prev_amount* arps /1e12-prev_reward_debt);
        (uint amount, uint reward_debt)=reward_vault.liqudators(user);
        require(reward_debt==amount * arps/1e12);
    }

    function test_stake_two_person() public {
        test_update_pool();
        address former=user;
        address later=address(3);
        vm.prank(lp_owner);
        lptoken.transfer(later, 1e18);
        uint start_total=reward_vault.total_staked();
        require(start_total==2e8);
        vm.warp(block.timestamp+1000);
        vm.startPrank(later);
        lptoken.approve(address(reward_vault), 1e11);
        reward_vault.stake(1e8);
        require(reward_vault.acc_reward_per_share()==1585*1e9+317*1e10);// time_diff*reward_rate)1e12/total_stake
        (, uint prev_reward_debt)=reward_vault.liqudators(later);
        require(prev_reward_debt ==1e8*reward_vault.acc_reward_per_share()/1e12);
        vm.stopPrank();
        vm.warp(block.timestamp+1000);
        vm.prank(former);
        reward_vault.stake(1e8);
        vm.warp(block.timestamp+1000);
        vm.prank(later);
        reward_vault.stake(1e8);
        require(reward_token.balanceOf(later)==1e8*reward_vault.acc_reward_per_share()/1e12- prev_reward_debt); // at higher level
        require(reward_token.balanceOf(later)==1e8*(1000)*reward_vault.reward_rate()/(3e8)+1e8*(1000)*reward_vault.reward_rate()/(4e8)); // at lower level/at each interval confiriming reward debt is working fine

    }

    function test_withdraw_fail_zero_withdraw() public {
        vm.expectRevert();
        reward_vault.withdraw(0);
    }
    function test_withdraw_excess_amount() public {
        test_update_pool();
        vm.startPrank(user);
        (uint amount,) = reward_vault.liqudators(user);
        vm.expectRevert();
        reward_vault.withdraw(amount+1);
        vm.stopPrank();
    }

    function test_withdraw_transfer() public {
        test_update_pool();
        uint prev_balance=reward_token.balanceOf(user);
        (, uint reward_debt) = reward_vault.liqudators(user);
        uint last_time=reward_vault.last_reward_time();
        vm.warp(last_time+1000);
        vm.prank(user);
        reward_vault.withdraw(1e8);
        require(reward_token.balanceOf(user)==prev_balance+2e8*reward_vault.acc_reward_per_share()/1e12-reward_debt);
        require(reward_token.balanceOf(user)==prev_balance+2e8*1000*reward_vault.reward_rate()/2e8);
    }

    function  test_withdraw_amount_reward_debt_total_stake() public {
        test_update_pool();
        vm.prank(user);
        reward_vault.withdraw(1e8);
        (uint amount, uint reward_debt)=reward_vault.liqudators(user);
        require(amount == 1e8);
        require(reward_debt == 1e8*reward_vault.acc_reward_per_share()/1e12);
        require(reward_vault.total_staked()==1e8);
    }
}
