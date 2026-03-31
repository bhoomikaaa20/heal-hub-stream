import { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type DashboardData = {
    totalOPs: number;
    pharmacyRevenue: number;
    opRevenue: number;
    dailyRevenue: number;
};

const AdminDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);

    // 🔥 Patient pagination state
    const [patients, setPatients] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // ✅ EXISTING FUNCTIONALITY (UNCHANGED)
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get(
                    "http://localhost:5000/api/admin/dashboard"
                );
                setData(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchDashboard();
    }, []);

    // 🔥 NEW: Fetch patients with pagination
    const fetchPatients = async () => {
        try {
            const res = await axios.get(
                "http://localhost:5000/api/admin/patients-history",
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

    // 🔥 Load patients
    useEffect(() => {
        fetchPatients();
    }, [page]);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>

            {/* 🔥 Stats Cards (UNCHANGED) */}
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



            {/* 🔥 NEW: Patient History */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="text-lg font-semibold mb-4">
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
                                        className="border-b hover:bg-gray-50"
                                    >
                                        <td className="p-2">{p.name}</td>
                                        <td className="p-2 text-center">{p.age}</td>
                                        <td className="p-2 text-center">{p.gender}</td>
                                        <td className="p-2 text-center">{p.phone}</td>
                                        <td className="p-2 text-center">{p.status}</td>
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
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Prev
                    </button>

                    <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
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