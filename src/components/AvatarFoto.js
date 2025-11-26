import React, { useState, useEffect } from "react";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { FaTimes, FaWhatsapp, FaExclamationTriangle } from "react-icons/fa";
import "./AvatarFoto.css";

const AvatarFoto = ({
  cedula,
  nombre,
  size = "40px",
  className = "",
  allowReport = false,
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TU NÚMERO DE SOPORTE (Sin símbolos)
  const ADMIN_PHONE = "18094202288"; // <--- ¡PON TU NÚMERO AQUÍ!

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      if (!cedula) {
        setLoading(false);
        return;
      }

      const cedulaConGuiones = cedula;
      const cedulaSinGuiones = cedula.replace(/-/g, "");

      const pathsToTry = [
        `votantes_fotos/${cedulaConGuiones}.jpg`,
        `votantes_fotos/${cedulaConGuiones}.JPG`,
        `votantes_fotos/${cedulaConGuiones}.png`,
        `votantes_fotos/${cedulaConGuiones}.jpeg`,
        `votantes_fotos/${cedulaSinGuiones}.jpg`,
        `votantes_fotos/${cedulaSinGuiones}.JPG`,
        `votantes_fotos/${cedulaSinGuiones}.png`,
        `votantes_fotos/${cedulaSinGuiones}.jpeg`,
      ];

      const tryNextPath = async (index) => {
        if (index >= pathsToTry.length) {
          if (isMounted) setLoading(false);
          return;
        }
        try {
          const photoRef = ref(storage, pathsToTry[index]);
          const url = await getDownloadURL(photoRef);
          if (isMounted) {
            setImageUrl(url);
            setLoading(false);
          }
        } catch (error) {
          tryNextPath(index + 1);
        }
      };
      setLoading(true);
      tryNextPath(0);
    };
    fetchImage();
    return () => {
      isMounted = false;
    };
  }, [cedula]);

  // --- UTILIDADES ---
  const stringToColor = (str) => {
    if (!str) return "#ccc";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const containerStyle = {
    width: size,
    height: size,
    fontSize: `calc(${parseInt(size)}px * 0.4)`,
  };

  const openModal = (e) => {
    e.stopPropagation();
    if (imageUrl) setIsModalOpen(true);
  };
  const closeModal = (e) => {
    if (e) e.stopPropagation();
    setIsModalOpen(false);
  };

  // Función para enviar reporte
  const handleReport = () => {
    const message = `Hola, soy el usuario ${nombre} (Cédula: ${cedula}). La foto que aparece en mi perfil no soy yo. Por favor corregir.`;
    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  return (
    <>
      {/* MINIATURA */}
      <div
        className={`avatar-container ${
          imageUrl ? "clickable" : ""
        } ${className}`}
        style={containerStyle}
        onClick={openModal}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={nombre}
            className="avatar-img"
            onError={() => setImageUrl(null)}
          />
        ) : (
          <div
            className="avatar-placeholder"
            style={{
              backgroundColor: nombre ? stringToColor(nombre) : "#e0e0e0",
            }}
          >
            {loading ? "..." : nombre ? nombre.charAt(0).toUpperCase() : "?"}
          </div>
        )}
      </div>

      {/* MODAL (LIGHTBOX) */}
      {isModalOpen && imageUrl && (
        <div className="avatar-modal-overlay" onClick={closeModal}>
          <div
            className="avatar-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="avatar-modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            <img src={imageUrl} alt={nombre} className="avatar-modal-image" />

            <div className="avatar-modal-footer">
              <h3>{nombre}</h3>
              <p>{cedula}</p>

              {/* BOTÓN DE REPORTE (Solo si se activa la prop) */}
              {allowReport && (
                <div className="report-section">
                  <p className="report-text">
                    <FaExclamationTriangle /> ¿Este no eres tú?
                  </p>
                  <button onClick={handleReport} className="report-button">
                    <FaWhatsapp /> Comunicar a Soporte
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarFoto;
