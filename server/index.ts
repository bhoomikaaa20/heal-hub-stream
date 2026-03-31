import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";

// Routes (create these files)
import patientRoutes from "./routes/patientRoutes"
import consultationRoutes from "./routes/consultationRoutes";
import authRoutes from "./routes/authRoutes";
import billRoutes from "./routes/billRoutes";
import visitRoutes from "./routes/visitRoutes";
import doctorRoutes from "./routes/doctorRoutes";
import medicineRoutes from "./routes/medicineRoutes";
import adminRoutes from "./routes/adminRoutes"





dotenv.config();

const app: Application = express();

// Middleware
app.use(cors({
  origin: "https://frabjous-zuccutto-e25bf6.netlify.app", // or your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

//Mongodb Connection
connectDB();



app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/admin", adminRoutes);


app.get("/api/test", (req, res) => {
  res.send("TEST WORKING");
});

// Server start
const PORT = parseInt(process.env.PORT || "5000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
