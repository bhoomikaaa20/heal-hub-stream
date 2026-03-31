import mongoose, { Document } from "mongoose";

export interface IConsultation extends Document {
    patient_id: mongoose.Types.ObjectId;
    visit_id: mongoose.Types.ObjectId; // ✅ ADD THIS
    doctor_id: mongoose.Types.ObjectId;
    diagnosis?: string;
    prescription?: string[];
    notes?: string;
}

const consultationSchema = new mongoose.Schema<IConsultation>(
    {
        patient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },
        visit_id: {   // ✅ MAKE SURE THIS EXISTS
            type: mongoose.Schema.Types.ObjectId,
            ref: "Visit",
            required: true,
        },
        doctor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        diagnosis: String,
        prescription: [
            {
                medicineName: String,
                quantity: Number,
            },
        ],
        notes: String,
    },
    { timestamps: true }
);

export default mongoose.model<IConsultation>("Consultation", consultationSchema);