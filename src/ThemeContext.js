import React, { createContext, useState, useContext, useMemo } from 'react';

// 1. Crear el Contexto
const ThemeContext = createContext();

// 2. Crear el Proveedor (Provider)
export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false); // Por defecto es modo claro

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Usamos useMemo para evitar que el objeto de valor se recree en cada render
  const value = useMemo(() => ({ isDarkMode, toggleDarkMode }), [isDarkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Crear un hook personalizado para usar el contexto fácilmente
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
