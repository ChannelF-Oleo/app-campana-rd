import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

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
        await updateDoc(userRef, {
          lastActivity: serverTimestamp(),
          forceLogout: false,
        });
      } catch (error) {
        console.warn("Error reportando actividad:", error);
      }
    };

    reportActivity();
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
            // --- USUARIO EXISTENTE ---
            const userData = userDoc.data();
            const lastSignInTime = new Date(
              firebaseUser.metadata.lastSignInTime
            ).getTime();
            const now = Date.now();
            const isFreshLogin = now - lastSignInTime < 60 * 1000;

            if (userData.forceLogout && !isFreshLogin) {
              console.warn("Sesión cerrada por inactividad.");
              await signOut(auth);
              setUser(null);
            } else {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...userData,
              });
            }
          } else {
            // --- USUARIO NUEVO ---
            // Intentamos crear el perfil automáticamente
            const newUserProfile = {
              uid: firebaseUser.uid,
              nombre: firebaseUser.displayName || "Activista Google",
              email: firebaseUser.email,
              rol: "multiplicador", // Rol por defecto
              cedula: null,
              fechaRegistro: new Date().toISOString(),
              metodoRegistro: "Google Auth Automático",
            };

            try {
              // Creamos el documento en Firestore
              await setDoc(userDocRef, newUserProfile);
              // Actualizamos el estado con el perfil creado
              setUser(newUserProfile);
            } catch (createError) {
              console.error("Error creando perfil de Google:", createError);

              // --- FALLBACK ROBUSTO (Para evitar crash en Dashboard) ---
              // Si falla la escritura (ej. por permisos), cargamos un usuario temporal seguro en memoria
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                rol: "invitado", // Rol seguro
                nombre: firebaseUser.displayName || "Usuario Google", // Evita error .split()
                fechaRegistro: new Date().toISOString(), // Evita error de fecha
              });
            }
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
