import { Request, Response } from "express";
import Medicine from "../models/Medicine";

// ✅ Add medicine
export const addMedicine = async (req: Request, res: Response) => {
    try {
        const { name, price, quantity } = req.body;

        const med = await Medicine.create({ name, price, quantity });

        res.json(med);
    } catch {
        res.status(500).json({ message: "Error adding medicine" });
    }
};

// ✅ Get medicines
export const getMedicines = async (req: Request, res: Response) => {
    const meds = await Medicine.find();
    res.json(meds);
};