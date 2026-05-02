import roles_assignments from "#services/roles.service.js";

export default async function roles_assignments_controller(req, res) {
    return res.status(200).json(await roles_assignments());
}