// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";



contract VerifierSystem is VRFConsumerBaseV2Plus, ReentrancyGuard, AccessManaged {
    using SafeERC20 for IERC20;

    /* ========== EVENTS ========== */
    event request_fulfilled(uint256 request_id, uint256[] random_values, bytes32 job_id);
    event verifier_added(address indexed verifier, uint8 category);
    event verifier_staked(address indexed verifier, uint256 amount);
    event verifier_unstaked(address indexed verifier, uint256 amount);
    event job_initialized(bytes32 indexed job_id, uint8 category, uint256 lock_amount, uint min_verifiers);
    event hashed_decision_submitted(bytes32 indexed job_id, address indexed verifier);
    event decision_revealed(bytes32 indexed job_id, address indexed verifier, uint256 score);
    event job_finalized(bytes32 indexed job_id, DISPUTE_STATUS dispute_status);
    event reward_credited(address indexed to, uint256 amount);
    event rewards_claimed(address indexed by, uint256 amount);
    event verifier_slashed(address indexed verifier, uint256 amount, bytes32 indexed job_id);
    event treasury_set(address indexed treasury);
    event request_sent(uint256 request_id, uint num_words, bytes32 job_id);
    event request_fulfilled(uint256 request_id, uint256[] random_words);

    /* ========== ENUMS ========== */
    enum DISPUTE_STATUS {PENDING, FREELANCER_WIN, CLIENT_WIN}

    /* ========== STORAGE ========== */
    IERC20 public reputation_token;
    address public treasury_address;
    uint256 public constant WEIGHT_MAX = 100;
    uint256 public slash_bps = 2000; // 20% of lock amount for zero-weight verifiers (basis points)


    uint256 public subscription_id;
    bytes32 constant public key_hash=0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26;

    uint32 public callback_gas_limit=100_000;

    uint16 public request_confirmations=2;

    struct DisputedJob {
        bool open_for_dispute;
        uint256 submission_deadline;
        uint256 release_deadline;
        uint8 category;
        uint256 dispute_fee_from_client;
        uint256 dispute_fee_from_freelancer;
        uint stakes_lost;
        uint256 lock_amount;
        uint min_number_verifiers;
        DISPUTE_STATUS dispute_status;
        // mappings & arrays
        mapping(address => bytes32) hashed_decisions;
        address[] chosen_verifiers;
        mapping(address => bool) verifiers_allowed;
        mapping(address => uint256) scores;
    }

    struct Verifier {
        bool verified;
        bool is_active;
        uint8 in_dispute;
        uint256 locked;
        uint256 staked;
        uint8 category;
    }

    // jobs storage (cannot be public because of mappings inside struct)
    mapping(bytes32 => DisputedJob) internal disputed_jobs;

    mapping(uint8 => bool) public category_not_open;

    mapping(address => Verifier) public verifiers;
    mapping(uint8 => address[]) public verifiers_in_category;
//    function get_verifiers(uint8 category) public returns(address[]) {return veri}
    mapping(uint256 => bytes32) public verifier_requests; // verifier request id -> job id

    // pull-based reward accounting to avoid heavy on-chain loops with many transfers
    mapping(address => uint256) public pending_rewards;
    uint256 public treasury_pending; // tokens accumulated to treasury from slashes

    /* ========== CONSTRUCTOR ========== */
    constructor(address _reputation_token, address _treasury, address _coordinator, uint _subscription_id, address _access_manager) VRFConsumerBaseV2Plus(_coordinator) AccessManaged(_access_manager) {
        require(_reputation_token != address(0), "zero token");
        require(_treasury != address(0), "zero treasury");
        reputation_token = IERC20(_reputation_token);
        treasury_address = _treasury;
        subscription_id = _subscription_id;
        emit treasury_set(_treasury);
    }

    /* ========== ADMIN ========== */
    function set_treasury(address _treasury) external restricted {
        require(_treasury != address(0), "zero treasury");
        treasury_address = _treasury;
        emit treasury_set(_treasury);
    }

    function set_slash_bps(uint256 _bps) external restricted {
        require(_bps <= 10000 && _bps > 0, "outside range");
        slash_bps = _bps;
    }

    /* ========== VERIFIER MANAGEMENT ========== */
    function add_verifier(uint8 category, address verifier) external restricted {
        require(verifier!=address(0), "Null address not allowed");
        require(!verifiers[verifier].verified, "already added");
        verifiers[verifier].verified = true;
        verifiers[verifier].category = category;
        verifiers[verifier].is_active = true;
        verifiers_in_category[category].push(verifier);
        emit verifier_added(verifier, category);
    }

    function stake(uint256 amount) external nonReentrant{
        require(amount > 0, "zero stake");
        Verifier storage v = verifiers[msg.sender];
        require(v.verified, "not a verifier");
        v.staked += amount;
        v.is_active=true;
        reputation_token.safeTransferFrom(msg.sender, address(this), amount);
        
        emit verifier_staked(msg.sender, amount);
    }

    function inactive_verifier() external nonReentrant {
        Verifier storage v = verifiers[msg.sender];
        require(v.is_active, "not working or allowed");
        require(v.in_dispute==0, "in dispute");
        require(!category_not_open[v.category], "You are on selection");
        uint256 amount = v.staked;
        v.staked = 0;
        v.is_active = false;
        if (amount > 0 ) reputation_token.safeTransfer(msg.sender, amount);
        emit verifier_unstaked(msg.sender, amount);
    }


    


    /* ========== VRF REQUEST (name preserved) ========== */
    // NOTE: keep function name as requested by user
    function request_random_nums(
        bool enable_native_payment,
        bytes32 job_id
    ) public   {
        DisputedJob storage existing_job = disputed_jobs[job_id];
        require(!existing_job.open_for_dispute, "job already open");
        require(!category_not_open[existing_job.category], "category already open");
        address[] storage cat_verifiers = verifiers_in_category[existing_job.category];
        uint256 available = 0;
        for (uint256 i = 0; i < cat_verifiers.length; i++) {
            Verifier storage vv = verifiers[cat_verifiers[i]];
            if (vv.is_active && vv.staked >= existing_job.lock_amount) available++;
        }
        require(available >= existing_job.min_number_verifiers, "not enough verifiers available");
        category_not_open[existing_job.category] = true;

        // Call to RandomValuesGenerator (assumes VRF client variables exist in inherited contract)
        uint256 request_id = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: key_hash,
                subId: subscription_id,
                requestConfirmations: request_confirmations,
                callbackGasLimit: callback_gas_limit,
                numWords: uint32(existing_job.min_number_verifiers),
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: enable_native_payment})
                )
            })
        );

        // initialize disputed job safely
        DisputedJob storage job = disputed_jobs[job_id];
        job.open_for_dispute = true;
        job.submission_deadline = block.timestamp + 24 hours; // default; caller can overwrite via separate function if desired
        job.release_deadline = block.timestamp + 48 hours;
        job.dispute_status = DISPUTE_STATUS.PENDING;

        verifier_requests[request_id] = job_id;

        emit request_sent(request_id, job.min_number_verifiers, job_id);
        emit job_initialized(job_id, job.category, job.lock_amount, job.min_number_verifiers);
        
    }
    

    


    /* ========== VRF CALLBACK (name preserved) ========== */
    // NOTE: keep function name as requested by user
   function fulfillRandomWords(uint256 request_id, uint256[] calldata random_values) internal override {
       bytes32 job_key = verifier_requests[request_id];
       DisputedJob storage job = disputed_jobs[job_key];
       require(job.open_for_dispute, "job not open");

       address[] storage potential = verifiers_in_category[job.category];

       bool[] memory used = new bool[](potential.length);
       for (uint256 i = 0; i < potential.length; i++) {
           if (verifiers[potential[i]].staked < job.lock_amount) used[i] = true;
       }

       // pick verifiers based on random values; ensure uniqueness
       for (uint256 i = 0; i < random_values.length; i++) {
           require(potential.length > 0, "no potential verifiers");
           uint256 idx = random_values[i] % potential.length;
           // find next unused
           uint256 start = idx;
           while (used[idx]) {
               idx = (idx + 1) % potential.length;
               require(idx != start || !used[idx], "not enough eligible verifiers");
           }
           address chosen = potential[idx];
           job.chosen_verifiers.push(chosen);
           job.verifiers_allowed[chosen] = true;

           // lock stake
           Verifier storage v = verifiers[chosen];
           v.locked += job.lock_amount;
           v.staked -= job.lock_amount;
           v.in_dispute++;

           used[idx] = true;
       }

       category_not_open[job.category] = false;
       emit request_fulfilled(request_id, random_values, job_key);
   }

    /* ========== SUBMIT / REVEAL ========== */
    function submit_hashed_decision(bytes32 job_id, bytes32 hashed_decision) external {
        DisputedJob storage job = disputed_jobs[job_id];
        require(job.open_for_dispute, "job not open");
        require(block.timestamp <= job.submission_deadline, "submission closed");
        require(job.verifiers_allowed[msg.sender], "not allowed");
        job.hashed_decisions[msg.sender] = hashed_decision;
        // prevent double submit
        job.verifiers_allowed[msg.sender] = false;
        emit hashed_decision_submitted(job_id, msg.sender);
    }

    function reveal_decision(bytes32 job_id, bytes32 salt, uint8 decision) external {
        require(decision > 0 && decision < 100, "decision out of range");
        DisputedJob storage job = disputed_jobs[job_id];
        require(job.open_for_dispute, "job not open");
        require(block.timestamp > job.submission_deadline, "submission not finished");
        require(block.timestamp <= job.release_deadline, "reveal period passed");
        require(job.hashed_decisions[msg.sender] == keccak256(abi.encodePacked(salt, decision)), "hash mismatch");
        job.scores[msg.sender] = decision;
        job.hashed_decisions[msg.sender] = bytes32(0);
        emit decision_revealed(job_id, msg.sender, decision);
    }

    /* ========== FINALIZE & REWARDS ========== */
    function finalize_verification(bytes32 job_id) external restricted nonReentrant {
        DisputedJob storage job = disputed_jobs[job_id];
        require(job.open_for_dispute, "job not open");
        require(block.timestamp >= job.release_deadline, "release deadline not reached");

        uint256 total_score = 0;
        uint256 participating = 0;
        for (uint256 i = 0; i < job.chosen_verifiers.length; i++) {
            address v = job.chosen_verifiers[i];
            uint256 s = job.scores[v];
            if (s > 0) {
                total_score += s;
                participating++;
            }
        }
        require(participating > 0, "no reveals");

        uint256 average_score = total_score / participating;

        // build reward pool: locked collateral + winning side dispute fee
        uint256 reward_pool = job.lock_amount * job.chosen_verifiers.length;
        if (average_score >= 50) {
            job.dispute_status = DISPUTE_STATUS.FREELANCER_WIN;
            reward_pool += job.dispute_fee_from_client;
            job.dispute_fee_from_client = 0;
        } else {
            job.dispute_status = DISPUTE_STATUS.CLIENT_WIN;
            reward_pool += job.dispute_fee_from_freelancer;
            job.stakes_lost+=job.dispute_fee_from_freelancer;
            job.dispute_fee_from_freelancer = 0;
        }

        // compute weights
        uint256[] memory weights = new uint256[](job.chosen_verifiers.length);
        uint256 total_weight = 0;
        for (uint256 i = 0; i < job.chosen_verifiers.length; i++) {
            address v = job.chosen_verifiers[i];
            uint256 s = job.scores[v];
            job.verifiers_allowed[v] = false; // reset for safety
            if (s == 0) {
                weights[i] = 0;
                continue;
            }
            uint256 abs_diff = abs_uint(s, average_score);
            uint256 weight = (WEIGHT_MAX - abs_diff);
            weights[i] = weight;
            total_weight += weight;
        }

        require(total_weight > 0, "total weight zero");

        // distribute rewards into pending_rewards; unlock or slash locked stake
        for (uint256 i = 0; i < job.chosen_verifiers.length; i++) {
            address v = job.chosen_verifiers[i];
            uint256 s = job.scores[v];

            // unlock locked stake back to staked by default (we will slash if needed)
            if (verifiers[v].locked >= job.lock_amount) {
                verifiers[v].locked -= job.lock_amount;
                verifiers[v].staked += job.lock_amount;
            } else {
                // defensive: if something odd, set locked to zero
                verifiers[v].staked += verifiers[v].locked;
                verifiers[v].locked = 0;
            }

            // if revealed
            if (s > 0) {
                uint256 reward = (reward_pool * weights[i]) / total_weight;
                if (reward > 0) {
                    pending_rewards[v] += reward;
                    emit reward_credited(v, reward);
                }
            } else {
                // weight == 0 or no reveal -> slash portion of original lock_amount
                if (slash_bps > 0) {
                    uint256 slash_amount = (job.lock_amount * slash_bps) / 10000;
                    // prefer slashing from staked (unlocked) if available, else reduce pending or record for treasury collection
                    if (verifiers[v].staked >= slash_amount) {
                        verifiers[v].staked -= slash_amount;
                        treasury_pending += slash_amount;
                        emit verifier_slashed(v, slash_amount, job_id);
                    } else if (pending_rewards[v] >= slash_amount) {
                        pending_rewards[v] -= slash_amount;
                        treasury_pending += slash_amount;
                        emit verifier_slashed(v, slash_amount, job_id);
                    } else {
                        // best effort: take whatever remains from staked/pending and move to treasury
                        uint256 taken = verifiers[v].staked + pending_rewards[v];
                        verifiers[v].staked = 0;
                        pending_rewards[v] = 0;
                        treasury_pending += taken;
                        if (taken > 0) emit verifier_slashed(v, taken, job_id);
                    }
                }
            }

            // reset score to avoid reuse
            job.scores[v] = 0;
            verifiers[v].in_dispute--;
        }

        // mark job closed
        delete job.chosen_verifiers;
        job.open_for_dispute = false;
        emit job_finalized(job_id, job.dispute_status);
    }

    /* ========== CLAIMS & TREASURY ========== */
    function claim_rewards() external nonReentrant {
        uint256 amt = pending_rewards[msg.sender];
        require(amt > 0, "no rewards");
        pending_rewards[msg.sender] = 0;
        reputation_token.safeTransfer(msg.sender, amt);
        emit rewards_claimed(msg.sender, amt);
    }

    function withdraw_treasury() external restricted nonReentrant {
        uint256 amt = treasury_pending;
        require(amt > 0, "no treasury funds");
        treasury_pending = 0;
        reputation_token.safeTransfer(treasury_address, amt);
    }


    /* ========== INTERNAL HELPERS ========== */
    function abs_uint(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a >= b) ? (a - b) : (b - a);
    }
}
