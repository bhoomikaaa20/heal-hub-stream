import express from "express";
import { createVisit } from "../controllers/visitController";

const router = express.Router();

router.post("/", createVisit);

export default router;