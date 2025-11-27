import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaSun,
  FaMoon,
  FaChevronRight,
} from "react-icons/fa";
import { useTheme } from "../ThemeContext";
import { getVisibleNavItems } from "../data/navConfig";
import "./BottomNavBar.css";

function BottomNavBar({ user, onSetGoalClick, onLogout }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const allItems = getVisibleNavItems(user);

  // Dividimos items: 3 principales + resto
  const mainItems = allItems.slice(0, 3);
  const overflowItems = allItems.slice(3);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* --- MENÚ EXPANDIBLE (Action Sheet) --- */}
      {/* Renderizamos siempre, pero controlamos visibilidad con la clase 'open' */}
      <div className={`bottom-nav-expandable ${isMenuOpen ? "open" : ""}`}>
        {/* 1. Overlay oscuro para cerrar al hacer clic fuera */}
        <div className="expandable-overlay" onClick={closeMenu} />

        {/* 2. Contenido del menú (Tarjeta flotante) */}
        <div className="expandable-content">
          {/* A. Items de Navegación Extra */}
          {overflowItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className="expandable-item"
              onClick={closeMenu}
            >
              <span className="expand-icon">
                <item.icon />
              </span>
              <span>{item.label}</span>
              <FaChevronRight
                style={{ marginLeft: "auto", opacity: 0.3, fontSize: "0.8rem" }}
              />
            </NavLink>
          ))}

          {/* Separador si hay items arriba */}
          {overflowItems.length > 0 && <div className="expandable-divider" />}

          {/* B. MODO OSCURO */}
          <button
            onClick={() => {
              toggleDarkMode();
              closeMenu();
            }}
            className="expandable-item"
          >
            <span className="expand-icon">
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </span>
            <span>{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>
          </button>

          {/* C. CERRAR SESIÓN */}
          <button onClick={onLogout} className="expandable-item logout">
            <span className="expand-icon">
              <FaSignOutAlt />
            </span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* --- BARRA INFERIOR FIJA --- */}
      <nav className="bottom-nav-bar">
        {mainItems.map((item) => {
          if (item.id === "set-goal") {
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSetGoalClick();
                  closeMenu();
                }}
                className="nav-item action-button"
              >
                <item.icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={closeMenu}
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Botón MENÚ (4to botón) */}
        <button
          onClick={toggleMenu}
          className={`nav-item ${isMenuOpen ? "active-menu" : ""}`}
        >
          {isMenuOpen ? (
            <FaTimes className="nav-icon" />
          ) : (
            <FaBars className="nav-icon" />
          )}
          <span className="nav-label">{isMenuOpen ? "Cerrar" : "Menú"}</span>
        </button>
      </nav>
    </>
  );
}

export default BottomNavBar;
