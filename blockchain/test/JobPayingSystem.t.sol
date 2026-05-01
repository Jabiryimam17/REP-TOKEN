// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {JobPayingSystem as Manager} from "../contracts/JobPayingSystem.sol";
import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {EthioCoin} from "../contracts/EthioCoin.sol";
import {Registry} from "../contracts/Registry.sol";
import {Treasury} from "../contracts/Treasury.sol";
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

    Registry public registry;
    Treasury public treasury;

    function setUp() public {
        vm.startPrank(owner);
        access_manager = new AccessManager(owner);
        registry = new Registry(address(access_manager));
        eth = new EthioCoin();
        rpt = new ReputationToken(address(access_manager));
        treasury = new Treasury(address(registry), address(access_manager));
        job_manager = new Manager(address(registry), address(access_manager));

        registry.set_ethiocoin(address(eth));
        registry.set_rpt(address(rpt));
        registry.set_treasury(address(treasury));
        registry.set_job_manager(address(job_manager));

        // Transfer some initial supply to treasury for paybacks
        eth.transfer(address(treasury), 1000000 * 1e18);
        rpt.transfer(address(treasury), 1000000 * 1e18);

        vm.stopPrank();
    }


    // TESTING LEVEL INITIALIZATION AND UPDATE SYSTEM
    function test_only_owner_leveling() public {
        vm.prank(address(5));
        vm.expectRevert();
        Manager.w_level memory level=Manager.w_level(10,10,10,1000,1000);
        job_manager.append_level(level);
        vm.prank(owner);
        job_manager.append_level(level);
    }
    function test_fail_no_verifiers_leveling() public {
        Manager.w_level memory level= Manager.w_level(0,10,10,1000, 1000);
        vm.prank(owner);
        vm.expectRevert(); // Manager.ZeroVerifiers(0) or similar
        job_manager.append_level(level);
    }



    function test_fail_no_stake_leveling() public {
        Manager.w_level memory level = Manager.w_level(10, 0,10,1000,1000);
        vm.prank(owner);
        vm.expectRevert();
        job_manager.append_level(level);
    }

    function test_normal_mechanics_leveling() public {
        uint prev_len=job_manager.get_levels().length;
        vm.startPrank(owner);
        Manager.w_level memory level=Manager.w_level(10,10,10,1000,1000);
        job_manager.append_level(level);
        Manager.w_level[] memory levels = job_manager.get_levels();
        Manager.w_level memory c_level= levels[prev_len];
        assertEq(c_level.payment_duration, level.payment_duration);
        assertEq(c_level.client_stake, level.client_stake);
        assertEq(c_level.freelancer_stake, level.freelancer_stake);
        assertEq(c_level.verifiers_cnt, level.verifiers_cnt);
        assertEq(c_level.max_amount, level.max_amount);
        vm.stopPrank();
    }

    function test_sorted_order_leveling() public {
        test_normal_mechanics_leveling();
        vm.startPrank(owner);
        vm.expectRevert();
        Manager.w_level memory level=Manager.w_level(12, 10,100, 100,100);
        job_manager.append_level(level);
        level.max_amount=1e20;
        uint prev_len=job_manager.get_levels().length;
        job_manager.append_level(level);
        assertEq(job_manager.get_levels().length, prev_len+1);
        vm.stopPrank();
    }

    // TESTING FREELANCER REGISTRATION
    function test_only_owner_registration() public {
        test_normal_mechanics_leveling();
        vm.prank(address(10));
        vm.expectRevert();
        job_manager.register_freelancer(address(11));
        vm.prank(owner);
        job_manager.register_freelancer(address(11));
    }

    function test_fail_zero_address() public {
        vm.prank(owner);
        vm.expectRevert();
        job_manager.register_freelancer(address(0));
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
        Manager.w_level memory level = Manager.w_level({
            verifiers_cnt: 5,
            freelancer_stake: 5*1e18,
            client_stake: 100*1e18,
            max_amount: 500*1e18,
            payment_duration: day * 8        // 7 + 1
        });

        vm.startPrank(owner);
        job_manager.append_level(level);

        level = Manager.w_level({
            verifiers_cnt: 15,
            freelancer_stake: 100*1e18,
            client_stake: 500*1e18,
            max_amount: 2500*1e18,
            payment_duration: day * 10       // 7 + 3
        });
        job_manager.append_level(level);

        level = Manager.w_level({
            verifiers_cnt: 25,
            freelancer_stake: 200*1e18,
            client_stake: 1000*1e18,
            max_amount: 10000*1e18,
            payment_duration: day * 12       // 7 + 5
        });
        job_manager.append_level(level);

        level = Manager.w_level({
            verifiers_cnt: 40,
            freelancer_stake: 500*1e18,
            client_stake: 5000*1e18,
            max_amount: 25000*1e18,
            payment_duration: day * 14       // 7 + 7
        });
        job_manager.append_level(level);

        level = Manager.w_level({
            verifiers_cnt: 60,
            freelancer_stake: 1000*1e18,
            client_stake: 10000*1e18,
            max_amount: 75000*1e18,
            payment_duration: day * 17       // 7 + 10
        });
        job_manager.append_level(level);

        level = Manager.w_level({
            verifiers_cnt: 75,
            freelancer_stake: 2000*1e18,
            client_stake: 25000*1e18,
            max_amount: 200000*1e18,
            payment_duration: day * 37       // 7 + 30
        });
        job_manager.append_level(level);

        vm.stopPrank();
    }


    function prepare_poster() public {
        vm.prank(owner);
        rpt.transfer(f_client, 1e22);
        vm.prank(owner);
        eth.transfer(f_client, 1e22);
    }
    function test_fail_insufficient_working_duration() public {
        prepare_poster();
        prepare_levels();
        vm.prank(f_client);
        vm.expectRevert();
        job_manager.post_job(keccak256("1"), 5e18, 3600, 1);
    }
    function prepare_everything() public {
        prepare_levels();
        prepare_poster();
    }

    function test_fail_zero_pay() public {
        prepare_everything();
        vm.prank(f_client);
        vm.expectRevert();
        job_manager.post_job(keccak256("1"), 0, day*2, 1);
    }

    function test_fail_insufficient_fee() public {
        prepare_everything();
        uint amount=5e18;

        vm.startPrank(f_client);
        eth.approve(address(job_manager), amount); // No fee approved
        vm.expectRevert();
        job_manager.post_job(keccak256("1"), amount, day*2, 1);
        vm.stopPrank();
    }

    function calculate_level(uint256 amount) internal view returns (uint256) {
        Manager.w_level[] memory work_levels = job_manager.get_levels();
        if (work_levels.length == 0) revert("No levels");
        uint256 low = 0;
        uint256 high = work_levels.length - 1;
        while (low < high) {
            uint256 mid = low + (high - low) / 2;
            if (work_levels[mid].max_amount >= amount) high = mid;
            else low = mid + 1;
        }
        return low;
    }

    function test_post_job_mechanics() public {
        prepare_everything();
        vm.startPrank(f_client);
        uint amount=5e18;
        uint fee=amount*job_manager.client_fee_portion_bps()/10000;
        
        eth.approve(address(job_manager), amount + fee);
        
        uint level_idx = calculate_level(amount);
        Manager.w_level memory level = job_manager.get_levels()[level_idx];
        rpt.approve(address(job_manager), level.client_stake);

        bytes32 job_id=keccak256("job1");
        
        uint prev_treasure_token=rpt.balanceOf(address(treasury));
        uint prev_treasure_dollar=eth.balanceOf(address(treasury));

        job_manager.post_job(job_id, amount, day*2, 1);
        
        (client_addr, freelancer_addr, f_stake, job_client_stake,,,,, job_amount,,, ) = job_manager.jobs(job_id);
        
        assertEq(job_amount, amount);
        assertEq(status == Manager.JOB_STATUS.OPEN, true);
        assertEq(rpt.balanceOf(address(treasury)), prev_treasure_token+level.client_stake);
        assertEq(eth.balanceOf(address(treasury)), prev_treasure_dollar+amount+fee);
        vm.stopPrank();
    }
    function create_job() public returns(bytes32) {
        prepare_everything();
        vm.startPrank(f_client);
        uint amount=5e18;
        uint fee=amount*job_manager.client_fee_portion_bps()/10000;
        eth.approve(address(job_manager), amount + fee);
        uint level_idx = calculate_level(amount);
        Manager.w_level memory level = job_manager.get_levels()[level_idx];
        rpt.approve(address(job_manager), level.client_stake);
        bytes32 job_id=keccak256("job1");
        job_manager.post_job(job_id, amount, day*2, 1);
        vm.stopPrank();
        return job_id;
    }
    function test_cancel_only_client() public {
        bytes32 job_id=create_job();
        vm.startPrank(l_client);
        vm.expectRevert();
        job_manager.cancel_job(job_id);
        vm.stopPrank();
    }
    
    Manager.JOB_STATUS public status;

    address public client_addr;
    uint256 public job_amount;
    address public freelancer_addr;
    uint256 public f_stake;
    uint256 public job_client_stake;

    function test_cancel_job_normal_mechanics() public {
        bytes32 job_id=create_job();
        (client_addr,,,,,,, status, job_amount, job_client_stake, ,) = job_manager.jobs(job_id);
        
        uint prev_balance=eth.balanceOf(client_addr);
        uint prev_token=rpt.balanceOf(client_addr);
        
        vm.startPrank(client_addr);
        job_manager.cancel_job(job_id);
        (,,,,,,, status,,,,) = job_manager.jobs(job_id);
        assert(status==Manager.JOB_STATUS.CLOSED);
        assertEq(eth.balanceOf(client_addr), prev_balance + job_amount);
        assertEq(rpt.balanceOf(client_addr), prev_token + job_client_stake);
        vm.stopPrank();
    }

    function test_hire_only_client() public {
        bytes32 job_id=create_job();
        vm.prank(l_client);
        vm.expectRevert();
        job_manager.hire(job_id, address(9));
    }

    function test_hire_fail_self_employment() public {
        bytes32 job_id=create_job();
        vm.prank(f_client);
        vm.expectRevert();
        job_manager.hire(job_id, f_client);
    }
    address public worker=address(100);

    function test_hire_fail_unregistered_worker() public {
        bytes32 job_id=create_job();
        vm.prank(f_client);
        vm.expectRevert();
        job_manager.hire(job_id,worker);
    }

    function test_hire_normal_mechanics() public returns(bytes32) {
        bytes32 job_id=create_job();
        vm.prank(owner);
        job_manager.register_freelancer(worker);
        vm.startPrank(f_client);
        job_manager.hire(job_id, worker);
        (,,,,,,, status,,,,) = job_manager.jobs(job_id);
        assertEq(status == Manager.JOB_STATUS.PENDING, true);
        vm.stopPrank();
        return job_id;
    }

    function test_cancel_pending_hire_only_client() public {
        bytes32 job_id=test_hire_normal_mechanics();
        vm.prank(l_client);
        vm.expectRevert();
        job_manager.cancel_pending_hire(job_id);
    }

    function test_cancel_pending_normal_mechanics() public {
        bytes32 job_id=test_hire_normal_mechanics();
        vm.startPrank(f_client);
        job_manager.cancel_pending_hire(job_id);
        (,,,,,,, status,,,,) = job_manager.jobs(job_id);
        assertEq(status == Manager.JOB_STATUS.OPEN, true);
        vm.stopPrank();
    }

    function test_accept_normal_mechanics() public returns(bytes32) {
        bytes32 job_id=test_hire_normal_mechanics();
        (,,,,,,,, job_amount, , ,) = job_manager.jobs(job_id);
        uint level_idx = calculate_level(job_amount);
        Manager.w_level memory level = job_manager.get_levels()[level_idx];

        vm.prank(owner);
        eth.transfer(worker, 1e22);
        vm.prank(owner);
        rpt.transfer(worker, 1e22);

        vm.startPrank(worker);
        uint fee = job_amount * job_manager.freelancer_fee_portion_bps() / 10000;
        eth.approve(address(job_manager), fee);
        rpt.approve(address(job_manager), level.freelancer_stake);
        
        job_manager.accept_job(job_id);
        (,,,,,,, status,,,,) = job_manager.jobs(job_id);
        assertEq(status == Manager.JOB_STATUS.HIRED, true);
        vm.stopPrank();
        return job_id;
    }

    function test_cancel_hire_only_client()  public {
        bytes32 job_id=test_accept_normal_mechanics();
        (,,,,,,,,, , uint expiry,) = job_manager.jobs(job_id);
        vm.warp(expiry + 100);
        vm.prank(l_client);
        vm.expectRevert();
        job_manager.cancel_hire(job_id);
    }
    function test_cancel_hire_after_expiry() public {
        bytes32 job_id=test_accept_normal_mechanics();
        vm.prank(f_client);
        vm.expectRevert();
        job_manager.cancel_hire(job_id);
    }

    function test_cancel_hire_normal_mechanics() public {
        bytes32 job_id=test_accept_normal_mechanics();
        (,,,,,,,,, , uint expiry,) = job_manager.jobs(job_id);
        vm.warp(expiry + 1);
        vm.prank(f_client);
        job_manager.cancel_hire(job_id);
        (,,,,,,, status,,,,) = job_manager.jobs(job_id);
        assertEq(status == Manager.JOB_STATUS.OPEN, true);
    }

    function test_complete_job_only_worker() public {
        bytes32 job_id=test_accept_normal_mechanics();
        vm.prank(address(50));
        vm.expectRevert();
        job_manager.complete_job(job_id);
    }

    function test_complete_job_fail_expire() public {
        bytes32 job_id=test_accept_normal_mechanics();
        (,,,,,,,,, , uint expiry,) = job_manager.jobs(job_id);
        vm.warp(expiry + 1);
        vm.prank(worker);
        vm.expectRevert();
        job_manager.complete_job(job_id);
    }

    function test_complete_job_normal_mechanics() public returns(bytes32) {
        bytes32 job_id=test_accept_normal_mechanics();
        vm.prank(worker);
        job_manager.complete_job(job_id);
        (,,,,,,, status,,,,) = job_manager.jobs(job_id);
        assertEq(status == Manager.JOB_STATUS.COMPLETED, true);
        return job_id;
    }

    function test_pay_freelancer_only_client() public {
        bytes32 job_id=test_complete_job_normal_mechanics();
        vm.prank(worker);
        vm.expectRevert();
        job_manager.pay_freelancer(job_id);
    }

    function test_pay_freelancer_normal_mechanics() public {
        bytes32 job_id=test_complete_job_normal_mechanics();
        (client_addr, freelancer_addr, f_stake, job_client_stake,,,,, job_amount,,,) = job_manager.jobs(job_id);
        
        uint prev_token_client=rpt.balanceOf(client_addr);
        uint prev_token_freelancer=rpt.balanceOf(freelancer_addr);
        uint prev_balance_freelancer=eth.balanceOf(freelancer_addr);

        vm.prank(client_addr);
        job_manager.pay_freelancer(job_id);
        
        (,,,,,,, status,,,,) = job_manager.jobs(job_id);
        assert(status==Manager.JOB_STATUS.CLOSED);
        assertEq(rpt.balanceOf(client_addr), prev_token_client + job_client_stake);
        assertEq(rpt.balanceOf(freelancer_addr), prev_token_freelancer + f_stake);
        assertEq(eth.balanceOf(freelancer_addr), prev_balance_freelancer + job_amount);
    }
}