import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
    });
};

// SIGN UP (UNCHANGED)
export const signUp = async (req: Request, res: Response) => {
    try {
        const { username, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role,
        });

        res.json({
            token: generateToken(user._id.toString()),
            role: user.role,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

// SIGN IN (UPDATED 🔥)
export const signIn = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        console.log("Login request:", email);

        // 🔥 HARDCODED ADMIN LOGIN
        if (email === "admin@gmail.com" && password === "admin@123") {
            const token = jwt.sign(
                { role: "admin", email },
                process.env.JWT_SECRET as string,
                { expiresIn: "7d" }
            );

            return res.json({
                token,
                role: "admin",
            });
        }

        // 🔽 NORMAL USER LOGIN (UNCHANGED)
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({
            token: generateToken(user._id.toString()),
            role: user.role,
        });
    } catch (error) {
        console.log("ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};