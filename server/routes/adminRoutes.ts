import express from "express";
import { getDashboard } from "../controllers/adminController";
import { getPatientHistory } from "../controllers/adminController";

const router = express.Router();

// 🔐 Protect route (only logged-in users)
router.get("/dashboard", getDashboard);
router.get("/patients-history", getPatientHistory);

export default router;