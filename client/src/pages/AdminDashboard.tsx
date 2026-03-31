import { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type DashboardData = {
    totalOPs: number;
    pharmacyRevenue: number;
    opRevenue: number;
    dailyRevenue: number;
    revenueByDate: {
        _id: {
            day: number;
            month: number;
            year: number;
        };
        total: number;
    }[];
};

const AdminDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/admin/dashboard", {


                });
                setData(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchDashboard();
    }, []);

    // Format chart data
    const chartData =
        data?.revenueByDate.map((item) => ({
            date: `${item._id.day}/${item._id.month}`,
            revenue: item.total,
        })) || [];

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>

            {/* 🔥 Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total OPs</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                        {data?.totalOPs || 0}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pharmacy Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                        ₹{data?.pharmacyRevenue || 0}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>OP Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                        ₹{data?.opRevenue || 0}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Today Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                        ₹{data?.dailyRevenue || 0}
                    </CardContent>
                </Card>
            </div>

            {/* 📈 Revenue Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="revenue" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboard;