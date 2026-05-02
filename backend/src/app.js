import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import routes from "#routes/index.js";
import listen_all from "#services/collect_events.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app=express();
listen_all();
app.use(cors({
    origin: "http://localhost:3000", // allow frontend
    credentials: true
}));


app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
routes.forEach(
    r=>app.use(r.path, r.routes)
)
export default app;