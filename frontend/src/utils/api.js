import axios from "axios";

/**
 * Centralized API client for the backend.
 *
 * The backend URL is configured via the NEXT_PUBLIC_API_URL environment
 * variable so the same code works in development (localhost:3333) and in
 * production (the Railway backend URL). Falls back to the local backend
 * when the variable is not set.
 *
 * Set NEXT_PUBLIC_API_URL in your environment:
 *   - locally:  frontend/.env.local
 *   - on Vercel: Project Settings -> Environment Variables
 */
export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export default api;
