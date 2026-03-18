import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
    });
};

// SIGN UP
export const signUp = async (req: Request, res: Response) => {
    try {
        const { username, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 🔥 THIS IS IMPORTANT
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword, // ✅ NOT plain password
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

// SIGN IN
export const signIn = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        console.log("Login request:", email, password);

        const user = await User.findOne({ email });
        console.log("User found:", user);

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        console.log("Stored password:", user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({
            token: generateToken(user._id.toString()),
            role: user.role,
        });
    } catch (error) {
        console.log("ERROR:", error); // 🔥 IMPORTANT
        res.status(500).json({ message: "Server error" });
    }
};