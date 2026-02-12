// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {JobPayingSystem as Manager} from "../contracts/JobPayingSystem.sol";
import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {EthioCoin} from "../contracts/EthioCoin.sol";
import {ReputationToken} from "../contracts/ReputationToken.sol";
import {AccessManager} from "@openzeppelin/contracts/access/manager/AccessManager.sol";
contract JobPayingSystemTest is Test {
    EthioCoin public eth;
    address  public owner=address(1);
    ReputationToken public rpt;
    Manager public job_manager;
    address public treasure=address(2);
    address public coordinator=address(3);
    uint256 public subscription_id=1;
    AccessManager public access_manager;

    function setUp() public {

        vm.startPrank(owner);
        access_manager = new AccessManager(owner);
        eth = new EthioCoin();
        rpt=new ReputationToken(treasure, address(access_manager));
        job_manager = new Manager(coordinator, subscription_id, treasure, address(eth), address(rpt), address(access_manager));
        vm.stopPrank();
    }


    // TESTING LEVEL INITIALIZATION AND UPDATE SYSTEM
    function test_only_owner_leveling() public {
        vm.prank(address(5));
        vm.expectRevert();
        Manager.WLevel memory level=Manager.WLevel(10,10,100,1000,1000);
        job_manager.append_level(level);
        vm.prank(owner);
        job_manager.append_level(level);
    }
    function test_fail_no_verifiers_leveling() public {
        Manager.WLevel memory level= Manager.WLevel(0,10,10,1000, 1000);
        vm.prank(owner);
        vm.expectRevert("No verifiers system not allowed");
        job_manager.append_level(level);
    }



    function test_fail_no_stake_leveling() public {
        Manager.WLevel memory level = Manager.WLevel(10, 0,10,1000,1000);
        vm.prank(owner);
        vm.expectRevert("Zero stake not allowed");
        job_manager.append_level(level);
    }

    function test_normal_mechanics_leveling() public {
        uint prev_len=job_manager.levels_size();
        vm.startPrank(owner);
        Manager.WLevel memory level=Manager.WLevel(10,10,100,1000,1000);
        job_manager.append_level(level);
        Manager.WLevel memory c_level= job_manager.get_level(prev_len);
        assertEq(c_level.payment_duration, level.payment_duration);
        assertEq(c_level.client_stake, level.client_stake);
        assertEq(c_level.freelancer_stake, level.freelancer_stake);
        assertEq(c_level.min_verifiers_portion, level.min_verifiers_portion);
        assertEq(c_level.max_amount, level.max_amount);
        vm.stopPrank();
    }

    function test_sorted_order_leveling() public {
        test_normal_mechanics_leveling();
        vm.startPrank(owner);
        vm.expectRevert("Sorting order should be respected");
        Manager.WLevel memory level=Manager.WLevel(12, 10,100, 100,100);
        job_manager.append_level(level);
        level.max_amount=1e5;
        uint prev_len=job_manager.levels_size();
        job_manager.append_level(level);
        assertEq(job_manager.levels_size(), prev_len+1);
        vm.stopPrank();
    }

    // TESTING FREELANCER REGISTRATION
    function test_only_owner_registration() public {
        test_normal_mechanics_leveling();
        vm.prank(address(10));
        vm.expectRevert();
        job_manager.register_freelancer(address(11), 1);
        vm.prank(owner);
        job_manager.register_freelancer(address(11), 1);
    }

    function test_fail_zero_level() public {
        vm.prank(owner);
        vm.expectRevert("No such level exists");
        job_manager.register_freelancer(address(10), 0);
    }

    function test_fail_excess_level() public {
        test_normal_mechanics_leveling();
        uint prev_len=job_manager.levels_size();
        vm.prank(owner);
        vm.expectRevert("No such level exists");
        job_manager.register_freelancer(address(10), prev_len+1);
    }
    function test_fail_zero_address() public {
        vm.prank(owner);
        vm.expectRevert("Zero address is not allowed");
        job_manager.register_freelancer(address(0), 1);
    }

    // levels
// max_amount, min_verifier, free_lancer_stake, client_stake, payment_duration
// 500,    5,   25 token,    100 token,   7+1 days
// 2500,   15,  100 token,   500 token,   7+3 days
// 10000,  25,  200 token,   1000 token,  7+5 days
// 25000,  40,  500 token,   5000 token,  7+7 days
// 75000,  60,  1000 token,  10000 token, 7+10 days
// 200000, 75,  2000 token,  25000 token, 7+30 days

    address public f_client = address(7);
    address public l_client = address(8);
    uint public constant day = 3600 * 24;

    function prepare_levels() public {
        Manager.WLevel memory level = Manager.WLevel({
            min_verifiers_portion: 5,
            freelancer_stake: 5*1e18,
            client_stake: 100*1e18,
            max_amount: 500*1e18,
            payment_duration: day * 8        // 7 + 1
        });

        vm.startPrank(owner);
        job_manager.append_level(level);

        level = Manager.WLevel({
            min_verifiers_portion: 15,
            freelancer_stake: 100*1e18,
            client_stake: 500*1e18,
            max_amount: 2500*1e18,
            payment_duration: day * 10       // 7 + 3
        });
        job_manager.append_level(level);

        level = Manager.WLevel({
            min_verifiers_portion: 25,
            freelancer_stake: 200*1e18,
            client_stake: 1000*1e18,
            max_amount: 10000*1e18,
            payment_duration: day * 12       // 7 + 5
        });
        job_manager.append_level(level);

        level = Manager.WLevel({
            min_verifiers_portion: 40,
            freelancer_stake: 500*1e18,
            client_stake: 5000*1e18,
            max_amount: 25000*1e18,
            payment_duration: day * 14       // 7 + 7
        });
        job_manager.append_level(level);

        level = Manager.WLevel({
            min_verifiers_portion: 60,
            freelancer_stake: 1000*1e18,
            client_stake: 10000*1e18,
            max_amount: 75000*1e18,
            payment_duration: day * 17       // 7 + 10
        });
        job_manager.append_level(level);

        level = Manager.WLevel({
            min_verifiers_portion: 75,
            freelancer_stake: 2000*1e18,
            client_stake: 25000*1e18,
            max_amount: 200000*1e18,
            payment_duration: day * 37       // 7 + 30
        });
        job_manager.append_level(level);

        vm.stopPrank();
    }

    function prepare_verifiers() public {
        uint160 address_id=1;
        for (uint8 cat=0; cat < 10; cat++){
            for (uint len=0; len < 100;len++) {
                address v=address(address_id++);
                vm.prank(address(treasure));
                rpt.transfer(v, 1e20);
                vm.prank(owner);
                job_manager.add_verifier(cat,v);
            }
        }
    }
    function prepare_poster() public {
        vm.prank(address(treasure));
        rpt.transfer(f_client, 1e22);
        vm.prank(owner);
        eth.transfer(f_client, 1e22);
    }
    function test_fail_insufficient_working_duration() public {
        prepare_poster();
        prepare_levels();
        vm.prank(f_client);
        vm.expectRevert("Insufficient working time");
        job_manager.post_job(5e18, 3600, 1, 1e18);
    }
    function prepare_everything() public {
        prepare_verifiers();
        prepare_levels();
        prepare_poster();
    }

    function test_fail_zero_pay() public {
        prepare_everything();
        vm.prank(f_client);
        vm.expectRevert("Amount must be > 0");
        job_manager.post_job(0,day*2, 1, 1e18);
    }

    function test_no_verifier_system() public {
        prepare_everything();
        vm.prank(f_client);
        vm.expectRevert("No verifiers system not allowed");
        job_manager.post_job(5e18, day*2, 11, 1e8);

    }

    function test_fail_insufficient_fee() public {
        vm.deal(f_client, 100 ether);
//        assertEq(job_manager.client_fee_portion_bps(), 200);
        prepare_everything();
        uint amount=5e10;

        vm.startPrank(f_client);
        uint fee=amount*job_manager.client_fee_portion_bps()/10000-1;
        vm.expectRevert("Insufficient fee provided");
        job_manager.post_job(amount, day*2, 5,fee);
        vm.stopPrank();
    }

    function check_transition_open(Manager.Job memory prev_job, Manager.Job memory curr_job) internal view  {
        // making sure it is initialized first
        Manager.JOB_STATUS prev_state=prev_job.status;
        assert(prev_state==Manager.JOB_STATUS.PENDING || prev_state==Manager.JOB_STATUS.DISPUTED || prev_state == Manager.JOB_STATUS.HIRED);
        assert(curr_job.status==Manager.JOB_STATUS.OPEN);
        assert(prev_job.amount>0);
        assert(prev_job.level >= 0);
        assert(prev_job.max_duration > job_manager.MIN_MAX_DURATION());
        assert(prev_job.client!=address(0));
        // now testing the check_transition
        // ones not to be changed after initialized;
        assertEq(prev_job.amount, curr_job.amount);
        assertEq(prev_job.level, curr_job.level);
        assertEq(prev_job.max_duration, curr_job.max_duration);
        assertEq(prev_job.client, curr_job.client);
        // ones that should be reset
        assertEq(curr_job.freelancer, address(0));
        assertEq(curr_job.freelancer_approved, false);
        assertEq(curr_job.freelancer_completed, false);
        assertEq(curr_job.appeal_time,0);
        assertEq(curr_job.expiry_timestamp,0);

    }
    function test_post_job_mechanics() public {
        prepare_everything();
        vm.startPrank(f_client);
        uint amount=5e20;
        uint fee=amount*job_manager.client_fee_portion_bps()/10000+1e6;
        uint prev_treasure_token=rpt.balanceOf(address(treasure));
        uint prev_treasure_dollar=eth.balanceOf(address(treasure));
        eth.approve(address(job_manager), 1e21);
        rpt.approve(address(job_manager), 1e21);
        vm.warp(block.timestamp+1000);
        bytes32 job_id=keccak256(abi.encodePacked(block.timestamp, (uint)(0)));
        uint level = job_manager.calculate_level(amount);
        vm.expectEmit();
        emit Manager.job_posted(job_id, f_client, amount, 5,level);
        job_manager.post_job(amount, day*2, 5, fee);
        Manager.Job memory curr_job = job_manager.get_job(job_id);
        assertEq(amount, curr_job.amount);
        assertEq(level, curr_job.level);
        assertEq(curr_job.max_duration, day*2);
        (,,uint client_stake,uint max_amount,)=job_manager.work_levels(level-1);
        assertLe(amount, max_amount);
        assertEq(rpt.balanceOf(address(treasure)), prev_treasure_token+client_stake);
        assertEq(eth.balanceOf(address(treasure)), prev_treasure_dollar+amount+fee-1e6);
        vm.stopPrank();
    }
    function create_job() public returns(bytes32) {
        prepare_everything();
        vm.startPrank(f_client);
        eth.approve(address(job_manager), 1e21);
        rpt.approve(address(job_manager), 1e21);
        uint amount=5e20;
        uint fee=amount*job_manager.client_fee_portion_bps()/10000+1e6;
        vm.stopPrank();
        vm.prank(f_client);
        job_manager.post_job(amount, day*2, 5, fee);
        vm.warp(block.timestamp+1000);
        vm.stopPrank();
        return keccak256(abi.encodePacked(block.timestamp-1000, job_manager.get_job_lists_len()-1));
    }
    function test_cancel_only_client() public {
        bytes32 job_id=create_job();
        vm.startPrank(l_client);
        vm.expectRevert("Only client can cancel");
        job_manager.cancel_job(job_id);
        vm.stopPrank();
    }
    // we don't need to test the job status transition from any to closed because once closed any of the funcs don't work for the job
    function test_cancel_job_normal_mechanics() public {
        bytes32 job_id=create_job();
        vm.startPrank(address(treasure));
        Manager.Job memory prev_job=job_manager.get_job(job_id);
        assert(prev_job.status==Manager.JOB_STATUS.OPEN);
        eth.transfer(address(job_manager), prev_job.amount);
        (,,uint client_stake,,)=job_manager.work_levels(prev_job.level-1);
        rpt.transfer(address(job_manager), client_stake);
        vm.stopPrank();
        uint prev_balance=eth.balanceOf(f_client);
        uint prev_token=rpt.balanceOf(f_client);
        vm.startPrank(f_client);
        job_manager.cancel_job(job_id);
        Manager.Job memory curr_job =job_manager.get_job(job_id);
        assert(curr_job.status==Manager.JOB_STATUS.CLOSED);
        assertEq(eth.balanceOf(f_client), prev_balance+ curr_job.amount);
        assertEq(rpt.balanceOf(f_client), prev_token+client_stake);
        vm.stopPrank();
    }

    function check_transition_pending_hire(Manager.Job memory prev_job, Manager.Job memory curr_job) public {
        assert(prev_job.status==Manager.JOB_STATUS.OPEN);
        assert(curr_job.status==Manager.JOB_STATUS.PENDING);
        // stays same
        assertEq(prev_job.client,curr_job.client);
        assertEq(prev_job.max_duration, curr_job.max_duration);
        assertEq(prev_job.amount, curr_job.amount);
        assertEq(prev_job.level, curr_job.level);
        // resets/defaults
        assertEq(curr_job.freelancer_completed, false);
        assertEq(curr_job.freelancer_approved, false);
        assertEq(curr_job.appeal_time,0);
    }

    function test_hire_only_client() public {
        bytes32 job_id=create_job();
        vm.prank(l_client);
        vm.expectRevert("Only client can hire");
        job_manager.hire(job_id, address(9));
    }



    function test_hire_fail_self_employment() public {
        bytes32 job_id=create_job();
        vm.prank(f_client);
        vm.expectRevert("Client cannot hire self");
        job_manager.hire(job_id, f_client);
    }
    address public worker=address(100);

    function test_hire_fail_unregistered_worker() public {
        bytes32 job_id=create_job();
        vm.prank(f_client);
        vm.expectRevert("Not registered");
        job_manager.hire(job_id,worker);
    }

    function test_hire_normal_mechanics() public returns(bytes32) {
        bytes32 job_id=create_job();
        Manager.Job memory prev_job=job_manager.get_job(job_id);
        vm.prank(owner);
        job_manager.register_freelancer(worker,prev_job.level);
        vm.startPrank(f_client);
        vm.expectEmit();
        emit Manager.job_hired(job_id, f_client, worker);
        job_manager.hire(job_id, worker);
        Manager.Job memory curr_job=job_manager.get_job(job_id);
        assertEq(curr_job.freelancer, worker);
        check_transition_pending_hire(prev_job, curr_job);
        vm.stopPrank();
        return job_id;
    }

    function test_cancel_pending_hire_only_client() public {
        bytes32 job_id=test_hire_normal_mechanics();
        vm.prank(l_client);
        vm.expectRevert("Only client can cancel");
        job_manager.cancel_pending_hire(job_id);
    }

    function test_cancel_pending_normal_mechanics() public {
        bytes32 job_id=test_hire_normal_mechanics();
        vm.startPrank(f_client);
        Manager.Job memory prev_job=job_manager.get_job(job_id);
        job_manager.cancel_pending_hire(job_id);
        Manager.Job memory curr_job=job_manager.get_job(job_id);
        check_transition_open(prev_job,curr_job);
        vm.stopPrank();
    }
    function check_transition_hired(Manager.Job memory prev_job, Manager.Job memory curr_job) public {
        // state transition check
        assert(prev_job.status==Manager.JOB_STATUS.PENDING);
        assert(curr_job.status==Manager.JOB_STATUS.HIRED);
        // stays the same
        assertEq(prev_job.client, curr_job.client);
        assertEq(prev_job.freelancer, curr_job.freelancer);
        assertEq(prev_job.amount, curr_job.amount);
        assertEq(prev_job.max_duration, curr_job.max_duration);
        assertEq(prev_job.level, curr_job.level);

        // defaults
        assertEq(curr_job.freelancer_completed, false);
        assertEq(curr_job.appeal_time, 0);
    }

    function test_hire_fail_access_control() public {
        bytes32 job_id=test_hire_normal_mechanics();
        vm.prank(address(30));
        vm.expectRevert("Only invited freelancer can accept");
        job_manager.accept_job(job_id);
    }

    function test_accept_normal_mechanics() public returns(bytes32) {
        bytes32 job_id=test_hire_normal_mechanics();
        Manager.Job memory prev_job=job_manager.get_job(job_id);
        vm.prank(owner);
        eth.transfer(worker, 1e22);
        vm.prank(address(treasure));
        rpt.transfer(worker, 1e22);
        vm.startPrank(worker);
        eth.approve(address(job_manager), 1e21);
        rpt.approve(address(job_manager), 1e21);
        vm.warp(block.timestamp+1000);
        (,,uint prev_total_jobs)=job_manager.freelancers(worker);
        vm.expectEmit();
        emit Manager.job_accepted(job_id, worker);
        job_manager.accept_job(job_id);
        Manager.Job memory curr_job=job_manager.get_job(job_id);
        check_transition_hired(prev_job, curr_job);
        assertEq(curr_job.expiry_timestamp, block.timestamp+curr_job.max_duration);
        assertTrue(curr_job.freelancer_approved);
        (,,uint curr_total_jobs)=job_manager.freelancers(worker);
        assertEq(curr_total_jobs, prev_total_jobs+1);
        vm.stopPrank();
        return job_id;
    }



    function test_cancel_hire_only_client()  public {
        bytes32 job_id=test_accept_normal_mechanics();
        Manager.Job memory curr_job=job_manager.get_job(job_id);
        vm.warp(curr_job.expiry_timestamp+100);
        vm.prank(l_client);
        vm.expectRevert("Only client can cancel");
        job_manager.cancel_hire(job_id);
    }
    function test_cancel_hire_after_expiry() public {
        bytes32 job_id=test_accept_normal_mechanics();
        vm.prank(f_client);
        vm.expectRevert("Time not expired");
        job_manager.cancel_hire(job_id);
    }

    function test_cancel_hire_fail_completed_job() public {
        bytes32 job_id=test_accept_normal_mechanics();
        vm.prank(worker);
        job_manager.complete_job(job_id);
        vm.warp(block.timestamp+1e8);
        vm.prank(f_client);
        vm.expectRevert("Freelancer already completed");
        job_manager.cancel_hire(job_id);
    }

    function test_cancel_hire_normal_mechanics() public {
        bytes32 job_id=test_accept_normal_mechanics();
        Manager.Job memory prev_job=job_manager.get_job(job_id);
        vm.warp(block.timestamp+1e8);
        vm.prank(f_client);
        job_manager.cancel_hire(job_id);
        Manager.Job memory curr_job=job_manager.get_job(job_id);
        check_transition_open(prev_job, curr_job);
    }

    function test_complete_job_only_worker() public {
        bytes32 job_id=test_accept_normal_mechanics();
        vm.prank(address(50));
        vm.expectRevert("Only hired freelancer can complete");
        job_manager.complete_job(job_id);
    }

    function test_complete_job_fail_expire() public {
        bytes32 job_id=test_accept_normal_mechanics();
        vm.warp(block.timestamp+1e8);
        vm.prank(worker);
        vm.expectRevert("Time expired");
        job_manager.complete_job(job_id);
    }

    function test_complete_job_normal_mechanics() public returns(bytes32) {
        bytes32 job_id=test_accept_normal_mechanics();
        Manager.Job memory prev_job =job_manager.get_job(job_id);
        assert(prev_job.status==Manager.JOB_STATUS.HIRED);
        vm.warp(block.timestamp+3600);
        vm.prank(worker);
        vm.expectEmit();
        emit Manager.job_completed(job_id, worker);
        job_manager.complete_job(job_id);
        Manager.Job memory curr_job=job_manager.get_job(job_id);
        assertTrue(curr_job.freelancer_completed);
        return job_id;
    }
    function test_complete_job_fail_double_complete() public {
        bytes32 job_id=test_complete_job_normal_mechanics();
        vm.prank(worker);
        vm.expectRevert("Already completed job");
        job_manager.complete_job(job_id);
    }

    function test_pay_him_only_client() public {
        bytes32 job_id=test_complete_job_normal_mechanics();
        vm.prank(worker);
        vm.expectRevert("Only client can pay");
        job_manager.pay_him(job_id);
    }

    function test_pay_him_only_completed_job() public {
        bytes32 job_id=test_accept_normal_mechanics();
        vm.prank(f_client);
        vm.expectRevert("Freelancer not completed");
        job_manager.pay_him(job_id);
    }

    function test_pay_him_normal_mechanics() public {
        bytes32 job_id=test_complete_job_normal_mechanics();
        Manager.Job memory prev_job=job_manager.get_job(job_id);
        uint prev_token_client=rpt.balanceOf(f_client);
        uint prev_token_freelancer=rpt.balanceOf(worker);
        uint prev_balance_freelancer=eth.balanceOf(worker);
        Manager.WLevel memory level=job_manager.get_level(prev_job.level-1);
        vm.prank(address(treasure));
        rpt.approve(address(job_manager), 1e22);
        vm.prank(owner);
        eth.transfer(address(treasure), 1e23);
        vm.prank(address(treasure));
        eth.approve(address(job_manager), 1e22);
        vm.prank(f_client);
        job_manager.pay_him(job_id);
        Manager.Job memory curr_job=job_manager.get_job(job_id);
        assert(curr_job.status==Manager.JOB_STATUS.CLOSED);
        assertEq(rpt.balanceOf(f_client), prev_token_client+level.client_stake);
        assertEq(rpt.balanceOf(worker), prev_token_freelancer+level.freelancer_stake);
        assertEq(eth.balanceOf(worker), prev_balance_freelancer+prev_job.amount);
    }

    function test_set_treasure_only_owner() public {
        vm.prank(address(1000));
        vm.expectRevert();
        job_manager.set_treasury(address(treasure));
    }

    function test_set_treasure_fail_null_address() public {
        vm.prank(owner);
        vm.expectRevert("zero treasury");
        job_manager.set_treasury(address(0));
    }

    

    function test_set_slash_only_owner() public {
        vm.prank(f_client);
        vm.expectRevert();
        job_manager.set_slash_bps(1000);
    }

    function test_set_slash_bps_fail_invalid_ranges() public {
        vm.startPrank(owner);
        vm.expectRevert("outside range");
        job_manager.set_slash_bps(0);
        vm.expectRevert("outside range");
        job_manager.set_slash_bps(10001);
        job_manager.set_slash_bps(1000);
        assertEq(job_manager.slash_bps(), 1000);
        vm.stopPrank();
    }

    function test_add_verifier_only_owner() public {
        vm.prank(address(1000));
        vm.expectRevert();
        job_manager.add_verifier(2, address(1));
        vm.prank(owner);
        job_manager.add_verifier(2, address(1));
    }

    function test_add_verifier_fail_zero_address() public {
        vm.prank(owner);
        vm.expectRevert("Null address not allowed");
        job_manager.add_verifier(3, address(0));
    }
    address public verifier=address(1e5);
    function test_add_verifier_normal_mechanics() public {
        vm.prank(owner);
        job_manager.add_verifier(2, verifier);
        (bool verified, bool is_active, ,,uint locked, uint staked, uint16 category, ,)=job_manager.verifiers(verifier);
        assertEq(staked, 0);
        assertEq(locked, 0);
        assertTrue(is_active);
        assertTrue(verified);
        assertEq(category, 2);
    }

    function test_add_verifier_fail_registered() public {
        test_add_verifier_normal_mechanics();
        vm.prank(owner);
        vm.expectRevert("already added");
        job_manager.add_verifier(2, verifier);
    }


    function test_stake_fail_zero_amount() public {
        vm.prank(verifier);
        vm.expectRevert("zero stake");
        job_manager.stake(0);
    }
    function test_stake_fail_unverified() public {
        vm.prank(address(1000));
        vm.expectRevert("not a verifier");
        job_manager.stake(1e3);
    }

    function test_stake_normal_mechanics() public {
        test_add_verifier_normal_mechanics();
        vm.prank(treasure);
        rpt.transfer(verifier, 1e23);
        vm.prank(verifier);
        rpt.approve(address(job_manager), 1e23);
        uint prev_balance=rpt.balanceOf(verifier);
        vm.prank(verifier);
        job_manager.stake(1e21);
        (, bool is_active, ,,, uint staked,,,)=job_manager.verifiers(verifier);
        assertTrue(is_active);
        assertEq(staked, 1e21);
        assertEq(rpt.balanceOf(verifier), prev_balance-staked);
    }

    function test_inactive_fail_inactive() public {
        vm.prank(address(1000));
        vm.expectRevert("not working or allowed");
        job_manager.inactive_verifier();
        test_stake_normal_mechanics();
        vm.prank(verifier);
        job_manager.inactive_verifier();
        vm.prank(verifier);
        vm.expectRevert("not working or allowed");
        job_manager.inactive_verifier();
    }

    function test_inactive_normal_mechanics() public {
        test_stake_normal_mechanics();
        vm.prank(verifier);
        job_manager.inactive_verifier();
        (, bool is_active, ,,, uint staked,,,)=job_manager.verifiers(verifier);
        assertFalse(is_active);
        assertEq(staked, 0);
    }



}