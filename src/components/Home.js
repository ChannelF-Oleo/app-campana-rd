import React from "react";
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

  return (
    <div className="home-container">
      {/* SECCIÓN HÉROE */}
      <section id="hero" className="hero-section">
        <div className="hero-content container">
          <div className="hero-main-content">
            {/* Contenedor de la Imagen (Izquierda) */}
            <div className="hero-image-left">
              <img src={FelixPortrait} alt="Diputado Félix Encarnación" />
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

      {/* SECCIÓN BIOGRAFÍA (Línea de Tiempo) */}
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
    </div>
  );
}

export default Home;
