// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./RandomValuesGenerator.sol";



contract JobPayingSystem is RandomValuesGenerator, Ownable, ReentrancyGuard {

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
    uint8 public constant MAX_VERIFIERS_REQUEST = 20;
    uint8 public constant VERIFIERS_RECYCLING_PER_JOB = 5;


    // token used for payments/stakes
    IERC20 public immutable token;

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
    uint public constant VERIFIER_DECIMAL = 100;

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
        uint min_verifiers;
        uint time_limit;
        uint expiry_timestamp;
        uint reveal_expire_timestamp;
        uint level_id;
        uint category;
        uint verifiers_expired;
        mapping(address=>bytes32) hashed_decisions;
        address[] approvers;
        address[] chosen_verifiers;
        address[] disapprovers;
        mapping(address => bool) verifiers_allowed;
    }

    bytes32[] public job_lists;
    mapping(uint256 => bytes32) public verifierRequests; // vrfRequestId => job_id
    mapping(bytes32 => Job) private jobs;
    mapping(address => Freelancer) public freelancers;

    constructor(
        address _token,
        address coordinator,
        uint256 subscription_id
    ) RandomValuesGenerator(coordinator, subscription_id) {
        require(_token != address(0), "token address zero");
        token = IERC20(_token);
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

    // --- VRF request wrapper (uses RandomValuesGenerator implementation) ---
    function request_random_nums(
        bool enable_native_payment,
        uint32 number_verifiers,
        bytes32 job_id
    ) public onlyOwner {
        require(number_verifiers <= MAX_VERIFIERS_REQUEST, "Too many verifiers requested");
        Job storage job = jobs[job_id];
        require(verifiers[job.category].length >= number_verifiers, "Not enough verifiers in category");

        // The actual call relies on RandomValuesGenerator implementation.
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: key_hash,
                subId: s_subscription_id,
                requestConfirmations: request_confirmations,
                callbackGasLimit: callback_gas_limit,
                numWords: number_verifiers,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: enable_native_payment})
                )
            })
        );

        verifierRequests[requestId] = job_id;
        emit request_sent(requestId, number_verifiers);
    }

    // VRF callback - must match signature in RandomValuesGenerator
    function fulfillRandomWords(uint256 requestId, uint256[] calldata random_values) internal override {
        bytes32 job_id = verifierRequests[requestId];
        Job storage job = jobs[job_id];
        address[] storage potential = verifiers[job.category];

        require(potential.length >= random_values.length, "Not enough verifiers available");

        // clear previous flags for those potential verifiers
        for (uint256 i = 0; i < potential.length; i++) {
            job.verifiers_allowed[potential[i]] = false;
        }

        bool[] memory used = new bool[](potential.length);
        for (uint256 i = 0; i < random_values.length; i++) {
            uint256 r = random_values[i] % potential.length;
            while (used[r]) r = (r + 1) % potential.length;
            used[r] = true;
            job.verifiers_allowed[potential[r]] = true;
        }

        emit request_fulfilled(requestId, random_values);
    }

    // --- Core flows ---
    function post_job(uint amount, uint max_duration, uint category) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        // Pull tokens from client. Client must call approve(contract, amount) first.
        uint level_id = calculate_level(amount);
        uint stake=(levels[level_id].client_stake_portion*amount)/STAKE_DECIMAL;
        uint total_amount=amount+stake;
        require(token.transferFrom(msg.sender, address(this), total_amount), "token transfer failed");
        bytes32 job_id = keccak256(abi.encodePacked(msg.sender, block.timestamp, job_lists.length));
        Job storage new_job = jobs[job_id];
        new_job.client = msg.sender;
        new_job.amount = amount;
        new_job.client_stake = stake;
        new_job.category = category;
        new_job.time_limit = max_duration;
        new_job.level_id = level_id;
        uint category_verifiers = verifiers[category].length;
        uint number_verifiers = 0;
        if (levels.length > 0 && category_verifiers > 0) {
            number_verifiers = (levels[new_job.level_id].min_verifiers_portion * category_verifiers) / VERIFIER_DECIMAL;
        }
        new_job.free_stake=(levels[new_job.level_id].free_stake_portion*amount)/STAKE_DECIMAL;
        new_job.min_verifiers = number_verifiers;
        new_job.status = JOB_STATUS.OPEN;

        job_lists.push(job_id);
        emit job_posted(job_id, msg.sender, amount, category, new_job.level_id);
    }

    function cancel_job(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JOB_STATUS.OPEN, "Job not open");
        require(job.stakes_lost <= job.amount, "Invalid stakes lost");
        uint refund = job.amount - job.stakes_lost;
        job.status = JOB_STATUS.CLOSED; // mark closed
        if (refund > 0) require(token.transfer(job.client, refund), "refund failed");
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
//    modifier ClientOnly(bytes32 job_id) {
//        Job storage job = jobs[job_id];
//        require(job.client == msg.sender, "Only client can call");
//        _;
//    }
//    modifier FreelancerOnly(bytes32 job_id) {
//        Job storage job = jobs[job_id];
//        require(job.freelancer == msg.sender, "Only freelancer can call");
//        _;
//    }
    function cancel_pending_hire(bytes32 job_id) external {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can cancel");
        require(job.status == JOB_STATUS.HIRED_PENDING, "Job not pending");

        job.freelancer = address(0);
        job.status = JOB_STATUS.OPEN;

    }

    function accept_job(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.status == JOB_STATUS.HIRED_PENDING, "Job not pending");
        require(job.freelancer == msg.sender, "Only invited freelancer can accept");

        uint stake_amount = (levels[job.level_id].free_stake_portion * job.amount) / STAKE_DECIMAL;
        require(token.transferFrom(msg.sender, address(this), stake_amount), "stake transfer failed");

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

        if (job.free_stake > 0) {
            if (should_return_stake) require(token.transfer(job.freelancer, job.free_stake), "return stake failed");
            else require(token.transfer(address(0), job.free_stake), "burn stake failed");
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
        require(token.transfer(job.client, job.client_stake), "return client stake failed");
        require(token.transfer(job.freelancer, payout), "payout failed");
    }

    function raise_dispute(bytes32 job_id) external {
        Job storage job = jobs[job_id];
        // allow either client or freelancer to raise dispute depending on your policy
        require(msg.sender == job.freelancer || msg.sender == job.client, "Only involved parties can raise dispute");
        require(job.status == JOB_STATUS.HIRED, "Job not hired");
        require(job.freelancer_completed, "Freelancer not completed");
        require(block.timestamp<job.appeal_time, "Appeal time expired");
        job.disputes_raised++;
        job.status = JOB_STATUS.DISPUTED;
        job.verifiers_expired=levels[job.level_id].verifiers_duration+block.timestamp;
        job.reveal_expire_timestamp=job.verifiers_expired+levels[job.level_id].verifiers_duration;
        if (job.disputes_raised%VERIFIERS_RECYCLING_PER_JOB == 0) {
            request_random_nums(false, job.min_verifiers, job_id);
        }
        emit job_disputed(job_id, job.client, job.freelancer, false);
    }

    // verifiers approve the completed work
    function approve_job(bytes32 job_id, bytes32 hashed_decision) external {
        Job storage job = jobs[job_id];
        require(job.status == JOB_STATUS.DISPUTED, "Job not hired");
        require(job.verifiers_allowed[msg.sender], "Not an authorized verifier");
        require(job.verifiers_expired > block.timestamp, "Verifier time expired");
        require(job.hashed_decisions[msg.sender]==bytes32(0), "Decision already submitted");
        job.verifiers_allowed[msg.sender] = false; // one-time use
        job.hashed_decisions[msg.sender]=hashed_decision;
    }

    function reveal_decision(bytes32 job_id, bool approve, bytes32 salt) external {
        Job storage job = jobs[job_id];
        require(job.status == JOB_STATUS.DISPUTED, "Job not disputed");
        require(job.verifiers_expired < block.timestamp, "Verifier time not yet expired");
        require(job.reveal_expire_timestamp > block.timestamp, "Reveal time expired");
        bytes32 hashed_decision = keccak256(abi.encodePacked(job_id,approve, salt));

        require(job.hashed_decisions[msg.sender]==hashed_decision, "No matching hashed decision found");
        job.hashed_decisions[msg.sender]=bytes32(0); // prevent re-entrancy
        if (approve) job.approvers.push(msg.sender);
        else job.disapprovers.push(msg.sender);
    }
    // Freelancer can request payment after expiry if verifiers not required or already approved
    function pay_me(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.status == JOB_STATUS.DISPUTED, "Job not in hired state");
        require(job.freelancer == msg.sender, "Only freelancer can request");
        require(job.verifiers_expired <= block.timestamp, "Time limit not yet expired");
        require(job.approvers.length >= job.disapprovers.length, "Not enough approvers");
        uint payout = job.amount + job.free_stake;
        uint stake_per_verifier = job.client_stake/job.chosen_verifiers.length;
        payout_verifiers(job.approvers,job.disapprovers, job.chosen_verifiers, stake_per_verifier);
        job.status = JOB_STATUS.CLOSED;
        freelancers[job.freelancer].successful_jobs++;
        require(token.transfer(job.freelancer, payout), "payout failed");
    }
    // Client refutes after expiry
    function refute_job_after_expire(bytes32 job_id) external nonReentrant {
        Job storage job = jobs[job_id];
        require(job.client == msg.sender, "Only client can refute");
        require(job.status == JOB_STATUS.DISPUTED, "Job not hired");
        require(job.verifiers_expired <= block.timestamp, "Time limit not yet expired");
        require(job.disapprovers.length > job.chosen_verifiers.length, "Not enough disapprovers");
        uint penalty_per_verifier = job.free_stake/job.disapprovers.length;
        payout_verifiers(job.disapprovers, job.approvers,job.chosen_verifiers, penalty_per_verifier);
        require(token.transfer(job.client, job.client_stake), "return client stake failed");

        job.status = JOB_STATUS.OPEN;
    }

    function payout_verifiers(address[] storage winners, address[] storage losers, address[] storage chosen_verifiers, uint reward_per_verifier) internal {
        for (uint i=0; i < chosen_verifiers.length; i++) require(token.transferFrom(chosen_verifiers[i], address(this), PENALTY_NOT_VERIFYING), "verifier penalty transfer failed");
        for (uint i = 0; i < winners.length; i++) require(token.transfer(winners[i], reward_per_verifier+PENALTY_NOT_VERIFYING), "verifier payout failed");
        for (uint i=0; i < losers.length; i++) require(token.transfer(losers[i], PENALTY_NOT_VERIFYING), "verifier consolation payout failed");

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
