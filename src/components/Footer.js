import React from "react";
import { FaFacebook, FaInstagram, FaTwitter, FaFilePdf } from "react-icons/fa";
import "./Footer.css";
import pdfPath from "./Rendicion de cuenta Felix Encarnacion COPIA 2.pdf";

function Footer() {
  // Asumimos que el PDF está en la carpeta 'public' o 'assets'

  // Enlaces a las redes sociales de Félix Encarnación (ejemplos)
  const socialLinks = {
    facebook: "https://www.facebook.com/felixencarnacion",
    instagram: "https://www.instagram.com/felixencarnacion",
    twitter: "https://twitter.com/felixencarnacion",
  };

  return (
    <footer className="main-footer">
      <div className="container footer-content">
        {/* Columna de Autoría y Contacto */}
        <div className="footer-section author-info">
          <h3>Autoría del Proyecto</h3>
          <p>&copy; {new Date().getFullYear()} Félix Encarnación.</p>
          <p>
            Diseño y Desarrollo por <em>Channel Feliz.</em>
          </p>
        </div>

        {/* Columna de Descarga */}
        <div className="footer-section download-link">
          <h3>Transparencia</h3>
          <a
            href={pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            className="download-button"
          >
            <FaFilePdf /> Descargar Rendición de Cuentas (PDF)
          </a>
        </div>

        {/* Columna de Redes Sociales */}
        <div className="footer-section social-links">
          <h3>Síguenos</h3>
          <div className="social-icons">
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebook />
            </a>
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <FaTwitter />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
