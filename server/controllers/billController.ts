import { Request, Response } from "express";
import Bill from "../models/Bill";

export const createBill = async (req: Request, res: Response) => {
    try {
        const {
            patient_id,
            consultation_id,
            items,
            consultation_fee,
            payment_mode,
        } = req.body;

        // ✅ 🔥 ADD THIS HERE (before saving)
        const updatedItems = items.map((item: any) => ({
            ...item,
            total: item.quantity * item.price,
        }));

        // ✅ Calculate total amount
        const medicinesTotal = updatedItems.reduce(
            (sum: number, item: any) => sum + item.total,
            0
        );

        const total_amount = medicinesTotal + (consultation_fee || 0);

        // ✅ Save bill
        const bill = await Bill.create({
            patient_id,
            consultation_id,
            items: updatedItems,
            consultation_fee,
            total_amount,
            payment_mode,
        });

        res.status(201).json(bill);
    } catch (error) {
        console.error("Create Bill Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};