import reset_password from "#services/reset_password.service.js"

const reset_password_controller = async (req, res) => {
    try {
        const { email, code, password } = req.body;
        if (!email || !code || !password) {
            return res.status(400).json({ message: "Email, code and password are required" });
        }
        const result = await reset_password(email, code, password);
        if (result.success) {
            res.status(200).json({ message: result.message });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
}

export default reset_password_controller;
