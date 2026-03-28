import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
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
        status: {
            type: String,
            enum: ["WAITING", "IN_PROGRESS", "COMPLETED"],
            default: "WAITING",
        },
        payment_required: Boolean,
        payment_mode: {
            type: String,
            enum: ["CASH", "ONLINE", null],
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Visit", visitSchema);