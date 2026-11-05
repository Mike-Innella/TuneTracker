import React, { useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { AuthContext } from "./auth-store";
import type { AuthUser } from "./auth-types";

// provider that manages session state
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null); // current logged in user
  const [loading, setLoading] = useState(true); // prevents redirect flicker

  // check backend for current session user
  async function refreshMe() {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }

  // logout request + clear local user
  async function logout() {
    await authApi.logout();
    setUser(null);
  }

  // run once when app starts
  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshMe();
      setLoading(false);
    })();
  }, []);

  // memoize context value
  const value = useMemo(
    () => ({ user, loading, refreshMe, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
