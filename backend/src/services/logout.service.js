import {remove_token_cookie} from "#utils/jwt.util.js";

export const logout = (req, res) => {
    try {
        remove_token_cookie(res);
        res.status(200).json({message:"Logged out successfully"});
    } catch (e) {
        console.error(e);
        res.status(500).json({error:"Internal server error"});
    }


};

export default logout;