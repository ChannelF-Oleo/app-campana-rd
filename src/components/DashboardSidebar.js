import React from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { FaBars, FaTimes, FaSignOutAlt, FaSun, FaMoon } from "react-icons/fa";
import { getVisibleNavItems } from "../data/navConfig"; // Asegúrate de que este archivo exista
import "./DashboardSidebar.css";

function DashboardSidebar({
  user,
  onSetGoalClick,
  onLogout,
  isCollapsed,
  onToggleSidebar,
}) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Obtener ítems según el rol
  const visibleNavItems = getVisibleNavItems(user);

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* --- HEADER --- */}
      <div className="sidebar-header">
        <h3>{isCollapsed ? "" : "Menú"}</h3>
        <button
          onClick={onToggleSidebar}
          className="toggle-button"
          aria-label="Alternar barra lateral"
        >
          {isCollapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      {/* --- MENU LIST --- */}
      <ul className="sidebar-menu">
        {visibleNavItems.map((item) => {
          const IconComponent = item.icon;

          // FIX CRÍTICO: Identificar si es la raíz del dashboard para usar 'end'
          const isDashboardHome = item.path === "/dashboard";

          // 1. Renderizar Enlace de Navegación
          if (!item.isAction) {
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={isDashboardHome} // <--- ESTO EVITA EL DOBLE RESALTADO
                  className={({ isActive }) => (isActive ? "active" : "")}
                  title={isCollapsed ? item.label : ""}
                >
                  <IconComponent />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          }

          // 2. Renderizar Botón de Acción (ej. Meta)
          if (item.isAction && item.id === "meta") {
            return (
              <li key={item.id}>
                <button
                  onClick={onSetGoalClick}
                  className="sidebar-action-button"
                  title={isCollapsed ? item.label : ""}
                >
                  <IconComponent />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          }
          return null;
        })}
      </ul>

      {/* --- FOOTER --- */}
      <div className="sidebar-footer">
        <button
          onClick={toggleDarkMode}
          className="theme-toggle-button"
          title={isCollapsed ? "Cambiar Tema" : ""}
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
          {!isCollapsed && (
            <span>{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>
          )}
        </button>

        <button
          onClick={onLogout}
          className="logout-button-sidebar"
          title={isCollapsed ? "Cerrar Sesión" : ""}
        >
          <FaSignOutAlt />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}

export default DashboardSidebar;
