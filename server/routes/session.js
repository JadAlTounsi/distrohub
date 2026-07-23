import express from "express";
import { getSession } from "../controllers/sessionController.js";

const router = express.Router();

router.get("/", getSession);

export default router;
