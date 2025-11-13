import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// Asegúrate de instalar react-icons si usas estos: npm install react-icons
import { FaBars, FaTimes } from 'react-icons/fa'; 
import './Navbar.css';

function Navbar() {
  // 1. Estado para saber si el menú móvil está abierto o cerrado
  const [isOpen, setIsOpen] = useState(false);

  // 2. Función para alternar el estado del menú
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  // 3. Función para cerrar el menú después de hacer clic en un enlace (útil en móviles)
  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo" onClick={closeMenu}>Felix Encarnación</Link>
      
      {/* 4. Ícono de Hamburguesa/Cierre (visible solo en móvil) */}
      <div className="menu-icon" onClick={toggleMenu}>
        {/* Muestra FaTimes (X) si está abierto, y FaBars (hamburguesa) si está cerrado */}
        {isOpen ? <FaTimes /> : <FaBars />}
      </div>

      {/* 5. El menú aplica la clase 'active' condicionalmente */}
      <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
        <li className="nav-item">
          <Link to="/" className="nav-link" onClick={closeMenu}>Inicio</Link>
        </li>
        <li className="nav-item">
          <Link to="/propuestas" className="nav-link" onClick={closeMenu}>Propuestas</Link>
        </li>
        <li className="nav-item">
          <Link to="/registro" className="nav-link" onClick={closeMenu}>Inscribete!</Link>
        </li>
        <li className="nav-item">
          <Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
