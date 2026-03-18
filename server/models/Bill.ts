import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
    {
        patient_id: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
        consultation_id: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation" },
        items: [
            {
                medicineName: String,
                quantity: Number,
                price: Number,
            },
        ],
        total_amount: Number,
    },
    { timestamps: true }
);

export default mongoose.model("Bill", billSchema);