// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.20;
import {ReputationToken} from "../contracts/ReputationToken.sol";
import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {AccessManager} from "@openzeppelin/contracts/access/manager/AccessManager.sol";

contract ReputationTokenTest is Test {

    ReputationToken rpt;
    address deployer;
    address treasure =address(1);
    address user_2=address(2);
    address user_3=address(3);
    AccessManager public access_manager;

    
    function setUp() public {
        deployer=address(this);
        access_manager = new AccessManager(deployer);
        rpt = new ReputationToken(treasure, address(access_manager));
    }

    function test_initial_supply() public view {
        uint expected_supply=1e12 *10** rpt.decimals();
        require(rpt.totalSupply()==expected_supply, "not appropriate amount");
    }

    

    function test_transfer() public {
        vm.startPrank(treasure);
//        log(/(ethiocoin.balanceOf(user_1)));
        rpt.transfer(user_2, 1*10** rpt.decimals());
        require(rpt.balanceOf(user_2)==1*10** rpt.decimals());
        vm.stopPrank();
    }
    function test_decimals() public view {
        require(rpt.decimals()==18);
    }

    function test_fail_direct_transfer() public {
        vm.expectRevert();
        vm.prank(user_2);
        rpt.transfer(user_3, 100);
    }

    function test_fail_allowance_transfer() public {
        vm.prank(treasure);
        rpt.approve(user_2, 1000);
        vm.expectRevert();
        vm.prank(user_2);
        rpt.transferFrom(treasure, user_2, 10000);
    }

    function test_allowance_deeply() public {
        vm.startPrank(treasure);
        rpt.approve(user_2, 10000);
        require(rpt.allowance(treasure, user_2)==10000);
        rpt.approve(user_2, rpt.allowance(treasure, user_2)+1);
        require(rpt.allowance(treasure, user_2)==10001);
        vm.expectRevert();
        rpt.transferFrom(treasure, user_2, 1000);
        vm.stopPrank();
        vm.prank(user_2);
        rpt.transferFrom(treasure, user_2, 1);
        require(rpt.allowance(treasure, user_2)==10000);

    }

    function test_fail_to_approve_to_0() public {

        vm.prank(treasure);
        vm.expectRevert();
        rpt.approve(address(0), 1000);
    }

    function test_allowance_total_supply() public {
        uint transfer_amount=10**(rpt.decimals());
        uint approve_amount=10**(rpt.decimals()-1);
        vm.prank(treasure);
        rpt.transfer(user_2, transfer_amount);

        vm.prank(user_2);
        rpt.approve(user_3, approve_amount);

        vm.prank(user_3);
        rpt.transferFrom(user_2, user_3, approve_amount);

        require(rpt.balanceOf(user_3)==approve_amount,"Not transferred successfully");

        require(rpt.totalSupply()==1e12*10**(rpt.decimals()));
    }

    function test_treasure_balance() public view {
        require(rpt.balanceOf(treasure)==1e12*10**rpt.decimals());
        require(rpt.balanceOf(treasure)==rpt.totalSupply());
    }

    function test_mint_only_owner() public {

        vm.prank(deployer);
        rpt.mint(user_2, 1000);
        vm.expectRevert();
        vm.prank(user_2);
        rpt.mint(treasure, 1000);
    }
    function test_mint() public {

        vm.startPrank(deployer);
        uint prev_balance=rpt.balanceOf(treasure);
        uint prev_total_supply=rpt.totalSupply();
        rpt.mint(treasure, 10**10);
        require(rpt.balanceOf(treasure)==prev_balance+10**10);
        require(rpt.totalSupply()==prev_total_supply+10**10);
        vm.stopPrank();
    }

    function test_fail_mint_to_0() public {

        vm.prank(deployer);
        vm.expectRevert();
        rpt.mint(address(0), 10);
    }

    function test_burn_only_owner () public {

        vm.prank(deployer);
        rpt.burn(treasure, 10**10);
        vm.expectRevert();
        vm.prank(user_2);
        rpt.burn(treasure, 10**10);
    }

    function test_burn() public {

        vm.startPrank(deployer);
        uint prev_balance=rpt.balanceOf(treasure);
        uint prev_total_supply=rpt.totalSupply();
        rpt.burn(treasure,10**10);
        require(rpt.balanceOf(treasure)==prev_balance-10**10);
        require(rpt.totalSupply()==prev_total_supply-10**10);
        vm.stopPrank();
    }

    function test_can_t_burn_more_balance() public {

        vm.startPrank(deployer);
        rpt.mint(user_2, 10000);
        vm.expectRevert();
        rpt.burn(user_2, 100000);
        vm.stopPrank();
    }
    function test_fail_burn_to_0() public {

        vm.startPrank(deployer);
        vm.expectRevert();
        rpt.burn(address(0), 1000);
        vm.stopPrank();
    }

    // function test_access_control_owner()  public {

    //     vm.startPrank(user_2);
    //     vm.expectRevert();
    //     rpt.transferOwnership(user_3);
    //     vm.expectRevert();
    //     rpt.renounceOwnership();
    //     vm.stopPrank();
    // }
    // function test_transfer_ownership() public {

    //     vm.startPrank(deployer);
    //     address new_owner=address(999);
    //     rpt.transferOwnership(new_owner);
    //     require(rpt.owner()==new_owner);
    //     vm.stopPrank();
    // }
    // function test_renounce_ownership() public {

    //     vm.prank(deployer);
    //     address owner=rpt.owner();
    //     rpt.renounceOwnership();
    //     require(rpt.owner()!=owner);
    //     require(rpt.owner()==address(0));
    // }






}