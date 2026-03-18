import mongoose from "mongoose";

export type Role = "receptionist" | "doctor" | "pharmacist";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["receptionist", "doctor", "pharmacist"],
        required: true,
    },
});

export default mongoose.model("User", userSchema);