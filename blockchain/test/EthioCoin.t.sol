// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import {EthioCoin} from "../contracts/EthioCoin.sol";
import {Test} from "forge-std/src/Test.sol";

contract EthioCoinTest is Test {
    EthioCoin ethiocoin;
    address user_1=address(1);
    address user_2=address(2);
    address user_3=address(3);
    function setUp() public {
        vm.prank(user_1);
        ethiocoin = new EthioCoin();
    }

    function test_initial_supply() public view {
        uint expected_supply=1_000_000_000 * 10 **ethiocoin.decimals();
        require(ethiocoin.totalSupply()==expected_supply, "not appropriate amount");
    }

    function test_owner() view public {
        require(ethiocoin.owner()==user_1);
        require(ethiocoin.balanceOf(user_1)==ethiocoin.totalSupply());
    }

    function test_transfer() public {
        vm.startPrank(user_1);
//        log(/(ethiocoin.balanceOf(user_1)));
        ethiocoin.transfer(user_2, 1*10**ethiocoin.decimals());
        require(ethiocoin.balanceOf(user_2)==1*10**ethiocoin.decimals());
        vm.stopPrank();
    }
    function test_decimals() public view {
        require(ethiocoin.decimals()==18);
    }

    function test_fail_direct_transfer() public {
        vm.expectRevert();
        vm.prank(user_2);
        ethiocoin.transfer(user_3, 100);
    }

    function test_fail_allowance_transfer() public {
        vm.prank(user_1);
        ethiocoin.approve(user_2, 1000);
        vm.expectRevert();
        vm.prank(user_2);
        ethiocoin.transferFrom(user_1, user_2, 10000);
    }

    function test_allowance_deeply() public {
        vm.startPrank(user_1);
        ethiocoin.approve(user_2, 10000);
        require(ethiocoin.allowance(user_1, user_2)==10000);
        ethiocoin.approve(user_2, ethiocoin.allowance(user_1, user_2)+1);
        require(ethiocoin.allowance(user_1, user_2)==10001);
        vm.expectRevert();
        ethiocoin.transferFrom(user_1, user_2, 1000);
        vm.stopPrank();
        vm.prank(user_2);
        ethiocoin.transferFrom(user_1, user_2, 1);
        require(ethiocoin.allowance(user_1, user_2)==10000);

    }
    function test_allowance_total_supply() public {
        uint transfer_amount=10**(ethiocoin.decimals());
        uint approve_amount=10**(ethiocoin.decimals()-1);
        vm.prank(user_1);
        ethiocoin.transfer(user_2, transfer_amount);

        vm.prank(user_2);
        ethiocoin.approve(user_3, approve_amount);

        vm.prank(user_3);
        ethiocoin.transferFrom(user_2, user_3, approve_amount);

        require(ethiocoin.balanceOf(user_3)==approve_amount,"Not transferred successfully");

        require(ethiocoin.totalSupply()==1_000_000_000 * 10 ** ethiocoin.decimals());

    }
}
