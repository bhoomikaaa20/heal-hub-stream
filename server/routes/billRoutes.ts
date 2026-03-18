import { Router } from "express";
import { createBill } from "../controllers/billController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createBill);

export default router;