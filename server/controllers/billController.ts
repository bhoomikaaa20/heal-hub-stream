import { Request, Response } from "express";
import Bill from "../models/Bill";
import Patient from "../models/Patient";

// CREATE BILL + COMPLETE
export const createBill = async (req: Request, res: Response) => {
    try {
        const { patient_id, consultation_id, items, total_amount } = req.body;

        const bill = await Bill.create({
            patient_id,
            consultation_id,
            items,
            total_amount,
        });

        // update patient status → COMPLETED
        await Patient.findByIdAndUpdate(patient_id, {
            status: "COMPLETED",
        });

        res.json(bill);
    } catch (error) {
        res.status(500).json({ message: "Error creating bill" });
    }
};