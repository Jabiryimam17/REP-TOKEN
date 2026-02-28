import post_bid from "#services/post_bid.service.js";

export default async function post_bid_controller(req, res){
        const bid = req.body;
        const user_id = req.user.id;
        const success = await post_bid(bid, user_id);
        if(success){
                res.status(201);
                res.send({message:"Successfully posted bid"});
        }
        else{
                res.status(500)
                res.send({message:"Error posting bid"});
        }
}