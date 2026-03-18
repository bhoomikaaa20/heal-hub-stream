import { Request, Response } from "express";
import Consultation from "../models/Consultation";
import Patient from "../models/Patient";

// CREATE CONSULTATION
export const createConsultation = async (req: any, res: Response) => {
    try {
        const { patient_id, prescription } = req.body;

        const consultation = await Consultation.create({
            patient_id,
            doctor_id: req.user.id, // from JWT
            prescription,
        });

        // update patient status
        await Patient.findByIdAndUpdate(patient_id, {
            status: "PRESCRIBED",
        });

        res.json(consultation);
    } catch (error) {
        res.status(500).json({ message: "Error saving consultation" });
    }
};

// GET CONSULTATIONS BY PATIENT
export const getConsultations = async (req: Request, res: Response) => {
    try {
        const consultations = await Consultation.find({
            patient_id: req.params.patientId,
        }).sort({ createdAt: -1 });

        res.json(consultations);
    } catch {
        res.status(500).json({ message: "Error fetching consultations" });
    }
};