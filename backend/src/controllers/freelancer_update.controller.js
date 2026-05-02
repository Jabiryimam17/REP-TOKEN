import freelancer_update from "#services/freelancer_update.service.js";

export const freelancer_update_controller = async (req, res) => {
    const user=req.body.user;
    user.id=req.user.id;
    try {
        await freelancer_update(user);
        res.status(200).json({message:"success"});
    }
    catch (e) {
        console.error(e);
        res.status(500).json({error:"Internal server error"})
    }
}