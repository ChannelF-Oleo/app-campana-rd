import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          {/* LADO IZQUIERDO: LOGO */}
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            FELIX <span>ENCARNACIÓN</span>
          </Link>

          {/* LADO DERECHO: ICONO (Solo móvil) */}
          <button
            className="menu-icon"
            onClick={toggleMenu}
            aria-label="Abrir menú"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* MENÚ DE NAVEGACIÓN */}
          <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Inicio
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/propuestas" className={`nav-link ${location.pathname === '/propuestas' ? 'active' : ''}`}>
                Propuestas
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/registro" className="nav-link nav-link-btn">
                ¡Inscríbete!
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/login" className="nav-link nav-login-link">
                Login
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* OVERLAY PARA CERRAR AL TOCAR FUERA */}
      <div className={`nav-overlay ${isOpen ? 'active' : ''}`} onClick={closeMenu} />
    </>
  );
}

export default Navbar;
