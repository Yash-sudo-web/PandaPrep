import express from "express";
import notesRoutes from "./routes/pipeline.route.js";
import userRoutes from "./routes/user.route.js";
import userHistoryRoutes from "./routes/user-history.route.js";
import contactLogRoutes from "./routes/contact-logs.route.js";
import healthCheckRoutes from "./routes/health-check.route.js";

import cors from "cors"
const app = express();

app.use(cors({
    origin: "*",
    Credentials: true
}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended:true, limit: "16kb"}));
app.use(express.static("public"));
app.use("/api/pipeline", notesRoutes);
app.use("/api/user", userRoutes);
app.use("/api/userHistory", userHistoryRoutes);
app.use("/api", contactLogRoutes);
app.use("/", healthCheckRoutes)

export { app }