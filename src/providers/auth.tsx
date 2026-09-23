import { createContext, useCallback, useContext, useMemo, useState  } from "react";
import type {ReactNode} from "react";
import { login as authLogin, clearAuth, saveAuth, getAuth } from "#/lib/auth.server";
import type {AuthUser} from "#/lib/auth.server";

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => false,
  logout: () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getAuth());

  const login = useCallback((username: string, password: string) => {
    const result = authLogin(username, password);
    if (!result.ok || !result.user) return false;
    saveAuth(result.user);
    setUser(result.user);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}