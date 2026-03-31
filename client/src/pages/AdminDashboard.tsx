import { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

type DashboardData = {
    totalOPs: number;
    pharmacyRevenue: number;
    opRevenue: number;
    dailyRevenue: number;
};

const AdminDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);

    const [patients, setPatients] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const { signOut } = useAuth();
    const navigate = useNavigate();

    // 🔥 Logout
    const handleLogout = () => {
        signOut();
        navigate("/login");
    };

    // ✅ Dashboard data (UNCHANGED)
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get(
                    "https://heal-hub-stream-8.onrender.com/api/admin/dashboard"
                );
                setData(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchDashboard();
    }, []);

    // 🔥 Patients (pagination)
    const fetchPatients = async () => {
        try {
            const res = await axios.get(
                "https://heal-hub-stream-8.onrender.com/api/admin/patients-history",
                {
                    params: { page },
                }
            );

            setPatients(res.data.patients);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [page]);

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

            {/* 🔥 Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">
                    Admin Dashboard
                </h1>

                <Button
                    onClick={handleLogout}
                    className="bg-[#2f9e85] hover:bg-[#267c6a]"
                >
                    Logout
                </Button>
            </div>

            {/* 🔥 Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <Card className="border rounded-xl bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-500">
                            Total OPs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-gray-800">
                        {data?.totalOPs || 0}
                    </CardContent>
                </Card>

                <Card className="border rounded-xl bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-500">
                            Pharmacy Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-gray-800">
                        ₹{data?.pharmacyRevenue || 0}
                    </CardContent>
                </Card>

                <Card className="border rounded-xl bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-500">
                            OP Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-gray-800">
                        ₹{data?.opRevenue || 0}
                    </CardContent>
                </Card>

                <Card className="border rounded-xl bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-500">
                            Today Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-gray-800">
                        ₹{data?.dailyRevenue || 0}
                    </CardContent>
                </Card>

            </div>

            {/* 🔥 Patient History */}
            <div className="bg-white border rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Patient History
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="p-2 text-left">Name</th>
                                <th className="p-2">Age</th>
                                <th className="p-2">Gender</th>
                                <th className="p-2">Phone</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {patients.length > 0 ? (
                                patients.map((p, index) => (
                                    <tr
                                        key={index}
                                        className="border-b hover:bg-gray-50 transition"
                                    >
                                        <td className="p-2">{p.name}</td>
                                        <td className="p-2 text-center">{p.age}</td>
                                        <td className="p-2 text-center">{p.gender}</td>
                                        <td className="p-2 text-center">{p.phone}</td>

                                        {/* Status */}
                                        <td className="p-2 text-center">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium
                        ${p.status === "NEW"
                                                        ? "bg-blue-100 text-blue-600"
                                                        : p.status === "WAITING"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : p.status === "PRESCRIBED"
                                                                ? "bg-purple-100 text-purple-600"
                                                                : "bg-gray-200 text-gray-700"
                                                    }`}
                                            >
                                                {p.status}
                                            </span>
                                        </td>

                                        <td className="p-2 text-center">
                                            {new Date(p.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center p-4 text-gray-400">
                                        No data found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 🔥 Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <button
                        className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-100 transition disabled:opacity-50"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Prev
                    </button>

                    <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        className="px-4 py-1 bg-[#2f9e85] text-white rounded hover:bg-[#267c6a] transition disabled:opacity-50"
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;