import forget_password from "#services/forget_password.service.js"

const forget_password_controller = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const result = await forget_password(email);
        if (result) {
            res.status(200).json({ message: "Reset code sent successfully" });
        } else {
            // We return 200 even if user doesn't exist for security reasons (avoid user enumeration)
            // But based on the prompt "if result", I'll follow the existing pattern in send_code.controller.js
            res.status(400).json({ message: "Error sending reset code" });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
}

export default forget_password_controller;
