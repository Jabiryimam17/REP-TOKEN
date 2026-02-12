

import verify_email from "#services/verify_email.service.js"

export default async (req, res) => {
    try {
        const {email, code}=req.body;
        const result=await verify_email(email, code);
        if (result) res.status(200).json({message:"Email verified"});
        else res.status(400).json({message:"Invalid verification code"});
    }
    catch (e) {
        console.error(e);
        res.status(500).json({error:"Internal server error"})
    }
}