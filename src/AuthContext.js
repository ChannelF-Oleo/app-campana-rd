import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. LÓGICA DE ACTIVIDAD (Heartbeat) ---
  useEffect(() => {
    if (!user) return;

    const reportActivity = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        // Confirmamos que estamos activos y quitamos el bloqueo
        await updateDoc(userRef, {
          lastActivity: serverTimestamp(),
          forceLogout: false,
        });
      } catch (error) {
        console.warn("Error reportando actividad:", error);
      }
    };

    // Reportar inmediatamente al entrar
    reportActivity();

    // Y luego cada 15 minutos
    const INTERVAL_MS = 15 * 60 * 1000;
    const intervalId = setInterval(reportActivity, INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [user]);

  // --- 2. VERIFICACIÓN DE SESIÓN ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // --- FIX CRÍTICO: DETECCIÓN DE LOGIN FRESCO ---
            // Verificamos cuándo se autenticó por última vez en Firebase Auth
            const lastSignInTime = new Date(
              firebaseUser.metadata.lastSignInTime
            ).getTime();
            const now = Date.now();
            const isFreshLogin = now - lastSignInTime < 60 * 1000; // Menos de 1 minuto

            // Si está marcado para salir, PERO acaba de loguearse, lo perdonamos y reseteamos
            if (userData.forceLogout && !isFreshLogin) {
              console.warn("Sesión cerrada por inactividad.");
              await signOut(auth);
              setUser(null);
            } else {
              // Si es un login fresco, el useEffect de arriba (Heartbeat)
              // se encargará de poner forceLogout: false en breve.
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...userData,
              });
            }
          } else {
            // Usuario sin perfil (Google nuevo sin trigger ejecutado aún)
            // No cerramos sesión inmediatamente, esperamos al trigger o UI
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              rol: "invitado",
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error sesión:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setIsLoading(true);
    await signOut(auth);
    setUser(null);
    setIsLoading(false);
  };

  const value = { user, isAuthenticated: !!user, isLoading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
