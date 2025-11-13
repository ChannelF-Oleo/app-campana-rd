import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import './DashboardSidebar.css';
import { 
  FaBars, FaTimes, FaHome, FaUsers, FaUserPlus, FaBullseye, 
  FaSignOutAlt, FaTasks, FaSun, FaMoon 
} from 'react-icons/fa';

function DashboardSidebar({ user, onSetGoalClick, onLogout, isCollapsed, onToggleSidebar }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3>{isCollapsed ? '' : 'Menu'}</h3>
        <button onClick={onToggleSidebar} className="toggle-button" aria-label="Toggle Sidebar">
          {isCollapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      <ul className="sidebar-menu">
        <li>
          <NavLink to="/dashboard" end title={isCollapsed ? "Inicio" : ""}>
            <FaHome />
            {!isCollapsed && <span>Inicio</span>}
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/registrar" title={isCollapsed ? "Registrar Simpatizante" : ""}>
            <FaUserPlus />
            {!isCollapsed && <span>Registro</span>}
          </NavLink>
        </li>
        
        {user && (user.rol === 'multiplicador' || user.rol === 'lider de zona') && (
          <li>
            <button onClick={onSetGoalClick} className="sidebar-action-button" title={isCollapsed ? "Definir Meta" : ""}>
              <FaBullseye />
              {!isCollapsed && <span>Meta</span>}
            </button>
          </li>
        )}
        
        {user && user.rol === 'admin' && (
          <>
            <li>
              <NavLink to="/admin/usuarios" title={isCollapsed ? "Gestión Usuarios" : ""}>
                <FaUsers />
                {!isCollapsed && <span>Usuarios</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/equipos" title={isCollapsed ? "Gestion Equipos" : ""}>
                <FaTasks />
                {!isCollapsed && <span>Pelotones</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/comandos" title={isCollapsed ? "Comandos" : ""}>
                <FaTasks />
                {!isCollapsed && <span>Comandos</span>}
              </NavLink>
            </li>
          </>
        )}
      </ul>
      
      <div className="sidebar-footer">
        <button onClick={toggleDarkMode} className="theme-toggle-button" title={isCollapsed ? "Cambiar Tema" : ""}>
          {isDarkMode ? <FaSun /> : <FaMoon />}
          {!isCollapsed && <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
        </button>

        <button onClick={onLogout} className="logout-button-sidebar" title={isCollapsed ? "Cerrar Sesión" : ""}>
           <FaSignOutAlt />
           {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}

export default DashboardSidebar;
