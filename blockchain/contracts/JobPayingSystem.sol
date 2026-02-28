// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVerifierSystem} from "./VerifierSystem.sol";
import {IRegistry} from "./Registry.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
interface Itreasury {
    function pay_back_rpt(address to, uint amount) external;
    function pay_back_stable_coin(address to, uint amount) external;
}
contract JobPayingSystem is AccessManaged, ReentrancyGuard {
    using SafeERC20 for IERC20;
    enum JOB_STATUS { NONE,OPEN, PENDING, HIRED, DISPUTED, CLOSED}

    event job_posted(bytes32 indexed job_id, address indexed client, uint amount, uint category, uint level);
    event job_hired(bytes32 indexed job_id, address indexed client, address indexed freelancer);
    event job_accepted(bytes32 indexed job_id, address indexed freelancer);
    event job_completed(bytes32 indexed job_id, address indexed freelancer);
    event job_disputed(bytes32 indexed job_id, address indexed client, address indexed freelancer, bool stake_burnt);
    event transfer_address(address indexed old_address, address indexed new_address);

    uint8 public constant VERIFIERS_RECYCLING_PER_JOB = 5;




    struct Freelancer {
        uint allowed_levels;
        uint successful_jobs;
        uint total_jobs;
        uint ongoing;
        bool verified;
    }
    uint public constant STAKE_DECIMAL = 1000; 
    uint public constant VERIFIER_DECIMAL = 1000;
    uint public client_fee_portion_bps =200; 
    uint public freelancer_fee_portion_bps =50;

    struct WLevel {
        uint min_verifiers_portion; 
        uint freelancer_stake;        
        uint client_stake;       
        uint max_amount;            
        uint payment_duration;  
    }   
    WLevel[] public work_levels;

    struct Job {
        address client;
        address freelancer;
        bool freelancer_approved;
        bool freelancer_completed;
        uint appeal_time;
        JOB_STATUS status;
        uint amount;
        uint max_duration;
        uint expiry_timestamp;
        uint level;
    }

    bytes32[] public job_lists;
    mapping(bytes32 => Job) public jobs;
    mapping(address => Freelancer) public freelancers;
    IRegistry public registry;
    constructor(
        address _registry,
        address _access_manager
    ) AccessManaged(_access_manager) {
        registry=IRegistry(_registry);
    }

   

    function get_job_lists_len() public view returns(uint) {return job_lists.length;}
    function _treasury() internal view returns(Itreasury) {
        return Itreasury(registry.get_treasury());
    }

    function _rpt() internal view returns(IERC20) {
        return IERC20(registry.get_rpt());
    }
    function _verifier() internal view returns(IVerifierSystem) {
        return IVerifierSystem(registry.get_verifier());
    }
    function set_client_fee_portion(uint val) public restricted {client_fee_portion_bps=val;}
    function update_level_freelancer(address freelancer, uint new_level) external restricted {
        require(freelancers[freelancer].verified, "Freelancer not registered");
        require(new_level < work_levels.length, "No such level");
        freelancers[freelancer].allowed_levels = new_level;
    }
    function reset_levels(WLevel[] calldata _levels) external restricted {
        delete work_levels;
        for (uint i=0; i<_levels.length; i++) {
            require(_levels[i].min_verifiers_portion >0, "No verifiers system not allowed");
            require(_levels[i].freelancer_stake > 0 && _levels[i].client_stake >0, "Zero stake not allowed");
            require(i==0 || _levels[i].max_amount > _levels[i-1].max_amount, "Sorting order should be respected");
            work_levels.push(_levels[i]);
        }

    }
    function update_level(WLevel calldata _level, uint index) external restricted {
        require(index < work_levels.length, "No such level");
        require(_level.min_verifiers_portion >0, "No verifiers system not allowed");
        require(_level.freelancer_stake > 0 && _level.client_stake >0, "Zero stake not allowed");
        if (index > 0) require(_level.max_amount > work_levels[index-1].max_amount, "Sorting order should be respected");
        if (index < work_levels.length-1) require(_level.max_amount < work_levels[index+1].max_amount, "Sorting order should be respected");
        work_levels[index] = _level;
    }
    function append_level(WLevel calldata _level) external restricted {
        require(_level.min_verifiers_portion >0, "No verifiers system not allowed");
        require(_level.freelancer_stake > 0 && _level.client_stake >0, "Zero stake not allowed");
        require(work_levels.length == 0 || _level.max_amount > work_levels[work_levels.length-1].max_amount, "Sorting order should be respected");
        work_levels.push(_level);
    }
    function _ethio_coin() internal view returns (IERC20) {
        return IERC20(registry.get_ethiocoin());
    }
    function levels_size() public view returns (uint) {return work_levels.length;}
    function get_level(uint index) public view returns(WLevel memory) {return work_levels[index];}
    function get_levels() public view returns(WLevel[] memory) {return work_levels;}
    function register_freelancer(address freelancer, uint allowed_levels) external restricted {

        require(address(0)!=freelancer,"Zero address is not allowed");
        require(allowed_levels >= 0 && allowed_levels < work_levels.length,"No such level exists");
        require(freelancers[freelancer].total_jobs==0, "Already in work");
        freelancers[freelancer] = Freelancer(allowed_levels, 0, 0, 0, true);
    }


    function transfer_freelancer(address new_free) external {
        require(address(0)!=new_free,"Zero address is not allowed");
        require(freelancers[msg.sender].verified && freelancers[msg.sender].ongoing == 0, "Old freelancer not in work");
        require(!freelancers[new_free].verified, "New freelancer already in work");
        freelancers[new_free] = freelancers[msg.sender];
        delete freelancers[msg.sender];
        emit transfer_address(msg.sender, new_free);
    }

    uint public constant MIN_MAX_DURATION=3600*24;
    function post_job(bytes32 job_id, uint amount, uint max_duration, uint8 category) external nonReentrant {
        require(max_duration > MIN_MAX_DURATION,"Insufficient working time");
        require(amount > 0, "Amount must be > 0");
        require(amount <= work_levels[work_levels.length-1].max_amount, "No such payout allowed");
        uint fee = amount * client_fee_portion_bps / 10000;


        _ethio_coin().safeTransferFrom(msg.sender, address(registry.get_treasury()), fee+amount);
        uint level = calculate_level(amount);
        uint client_stake= work_levels[level].client_stake;
        _rpt().safeTransferFrom(msg.sender, address(registry.get_treasury()), client_stake);

        Job storage new_job = jobs[job_id];
        new_job.client = msg.sender;
        new_job.amount = amount;
        new_job.max_duration = max_duration;
        new_job.level = level;
        new_job.status = JOB_STATUS.OPEN;

        uint freelancer_stake = work_levels[level].freelancer_stake;

        _verifier().post_job(job_id, category, client_stake, freelancer_stake);
        


        job_lists.push(job_id);
        emit job_posted(job_id, msg.sender, amount, category, new_job.level);
    }

    function get_job(bytes32 job_id) public view returns( Job memory
    ) {return jobs[job_id];}

    function cancel_job(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JOB_STATUS.OPEN, "Job not open");
        job.status = JOB_STATUS.CLOSED;
        if (job.amount > 0) _treasury().pay_back_stable_coin(job.client, job.amount);
        _treasury().pay_back_rpt(job.client, work_levels[job.level].client_stake);
    }
    function hire(bytes32 job_id, address freelancer) external {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can hire");
        require(job.status == JOB_STATUS.OPEN, "Job not open");
        require(msg.sender != freelancer, "Client cannot hire self");

        Freelancer memory worker = freelancers[freelancer];
        require(worker.allowed_levels!=0, "Not registered");
        require(worker.allowed_levels >= job.level, "Freelancer level insufficient");

        job.freelancer = freelancer;
        job.status = JOB_STATUS.PENDING;
        emit job_hired(job_id, msg.sender, freelancer);
    }

    function cancel_pending_hire(bytes32 job_id) external {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JOB_STATUS.PENDING, "Job not pending");

        job.freelancer = address(0);
        job.status = JOB_STATUS.OPEN;
    }

    function accept_job(bytes32 job_id) external {

        Job storage job = jobs[job_id];
        require(job.status == JOB_STATUS.PENDING, "Job not pending");
        require(job.freelancer == msg.sender, "Only invited freelancer can accept");
        uint fee = job.amount * freelancer_fee_portion_bps/10000;
        _ethio_coin().safeTransferFrom(msg.sender, address(registry.get_treasury()), fee);
        uint freelancer_stake = work_levels[job.level].freelancer_stake;
        _rpt().safeTransferFrom(msg.sender, address(registry.get_treasury()), freelancer_stake);

        job.freelancer_approved = true;
        job.expiry_timestamp = block.timestamp + job.max_duration;
        freelancers[job.freelancer].total_jobs++;
        job.status = JOB_STATUS.HIRED;
        freelancers[msg.sender].ongoing++;
        emit job_accepted(job_id, msg.sender);
    }

    function cancel_hire(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(block.timestamp > job.expiry_timestamp, "Time not expired");
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JOB_STATUS.HIRED, "Job not hired");
        require(!job.freelancer_completed, "Freelancer already completed");

        freelancers[job.freelancer].ongoing--;
        job.freelancer = address(0);
        job.freelancer_approved=false;
        job.status = JOB_STATUS.OPEN;
        job.expiry_timestamp=0;
    }

    function complete_job(bytes32 job_id)  external {
        Job storage job = jobs[job_id];
        require(job.expiry_timestamp >= block.timestamp, "Time expired");
        require(job.status == JOB_STATUS.HIRED, "Job not hired");
        require(job.freelancer == msg.sender, "Only hired freelancer can complete");
        require(!job.freelancer_completed,"Already completed job");
        job.freelancer_completed = true;
        job.appeal_time = block.timestamp + work_levels[job.level].payment_duration;
        emit job_completed(job_id, msg.sender);
    }

    function pay_freelancer(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can pay");
        require(job.freelancer_completed, "Freelancer not completed");
        job.status = JOB_STATUS.CLOSED;
        address freelancer=job.freelancer;
        freelancers[freelancer].successful_jobs++;
        uint level = job.level;
        _treasury().pay_back_rpt(job.client, work_levels[level].client_stake);
        _treasury().pay_back_rpt(freelancer, work_levels[level].freelancer_stake);
        _treasury().pay_back_stable_coin(freelancer, job.amount);
        freelancers[freelancer].ongoing--;
    }

    function raise_dispute(bytes32 job_id) external {
        Job storage job = jobs[job_id];
        require(msg.sender == job.freelancer || msg.sender == job.client, "Only involved parties can raise dispute");
        require(job.status == JOB_STATUS.HIRED, "Job not hired");
        require(block.timestamp<job.appeal_time, "Appeal time expired");
        uint level = job.level;
        uint stake_amount= work_levels[level].client_stake+ work_levels[level].freelancer_stake;
        job.status = JOB_STATUS.DISPUTED;
        _verifier().request_random_nums(false, job_id, stake_amount, work_levels[level].min_verifiers_portion);
        emit job_disputed(job_id, job.client, job.freelancer, false);
    }


    function claim_after_dispute(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        IVerifierSystem.DISPUTE_STATUS dispute_status=_verifier().get_dispute_status(job_id);
        require(job.status == JOB_STATUS.DISPUTED, "Job not disputed");
        require(dispute_status==IVerifierSystem.DISPUTE_STATUS.FREELANCER_WIN, "DisJopute not resolved in your favor");
        require(msg.sender == job.freelancer, "Only freelancer can claim");
        freelancers[job.freelancer].successful_jobs++;
        job.status=JOB_STATUS.CLOSED;
        _treasury().pay_back_stable_coin(msg.sender, job.amount);
        _treasury().pay_back_rpt(msg.sender, work_levels[job.level].freelancer_stake);
        freelancers[msg.sender].ongoing--;
    }

    function refund_after_dispute(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        IVerifierSystem.DISPUTE_STATUS dispute_status=_verifier().get_dispute_status(job_id);

        require(dispute_status==IVerifierSystem.DISPUTE_STATUS.CLIENT_WIN, "Dispute not resolved in your favor");
        require(msg.sender == job.client, "Only client can refund");
        _treasury().pay_back_stable_coin(msg.sender, job.amount);
        job.status=JOB_STATUS.CLOSED;
        _treasury().pay_back_rpt(msg.sender, work_levels[job.level].client_stake);
        freelancers[job.freelancer].ongoing--;
    }



    function calculate_level(uint256 amount) internal view returns (uint256) {
        require(work_levels.length > 0, "No levels configured");
        uint256 low = 0;
        uint256 high = work_levels.length - 1;
        while (low < high) {
            uint256 mid = low + (high - low) / 2;
            if (work_levels[mid].max_amount >= amount) high = mid;
            else low = mid + 1;
        }
        return low;
    }
}
