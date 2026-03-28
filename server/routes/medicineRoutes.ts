import { Router } from "express";
import { addMedicine, getMedicines } from "../controllers/medicineController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, addMedicine);
router.get("/", protect, getMedicines);

export default router;