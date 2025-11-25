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

  // --- LÓGICA DE ACTIVIDAD (HEARTBEAT) ---
  useEffect(() => {
    if (!user) return;

    // Función para reportar actividad a Firestore
    const reportActivity = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        // Actualizamos lastActivity con la hora del servidor
        await updateDoc(userRef, {
          lastActivity: serverTimestamp(),
          forceLogout: false, // Reseteamos bandera por si acaso
        });
      } catch (error) {
        console.warn("No se pudo actualizar actividad:", error);
      }
    };

    // Debounce: Solo reportar cada 15 minutos (900,000 ms) para no saturar lecturas
    const INTERVAL_MS = 15 * 60 * 1000;

    // Reportar inmediatamente al cargar
    reportActivity();

    // Configurar intervalo
    const intervalId = setInterval(reportActivity, INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [user]); // Se reinicia si cambia el usuario

  // --- LÓGICA DE AUTENTICACIÓN EXISTENTE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // VERIFICACIÓN DE LOGOUT FORZADO (Desde el Backend)
            if (userData.forceLogout) {
              console.warn("Sesión cerrada por inactividad o administrador.");
              await signOut(auth);
              setUser(null);
              // Opcional: Redirigir o mostrar alerta aquí
            } else {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...userData,
              });
            }
          } else {
            // Usuario en Auth pero no en DB
            await signOut(auth);
            setUser(null);
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

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
