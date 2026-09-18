import { useEffect, useState, useCallback } from "react";
import { AuthContext } from "./auth-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { useToast } from "./ui-hooks";


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const toast = useToast();

  const refresh = useCallback(async () => {
    try {
      const { user } = await authApi.me();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    authApi.me().then(({ user }) => { if (active) setUser(user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const expired = () => { setUser(null); queryClient.clear(); };
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, [queryClient]);

  const login = useCallback(async (credentials) => {
    const { user } = await authApi.login(credentials);
    queryClient.clear();
    setUser(user);
    return user;
  }, [queryClient]);

  const register = useCallback(async (payload) => {
    const { user } = await authApi.register(payload);
    queryClient.clear();
    setUser(user);
    return user;
  }, [queryClient]);

  const updateProfile = useCallback(async (payload) => {
    const { user } = await authApi.updateProfile(payload);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setUser(null);
      queryClient.clear();
    } catch (error) {
      toast.error("Couldn't sign out", error.message);
    }
  }, [queryClient, toast]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

