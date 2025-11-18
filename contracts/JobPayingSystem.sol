// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./VerifierSystem.sol";

contract JobPayingSystem is verifier_system, Ownable, ReentrancyGuard {

    enum JOB_STATUS { OPEN, HIRED_PENDING, HIRED, CLOSED, DISPUTED}
    // --- Events ---
    event job_posted(bytes32 indexed job_id, address indexed client, uint amount, uint category, uint levelId);
    event job_hired(bytes32 indexed job_id, address indexed client, address indexed freelancer);
    event job_accepted(bytes32 indexed job_id, address indexed freelancer);
    event job_completed(bytes32 indexed job_id, address indexed freelancer);
    event job_disputed(bytes32 indexed job_id, address indexed client, address indexed freelancer, bool stake_burnt);
    event request_sent(uint256 request_id, uint32 num_words);
    event request_fulfilled(uint256 request_id, uint256[] random_words);

    // --- Constants ---
    uint8 public constant VERIFIERS_RECYCLING_PER_JOB = 5;


    // token used for payments/stakes
    IERC20 public immutable reputation_token;
    IERC20 public immutable stable_coin;

    // category => list of verifiers
    mapping(uint => address[]) public verifiers;

    struct Freelancer {
        uint allowed_levels;
        uint successful_jobs;
        uint total_jobs;
    }

    // stake/level model
    uint public constant PENALTY_NOT_VERIFYING=1000;
    uint public constant STAKE_DECIMAL = 1000; // denominators
    uint public constant VERIFIER_DECIMAL = 1000;
    uint public client_fee_portion_bps =200; // portion of verifier reward that goes to the system treasure
    uint public freelancer_fee_portion_bps =50; // portion of verifier reward that goes to the freelancer who raised the dispute

    struct Level {
        uint min_verifiers_portion; // portion out of VERIFIER_DECIMAL
        uint free_stake_portion;         // portion out of STAKE_DECIMAL for freelancer
        uint client_stake_portion;       // portion out of STAKE_DECIMAL for client
        uint max_amount;            // upper bound for this level
        uint payment_duration;      // appeal time in seconds
        uint verifiers_duration;    // verifier response time in seconds
        uint verifier_reward;        // reward per verifier
    }
    Level[] public levels;

    struct Job {
        address client;
        address freelancer;
        bool freelancer_approved;
        bool freelancer_completed;
        uint appeal_time;
        uint disputes_raised;
        JOB_STATUS status;
        uint stakes_lost;
        uint free_stake;
        uint client_stake;
        uint amount;
        uint time_limit;
        uint expiry_timestamp;
        uint level_id;
        uint category;
    }

    bytes32[] public job_lists;
    mapping(bytes32 => Job) private jobs;
    mapping(address => Freelancer) public freelancers;

    constructor(
        address _token,
        address coordinator,
        uint256 subscription_id,
        address _treasure_address,
        address _stable_coin
    ) verifier_system(coordinator, subscription_id, _treasure_address){
        require(_token != address(0), "token address zero");
        reputation_token = IERC20(_token);
        stable_coin=IERC20(_stable_coin);
    }

    // --- Owner utilities ---
    function set_up_levels(Level[] memory _levels) external onlyOwner {
        delete levels;
        for (uint i = 0; i < _levels.length; i++) levels.push(_levels[i]);
    }

    function add_verifiers(address verifier, uint category) external onlyOwner {
        verifiers[category].push(verifier);
    }

    function register_freelancer(address freelancer, uint allowed_levels) external onlyOwner {
        freelancers[freelancer] = Freelancer(allowed_levels, 0, 0);
    }



    // --- Core flows ---
    function post_job(uint amount, uint max_duration, uint category, uint fee_given) external nonReentrant {
        uint fee = amount * client_fee_portion_bps / 10000;
        require(fee_given >= fee, "Insufficient fee provided");
        require(amount > 0, "Amount must be > 0");
        // Pull tokens from client. Client must call approve(contract, amount) first.
        require(stable_coin.transferFrom(msg.sender, treasury_address, fee), "fee transfer failed");
        uint level_id = calculate_level(amount);
        uint stake=(levels[level_id].client_stake_portion*amount)/STAKE_DECIMAL;
        require(stable_coin.transferFrom(msg.sender, treasury_address, amount), "payment transfer failed");
        require(reputation_token.transferFrom(msg.sender, treasury_address, stake), "token transfer failed");
        bytes32 job_id = keccak256(abi.encodePacked(msg.sender, block.timestamp, job_lists.length));
        Job storage new_job = jobs[job_id];
        DisputedJob storage disputed_job = disputed_jobs[job_id];
        new_job.client = msg.sender;
        new_job.amount = amount;
        new_job.time_limit = max_duration;
        new_job.level_id = level_id;

        disputed_job.dispute_fee_from_client = stake;
        disputed_job.category = category;
        uint category_verifiers = verifiers[category].length;
        uint number_verifiers = (levels[new_job.level_id].min_verifiers_portion * category_verifiers) / VERIFIER_DECIMAL;
        disputed_job.dispute_fee_from_freelancer=(levels[new_job.level_id].free_stake_portion*amount)/STAKE_DECIMAL;
        disputed_job.min_number_verifiers = number_verifiers;
        new_job.status = JOB_STATUS.OPEN;

        job_lists.push(job_id);
        emit job_posted(job_id, msg.sender, amount, category, new_job.level_id);
    }

    function cancel_job(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JOB_STATUS.OPEN, "Job not open");
        require(job.stakes_lost <= job.amount, "Invalid stakes lost");
        job.status = JOB_STATUS.CLOSED; // mark closed
        if (job.amount > 0) require(stable_coin.transfer(job.client, job.amount), "refund failed");
        if (disputed_jobs[job_id].stakes_lost < disputed_jobs[job_id].dispute_fee_from_client) { // to prevent a client from cancelling after crashing freelancers
            uint refund_stake = disputed_jobs[job_id].dispute_fee_from_client - disputed_jobs[job_id].stakes_lost;
            require(reputation_token.transfer(job.client, refund_stake), "return stake failed");
        }
    }

    function hire(bytes32 job_id, address freelancer) external {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can hire");
        require(job.status == JOB_STATUS.OPEN, "Job not open");
        require(msg.sender != freelancer, "Client cannot hire self");

        Freelancer storage worker = freelancers[freelancer];
        require(worker.allowed_levels >= job.level_id, "Freelancer level insufficient");

        job.freelancer = freelancer;
        job.status = JOB_STATUS.HIRED_PENDING;
        emit job_hired(job_id, msg.sender, freelancer);
    }

    function cancel_pending_hire(bytes32 job_id) external {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JOB_STATUS.HIRED_PENDING, "Job not pending");

        job.freelancer = address(0);
        job.status = JOB_STATUS.OPEN;

    }

    function accept_job(bytes32 job_id) external nonReentrant {

        Job storage job = jobs[job_id];
        uint fee = job.amount * freelancer_fee_portion_bps/10000;
        require(stable_coin.transferFrom(msg.sender, treasury_address, fee), "fee transfer failed");
        require(job.status == JOB_STATUS.HIRED_PENDING, "Job not pending");
        require(job.freelancer == msg.sender, "Only invited freelancer can accept");

        uint stake_amount = (levels[job.level_id].free_stake_portion * job.amount) / STAKE_DECIMAL;
        require(reputation_token.transferFrom(msg.sender, treasury_address, stake_amount), "stake transfer failed");

        job.freelancer_approved = true;
        job.status = JOB_STATUS.HIRED;

        job.expiry_timestamp = block.timestamp + job.time_limit;
        freelancers[job.freelancer].total_jobs++;

        emit job_accepted(job_id, msg.sender);
    }

    function cancel_hire(bytes32 job_id, bool should_return_stake) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JOB_STATUS.HIRED, "Job not hired");
        require(block.timestamp > job.expiry_timestamp, "Time not expired");
        require(!job.freelancer_completed, "Freelancer already completed");

        job.freelancer = address(0);
        job.freelancer_approved=false;
        job.status = JOB_STATUS.OPEN;

        if (job.free_stake > 0 && should_return_stake) {
            require(reputation_token.transfer(job.freelancer, disputed_jobs[job_id].dispute_fee_from_freelancer), "return stake failed");
        }
    }

    function complete_job(bytes32 job_id) external {
        Job storage job = jobs[job_id];
        require(job.status == JOB_STATUS.HIRED, "Job not hired");
        require(job.freelancer == msg.sender, "Only hired freelancer can complete");

        job.freelancer_completed = true;
        job.appeal_time = block.timestamp + levels[job.level_id].payment_duration;
        emit job_completed(job_id, msg.sender);
    }

    function pay_him(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can pay");
        require(job.status == JOB_STATUS.HIRED, "Job not in hired state");
        require(job.freelancer_completed, "Freelancer not completed");

        uint payout = job.amount + job.free_stake;
        job.status = JOB_STATUS.CLOSED;
        freelancers[job.freelancer].successful_jobs++;
        require(reputation_token.transfer(job.client, job.client_stake), "return client stake failed");
        require(reputation_token.transfer(job.freelancer, payout), "payout failed");
    }

    function raise_dispute(bytes32 job_id) external {
        Job storage job = jobs[job_id];
        DisputedJob storage disputed_job = disputed_jobs[job_id];
        // allow either client or freelancer to raise dispute depending on your policy
        require(msg.sender == job.freelancer || msg.sender == job.client, "Only involved parties can raise dispute");
        require(job.status == JOB_STATUS.HIRED, "Job not hired");
        require(job.freelancer_completed, "Freelancer not completed");
        require(block.timestamp<job.appeal_time, "Appeal time expired");
        job.disputes_raised++;
        job.status = JOB_STATUS.DISPUTED;
        if (job.disputes_raised%VERIFIERS_RECYCLING_PER_JOB == 0) {
            request_random_nums(false, job_id);
        }
        emit job_disputed(job_id, job.client, job.freelancer, false);
    }


    function claim_my_pay_after_dispute(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        DisputedJob storage disputed_job = disputed_jobs[job_id];
        require(job.status == JOB_STATUS.DISPUTED, "Job not disputed");
        require(disputed_job.dispute_status==DISPUTE_STATUS.FREELANCER_WIN, "Dispute not resolved in your favor");
        require(msg.sender == job.freelancer, "Only freelancer can claim");
        stable_coin.transfer(msg.sender, job.amount);
        reputation_token.transfer(msg.sender, disputed_job.dispute_fee_from_freelancer);
        job.status=JOB_STATUS.CLOSED;
    }

    function refund_client_after_dispute(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        DisputedJob storage disputed_job = disputed_jobs[job_id];
        require(job.status == JOB_STATUS.DISPUTED, "Job not disputed");
        require(disputed_job.dispute_status==DISPUTE_STATUS.CLIENT_WIN, "Dispute not resolved in your favor");
        require(msg.sender == job.client, "Only client can refund");
        stable_coin.transfer(msg.sender, job.amount);
        reputation_token.transfer(msg.sender, disputed_job.dispute_fee_from_client);
        job.status=JOB_STATUS.CLOSED;
    }



    // --- Helpers ---
    function calculate_level(uint256 amount) internal view returns (uint256) {
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
    // read-only getter for jobs (returns a subset because Job contains mapping)
    function get_job_summary(bytes32 job_id) external view returns (
        address client,
        address freelancer,
        uint amount,
        JOB_STATUS status,
        uint level_id,
        uint category
    ) {
        Job storage job = jobs[job_id];
        return (
            job.client,
            job.freelancer,
            job.amount,
            job.status,
            job.level_id,
            job.category
        );
    }
}
