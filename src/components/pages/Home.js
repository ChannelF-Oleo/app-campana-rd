import React, { useState, useEffect } from "react";
import { FaHammer, FaHandHoldingMedical, FaChild, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

// Importación de Imágenes
import FelixPortrait from "../../Felix/Felix.png";
import Felixmobil from "../../Felix/FelixMobil.png";
import Felix1 from "../../Felix/Felix1.png";
import Felix2 from "../../Felix/Felix2.png";
import Felix3 from "../../Felix/Felix3.png";
import Felix4 from "../../Felix/Felix4.png";
import Felix5 from "../../Felix/Felix5.png";
import Felix6 from "../../Felix/Felix6.png";
import Felix7 from "../../Felix/Felix7.jpg";
import Felix8 from "../../Felix/Felix8.jpg";

// Componentes Reutilizables (Conservando tu lógica)
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="card">
    <Icon />
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const TimelineItem = ({ year, description }) => (
  <div className="timeline-item">
    <div className="timeline-dot"></div>
    <div className="timeline-content">
      <div className="timeline-year">{year}</div>
      <div className="timeline-description">{description}</div>
    </div>
  </div>
);

function Home() {
  const proposalsPath = "/propuestas";

  // Datos (Mantenemos tus constantes originales)
  const gestionData = [
    { icon: FaHammer, title: "Infraestructura", description: "Proyecto de asfaltado y construcción de calles en Hato Nuevo, Palave y otros sectores vulnerables." },
    { icon: FaHandHoldingMedical, title: "Salud y Prevención", description: "Impulso a la enseñanza de Primeros Auxilios en escuelas de Jornada Escolar Extendida." },
    { icon: FaChild, title: "Primera Infancia", description: "Solicitud para la instalación de Centros CAIPI en Las Caobas, Hato Nuevo y Palavé." },
  ];

  const timelineData = [
    { year: "1978", description: "Nace Félix Manuel Encarnación Montero en Vallejuelo, provincia San Juan." },
    { year: "1996", description: "Migra a Santo Domingo a los 18 años y culmina el nivel secundario en el Liceo del Libertador, SDO." },
    { year: "2009", description: "Funda el Súper Colmado Vallejuelo e inicia su participación política en el PRD." },
    { year: "2010", description: "Funda su empresa, Shutters Global." },
    { year: "2014", description: "Se gradúa como Licenciado en Derecho en la Universidad del Caribe." },
    { year: "2020", description: "Electo Regidor Municipal por el PRM en SDO. Vocero de la Sala Capitular." },
    { year: "2021", description: "Asume la Presidencia de la Sala Capitular." },
    { year: "Hoy", description: "Se desempeña como Diputado de la Provincia Santo Domingo." },
  ];

  const galleryData = [
    { id: 1, image: Felix1, caption: "UN AÑO ACOMPAÑANDO EL DESARROLLO | 2024-2028" },
    { id: 2, image: Felix2, caption: "Legislando por un Estado Democrático de Derecho que escucha y acompaña." },
    { id: 3, image: Felix3, caption: "Proyecto de resolución para la construcción y asfaltado de calles en SDO." },
    { id: 4, image: Felix4, caption: "Propuesta para implementar cursos de primeros auxilios en escuelas." },
    { id: 5, image: Felix5, caption: "Solicitud de instalación de centros CAIPI en sectores vulnerables." },
    { id: 6, image: Felix6, caption: "Sembrando ciudadanía: recorrido legislativo con los jóvenes." },
    { id: 7, image: Felix7, caption: "Las grandes transformaciones comienzan en pequeños encuentros llenos de compromiso." },
    { id: 8, image: Felix8, caption: "Educación y solidaridad para un futuro brillante en nuestra comunidad." },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Efecto opcional para que el carrusel sea automático
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === galleryData.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [galleryData.length]);

  return (
    <div className="home-container">
      {/* SECCIÓN HÉROE */}
      <section id="hero" className="hero-section">
        <div className="container">
          <div className="hero-main-content">
            <div className="hero-image-left">
              <img src={FelixPortrait} alt="Diputado Félix" className="desktop-portrait" />
              <img src={Felixmobil} alt="Diputado Félix Móvil" className="mobile-portrait" />
            </div>

            <div className="hero-text-right">
              <h1>Felix Encarnación</h1>
              <p className="hero-tag">DIPUTADO | SANTO DOMINGO OESTE</p>
              <h4>ACOMPAÑANDO EL DESARROLLO</h4>
              <p className="hero-subtitle">Entre lo Legislativo y lo Comunitario | 2024-2028</p>
              <Link to={proposalsPath} className="cta-button primary-cta">
                Ver Propuestas Clave
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* GALERÍA */}
      <section id="galeria" className="gallery-section">
        <div className="container">
          <h2>Galería Comunitaria</h2>
          <p className="gallery-desc">Momentos clave de nuestra labor legislativa y compromiso en las calles.</p>

          <div className="carousel-wrapper">
            <div className="carousel-container">
              <div
                className="gallery-carousel"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {galleryData.map((item) => (
                  <div className="gallery-item" key={item.id}>
                    <div className="gallery-image-wrapper">
                      <img src={item.image} alt="Evidencia" />
                    </div>
                    <div className="gallery-caption">
                      <p>{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="carousel-dots">
              {galleryData.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentSlide ? "active" : ""}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GESTIÓN */}
      <section id="gestion" className="gestion-section">
        <div className="container">
          <h2>Compromiso y Resultados</h2>
          <div className="grid-3">
            {gestionData.map((item, index) => (
              <FeatureCard key={index} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* BIOGRAFÍA */}
      <section id="biografia" className="biografia-section">
        <div className="container">
          <h2>Trayectoria de Servicio</h2>
          <div className="timeline-container">
            <div className="timeline-line"></div>
            {timelineData.map((item, index) => (
              <TimelineItem key={index} {...item} />
            ))}
          </div>
          <Link to={proposalsPath} className="cta-button secondary-cta" style={{ marginTop: "40px" }}>
            Ver Logros Legislativos <FaArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;



