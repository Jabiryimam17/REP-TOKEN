// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./VerifierSystem.sol";

contract JobPayingSystem is VerifierSystem {
    using SafeERC20 for IERC20;
    enum JOB_STATUS { NONE,OPEN, PENDING, HIRED, DISPUTED, CLOSED}
    // --- Events ---
    event job_posted(bytes32 indexed job_id, address indexed client, uint amount, uint category, uint level);
    event job_hired(bytes32 indexed job_id, address indexed client, address indexed freelancer);
    event job_accepted(bytes32 indexed job_id, address indexed freelancer);
    event job_completed(bytes32 indexed job_id, address indexed freelancer);
    event job_disputed(bytes32 indexed job_id, address indexed client, address indexed freelancer, bool stake_burnt);

    // --- Constants ---
    uint8 public constant VERIFIERS_RECYCLING_PER_JOB = 5;


    // token used for payments/stakes
    IERC20 public stable_coin;


    struct Freelancer {
        uint allowed_levels;
        uint successful_jobs;
        uint total_jobs;
    }

    // stake/level model
    uint public constant STAKE_DECIMAL = 1000; // denominators
    uint public constant VERIFIER_DECIMAL = 1000;
    uint public client_fee_portion_bps =200; // job fee that goes to the system treasure
    uint public freelancer_fee_portion_bps =50; // portion of verifier reward that goes to the freelancer who raised the dispute

    struct Level {
        uint min_verifiers_portion; // portion out of VERIFIER_DECIMAL
        uint freelancer_stake;         // portion out of STAKE_DECIMAL for freelancer
        uint client_stake;       // portion out of STAKE_DECIMAL for client
        uint max_amount;            // upper bound for this level
        uint payment_duration;      // appeal time in seconds
    }
    Level[] public levels;

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
    mapping(bytes32 => Job) private jobs;
    mapping(address => Freelancer) public freelancers;

    constructor(
        address coordinator,
        uint256 _subscription_id,
        address _treasure_address,
        address _stable_coin,
        address _reputation_token,
        address _access_manager
    ) VerifierSystem(_reputation_token, _treasure_address, coordinator, _subscription_id, _access_manager) {
        stable_coin=IERC20(_stable_coin);
    }
    function get_job_lists_len() public view returns(uint) {return job_lists.length;}

    function set_client_fee_portion(uint val) public restricted {client_fee_portion_bps=val;}

    // --- Owner utilities ---
    function append_level(Level calldata _level) external restricted {
        require(_level.min_verifiers_portion >0, "No verifiers system not allowed");
        require(_level.freelancer_stake > 0 && _level.client_stake >0, "Zero stake not allowed");
        require(levels.length == 0 || _level.max_amount > levels[levels.length-1].max_amount, "Sorting order should be respected");
        levels.push(_level);
    }

    function levels_size() public view returns (uint) {return levels.length;}
    function get_level(uint index) public view returns(Level memory) {return levels[index];}
    function register_freelancer(address freelancer, uint allowed_levels) external restricted {

        require(address(0)!=freelancer,"Zero address is not allowed");
        require(allowed_levels >= 0 && allowed_levels < levels.length,"No such level exists");
        require(freelancers[freelancer].total_jobs==0, "Already in work");
        freelancers[freelancer] = Freelancer(allowed_levels, 0, 0);
    }



    // --- Core flows ---
    uint public constant MIN_MAX_DURATION=3600*24;// 1 working day
    function post_job(uint amount, uint max_duration, uint8 category, uint fee_given) external nonReentrant {
        require(max_duration > MIN_MAX_DURATION,"Insufficient working time");
        require(amount > 0, "Amount must be > 0");
        require(amount <= levels[levels.length-1].max_amount, "No such payout allowed");
        
        uint fee = amount * client_fee_portion_bps / 10000;
        require(fee_given >= fee, "Insufficient fee provided");

        // Pull tokens from client. Client must call approve(contract, amount) first.
        stable_coin.safeTransferFrom(msg.sender, address(treasury), fee+amount);
        uint level = calculate_level(amount);
        uint client_stake=levels[level].client_stake;
        reputation_token.safeTransferFrom(msg.sender, address(treasury), client_stake);

        bytes32 job_id = keccak256(abi.encodePacked( block.timestamp, job_lists.length));
        Job storage new_job = jobs[job_id];
        DisputedJob storage disputed_job = disputed_jobs[job_id];
        new_job.client = msg.sender;
        new_job.amount = amount;
        new_job.max_duration = max_duration;
        new_job.level = level;

        disputed_job.category = category;
        disputed_job.client_stake=client_stake;

        new_job.status = JOB_STATUS.OPEN;

        job_lists.push(job_id);//untested
        emit job_posted(job_id, msg.sender, amount, category, new_job.level);
    }

    function get_job(bytes32 job_id) public view returns( Job memory
    ) {return jobs[job_id];}

    function cancel_job(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JOB_STATUS.OPEN, "Job not open");
        job.status = JOB_STATUS.CLOSED;
        if (job.amount > 0) treasury.pay_back_stable_coin(job.client, job.amount);
        treasury.pay_back_rpt(job.client, levels[job.level].client_stake);
    }

    function hire(bytes32 job_id, address freelancer) external {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can hire");
        require(job.status == JOB_STATUS.OPEN, "Job not open");
        require(msg.sender != freelancer, "Client cannot hire self");

        Freelancer memory worker = freelancers[freelancer];
        require(worker.allowed_levels!=0, "Not registered");// this prevents unregister users and zero address
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
        stable_coin.safeTransferFrom(msg.sender, address(treasury), fee);
        uint freelacner_stake=levels[job.level].freelancer_stake;
        reputation_token.safeTransferFrom(msg.sender, address(treasury), freelacner_stake);
        disputed_jobs[job_id].freelancer_stake=freelacner_stake;

        job.freelancer_approved = true;
        job.expiry_timestamp = block.timestamp + job.max_duration;
        freelancers[job.freelancer].total_jobs++;
        job.status = JOB_STATUS.HIRED;
        emit job_accepted(job_id, msg.sender);
    }

    function cancel_hire(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(block.timestamp > job.expiry_timestamp, "Time not expired");
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JOB_STATUS.HIRED, "Job not hired");
        require(!job.freelancer_completed, "Freelancer already completed");

        
        job.freelancer = address(0);
        job.freelancer_approved=false;
        job.status = JOB_STATUS.OPEN;
        job.expiry_timestamp=0;
    }

    function complete_job(bytes32 job_id) external {
        Job storage job = jobs[job_id];
        require(job.expiry_timestamp >= block.timestamp, "Time expired");
        require(job.status == JOB_STATUS.HIRED, "Job not hired");
        require(job.freelancer == msg.sender, "Only hired freelancer can complete");
        require(!job.freelancer_completed,"Already completed job");//can be used to prolong appeal time
        job.freelancer_completed = true;
        job.appeal_time = block.timestamp + levels[job.level].payment_duration;
        emit job_completed(job_id, msg.sender);
    }

    function pay_him(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can pay");
        require(job.freelancer_completed, "Freelancer not completed");
        job.status = JOB_STATUS.CLOSED;
        address freelancer=job.freelancer;
        freelancers[freelancer].successful_jobs++;
        uint level = job.level;
        treasury.pay_back_rpt(job.client, levels[level].client_stake);
        treasury.pay_back_rpt(freelancer, levels[level].freelancer_stake);
        treasury.pay_back_stable_coin(freelancer, job.amount);
        
    }

    function raise_dispute(bytes32 job_id) external {
        Job storage job = jobs[job_id];
        // allow either client or freelancer to raise dispute depending on your policy
        require(msg.sender == job.freelancer || msg.sender == job.client, "Only involved parties can raise dispute");
        require(job.status == JOB_STATUS.HIRED, "Job not hired");
        require(block.timestamp<job.appeal_time, "Appeal time expired");
        uint level = job.level;
        uint stake_amount=levels[level].client_stake+levels[level].freelancer_stake;
        job.status = JOB_STATUS.DISPUTED;
        request_random_nums(false, job_id, stake_amount, levels[level].min_verifiers_portion);
        emit job_disputed(job_id, job.client, job.freelancer, false);
    }


    function claim_after_dispute(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        DisputedJob storage disputed_job = disputed_jobs[job_id];
        require(job.status == JOB_STATUS.DISPUTED, "Job not disputed");
        require(disputed_job.dispute_status==DISPUTE_STATUS.FREELANCER_WIN, "DisJopute not resolved in your favor");
        require(msg.sender == job.freelancer, "Only freelancer can claim");
        freelancers[job.freelancer].successful_jobs++;
        job.status=JOB_STATUS.CLOSED;
        treasury.pay_back_stable_coin(msg.sender, job.amount);
        treasury.pay_back_rpt(msg.sender, levels[job.level].freelancer_stake);
        
    }

    function refund_after_dispute(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        DisputedJob storage disputed_job = disputed_jobs[job_id];
        require(disputed_job.dispute_status==DISPUTE_STATUS.CLIENT_WIN, "Dispute not resolved in your favor");
        require(msg.sender == job.client, "Only client can refund");
        treasury.pay_back_stable_coin(msg.sender, job.amount);
        job.status=JOB_STATUS.CLOSED;
        treasury.pay_back_rpt(msg.sender,levels[job.level].client_stake);
        
    }



    // --- Helpers ---
    function calculate_level(uint256 amount) public view returns (uint256) {// we will make it private only public for testing
        require(levels.length > 0, "No levels configured");
        uint256 low = 0;
        uint256 high = levels.length - 1;
        while (low < high) {
            uint256 mid = low + (high - low) / 2;
            if (levels[mid].max_amount >= amount) high = mid;
            else low = mid + 1;
        }
        return low;
    }
}
