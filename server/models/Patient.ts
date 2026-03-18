import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
    {
        patient_id: { type: String, unique: true },
        name: { type: String, required: true },
        age: Number,
        gender: String,
        phone: String,
        status: {
            type: String,
            enum: ["NEW", "PRESCRIBED", "COMPLETED"],
            default: "NEW",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);