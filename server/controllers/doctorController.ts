import { Request, Response } from "express";
import User from "../models/User";
import Consultation from "../models/Consultation";
import Visit from "../models/Visit";
import mongoose from "mongoose";


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

// 🔥 GET QUEUE (ONLY IN_PROGRESS)
export const getDoctorQueue = async (req: any, res: Response) => {
    try {
        const doctor_id = req.user.id; // ✅ from JWT

        const visits = await Visit.find({
            status: "IN_PROGRESS",
            doctor_id: doctor_id,
        })
            .populate("patient_id")
            .sort({ createdAt: -1 });

        res.json(visits);
    } catch (err) {
        res.status(500).json({ message: "Error fetching queue" });
    }
};

// 🔥 SAVE CONSULTATION
export const saveConsultation = async (req: any, res: Response) => {
    try {
        const { patient_id, visit_id, diagnosis, prescription, notes } =
            req.body;
        const doctor_id = req.user.id; // ✅ from JWT

        const consultation = await Consultation.create({
            patient_id,
            visit_id,
            doctor_id,
            diagnosis,
            prescription,
            notes,
        });

        res.json(consultation);
    } catch {

        res.status(500).json({ message: "Error saving consultation" });
    }
};

// 🔥 SEND TO PHARMACY
export const sendToPharmacy = async (req: Request, res: Response) => {
    try {
        const { visit_id } = req.body;

        await Visit.findByIdAndUpdate(visit_id, {
            status: "COMPLETED",
        });

        res.json({ message: "Sent to pharmacy" });
    } catch {
        res.status(500).json({ message: "Error updating status" });
    }
};

// 🔥 GET DOCTOR HISTORY

export const getDoctorHistory = async (req: any, res: Response) => {
    try {
        const doctor_id = req.user.id;
        const { patient_id } = req.query;

        const filter: any = {
            doctor_id: new mongoose.Types.ObjectId(doctor_id),
        };

        if (patient_id) {
            filter.patient_id = new mongoose.Types.ObjectId(patient_id); // ✅ FIX
        }

        const consultations = await Consultation.find(filter)
            .populate("patient_id")
            .sort({ createdAt: -1 });

        res.json(consultations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching history" });
    }
};