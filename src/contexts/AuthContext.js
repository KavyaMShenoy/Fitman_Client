import React, { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState({ userId: null, fullName: null, trainerId: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setAuthData({
        userId: decoded.userId,
        fullName: decoded.fullName,
        trainerId: decoded.trainerId,
      });
    } catch (error) {
      console.error("Token decoding failed", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...authData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};