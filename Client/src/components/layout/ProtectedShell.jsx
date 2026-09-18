import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth-hooks";
import { AppShell } from "./AppShell";
export function ProtectedShell() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--ink-muted)] text-sm">Loading...</div>;
  return user ? <AppShell /> : <Navigate to="/login" replace />;
}
