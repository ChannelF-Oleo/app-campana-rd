import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase"; // Importamos la instancia correcta
import { FaTimes } from 'react-icons/fa'; // Asegúrate de tener react-icons
import './AvatarFoto.css'; // <--- IMPORTANTE: Estilos nuevos

const AvatarFoto = ({ cedula, nombre, size = "40px", className = "" }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- LÓGICA DE CARGA INTELIGENTE ---
  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (!cedula) {
        setLoading(false);
        return;
      }

      // Normalización de cédula
      const cedulaConGuiones = cedula;
      const cedulaSinGuiones = cedula.replace(/-/g, '');

      // Lista de intentos (fuerza bruta de extensiones)
      const pathsToTry = [
        `padron_fotos/${cedulaConGuiones}.jpg`,
        `padron_fotos/${cedulaConGuiones}.png`,
        `padron_fotos/${cedulaConGuiones}.jpeg`,
        `padron_fotos/${cedulaSinGuiones}.jpg`,
        `padron_fotos/${cedulaSinGuiones}.png`,
        `padron_fotos/${cedulaSinGuiones}.jpeg`
      ];

      const tryNextPath = async (index) => {
        if (index >= pathsToTry.length) {
          if (isMounted) setLoading(false); // No se encontró
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
          tryNextPath(index + 1); // Intentar siguiente formato
        }
      };

      setLoading(true);
      tryNextPath(0);
    };

    fetchImage();

    return () => { isMounted = false; };
  }, [cedula]);

  // --- UTILIDADES ---
  const stringToColor = (str) => {
    if (!str) return '#ccc';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
  };

  const containerStyle = {
    width: size,
    height: size,
    fontSize: `calc(${parseInt(size)}px * 0.4)`,
  };

  // --- HANDLERS ---
  const openModal = (e) => {
    e.stopPropagation(); // Evitar que el click se propague a la fila de la tabla
    if (imageUrl) setIsModalOpen(true);
  };

  const closeModal = (e) => {
    if (e) e.stopPropagation();
    setIsModalOpen(false);
  };

  // --- RENDERIZADO ---

  return (
    <>
      {/* 1. MINIATURA (Visible en tabla/perfil) */}
      <div 
        className={`avatar-container ${imageUrl ? 'clickable' : ''} ${className}`}
        style={containerStyle}
        onClick={openModal}
        title={imageUrl ? "Clic para ampliar" : nombre}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={nombre || "Usuario"} 
            className="avatar-img"
            onError={() => setImageUrl(null)} // Fallback si la imagen está rota
          />
        ) : (
          <div 
            className="avatar-placeholder"
            style={{ backgroundColor: nombre ? stringToColor(nombre) : '#e0e0e0' }}
          >
            {loading ? "..." : (nombre ? nombre.charAt(0).toUpperCase() : "?")}
          </div>
        )}
      </div>

      {/* 2. MODAL DE ZOOM (Solo si hay imagen y está abierto) */}
      {isModalOpen && imageUrl && (
        <div className="avatar-modal-overlay" onClick={closeModal}>
          <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="avatar-modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            
            <img src={imageUrl} alt={nombre} className="avatar-modal-image" />
            
            <div className="avatar-modal-footer">
              <h3>{nombre}</h3>
              <p>{cedula}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarFoto;

