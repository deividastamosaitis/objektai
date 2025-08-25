import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { get } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = nežinoma, false = neautentifikuotas, object = prisijungęs
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Vienkartinis bandymas atkurti sesiją
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const data = await get("/users/current-user");
        if (mountedRef.current) setUser(data?.user || false);
      } catch {
        if (mountedRef.current) setUser(false);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Galima kviesti ranka (pvz., po login/register)
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get("/users/current-user");
      setUser(data?.user || false);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
