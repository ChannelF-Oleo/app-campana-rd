import React, { useState } from "react"; 
// Importar solo los hooks necesarios, aunque no hay en este componente,
// es buena práctica para escalabilidad (ej. useState, useEffect si fueran necesarios)
import {
  FaHammer,
  FaHandHoldingMedical,
  FaChild,
  FaArrowRight,

} from "react-icons/fa";
// Importar un componente de enrutamiento como Link de 'react-router-dom'
// para evitar recargas completas de página (Asumiendo que estás usando React Router)
import { Link } from "react-router-dom";
// El import de ProposalsPage.js está en desuso a menos que uses HOCs o Context
// import "./ProposalsPage.js";
import "./Home.css";
import FelixPortrait from "../Felix/Felix.png";
import Felix1 from "../Felix/Felix1.png";
import Felix2 from "../Felix/Felix2.png";
import Felix3 from "../Felix/Felix3.png";
import Felix4 from "../Felix/Felix4.png";
import Felix5 from "../Felix/Felix5.png";
import Felix6 from "../Felix/Felix6.png";
import Felix7 from "../Felix/Felix7.jpg";
import Felix8 from "../Felix/Felix8.jpg";
import Felixmobil from "../Felix/FelixMobil.png"; 

// 1. Componente de tarjeta reutilizable (Mejora de Mantenibilidad)
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="card">
    {/* 2. Uso de mayúsculas para el componente del ícono */}
    <Icon />
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

// 3. Componente de ítem de línea de tiempo reutilizable (Mejora de Mantenibilidad)
const TimelineItem = ({ year, description }) => (
  <div className="timeline-item">
    <div className="timeline-year">{year}</div>
    <div className="timeline-description">{description}</div>
  </div>
);

