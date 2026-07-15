import api from "../utils/api.js";

export async function get_employer_jobs() {
    try {
        const response = await api.get("/api/employers");
        return response.data || [];
    } catch (error) {
        console.error("Error getting employer jobs:", error);
        return [];
    }
}
