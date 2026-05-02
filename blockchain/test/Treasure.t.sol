// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import  "../contracts/Treasury.sol";
import "forge-std/src/Test.sol";
import "forge-std/src/console.sol";
import {EthioCoin} from "../contracts/EthioCoin.sol";
import {ReputationToken} from  "../contracts/ReputationToken.sol";
import {RewardVault} from "../contracts/RewardVault.sol";
import {AccessManager} from "@openzeppelin/contracts/access/manager/AccessManager.sol";
import {Registry} from "../contracts/Registry.sol";
contract TreasureTest is Test {
    Registry public registry;
    EthioCoin public eth;
    EthioCoin public lptoken;
    ReputationToken public rpt;
    Treasury public treasure;
    RewardVault public reward_vault;
    address public owner=address(1);
    address public f_user=address(2);
    address public l_user=address(3);
    AccessManager public access_manager;
    function setUp() public {
        vm.startPrank(owner);
        lptoken=new EthioCoin();
        eth =new EthioCoin();
        access_manager = new AccessManager(owner);
        registry=new Registry(address(access_manager));
        rpt =new ReputationToken(address(access_manager));
        reward_vault=new RewardVault(address(registry), address(access_manager), 317*1e3);
        registry.set_reward_vault(address(reward_vault));
        registry.set_rpt(address(rpt));
        registry.set_ethiocoin(address(eth));
        registry.set_pool(address(lptoken));
        treasure=new Treasury(address(registry), address(access_manager));
        eth.transfer(address(treasure), 1e19);
        rpt.transfer(address(treasure), 1e20);

        vm.stopPrank();
    }




    function test_balances() public {

        assertEq(treasure.get_balance_stable_coin(), 1e19);
    }



    // PHASE 2: TESTING ALLOCATION AND DEALLOCATION
    function test_owner_only_allocate() public {
        vm.prank(l_user);
        vm.expectRevert();
        treasure.allocate_stable_coin(f_user, 1e8);
        vm.prank(owner);
        treasure.allocate_stable_coin(f_user, 1e8);
        assertEq(treasure.allocated_stable_coin(f_user), 1e8);
    }
    function test_allocate_fail_zero_address() public {
        vm.prank(owner);
        vm.expectRevert(NullAddress.selector);
        treasure.allocate_stable_coin(address(0), 1e8);
    }

    function test_allocate_fail_excess_amount() public {
        uint prev_balance=eth.balanceOf(address(treasure));
        uint prev_locked_stable_coin=treasure.locked_stable_coin();
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                InsufficientBalance.selector,
                prev_balance-prev_locked_stable_coin,   // actual balance available for allocation
                prev_balance-prev_locked_stable_coin+1    // requested
            )
        );
        treasure.allocate_stable_coin(f_user, prev_balance-prev_locked_stable_coin+1);
    }

    function test_allocate_mechanics_only_one() public {
        uint prev_locked_stable_coin=treasure.locked_stable_coin();
        uint prev_allocated =treasure.allocated_stable_coin(f_user);
        vm.prank(owner);
        treasure.allocate_stable_coin(f_user, 1e8);
        assertEq(treasure.allocated_stable_coin(f_user),prev_allocated+1e8);
        assertEq(treasure.locked_stable_coin(), prev_locked_stable_coin+1e8);
    }

    function test_allocate_mechanics_two_person() public {
        test_allocate_mechanics_only_one();
        uint prev_locked_stable_coin=treasure.locked_stable_coin();
        vm.prank(owner);
        treasure.allocate_stable_coin(l_user, 1e8);
        assertEq(treasure.allocated_stable_coin(l_user), 1e8);
        assertEq(treasure.allocated_stable_coin(l_user)+treasure.allocated_stable_coin(f_user), 2e8);//ensuring data per address is accounted
        assertEq(treasure.locked_stable_coin(), prev_locked_stable_coin+1e8);
    }


    function test_deallocate_only_owner() public {
        test_allocate_mechanics_only_one();
        vm.prank(l_user);
        vm.expectRevert();
        treasure.deallocate_stable_coin(f_user, 1e8);
        vm.prank(owner);
        treasure.deallocate_stable_coin(f_user, 1e8);
    }

    function test_deallocate_fail_zero_address() public {
        test_allocate_mechanics_only_one();
        vm.prank(owner);
        vm.expectRevert(NullAddress.selector);
        treasure.deallocate_stable_coin(address(0), 1e7);
    }

    function test_deallocate_fail_excess_amount() public {
        test_allocate_mechanics_only_one();
        uint prev_allocated=treasure.allocated_stable_coin(f_user);
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                InsufficientLockedBalance.selector,
                prev_allocated,   // actual balance
                prev_allocated+1   // requested
            )
        );
        treasure.deallocate_stable_coin(f_user, prev_allocated+1);
    }

    function test_deallocate_mechanics_only_one() public {
        test_allocate_mechanics_only_one();
        uint prev_allocated=treasure.allocated_stable_coin(f_user);
        uint prev_locked_stable_coin=treasure.locked_stable_coin();
        vm.prank(owner);
        treasure.deallocate_stable_coin(f_user, 1e7);
        assertEq(treasure.allocated_stable_coin(f_user),prev_allocated-1e7);
        assertEq(treasure.locked_stable_coin(), prev_locked_stable_coin-1e7);
    }

    function test_deallocate_mechanics_two_person() public {
        test_allocate_mechanics_two_person();
        uint prev_locked=treasure.locked_stable_coin();
        uint prev_amount_l=treasure.allocated_stable_coin(l_user);
        uint prev_amount_f=treasure.allocated_stable_coin(f_user);
        vm.prank(owner);
        treasure.deallocate_stable_coin(f_user, 1e7);
        assertEq(treasure.allocated_stable_coin(l_user), prev_amount_l); // untouched
        assertEq(treasure.allocated_stable_coin(f_user), prev_amount_f-1e7);
        assertEq(treasure.locked_stable_coin(), prev_locked-1e7);
    }

    function test_transfer_allocated_only_owner( ) public {
        test_allocate_mechanics_only_one();
        vm.prank(f_user);
        vm.expectRevert();
        treasure.transfer_allocated_stable_coin(f_user, 1);
        vm.prank(owner);
        treasure.transfer_allocated_stable_coin(f_user, 1e7);
    }

    function test_transfer_allocated_fail_zero_transfer() public {
        test_allocate_mechanics_only_one();
        vm.prank(owner);
        vm.expectRevert(ZeroAmount.selector);
        treasure.transfer_allocated_stable_coin(f_user, 0);
    }

    function test_transfer_allocated_fail_zero_address() public {
        test_allocate_mechanics_only_one();
        vm.prank(owner);
        vm.expectRevert(NullAddress.selector);
        treasure.transfer_allocated_stable_coin(address(0), 1e7);
    }

    function test_transfer_allocated_fail_excess() public {
        test_allocate_mechanics_only_one();
        uint prev_allocated=treasure.allocated_stable_coin(f_user);
        require(prev_allocated > 0);
        vm.prank(owner);
        vm.expectRevert();
        treasure.transfer_allocated_stable_coin(f_user, prev_allocated+1);
    }

    function test_transfer_allocated_one_person() public {
        test_allocate_mechanics_only_one();
        uint prev_allocated=treasure.allocated_stable_coin(f_user);
        uint prev_balance=eth.balanceOf(f_user);
        uint prev_locked_stable_coin=treasure.locked_stable_coin();
        vm.prank(owner);
        treasure.transfer_allocated_stable_coin(f_user, 1e7);
        assertEq(treasure.allocated_stable_coin(f_user), prev_allocated-1e7);
        assertEq(treasure.locked_stable_coin(), prev_locked_stable_coin-1e7);
        assertEq(eth.balanceOf(f_user), prev_balance+1e7);

    }

    function test_transfer_allocated_two_person() public {
        test_allocate_mechanics_two_person();
        uint prev_allocated_f=treasure.allocated_stable_coin(f_user);
        uint prev_allocated_l=treasure.allocated_stable_coin(l_user);
        uint prev_balance_f=eth.balanceOf(f_user);
        uint prev_balance_l=eth.balanceOf(l_user);
        uint prev_locked_stable_coin=treasure.locked_stable_coin();
        vm.prank(owner);
        treasure.transfer_allocated_stable_coin(f_user, 1e7);
        assertEq(treasure.allocated_stable_coin(f_user), prev_allocated_f-1e7);
        assertEq(treasure.allocated_stable_coin(l_user), prev_allocated_l);
        assertEq(treasure.locked_stable_coin(), prev_locked_stable_coin-1e7);
        assertEq(eth.balanceOf(f_user), prev_balance_f+1e7);
        assertEq(eth.balanceOf(l_user), prev_balance_l);
    }


    function test_withdraw_only_owner() public {
        vm.prank(f_user);
        vm.expectRevert();
        treasure.withdraw_tokens(address(reward_vault), 1e8);
        vm.prank(owner);
        treasure.withdraw_tokens(address(reward_vault), 1e8);
    }

    function test_withdraw_fail_excess() public {
        uint prev_balance=rpt.balanceOf(address(treasure));
        vm.prank(owner);
        vm.expectRevert();
        treasure.withdraw_tokens(address(reward_vault), prev_balance+1);
    }

    function test_withdraw_fail_zero_transfer() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAmount.selector);
        treasure.withdraw_tokens(address(reward_vault), 0);
    }

    function test_withdraw_fail_zero_address() public {
        vm.prank(owner);
        vm.expectRevert(NullAddress.selector);
        treasure.withdraw_tokens(address(0), 1e7);
    }

    function test_withdraw_mechanics() public {
        uint prev_balance=rpt.balanceOf(address(reward_vault));
        vm.prank(owner);
        treasure.withdraw_tokens(address(reward_vault), 1e7);
        assertEq(rpt.balanceOf(address(reward_vault)), prev_balance+1e7);
    }

    function test_fill_reward_vault_only_owner() public {
        vm.prank(f_user);
        vm.expectRevert();
        treasure.fill_reward_vault(1e7);
        vm.prank(owner);
        treasure.fill_reward_vault(1e7);
    }

    

    function test_fill_reward_vault_fail_excess() public {
        uint prev_balance=rpt.balanceOf(address(treasure));
        vm.prank(owner);
        vm.expectRevert();
        treasure.fill_reward_vault(prev_balance+1);
    }

    function test_fill_reward_vault_mechanics() public {
        uint prev_balance=rpt.balanceOf(address(reward_vault));
        vm.prank(owner);
        treasure.fill_reward_vault(1e7);
        assertEq(rpt.balanceOf(address(reward_vault)), prev_balance+1e7);
    }






}