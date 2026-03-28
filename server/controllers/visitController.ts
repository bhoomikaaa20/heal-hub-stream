import { Request, Response } from "express";
import Visit from "../models/Visit";

export const createVisit = async (req: Request, res: Response) => {
    try {
        const { patient_id, doctor_id } = req.body;

        const visit = await Visit.create({
            patient_id,
            doctor_id,
        });

        res.json(visit);
    } catch {
        res.status(500).json({ message: "Error creating visit" });
    }
};