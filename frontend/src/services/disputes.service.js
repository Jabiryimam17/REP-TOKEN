import api from "../utils/api.js";

export async function get_disputes() {
    try {
        const response = await api.get("/api/disputes");
        return response.data;
    } catch (error) {
        console.error("Error getting disputes:", error);
        return [];
    }
}
