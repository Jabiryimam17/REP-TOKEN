
import employer_service from "#services/employer.service.js"
const employer_controller = async (req, res) => {
    try {
        const id = req.user.id;
        const employer = await employer_service(id);
        res.status(200).json(employer);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: "Internal server error"})
    }

}

export default employer_controller;