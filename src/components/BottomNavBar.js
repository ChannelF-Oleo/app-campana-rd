import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaBars, FaTimes, FaSignOutAlt, FaSun, FaMoon, FaChevronUp 
} from 'react-icons/fa';
import { useTheme } from '../ThemeContext';
import { getVisibleNavItems } from '../data/navConfig';
import './BottomNavBar.css';

function BottomNavBar({ user, onSetGoalClick, onLogout }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Obtenemos todos los items
  const allItems = getVisibleNavItems(user);
  const isAdmin = user.rol === 'admin';

  // --- LÓGICA DE VISUALIZACIÓN ---
  let mainItems = [];
  let moreItems = [];

  if (isAdmin) {
    // ADMIN: Mostramos Inicio, Registro, Usuarios en la barra.
    // El resto va al menú "Más".
    mainItems = allItems.slice(0, 3); // Índices 0, 1, 2
    moreItems = allItems.slice(3);    // El resto (Pelotones, Comandos...)
  } else {
    // OTROS: Mostramos todo en la barra (generalmente son 3 o 4 items)
    mainItems = allItems;
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* --- MENÚ EXPANDIBLE (POPUP) --- */}
      {/* Se muestra solo si es Admin y el menú está abierto */}
      {isAdmin && (
        <div className={`bottom-nav-expandable ${isMenuOpen ? 'open' : ''}`}>
          <div className="expandable-content">
            
            {/* Items extra del Admin (Pelotones, Comandos) */}
            {moreItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className="expandable-item"
                onClick={closeMenu}
              >
                <item.icon className="expand-icon" />
                <span>{item.label}</span>
              </NavLink>
            ))}

            <hr className="expandable-divider" />

            {/* Opciones de Sistema (Tema y Salir) */}
            <button 
              onClick={() => { toggleDarkMode(); closeMenu(); }} 
              className="expandable-item"
            >
              {isDarkMode ? <FaSun className="expand-icon"/> : <FaMoon className="expand-icon"/>}
              <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>

            <button onClick={onLogout} className="expandable-item logout">
              <FaSignOutAlt className="expand-icon" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
          {/* Fondo oscuro para cerrar al hacer click fuera */}
          <div className="expandable-overlay" onClick={closeMenu}></div>
        </div>
      )}

      {/* --- BARRA FIJA INFERIOR --- */}
      <nav className="bottom-nav-bar">
        
        {/* 1. Items Principales (Inicio, Registro, Usuarios...) */}
        {mainItems.map((item) => {
          const Icon = item.icon;

          if (item.isAction && item.id === 'meta') {
            return (
              <button key={item.id} onClick={onSetGoalClick} className="nav-item action-button">
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.end} // Lee la propiedad 'end' desde navConfig
              className="nav-item"
              onClick={closeMenu} // Cierra el menú si cambias de pestaña ppal
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}

        {/* 2. Botón "MÁS" (Solo Admin) o "SALIR/TEMA" (Otros) */}
        {isAdmin ? (
          <button 
            onClick={toggleMenu} 
            className={`nav-item ${isMenuOpen ? 'active-menu' : ''}`}
          >
            {isMenuOpen ? <FaTimes className="nav-icon" /> : <FaBars className="nav-icon" />}
            <span className="nav-label">{isMenuOpen ? 'Cerrar' : 'Más'}</span>
          </button>
        ) : (
          // Si NO es admin, mostramos Salir directamente (o Tema, según prefieras)
          <button onClick={onLogout} className="nav-item logout-button">
            <FaSignOutAlt className="nav-icon" />
            <span className="nav-label">Salir</span>
          </button>
        )}
      </nav>
    </>
  );
}

export default BottomNavBar;
