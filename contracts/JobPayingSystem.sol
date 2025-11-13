// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RandomValuesGenerator.sol";

contract JobPayingSystem is RandomValuesGenerator {

    mapping(uint=>address[]) public verifiers; // catagorizes the verifiers based on their category

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
    }
    Level[] public levels;

    struct Job {
        address client;
        address freelancer_in_pending;
        bool freelancer_approved;
        uint8 status; // 0 - open, 1- hired_pending, 2-hired, 3-completed, 4-disputed, 5-resolved;
        bool verifiers_selected;
        uint amount;
        uint min_verifiers;
        uint time_limit;
        uint expiry_timestamp;
        uint level_id;
        uint category;
        mapping(address => bool) verifiers_allowed;
    }

    bytes32[] public job_lists;

    mapping(uint256 => bytes32) public verifier_requests;

    mapping(bytes32 => Job) public jobs;

    mapping(address => Freelancer) public freelancers;

    constructor(address coordinator, uint256 subscription_id) RandomValuesGenerator(coordinator, subscription_id) {
    }

    function register_freelancer(address freelancer, uint reputation, uint min_verifiers) public onlyOwner {
        freelancers[freelancer] = Freelancer(0, reputation, min_verifiers);
    }
    function request_random_nums(
        bool enable_native_payment,
        uint32 number_verifiers,
        bytes32 job_id
    ) public onlyOwner returns (uint256 request_id) {
        Job storage job = jobs[job_id];

        require(number_verifiers <= max_num_words, "Too many verifiers requested");
        require(!job.verifiers_selected, "Verifiers already selected for this job");

        request_id = s_vrfCoordinator.requestRandomWords(
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
        return request_id;
    }


    function fulfillRandomWords(uint256 request_id, uint256[] calldata random_values) internal override {
        bytes32 job_id = verifier_requests[request_id];
        Job storage job = jobs[job_id];
        address[] storage potential_verifiers = verifiers[job.category];

        require(potential_verifiers.length >= random_values.length, "Not enough verifiers available in this category");
        // Use a simple boolean array to track already-picked indices
        bool[] memory used = new bool[](potential_verifiers.length);

        for (uint256 i = 0; i < random_values.length; i++) {
            uint256 r = random_values[i] % potential_verifiers.length;

            while (used[r]) {
                r = (r + 1) % potential_verifiers.length;
            }

            used[r] = true;
            job.verifiers_allowed[potential_verifiers[r]] = true;
        }
        job.verifiers_selected = true;
        emit RequestFulfilled(request_id, random_values);
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

