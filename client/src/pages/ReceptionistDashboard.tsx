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
  const qc = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.json();
    },
  });

  const createPatient = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" /> Register Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); createPatient.mutate(); }} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Patient name" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Age</Label>
                  <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
              </div>
              <Button type="submit" className="w-full" disabled={createPatient.isPending}>
                {createPatient.isPending ? "Registering..." : "Register Patient"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Patient List</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm">No patients found.</p>
            ) : (
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">ID</th>
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Age</th>
                      <th className="py-2 pr-4 font-medium">Gender</th>
                      <th className="py-2 pr-4 font-medium">Phone</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-xs">{p.patient_id}</td>
                        <td className="py-2.5 pr-4 font-medium">{p.name}</td>
                        <td className="py-2.5 pr-4">{p.age ?? "—"}</td>
                        <td className="py-2.5 pr-4">{p.gender ?? "—"}</td>
                        <td className="py-2.5 pr-4">{p.phone ?? "—"}</td>
                        <td className="py-2.5"><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