function Home() {
  // Datos extraídos a variables o constantes (Mejora de legibilidad)
  const proposalsPath = "/propuestas"; // Usar ruta relativa/absoluta para Link

  // Datos de Gestión Legislativa (Permite fácil adición/modificación)
  const gestionData = [
    {
      icon: FaHammer,
      title: "Infraestructura",
      description:
        "Proyecto de asfaltado y construcción de calles en Hato Nuevo, Palave y otros sectores vulnerables.",
    },
    {
      icon: FaHandHoldingMedical,
      title: "Salud y Prevención",
      description:
        "Impulso a la enseñanza de Primeros Auxilios en escuelas de Jornada Escolar Extendida.",
    },
    {
      icon: FaChild,
      title: "Primera Infancia",
      description:
        "Solicitud para la instalación de Centros CAIPI (Estancias Infantiles) en Las Caobas, Hato Nuevo y Palavé.",
    },
  ];

  // Datos de Biografía (Permite fácil adición/modificación)
  const timelineData = [
    {
      year: "1978",
      description:
        "Nace Félix Manuel Encarnación Montero en Vallejuelo, provincia San Juan.",
    },
    {
      year: "1996 (Aprox.)",
      description:
        "Migra a Santo Domingo a los 18 años y culmina el nivel secundario en el Liceo del Libertador, SDO.",
    },
    {
      year: "2009",
      description:
        "Funda el Súper Colmado Vallejuelo e inicia su participación política en el PRD.",
    },
    { year: "2010", description: "Funda su empresa, Shutters Global." },
    {
      year: "2014",
      description:
        "Se gradúa como Licenciado en Derecho en la Universidad del Caribe.",
    },
    {
      year: "2020",
      description:
        "Electo Regidor Municipal por el PRM en SDO. Se destaca como Vocero de la Sala Capitular.",
    },
    {
      year: "2021-2022",
      description: "Asume la Presidencia de la Sala Capitular.",
    },
    {
      year: "Actualidad",
      description: "Se desempeña como Diputado de la Provincia Santo Domingo.",
    },
  ];

  // Datos de Acción Comunitaria (Permite fácil adición/modificación)
  const accionData = [
    {
      title: "Solidaridad",
      description:
        "Entrega de raciones alimenticias en comunidades vulnerables para fomentar el vínculo solidario.",
    },
    {
      title: "Salud",
      description:
        "Auspició operativos médicos en Haina y acompañó la inauguración de la Unidad de Pie Diabético en SDO.",
    },
    {
      title: "Emprendimiento",
      description:
        "Apoyo a la Fundación Emprendedoras Virtuosas, promoviendo el empoderamiento económico femenino.",
    },
  ];

  // *** DATOS NUEVOS: Galería (Rutas de imágenes reales importadas) ***
  const galleryData = [
    {
      id: 1,
      image: Felix1, 
      caption:
        "UN AÑO ACOMPAÑANDO EL DESARROLLO Entre los Legislativo y lo Comunitario | 2024-2028",
    },
    {
      id: 2,
      image: Felix2,
      caption:
        "Legislando por un Estado Democrático de Derecho que escucha, acompaña y transforma la vida en los barrios de SDO.",
    },
    {
      id: 3,
      image: Felix3,
      caption:
        "Proyecto de resolución de la cámara de diputados que solicita al presidente la asignación de una partida económica en el presupuesto general destinada a la construcción y ha faltado de las calles en los sectores de Hato Nuevo, Caballona, Bienvenido, Juan Guzmán y Palavé.",
    },
    {
      id: 4,
      image: Felix4,
      caption:
        "Proyecto de resolución mediante el cual la cámara de diputados solicita al Ministerio de Educación implementar los cursos de primeros auxilios para que sea impartida como materia en la escuela de jornada extendida",
    },
    {
      id: 5,
      image: Felix5,
      caption:
        "Proyecto de resolución mediante el cual se le solicita al señor presidente a través del INAIPI la instalación de un centro de atención integral a la primera infancia (CAIPI) en los sectores de Las Caobas, Hato Nuevo y Palavé.",
    },
    {
      id: 6,
      image: Felix6,
      caption:
        "Sembrando ciudadanía: recorrido legislativo con los jóvenes de Palavé",
    },
    {
      id: 7,
      image: Felix7,
      caption:
        "Las grandes transformaciones comienzan en pequeños encuentros llenos de compromiso y esperanza. Escuchar, aprender y actuar: ese es el camino.",
    },
    {
      id: 8,
      image: Felix8,
      caption:
        "Educación y solidaridad para un futuro brillante. Acompañando a los niños y niñas de SDO en su camino hacia el éxito académico.",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

 

  return (
    <div className="home-container">
      {/* SECCIÓN HÉROE */}
      <section id="hero" className="hero-section">
        <div className="hero-content container">
          <div className="hero-main-content">
            {/* Contenedor de la Imagen (Izquierda) */}
            <div className="hero-image-left">
              {/* 1. Imagen para Desktop (la actual) */}
              <img 
                src={FelixPortrait} 
                alt="Diputado Félix Encarnación" 
                className="desktop-portrait" 
              />
              {/* 2. Imagen para Móvil */}
              <img 
                src={Felixmobil} 
                alt="Diputado Félix Encarnación Móvil" 
                className="mobile-portrait" 
              />
            </div>

            {/* Contenedor del Texto y CTA (Derecha) */}
            <div className="hero-text-right">
              <h1>Felix Encarnación</h1>
              <p className="hero-tag">DIPUTADO | SANTO DOMINGO OESTE</p>
              <h4>ACOMPAÑANDO EL DESARROLLO</h4>
              <p className="hero-subtitle">
                Entre lo Legislativo y lo Comunitario | 2024-2028
              </p>
              {/* 4. Usar <Link> en lugar de <a> para navegación interna */}
              <Link to={proposalsPath} className="cta-button primary-cta">
                Ver Propuestas Clave
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN GESTIÓN LEGISLATIVA (RESUMEN) */}
      <section id="gestion" className="gestion-section">
        <div className="container">
          <h2>Compromiso y Resultados</h2>
          <div className="grid-3">
            {/* 5. Mapeo de datos para generar tarjetas */}
            {gestionData.map((item, index) => (
              <FeatureCard
                key={index} // Idealmente usaríamos un ID único
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN BIOGRAFÍA (Línea de Tiempo) - Ajustado en CSS para móvil */}
      <section id="biografia" className="biografia-section">
        <div className="container">
          <h2>Trayectoria de Servicio</h2>

          <div className="timeline">
            {/* 6. Mapeo de datos para generar ítems de la línea de tiempo */}
            {timelineData.map((item, index) => (
              <TimelineItem
                key={index} // Idealmente usaríamos un ID único
                year={item.year}
                description={item.description}
              />
            ))}
          </div>

          {/* 7. Usar <Link> en lugar de <a> para navegación interna */}
          <Link
            to={proposalsPath}
            className="cta-button secondary-cta"
            style={{ marginTop: "40px" }}
          >
            Ver Logros Legislativos <FaArrowRight />
          </Link>
        </div>
      </section>

      {/* SECCIÓN ACCIÓN COMUNITARIA */}
      <section id="accion" className="accion-section">
        <div className="container">
          <h2>Acción Comunitaria (AC-SDO)</h2>
          <p className="accion-desc">
            El programa "Acción Comunitaria" canaliza reclamos históricos,
            identificando prioridades locales y construyendo soluciones desde la
            base de Santo Domingo Oeste.
          </p>
          <div className="grid-3">
            {/* 8. Mapeo de datos para generar tarjetas de acción comunitaria */}
            {accionData.map((item, index) => (
              <div className="card" key={index}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* *** NUEVA SECCIÓN: GALERÍA DE FOTOS (Estilo Carrusel IG) *** */}
      <section id="galeria" className="gallery-section">
        <div className="container">
          <h2>Galería Comunitaria</h2>
          <p className="gallery-desc">
            Momentos clave de nuestra labor legislativa y compromiso en las
            calles de Santo Domingo Oeste.
          </p>

          {/* Wrapper para el posicionamiento de botones en desktop */}
          <div className="carousel-wrapper">
            
            {/* Contenedor que maneja el desplazamiento y contiene los botones en móvil */}
            <div className="carousel-container">
              
             
              
              {/* Contenedor de las Slides: Habilitamos el desplazamiento (swipe) con CSS */}
              <div
                className="gallery-carousel"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {galleryData.map((item, index) => (
                  <div
                    className="gallery-item"
                    key={item.id}
                    id={`slide-${item.id}`}
                  >
                    <div className="gallery-image-wrapper">
                      {/* Reemplazar con rutas de imágenes reales */}
                      <img src={item.image} alt={`Galeria ${index + 1}`} />
                    </div>
                    <div className="gallery-caption">
                      <p>{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>

             
            </div>
          </div>

          {/* Puntos de navegación (Fuera del wrapper para centrado independiente) */}
          <div className="carousel-dots">
            {galleryData.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Ir a la diapositiva ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;


