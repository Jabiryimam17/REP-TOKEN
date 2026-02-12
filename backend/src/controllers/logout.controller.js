import logout from '#services/logout.service.js'

const logout_controller=(req,res)=>{
    logout(req,res);
    return res.status(200).json({message:"Logged out successfully"});
};

export default logout_controller;