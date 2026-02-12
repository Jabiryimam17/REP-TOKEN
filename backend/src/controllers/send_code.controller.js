import send_code from "#services/send_code.service.js"
const send_code_controller = async (req, res) => {
    try {
        const {email} = req.body;
        const result = await send_code(email);
        if (result) res.status(200).json({message: "Code sent successfully"});
        else res.status(400).json({message: "Error sending code"});
    } catch (e) {
        console.error(e);
        res.status(500).json({error:"Internal server error"})
    }


}

export default send_code_controller;