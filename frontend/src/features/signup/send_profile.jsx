import api from "@/utils/api"

export default async (user_data) => {
    try {
        let payload = user_data;
        let headers = {};

        if (user_data.profile_picture) {
            payload = new FormData();
            Object.keys(user_data).forEach(key => {
                if (key === 'profile_picture') {
                    payload.append('profile_picture', user_data[key]);
                } else {
                    payload.append(key, user_data[key]);
                }
            });
            headers = { 'Content-Type': 'multipart/form-data' };
        }

        const response = await api.post("/api/auth/signup", payload, { headers });
        if (response.status === 201) {
            return true;
        } else {
            console.error("Signup failed with status:", response.status);
            return false;
        }
    } catch (error) {
        console.error("Signup error:", error);
        return false;
    }
}