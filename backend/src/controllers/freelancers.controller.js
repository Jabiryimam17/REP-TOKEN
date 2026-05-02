import freelancers_service from '#services/freelancers.service.js';

const freelancers_controller = async (req, res) => {
    try {
        const filters = {
            category: req.query.category,
            skills: req.query.skills,
            min_wage: req.query.min_wage,
            max_wage: req.query.max_wage,
            search: req.query.search,
            page: req.query.page || 1,
            limit: req.query.limit || 10
        };
        const result = await freelancers_service(filters);
        res.status(200).json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

export default freelancers_controller;