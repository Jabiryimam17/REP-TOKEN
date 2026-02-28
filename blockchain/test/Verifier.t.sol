// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {VerifierSystem} from "../contracts/VerifierSystem.sol";
import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";
import {RPTAccessManager} from "../contracts/RPTAccessManager.sol";
import {EthioCoin} from "../contracts/EthioCoin.sol";
import {ReputationToken} from "../contracts/ReputationToken.sol";
import {Registry} from "../contracts/Registry.sol";
import {Treasury} from "../contracts/Treasury.sol";
contract VerifierTest is Test {
    VerifierSystem public verifier_system;
    RPTAccessManager public access_manager;
    ReputationToken public reputation_token;
    EthioCoin public ethio_coin;
    Registry public registry;
    address public coordinator = address(0x123);
    uint64 public subscription_id = 1;
    address public owner;
    Treasury public treasury;
    function setUp() public {
        owner = address(this);
        access_manager = new RPTAccessManager();
        registry = new Registry(address(access_manager));
        reputation_token = new ReputationToken(address(access_manager));
        ethio_coin = new EthioCoin();
        treasury = new Treasury(address(registry), address(access_manager));
        registry.set_ethiocoin(address(ethio_coin));
        registry.set_rpt(address(reputation_token));
        registry.set_treasury(address(treasury));
        registry.set_job_manager(address(0x456));
        registry.set_reward_vault(address(0x789));
        verifier_system = new VerifierSystem(coordinator, subscription_id, address(registry), address(access_manager));
        registry.set_verifier(address(verifier_system));
    }

    function test_tokens_address() public {
        assertEq(address(registry.ethiocoin()), address(ethio_coin));
        assertEq(address(registry.rpt()), address(reputation_token));

    }

    function test_only_owner_set_vrf() public {
        address new_coordinator = address(0x456);
        vm.startPrank(address(0x789)); // Simulate a call from a non-owner address
        vm.expectRevert();
        bytes32 key_hash = bytes32("keyhash");
        verifier_system.set_up_vrf(2, 100, key_hash, 100000);
        vm.stopPrank();
    }

    function test_set_vrf() public {
        vm.startPrank(owner);
        bytes32 key_hash = bytes32("keyhash");
        uint new_subscription_id = 2;
        uint16 new_request_confirmations = 100;
        uint32 new_callback_gas_limit = 100000;

        verifier_system.set_up_vrf(new_subscription_id, new_request_confirmations, key_hash, new_callback_gas_limit);
        assertEq(verifier_system.subscription_id(), new_subscription_id);
        assertEq(verifier_system.callback_gas_limit(), new_callback_gas_limit);
        assertEq(verifier_system.key_hash(), key_hash);
        assertEq(verifier_system.request_confirmations(), new_request_confirmations);
        vm.stopPrank();
    }

    function test_only_owner_add_level() public {
        vm.startPrank(address(0x789)); // Simulate a call from a non-owner address
        vm.expectRevert();
        uint amt=10**18;
        verifier_system.add_stack_level(amt);
        vm.stopPrank();
    }
    function test_fail_zero_amt_level() public {
        vm.startPrank(owner);
        uint amt = 0;
        vm.expectRevert();
        verifier_system.add_stack_level(amt);
        vm.stopPrank();
    }

    function test_fail_decreasing_amt_level() public {
        vm.startPrank(owner);
        uint amt1 = 1*10**18;
        uint amt2 = 5*10**17;
        verifier_system.add_stack_level(amt1);
        vm.expectRevert();
        verifier_system.add_stack_level(amt2);
        vm.stopPrank();
    }
    function test_only_admin_add_levels() public {
        vm.startPrank(address(0x789)); // Simulate a call from a non-admin address
        vm.expectRevert();
        uint[] memory amts = new uint[](3);
        amts[0] = 1*10**18;
        amts[1] = 2*10**18;
        amts[2] = 3*10**18;
        verifier_system.add_stack_levels(amts);
        vm.stopPrank();
    }
    function test_fail_empty_levels() public {
        vm.startPrank(owner);
        uint[] memory amts = new uint[](0);
        vm.expectRevert();
        verifier_system.add_stack_levels(amts);
        vm.stopPrank();
    }

    function test_fail_decreasing_levels() public {
        vm.startPrank(owner);
        uint[] memory amts = new uint[](5);
        amts[0] = 1*10**18;
        amts[1] = 5*10**18;
        amts[2] = 3*10**18;
        amts[3] = 4*10**18;
        amts[4] = 2*10**18;
        vm.expectRevert();
        verifier_system.add_stack_levels(amts);
        vm.stopPrank();
    }

    function test_add_levels() public {
        vm.startPrank(owner);
        uint[] memory amts = new uint[](7);
        amts[0] = 1*10**18;
        amts[1] = 3*10**18;
        amts[2] = 5*10**18;
        amts[3] = 7*10**18;
        amts[4] = 10*10**18;
        amts[5] = 15*10**18;
        amts[6] = 20*10**18;


        verifier_system.add_stack_levels(amts);
        assertEq(verifier_system.stack_levels(0), amts[0]);
        assertEq(verifier_system.stack_levels(1), amts[1]);
        assertEq(verifier_system.stack_levels(2), amts[2]);
        vm.stopPrank();
    }

    function test_only_owner_set_slash_bps() public {
        vm.startPrank(address(0x789)); // Simulate a call from a non-owner address
        vm.expectRevert();
        uint16 bps = 500;
        verifier_system.set_slash_bps(bps);
        vm.stopPrank();
    }

    function test_fail_outside_range_slash_bps() public {
        vm.startPrank(owner);
        uint16 bps = 10001; // 100% + 1 bps
        vm.expectRevert();
        verifier_system.set_slash_bps(bps);
        bps=0;
        vm.expectRevert();
        verifier_system.set_slash_bps(bps);
        vm.stopPrank();
    }

    function test_set_slash_bps() public {
        vm.startPrank(owner);
        uint16 bps = 500; // 5%
        verifier_system.set_slash_bps(bps);
        assertEq(verifier_system.slash_bps(), bps);
        vm.stopPrank();
    }

    function add_categories() public {
        vm.startPrank(owner);
        verifier_system.add_category("category1");
        verifier_system.add_category("category2");
        assertEq(verifier_system.categories(0), "category1");
        assertEq(verifier_system.categories(1), "category2");
        vm.stopPrank();
    }
    function test_only_owner_add_verifier() public {
        add_categories();
        vm.startPrank(address(0x789)); // Simulate a call from a non-owner address
        vm.expectRevert();
        uint16 category = 0;
        address verifier = address(0xabc);
        verifier_system.add_verifier(category, verifier);
        vm.stopPrank();
    }

    function test_fail_zero_address_verifier() public {
        add_categories();
        vm.startPrank(owner);
        uint16 category = 0;
        address verifier = address(0);
        vm.expectRevert("Null address not allowed");
        verifier_system.add_verifier(category, verifier);
        vm.stopPrank();
    }

    function test_fail_verified_verifier() public {
        add_categories();
        vm.startPrank(owner);
        uint16 category = 0;
        address verifier = address(0xabc);
        verifier_system.add_verifier(category, verifier);
        vm.expectRevert("already added");
        verifier_system.add_verifier(category, verifier);
        vm.stopPrank();
    }

    function test_fail_invalid_category_verifier() public {
        add_categories();
        vm.startPrank(owner);
        uint16 category = 5; // Invalid category index
        address verifier = address(0xabc);
        vm.expectRevert("invalid category");
        verifier_system.add_verifier(category, verifier);
        vm.stopPrank();
    }

    function test_add_verifier() public {
        add_categories();
        vm.startPrank(owner);
        uint16 category = 0;
        address verifier = address(0xabc);
        verifier_system.add_verifier(category, verifier);
        (bool verified, , , , , ,uint16 assigned_category, ,) = verifier_system.verifiers(verifier);
        assertTrue(verified);
        assertEq(assigned_category, category);
        vm.stopPrank();
    }

    function test_fail_zero_stake() public {
        add_categories();
        vm.startPrank(owner);
        uint16 category = 0;
        address verifier = address(0xabc);
        verifier_system.add_verifier(category, verifier);
        vm.stopPrank();
        vm.accesses(verifier);
        vm.expectRevert("zero stake");
        verifier_system.stake(0);
        vm.stopPrank();
    }
    function test_fail_unverified_verifier_stake() public {
        add_categories();
        uint16 category = 2;
        address verifier = address(0xabc);
        
        vm.startPrank(verifier);
        vm.expectRevert("not a verifier");
        uint stake_amount = 1*10**18;
        verifier_system.stake(stake_amount);
        vm.stopPrank();
    }
    function find_lower_bound(uint256 value, uint256[] memory arr) internal pure returns (uint8) {
        for (uint256 i = 0; i < arr.length; i++) {
            if (value <= arr[i]) return uint8(i);
        }
        return uint8(arr.length); // Return the last element if value is greater than all elements
    }

    function test_stake_update_unassigned() public returns (uint8) {
        add_categories();
        test_add_levels();
        uint16 category = 1;
        address verifier = address(0xabc);
        uint256 value = 9 * 10**18;
        vm.startPrank(owner);
        verifier_system.add_verifier(category, verifier);
        reputation_token.mint(verifier, value*10);
        vm.stopPrank();
        vm.startPrank(verifier);
        reputation_token.approve(address(verifier_system), value);
        verifier_system.stake(value);
        (, bool is_active, bool assigned, , , uint256 staked_amount, ,uint8 level, uint16 id) = verifier_system.verifiers(verifier);
        assertEq(staked_amount, value);
        uint8 exp_level=find_lower_bound(value, verifier_system.get_stack_levels());
        assertEq(level, exp_level);
        address expected_address = verifier_system.leveled_verifiers(category, level, id);
        assertEq(expected_address, verifier);
        assertEq(expected_address, verifier);
        assertTrue(assigned);
        assertTrue(is_active);
        return level;
    }

    function test_stake_update_assigned_same_level() public {

        uint8 be_level=test_stake_update_unassigned();
        address verifier=address(0xabc);
        uint256 value=100;
        vm.startPrank(verifier);
        reputation_token.approve(address(verifier_system), value);
        verifier_system.stake(value);
        (, bool is_active, bool assigned, , , uint256 staked_amount, ,uint8 level, uint16 id) = verifier_system.verifiers(verifier);
        assertEq(staked_amount, value+9*10**18);
        uint8 exp_level=find_lower_bound(value+9*10**18, verifier_system.get_stack_levels());
        assertEq(level, exp_level);
        assertEq(be_level, level);
        address expected_address = verifier_system.leveled_verifiers(1, level, id);
        assertEq(expected_address, verifier);
    }

    function test_stake_update_assigned_diff_level() public {
        uint8 be_level=test_stake_update_unassigned();
        address verifier=address(0xabc);
        uint256 value=10*10**18;
        vm.startPrank(verifier);
        reputation_token.approve(address(verifier_system), value);
        verifier_system.stake(value);
        (, bool is_active, bool assigned, , , uint256 staked_amount, ,uint8 level, uint16 id) = verifier_system.verifiers(verifier);
        assertEq(staked_amount, value+9*10**18);
        uint8 exp_level=find_lower_bound(value+9*10**18, verifier_system.get_stack_levels());
        assertEq(level, exp_level);
        assertGe(level, be_level);
        address expected_address = verifier_system.leveled_verifiers(1, level, id);
        assertEq(expected_address, verifier);
    }

    function test_fail_inactive_inactive_verifer() public {
        address verifier = address(0xabc);
        vm.startPrank(verifier);
        vm.expectRevert("not working or allowed");
        verifier_system.unstake();
        vm.stopPrank();
    }

    function test_inactive_verifier() public {
        test_stake_update_unassigned();
        address verifier = address(0xabc);
        uint before_balance = reputation_token.balanceOf(verifier);
        (, , , , ,uint before_stake ,uint16 before_cat ,uint8 before_level,) = verifier_system.verifiers(verifier);
        uint treasury_before_balance = reputation_token.balanceOf(address(treasury));
        uint before_len=verifier_system.get_cat_level_verifiers(before_cat, before_level).length;
        vm.startPrank(verifier);
        verifier_system.unstake();
        (, bool is_active, bool assigned , , , uint256 staked_amount, ,uint8 level, uint16 id) = verifier_system.verifiers(verifier);
        uint after_balance = reputation_token.balanceOf(verifier);
        uint after_len=verifier_system.get_cat_level_verifiers(before_cat, before_level).length;
        assertFalse(is_active);
        assertEq(staked_amount, 0);
        assertEq(after_balance, before_balance+9*10**18);
        assertFalse(assigned);
        assertLt(after_len, before_len);
        vm.stopPrank();
    }

    function stake_multiple() public {
        add_categories();
        test_add_levels();
        vm.startPrank(owner);

        address verifier_f = address(0xabc);
        address verifier_s = address(0xdef);
        reputation_token.mint(verifier_f, 20*10**18);
        reputation_token.mint(verifier_s, 20*10**18);
        uint256 value_f = 12*10**18;
        uint256 value_s = 14*10**18;
        verifier_system.add_verifier(1, verifier_f);
        verifier_system.add_verifier(1, verifier_s);
        vm.stopPrank();
        vm.startPrank(verifier_f);
        reputation_token.approve(address(verifier_system), value_f);
        verifier_system.stake(value_f);
        vm.stopPrank();
        vm.startPrank(verifier_s);
        reputation_token.approve(address(verifier_system), value_s);
        verifier_system.stake(value_s);
        vm.stopPrank();
    }
    function test_unstake_multiple() public {
        stake_multiple();
        address verifier_f = address(0xabc);
        address verifier_s = address(0xdef);
        (,,,,,,,,uint16 before_id) = verifier_system.verifiers(verifier_s);
        vm.startPrank(verifier_f);
        verifier_system.unstake();
        vm.stopPrank();
        (, bool is_active_s, bool assigned_s , , , uint256 staked_amount_s, ,uint8 level_s, uint16 id_s) = verifier_system.verifiers(verifier_s);

        assertTrue(is_active_s);
        assertTrue(assigned_s);
        assertEq(staked_amount_s, 14*10**18);
        assertLt(id_s, before_id);
    }

    function test_fail_transfer_null_address() public {
        test_add_verifier();
        address verifier = address(0xabc);
        vm.startPrank(verifier);
        vm.expectRevert("Null address not allowed");
        verifier_system.transfer_address(address(0));
        vm.stopPrank();
    }
    function test_fail_transfer_verified_address() public {
        test_add_verifier();
        address verifier = address(0xabc);
        address new_address = address(0xdef);
        vm.startPrank(owner);
        verifier_system.add_verifier(1, new_address);
        vm.stopPrank();
        vm.startPrank(verifier);
        vm.expectRevert("address already used");
        verifier_system.transfer_address(new_address);
        vm.stopPrank(); 
    }
    function test_transfer_address() public {
        test_add_verifier();
        address verifier = address(0xabc);
        address new_address = address(0xdef);

        vm.startPrank(verifier);
        // vm.expectEmit();
        // emit VerifierSystem.address_transferred(verifier, new_address);
        verifier_system.transfer_address(new_address);
        vm.stopPrank();
        (bool verified, bool is_active, bool assigned, , , uint256 staked_amount, ,uint8 level, uint16 id) = verifier_system.verifiers(verifier);
        assertFalse(verified);
        assertFalse(is_active);
        assertFalse(assigned);
        assertEq(staked_amount, 0);
        (bool new_verified, bool new_is_active, bool new_assigned, , , uint256 new_staked_amount, ,uint8 new_level, uint16 new_id) = verifier_system.verifiers(new_address);
        assertTrue(new_verified);
        assertEq(new_staked_amount, 0);
        assertEq(new_level, level);
         assertEq(new_id, id);
         assertFalse(new_assigned);
         assertFalse(new_is_active);


    }
}