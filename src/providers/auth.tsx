import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getSessionToken, logoutSession } from "@/lib/utils.functions";
import type { AuthUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  logout: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const session = await getSessionToken();
      setUser(session.profile);
    } catch {
      setUser(null);
    }
  }, []);

  // sesi dibaca dari cookie httpOnly via server; tidak ada state auth di storage.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await logoutSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, logout }), [user, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
