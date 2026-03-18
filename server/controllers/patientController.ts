import { Request, Response } from "express";
import Patient from "../models/Patient";


// Generate patient ID
const generatePatientId = () => {
    return "P" + Math.floor(100000 + Math.random() * 900000);
};

// CREATE PATIENT
export const createPatient = async (req: Request, res: Response) => {
    try {
        const { name, age, gender, phone } = req.body;

        const patient = await Patient.create({
            patient_id: generatePatientId(),
            name,
            age,
            gender,
            phone,
        });

        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: "Error creating patient" });
    }
};

// GET ALL PATIENTS
export const getPatients = async (req: Request, res: Response) => {
    try {
        const patients = await Patient.find().sort({ createdAt: -1 });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: "Error fetching patients" });
    }
};