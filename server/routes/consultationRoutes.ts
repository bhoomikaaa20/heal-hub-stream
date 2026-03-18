import { Router } from "express";
import { createConsultation, getConsultations } from "../controllers/consultationController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createConsultation);
router.get("/:patientId", protect, getConsultations);

export default router;