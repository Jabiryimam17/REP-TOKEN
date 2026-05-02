import axios from "axios";

export async function get_disputes() {
    try {
        const response = await axios.get("http://localhost:3333/api/disputes", { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("Error getting disputes:", error);
        return [];
    }
}
