import {post_disputeService as post_dispute} from '#services/post_dispute.service.js';

export async function post_dispute_controller(req, res) {
    if (req.body.dispute && await post_dispute(req.body.dispute)) {
        return res.status(201).json({message: "Dispute posted successfully"});
    } else {
        return res.status(400).json({message: "Failed to post dispute"});
    }
}

export default post_dispute_controller;