import logout from '#services/logout.service.js'

const logout_controller=(req,res)=>{
    if (logout(req,res)) return res.status(200).json({message:"Logged out successfully"});
    return res.status(500).json({error:"Internal server error"});
};

export default logout_controller;