import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Crear el contexto
const AuthContext = createContext({
  user: null, // Unificamos user (auth + db data)
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 1. Usuario autenticado en Firebase Auth
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // 2. Combinar datos de Auth y Firestore
            setUser({ 
              uid: firebaseUser.uid, 
              email: firebaseUser.email, 
              ...userDoc.data() 
            });
          } else {
            // Si está en Auth pero no en DB, forzamos logout por seguridad
            console.warn("Usuario sin perfil en base de datos. Cerrando sesión.");
            await signOut(auth);
            setUser(null);
          }
        } else {
          // Usuario no autenticado
          setUser(null);
        }
      } catch (error) {
        console.error("Error verificando sesión:", error);
        setUser(null);
      } finally {
        // SIEMPRE desactivar carga, pase lo que pase
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

