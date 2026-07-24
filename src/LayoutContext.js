import { createContext, useContext } from "react";

// Contexto de UI del layout del dashboard. Expone acciones globales de la capa
// de layout (p. ej. abrir el modal de "Establecer Meta") para que componentes
// anidados (MyGoals, sidebar) puedan dispararlas sin prop-drilling.
export const LayoutContext = createContext(null);

export const useLayoutContext = () => useContext(LayoutContext);
