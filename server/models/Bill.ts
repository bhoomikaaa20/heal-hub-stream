import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
    {
        patient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },

        consultation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Consultation",
        },

        // 🔥 Medicines (Pharmacy Items)
        items: [
            {
                medicineName: { type: String, required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true }, // price per unit
                total: { type: Number, required: true }, // quantity * price
            },
        ],

        // 🔥 NEW → Consultation Fee (for OP revenue)
        consultation_fee: {
            type: Number,
            default: 0,
        },

        // 🔥 Total bill amount (consultation + medicines)
        total_amount: {
            type: Number,
            required: true,
        },

        payment_mode: {
            type: String,
            enum: ["CASH", "UPI", "CARD"],
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Bill", billSchema);