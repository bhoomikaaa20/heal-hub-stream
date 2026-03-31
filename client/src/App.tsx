import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Login from "@/pages/Login";
import ReceptionistDashboard from "@/pages/ReceptionistDashboard";
import DoctorDashboard from "@/pages/DoctorDashboard";
import PharmacistDashboard from "@/pages/PharmacistDashboard";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

function RoleRouter() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  switch (role) {
    case "receptionist": return <ReceptionistDashboard />;
    case "doctor": return <DoctorDashboard />;
    case "pharmacist": return <PharmacistDashboard />;
    default: return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">No role assigned. Contact admin.</p>
      </div>
    );
  }
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthGuard><Login /></AuthGuard>} />
            <Route path="/" element={<RoleRouter />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
