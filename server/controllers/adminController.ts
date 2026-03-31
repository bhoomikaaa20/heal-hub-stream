import { Request, Response } from "express";
import Patient from "../models/Patient";
import Bill from "../models/Bill";

export const getDashboard = async (req: Request, res: Response) => {
    try {
        // ✅ Start & End of today (IST safe)
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        // ✅ 1. Total OPs (all patients)
        const totalOPs = await Patient.countDocuments();

        // ✅ 2. Today OPs (patients created today)
        const todayOPs = await Patient.countDocuments({
            createdAt: {
                $gte: start,
                $lte: end,
            },
        });

        const OP_FEE = 100;

        const opRevenue = todayOPs * OP_FEE;

        // ✅ 3. Pharmacy Revenue (today)
        const pharmacyAgg = await Bill.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: start,
                        $lte: end,
                    },
                },
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $multiply: ["$items.quantity", "$items.price"],
                        },
                    },
                },
            },
        ]);

        const pharmacyRevenue = pharmacyAgg[0]?.total || 0;

        // ✅ 4. Today Revenue
        const dailyRevenue = opRevenue + pharmacyRevenue;

        // ✅ 5. Revenue Chart
        const revenueByDate = await Bill.aggregate([
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    total: { $sum: "$total_amount" },
                },
            },
            { $sort: { "_id.month": 1, "_id.day": 1 } },
        ]);

        res.json({
            totalOPs,
            pharmacyRevenue,
            opRevenue,
            dailyRevenue,
            revenueByDate,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching dashboard" });
    }
};