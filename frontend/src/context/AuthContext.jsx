import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setBooting(false);
      return;
    }

    authApi
      .me()
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setBooting(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      login: async (payload) => {
        const { data } = await authApi.login(payload);
        localStorage.setItem("token", data.token);
        setUser(data.user);
      },
      register: async (payload) => {
        const { data } = await authApi.register(payload);
        localStorage.setItem("token", data.token);
        setUser(data.user);
      },
      logout: () => {
        localStorage.removeItem("token");
        setUser(null);
      }
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
