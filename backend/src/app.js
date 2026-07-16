import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import routes from "#routes/index.js";
import listen_all from "#services/collect_events.service.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app=express();

// Start blockchain event listener in background
if (process.env.START_LISTENER === "true") {
    listen_all();
}

// CORS: allow the frontend origin (configurable via CORS_ORIGIN env var)
const cors_origin = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(cors({
    origin: cors_origin,
    credentials: true
}));


app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
routes.forEach(
    r=>app.use(r.path, r.routes)
)
export default app;
