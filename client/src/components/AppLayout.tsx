import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Activity, LogOut, Users, Stethoscope, Pill } from "lucide-react";
import { ReactNode } from "react";

const roleLabels = {
  receptionist: { label: "Reception", icon: Users },
  doctor: { label: "Doctor", icon: Stethoscope },
  pharmacist: { label: "Pharmacy", icon: Pill },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const { role, signOut } = useAuth();
  const info = role ? roleLabels[role] : null;
  const Icon = info?.icon ?? Users;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">MediFlow</span>
          {info && (
            <span className="ml-2 flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Icon className="h-3.5 w-3.5" />
              {info.label}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
