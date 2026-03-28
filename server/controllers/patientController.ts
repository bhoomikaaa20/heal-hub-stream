import { Request, Response } from "express";
import Patient from "../models/Patient";
import Visit from "../models/Visit";
import Counter from "../models/Counter";

// 🔥 SERIAL ID
const generatePatientId = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: "patientId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    return "P" + counter.seq.toString().padStart(3, "0");
};

// 🔥 CHECK PAYMENT REQUIRED
export const checkPaymentRequired = async (req: Request, res: Response) => {
    try {
        const { phone } = req.query;

        const patient = await Patient.findOne({ phone });

        if (!patient) {
            return res.json({ payment_required: true });
        }

        const lastVisit = await Visit.findOne({ patient_id: patient._id })
            .sort({ createdAt: -1 });

        if (!lastVisit) {
            return res.json({ payment_required: true });
        }

        const diffDays =
            (Date.now() - new Date(lastVisit.createdAt).getTime()) /
            (1000 * 60 * 60 * 24);

        if (diffDays <= 15) {
            return res.json({ payment_required: false });
        }

        return res.json({ payment_required: true });
    } catch {
        res.status(500).json({ message: "Error" });
    }
};

// 🔥 CREATE PATIENT + VISIT
export const createPatient = async (req: Request, res: Response) => {
    try {
        const { name, age, gender, phone, payment_mode, doctor_id } = req.body;

        let patient = await Patient.findOne({ phone });

        if (!patient) {
            patient = await Patient.create({
                patient_id: await generatePatientId(),
                name,
                age,
                gender,
                phone,
            });
        }

        const lastVisit = await Visit.findOne({ patient_id: patient._id })
            .sort({ createdAt: -1 });

        let payment_required = true;

        if (lastVisit) {
            const diffDays =
                (Date.now() - new Date(lastVisit.createdAt).getTime()) /
                (1000 * 60 * 60 * 24);

            if (diffDays <= 15) {
                payment_required = false;
            }
        }

        if (payment_required && !payment_mode) {
            return res.status(400).json({ message: "Select payment mode" });
        }

        const visit = await Visit.create({
            patient_id: patient._id,
            doctor_id,
            payment_required,
            payment_mode: payment_required ? payment_mode : null,
        });

        res.json({ patient, visit, payment_required });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error" });
    }
};

// 🔥 GET PATIENTS
export const getPatients = async (req: Request, res: Response) => {
    try {
        const patients = await Patient.find().sort({ createdAt: -1 });

        const data = await Promise.all(
            patients.map(async (p) => {
                const latestVisit = await Visit.findOne({ patient_id: p._id })
                    .sort({ createdAt: -1 });

                return {
                    ...p.toObject(),
                    status: latestVisit?.status || "WAITING",
                };
            })
        );

        res.json(data);
    } catch {
        res.status(500).json({ message: "Error fetching patients" });
    }
};