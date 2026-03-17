import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prescription, setPrescription] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const qc = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const selected = patients.find(p => p.id === selectedId);

  const { data: prevConsultations = [] } = useQuery({
    queryKey: ["consultations", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", selectedId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (selectedId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selectedId]);

  const savePrescription = useMutation({
    mutationFn: async () => {
      if (!user || !selectedId) return;
      const { error: consultError } = await supabase.from("consultations").insert({
        patient_id: selectedId,
        doctor_id: user.id,
        prescription,
      });
      if (consultError) throw consultError;
      const { error: updateError } = await supabase
        .from("patients")
        .update({ status: "PRESCRIBED" })
        .eq("id", selectedId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Prescription saved!");
      setPrescription("");
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["consultations", selectedId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Enter" && prescription.trim()) {
      savePrescription.mutate();
    }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    NEW: "bg-status-new/15 text-status-new border-status-new/30",
    PRESCRIBED: "bg-status-prescribed/15 text-status-prescribed border-status-prescribed/30",
    COMPLETED: "bg-status-completed/15 text-status-completed border-status-completed/30",
  };

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-5 h-[calc(100vh-6rem)]">
        {/* Patient List */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Patients</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-1 pt-0">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedId(p.id); setPrescription(""); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
                  selectedId === p.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                }`}
              >
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.patient_id} · {p.age ? `${p.age}y` : ""} {p.gender ?? ""}</p>
                </div>
                <Badge variant="outline" className={statusColors[p.status] ?? ""}>{p.status}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Prescription Panel */}
        <Card className="lg:col-span-3 shadow-sm flex flex-col">
          {selected ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selected.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {selected.patient_id} · {selected.age ? `${selected.age} years` : ""} {selected.gender ? `· ${selected.gender}` : ""}
                      {selected.phone ? ` · ${selected.phone}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusColors[selected.status] ?? ""}>{selected.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-primary" /> Prescription
                  </label>
                  <Textarea
                    ref={textareaRef}
                    value={prescription}
                    onChange={e => setPrescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tab Paracetamol 650mg - 1-0-1 for 5 days&#10;Syp Amoxicillin 250mg/5ml - 5ml TDS for 7 days"
                    className="flex-1 min-h-[200px] resize-none text-sm font-mono"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">Ctrl + Enter to save</span>
                    <Button onClick={() => savePrescription.mutate()} disabled={!prescription.trim() || savePrescription.isPending} className="gap-2">
                      <Send className="h-4 w-4" />
                      {savePrescription.isPending ? "Saving..." : "Save Prescription"}
                    </Button>
                  </div>
                </div>

                {prevConsultations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Previous Prescriptions</h4>
                    <div className="space-y-2 max-h-40 overflow-auto">
                      {prevConsultations.map(c => (
                        <div key={c.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                          <p className="text-xs text-muted-foreground mb-1">{new Date(c.created_at).toLocaleDateString()}</p>
                          <p className="font-mono text-xs whitespace-pre-wrap">{c.prescription}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a patient to write a prescription</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
