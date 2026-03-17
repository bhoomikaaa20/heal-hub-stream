import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  const [items, setItems] = useState<BillItem[]>([{ medicineName: "", quantity: 1, price: 0 }]);
  const qc = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").in("status", ["PRESCRIBED", "COMPLETED"]).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const selected = patients.find(p => p.id === selectedId);

  const { data: consultation } = useQuery({
    queryKey: ["latest-consultation", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", selectedId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  const addItem = () => setItems([...items, { medicineName: "", quantity: 1, price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof BillItem, value: string | number) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const completeBilling = useMutation({
    mutationFn: async () => {
      if (!selectedId || !consultation) return;
      const validItems = items.filter(i => i.medicineName.trim());
      const { error: billError } = await supabase.from("bills").insert({
        patient_id: selectedId,
        consultation_id: consultation.id,
        items: validItems as any,
        total_amount: total,
      });
      if (billError) throw billError;
      const { error: updateError } = await supabase
        .from("patients")
        .update({ status: "COMPLETED" })
        .eq("id", selectedId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Billing complete!");
      setItems([{ medicineName: "", quantity: 1, price: 0 }]);
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    PRESCRIBED: "bg-status-prescribed/15 text-status-prescribed border-status-prescribed/30",
    COMPLETED: "bg-status-completed/15 text-status-completed border-status-completed/30",
  };

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-5 h-[calc(100vh-6rem)]">
        {/* Patient List */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Prescribed Patients</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-1 pt-0">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedId(p.id); setItems([{ medicineName: "", quantity: 1, price: 0 }]); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
                  selectedId === p.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                }`}
              >
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.patient_id}</p>
                </div>
                <Badge variant="outline" className={statusColors[p.status] ?? ""}>{p.status}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Billing Panel */}
        <Card className="lg:col-span-3 shadow-sm flex flex-col">
          {selected && consultation ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selected.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selected.patient_id}</p>
                  </div>
                  <Badge variant="outline" className={statusColors[selected.status] ?? ""}>{selected.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 overflow-auto">
                {/* Prescription View */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Doctor's Prescription</h4>
                  <p className="font-mono text-sm whitespace-pre-wrap">{consultation.prescription}</p>
                </div>

                {selected.status !== "COMPLETED" && (
                  <>
                    {/* Billing Items */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Billing Items</Label>
                        <Button variant="outline" size="sm" onClick={addItem} className="gap-1 h-7 text-xs">
                          <Plus className="h-3 w-3" /> Add Item
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                            <Input
                              className="col-span-5 text-sm"
                              placeholder="Medicine name"
                              value={item.medicineName}
                              onChange={e => updateItem(idx, "medicineName", e.target.value)}
                            />
                            <Input
                              className="col-span-2 text-sm"
                              type="number"
                              min={1}
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                            />
                            <Input
                              className="col-span-3 text-sm"
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="Price"
                              value={item.price}
                              onChange={e => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                            />
                            <div className="col-span-1 text-right text-sm font-medium">₹{(item.quantity * item.price).toFixed(0)}</div>
                            <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total & Complete */}
                    <div className="mt-auto border-t pt-4 flex items-center justify-between">
                      <div className="text-lg font-bold">Total: ₹{total.toFixed(2)}</div>
                      <Button onClick={() => completeBilling.mutate()} disabled={completeBilling.isPending} className="gap-2" size="lg">
                        <CheckCircle className="h-5 w-5" />
                        {completeBilling.isPending ? "Processing..." : "Complete & Bill"}
                      </Button>
                    </div>
                  </>
                )}

                {selected.status === "COMPLETED" && (
                  <div className="flex items-center gap-2 text-status-completed bg-status-completed/10 rounded-lg p-4">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">This patient's billing is complete.</span>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a patient to view prescription and bill</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
