
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Role = "receptionist" | "doctor" | "pharmacist";

interface User {
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, role: Role, username: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Load from localStorage (IMPORTANT)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") as Role;

    if (token && role) {
      setUser({ email: "", role }); // email optional
      setRole(role);
    }

    setLoading(false);
  }, []);

  // 🔐 LOGIN
  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.message };
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      setUser({ email, role: data.role });
      setRole(data.role);

      return { error: null };
    } catch {
      return { error: "Something went wrong" };
    }
  };

  // 🆕 SIGNUP
  const signUp = async (email: string, password: string, role: Role, username: string) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role, username }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.message };
      }

      return { error: null };
    } catch {
      return { error: "Signup failed" };
    }
  };

  // 🚪 LOGOUT
  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
