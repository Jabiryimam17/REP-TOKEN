import {sign_up} from "#services/signup.service.js";
const signup_controller = async (req, res) => {
    try {
        const user = req.body;
        if (req.file) {
            user.profile_picture = req.file.path;
        }
        if (await sign_up(user)) res.status(201).send({message: "User registered successfully"});
        else res.status(500).send({message: "Error registering user"});
    } catch (e) {
        console.error(e);
        res.status(500).json({error:"Internal server error"})
    }

}

export default signup_controller;