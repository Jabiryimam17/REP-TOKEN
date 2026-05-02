
import login_service from "#services/login.service.js";
import {generate_token, set_token_cookie} from "#utils/jwt.util.js"
export const login_controller =  async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await login_service(email, password);
        if (result) {
            set_token_cookie(res, generate_token(result));
            res.status(200).json({ message: "Login successful", data: result });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

}

export default login_controller;