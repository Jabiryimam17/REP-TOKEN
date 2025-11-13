// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./JobPayingSystem.sol";
contract ReputationToken is ERC20, JobPayingSystem, Ownable {
    constructor() ERC20("ReputationToken", "RPT") JobPayingSystem() {
        mint(msg.sender, 1000000 * 10 ** decimals());
    }
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    function post_job(uint amount, uint max_duration, uint category) public {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to post job");
        _transfer(msg.sender, address(this), amount);
        bytes32 job_id=keccak256(abi.encodePacked(msg.sender, block.timestamp));
        Job storage new_job = jobs[job_id];
        new_job.client = msg.sender;
        new_job.amount = amount;
        new_job.category=category;
        new_job.time_limit=max_duration;
        new_job.level_id=calculate_level(amount);
        new_job.min_verifiers=levels[new_job.level_id].min_verifiers_portion * verifiers[category].length / verifier_decimal;
        request_random_nums(false,new_job.min_verifiers, job_id);
    }

    function hire(bytes32 job_id, address freelancer) public {
        Job storage job = jobs[job_id];
        Freelancer storage worker = freelancers[worker];

        require(job.client==msg.sender, "Only client can hire");
        require(job.status == 0, "Job is not open for hiring");
        require(job.client!= worker, "Client cannot hire themselves");
        require(worker.allowed_levels >= job.level_id, "Freelancer level not sufficient");
        require(balanceOf(worker) >= (levels[job.level_id].stake_portion * job.amount) / stake_decimal, "Freelancer has insufficient stake");
        job.freelancer_in_pending=msg.sender;
        job.status=1; // pending acceptance
    }

    function accept_job(bytes32 job_id) public {
        Job storage job = jobs[job_id];
        require(job.status==1, "Job is not in pending state");
        require(job.freelancer_in_pending==msg.sender, "No pending job for this freelancer");
        job.freelancer_approved=true;
        job.status=2; // hired
        job.expiry_timestamp=block.timestamp + job.time_limit;
        _transfer(msg.sender, address(this), levels[job.level_id].stake_portion * job.amount / stake_decimal);
    }

    function pay_me(bytes32 job_id) public {
        Job storage job = jobs[job_id];
        require(job.status==2, "Job is not in hired state");
        require(job.freelancer_in_pending==msg.sender, "Only hired freelancer can request payment");
        require(job.expiry_timestamp < block.timestamp, "Job time limit not yet expired");
        _transfer(address(this), job.freelancer_in_pending, job.amount + (levels[job.level_id].stake_portion * job.amount / stake_decimal)); // pay freelancer
        job.status=3; // completed
    }

    function refute_job_after_expire(bytes32 job_id, bool should_burn) public {
        Job storage job = jobs[job_id];
        require(job.client==msg.sender, "Only client can refute");
        require(job.status==2, "Job is not in hired state");
        require(job.expiry_timestamp < block.timestamp, "Job time limit not yet expired");
        if (should_burn) _burn(address(this), levels[job.level_id].stake_portion * job.amount / stake_decimal); // burn stake
        else _transfer(levels[job.level_id].stake_portion * job.amount / stake_decimal, job.freelancer_in_pending); // return stake
        job.status=0; // open again
    }
}
