import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 1. Inicializar estado leyendo de localStorage (o false por defecto)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });

  // 2. EFECTO CRÍTICO: Sincronizar la clase CSS con el estado
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    // Guardar la preferencia para la próxima vez
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Optimización de rendimiento con useMemo
  const value = useMemo(() => ({ isDarkMode, toggleDarkMode }), [isDarkMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
