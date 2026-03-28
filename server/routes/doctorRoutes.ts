import express from "express";
import { getDoctors } from "../controllers/doctorController";

const router = express.Router();

// GET all doctors
// URL → /api/doctors
router.get("/", getDoctors);

export default router;