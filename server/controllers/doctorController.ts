import { Request, Response } from "express";
import User from "../models/User";

// GET all doctors
export const getDoctors = async (req: Request, res: Response) => {
    try {
        // Fetch only users with role = "doctor"
        const doctors = await User.find({ role: "doctor" })
            .select("-password"); // hide password field

        res.status(200).json(doctors);
    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({
            message: "Failed to fetch doctors",
        });
    }
};