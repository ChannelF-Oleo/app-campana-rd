import React, { createContext, useContext, useState, useEffect } from "react";
import { initializeAuthAndGetUser, auth, db } from "./firebase"; // Importamos la lógica del paso 2.1 A
import { onAuthStateChanged } from "firebase/auth";

// Crear el contexto
const AuthContext = createContext({
  userId: null,
  isAuthenticated: false,
  isLoading: true,
  authInstance: auth, // Exponemos la instancia de auth si es necesaria
  dbInstance: db, // Exponemos la instancia de db si es necesaria
});

// Hook personalizado para usar el contexto de autenticación fácilmente
export const useAuth = () => useContext(AuthContext);

/**
 * Proveedor de Autenticación para envolver la aplicación.
 * Inicializa la autenticación y gestiona el estado del usuario.
 */
export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Inicializar autenticación (maneja token o anónimo)
    initializeAuthAndGetUser()
      .then((initialUid) => {
        // Configuramos el estado inicial inmediatamente después del signIn
        if (initialUid) {
          setUserId(initialUid);
          setIsAuthenticated(true); // Asumimos autenticado si hay UID (anónimo o con token)
        }
        // setIsLoading se establece en 'false' en el listener de onAuthStateChanged para ser más robusto
      })
      .catch((err) => {
        console.error("Fallo la inicialización de autenticación:", err);
        setIsLoading(false); // Detener la carga si falla
      });

    // 2. Suscribirse a cambios de estado de autenticación (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Usuario logueado o token/anónimo activo
        setUserId(user.uid);
        setIsAuthenticated(!user.isAnonymous); // Asume autenticado solo si NO es anónimo
      } else {
        // Usuario no logueado (sesión cerrada)
        setUserId(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false); // Detener el estado de carga después del primer check
    });

    // Limpieza al desmontar
    return () => unsubscribe();
  }, []);

  const value = {
    userId,
    isAuthenticated,
    isLoading,
    authInstance: auth,
    dbInstance: db,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Exportar solo el proveedor, las instancias de auth y db, y el hook.
export { AuthContext, AuthProvider };
