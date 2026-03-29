import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function DoctorDashboard() {
  const [selected, setSelected] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [prescription, setPrescription] = useState<string[]>([]);

  const qc = useQueryClient();

  // 🔥 FETCH MEDICINES FROM DB
  const { data: medicines = [] } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/medicines", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch medicines");
      return res.json();
    },
  });

  // 🔥 FETCH QUEUE
  const { data: visits = [] } = useQuery({
    queryKey: ["doctor-queue"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/doctors/queue", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch queue");
      return res.json();
    },
  });

  // 🔥 FETCH HISTORY
  const { data: history = [] } = useQuery({
    queryKey: ["doctor-history", selected?._id],
    queryFn: async () => {
      if (!selected) return [];

      const res = await fetch(
        `http://localhost:5000/api/doctors/history?patient_id=${selected.patient_id._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: !!selected,
  });

  // 🔥 SAVE CONSULTATION
  const saveConsultation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        "http://localhost:5000/api/doctors/consultation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            patient_id: selected.patient_id._id,
            visit_id: selected._id,
            diagnosis,
            prescription,
            notes,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },

    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["doctor-history"] });
    },

    onError: () => toast.error("Failed to save"),
  });

  // 🔥 SEND TO PHARMACY
  const sendToPharmacy = useMutation({
    mutationFn: async () => {
      const res = await fetch("http://localhost:5000/api/doctors/send", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          visit_id: selected._id,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      return res.json();
    },

    onSuccess: () => {
      toast.success("Sent to pharmacy");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["doctor-queue"] });
    },

    onError: () => toast.error("Failed to send"),
  });

  return (
    <AppLayout>
      <div className="grid grid-cols-5 gap-4 h-[90vh]">

        {/* 🔥 LEFT: QUEUE */}
        <div className="col-span-2 border rounded p-2 overflow-auto">
          <h2 className="font-bold mb-2">Queue</h2>

          {visits.map((v: any) => (
            <div
              key={v._id}
              onClick={() => {
                setSelected(v);
                setPrescription([]);
                setDiagnosis("");
                setNotes("");
              }}
              className="p-2 border-b cursor-pointer hover:bg-muted"
            >
              <p>{v.patient_id.name}</p>
              <p className="text-xs text-gray-500">
                {v.patient_id.patient_id}
              </p>
            </div>
          ))}
        </div>

        {/* 🔥 RIGHT */}
        <div className="col-span-3 border rounded p-4 flex flex-col gap-3 overflow-auto">

          {selected ? (
            <>
              <h2 className="font-bold text-lg">
                {selected.patient_id.name}
              </h2>

              {/* 🔥 GLOBAL MEDICINE SEARCH */}
              <div className="relative">
                <Input
                  placeholder="Search medicine..."
                  value={medicineSearch}
                  onChange={(e) => setMedicineSearch(e.target.value)}
                />

                {medicineSearch && (
                  <div className="absolute top-10 w-full border bg-white shadow rounded max-h-40 overflow-auto z-10">
                    {medicines
                      .filter((m: any) =>
                        m.name
                          .toLowerCase()
                          .includes(medicineSearch.toLowerCase())
                      )
                      .map((m: any) => (
                        <div
                          key={m._id}
                          onClick={() => {
                            if (!prescription.includes(m.name)) {
                              setPrescription([...prescription, m.name]);
                            }
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

              {/* 🔥 PRESCRIPTION */}
              <div className="border p-2 rounded">
                {prescription.map((m, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center"
                  >
                    <p>{m}</p>
                    <button
                      className="text-red-500"
                      onClick={() =>
                        setPrescription(
                          prescription.filter((_, idx) => idx !== i)
                        )
                      }
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>

              {/* 🔥 DIAGNOSIS */}
              <Textarea
                placeholder="Diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />

              {/* 🔥 NOTES */}
              <Textarea
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {/* 🔥 BUTTONS */}
              <div className="flex gap-2">
                <Button onClick={() => saveConsultation.mutate()}>
                  Save
                </Button>

                <Button
                  variant="outline"
                  onClick={() => sendToPharmacy.mutate()}
                >
                  Send to Pharmacy
                </Button>
              </div>
            </>
          ) : (
            <p>Select a patient</p>
          )}

          {/* 🔥 HISTORY */}
          {selected && (
            <div className="border rounded p-3 mt-4">
              <h2 className="font-bold mb-2">
                {selected.patient_id.name}'s History
              </h2>

              {history.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No history found for this patient
                </p>
              ) : (
                history.map((h: any) => (
                  <div key={h._id} className="border p-2 mb-2 rounded">
                    <p className="font-semibold">{h.patient_id?.name}</p>

                    <p className="text-sm">
                      <b>Diagnosis:</b> {h.diagnosis}
                    </p>

                    <p className="text-sm">
                      <b>Prescription:</b> {h.prescription.join(", ")}
                    </p>

                    <p className="text-sm">
                      <b>Notes:</b> {h.notes}
                    </p>

                    <p className="text-xs text-gray-500">
                      {new Date(h.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}