import { Request, Response } from "express";
import Consultation from "../models/Consultation";
import Patient from "../models/Patient";

export const createConsultation = async (req: any, res: Response) => {
    try {
        const { patient_id, prescription, diagnosis, notes } = req.body;

        // ✅ SUPPORT OLD + NEW FORMAT
        const formattedPrescription = prescription.map((item: any) => {
            if (typeof item === "string") {
                return {
                    medicineName: item,
                    quantity: 1,
                    price: 0,
                };
            }
            return item;
        });

        const consultation = await Consultation.create({
            patient_id,
            doctor_id: req.user.id,
            diagnosis,
            notes,
            prescription: formattedPrescription,
        });

        await Patient.findByIdAndUpdate(patient_id, {
            status: "PRESCRIBED",
        });

        res.json(consultation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error saving consultation" });
    }
};

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