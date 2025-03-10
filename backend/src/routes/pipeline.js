import express from "express";
import { generateNotesController } from "../controllers/pipeline.controller.js";

const router = express.Router();

router.post("/generate-notes", generateNotesController);

export default router;
