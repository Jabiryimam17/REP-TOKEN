import axios from "axios";

export async function get_employer_jobs() {
    try {
        const response = await axios.get("http://localhost:3333/api/employers", { withCredentials: true });
        return response.data || [];
    } catch (error) {
        console.error("Error getting employer jobs:", error);
        return [];
    }
}
