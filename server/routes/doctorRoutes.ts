import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
    getDoctorQueue,
    saveConsultation,
    sendToPharmacy,
    getDoctors,
    getDoctorHistory
} from "../controllers/doctorController";

const router = express.Router();

// GET all doctors
// URL → /api/doctors
router.get("/", getDoctors);
router.get("/queue", protect, getDoctorQueue);
router.post("/consultation", protect, saveConsultation);
router.put("/send", sendToPharmacy);
router.get("/history", protect, getDoctorHistory);

export default router;