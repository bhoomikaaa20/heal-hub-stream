import express from "express";
import { sendToDoctor } from "../controllers/visitController";

const router = express.Router();

router.put("/send", sendToDoctor);

export default router;