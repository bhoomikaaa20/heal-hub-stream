import { Request, Response } from "express";
import Visit from "../models/Visit";

// 🔥 UPDATE STATUS TO IN_PROGRESS
export const sendToDoctor = async (req: Request, res: Response) => {
    try {
        const { patient_id } = req.body;

        const visit = await Visit.findOne({ patient_id })
            .sort({ createdAt: -1 });

        if (!visit) {
            return res.status(404).json({ message: "Visit not found" });
        }

        visit.status = "IN_PROGRESS";
        await visit.save();

        res.json({ message: "Patient sent to doctor" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error updating status" });
    }
};