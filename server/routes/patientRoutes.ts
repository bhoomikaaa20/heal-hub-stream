import express from "express";
import {
    createPatient,
    getPatients,
    checkPaymentRequired,
} from "../controllers/patientController";

const router = express.Router();

router.post("/", createPatient);
router.get("/", getPatients);
router.get("/check-payment", checkPaymentRequired);

export default router;