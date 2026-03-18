import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
    {
        patient_id: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
        doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        prescription: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model("Consultation", consultationSchema);