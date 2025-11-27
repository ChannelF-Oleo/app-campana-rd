import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom"; // 1. IMPORTANTE: Agregamos useNavigate
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
  const navigate = useNavigate(); // 2. Inicializamos el hook

  // 3. NUEVA FUNCIÓN DE LOGOUT SEGURO
  const handleLogout = async () => {
    try {
      await onLogout(); // Esperamos a que Firebase cierre sesión
    } catch (error) {
      console.error("Error al salir:", error);
    } finally {
      navigate("/login"); // 4. Forzamos la redirección inmediata
    }
  };

  const allItems = getVisibleNavItems(user);
  const mainItems = allItems.slice(0, 3);
  const overflowItems = allItems.slice(3);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* MENÚ EXPANDIBLE */}
      <div className={`bottom-nav-expandable ${isMenuOpen ? "open" : ""}`}>
        <div className="expandable-overlay" onClick={closeMenu} />
        <div className="expandable-content">
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

          {overflowItems.length > 0 && <div className="expandable-divider" />}

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

          {/* 5. USAMOS LA NUEVA FUNCIÓN AQUÍ */}
          <button onClick={handleLogout} className="expandable-item logout">
            <span className="expand-icon">
              <FaSignOutAlt />
            </span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* BARRA INFERIOR */}
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
