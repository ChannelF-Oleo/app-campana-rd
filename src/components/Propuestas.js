import React from "react";
import {
  FaGraduationCap,
  FaHeart,
  FaUserShield,
  FaCrosshairs,
} from "react-icons/fa";
import "./Propuestas.css";

// 1. Componente Reutilizable para Tarjetas
const ProposalCard = ({ tag, title, description, detail }) => (
  <div className="prop-card">
    <div className="card-accent-line"></div>
    {tag && <span className={`tag ${tag.class}`}>{tag.text}</span>}
    <h3 dangerouslySetInnerHTML={{ __html: title }} />
    <p dangerouslySetInnerHTML={{ __html: description }} />
    {detail && (
      <p className="card-detail">
        <strong>Importancia:</strong> {detail}
      </p>
    )}
  </div>
);

// --- DATOS INTEGRADOS PARA EVITAR EL ERROR 'NO-UNDEF' ---

const legislativeProjects = [
  {
    tag: { class: "tag-infra", text: "Infraestructura" },
    title: "Asfaltado y Construcción Vial para SDO",
    description: "Solicitud de fondos para la construcción y asfaltado en Hato Nuevo, Caballona, Bienvenido, Juan Guzmán, Mango Fresco y Palavé.",
    detail: "Beneficia a más de 30 mil personas en zonas de expansión.",
  },
  {
    tag: { class: "tag-salud", text: "Salud Escolar" },
    title: "Primeros Auxilios en Escuelas",
    description: 'Integrar "Primeros Auxilios Básicos" como materia en la Jornada Escolar Extendida.',
    detail: "Fortalece la cultura de prevención ante accidentes de tránsito.",
  },
  {
    tag: { class: "tag-infancia", text: "Primera Infancia" },
    title: "Centros CAIPI en SDO",
    description: "Instalación de centros en Las Caobas, Hato Nuevo y Palavé para mitigar la vulnerabilidad infantil.",
    detail: "Garantiza cuidado y protección para miles de niños.",
  },
];

const commissionRoles = [
  {
    tag: { class: "tag-comision", text: "Obras Públicas" },
    title: "Fomento del Desarrollo Sostenible",
    description: "Fiscalización de obras y análisis de leyes de movilidad y seguridad vial.",
  },
  {
    tag: { class: "tag-comision", text: "Asuntos Marítimos" },
    title: "Defensa de la Soberanía Jurídica",
    description: "Estudio de iniciativas sobre comercio marítimo y soberanía territorial.",
  },
];

const keyPositions = [
  {
    tag: { class: "tag-politica", text: "Constitución" },
    title: "Reforma Constitucional",
    description: "Apoyo a la modernización de la carta magna para proteger la democracia con hechos.",
  },
  {
    tag: { class: "tag-politica", text: "Soberanía" },
    title: "Política Migratoria",
    description: "Respaldo a medidas que protejan la frontera y velen por una convivencia justa.",
  },
  {
    tag: { class: "tag-politica", text: "Valores" },
    title: "Postura Conservadora",
    description: "Defensa de los valores tradicionales y la vida desde la concepción.",
  },
];

const communityActions = [
  {
    title: "Emprendimiento Femenino",
    description: "Apoyo a la Fundación Emprendedoras Virtuosas para el empoderamiento económico.",
  },
  {
    title: "Deporte e Inclusión",
    description: "Impulso de actividades deportivas para prevenir la violencia juvenil.",
  },
  {
    title: "Salud en el Territorio",
    description: "Alianzas con Salud Pública para fortalecer la seguridad comunitaria.",
  },
  {
    title: "Vivienda Digna",
    description: "Gestión y celebración de la entrega del proyecto Guajimia VI.",
  },
];

// --- COMPONENTE PRINCIPAL ---

function Propuestas() {
  return (
    <div className="propuestas-page">
      <div className="header-section">
        <h1 className="page-header">Gestión y Propuestas 2024-2025</h1>
        <p className="header-subtitle">Trabajo legislativo con transparencia y compromiso social</p>
      </div>

      {/* SECCIÓN 1: Fondo Blanco */}
      <section className="prop-section bg-white">
        <div className="container">
          <h2 className="section-title">
            <FaGraduationCap /> Proyectos de Resolución
          </h2>
          <div className="grid-3">
            {legislativeProjects.map((prop, index) => (
              <ProposalCard key={`leg-${index}`} {...prop} />
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: Fondo Alterno (Gris/Azul tenue) */}
      <section className="prop-section bg-alt">
        <div className="container">
          <h2 className="section-title">
            <FaUserShield /> Rol Legislativo
          </h2>
          <div className="grid-2">
            {commissionRoles.map((role, index) => (
              <ProposalCard key={`role-${index}`} {...role} />
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: Fondo Blanco */}
      <section className="prop-section bg-white">
        <div className="container">
          <h2 className="section-title">
            <FaCrosshairs /> Posicionamiento
          </h2>
          <div className="grid-3">
            {keyPositions.map((pos, index) => (
              <ProposalCard key={`pos-${index}`} {...pos} />
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: Fondo Alterno */}
      <section className="prop-section bg-alt">
        <div className="container">
          <h2 className="section-title">
            <FaHeart /> Acción Comunitaria
          </h2>
          <div className="grid-2">
            {communityActions.map((action, index) => (
              <ProposalCard key={`act-${index}`} {...action} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Propuestas;


