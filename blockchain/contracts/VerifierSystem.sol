// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IRegistry} from "./Registry.sol";

interface Itreasury {
    function pay_back_rpt(address to, uint amount) external;
    function pay_back_stable_coin(address to, uint amount) external;
}

contract VerifierSystem is VRFConsumerBaseV2Plus, ReentrancyGuard, AccessManaged {
    using SafeERC20 for IERC20;
    IRegistry public registry;

    event request_fulfilled(uint256 request_id, uint256[] random_values, bytes32 job_id);
    event verifier_added(address indexed verifier, uint16 category);
    event verifier_staked(address indexed verifier, uint256 amount);
    event verifier_unstaked(address indexed verifier, uint256 amount);
    event job_initialized(bytes32 indexed job_id, uint16 category, uint256 lock_amount, uint min_verifiers);
    event hashed_decision_submitted(bytes32 indexed job_id, address indexed verifier);
    event decision_revealed(bytes32 indexed job_id, address indexed verifier, uint256 score);
    event job_finalized(bytes32 indexed job_id, DISPUTE_STATUS dispute_status);
    event reward_credited(address indexed to, uint256 amount);
    event rewards_claimed(address indexed by, uint256 amount);
    event verifier_slashed(address indexed verifier, uint256 amount, bytes32 indexed job_id);
    event request_sent(uint256 request_id, uint num_words, bytes32 job_id);
    event request_fulfilled(uint256 request_id, uint256[] random_words);
    event address_transferred(address indexed old_address, address indexed new_address);
    enum DISPUTE_STATUS {PENDING, FREELANCER_WIN, CLIENT_WIN}

    IERC20 public reputation_token;
    uint256 public constant WEIGHT_MAX = 100;
    uint256 public slash_bps = 2000;
    uint256 public subscription_id;
    bytes32 public key_hash=0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;

    uint32 public callback_gas_limit=100000;

    uint16 public request_confirmations=2;

    struct DisputedJob {
        bool open_for_dispute;
        uint256 submission_deadline;
        uint256 release_deadline;
        uint16 category;
        uint stakes;
        uint client_stake;
        uint freelancer_stake;
        uint8 level;
        uint256 lock_amount;
        DISPUTE_STATUS dispute_status;
        mapping(address => bytes32) hashed_decisions;
        address[] chosen_verifiers;
        mapping(address => bool) verifiers_allowed;
        mapping(address => uint256) scores;
    }

    struct Verifier {
        bool verified;
        bool is_active;
        bool assigned;
        uint8 in_dispute;
        uint256 locked;
        uint256 staked;
        uint16 category;
        uint8 level;
        uint16 idx_l;
    }

    mapping(uint16=>mapping(uint8=>address[])) public leveled_verifiers;
    mapping(bytes32 => DisputedJob) public disputed_jobs;

    mapping(uint16 => mapping(uint8=>bool)) public category_open;
    string[] public categories;
    uint[] public stack_levels;
    mapping(address => Verifier) public verifiers;
    mapping(uint256 => bytes32) public verifier_requests; 

    mapping(address => uint256) public pending_rewards;
    uint256 public treasury_pending;

    
    constructor(  address _coordinator, uint _subscription_id, address _registry, address _access_manager) VRFConsumerBaseV2Plus(_coordinator) AccessManaged(_access_manager) {

        registry=IRegistry(_registry);
        subscription_id = _subscription_id;
    }

    function _ethio_coin() internal view returns (IERC20) {
        return IERC20(registry.get_ethiocoin());
    }
    function _treasury() internal view returns(Itreasury) {
        return Itreasury(registry.get_treasury());
    }

    function _rpt() internal view returns (IERC20) {
        return IERC20(registry.get_rpt());
    }
    function set_up_vrf(
        uint _subscription_id,
        uint16 _request_confirmations,
        bytes32 _key_hash,
        uint32 _callback_gas_limit
     ) external restricted {

         subscription_id = _subscription_id;
         key_hash = _key_hash;
         callback_gas_limit = _callback_gas_limit;
         request_confirmations = _request_confirmations;
     }

    function add_stack_level(uint256 stake_amount) external restricted {
        require(stake_amount > 0, "zero stake");
        uint n = stack_levels.length;
        require(n==0 || stake_amount > stack_levels[n-1],"Invalid stake amount");
        stack_levels.push(stake_amount);
    }
    function get_stack_levels() external view returns(uint256[] memory) {
        return stack_levels;
    }

    function add_stack_levels(uint256[] calldata stake_amounts) external restricted {
        uint n=stake_amounts.length;
        require(n > 0, "empty array");
        delete stack_levels;
        stack_levels.push(stake_amounts[0]);
        for (uint i=1; i < n;i++){
            uint stake_amount=stake_amounts[i];
            require(stake_amount > stack_levels[i-1], "Invalid stake amount");
            stack_levels.push(stake_amount);
        }
    }
    function set_slash_bps(uint256 _bps) external restricted {
        require(_bps <= 10000 && _bps > 0, "outside range");
        slash_bps = _bps;
    }

    function add_category(string calldata category_name) external restricted {
        categories.push(category_name);
    }
    function get_categories() external view returns(string[] memory) {
        return categories;
    }

    function get_cat_level_verifiers(uint16 category, uint8 level) external view returns(address[] memory) {
        return leveled_verifiers[category][level];
    }
    function add_verifier(uint16 category, address verifier) external restricted {
        require(verifier!=address(0), "Null address not allowed");
        require(!verifiers[verifier].verified, "already added");
        require(category < categories.length, "invalid category");
        verifiers[verifier].verified = true;
        verifiers[verifier].category = category;
        emit verifier_added(verifier, category);
    }

    function transfer_address(address new_address) external nonReentrant {
        require(new_address!=address(0), "Null address not allowed");
        require(!verifiers[new_address].verified, "address already used");
        if (verifiers[msg.sender].staked > 0) _unstake();
        verifiers[new_address]=verifiers[msg.sender];
        uint reward = pending_rewards[msg.sender];
        pending_rewards[new_address]=reward;
        delete pending_rewards[msg.sender];
        delete verifiers[msg.sender];
        emit address_transferred(msg.sender, new_address);

    }


    function stake(uint256 amount) external nonReentrant{
        require(amount > 0, "zero stake");
        Verifier storage v = verifiers[msg.sender];
        require(v.verified, "not a verifier");

        v.staked += amount;
        v.is_active=true;
        _update_level(msg.sender);

        _rpt().safeTransferFrom(msg.sender, address(registry.get_treasury()), amount);
        emit verifier_staked(msg.sender, amount);
    }

    function _update_level(address v_a) internal {
        Verifier  storage v=verifiers[v_a];
        uint8 new_level = find_lower_bound(v.staked);
        uint16 cat = v.category;
        if (!v.assigned) {
            v.idx_l=uint16(leveled_verifiers[cat][new_level].length);
            leveled_verifiers[cat][new_level].push(v_a);
            v.level=new_level;
            v.assigned=true;
        } else {
            if (verifiers[v_a].level==new_level) return;
            delete_verifier(v_a);
            v.idx_l=uint8(leveled_verifiers[cat][new_level].length);
            v.level=new_level;
            leveled_verifiers[cat][new_level].push(v_a);
        }
    }
    
    function unstake() public nonReentrant {
        _unstake();
    }
    function _unstake() public {
        Verifier storage v = verifiers[msg.sender];
        require(v.is_active, "not working or allowed");
        require(v.in_dispute==0, "in dispute");
        require(!category_open[v.category][v.level], "You are on selection");
        uint256 amount = v.staked;
        v.staked = 0;
        delete_verifier(msg.sender);
        v.assigned=false;
        v.is_active=false;

        if (amount > 0 ) _treasury().pay_back_rpt(msg.sender, amount);
        emit verifier_unstaked(msg.sender, amount);
    }
    function delete_verifier(address v_a) internal {
        Verifier storage v = verifiers[v_a];
        uint16 cat=v.category;
        uint8 level=v.level;
        uint len=leveled_verifiers[cat][level].length;
        uint16 old_idx=verifiers[v_a].idx_l;

        if (old_idx!=len-1) {
            address r=leveled_verifiers[cat][level][len-1];
            leveled_verifiers[cat][level][old_idx] = r;
            verifiers[r].idx_l=old_idx;
        }
        
        leveled_verifiers[cat][level].pop();

    }

// TODO: allow only job system to post

    function post_job(bytes32 job_id, uint8 cat, uint client_stake, uint freelancer_stake) external {
        require(cat >= 0 && cat < categories.length, "invalid category");
        DisputedJob storage dj=disputed_jobs[job_id];
        dj.category=cat;
        dj.client_stake=client_stake;
        dj.freelancer_stake= freelancer_stake;
    }
    function get_job(bytes32 job_id) public view returns (
    bool open_for_dispute,
    uint256 submission_deadline,
    uint256 release_deadline,
    uint16 category,
    uint stakes,  
    uint client_stake,
    uint freelancer_stake,
    uint8 level,
    uint256 lock_amount,
    DISPUTE_STATUS dispute_status
) { 
    DisputedJob storage job = disputed_jobs[job_id];
    
    return (
        job.open_for_dispute,
        job.submission_deadline,
        job.release_deadline,
        job.category,
        job.stakes,
        job.client_stake,
        job.freelancer_stake, // Fixed typo
        job.level,
        job.lock_amount,
        job.dispute_status    // Fixed typo
    );
}
    function get_dispute_status(bytes32 job_id) external view returns(DISPUTE_STATUS) {
        return disputed_jobs[job_id].dispute_status;
    }


    
    function request_random_nums(
        bool enable_native_payment,
        bytes32 job_id,
        uint stake_amount,
        uint verifiers_cnt
    )  external returns (uint256) {
        DisputedJob storage existing_job = disputed_jobs[job_id];
        require(stack_levels[stack_levels.length-1] >= stake_amount, "Excess Request");
        uint8 level=find_lower_bound(stake_amount)+1;
        uint16 cat = existing_job.category;
        require(!category_open[cat][level],"category for this level is in selection");
        require(leveled_verifiers[cat][level].length > 2*verifiers_cnt, "not enough verifiers available at the moment");

        category_open[cat][level] = true;
        uint256 request_id =0;// s_vrfCoordinator.requestRandomWords(
        // VRFV2PlusClient.RandomWordsRequest({
        //     keyHash: key_hash,
        //     subId: subscription_id,
        //     requestConfirmations: request_confirmations,
        //     callbackGasLimit: callback_gas_limit,
        //     numWords: uint32(verifiers_cnt),
        //     extraArgs: VRFV2PlusClient._argsToBytes(
                // VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
        //     )
        // })
    // );

        DisputedJob storage job = disputed_jobs[job_id];
        job.open_for_dispute = true;
        job.stakes=stake_amount;
        job.level=level;
        job.submission_deadline = block.timestamp + 24 hours;
        job.release_deadline = block.timestamp + 48 hours;
        job.dispute_status = DISPUTE_STATUS.PENDING;

        verifier_requests[request_id] = job_id;

        emit request_sent(request_id, verifiers_cnt, job_id);
        emit job_initialized(job_id, job.category, job.lock_amount, verifiers_cnt);
        return request_id;
    }
    function requestRandom(uint32 num_words) external returns (uint256) {

    uint256 request_id = s_vrfCoordinator.requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest({
            keyHash: key_hash,
            subId: subscription_id,
            requestConfirmations: 3,
            callbackGasLimit: 200000,
            numWords: num_words,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        })
    );

    return request_id;
}

    function find_lower_bound(uint stake_amount) internal view returns(uint8) {
        uint8 n=uint8(stack_levels.length);
        if (stake_amount > stack_levels[n-1]) revert("excess stack, lower it");
        uint8 low=0;
        uint8 high=n-1;
        while (low < high) {
            uint8 mid = (low+high) >> 1;
            if (stack_levels[mid] >= stake_amount) high=mid;
            else low=mid+1;
        }
        return high;
    }
    uint256[] public sample_random;

    // function fulfillRandomWords(
    //     uint256 requestId,
    //     uint256[] calldata randomValues
    // ) internal override {
    //     sample_random = randomValues;
    // }
    function get_sample_random() external view returns(uint256[] memory) {
        return sample_random;
    }
    function mock_fulfill_random_words(uint256 request_id, uint256[] calldata random_values) external restricted {
        fulfillRandomWords(request_id, random_values);
    }
   function fulfillRandomWords(uint256 request_id, uint256[] calldata random_values) internal override {
       bytes32 job_key = verifier_requests[request_id];
       DisputedJob storage job = disputed_jobs[job_key];
       require(job.open_for_dispute, "job not open");
       address[] storage eligible = leveled_verifiers[job.category][job.level];
       uint len = eligible.length;
       for (uint i=0; i < random_values.length; ++i) {
        uint r = random_values[i]%len;
        address chosen = eligible[r];
        eligible[r]=eligible[len-1];
        verifiers[eligible[r]].idx_l=uint8(r);
        eligible[len-1]=chosen;

        len--;
        job.verifiers_allowed[chosen]=true;
        job.chosen_verifiers.push(chosen);
        Verifier storage v=verifiers[chosen];
        v.staked -= job.stakes;
        v.locked += job.stakes;
        v.idx_l=uint8(len);
        update_verifier_place(v,chosen);
       }
    
       emit request_fulfilled(request_id, random_values, job_key);
   }
   

   function set_up_verifiers(bytes32 job_id, uint ver_cnt) public {
        DisputedJob storage job=disputed_jobs[job_id];
        address[] storage eligible = leveled_verifiers[job.category][job.level];
        for (uint i=0; i < ver_cnt; i++) {
            address chosen=eligible[i];
            job.verifiers_allowed[chosen]=true;
            job.chosen_verifiers.push(chosen);
            Verifier storage v=verifiers[chosen];
            v.staked -= job.stakes;
            v.locked += job.stakes;
            update_verifier_place(v,chosen);
        }
       category_open[job.category][job.level]=false;
   }

   function get_job_level(bytes32 job_id) public returns(uint8) {return disputed_jobs[job_id].level;}
   function get_verifier_level(address v) public returns(uint8) {return verifiers[v].level;}
   function update_verifier_place(Verifier storage v, address v_a) internal {
    uint8 new_level=find_lower_bound(v.staked);
    uint16 cat=v.category;
    if (new_level != v.level) {
        address[] storage verifiers_level=leveled_verifiers[cat][v.level];
        uint len=verifiers_level.length;
        address r_a = verifiers_level[len-1];
        verifiers_level[v.idx_l]=r_a;
        verifiers_level.pop();
        verifiers[r_a].idx_l=v.idx_l;
        v.level = new_level;
        v.idx_l=uint16(leveled_verifiers[cat][new_level].length);
        leveled_verifiers[cat][new_level].push(v_a);
    }
   }
   function get_chosen_verifiers(bytes32 job_id) external view returns(address[] memory) {
       DisputedJob storage job = disputed_jobs[job_id];
       return job.chosen_verifiers;
   }

   

    function submit_hashed_decision(bytes32 job_id, bytes32 hashed_decision) external {
        DisputedJob storage job = disputed_jobs[job_id];
        require(job.open_for_dispute, "job not open");
        require(block.timestamp <= job.submission_deadline, "submission closed");
        require(job.verifiers_allowed[msg.sender], "not allowed");
        job.hashed_decisions[msg.sender] = hashed_decision;
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

    function calc_scores(address[] memory chosen_verifiers, uint[] memory scores, DisputedJob storage job) internal view returns(uint) {

        uint256 total_score = 0;
        uint256 participating = 0;
        
        uint len=chosen_verifiers.length;
        uint256 s;
        for (uint256 i = 0; i < len; i++) {
            s = job.scores[chosen_verifiers[i]];
            scores[i]=s;
            total_score += s;
            if (s > 0) participating++;
        }
        require(participating > 0, "no reveals");

        return total_score / participating;
    }
    function calc_weights(address[] memory chosen_verifiers, uint[] memory scores, uint[] memory weights, uint average_score) internal pure returns(uint total_weight) {
        uint len=chosen_verifiers.length;
        
        for (uint256 i = 0; i < len; i++) {
            uint s = scores[i];
            if (s == 0) {
                weights[i] = 0;
                continue;
            }
            weights[i] = (WEIGHT_MAX - abs_uint(s, average_score));
            total_weight += weights[i];
        }

        require(total_weight > 0, "total weight zero");
        return total_weight;
    }
    function finalize_verification(bytes32 job_id) external restricted nonReentrant {
        DisputedJob storage job = disputed_jobs[job_id];
        require(job.open_for_dispute, "job not open");
        require(block.timestamp >= job.release_deadline, "release deadline not reached");
        address[] memory chosen_verifiers = job.chosen_verifiers;
        uint len=chosen_verifiers.length;
        uint256[] memory scores = new uint256[](len);
        uint256 reward_pool = job.lock_amount * len;
        uint average_score=calc_scores(chosen_verifiers, scores, job);
        if (average_score >= 50) {
            job.dispute_status = DISPUTE_STATUS.FREELANCER_WIN;
            reward_pool += job.client_stake;
        } else {
            job.dispute_status = DISPUTE_STATUS.CLIENT_WIN;
            reward_pool += job.freelancer_stake;
        }

        uint[] memory weights=new uint[](len);
        uint total_weight=calc_weights(chosen_verifiers, scores, weights, average_score);
        uint lock_amount=job.lock_amount;
        uint c_slash_bps=slash_bps;
        for (uint256 i = 0; i < len; i++) {
            address v = chosen_verifiers[i];
            uint s = scores[i];
            Verifier storage ver = verifiers[v];
            ver.locked -= lock_amount;
            ver.staked += lock_amount;
            

            if (s > 0) {
                uint reward = (reward_pool * weights[i]) / total_weight;
                if (reward > 0) {
                    pending_rewards[v] += reward;
                }
            } else {
                if (c_slash_bps > 0) {
                    uint256 slash_amount = (lock_amount * c_slash_bps) / 10000;
                    uint v_stake=ver.staked;
                    if (slash_amount > v_stake) slash_amount=v_stake;
                    ver.staked -= slash_amount;
                    treasury_pending += slash_amount;
                }
            
            }
            update_verifier_place(ver, v);


            ver.in_dispute--;
        }

        delete job.chosen_verifiers;
        job.open_for_dispute = false;
        emit job_finalized(job_id, job.dispute_status);
    }

    function claim_rewards() external nonReentrant {
        uint256 amt = pending_rewards[msg.sender];
        require(amt > 0, "no rewards");
        pending_rewards[msg.sender] = 0;
        _treasury().pay_back_rpt(msg.sender, amt);
        emit rewards_claimed(msg.sender, amt);
    }


    function abs_uint(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a >= b) ? (a - b) : (b - a);
    }
}
interface IVerifierSystem {
    enum DISPUTE_STATUS {PENDING, FREELANCER_WIN, CLIENT_WIN}
    function request_random_nums(
        bool enable_native_payment,
        bytes32 job_id,
        uint stake_amount,
        uint verifiers_cnt
    ) external;
    function get_dispute_status(bytes32 job_id) external view returns(DISPUTE_STATUS);
    function post_job(bytes32 job_id, uint8 cat, uint client_stake, uint freelancer_stake) external;
}