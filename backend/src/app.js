import express from "express";
import notesRoutes from "./routes/pipeline.js";
import cors from "cors"
const app = express();

app.use(cors({
    origin: "*",
    Credentials: true
}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended:true, limit: "16kb"}));
app.use(express.static("public"));
app.use("/", notesRoutes);

export { app }