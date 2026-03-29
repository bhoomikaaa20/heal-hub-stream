import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { generateInvoicePDF } from "@/utils/pdfGenerator";

interface BillItem {
  medicineName: string;
  quantity: number;
  price: number;
}

/* ✅ STATUS BADGE (same as receptionist) */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW: "bg-status-new/15 text-status-new border-status-new/30",
    PRESCRIBED: "bg-status-prescribed/15 text-status-prescribed border-status-prescribed/30",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 border-yellow-300",
    COMPLETED: "bg-status-completed/15 text-status-completed border-status-completed/30",
  };

  return (
    <Badge variant="outline" className={colors[status] ?? ""}>
      {status}
    </Badge>
  );
}

export default function PharmacistDashboard() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [paymentMode, setPaymentMode] = useState("CASH");

  const [medicineSearch, setMedicineSearch] = useState("");

  const [medName, setMedName] = useState("");
  const [medPrice, setMedPrice] = useState(0);
  const [medQty, setMedQty] = useState(0);

  const qc = useQueryClient();

  // ✅ GET PATIENTS
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/patients", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();

      return data.filter((p: any) =>
        ["PRESCRIBED", "IN_PROGRESS"].includes(p.status)
      );
    },
  });

  const selected = patients.find((p: any) => p._id === selectedId);

  // ✅ GET CONSULTATION
  const { data: consultation } = useQuery({
    queryKey: ["consultation", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const res = await fetch(
        `http://localhost:5000/api/consultations/${selectedId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      return data[0];
    },
  });

  // ✅ GET MEDICINES
  const { data: medicines = [] } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/medicines", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return res.json();
    },
  });

  const total = items.reduce(
    (sum, i) => sum + i.quantity * i.price,
    0
  );

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

  // ✅ ADD MEDICINE
  const addMedicineMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("http://localhost:5000/api/medicines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: medName,
          price: medPrice,
          quantity: medQty,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Medicine added");
      setMedName("");
      setMedPrice(0);
      setMedQty(0);
      qc.invalidateQueries({ queryKey: ["medicines"] });
    },
    onError: () => toast.error("Error adding medicine"),
  });

  // ✅ PDF
  const generatePDF = () => {
    generateInvoicePDF({
      patientName: selected?.name || "Unknown",
      doctorName: consultation?.doctor_name,
      items,
      total,
      paymentMode,
    });
  };

  // ✅ BILLING
  const completeBilling = useMutation({
    mutationFn: async () => {
      const res = await fetch("http://localhost:5000/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          patient_id: selectedId,
          consultation_id: consultation._id,
          items,
          total_amount: total,
          payment_mode: paymentMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      return data;
    },

    onSuccess: () => {
      toast.success("Billing complete!");
      generatePDF();
      setItems([]);
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

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-5 h-[calc(100vh-6rem)]">

        {/* LEFT PANEL */}
        <Card className="lg:col-span-2 flex flex-col gap-4 p-4">

          <div>
            <h2 className="font-bold mb-2">Patients</h2>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="mb-2"
            />

            <div className="max-h-60 overflow-auto border rounded">
              {filtered.map((p: any) => (
                <div
                  key={p._id}
                  onClick={() => {
                    setSelectedId(p._id);
                    setItems([]);
                  }}
                  className="p-2 border-b cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                >
                  <div>
                    <p>{p.name}</p>
                    <p className="text-xs text-gray-500">{p.patient_id}</p>
                  </div>

                  {/* ✅ STATUS BADGE */}
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>

          {/* ADD MEDICINE */}
          <div className="border rounded p-3">
            <h2 className="font-bold mb-3">Add Medicine</h2>

            <div className="flex items-center gap-2 mb-2">
              <label className="w-24 text-sm">Name:</label>
              <Input
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <label className="w-24 text-sm">Cost:</label>
              <Input
                type="number"
                value={medPrice}
                onChange={(e) => setMedPrice(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <label className="w-24 text-sm">Quantity:</label>
              <Input
                type="number"
                value={medQty}
                onChange={(e) => setMedQty(Number(e.target.value))}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => addMedicineMutation.mutate()}
            >
              Save Medicine
            </Button>
          </div>

        </Card>

        {/* RIGHT PANEL */}
        <Card className="lg:col-span-3">
          {selected && consultation ? (
            <CardContent className="flex flex-col gap-4">

              {/* ✅ NAME + STATUS PARALLEL */}
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">{selected.name}</h2>
                <StatusBadge status={selected.status} />
              </div>

              <div className="border p-3 bg-gray-50 rounded">
                <p><b>Diagnosis:</b> {consultation.diagnosis}</p>

                <p className="mt-2"><b>Medicines:</b></p>
                {consultation.prescription?.map((m: string, i: number) => (
                  <p key={i}>• {m}</p>
                ))}

                <p className="mt-2">
                  <b>Notes:</b> {consultation.notes}
                </p>
              </div>

              {/* SEARCH MEDICINE */}
              <div className="relative">
                <Input
                  placeholder="Search medicine..."
                  value={medicineSearch}
                  onChange={(e) => setMedicineSearch(e.target.value)}
                />

                {medicineSearch && (
                  <div className="absolute bg-white border w-full z-10 max-h-40 overflow-auto">
                    {medicines
                      .filter((m: any) =>
                        m.name.toLowerCase().includes(medicineSearch.toLowerCase())
                      )
                      .map((m: any) => (
                        <div
                          key={m._id}
                          onClick={() => {
                            setItems([
                              ...items,
                              {
                                medicineName: m.name,
                                quantity: 1,
                                price: m.price,
                              },
                            ]);
                            setMedicineSearch("");
                          }}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {m.name} (₹{m.price})
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* ITEMS */}
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">

                  <div className="w-40">{item.medicineName}</div>

                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, "quantity", parseInt(e.target.value) || 0)
                    }
                  />

                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(idx, "price", parseFloat(e.target.value) || 0)
                    }
                  />

                  <Button onClick={() => removeItem(idx)}>
                    <Trash2 />
                  </Button>
                </div>
              ))}

              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>

              <div className="font-bold">Total: ₹{total}</div>

              <Button onClick={() => completeBilling.mutate()}>
                <CheckCircle /> Complete Billing
              </Button>

            </CardContent>
          ) : (
            <div className="flex items-center justify-center h-full">
              Select a patient
            </div>
          )}
        </Card>

      </div>
    </AppLayout>
  );
}