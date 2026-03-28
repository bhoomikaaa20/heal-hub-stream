
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";
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

  const [paymentMode, setPaymentMode] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [requiresPayment, setRequiresPayment] = useState(false);

  const qc = useQueryClient();

  // 🔥 CHECK PAYMENT WHEN PHONE ENTERED
  useEffect(() => {
    if (!phone) return;

    const check = async () => {
      const res = await fetch(
        `http://localhost:5000/api/patients/check-payment?phone=${phone}`
      );
      const data = await res.json();
      setRequiresPayment(data.payment_required);
    };

    check();
  }, [phone]);

  // 🔥 FETCH PATIENTS
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/patients");
      return res.json();
    },
  });

  // 🔥 FETCH DOCTORS
  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/doctors");
      return res.json();
    },
    retry: false,
  });

  // 🔥 CREATE PATIENT + VISIT
  const createPatient = useMutation({
    mutationFn: async () => {
      const res = await fetch("http://localhost:5000/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age: age ? parseInt(age) : null,
          gender,
          phone,
          payment_mode: paymentMode,
          doctor_id: doctorId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },

    onSuccess: (data) => {
      toast.success(
        data.payment_required
          ? "Payment recorded"
          : "Free visit (within 15 days)"
      );

      setName("");
      setAge("");
      setGender("");
      setPhone("");
      setPaymentMode("");
      setDoctorId("");

      qc.invalidateQueries({ queryKey: ["patients"] });
    },

    onError: (e: Error) => toast.error(e.message),
  });
  //send to doctor
  const sendToDoctor = useMutation({
    mutationFn: async (patient_id: string) => {
      const res = await fetch("http://localhost:5000/api/visits/send", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patient_id }),
      });

      return res.json();
    },

    onSuccess: () => {
      toast.success("Sent to doctor");
      qc.invalidateQueries({ queryKey: ["patients"] });
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

        {/* FORM */}
        <Card>
          <CardHeader>
            <CardTitle>Register / Visit Patient</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPatient.mutate();
              }}
              className="space-y-3"
            >
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />

              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>

              <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

              {/* DOCTOR */}
              <select className="border p-2 w-full" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Select Doctor</option>
                {doctors.map((d: any) => (
                  <option key={d._id} value={d._id}>{d.username}</option>
                ))}
              </select>

              {/* 🔥 CONDITIONAL PAYMENT */}
              {requiresPayment && (
                <select
                  className="border p-2 w-full"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="">Payment Mode</option>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                </select>
              )}

              {!requiresPayment && phone && (
                <p className="text-green-600 text-sm">
                  Free visit (within 15 days)
                </p>
              )}

              <Button className="w-full">
                {createPatient.isPending ? "Processing..." : "Submit"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* LIST */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Patients</CardTitle>
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </CardHeader>

          <CardContent>
            {isLoading ? "Loading..." : (
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr className="text-left">
                    <th className="p-2">ID</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Age</th>
                    <th className="p-2">Gender</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((p: any) => (
                    <tr key={p._id} className="border-t hover:bg-muted/50">
                      <td className="p-2">{p.patient_id}</td>
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">{p.age ?? "—"}</td>
                      <td className="p-2">{p.gender ?? "—"}</td>
                      <td className="p-2">{p.phone ?? "—"}</td>
                      <td className="p-2">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* 🔥 BUTTON */}
                      <td className="p-2">
                        {p.status === "WAITING" ? (
                          <Button
                            size="sm"
                            onClick={() => sendToDoctor.mutate(p._id)}
                          >
                            Send
                          </Button>
                        ) : (
                          <span className="text-green-600 text-sm font-medium">
                            Sent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}