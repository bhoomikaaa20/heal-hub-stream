import { Request, Response } from "express";
import Bill from "../models/Bill";
import Patient from "../models/Patient";
import Medicine from "../models/Medicine";

export const createBill = async (req: Request, res: Response) => {
    try {
        const { patient_id, consultation_id, items, total_amount, payment_mode } = req.body;

        // 🔥 Update stock
        for (const item of items) {
            const med = await Medicine.findOne({ name: item.medicineName });

            if (!med) {
                return res.status(400).json({ message: `${item.medicineName} not found` });
            }

            if (med.quantity < item.quantity) {
                return res.status(400).json({ message: `${item.medicineName} out of stock` });
            }

            med.quantity -= item.quantity;
            await med.save();
        }

        const bill = await Bill.create({
            patient_id,
            consultation_id,
            items,
            total_amount,
            payment_mode,
        });

        await Patient.findOneAndUpdate(
            { _id: patient_id },
            { status: "COMPLETED" },

        );

        console.log("Patient marked COMPLETED:", patient_id);

        res.json(bill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating bill" });
    }
};