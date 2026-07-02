import React, { useState, useEffect, useRef } from "react";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { FaTimes, FaWhatsapp, FaExclamationTriangle } from "react-icons/fa";

const AvatarFoto = ({
  cedula,
  nombre,
  size = "40px",
  className = "",
  allowReport = false,
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  // Arranca en false: mientras el avatar no es visible o no tiene foto, se
  // muestra la inicial del nombre (no un spinner). Pasa a true al buscar.
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Lazy-load: solo pedimos la foto a Storage cuando el avatar entra en pantalla.
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  // TU NÚMERO DE SOPORTE (Sin símbolos)
  const ADMIN_PHONE = "18094202288";

  // Observamos la visibilidad del avatar (con margen para precargar un poco antes).
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true); // Fallback: si no hay soporte, cargamos igual.
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      if (!cedula || !isVisible) {
        return;
      }

      // Las fotos en Storage pueden estar nombradas SIN guiones (00112345678.jpg)
      // o CON guiones (001-1234567-8.jpg). Reconstruimos ambos formatos desde los
      // dígitos y probamos.
      //
      // ORDEN IMPORTANTE — SIN guiones PRIMERO:
      // Las fotos NUEVAS (cámara, correctas) se suben con la cédula normalizada
      // (sin guiones). Las fotos VIEJAS del padrón (recortes, frecuentemente de
      // otra persona) están con guiones. Por eso preferimos la nueva y dejamos
      // la del padrón solo como respaldo para quienes no tienen foto nueva.
      const digitos = cedula.replace(/\D/g, "");
      const cedulaSinGuiones = digitos;
      const cedulaConGuiones =
        digitos.length === 11
          ? `${digitos.slice(0, 3)}-${digitos.slice(3, 10)}-${digitos.slice(10)}`
          : cedula;

      const pathsToTry = [
        `votantes_fotos/${cedulaSinGuiones}.jpg`,
        `votantes_fotos/${cedulaSinGuiones}.JPG`,
        `votantes_fotos/${cedulaSinGuiones}.jpeg`,
        `votantes_fotos/${cedulaSinGuiones}.png`,
        `votantes_fotos/${cedulaConGuiones}.jpg`,
        `votantes_fotos/${cedulaConGuiones}.JPG`,
        `votantes_fotos/${cedulaConGuiones}.jpeg`,
        `votantes_fotos/${cedulaConGuiones}.png`,
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
  }, [cedula, isVisible]);

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
        ref={containerRef}
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
            loading="lazy"
            decoding="async"
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
