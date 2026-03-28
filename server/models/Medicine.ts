import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 }, // ✅ fix
});

export default mongoose.model("Medicine", medicineSchema);