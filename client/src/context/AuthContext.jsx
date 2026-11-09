import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth";
import { getErrorMessage, setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // loading -> checking the session | authenticated | unauthenticated | error (server unreachable)
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const loadSession = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setStatus("authenticated");
    } catch (err) {
      if (err.response?.status === 401) {
        setUser(null);
        setStatus("unauthenticated");
      } else {
        setError(getErrorMessage(err, "Unable to connect to the server."));
        setStatus("error");
      }
    }
  }, []);

  // First load: status already starts as "loading".
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // "Try again" after a connection error.
  const retry = useCallback(() => {
    setStatus("loading");
    setError("");
    return loadSession();
  }, [loadSession]);

  // Any 401 from the API (e.g. an expired session) sends the user back to login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus("unauthenticated");
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const data = await authApi.login(credentials);
      setUser(data.user);
      setStatus("authenticated");
    } catch (err) {
      throw new Error(getErrorMessage(err, "Login failed. Please try again."));
    }
  }, []);

  const signup = useCallback(async (details) => {
    try {
      await authApi.signup(details);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Account creation failed. Please try again."));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The cookie may already be gone; either way the user wants out.
    }

    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ status, user, error, login, signup, logout, retry }),
    [status, user, error, login, signup, logout, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
