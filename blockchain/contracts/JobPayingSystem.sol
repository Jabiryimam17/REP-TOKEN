// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVerifierSystem} from "./VerifierSystem.sol";
import {IRegistry} from "./Registry.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";

error NoneVerifier(uint index);
error ZeroStake(uint index);
error Unsorted(uint index);
error NonExistentWorkLevel(uint index);
error ZeroVerifiers(uint index);
error NullAddress();
error AlreadyVerified();
error Unverified();
error Working();
error AnotherWorker();
error InsufficientWorkingTime();
error ExcessAmount();
error ZeroAmount();
error NotClient();
error NotFreelancer();
error InValidStatus(JobPayingSystem.JOB_STATUS expected);
error NotHired();
error Uncompleted();
error NotHiringSelf();
error NotPending();
error Unexpired();
error Expired();
error NotLink();
error InsufficientETH(uint fee);
error NotSubject();
error ExpiredAppeal();
error Undisputed();
error NotWinner(bool freelancer_win, bool client_win);
error NoLevels();

interface Itreasury {
    function pay_back_rpt(address to, uint amount) external;

    function pay_back_stable_coin(address to, uint amount) external;
}

interface IVRFV2Wrapper {
    function calculateRequestPrice(
        uint32 _callbackGasLimit,
        uint32 _numWords
    ) external view returns (uint256);

    function calculateRequestPriceNative(
        uint32 _callbackGasLimit,
        uint32 _numWords
    ) external view returns (uint256);
}

