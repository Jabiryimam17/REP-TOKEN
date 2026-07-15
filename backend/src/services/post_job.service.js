import db from "../models/index.js"
import job_manager_create from "#utils/contracts/job_manager.util.js"
import verifier_create from "#utils/contracts/verifier.util.js"
import * as assert from "node:assert";
import {ethers} from "ethers";
import * as buffer from "node:buffer";

export default async (job, user_id)=> {
    if (!await check_job(job, user_id)) return false;
    const id = Buffer.from(job.bytes_id.slice(2), 'hex');
    let {title, description, category, amount, bid_duration, topics, skills, company}=job;
    const salary=BigInt(amount);
    topics = JSON.stringify(topics);
    skills = JSON.stringify(skills);
    const employer_id=user_id;
    const published_date=new Date().toISOString().slice(0, 19).replace("T", " ");

    await db.query("INSERT INTO jobs (id, employer_id, title, description, category, topics, company, skills, salary, bid_duration, state, published_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id", [id, employer_id, title, description, category, topics, company, skills, salary, bid_duration, 'OPEN', published_date]);
    return true;
}

async function check_job(job, user_id) {

    const {bytes_id, category, amount} = job;
    const salary =BigInt(amount);
    const job_manager = await job_manager_create();
    const bc_job = await job_manager.jobs(bytes_id);
    const bc_salary = bc_job.amount;
    if (BigInt(salary) !== BigInt(bc_salary)) return false;
    const verifier = await verifier_create();
    const bc_d_job=await verifier.disputed_jobs(bytes_id);

    const categories = await verifier.get_categories();
    if (!categories.includes(category)) return false;
    if (category !== categories[bc_d_job.category]) return false;

    const client_address= bc_job.client;
    const normalize = ethers.getAddress(client_address);
    const hash_address= ethers.keccak256(ethers.getBytes(normalize))
    const [users]=await db.query("SELECT * FROM users WHERE hash_address=? AND id=?", [hash_address, user_id]);
    return users.length > 0;
}
