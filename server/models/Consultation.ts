import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
    {
        patient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },
        visit_id: {
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
        prescription: [String], // list of medicines
        notes: String,
    },
    { timestamps: true }
);

export default mongoose.model("Consultation", consultationSchema);