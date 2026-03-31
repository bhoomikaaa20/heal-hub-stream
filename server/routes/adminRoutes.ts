import express from "express";
import { getDashboard } from "../controllers/adminController";

const router = express.Router();

// 🔐 Protect route (only logged-in users)
router.get("/dashboard", getDashboard);

export default router;