import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { User } from "@procamp/shared";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, captchaToken?: string | null) => Promise<void>;
  logout: () => void;
  can: (perm: keyof User["permissions"]) => boolean;
  setUser: (user: User) => void;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string, captchaToken?: string | null) => {
    const { data } = await api.post("/auth/login", { email, password, ...(captchaToken ? { captchaToken } : {}) });
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const can = (perm: keyof User["permissions"]) =>
    !!user && (user.isSuperAdmin || !!user.permissions[perm]);

  return <Ctx.Provider value={{ user, loading, login, logout, can, setUser }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