contract JobPayingSystem is AccessManaged, ReentrancyGuard {
    using SafeERC20 for IERC20;
    enum JOB_STATUS {NONE, OPEN, PENDING, HIRED, COMPLETED, DISPUTED, CLOSED}

    event job_posted(bytes32 indexed job_id, uint amount);
    event job_hired(bytes32 indexed job_id, address indexed freelancer);
    event job_cancel_unhired(bytes32 indexed job_id);
    event job_cancel_expired(bytes32 indexed  job_id);
    event job_accepted(bytes32 indexed job_id, address indexed freelancer);
    event job_completed(bytes32 indexed job_id);
    event job_disputed(bytes32 indexed job_id);
    event job_closed(bytes32 indexed job_id);
    event transfer_address(address indexed old_address, address indexed new_address);


    struct Freelancer {
        uint successful_jobs;
        uint total_jobs;
        uint ongoing;
        bool verified;
    }

    uint public client_fee_portion_bps = 200;
    uint public freelancer_fee_portion_bps = 50;
    uint public constant MIN_MAX_DURATION = 3600 * 24;


    struct w_level {
        uint32 verifiers_cnt;
        uint freelancer_stake;
        uint client_stake;
        uint max_amount;
        uint payment_duration;
    }

    w_level[] public work_levels;

    struct Job {
        address client;
        address freelancer;
        uint freelancer_stake;
        uint client_stake;
        uint32 verifiers_cnt;
        uint payment_duration;
        uint appeal_time;
        JOB_STATUS status;
        uint amount;
        uint max_duration;
        uint expiry_timestamp;
        uint8 cat;
    }


    bytes32[] public job_lists;
    mapping(bytes32 => Job) public jobs;
    mapping(address => Freelancer) public freelancers;
    IRegistry public registry;
    constructor(
        address _registry,
        address _access_manager
    ) AccessManaged(_access_manager) {
        if (address(0) == _registry || address(0)==_access_manager) revert NullAddress();
        registry = IRegistry(_registry);
    }

    function set_freelancer_fee_portion(uint val) public restricted {freelancer_fee_portion_bps = val;}

    function set_client_fee_portion(uint val) public restricted {client_fee_portion_bps = val;}

    function _treasury() internal view returns (Itreasury) {
        return Itreasury(registry.get_treasury());
    }

    function _rpt() internal view returns (IERC20) {
        return IERC20(registry.get_rpt());
    }

    function _verifier() internal view returns (IVerifierSystem) {
        return IVerifierSystem(registry.get_verifier());
    }


    function reset_levels(w_level[] calldata _levels) external restricted {
        delete work_levels;
        for (uint i = 0; i < _levels.length; i++) {
            if (_levels[i].verifiers_cnt == 0) revert NoneVerifier(i);
            if (_levels[i].freelancer_stake == 0 || _levels[i].client_stake == 0) revert ZeroStake(i);
            if (i > 0 && _levels[i].max_amount <= _levels[i - 1].max_amount) revert Unsorted(i);
            work_levels.push(_levels[i]);
        }

    }

    function update_level(w_level calldata _level, uint index) external restricted {
        if (index >= work_levels.length) revert NonExistentWorkLevel(index);
        if (_level.verifiers_cnt == 0) revert ZeroVerifiers(index);
        if (_level.freelancer_stake == 0 || _level.client_stake == 0) revert ZeroStake(index);
        if ((index > 0 && _level.max_amount <= work_levels[index - 1].max_amount) || (index != work_levels.length - 1 && _level.max_amount >= work_levels[index + 1].max_amount)) revert Unsorted(index);
        work_levels[index] = _level;
    }

    function append_level(w_level calldata _level) external restricted {
        uint index = work_levels.length;
        if (_level.verifiers_cnt == 0) revert ZeroVerifiers(index);
        if (_level.freelancer_stake == 0 || _level.client_stake == 0) revert ZeroStake(index);
        if ((work_levels.length > 0 && _level.max_amount <= work_levels[work_levels.length - 1].max_amount)) revert Unsorted(index);

        work_levels.push(_level);
    }

    function _ethio_coin() internal view returns (IERC20) {
        return IERC20(registry.get_ethiocoin());
    }

    function get_levels() public view returns (w_level[] memory) {return work_levels;}
    modifier OnlyClient(bytes32 job_id) {
        if (jobs[job_id].client != msg.sender) revert NotClient();
        _;
    }
    modifier OnlyFreelancer(bytes32 job_id) {
        if (jobs[job_id].freelancer != msg.sender) revert NotFreelancer();
        _;
    }
    modifier OnlyValidState(bytes32 job_id, JOB_STATUS expected) {
        if (jobs[job_id].status != expected) revert InValidStatus(expected);
        _;
    }
    function register_freelancer(address freelancer) external restricted {
        if (address(0) == freelancer) revert NullAddress();
        if (freelancers[freelancer].verified) revert AlreadyVerified();
        freelancers[freelancer] = Freelancer(0, 0, 0, true);
    }


    function transfer_freelancer(address new_free) external {
        if (address(0) == new_free) revert NullAddress();
        if (!freelancers[msg.sender].verified) revert Unverified();
        if (freelancers[msg.sender].ongoing > 0) revert Working();
        if (freelancers[new_free].verified) revert AnotherWorker();
        freelancers[new_free] = freelancers[msg.sender];
        delete freelancers[msg.sender];
        emit transfer_address(msg.sender, new_free);
    }

    function post_job(bytes32 job_id, uint amount, uint max_duration, uint8 category) external nonReentrant {
        if (max_duration < MIN_MAX_DURATION) revert InsufficientWorkingTime();
        if (amount == 0) revert ZeroAmount();
        if (amount > work_levels[work_levels.length - 1].max_amount) revert ExcessAmount();
        uint fee = amount * client_fee_portion_bps / 10000;


        _ethio_coin().safeTransferFrom(msg.sender, address(registry.get_treasury()), fee + amount);
        uint level = calculate_level(amount);
        uint client_stake = work_levels[level].client_stake;
        _rpt().safeTransferFrom(msg.sender, address(registry.get_treasury()), client_stake);

        Job storage new_job = jobs[job_id];
        new_job.client = msg.sender;
        new_job.amount = amount;
        new_job.max_duration = max_duration;
        new_job.client_stake = client_stake;
        new_job.freelancer_stake = work_levels[level].freelancer_stake;
        new_job.payment_duration = work_levels[level].payment_duration;
        new_job.verifiers_cnt = work_levels[level].verifiers_cnt;
        new_job.status = JOB_STATUS.OPEN;
        new_job.cat = category;

        job_lists.push(job_id);
        emit job_posted(job_id, amount);
    }

    function update_job_cat(bytes32 job_id, uint8 cat) public OnlyClient(job_id) OnlyValidState(job_id, JOB_STATUS.OPEN) {
        jobs[job_id].cat = cat;
    }

    function update_job_max_dur(bytes32 job_id, uint max_dur) public OnlyClient(job_id) OnlyValidState(job_id, JOB_STATUS.OPEN) {
        if (max_dur < MIN_MAX_DURATION) revert InsufficientWorkingTime();
        jobs[job_id].max_duration = max_dur;
    }

    function extend_deadline(bytes32 job_id, uint extra_time) public OnlyClient(job_id) OnlyValidState(job_id, JOB_STATUS.HIRED) {
        jobs[job_id].expiry_timestamp += extra_time;
    }

    function get_jobs() public view returns (bytes32[] memory){return job_lists;}

    function cancel_job(bytes32 job_id) external nonReentrant OnlyClient(job_id) OnlyValidState(job_id, JOB_STATUS.OPEN) {
        Job storage job = jobs[job_id];
        job.status = JOB_STATUS.CLOSED;
        _treasury().pay_back_stable_coin(job.client, job.amount);
        _treasury().pay_back_rpt(job.client, job.client_stake);
        emit job_closed(job_id);
    }

    function hire(bytes32 job_id, address freelancer) external OnlyClient(job_id) OnlyValidState(job_id, JOB_STATUS.OPEN) {
        Job storage job = jobs[job_id];
        if (msg.sender == freelancer) revert NotHiringSelf();
        if (!freelancers[freelancer].verified) revert Unverified();
        job.freelancer = freelancer;
        job.status = JOB_STATUS.PENDING;
        emit job_hired(job_id, freelancer);
    }

    function cancel_pending_hire(bytes32 job_id) external OnlyClient(job_id) OnlyValidState(job_id, JOB_STATUS.PENDING) {
        Job storage job = jobs[job_id];
        job.freelancer = address(0);
        job.status = JOB_STATUS.OPEN;
        emit job_cancel_unhired(job_id);

    }

    function accept_job(bytes32 job_id) external OnlyFreelancer(job_id) OnlyValidState(job_id, JOB_STATUS.PENDING) {

        Job storage job = jobs[job_id];
        uint fee = job.amount * freelancer_fee_portion_bps / 10000;
        _ethio_coin().safeTransferFrom(msg.sender, address(registry.get_treasury()), fee);
        uint freelancer_stake = job.freelancer_stake;
        _rpt().safeTransferFrom(msg.sender, address(registry.get_treasury()), freelancer_stake);

        job.expiry_timestamp = block.timestamp + job.max_duration;
        freelancers[job.freelancer].total_jobs++;
        job.status = JOB_STATUS.HIRED;
        freelancers[msg.sender].ongoing++;
        emit job_accepted(job_id, msg.sender);
    }

    function cancel_hire(bytes32 job_id) external nonReentrant OnlyClient(job_id) OnlyValidState(job_id, JOB_STATUS.HIRED) {
        Job storage job = jobs[job_id];
        if (block.timestamp <= job.expiry_timestamp) revert Unexpired();

        freelancers[job.freelancer].ongoing--;
        job.freelancer = address(0);
        job.status = JOB_STATUS.OPEN;
        job.expiry_timestamp = 0;
        emit job_cancel_expired(job_id);
    }

    function complete_job(bytes32 job_id) external OnlyFreelancer(job_id) OnlyValidState(job_id, JOB_STATUS.HIRED) {
        Job storage job = jobs[job_id];
        if (job.expiry_timestamp < block.timestamp) revert Expired();
        job.appeal_time = block.timestamp + job.payment_duration;
        job.status = JOB_STATUS.COMPLETED;
        emit job_completed(job_id);
    }

    function pay_freelancer(bytes32 job_id) external nonReentrant OnlyClient(job_id) OnlyValidState(job_id, JOB_STATUS.COMPLETED){
        Job storage job = jobs[job_id];
        job.status = JOB_STATUS.CLOSED;
        address freelancer = job.freelancer;
        freelancers[freelancer].successful_jobs++;

        _treasury().pay_back_rpt(job.client, job.client_stake);
        _treasury().pay_back_rpt(freelancer, job.freelancer_stake);
        _treasury().pay_back_stable_coin(freelancer, job.amount);
        freelancers[freelancer].ongoing--;
        emit job_closed(job_id);
    }

    function handle_request_payment(bool pay_link, uint32 words) internal {
        (uint32 callback_gas_limit, address vrf_wrapper_address, address link_token) = _verifier().get_request_config();
        IVRFV2Wrapper vrf_wrapper = IVRFV2Wrapper(vrf_wrapper_address);

        if (pay_link) {
            if (msg.value==0) revert NotLink();
            uint256 fee = vrf_wrapper.calculateRequestPrice(callback_gas_limit, words);
            IERC20 LINK = IERC20(link_token);
            LINK.safeTransferFrom(msg.sender, registry.get_treasury(), fee);
        } else {
            uint256 fee = vrf_wrapper.calculateRequestPriceNative(callback_gas_limit, words);
            if (msg.value < fee) revert InsufficientETH(fee);

            if (msg.value > fee) {
                payable(msg.sender).transfer(msg.value - fee);
            }
        }
    }

    function raise_dispute(bytes32 job_id, bool pay_link) external payable OnlyValidState(job_id, JOB_STATUS.COMPLETED){

        Job storage job = jobs[job_id];
        if (msg.sender != job.freelancer && msg.sender!=job.client) revert NotSubject();
        if (block.timestamp > job.appeal_time) revert ExpiredAppeal();
        uint32 min_v_p = job.verifiers_cnt;
        handle_request_payment(pay_link, min_v_p);
        uint client_stake = job.client_stake;
        uint freelancer_stake = job.freelancer_stake;
        _verifier().post_job(job_id, job.cat, client_stake, freelancer_stake);
        job.status = JOB_STATUS.DISPUTED;
        _verifier().request_random_nums(!pay_link, job_id, freelancer_stake + client_stake, min_v_p);
        emit job_disputed(job_id);
    }


    function claim_after_dispute(bytes32 job_id) external nonReentrant OnlyFreelancer(job_id) OnlyValidState(job_id, JOB_STATUS.DISPUTED){
        Job storage job = jobs[job_id];
        IVerifierSystem.DISPUTE_STATUS dispute_status = _verifier().get_dispute_status(job_id);
        if (dispute_status!=IVerifierSystem.DISPUTE_STATUS.FREELANCER_WIN) revert NotWinner(false, IVerifierSystem.DISPUTE_STATUS.CLIENT_WIN==dispute_status);
        freelancers[job.freelancer].successful_jobs++;
        job.status = JOB_STATUS.CLOSED;
        _treasury().pay_back_stable_coin(msg.sender, job.amount);
        _treasury().pay_back_rpt(msg.sender, job.freelancer_stake);
        freelancers[msg.sender].ongoing--;
        emit job_closed(job_id);
    }

    function refund_after_dispute(bytes32 job_id) external nonReentrant OnlyClient(job_id) OnlyValidState(job_id, JOB_STATUS.DISPUTED) {
        Job storage job = jobs[job_id];
        IVerifierSystem.DISPUTE_STATUS dispute_status = _verifier().get_dispute_status(job_id);
        if (dispute_status!=IVerifierSystem.DISPUTE_STATUS.CLIENT_WIN) revert NotWinner(dispute_status==IVerifierSystem.DISPUTE_STATUS.FREELANCER_WIN, false);
        _treasury().pay_back_stable_coin(msg.sender, job.amount);
        job.status = JOB_STATUS.CLOSED;
        _treasury().pay_back_rpt(msg.sender, job.client_stake);
        freelancers[job.freelancer].ongoing--;
        emit job_closed(job_id);
    }


    function calculate_level(uint256 amount) internal view returns (uint256) {
        if (work_levels.length==0) revert NoLevels();
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
