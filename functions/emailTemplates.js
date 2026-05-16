// EmailTemplates.js
// Lógica pura de datos y contenido de las plantillas

const getBaseTemplate = require("./BaseLayout");

// 1. Bienvenida para SIMPATIZANTES
const getSimpatizanteWelcomeTemplate = (nombre) => {
  const content = `
    <div class="greeting">¡Hola, ${nombre}!</div>
    
    <div class="message">
      <p>¡Gracias por dar el paso y sumarte a este esfuerzo colectivo por nuestra comunidad!</p>
      
      <p>Me llena de gran entusiasmo darte la bienvenida oficial a la plataforma <strong>FE28</strong>. 
      Tu registro confirma que compartimos la misma visión y el compromiso inquebrantable de ver crecer y prosperar a nuestro municipio de 
      <strong>Santo Domingo Oeste</strong>.</p>
    </div>
    
    <div class="highlight">
      <p style="margin-bottom: 8px;"><strong>¿Cómo se construye el cambio?</strong></p>
      <ul style="margin-left: 20px; padding: 0;">
        <li style="margin-bottom: 4px;">Conociendo a fondo nuestras propuestas legislativas.</li>
        <li style="margin-bottom: 4px;">Asistiendo a los encuentros comunitarios en tu sector.</li>
        <li style="margin-bottom: 4px;">Multiplicando este mensaje con tus vecinos y amigos de SDO.</li>
      </ul>
    </div>
    
    <div class="message">
      <p>Desde la Cámara de Diputados seguiremos impulsando iniciativas que representen dignamente a cada familia de nuestra demarcación, promoviendo empleos, seguridad y mejores servicios.</p>
    </div>
    
    <div class="btn-container">
      <a href="https://felixencarnacion.com/propuestas" class="cta-button" target="_blank">
        📋 Conoce Nuestras Propuestas
      </a>
    </div>
    
    <div class="message">
      <p>¡Gracias por ser parte del motor del cambio en Santo Domingo Oeste!</p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// 2. Bienvenida para USUARIOS DEL移动 (Multiplicadores/Coordinadores)
const getUserWelcomeTemplate = (nombre, email, rol = 'multiplicador') => {
  const rolDescriptions = {
    'admin': 'Administrador del Sistema',
    'coordinador': 'Coordinador de Zona',
    'multiplicador': 'Multiplicador Comunitario',
    'supervisor': 'Supervisor de Equipo'
  };
  
  const content = `
    <div class="greeting">¡Bienvenido al equipo de trabajo, ${nombre}!</div>
    
    <div class="message">
      <p>Es un verdadero honor contar con tu liderazgo y compromiso en la estructura tecnológica de nuestro proyecto político. Tu labor en el territorio es la pieza clave para consolidar nuestra presencia en cada rincón de Santo Domingo Oeste.</p>
    </div>
    
    <div class="highlight">
      <p style="margin-bottom: 8px;"><strong>Credenciales de acceso a tu panel:</strong></p>
      <table style="width: 100%; font-size: 15px;">
        <tr><td style="padding: 3px 0; width: 80px;"><strong>Email:</strong></td><td>${email}</td></tr>
        <tr><td style="padding: 3px 0;"><strong>Rol:</strong></td><td><span style="background-color: #004d99; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${rolDescriptions[rol] || rol}</span></td></tr>
      </table>
    </div>
    
    <div class="message">
      <p>A partir de este momento, tienes habilitadas las siguientes herramientas de gestión en tu Dashboard:</p>
      <ul style="margin-left: 20px; padding: 0;">
        <li style="margin-bottom: 4px;">📊 Registro digital y geolocalizado de simpatizantes en tiempo real.</li>
        <li style="margin-bottom: 4px;">🔗 Generación de enlaces únicos de referidos para tus operativos de inscripción.</li>
        <li style="margin-bottom: 4px;">📈 Métricas de alcance y cumplimiento de objetivos por sector.</li>
      </ul>
    </div>
    
    <div class="btn-container">
      <a href="https://felixencarnacion.com/login" class="cta-button" target="_blank">
        🚀 Acceder al Dashboard
      </a>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// 3. Recuperación de contraseña
const getPasswordResetTemplate = (nombre, resetLink) => {
  const content = `
    <div class="greeting">Hola, ${nombre}</div>
    
    <div class="message">
      <p>Hemos recibido una solicitud interna para restablecer la contraseña de acceso a tu cuenta de gestión de simpatizantes.</p>
      <p>Si reconoces esta actividad, por favor haz clic en el siguiente enlace seguro para configurar tus nuevas credenciales:</p>
    </div>
    
    <div class="btn-container">
      <a href="${resetLink}" class="cta-button" target="_blank">
        🔐 Restablecer Contraseña
      </a>
    </div>
    
    <div class="highlight">
      <p style="margin-bottom: 4px; color: #b30000;"><strong>⚠️ Medidas de Seguridad:</strong></p>
      <ul style="margin-left: 20px; padding: 0; font-size: 14px;">
        <li>Este enlace de autenticación caducará automáticamente en 1 hora.</li>
        <li>Si no solicitaste este cambio, puedes ignorar el correo de forma segura.</li>
      </ul>
    </div>
    
    <div class="message">
      <p>En caso de que el botón no funcione, copia la dirección web adjunta a continuación:</p>
      <p style="word-break: break-all; background-color: #f1f3f5; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #495057; border: 1px solid #dee2e6;">
        ${resetLink}
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

// 4. Notificación de metas
const getGoalNotificationTemplate = (nombre, meta, progreso) => {
  const porcentaje = Math.round((progreso / meta.objetivo) * 100);
  const esMetaCumplida = progreso >= meta.objetivo;
  
  const content = `
    <div class="greeting">¡Excelente trabajo, ${nombre}!</div>
    
    <div class="message">
      <p>Te escribimos para notificarte el estatus analítico y el progreso de las metas de inscripción de simpatizantes asignadas a tu cuenta:</p>
    </div>
    
    <div class="highlight">
      <p style="margin-bottom: 8px;"><strong>📊 Rendimiento de Operativo Territorial:</strong></p>
      <table style="width: 100%; font-size: 15px;">
        <tr><td style="padding: 4px 0; width: 140px;"><strong>Meta de registros:</strong></td><td>${meta.objetivo} simpatizantes</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Completados a la fecha:</strong></td><td>${progreso}</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Porcentaje logrado:</strong></td><td><strong>${porcentaje}%</strong></td></tr>
        <tr><td style="padding: 4px 0;"><strong>Período evaluado:</strong></td><td>${meta.periodo}</td></tr>
      </table>
    </div>
    
    <div class="message">
      <p>${esMetaCumplida 
        ? '🎉 <strong>¡Enhorabuena!</strong> Has cumplido con el 100% o más del objetivo estratégico asignado para tu sector.' 
        : `Estás a tan solo <strong>${meta.objetivo - progreso} registros</strong> de consolidar tu cuota asignada para este periodo.`
      }</p>
    </div>
    
    <div class="btn-container">
      <a href="https://felixencarnacion.com/dashboard" class="cta-button" target="_blank">
        📈 Monitorear Mi Estructura
      </a>
    </div>
  `;
  
  return getBaseTemplate(content);
};

module.exports = {
  getSimpatizanteWelcomeTemplate,
  getUserWelcomeTemplate,
  getPasswordResetTemplate,
  getGoalNotificationTemplate
};
