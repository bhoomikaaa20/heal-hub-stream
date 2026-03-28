import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
    name: String,
    seq: { type: Number, default: 0 },
});

export default mongoose.model("Counter", counterSchema);