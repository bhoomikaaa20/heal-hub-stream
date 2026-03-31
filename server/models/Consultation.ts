import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
    {
        patient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },
        doctor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        diagnosis: String,
        notes: String,

        // ✅ UPDATED
        prescription: [
            {
                medicineName: String,
                quantity: Number,
                price: Number,
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Consultation", consultationSchema);