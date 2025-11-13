import React from 'react';
import {
    FaGraduationCap,
    FaHeart,
    FaUserShield,
    FaCrosshairs
} from 'react-icons/fa';
// Las demás se eliminan del import si no se usan directamente como FaRoad, FaBabyCarriage, FaShip
import './Propuestas.css';


// 1. Componente Reutilizable para Tarjetas de Propuesta
const ProposalCard = ({ tag, title, description, detail, citation }) => (
    // Se asume que los "cite_start" y "cite" son placeholders para referencias
    <div className="prop-card" data-citation={citation}>
        {tag && <span className={`tag ${tag.class}`}>{tag.text}</span>}
        <h3 dangerouslySetInnerHTML={{ __html: title }} />
        <p dangerouslySetInnerHTML={{ __html: description }} />
        {detail && <p className="card-detail">Importancia: {detail}</p>}
    </div>
);

// 2. Datos de Proyectos Legislativos extraídos
const legislativeProjects = [
    {
        tag: { class: 'tag-infra', text: 'Infraestructura y Vías' },
        title: 'Asfaltado y Construcción Vial para SDO',
        description: 'Solicita al Presidente Abinader la asignación de fondos para la construcción y asfaltado de calles en Hato Nuevo, Caballona, Bienvenido, Juan Guzmán, Mango Fresco y Palavé.',
        detail: 'Beneficia a más de 30 mil personas en zonas de expansión, promoviendo salud y progreso.',
        citation: 'cite: 67, 72, 76'
    },
    {
        tag: { class: 'tag-salud', text: 'Salud y Seguridad Escolar' },
        title: 'Implementación de Primeros Auxilios en Escuelas',
        description: 'Propuesta para integrar los cursos de "Primeros Auxilios Básicos" como materia en las escuelas de Jornada Escolar Extendida, debido a la alta tasa de accidentes de tránsito.',
        detail: 'Fortalecer la cultura de prevención y empoderar a los jóvenes como agentes de cambio.',
        citation: 'cite: 85, 92, 94'
    },
    {
        tag: { class: 'tag-infancia', text: 'Primera Infancia' },
        title: 'Centros CAIPI en Zonas Vulnerables',
        description: 'Solicita la instalación de Centros de Atención Integral a la Primera Infancia (CAIPI) en Las Caobas, Hato Nuevo y Palavé, SDO, para mitigar la vulnerabilidad infantil.',
        detail: 'Garantiza cuidado, protección y oportunidades para miles de niños.',
        citation: 'cite: 99, 102, 103, 107'
    },
];

// 3. Datos de Comisiones y Rol Legislativo extraídos
const commissionRoles = [
    {
        tag: { class: 'tag-comision', text: 'Obras Públicas y Comunicaciones' },
        title: 'Fomento del Desarrollo Sostenible',
        description: 'Analiza propuestas de ley que impactan la movilidad y seguridad vial, fiscalizando la ejecución de obras y el uso eficiente de recursos.',
        citation: 'cite: 204, 205'
    },
    {
        tag: { class: 'tag-comision', text: 'Asuntos Marítimos' },
        title: 'Defensa de la Soberanía Jurídica',
        description: 'Estudia iniciativas sobre comercio marítimo y soberanía. Participó en el análisis de la Sentencia TC/0547/24 (RD vs. Países Bajos).',
        citation: 'cite: 180, 190'
    },
];

// 4. Datos de Posicionamiento Clave extraídos
const keyPositions = [
    {
        tag: { class: 'tag-politica', text: 'Reforma Constitucional' },
        title: 'Reforma Constitucional', // Título simplificado ya que la tarjeta no lo usa
        description: 'Apoyó la reciente modificación constitucional, reafirmando que "la democracia no se defiende en discursos, se protege en hechos".',
        citation: 'cite: 121, 123'
    },
    {
        tag: { class: 'tag-politica', text: 'Política Migratoria' },
        title: 'Política Migratoria', // Título simplificado
        description: 'Respalda las medidas migratorias del Presidente Abinader, buscando proteger la soberanía y velar por una convivencia pacífica y justa.',
        citation: 'cite: 143, 149'
    },
];

// 5. Datos de Acción Comunitaria extraídos
const communityActions = [
    {
        title: 'Apoyo al Emprendimiento Femenino',
        description: 'Apoyo a la Fundación Emprendedoras Virtuosas, promoviendo el empoderamiento económico de las mujeres en el municipio.',
        citation: 'cite: 295, 302'
    },
    {
        title: 'Deporte como Inclusión',
        description: 'Impulsa actividades y políticas que integran el deporte, buscando prevenir la violencia y enaltecer el talento juvenil en los barrios.',
        citation: 'cite: 242, 245'
    },
    {
        title: 'Salud en el Territorio',
        description: 'Acuerdo de colaboración con el Área 7 de Salud Pública y FUNDECOH para fortalecer la seguridad y salud comunitaria.',
        citation: 'cite: 324, 325'
    },
    {
        title: 'Vivienda Digna',
        description: 'Celebró la entrega del proyecto Guajimia VI (144 apartamentos), considerado un hito para la vivienda digna y la inclusión en SDO.',
        citation: 'cite: 377'
    },
];


function Propuestas() {
    return (
        <div className="propuestas-container container">
            <h1 className="page-header">Gestión y Propuestas 2024-2025</h1>

            {/* SECCIÓN: PROYECTOS LEGISLATIVOS */}
            <div className="prop-section">
                <h2><FaGraduationCap /> Proyectos de Resolución e Iniciativas</h2>
                <div className="grid-3">
                    {/* 6. Mapeo de datos para renderizar */}
                    {legislativeProjects.map((prop, index) => (
                        <ProposalCard
                            key={index}
                            tag={prop.tag}
                            title={prop.title}
                            description={prop.description}
                            detail={prop.detail}
                            citation={prop.citation}
                        />
                    ))}
                </div>
            </div>

            {/* SECCIÓN: COMISIONES Y ROL EN EL CONGRESO */}
            <div className="prop-section">
                <h2><FaUserShield /> Comisiones y Rol Legislativo</h2>
                <div className="grid-2">
                    {commissionRoles.map((role, index) => (
                        <ProposalCard
                            key={`role-${index}`}
                            tag={role.tag}
                            title={role.title}
                            description={role.description}
                            citation={role.citation}
                        />
                    ))}
                </div>

                <div className="prop-section">
                    <h2 style={{ marginTop: '40px', }}> <FaCrosshairs/>Posicionamiento Clave</h2>
                    <div className="grid-2">
                        {keyPositions.map((pos, index) => (
                            <ProposalCard
                                key={`pos-${index}`}
                                tag={pos.tag}
                                title={pos.title}
                                description={pos.description}
                                citation={pos.citation}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* SECCIÓN: ACCIÓN COMUNITARIA */}
            <div className="prop-section">
                <h2><FaHeart /> Acción Comunitaria y Social</h2>
                <div className="grid-2">
                    {communityActions.map((action, index) => (
                        // Para este caso, podemos usar el mismo ProposalCard omitiendo el tag
                        <ProposalCard
                            key={`action-${index}`}
                            title={action.title}
                            description={action.description}
                            citation={action.citation}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// 7. Asegurar la exportación del nombre del componente
export default Propuestas;