import React from "react";
import { FaFacebook, FaInstagram, FaXTwitter, FaFilePdf } from "react-icons/fa6"; // FaXTwitter es más actual que FaTimes

const SOCIAL_LINKS = [
  { id: "facebook", icon: <FaFacebook />, url: "https://www.facebook.com/felixencarnacion", label: "Facebook" },
  { id: "instagram", icon: <FaInstagram />, url: "https://www.instagram.com/felixencarnacionsdo/?hl=es", label: "Instagram" },
  { id: "x", icon: <FaXTwitter />, url: "https://x.com/FelixM2024", label: "X (Twitter)" },
];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="container footer-content">

        {/* Sección de Autoría */}
        <div className="footer-section">
          <h3 className="footer-title">Félix Encarnación</h3>
          <p className="footer-copy">&copy; {currentYear} Todos los derechos reservados.</p>
          <p className="dev-credit">
            Diseño y Desarrollo por{" "}
            <a href="https://fireforgerd.com" target="_blank" rel="noopener noreferrer">
              FireforgeRD
            </a>
          </p>
        </div>

        {/* Sección de Transparencia */}
        <div className="footer-section">
          <h3 className="footer-title">Transparencia</h3>
          <a
            href={process.env.PUBLIC_URL + "/Rendicion_de_cuenta.pdf"}
            target="_blank"
            rel="noopener noreferrer"
            className="download-btn"
          >
            <FaFilePdf aria-hidden="true" />
            <span>Rendición de Cuentas</span>
          </a>
        </div>

        {/* Sección de Redes Sociales */}
        <div className="footer-section">
          <h3 className="footer-title">Conéctate</h3>
          <div className="social-grid">
            {SOCIAL_LINKS.map(({ id, icon, url, label }) => (
              <a
                key={id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`social-icon ${id}`}
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
