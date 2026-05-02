// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/src/Test.sol";
import "forge-std/src/console.sol";
import "../contracts/VerifierSystem.sol";
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
    VRFCoordinatorV2_5Mock public vrf_coordinator;
    uint256 public subscription_id = 1;
    bytes32 public key_hash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    address public owner;
    address public vrf_wrapper = address(0x123);
    address public link_token = address(0x456);
    Treasury public treasury;

    function setUp() public {
        owner = address(this);
        access_manager = new RPTAccessManager();
        registry = new Registry(address(access_manager));
        reputation_token = new ReputationToken(address(access_manager));
        ethio_coin = new EthioCoin();
        treasury = new Treasury(address(registry), address(access_manager));

        access_manager.grantRole(0, owner, 0); // Grant ADMIN role to owner

        registry.set_ethiocoin(address(ethio_coin));
        registry.set_rpt(address(reputation_token));
        registry.set_treasury(address(treasury));
        registry.set_job_manager(address(this)); // For tests, let this contract be job manager
        registry.set_reward_vault(address(0x789));

        uint96 base_fee = 0.1 ether;
        uint96 gas_price_link = 1e9;
        int wei_link = 1e18;
        uint256 amount_fund = 100 ether;

        vrf_coordinator = new VRFCoordinatorV2_5Mock(
            base_fee,
            gas_price_link,
            wei_link
        );

        subscription_id = vrf_coordinator.createSubscription();
        vrf_coordinator.fundSubscription(subscription_id, amount_fund);

        // ---------- Deploy Verifier ----------
        verifier_system = new VerifierSystem(
            address(vrf_coordinator),
            subscription_id,
            vrf_wrapper,
            link_token,
            address(registry),
            address(access_manager)
        );

        vrf_coordinator.addConsumer(
            subscription_id,
            address(verifier_system)
        );
        registry.set_verifier(address(verifier_system));

        verifier_system.set_deadlines(24 hours, 48 hours);
    }

    function add_categories() public {
        verifier_system.add_category("category1");
        verifier_system.add_category("category2");
    }

    function add_levels() internal {
        uint[] memory amts = new uint[](4);
        amts[0] = 10 * 10 ** 18;
        amts[1] = 20 * 10 ** 18;
        amts[2] = 30 * 10 ** 18;
        amts[3] = 40 * 10 ** 18;

        verifier_system.add_stack_levels(amts);
    }

    function post_jobs() internal {
        add_categories();
        bytes32 job_id = bytes32(uint256(1));
        uint8 category_index = uint8(0);
        uint256 client_stake = 10 * 10 ** 18;
        uint256 freelancer_stake = 10 ** 18;
        verifier_system.post_job(job_id, category_index, client_stake, freelancer_stake);
    }

    function add_verifiers_withstake() internal {
        post_jobs();
        add_levels();

        for (uint j = 0; j < 20; j++) {
            address verifier = address(uint160(j + 100)); // Avoid low addresses
            uint16 category = uint16(0);
            verifier_system.add_verifier(category, verifier);
            reputation_token.mint(verifier, 100 * 10 ** 18);

            vm.startPrank(verifier);
            reputation_token.approve(address(verifier_system), 100 * 10 ** 18);
            verifier_system.stake(18 * 10 ** 18);
            vm.stopPrank();
        }
    }


    function test_post_job() public {
        add_categories();
        bytes32 job_id = bytes32(uint256(1));
        uint8 category_index = 0;
        uint256 client_stake = 10 * 10 ** 18;
        uint256 freelancer_stake = 10 ** 18;
        verifier_system.post_job(job_id, category_index, client_stake, freelancer_stake);
        (bool open_for_dispute,,,,,uint256 stored_client_stake, uint256 stored_freelancer_stake,,,) = verifier_system.get_job(job_id);
        assertFalse(open_for_dispute);
        assertEq(stored_client_stake, client_stake);
        assertEq(stored_freelancer_stake, freelancer_stake);
    }

    function test_request_random_fullfill() public {
        add_verifiers_withstake();
        bytes32 job_id = bytes32(uint256(1));
        uint256 request_id = verifier_system.request_random_nums(false, job_id, 10 * 10 ** 18, 2);

        uint256[] memory random_words = new uint256[](2);
        random_words[0] = 123;
        random_words[1] = 456;

        vrf_coordinator.fulfillRandomWordsWithOverride(request_id, address(verifier_system), random_words);

        address[] memory assigned_verifiers = verifier_system.get_chosen_verifiers(job_id);
        assertEq(assigned_verifiers.length, 2);
        for (uint i=0; i < 2; ++i) console.log(assigned_verifiers[i]);
    }

    function test_request_insufficient_verifiers() public {
        add_verifiers_withstake();
        bytes32 job_id = bytes32(uint256(1));
        vm.expectRevert(
            abi.encodeWithSelector(
                InSufficientVerifiers.selector,
                20,
                21
            )
        ); // InSufficientVerifiers
        verifier_system.request_random_nums(false, job_id, 10 * 10 ** 18, 21);
    }

    function test_request_fail_open_category() public {
        add_verifiers_withstake();
        bytes32 job_id1 = bytes32(uint256(1));
        bytes32 job_id2 = bytes32(uint256(2));
        verifier_system.request_random_nums(false, job_id1, 10 * 10 ** 18, 3);
        vm.expectRevert(
            abi.encodeWithSelector(
                OpenedCategoryLevel.selector,
                0,
                0
            )
        ); // OpenedCategoryLevel
        verifier_system.request_random_nums(false, job_id2, 10 * 10 ** 18, 3);
    }

    function test_full_workflow() public {
        add_verifiers_withstake();
        bytes32 job_id = bytes32(uint256(1));
        uint256 stake_amount = 10 * 10 ** 18;
        uint256 verifiers_cnt = 3;

        uint256 request_id = verifier_system.request_random_nums(false, job_id, stake_amount, verifiers_cnt);

        uint256[] memory random_words = new uint256[](verifiers_cnt);
        for (uint i = 0; i < verifiers_cnt; i++) random_words[i] = i + 777;

        vrf_coordinator.fulfillRandomWordsWithOverride(request_id, address(verifier_system), random_words);

        address[] memory chosen = verifier_system.get_chosen_verifiers(job_id);

        vm.warp(block.timestamp + 1); // move past 0 if needed

        // Commit
        bytes32 salt = bytes32(uint256(12345));
        uint8 decision = 70; // freelancer wins
        bytes32 hash = keccak256(abi.encodePacked(salt, decision));

        for (uint i = 0; i < verifiers_cnt; i++) {
            vm.prank(chosen[i]);
            verifier_system.submit_hashed_decision(job_id, hash);
        }

        // Reveal
        vm.warp(block.timestamp + 25 hours); // after submission deadline

        for (uint i = 0; i < verifiers_cnt; i++) {
            vm.prank(chosen[i]);
            verifier_system.reveal_decision(job_id, salt, decision);
        }

        // Finalize
        vm.warp(block.timestamp + 49 hours); // after reveal deadline

        // Need to fund treasury with EthioCoin and RPT?
        // RewardVault needs to exist too if it's used.

        verifier_system.finalize_verification(job_id);

        (,,,,,,,,VerifierSystem.DISPUTE_STATUS status,) = verifier_system.get_job(job_id);
        assertEq(uint8(status), 1); // FREELANCER_WIN
    }

    function test_fail_invalid_cat_post_job() public {
        add_categories();
        console.log("Working");
        uint8 categories_len = uint8(verifier_system.get_categories().length);
        vm.startPrank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                InvalidCategory.selector,
                categories_len
            )
        );
        bytes32 job_id = bytes32(uint256(12345));
        verifier_system.post_job(job_id, categories_len, 1 * 10 ** 18, 10 ** 18);
        vm.stopPrank();
    }

    function test_post_job_v2() public {
        add_categories();
        uint8 category_index = 0;
        uint256 client_stake = 10 * 10 ** 18;
        uint256 freelancer_stake = 10 ** 18;
        bytes32 job_id = bytes32(uint256(111));

        vm.prank(owner);
        verifier_system.post_job(job_id, category_index, client_stake, freelancer_stake);

        (,,,uint16 stored_category,,uint256 stored_client_stake, uint256 stored_freelancer_stake,,,) = verifier_system.get_job(job_id);
        assertEq(stored_category, category_index);
        assertEq(stored_client_stake, client_stake);
        assertEq(stored_freelancer_stake, freelancer_stake);
    }

    function test_request_random_full() public {
        add_verifiers_withstake();
        bytes32 job_id = bytes32(uint256(1));
        uint256 time = 10 ** 9;
        vm.warp(time);

        uint256 stake_amount = 10 * 10 ** 18;
        verifier_system.request_random_nums(false, job_id, stake_amount, 3);

        (bool open_for_dispute, uint sub_deadline, uint r_deadline, ,uint stakes,,,,,) = verifier_system.get_job(job_id);

        // request_random_nums doesn't set deadlines anymore, they are set in fulfillRandomWords
        assertTrue(open_for_dispute);
        assertEq(stakes, stake_amount);
        assertEq(sub_deadline, 0);
    }

    function test_submit_fail_not_open() public {
        bytes32 job_id = bytes32(uint256(999));
        bytes32 choice = bytes32(uint256(1));
        vm.expectRevert(
            abi.encodeWithSelector(
                Unopened.selector,
                job_id
            )
        ); // Unopened
        verifier_system.submit_hashed_decision(job_id, choice);
    }

    function test_transfer_address() public {
        add_categories();
        add_levels();
        address verifier = address(0xabc);
        uint16 category = 0;

        vm.prank(owner);
        verifier_system.add_verifier(category, verifier);

        address new_address = address(0xdef);

        vm.prank(verifier);
        verifier_system.transfer_address(new_address);

        (bool verified,,,,,,,uint8 level,) = verifier_system.verifiers(verifier);
        assertFalse(verified);

        (bool new_verified,,,,,,,uint8 new_level,) = verifier_system.verifiers(new_address);
        assertTrue(new_verified);
        assertEq(new_level, level);
    }

    function test_tokens_address() public {
        assertEq(address(registry.ethiocoin()), address(ethio_coin));
        assertEq(address(registry.rpt()), address(reputation_token));

    }

    function test_only_owner_set_vrf() public {
        address new_coordinator = address(0x456);
        vm.startPrank(address(0x789)); // Simulate a call from a non-owner address
        vm.expectRevert();
        bytes32 new_key_hash = bytes32("keyhash");
        verifier_system.set_up_vrf(2, 100, new_key_hash, 100000, address(2), address(1));
        vm.stopPrank();
    }

    function test_set_vrf() public {
        vm.startPrank(owner);
        bytes32 new_key_hash = bytes32("keyhash");
        uint new_subscription_id = 2;
        uint16 new_request_confirmations = 100;
        uint32 new_callback_gas_limit = 100000;
        address new_link_token = address(2);
        address new_vrf_wrapper = address(1);
        verifier_system.set_up_vrf(new_subscription_id, new_request_confirmations, new_key_hash, new_callback_gas_limit, new_link_token, new_vrf_wrapper);
        assertEq(verifier_system.subscription_id(), new_subscription_id);
        assertEq(verifier_system.callback_gas_limit(), new_callback_gas_limit);
        assertEq(verifier_system.key_hash(), new_key_hash);
        assertEq(verifier_system.request_confirmations(), new_request_confirmations);
        assertEq(verifier_system.link_token(), new_link_token);
        assertEq(verifier_system.vrf_wrapper(), new_vrf_wrapper);
        vm.stopPrank();
    }

    function test_only_owner_add_level() public {
        vm.startPrank(address(0x789)); // Simulate a call from a non-owner address
        vm.expectRevert();
        uint amt = 10 ** 18;
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
        uint amt1 = 1 * 10 ** 18;
        uint amt2 = 5 * 10 ** 17;
        verifier_system.add_stack_level(amt1);
        vm.expectRevert();
        verifier_system.add_stack_level(amt2);
        vm.stopPrank();
    }

    function test_only_admin_add_levels() public {
        vm.startPrank(address(0x789)); // Simulate a call from a non-admin address
        vm.expectRevert();
        uint[] memory amts = new uint[](3);
        amts[0] = 1 * 10 ** 18;
        amts[1] = 2 * 10 ** 18;
        amts[2] = 3 * 10 ** 18;
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
        amts[0] = 1 * 10 ** 18;
        amts[1] = 5 * 10 ** 18;
        amts[2] = 3 * 10 ** 18;
        amts[3] = 4 * 10 ** 18;
        amts[4] = 2 * 10 ** 18;
        vm.expectRevert();
        verifier_system.add_stack_levels(amts);
        vm.stopPrank();
    }

    function test_add_levels() public {
        vm.startPrank(owner);
        uint[] memory amts = new uint[](7);
        amts[0] = 1 * 10 ** 18;
        amts[1] = 3 * 10 ** 18;
        amts[2] = 5 * 10 ** 18;
        amts[3] = 7 * 10 ** 18;
        amts[4] = 10 * 10 ** 18;
        amts[5] = 15 * 10 ** 18;
        amts[6] = 20 * 10 ** 18;


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
        uint256 bps = 10001; // 100% + 1 bps
        vm.expectRevert();
        verifier_system.set_slash_bps(bps);
        bps = 0;
        vm.expectRevert();
        verifier_system.set_slash_bps(bps);
        vm.stopPrank();
    }

    function test_set_slash_bps() public {
        vm.startPrank(owner);
        uint256 bps = 500; // 5%
        verifier_system.set_slash_bps(bps);
        assertEq(verifier_system.slash_bps(), bps);
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
        vm.expectRevert(NullAddress.selector);
        verifier_system.add_verifier(category, verifier);
        vm.stopPrank();
    }

    function test_fail_verified_verifier() public {
        add_categories();
        vm.startPrank(owner);
        uint16 category = 0;
        address verifier = address(0xabc);
        verifier_system.add_verifier(category, verifier);
        vm.expectRevert(AlreadyVerified.selector);
        verifier_system.add_verifier(category, verifier);
        vm.stopPrank();
    }

    function test_fail_invalid_category_verifier() public {
        add_categories();
        vm.startPrank(owner);
        uint16 category = 5; // Invalid category index
        address verifier = address(0xabc);
        vm.expectRevert(
            abi.encodeWithSelector(
                InvalidCategory.selector,
                uint8(verifier_system.get_categories().length)
            )
        );
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

        vm.startPrank(verifier);
        vm.expectRevert(ZeroStake.selector);
        verifier_system.stake(0);
        vm.stopPrank();
    }

    function test_fail_unverified_verifier_stake() public {
        add_categories();
        uint16 category = 2;
        address verifier = address(0xabc);

        vm.startPrank(verifier);
        vm.expectRevert(Unverified.selector);
        uint stake_amount = 1 * 10 ** 18;
        verifier_system.stake(stake_amount);
        vm.stopPrank();
    }

    function find_upper_bound(uint256 value) internal view returns (uint8) {
        uint256[] memory arr = verifier_system.get_stack_levels();
        uint8 n = uint8(arr.length);
        if (n == 0) return 0;

        uint8 low = 0;
        uint8 high = n - 1;

        while (low < high) {
            uint8 mid = (low + high + 1) >> 1;
            if (arr[mid] <= value) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }

        return low;
    }

    function test_stake_update_unassigned() public returns (uint8) {
        add_categories();
        add_levels();
        uint16 category = 1;
        address verifier = address(0xabc);
        uint256 value = 9 * 10 ** 18;
        vm.startPrank(owner);
        verifier_system.add_verifier(category, verifier);
        reputation_token.mint(verifier, value * 10);
        vm.stopPrank();
        vm.startPrank(verifier);
        reputation_token.approve(address(verifier_system), value);
        verifier_system.stake(value);
        (bool verified, bool is_active, bool assigned, , , uint256 staked_amount, uint16 assigned_category, uint8 level, uint16 idx) = verifier_system.verifiers(verifier);
        assertEq(staked_amount, value);
        uint8 exp_level = find_upper_bound(value);
        assertEq(level, exp_level);
        address expected_address = verifier_system.leveled_verifiers(category, level, idx);
        assertEq(expected_address, verifier);
        assertTrue(assigned);
        assertTrue(is_active);
        return level;
    }

    function test_stake_update_assigned_same_level() public {

        uint8 be_level = test_stake_update_unassigned();
        address verifier = address(0xabc);
        uint256 value = 100;
        vm.startPrank(verifier);
        reputation_token.approve(address(verifier_system), value);
        verifier_system.stake(value);
        (, bool is_active, bool assigned, , , uint256 staked_amount, ,uint8 level, uint16 id) = verifier_system.verifiers(verifier);
        assertEq(staked_amount, value + 9 * 10 ** 18);
        uint8 exp_level = find_upper_bound(value + 9 * 10 ** 18);
        assertEq(level, exp_level);
        assertEq(be_level, level);
        address expected_address = verifier_system.leveled_verifiers(1, level, id);
        assertEq(expected_address, verifier);
    }

    function test_stake_update_assigned_diff_level() public {
        uint8 be_level = test_stake_update_unassigned();
        address verifier = address(0xabc);
        uint256 value = 10 * 10 ** 18;
        vm.startPrank(verifier);
        reputation_token.approve(address(verifier_system), value);
        verifier_system.stake(value);
        (, bool is_active, bool assigned, , , uint256 staked_amount, ,uint8 level, uint16 id) = verifier_system.verifiers(verifier);
        assertEq(staked_amount, value + 9 * 10 ** 18);
        uint8 exp_level = find_upper_bound(value + 9 * 10 ** 18);
        assertEq(level, exp_level);
        assertGe(level, be_level);
        address expected_address = verifier_system.leveled_verifiers(1, level, id);
        assertEq(expected_address, verifier);
    }

    function test_fail_inactive_inactive_verifer() public {
        address verifier = address(0xabc);
        vm.startPrank(verifier);
        vm.expectRevert(Inactive.selector);
        verifier_system.unstake();
        vm.stopPrank();
    }

    function test_inactive_verifier() public {
        test_stake_update_unassigned();
        address verifier = address(0xabc);
        uint before_balance = reputation_token.balanceOf(verifier);
        (,,,,,uint before_stake,uint16 before_cat,uint8 before_level,) = verifier_system.verifiers(verifier);
        uint before_len = verifier_system.get_leveled_verifiers_len(before_cat, before_level);
        vm.startPrank(verifier);
        verifier_system.unstake();
        (, bool is_active, bool assigned, , , uint256 staked_amount, ,uint8 level, uint16 id) = verifier_system.verifiers(verifier);
        uint after_balance = reputation_token.balanceOf(verifier);
        uint after_len = verifier_system.get_leveled_verifiers_len(before_cat, before_level);
        assertFalse(is_active);
        assertEq(staked_amount, 0);
        assertEq(after_balance, before_balance + 9 * 10 ** 18);
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
        reputation_token.mint(verifier_f, 20 * 10 ** 18);
        reputation_token.mint(verifier_s, 20 * 10 ** 18);
        uint256 value_f = 12 * 10 ** 18;
        uint256 value_s = 14 * 10 ** 18;
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
//
    function test_unstake_multiple() public {
        stake_multiple();
        address verifier_f = address(0xabc);
        address verifier_s = address(0xdef);
        (,,,,,,,,uint16 before_id) = verifier_system.verifiers(verifier_s);
        vm.startPrank(verifier_f);
        verifier_system.unstake();
        vm.stopPrank();
        (, bool is_active_s, bool assigned_s, , , uint256 staked_amount_s, ,uint8 level_s, uint16 id_s) = verifier_system.verifiers(verifier_s);

        assertTrue(is_active_s);
        assertTrue(assigned_s);
        assertEq(staked_amount_s, 14 * 10 ** 18);
        assertLt(id_s, before_id);
    }
//
    function test_fail_transfer_null_address() public {
        test_add_verifier();
        address verifier = address(0xabc);
        vm.startPrank(verifier);
        vm.expectRevert(NullAddress.selector);
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
        vm.expectRevert(AlreadyVerified.selector);
        verifier_system.transfer_address(new_address);
        vm.stopPrank();
    }
//
    function test_transfer_address_v2() public {
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