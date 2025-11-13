// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RandomValuesGenerator.sol";
import "./ReputationToken.sol";
contract JobPayingSystem is RandomValuesGenerator, Ownable, ReputationToken {
    event job_posted(bytes32 indexed job_id, address indexed client, uint amount,uint category, uint level);
    event job_hired(bytes32 indexed job_id, address indexed  client, address indexed freelancer);
    event job_accepted(bytes32 indexed job_id, address indexed freelancer);
    event job_completed(bytes32 indexed job_id, address indexed freelancer);
    event job_disputed(bytes32 indexed job_id, address indexed client, address indexed freelancer, bool stake_burned);

    uint8 constant max_verifiers_request=15;
    uint8 constant verifiers_recycling_per_job=5;
    enum JOB_STATUS { OPEN, HIRED_PENDING, HIRED, CLOSED, DISPUTED}
    mapping(uint=>address[]) public verifiers; // categorizes the verifiers based on their category

    struct Freelancer {
        uint allowed_levels;// optional
        uint successful_jobs; // optional
        uint total_jobs; // optional

    }

    uint constant public stake_decimal=1000;
    uint constant public verifier_decimal=100;
    struct Level {
        uint min_verifiers_portion;
        uint stake_portion;
        uint max_amount;
        uint payment_duration;
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
        bool verifiers_selected;
        uint amount;
        bool client_alone_approved;
        uint remain_min_verifiers;
        uint time_limit;
        uint expiry_timestamp;
        uint level_id;
        uint category;
        mapping(address => bool) verifiers_allowed;
    }

    bytes32[] public job_lists;

    mapping(uint256 => bytes32) public verifier_requests;

    mapping(bytes32 => Job) private jobs;

    mapping(address => Freelancer) public freelancers;

    constructor(address coordinator, uint256 subscription_id) RandomValuesGenerator(coordinator, subscription_id) {
    }

    function set_up_levels(Level[] memory _levels) public onlyOwner {
        delete levels;
        for (uint i = 0; i < _levels.length; i++) levels.push(_levels[i]);
    }

    function add_verifier(address verifier, uint category) public onlyOwner {
        verifiers[category].push(verifier);
    }

    function register_freelancer(address freelancer, uint allowed_levels) public onlyOwner {
        freelancers[freelancer] = Freelancer(allowed_levels, 0, 0);
    }
    function request_random_nums(
        bool enable_native_payment,
        uint32 number_verifiers,
        bytes32 job_id
    ) public onlyOwner {
        Job storage job = jobs[job_id];

        require(number_verifiers <= max_num_words, "Too many verifiers requested");
        require(!job.verifiers_selected, "Verifiers already selected for this job");
        require(verifiers[job.category].length >= number_verifiers, "Not enough verifiers in this category");

        uint256 request_id = s_vrfCoordinator.requestRandomWords(
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

        verifier_requests[request_id] = job_id;
        emit RequestSent(request_id, uint32(number_verifiers));
    }


    function fulfillRandomWords(uint256 request_id, uint256[] calldata random_values) internal override {
        bytes32 job_id = verifier_requests[request_id];
        Job storage job = jobs[job_id];
        address[] storage potential_verifiers = verifiers[job.category];
        for (uint256 i=0; i < potential_verifiers.length; i++) job.verifiers_allowed[potential_verifiers[i]] = false; // clear up the previous
        require(potential_verifiers.length >= random_values.length, "Not enough verifiers available in this category");
        bool[] memory used = new bool[](potential_verifiers.length);

        for (uint256 i = 0; i < random_values.length; i++) {
            uint256 r = random_values[i] % potential_verifiers.length;
            while (used[r]) r = (r + 1) % potential_verifiers.length;
            used[r] = true;
            job.verifiers_allowed[potential_verifiers[r]] = true;
        }
        job.verifiers_selected = true;
        emit request_fulfilled(request_id, random_values);
    }
    function post_job(uint amount, uint max_duration, uint category) public {
        require(amount > 0, "Amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to post job");
        _transfer(msg.sender, address(this), amount);
        bytes32 job_id=keccak256(abi.encodePacked(msg.sender, block.timestamp));
        Job storage new_job = jobs[job_id];
        new_job.client = msg.sender;
        new_job.amount = amount;
        new_job.category=category;
        new_job.time_limit=max_duration;
        new_job.level_id=calculate_level(amount);
        new_job.remain_min_verifiers=levels[new_job.level_id].min_verifiers_portion * verifiers[category].length / verifier_decimal;
        new_job.status=JOB_STATUS.OPEN; // open
        new_job.stakes_lost=0;
        new_job.disputes_raised=0;
        new_job.client_alone_approved=false;
        job_lists.push(job_id);
        emit job_posted(job_id, msg.sender, amount, category, new_job.level_id);
        request_random_nums(false,new_job.min_verifiers, job_id);
    }
    function cancel_job(bytes32 job_id) public {
        Job storage job = jobs[job_id];
        require(job.client==msg.sender, "Only client can cancel");
        require(job.status==JOB_STATUS.OPEN, "Job is not in open state");
        require(job.stakes_lost <= job.amount, "Stakes lost exceed job amount"); // you can't just post job to make others loss
        uint256 refund_amount=job.amount - job.stakes_lost;
        _transfer(address(this), job.client, refund_amount);
        job.status=JOB_STATUS.CLOSED; // cancelled
    }

    function hire(bytes32 job_id, address freelancer) public {
        Job storage job = jobs[job_id];
        Freelancer storage worker = freelancers[worker];

        require(job.client==msg.sender, "Only client can hire");
        require(job.status == JOB_STATUS.OPEN, "Job is not open for hiring");
        require(job.client!= worker, "Client cannot hire themselves");
        require(worker.allowed_levels >= job.level_id, "Freelancer level not sufficient");
        job.freelancer =msg.sender;
        job.status=1; // pending acceptance
        emit job_hired(job_id, msg.sender, freelancer);
    }

    function cancel_pending_hire(bytes32 job_id) public {
        Job storage job = jobs[job_id];
        require(job.client==msg.sender, "Only client can cancel hire");
        require(job.status==JOB_STATUS.HIRED_PENDING, "Job is not in pending state");
        job.freelancer=address(0);
        job.status=JOB_STATUS.OPEN; // open again
    }

    function accept_job(bytes32 job_id) public {
        Job storage job = jobs[job_id];
        require(job.status==1, "Job is not in pending state");
        require(job.freelancer ==msg.sender, "No pending job for this freelancer");
        uint stake_amount=levels[job.level_id].stake_portion * job.amount / stake_decimal;
        require(_transfer(msg.sender, address(this), stake_amount), "Stake transfer failed");
        job.freelancer_approved=true;
        job.status=JOB_STATUS.HIRED;// hired
        job.expiry_timestamp=block.timestamp + job.time_limit;
        freelancers[job.freelancer].total_jobs++;
        emit job_accepted(job_id, msg.sender);
    }
    function cancel_hire(bytes32 job_id, bool should_return_stake) public {
        Job storage job = jobs[job_id];
        require(job.client==msg.sender, "Only client can cancel hire");
        require(job.status==JOB_STATUS.HIRED, "Job is not in hired state");
        require(job.expiry_timestamp < block.timestamp, "Job time limit not yet expired");
        require(!job.freelancer_completed, "Freelancer has already completed the job");
        uint stake_amount=levels[job.level_id].stake_portion * job.amount / stake_decimal;
        if (should_return_stake) _transfer(address(this), job.freelancer, stake_amount); // out of mercy and some common mutual understanding
        else _burn(address(this), stake_amount); // burn stake // we don't add here stack lost because it is the fault of the freelancer
        job.freelancer=address(0);
        job.status=JOB_STATUS.OPEN; // open again
    }



    function complete_job(bytes32 job_id) public {
        Job storage job = jobs[job_id];
        require(job.status==JOB_STATUS.HIRED, "Job is not in hired state");
        require(job.freelancer ==msg.sender, "Only hired freelancer can complete the job");
        job.freelancer_completed=true;
        job.appeal_time=block.timestamp+levels[job.level_id].payment_duration;
        emit job_completed(job_id, msg.sender);
    }
    function pay_him(bytes32 job_id) public {
        Job storage job = jobs[job_id];
        require(job.client==msg.sender, "Only client can pay");
        require(job.status==2, "Job is not in hired state");
        require(job.freelancer_completed, "Freelancer has not completed the job");
        uint256 stake_amount=levels[job.level_id].stake_portion * job.amount / stake_decimal;
        _transfer(address(this), job.freelancer, job.amount + stake_amount);// pay freelancer
        freelancers[job.freelancer].successful_jobs +=1;
        job.status=JOB_STATUS.CLOSED; // completed
    }

    function raise_dispute(bytes32 job_id) public {
        Job storage job = jobs[job_id];
        require(job.freelancer==msg.sender, "Only hired freelancer can raise dispute");
        require(job.status==JOB_STATUS.HIRED, "Job is not in hired state");
        require(job.freelancer_completed, "Freelancer has not approved the job");
        require(job.appeal_time < block.timestamp, "Appeal time not yet expired");
        job.status=JOB_STATUS.DISPUTED; // disputed
        if (job.disputes_raised == verifiers_recycling_per_job) {
            job.disputes_raised = 0; // reset counter
            request_random_nums(false, verifiers_recycling_per_job, job_id);
        }
        job.disputes_raised += 1;
        emit job_disputed(job_id, job.client, msg.sender, false);
    }
    function pay_me(bytes32 job_id) public {
        Job storage job = jobs[job_id];
        require(job.status==JOB_STATUS.HIRED, "Job is not in hired state");
        require(job.freelancer_completed, "Freelancer has not completed the job");
        require(job.freelancer ==msg.sender, "Only hired freelancer can request payment");
        require(job.expiry_timestamp < block.timestamp, "Job time limit not yet expired");
        require(job.remain_min_verifiers==0, "Not enough verifiers approved");
        uint256 stake_amount=levels[job.level_id].stake_portion * job.amount / stake_decimal;
        _transfer(address(this), job.freelancer, job.amount + stake_amount);// pay freelancer
        freelancers[job.freelancer].successful_jobs +=1;
        job.status=JOB_STATUS.CLOSED; // completed
    }

    function approve_job(bytes32 job_id) public {
        Job storage job = jobs[job_id];
        require(job.status==JOB_STATUS.HIRED, "Job is not in hired state");
        require(job.verifiers_allowed[msg.sender], "You are not an authorized verifier for this job");
        require(job.freelancer_completed, "Freelancer has not completed the job");
        job.remain_min_verifiers -= 1;
    }





    function refute_job_after_expire(bytes32 job_id, bool should_burn) public {
        Job storage job = jobs[job_id];
        require(job.client==msg.sender, "Only client can refute");
        require(job.status==2, "Job is not in hired state");
        require(job.expiry_timestamp < block.timestamp, "Job time limit not yet expired");
        require(job.remain_min_verifiers > 0, "Work is approved as legit");
        uint stake_amount=levels[job.level_id].stake_portion * job.amount / stake_decimal;
        if (should_burn) _burn(address(this), stake_amount); // burn stake
        else _transfer(job.freelancer, stake_amount); // return stake

        job.status=JOB_STATUS.OPEN; // open again
    }
    function calculate_level(uint256 amount) internal view returns(uint256 mid) {
        uint256 low=0;
        uint256 high=levels.length-1;
        while (low<high){
            uint256 mid=low+(high-low)/2;
            if (levels[mid].max_amount==amount){
                return mid;
            }
            else if (levels[mid].max_amount<amount) {
                low=mid+1;
            }
            else{
                high=mid;
            }
        }
        return low;
    }

}

