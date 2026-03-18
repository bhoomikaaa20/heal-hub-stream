
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Plus, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";

interface BillItem {
  medicineName: string;
  quantity: number;
  price: number;
}

export default function PharmacistDashboard() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<BillItem[]>([
    { medicineName: "", quantity: 1, price: 0 },
  ]);
  const qc = useQueryClient();

  // 🔥 GET PATIENTS
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/patients", {
        headers: {
          Authorization: `Bearer ${token} `,
        },
      });

      const data = await res.json();

      // Only prescribed/completed
      return data.filter(
        (p: any) =>
          p.status === "PRESCRIBED" || p.status === "COMPLETED"
      );
    },
  });

  const selected = patients.find((p: any) => p._id === selectedId);

  // 🔥 GET LATEST CONSULTATION
  const { data: consultation } = useQuery({
    queryKey: ["latest-consultation", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/consultations/${selectedId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      return data[0]; // latest consultation
    },
  });

  const total = items.reduce(
    (sum, i) => sum + i.quantity * i.price,
    0
  );

  const addItem = () =>
    setItems([...items, { medicineName: "", quantity: 1, price: 0 }]);

  const removeItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  const updateItem = (
    idx: number,
    field: keyof BillItem,
    value: string | number
  ) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  // 🔥 COMPLETE BILLING
  const completeBilling = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");

      const validItems = items.filter((i) =>
        i.medicineName.trim()
      );

      const res = await fetch("http://localhost:5000/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: selectedId,
          consultation_id: consultation._id,
          items: validItems,
          total_amount: total,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      return data;
    },
    onSuccess: () => {
      toast.success("Billing complete!");
      setItems([{ medicineName: "", quantity: 1, price: 0 }]);
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = patients.filter(
    (p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    PRESCRIBED:
      "bg-status-prescribed/15 text-status-prescribed border-status-prescribed/30",
    COMPLETED:
      "bg-status-completed/15 text-status-completed border-status-completed/30",
  };

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-5 h-[calc(100vh-6rem)]">
        {/* Patient List */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Prescribed Patients
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-1 pt-0">
            {filtered.map((p: any) => (
              <button
                key={p._id}
                onClick={() => {
                  setSelectedId(p._id);
                  setItems([
                    { medicineName: "", quantity: 1, price: 0 },
                  ]);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex justify-between ${selectedId === p._id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted"
                  }`}
              >
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.patient_id}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={statusColors[p.status] ?? ""}
                >
                  {p.status}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Billing Panel */}
        <Card className="lg:col-span-3 shadow-sm flex flex-col">
          {selected && consultation ? (
            <>
              <CardHeader>
                <CardTitle>{selected.name}</CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                {/* Prescription */}
                <div className="bg-muted/50 p-4 rounded">
                  <p className="font-mono text-sm whitespace-pre-wrap">
                    {consultation.prescription}
                  </p>
                </div>

                {/* Billing Items */}
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="Medicine"
                      value={item.medicineName}
                      onChange={(e) =>
                        updateItem(idx, "medicineName", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                    <Button onClick={() => removeItem(idx)}>
                      <Trash2 />
                    </Button>
                  </div>
                ))}

                <Button onClick={addItem}>
                  <Plus /> Add Item
                </Button>

                <div className="text-lg font-bold">
                  Total: ₹{total}
                </div>

                <Button
                  onClick={() => completeBilling.mutate()}
                  disabled={completeBilling.isPending}
                >
                  <CheckCircle /> Complete Billing
                </Button>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              Select a patient
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
