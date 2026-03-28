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




dotenv.config();

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

//Mongodb Connection
connectDB();



app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/visits", visitRoutes);


app.get("/api/test", (req, res) => {
  res.send("TEST WORKING");
});

// Server start
const PORT: number = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} `);
});

