
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW: "bg-status-new/15 text-status-new border-status-new/30",
    PRESCRIBED: "bg-status-prescribed/15 text-status-prescribed border-status-prescribed/30",
    COMPLETED: "bg-status-completed/15 text-status-completed border-status-completed/30",
  };
  return <Badge variant="outline" className={colors[status] ?? ""}>{status}</Badge>;
}

export default function ReceptionistDashboard() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState("");

  const qc = useQueryClient();

  // 🔥 Fetch Patients
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/patients", {
        headers: { Authorization: `Bearer ${token} ` },
      });
      return res.json();
    },
  });

  // 🔥 Create Patient
  const createPatient = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
        body: JSON.stringify({
          name,
          age: age ? parseInt(age) : null,
          gender: gender || null,
          phone: phone || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Patient registered!");
      setName(""); setAge(""); setGender(""); setPhone("");
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // 🔥 Fetch Doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/doctors", {
        headers: { Authorization: `Bearer ${token} ` },
      });
      return res.json();
    },
  });



  // 🔥 Create Visit
  const createVisit = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
        body: JSON.stringify({
          patient_id: selectedPatientId,
          doctor_id: doctorId,
        }),
      });

      return res.json();
    },
    onSuccess: () => {
      toast.success("Visit sent to doctor!");
      setSelectedPatientId(null);
      setDoctorId("");
    },
  });

  const filtered = patients.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search))
  );

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-3">

        {/* 🔥 Register Patient */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" /> Register Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createPatient.mutate(); }} className="space-y-3">

              <div>
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

              <Button className="w-full">
                {createPatient.isPending ? "Registering..." : "Register Patient"}
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* 🔥 Patient List */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Patient List</CardTitle>
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </CardHeader>

          <CardContent>
            {isLoading ? "Loading..." : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((p: any) => (
                    <tr key={p._id}>
                      <td>{p.patient_id}</td>
                      <td>{p.name}</td>
                      <td>{p.age}</td>
                      <td>{p.gender}</td>
                      <td>{p.phone}</td>
                      <td><StatusBadge status={p.status} /></td>

                      <td>
                        <Button size="sm" onClick={() => setSelectedPatientId(p._id)}>
                          Create Visit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 🔥 Visit UI */}
            {selectedPatientId && (
              <div className="mt-4 p-4 border rounded">
                <h3>Select Doctor</h3>

                <select
                  className="border p-2 w-full mb-2"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((d: any) => (
                    <option key={d._id} value={d._id}>
                      {d.username}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <Button onClick={() => createVisit.mutate()} disabled={!doctorId}>
                    Send to Doctor
                  </Button>

                  <Button variant="outline" onClick={() => setSelectedPatientId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}

