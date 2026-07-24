This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: backup_votantes_fotos_*, **/*.pdf, public/**, build/**, dist/**
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.claude/
  settings.local.json
.firebase/
  hosting.YnVpbGQ.cache
functions/
  .eslintrc.js
  .gitignore
  BaseLayout.js
  emailTemplates.js
  index.js
  package.json
  RESEND_SETUP.md
  zonas.json
scripts/
  fix_colors.js
  recomprimirFotos.js
  setup-resend.bat
src/
  components/
    admin/
      Comandos.js
      CreateUser.js
      EditUserModal.js
      EmailTest.js
      ManageTeams.js
      ManageUsers.js
    charts/
      PadronCoverageChart.js
      RegistrationsByDayChart.js
      RegistrationsByZoneChart.js
    dashboard/
      BottomNavBar.js
      Dashboard.js
      DashboardSidebar.js
      DashboardWelcome.js
      MyGoals.js
      MyReferralLink.js
      MyRegisteredSimpatizantes.js
      MyRegistrations.js
      MyTeam.js
      RegisterByActivist.js
      SetGoalModal.js
      TotalRegistrations.js
    pages/
      Home.js
      Login.js
      NotFound.js
      Propuestas.js
      PublicRegister.js
      RegisterAppUser.js
      SignUp.js
      UserProfile.js
      ZonasElectorales.js
    ui/
      AvatarFoto.js
      EmailStatus.js
      ErrorBoundary.js
      Footer.js
      Loader.js
      Navbar.js
      UbicacionElectoralFields.js
  data/
    navConfig.js
    navConfig.test.js
    sectores.json
    ubicacionElectoral.js
    ubicaciones.js
    zonas.json
  Felix/
    FELIX MANUEL ENCARNACION MONTERO, PROV. SANTO DOMINGO, CIRC. 4 PRM (1).JPG
    Felix.png
    Felix1.png
    Felix2.png
    Felix3.png
    Felix4.png
    Felix5.png
    Felix6.png
    Felix7.jpg
    Felix8.jpg
    FelixMobil.png
    Inscribete.png
    JCT_8814.jpg
    JUVENTUD CON FELIX.png
  hooks/
    useMediaQuery.js
    usePageTracking.js
  utils/
    analytics.js
    comprimirImagen.js
    excelConFoto.js
    fotoCache.js
    fotoExport.js
    pdfPadron.js
    subirFotoUsuario.js
  App.js
  AuthContext.js
  constants.js
  constants.test.js
  global.css
  index.js
  logo.svg
  reportWebVitals.js
  service-worker.js
  setupTests.js
  ThemeContext.js
.firebaserc
.gitignore
corecciones.md
cors.json
firebase.json
firestore.indexes.json
firestore.rules
optimizacion.md
package.json
README.md
RESEND_FRONTEND_INTEGRATION.md
RESEND_IMPLEMENTATION_SUMMARY.md
SEO_SETUP.md
storage.rules
```

# Files

## File: .claude/settings.local.json
````json
{
  "permissions": {
    "allow": [
      "Bash(git check-ignore *)"
    ]
  }
}
````

## File: corecciones.md
````markdown
# Plan de correcciones — app-campana-rd

Orden pensado por dependencia: primero reparar el daño de datos, luego evitar que se repita, y al final UI/performance.

---

## FASE 1 — Diagnóstico y respaldo (antes de tocar nada)

1. **Backup completo de Firestore** (colecciones `usuarios` y `simpatizantes`) antes de cualquier script de migración o deduplicación.
2. **Auditoría de formato de cédula**: contar cuántos documentos tienen cédula con guiones vs. sin guiones, y detectar otros formatos inconsistentes (espacios, mayúsculas, etc.).

## FASE 2 — Reparar el daño (duplicados existentes)

**Modelo de datos confirmado**: se mantienen `usuarios` y `simpatizantes` como colecciones separadas, vinculadas entre sí por cédula (sin guiones) y por UID. No se fusionan en un solo documento.

3. **Normalizar cédulas** en todos los documentos existentes de `usuarios` y `simpatizantes`. **Estándar definido: solo dígitos, sin guiones.** Al mostrar la cédula en la UI se puede formatear con guiones si se quiere, pero en Firestore se guarda siempre sin guiones.
4. **Script de deduplicación** en `simpatizantes`: agrupar por cédula normalizada, conservar el documento más completo (más campos llenos / más reciente), fusionar datos si hace falta, eliminar los sobrantes.
5. **Vincular usuarios ↔ simpatizantes existentes** por cédula normalizada: guardar el UID del usuario dentro del documento de simpatizante correspondiente (campo tipo `uid` o `usuarioId`).
6. **Verificación manual post-migración**: contar total de simpatizantes antes/después y confirmar que vuelve a los ~65 esperados.

## FASE 3 — Evitar que se repita (lógica de creación)

7. **Regla al crear usuario**: si la cédula ya existe en `simpatizantes`, no crear un nuevo documento en `simpatizantes` — solo vincular por UID.
8. **Regla al crear simpatizante**: si la cédula ya existe en `usuarios`, no crear un nuevo documento en `simpatizantes` — crear el documento de simpatizante (o actualizarlo si ya existía) y vincularlo guardando el UID del usuario, manteniendo ambas colecciones separadas pero relacionadas por cédula/UID.
9. **Validación de formato de cédula** al guardar (normalizar siempre a un mismo formato antes de escribir en Firestore), para que no vuelva a pasar lo de guiones/sin guiones.

## FASE 4 — Bugs del formulario de creación de usuario

10. **Bug: cédula no se guarda** — revisar el formulario de creación de usuario en el Dashboard, probablemente un problema de estado (el campo no se está incluyendo en el payload que se envía a Firestore).
11. **Bug: error de Resend al crear usuario** — separar la creación del usuario en Firestore/Auth del envío del correo de bienvenida, para que un fallo en el envío de email no aparente que el usuario no se creó.
12. **Bug: "Volver a la lista" da 404** — revisar la ruta del router en esa vista.

## FASE 5 — Cambios de formulario y datos requeridos

13. **Igualar campos del formulario de usuario** con los del formulario de simpatizante.
14. **Email opcional, teléfono obligatorio** en ambos formularios.

## FASE 6 — Vista de gestión de usuarios

15. **Mostrar teléfono en vez de email** en la lista de gestión de usuarios.
16. **Optimizar carga de fotos de perfil**: usar miniaturas/thumbnails o lazy loading en vez de cargar la imagen completa en la lista.
17. **Modal del visor de foto**: ajustar el tamaño del modal al de la imagen (tipo `max-width/max-height: 90vh`, centrado, sin scroll), como un marco ajustado a la foto.

## FASE 7 — Exportar a Excel

18. **Corregir columnas de exportación**: cambiar de `Nombre, Mail, rol, cédula, registros, UID` a `Nombre, cédula, teléfono, rol, zona, dirección, registros`.

---

## Notas para ejecutar en Claude Code

- Las Fases 1 y 2 son las más delicadas (tocan datos reales) — conviene probar el script de deduplicación primero contra un export/copia, no directo en producción.
- Las Fases 3–7 son cambios de código normales, se pueden hacer con PRs separados como ya vienen trabajando (branch desde `main`, revisión del tech lead).
- Sugerencia de agrupación de PRs:
  - PR 1: Fases 1–2 (script de migración/deduplicación, se corre una sola vez)
  - PR 2: Fase 3 (lógica anti-duplicados + normalización de cédula)
  - PR 3: Fase 4 (bugs del formulario de usuario)
  - PR 4: Fases 5–6 (formulario, vista de usuarios, modal, performance)
  - PR 5: Fase 7 (exportación a Excel)
````

## File: .firebase/hosting.YnVpbGQ.cache
````
robots.txt,1760665414097,bfe106a3fb878dc83461c86818bf74fc1bdc7f28538ba613cd3e775516ce8b49
manifest.json,1762994720107,6a8bb7294c37c681a54a3ebd3f95f6ab095681821fefbd960fae4ccef475306d
service-worker.js,1764099665127,cbccfb99e85cb95002f742074c2853603b4c3559aaa38c315b99bb3642366f76
index.html,1764099665127,64e9384670bd0e4c6bf0c66268a96e43f8cba0d8192b71f38d5bc96f5e9bbd0c
logo192.png,1762994334818,b64dfb89cec8d0cd254a2705fd8a5763458bee45b1f7ee48a06e2e6ade5ebd0f
asset-manifest.json,1764099665164,2d529d7cb797ffad083ba2f4ddaff69e72bc2866459f7803dea0574ddaa7acc4
favicon.ico,1760665394546,27edce7be5922cf0bef7d4136f69b5bfbdd5bf8c13c7b026f71187d41a00aa7d
static/js/main.fa5e2b25.js.LICENSE.txt,1764099665164,41cf22f75dd2a1762122d2cbb17671a70a824fb4baaa9cbd6a876a69045c49bd
static/js/206.0f262b86.chunk.js,1764099665156,247c83251b14fb3b9dead02aad319b09b114f16020780bf087738e3edf7e387e
images/email.txt,1764097675784,bd37541af2ccaa956b503fd5b495cd1c91bc1d93f6501ae85925dfc5ea863e1b
images/email.html,1764097675753,7a844226f4e0ff843bc07c1d197547da490f667749c9a5454f27ccb3a16b4896
images/d95804dd27a28dfe32433fa713acb0de.png,1764097675831,3920c68da3689d542cffe2dfcb6ebb374b63cc4fdf9fc66e27af0e3316a00137
static/css/main.479cd6ed.css,1764099665148,5f5ca3d5aa12b13045596040b08b767f2eaeb358488d1a5ffecff045537df526
static/media/Inscribete.2c2a9f1325ea6980ccd2.png,1764099665141,746c0eaee4fa34b6470a1ac1b9c83557c7ad82422d80848f743f41d44330c1e4
images/899dfce2a4eff0d9abc920e56e8f5748.png,1764097675862,2ac9dfcbfb199a57c0cf09966ac2e8a9fd81bb0d2c2addc0350b1f0bc40870f8
static/media/Felix8.60b06568c76490bf64ac.jpg,1764099665141,a7dfcb694e01811a7c28126f5be58b6277d5fa180d379ff4c2b155ef15507417
static/media/Felix7.be4f0da61b7f5740a746.jpg,1764099665148,ed4045f8b0927ea318b0cc30a75f126efccc66449cc2b544965b153cc48f4a69
static/media/FelixMobil.6c7c21727791b930879b.png,1764099665140,0fc6a5baca969915591f618d282e80b944f2ca82b6913c8865fdabeeb74eb10c
static/media/Felix4.066630059d0c0588cbfb.png,1764099665141,bd0e0da2a78d8e132474cac441f6004b5880a4ba8a62532a457549e393f01225
static/js/main.fa5e2b25.js,1764099665164,bab1ef339d275b677e7c5ec566c1775bc6c553b13e26c7b1f2680c0906bf3150
static/media/Felix6.7421d9ea30900623f7c4.png,1764099665148,c2c3e39ee0d549bcdea494a9bbf4c86d6a857eb8e2224456f2ca44871c7615d1
static/media/Felix5.ebe8aefd8165686c5cd9.png,1764099665141,c19f8e59e23ee1488fc46a611bf10727dd16a0a5b4033652f82e2779674b982d
static/media/Felix2.a14e21be84a412d687b1.png,1764099665141,df4d92ec6820218756311014592c63ed44ac7231e9e6e00a6b420776b6afecae
static/media/Felix3.ec46bed45b370f10b406.png,1764099665141,078ef2b008e79499443bf8360dad3cf1084d1720c25a2c606b387e04b203577c
static/media/Felix1.33f7b915165f6e506d28.png,1764099665141,3c30ac8452d4a599928c54352f80ccd17a1b2bcbcc828cdc135d57a06bba1a13
static/media/Felix.66ac2705d0c850d03b4e.png,1764099665156,3047901fa07a3e125979085ad1d46230a1fd05496d2fb5beab7068866feb5556
static/media/Rendicion de cuenta Felix Encarnacion COPIA 2.872b393c5fa68e0efc9c.pdf,1764099665148,6789c3a3f04320699db49932b053ce437760e640f01a5626d85d883f9e27f1a1
````

## File: functions/.eslintrc.js
````javascript
module.exports = {
  env: {
    es6: true,
    node: true,
    // (Opcional) Si tu código de App principal usa funciones modernas de navegador
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    // Regla global (aplicada a todo el código EXCEPTO Service Worker)
    "no-restricted-globals": ["error", "name", "length"],

    "prefer-arrow-callback": "error",
    quotes: ["error", "double", { allowTemplateLiterals: true }],
  },
  // En tu .eslintrc.js:

  overrides: [
    {
      files: ["src/service-worker.js"], // Enfócate solo en el archivo que da error
      env: {
        serviceworker: true,
        node: false,
        browser: false,
      },
      rules: {
        // Usa "off" para desactivar completamente la regla.
        "no-restricted-globals": "off",
      },
    },
    // ... (otros overrides como el de **/*.spec.*)
  ],
  globals: {},
};
````

## File: functions/.gitignore
````
node_modules/
*.local
````

## File: functions/BaseLayout.js
````javascript
// BaseLayout.js
// Estructura visual tipográfica reutilizable y optimizada para Resend

const getBaseTemplate = (content) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Félix Encarnación - Diputado SDO</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; }
    
    .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
    .campaign-header { background-color: #004d99; padding: 30px; text-align: center; color: #ffffff; }
    .campaign-header h1 { margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; }
    .campaign-header p { margin: 5px 0 0 0; font-size: 14px; color: #e3f2fd; text-transform: uppercase; letter-spacing: 1px; }
    
    .content { padding: 40px 30px; font-size: 16px; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: bold; color: #004d99; margin-bottom: 20px; }
    .message { margin-bottom: 20px; text-align: left; }
    
    .btn-container { text-align: center; margin: 30px 0; }
    .cta-button { 
      display: inline-block; 
      background-color: #004d99; 
      background: linear-gradient(135deg, #004d99, #0066cc); 
      color: #ffffff !important; 
      padding: 14px 28px; 
      text-decoration: none !important; 
      border-radius: 8px; 
      font-weight: bold; 
      box-shadow: 0 2px 4px rgba(0, 77, 153, 0.3);
    }
    
    .highlight { background-color: #e3f2fd; padding: 20px; border-left: 4px solid #004d99; margin: 25px 0; border-radius: 0 8px 8px 0; }
    .signature { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef; }
    .signature-name { font-weight: bold; color: #004d99; font-size: 18px; }
    .signature-title { color: #555555; font-size: 14px; margin-top: 3px; }
    
    .footer-info { background-color: #f8f9fa; padding: 25px 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
    .social-links { margin-bottom: 15px; }
    .social-links a { color: #004d99; text-decoration: none; margin: 0 8px; font-weight: bold; }
    
    @media (max-width: 600px) {
      .content { padding: 25px 20px; }
      .cta-button { width: 80%; text-align: center; padding: 12px 18px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="campaign-header">
      <h1>FÉLIX ENCARNACIÓN</h1>
      <p>Diputado • Santo Domingo Oeste</p>
    </div>
    
    <div class="content">
      ${content}
      
      <div class="signature">
        <div class="signature-name">Félix Encarnación</div>
        <div class="signature-title">Diputado de Santo Domingo Oeste | Circunscripción 4</div>
      </div>
    </div>
    
    <div class="footer-info">
      <div class="social-links">
        <a href="https://facebook.com/felixencarnacion">Facebook</a> |
        <a href="https://instagram.com/felixencarnacion">Instagram</a> |
        <a href="https://twitter.com/felixencarnacion">Twitter</a>
      </div>
      <p>Recibiste este correo electrónico porque te registraste en la plataforma oficial de vinculación de simpatizantes de Félix Encarnación.</p>
      <p>Si deseas gestionar tus preferencias de comunicación, puedes <a href="https://felixencarnacion.com/unsubscribe" style="color: #004d99; text-decoration: underline;">darte de baja aquí</a>.</p>
      <p style="margin-top: 12px; font-size: 11px; color: #a2aab1;">
        © 2026 Félix Encarnación - FE28. Santo Domingo Oeste, República Dominicana. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = getBaseTemplate;
````

## File: functions/emailTemplates.js
````javascript
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
````

## File: functions/RESEND_SETUP.md
````markdown
# Configuración de Resend para Firebase Functions

## 📧 Migración de Nodemailer a Resend

Se ha migrado el sistema de correos de **Nodemailer + Gmail** a **Resend** para mayor confiabilidad y mejores características.

## 🔧 Configuración Requerida

### 1. Obtener API Key de Resend

1. Ve a [Resend.com](https://resend.com) y crea una cuenta
2. Verifica tu dominio (recomendado) o usa el dominio de prueba
3. Genera una API Key en el dashboard
4. Copia la API Key (formato: `re_xxxxxxxxxx`)

### 2. Configurar Secreto en Firebase

```bash
# Configurar el secreto de Resend
firebase functions:secrets:set RESEND_API_KEY

# Cuando te pida el valor, pega tu API Key de Resend
```

### 3. Verificar Dominio (Recomendado)

Para usar un dominio personalizado como `notificaciones@felixencarnacion.com`:

1. En Resend Dashboard, ve a "Domains"
2. Agrega tu dominio (ej: `fe28.com`)
3. Configura los registros DNS requeridos:
   - SPF: `v=spf1 include:_spf.resend.com ~all`
   - DKIM: Los registros que te proporcione Resend
   - DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@fe28.com`

## 📨 Funciones de Correo Implementadas

### 1. Correo de Bienvenida para Simpatizantes
- **Trigger**: Cuando se crea un documento en `simpatizantes/`
- **Función**: `sendWelcomeEmailToSimpatizante`
- **Plantilla**: Diseño profesional con imágenes de campaña
- **Contenido**: Mensaje de bienvenida al movimiento

### 2. Correo de Bienvenida para Usuarios
- **Trigger**: Cuando se crea un documento en `users/`
- **Función**: `sendWelcomeEmailToUser`
- **Plantilla**: Información sobre el rol y acceso al dashboard
- **Contenido**: Credenciales y funcionalidades disponibles

### 3. Correos Personalizados
- **Función**: `sendCustomEmail` (callable)
- **Plantillas disponibles**:
  - `simpatizante_welcome`
  - `user_welcome`
  - `password_reset`
  - `goal_notification`

## 🎨 Plantillas de Correo

### Características de las Plantillas:
- **Responsive**: Se adaptan a móviles y desktop
- **Branding**: Colores y logos de la campaña FE28
- **Profesionales**: Diseño moderno con gradientes y sombras
- **Accesibles**: Contraste adecuado y fuentes legibles
- **Interactivas**: Botones de llamada a la acción

### Elementos Incluidos:
- Header con imagen de campaña
- Contenido personalizado por tipo de correo
- Firma de Félix Encarnación
- Footer con imagen de campaña
- Enlaces a redes sociales
- Información de contacto

## 🔄 Migración desde Gmail

### Cambios Realizados:
1. ✅ Reemplazado `nodemailer` por `resend`
2. ✅ Eliminados secretos de Gmail (`GMAIL_EMAIL`, `GMAIL_PASSWORD`)
3. ✅ Agregado secreto de Resend (`RESEND_API_KEY`)
4. ✅ Nuevas plantillas HTML profesionales
5. ✅ Separación de lógica en `emailTemplates.js`
6. ✅ Triggers separados para simpatizantes y usuarios
7. ✅ Función callable para correos personalizados

### Ventajas de Resend:
- ✅ Mayor deliverability (menos spam)
- ✅ API más simple y confiable
- ✅ Mejor manejo de errores
- ✅ Métricas detalladas de entrega
- ✅ Soporte nativo para dominios personalizados
- ✅ No requiere configuración de 2FA como Gmail

## 🚀 Despliegue

### 1. Instalar Dependencias
```bash
cd functions
npm install resend
```

### 2. Configurar Secretos
```bash
# Configurar API Key de Resend
firebase functions:secrets:set RESEND_API_KEY

# Eliminar secretos antiguos de Gmail (opcional)
firebase functions:secrets:destroy GMAIL_EMAIL
firebase functions:secrets:destroy GMAIL_PASSWORD
```

### 3. Desplegar Funciones
```bash
firebase deploy --only functions
```

## 🧪 Pruebas

### Probar Correo de Simpatizante:
1. Registra un nuevo simpatizante con email válido
2. Verifica que llegue el correo de bienvenida
3. Revisa los logs: `firebase functions:log`

### Probar Correo de Usuario:
1. Crea un nuevo usuario desde el admin
2. Verifica que llegue el correo de bienvenida
3. Revisa que el contenido sea apropiado para el rol

### Probar Correo Personalizado:
```javascript
// Desde el frontend
const sendCustomEmail = httpsCallable(functions, 'sendCustomEmail');

await sendCustomEmail({
  to: 'usuario@ejemplo.com',
  subject: 'Prueba de correo',
  template: 'user_welcome',
  data: {
    nombre: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    rol: 'coordinador'
  }
});
```

## 📊 Monitoreo

### Logs de Firebase:
```bash
# Ver logs en tiempo real
firebase functions:log --only sendWelcomeEmailToSimpatizante,sendWelcomeEmailToUser

# Ver logs específicos
firebase functions:log --filter="correo"
```

### Dashboard de Resend:
- Ve a [Resend Dashboard](https://resend.com/emails)
- Revisa métricas de entrega
- Verifica bounces y quejas
- Monitorea reputación del dominio

## 🔧 Troubleshooting

### Error: "API Key not found"
```bash
# Verificar que el secreto esté configurado
firebase functions:secrets:access RESEND_API_KEY

# Reconfigurar si es necesario
firebase functions:secrets:set RESEND_API_KEY
```

### Error: "Domain not verified"
- Verifica los registros DNS en tu proveedor
- Espera hasta 24 horas para propagación
- Usa el dominio de prueba mientras tanto

### Correos no llegan:
1. Revisa la carpeta de spam
2. Verifica logs de Firebase Functions
3. Revisa dashboard de Resend para errores
4. Confirma que el email del destinatario sea válido

## 📝 Notas Importantes

- **Límites**: Resend tiene límites según el plan (100 emails/día gratis)
- **Dominio**: Usar dominio verificado mejora la deliverability
- **Plantillas**: Se pueden personalizar en `emailTemplates.js`
- **Logs**: Siempre revisar logs para debugging
- **Backup**: Mantener las funciones antiguas comentadas por si acaso
````

## File: functions/zonas.json
````json
[
  {
    "zona": "ZONA A1",
    "centros": [
      {
        "nombre": "00457 - CENTRO COMUNAL EL CAFÉ",
        "padrones": [
          "1312A.pdf",
          "1644.pdf",
          "1690.pdf",
          "1738.pdf",
          "1788.pdf",
          "1846.pdf",
          "1866.pdf"
        ]
      },
      {
        "nombre": "00512 - ESCUELA BASICA CAFÉ CON LECHE",
        "padrones": ["1746.pdf", "1795.pdf", "1838.pdf", "1881.pdf"]
      },
      {
        "nombre": "00545 - LICEO CARMEN LUISA DE LOS SANTOS",
        "padrones": [
          "1260.pdf",
          "1260A.pdf",
          "1260B.pdf",
          "1260C.pdf",
          "1261.pdf",
          "1261A.pdf",
          "1312.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA A",
    "centros": [
      {
        "nombre": "00305 - ESC. PRIM. INT. RAFAELA SANTAELLA",
        "padrones": [
          "1256.pdf",
          "1256A.pdf",
          "1256B.pdf",
          "1256C.pdf",
          "1256D.pdf",
          "1256E.pdf",
          "1259.pdf",
          "1259A.pdf",
          "1259B.pdf",
          "1259C.pdf"
        ]
      },
      {
        "nombre": "00520 - COLEGIO EVANGELICO SHALOM",
        "padrones": ["1798.pdf", "1827.pdf", "1885.pdf", "1912.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA B",
    "centros": [
      {
        "nombre": "00260 - CLINICA DIAZ PIÑEYRO",
        "padrones": ["1250.pdf", "1250A.pdf", "1250B.pdf"]
      },
      {
        "nombre": "00261 - ESC. P. NTRA. SRA. DE LA ALTAGRACIA",
        "padrones": [
          "1252.pdf",
          "1252A.pdf",
          "1252B.pdf",
          "1252C.pdf",
          "1252D.pdf",
          "1254.pdf",
          "1254A.pdf",
          "1254B.pdf",
          "1255.pdf",
          "1255A.pdf",
          "1255B.pdf",
          "1311.pdf",
          "1311A.pdf",
          "1311B.pdf",
          "1334.pdf",
          "1334A.pdf",
          "1334B.pdf",
          "1643.pdf",
          "1643A.pdf",
          "1643B.pdf"
        ]
      },
      {
        "nombre": "00262 - PARROQUIA NTRA.SRA. DE LA ALTAGRACIA",
        "padrones": ["1251.pdf", "1251A.pdf", "1251B.pdf"]
      },
      {
        "nombre": "00417 - CENTRO DE ESTUDIOS PENIEL",
        "padrones": [
          "1380.pdf",
          "1380A.pdf",
          "1380B.pdf",
          "1380C.pdf",
          "1821.pdf",
          "1861.pdf"
        ]
      },
      {
        "nombre": "00458 - COLEGIO MAXIMO GOMEZ",
        "padrones": ["1691.pdf", "1764.pdf", "1789.pdf", "1823.pdf", "1867.pdf"]
      },
      {
        "nombre": "00517 - SALON PARROQUIAL",
        "padrones": ["1778.pdf", "1883.pdf"]
      },
      {
        "nombre": "00523 - POLITECNICO TURISTICO CENTRO PARROQUIAL SANTO SOCORRO",
        "padrones": ["1253.pdf", "1253A.pdf", "1801.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA C",
    "centros": [
      {
        "nombre": "00357 - ESC. PRIM. E INTERMEDIA ESTEBAN MARTINEZ",
        "padrones": [
          "1241.pdf",
          "1241A.pdf",
          "1241B.pdf",
          "1242.pdf",
          "1242A.pdf",
          "1242B.pdf",
          "1640.pdf",
          "1751.pdf",
          "1844.pdf",
          "1850.pdf"
        ]
      },
      {
        "nombre": "00488 - ESCUELA PRIMARIA VILLA NAZARET",
        "padrones": ["1699.pdf", "1716.pdf", "1770.pdf", "1842.pdf", "1872.pdf"]
      },
      {
        "nombre": "00498 - COLEGIO GREGORIO LUPERON",
        "padrones": ["1719.pdf", "1773.pdf", "1876.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA D",
    "centros": [
      {
        "nombre": "00306 - ESCUELA CAMILA HENRIQUEZ",
        "padrones": [
          "1258.pdf",
          "1258A.pdf",
          "1258B.pdf",
          "1258C.pdf",
          "1258D.pdf",
          "1258E.pdf",
          "1258F.pdf",
          "1646.pdf",
          "1646A.pdf",
          "1816.pdf"
        ]
      },
      {
        "nombre": "00522 - CENTRO DE ESTUDIO HUERTO DEL EDEN",
        "padrones": ["1726.pdf", "1800.pdf", "1886.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA E",
    "centros": [
      {
        "nombre": "00264 - COLEGIO AMERICO LUGO",
        "padrones": [
          "1244.pdf",
          "1244A.pdf",
          "1244B.pdf",
          "1244C.pdf",
          "1245.pdf",
          "1245A.pdf"
        ]
      },
      {
        "nombre": "00354 - COLEGIO EL BUEN PASTOR",
        "padrones": [
          "1238.pdf",
          "1238A.pdf",
          "1238B.pdf",
          "1239.pdf",
          "1239A.pdf",
          "1239B.pdf"
        ]
      },
      {
        "nombre": "00355 - COLEGIO HORA DE DIOS",
        "padrones": [
          "1240.pdf",
          "1240A.pdf",
          "1240B.pdf",
          "1308.pdf",
          "1308A.pdf",
          "1308B.pdf",
          "1750.pdf",
          "1817.pdf"
        ]
      },
      {
        "nombre": "00500 - COLEGIO ADVENTISTA BETEL",
        "padrones": ["1721.pdf", "1774.pdf", "1826.pdf", "1877.pdf"]
      },
      {
        "nombre": "00535 - ESCUELA PRIMARIA LOS AMIGUITOS",
        "padrones": ["1720.pdf", "1735.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA F",
    "centros": [
      {
        "nombre": "00366 - ESCUELA PRIMARIA NICOLAS UREÑA DE MENDOZA",
        "padrones": [
          "1217.pdf",
          "1217A.pdf",
          "1218.pdf",
          "1218A.pdf",
          "1218B.pdf",
          "1632.pdf",
          "1722.pdf",
          "1756.pdf",
          "1757.pdf",
          "1831.pdf",
          "1857.pdf"
        ]
      },
      {
        "nombre": "00428 - ESCUELA DOÑA FILOMENA CANALDA",
        "padrones": [
          "1364.pdf",
          "1364A.pdf",
          "1364B.pdf",
          "1783.pdf",
          "1862.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA G",
    "centros": [
      {
        "nombre": "00353 - HOSPITAL ZONA NORTE",
        "padrones": [
          "1275.pdf",
          "1275A.pdf",
          "1275B.pdf",
          "1275C.pdf",
          "1345B.pdf",
          "1639.pdf",
          "1807.pdf",
          "1818.pdf",
          "1854.pdf"
        ]
      },
      {
        "nombre": "00363 - ESCUELA PRIMARIA DUARTE",
        "padrones": [
          "1232.pdf",
          "1232A.pdf",
          "1232B.pdf",
          "1233.pdf",
          "1233A.pdf",
          "1345.pdf",
          "1345A.pdf"
        ]
      },
      {
        "nombre": "00430 - ESCUELA PRIMARIA RENOVACION",
        "padrones": [
          "1247.pdf",
          "1247A.pdf",
          "1248.pdf",
          "1248A.pdf",
          "1248B.pdf",
          "1642.pdf"
        ]
      },
      {
        "nombre": "00479 - CENTRO DE ESTUDIO PROGRESO",
        "padrones": ["1680.pdf", "1792.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA H",
    "centros": [
      {
        "nombre": "00360 - ESCUELA BASICA ANTIGUA Y BARBADOS",
        "padrones": [
          "1431.pdf",
          "1431A.pdf",
          "1431B.pdf",
          "1752.pdf",
          "1852.pdf",
          "1900.pdf"
        ]
      },
      {
        "nombre": "00508 - ESCUELA PRIMARIA MADRE TERESA DE CALCUTA",
        "padrones": ["1729.pdf", "1776.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA I",
    "centros": [
      {
        "nombre": "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO",
        "padrones": [
          "1306.pdf",
          "1306A.pdf",
          "1307.pdf",
          "1307A.pdf",
          "1333.pdf",
          "1333A.pdf",
          "1333B.pdf",
          "1357.pdf",
          "1357A.pdf",
          "1357B.pdf",
          "1391.pdf",
          "1391A.pdf",
          "1418.pdf",
          "1418A.pdf",
          "1418B.pdf",
          "1635.pdf",
          "1635A.pdf",
          "1636.pdf",
          "1636A.pdf",
          "1637.pdf"
        ]
      },
      {
        "nombre": "00359 - ESC. PRIMARIA INICIAL Y BASICA BARBADOS",
        "padrones": [
          "1228.pdf",
          "1228A.pdf",
          "1228B.pdf",
          "1229.pdf",
          "1229A.pdf",
          "1229B.pdf",
          "1634.pdf",
          "1634A.pdf",
          "1781.pdf",
          "1851.pdf"
        ]
      },
      {
        "nombre": "00431 - ESCUELA PUBLICA LAS MERCEDES",
        "padrones": [
          "1226.pdf",
          "1226A.pdf",
          "1227.pdf",
          "1227A.pdf",
          "1227B.pdf",
          "1230.pdf",
          "1230A.pdf",
          "1230B.pdf",
          "1784.pdf",
          "1813.pdf"
        ]
      },
      {
        "nombre": "00456 - COLEGIO PSICOEDUCATIVO GESTSMANI",
        "padrones": ["1689.pdf", "1822.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA J",
    "centros": [
      {
        "nombre": "00370 - POLITECNICO DE LAS CAOBAS",
        "padrones": [
          "1271.pdf",
          "1271A.pdf",
          "1271B.pdf",
          "1271C.pdf",
          "1271D.pdf",
          "1271E.pdf",
          "1271F.pdf",
          "1272.pdf",
          "1272A.pdf",
          "1272B.pdf",
          "1272C.pdf",
          "1272D.pdf",
          "1273.pdf",
          "1273A.pdf",
          "1274.pdf",
          "1274A.pdf",
          "1274B.pdf"
        ]
      },
      {
        "nombre": "00477 - UNIVERSIDAD ODONTOLOGICA DOMINICANA",
        "padrones": ["1697.pdf", "1768.pdf", "1871.pdf"]
      },
      {
        "nombre": "00519 - CENTRO EDUCATIVO LOS OLIVOS FE Y ALEGRIA",
        "padrones": ["1797.pdf", "1884.pdf", "1911.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA K",
    "centros": [
      {
        "nombre": "00307 - ESCUELA BASICA LIC. CRISTOBALINA BATISTA TAVARES",
        "padrones": [
          "1249.pdf",
          "1249A.pdf",
          "1249B.pdf",
          "1267.pdf",
          "1267A.pdf",
          "1267B.pdf",
          "1267C.pdf",
          "1310.pdf",
          "1310A.pdf",
          "1362B.pdf"
        ]
      },
      {
        "nombre": "00416 - ESCUELA BASICA CURAZAO",
        "padrones": [
          "1677.pdf",
          "1677A.pdf",
          "1677B.pdf",
          "1742.pdf",
          "1761.pdf",
          "1820.pdf",
          "1860.pdf",
          "1905.pdf"
        ]
      },
      {
        "nombre": "00459 - UNIVERSIDAD UTESA",
        "padrones": [
          "1688.pdf",
          "1743.pdf",
          "1765.pdf",
          "1790.pdf",
          "1824.pdf",
          "1868.pdf",
          "1906.pdf"
        ]
      },
      {
        "nombre": "00460 - UNIV. FEDERICO HENRIQUEZ. Y CARVAJAL",
        "padrones": [
          "1641A.pdf",
          "1641B.pdf",
          "1687.pdf",
          "1791.pdf",
          "1869.pdf"
        ]
      },
      {
        "nombre": "00529 - COLEGIO SAN ANTON",
        "padrones": ["1814.pdf", "1891.pdf"]
      },
      {
        "nombre": "00546 - LICEO PEDRO APONTE",
        "padrones": [
          "1243.pdf",
          "1243A.pdf",
          "1243B.pdf",
          "1243C.pdf",
          "1243D.pdf",
          "1245B.pdf",
          "1246.pdf",
          "1246A.pdf",
          "1310B.pdf",
          "1362.pdf",
          "1362A.pdf",
          "1641.pdf",
          "1749.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA L",
    "centros": [
      {
        "nombre": "00369 - ESCUELA DE EDUCACION BASICA SAN MIGUEL",
        "padrones": [
          "1631.pdf",
          "1701.pdf",
          "1741.pdf",
          "1760.pdf",
          "1819.pdf",
          "1859.pdf",
          "1904.pdf"
        ]
      },
      {
        "nombre": "00435 - LICEO SECUNDARIO LAS AMERICAS",
        "padrones": []
      },
      {
        "nombre": "00490 - ESCUELA BASICA JAPON",
        "padrones": [
          "1703.pdf",
          "1734.pdf",
          "1744.pdf",
          "1771.pdf",
          "1811.pdf",
          "1841.pdf",
          "1874.pdf",
          "1907.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA M",
    "centros": [
      {
        "nombre": "00365 - ESCUELA BASICA JAMAICA",
        "padrones": ["1215.pdf", "1215A.pdf", "1630.pdf", "1902.pdf"]
      },
      {
        "nombre": "00511 - CENTRO EDUC. INDEPENDENCIA",
        "padrones": ["1745.pdf", "1880.pdf"]
      },
      {
        "nombre": "00542 - ESCUELA BASICA NUESTRA SEÑORA DE LAS MERCEDES",
        "padrones": ["1829.pdf"]
      },
      {
        "nombre": "00544 - LICEO ADELAIDA ACOSTA",
        "padrones": [
          "1320.pdf",
          "1320A.pdf",
          "1320B.pdf",
          "1702.pdf",
          "1740.pdf",
          "1755.pdf",
          "1794.pdf",
          "1845.pdf",
          "1856.pdf",
          "1873.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA N",
    "centros": [
      {
        "nombre": "00364 - CENTRO EDUCATIVO ROSA EVANGELINA SOLANO",
        "padrones": [
          "1221.pdf",
          "1221A.pdf",
          "1221B.pdf",
          "1222.pdf",
          "1222A.pdf",
          "1737.pdf",
          "1754.pdf",
          "1808.pdf",
          "1843.pdf",
          "1855.pdf",
          "1901.pdf"
        ]
      },
      {
        "nombre": "00502 - ESCUELA PRIMARIA ELIZARDO TAMAREZ SANTAMARIA",
        "padrones": ["1723.pdf", "1775.pdf"]
      },
      {
        "nombre": "00538 - LICEO PROFESOR VICTOR PASCUAL AGUERO",
        "padrones": ["1896.pdf"]
      },
      {
        "nombre": "00541 - ESCUELA BASICA CONCEPCION BONA",
        "padrones": ["1835.pdf", "1878.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA O",
    "centros": [
      {
        "nombre": "00367 - MANOGUAYABO",
        "padrones": [
          "1224.pdf",
          "1224A.pdf",
          "1224B.pdf",
          "1225.pdf",
          "1225A.pdf",
          "1633.pdf",
          "1724.pdf",
          "1758.pdf",
          "1809.pdf",
          "1858.pdf"
        ]
      },
      {
        "nombre": "00435 - LICEO SECUNDARIO LAS AMERICAS",
        "padrones": [
          "1216.pdf",
          "1216A.pdf",
          "1216B.pdf",
          "1216C.pdf",
          "1223.pdf",
          "1223A.pdf",
          "1223B.pdf",
          "1223C.pdf",
          "1223D.pdf",
          "1762.pdf",
          "1785.pdf",
          "1863.pdf"
        ]
      },
      {
        "nombre": "00516 - COLEGIO INFANTIL LOS QUERUBINES",
        "padrones": ["1777.pdf"]
      },
      {
        "nombre": "00525 - COLEGIO TRAZO DE COLORES",
        "padrones": ["1803.pdf", "1889.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA P",
    "centros": [
      {
        "nombre": "00001 - COLEGIO EL ANGEL",
        "padrones": ["0001.pdf", "1748.pdf", "1806.pdf", "1847.pdf", "1899.pdf"]
      },
      {
        "nombre": "00356 - COLEGIO JUAN 23",
        "padrones": [
          "1234.pdf",
          "1234A.pdf",
          "1235.pdf",
          "1235A.pdf",
          "1235B.pdf",
          "1384.pdf",
          "1384A.pdf",
          "1485.pdf",
          "1485A.pdf",
          "1485B.pdf"
        ]
      },
      {
        "nombre": "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO",
        "padrones": []
      }
    ]
  },
  {
    "zona": "ZONA Q",
    "centros": [
      {
        "nombre": "00425 - ESCUELA BASICA LAS PALMAS #1",
        "padrones": [
          "1403.pdf",
          "1403A.pdf",
          "1403B.pdf",
          "1483.pdf",
          "1483A.pdf",
          "1483B.pdf",
          "1484.pdf",
          "1484A.pdf",
          "1484B.pdf"
        ]
      },
      {
        "nombre": "00487 - ESCUELA VEDRUNA",
        "padrones": [
          "1231.pdf",
          "1231A.pdf",
          "1231B.pdf",
          "1231C.pdf",
          "1262.pdf",
          "1262A.pdf"
        ]
      },
      {
        "nombre": "00492 - COLEGIO SANTA MARIA",
        "padrones": [
          "1705.pdf",
          "1772.pdf",
          "1812.pdf",
          "1837.pdf",
          "1875.pdf",
          "1908.pdf"
        ]
      },
      {
        "nombre": "00524 - CLUB ESCUELA BASICA FRANCISCO A. CAAMAÑO",
        "padrones": ["1686.pdf", "1802.pdf", "1888.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA R",
    "centros": [
      {
        "nombre": "00361 - ESCUELA ING. AGR. IVAN GUZMAN K",
        "padrones": [
          "1375.pdf",
          "1375A.pdf",
          "1375B.pdf",
          "1375C.pdf",
          "1375D.pdf",
          "1375E.pdf"
        ]
      },
      {
        "nombre": "00455 - EXTENSION DE LA UASD",
        "padrones": [
          "1375F.pdf",
          "1692.pdf",
          "1710.pdf",
          "1753.pdf",
          "1763.pdf",
          "1810.pdf",
          "1833.pdf",
          "1853.pdf",
          "1865.pdf"
        ]
      },
      {
        "nombre": "00515 - HOSPITAL MUNICIPAL DE ENGOMBE",
        "padrones": ["1725.pdf", "1840.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA S",
    "centros": [
      {
        "nombre": "00362 - ESCUELA PRIMARIA BUENOS AIRES",
        "padrones": [
          "1236.pdf",
          "1236A.pdf",
          "1237.pdf",
          "1237A.pdf",
          "1279.pdf",
          "1279A.pdf",
          "1282.pdf",
          "1282A.pdf",
          "1284.pdf",
          "1284A.pdf",
          "1284B.pdf",
          "1284C.pdf",
          "1638.pdf"
        ]
      },
      {
        "nombre": "00454 - CLUB 16 DE AGOSTO",
        "padrones": [
          "1638A.pdf",
          "1638B.pdf",
          "1693.pdf",
          "1787.pdf",
          "1864.pdf"
        ]
      },
      {
        "nombre": "00543 - ESCUELA PROFESOR JUAN BOSCH GAVIÑO",
        "padrones": [
          "1486.pdf",
          "1486A.pdf",
          "1487.pdf",
          "1487A.pdf",
          "1488.pdf",
          "1488A.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA T",
    "centros": [
      {
        "nombre": "00338 - COMEDOR ECONOMICO",
        "padrones": [
          "1329.pdf",
          "1329A.pdf",
          "1329B.pdf",
          "1370.pdf",
          "1370A.pdf",
          "1370B.pdf",
          "1849.pdf"
        ]
      },
      {
        "nombre": "00476 - ASOCIACION DE IMPEDIDO FISICO MOTORES",
        "padrones": [
          "1309.pdf",
          "1309A.pdf",
          "1309B.pdf",
          "1309C.pdf",
          "1695.pdf",
          "1767.pdf",
          "1828.pdf",
          "1832.pdf"
        ]
      },
      {
        "nombre": "00526 - POLITECNICO MADRE RAFAELA IBARRA",
        "padrones": [
          "1314.pdf",
          "1314A.pdf",
          "1314B.pdf",
          "1314C.pdf",
          "1314D.pdf",
          "1314E.pdf",
          "1314F.pdf",
          "1696.pdf",
          "1769.pdf",
          "1804.pdf",
          "1890.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA U",
    "centros": [
      {
        "nombre": "00513 - ESCUELA BASICA HERMANAS MIRABAL",
        "padrones": ["1747.pdf", "1796.pdf", "1839.pdf", "1882.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA W",
    "centros": [
      {
        "nombre": "00518 - PROYECTO DESARROLLO COMUNITARIO INTEGRAL",
        "padrones": ["1727.pdf", "1780.pdf"]
      },
      {
        "nombre": "00534 - SALON MULTIUSO EL ABANICO",
        "padrones": ["1799.pdf", "1830.pdf", "1893.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA X",
    "centros": [
      {
        "nombre": "00510 - ESCUELA DE EDUCACION BASICA PROF. JUAN GABINO",
        "padrones": ["1736.pdf", "1779.pdf", "1879.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA Y",
    "centros": [
      {
        "nombre": "00474 - ESCUELA PRIMARI ERCILIA PEPIN BATEY BIENVENIDO",
        "padrones": ["1676.pdf", "1739.pdf", "1766.pdf", "1836.pdf", "1870.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA Z",
    "centros": [
      {
        "nombre": "00368 - CENTRO EDUCATIVO ALBERTO PEREZ Y SANTIAGO",
        "padrones": [
          "1219.pdf",
          "1219A.pdf",
          "1220.pdf",
          "1220A.pdf",
          "1759.pdf",
          "1834.pdf",
          "1903.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA Ñ",
    "centros": [
      {
        "nombre": "00308 - SINDICATO UNIDO DE TRAB. PORTUARIO",
        "padrones": ["1257.pdf", "1257A.pdf", "1356.pdf"]
      },
      {
        "nombre": "00453 - ESCUELA PADRE MARTIN EGUSQUIZA",
        "padrones": ["1356A.pdf", "1645.pdf", "1698.pdf", "1786.pdf"]
      }
    ]
  }
]
````

## File: scripts/fix_colors.js
````javascript
const fs = require('fs');
let css = fs.readFileSync('src/global.css', 'utf8');

const replacements = [
  // Backgrounds (white-ish) -> surface
  [/background-color:\s*(#ffffff|#fff|white|#f8fafc|#f4f7f6|#f9fafb|#f3f4f6);/gi, 'background-color: var(--color-surface);'],
  [/background:\s*(#ffffff|#fff|white|#f8fafc|#f4f7f6|#f9fafb|#f3f4f6);/gi, 'background: var(--color-surface);'],
  
  // Backgrounds (dark-ish) -> if there's any hardcoded dark backgrounds meant for light mode, they are probably text or specific elements, let's leave them.

  // Text Main (dark colors)
  [/color:\s*(#1f2937|#111827|#374151|#1e293b|#333333|#333|#000000|#000|black|#3c4043|#202124);/gi, 'color: var(--color-text-main);'],
  
  // Text Muted (gray colors)
  [/color:\s*(#6b7280|#4b5563|#9ca3af|#64748b|#94a3b8|#5f6368);/gi, 'color: var(--color-text-muted);'],
  
  // Borders
  [/border:\s*([^;]+)(#e5e7eb|#d1d5db|#e2e8f0|#f1f5f9|#f3f4f6|#dadce0);/gi, 'border: $1var(--color-border);'],
  [/border-bottom:\s*([^;]+)(#e5e7eb|#d1d5db|#e2e8f0|#f1f5f9|#f3f4f6|#dadce0);/gi, 'border-bottom: $1var(--color-border);'],
  [/border-top:\s*([^;]+)(#e5e7eb|#d1d5db|#e2e8f0|#f1f5f9|#f3f4f6|#dadce0);/gi, 'border-top: $1var(--color-border);'],
  [/border-color:\s*(#e5e7eb|#d1d5db|#e2e8f0|#f1f5f9|#f3f4f6|#dadce0);/gi, 'border-color: var(--color-border);'],
  
  // Primary Colors (convert to var(--primary))
  [/(color|background-color|background|border-color|border):\s*([^;]*)(#2563eb|#1d4ed8|#3b82f6|#004d99|#003d80|#1a73e8);/gi, '$1: $2var(--primary);'],
  
  // Danger
  [/(color|background-color|background|border-color|border):\s*([^;]*)(#ef4444|#dc2626|#f87171|#ea4335);/gi, '$1: $2var(--danger);'],

  // Success
  [/(color|background-color|background|border-color|border):\s*([^;]*)(#10b981|#059669|#22c55e|#16a34a|#34a853);/gi, '$1: $2var(--success);'],

  // Warning
  [/(color|background-color|background|border-color|border):\s*([^;]*)(#f59e0b|#d97706|#eab308|#ca8a04|#fbbc04);/gi, '$1: $2var(--warning);'],

  // Fix common rgba hover issues (optional, but let's try to map them to variables if we had them)
  // Instead of replacing all rgba, we will just ensure the basic colors are variables.
];

replacements.forEach(([regex, replacement]) => {
  css = css.replace(regex, replacement);
});

fs.writeFileSync('src/global.css', css, 'utf8');
console.log('Colors replaced with variables.');
````

## File: scripts/setup-resend.bat
````batch
@echo off
echo ========================================
echo    Configuracion de Resend para FE28
echo ========================================
echo.

echo 1. Configurando secreto de Resend API Key...
echo.
echo IMPORTANTE: Necesitas tu API Key de Resend
echo - Ve a https://resend.com/api-keys
echo - Crea una nueva API Key
echo - Copia el valor (formato: re_xxxxxxxxxx)
echo.

firebase functions:secrets:set RESEND_API_KEY

echo.
echo 2. Verificando configuracion...
firebase functions:secrets:access RESEND_API_KEY

echo.
echo 3. Instalando dependencias...
cd functions
npm install resend

echo.
echo 4. Desplegando funciones...
cd ..
firebase deploy --only functions

echo.
echo ========================================
echo    Configuracion completada!
echo ========================================
echo.
echo Proximos pasos:
echo 1. Verifica tu dominio en Resend Dashboard
echo 2. Configura registros DNS (SPF, DKIM, DMARC)
echo 3. Prueba enviando un correo de prueba
echo.
echo Para ver logs: firebase functions:log
echo.
pause
````

## File: src/components/admin/Comandos.js
````javascript
import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
// ✅ FIX: Agregados FaFileExcel y FaPrint a los imports
import {
  FaSave,
  FaPlus,
  FaTrashAlt,
  FaEdit,
  FaUserTie,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaTimes,
  FaFileExcel,
  FaPrint,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import AvatarFoto from "../ui/AvatarFoto";

// Importación de datos
import zonasData from "../../data/zonas.json";

const NIVELES = ["Municipal", "Zonal", "Sectorial"];
const LISTA_ZONAS = zonasData.map((z) => z.zona).sort();

const OBTIENE_SECTORES = (zonaNombre) => {
  const zona = zonasData.find((z) => z.zona === zonaNombre);
  return zona ? zona.centros.map((c) => c.nombre) : [];
};

// --- SUBCOMPONENTE: MODAL DE EDICIÓN/CREACIÓN ---
const ComandoModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  users,
  nivel,
}) => {
  const [formData, setFormData] = useState({
    id: Date.now(),
    cargo: "",
    userId: "",
    zona: "",
    sector: "",
  });

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      setFormData(
        initialData || {
          id: Date.now(),
          cargo: "",
          userId: "",
          zona: "",
          sector: "",
        }
      );
    }
  }, [isOpen, initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "zona") newData.sector = ""; // Reset sector al cambiar zona
      return newData;
    });
  };

  if (!isOpen) return null;

  const selectedUser = users.find((u) => u.uid === formData.userId);

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>
            {initialData ? "Editar Cargo" : "Agregar Nuevo Cargo"} ({nivel})
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Previsualización Foto */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <AvatarFoto
              cedula={selectedUser?.cedula}
              nombre={selectedUser?.nombre}
              size="80px"
            />
          </div>

          {/* Formulario */}
          <div className="form-group">
            <label>
              <FaUserTie /> Cargo *
            </label>
            <input
              type="text"
              className="search-input"
              placeholder="Ej: Director de Operaciones"
              value={formData.cargo}
              onChange={(e) => handleChange("cargo", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Responsable *</label>
            <select
              className="role-filter-select"
              value={formData.userId}
              onChange={(e) => handleChange("userId", e.target.value)}
            >
              <option value="">-- Seleccionar Persona --</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </select>
          </div>

          {nivel !== "Municipal" && (
            <div className="form-group">
              <label>
                <FaMapMarkerAlt /> Zona
              </label>
              <select
                className="role-filter-select"
                value={formData.zona}
                onChange={(e) => handleChange("zona", e.target.value)}
              >
                <option value="">-- Seleccionar Zona --</option>
                {LISTA_ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          )}

          {nivel === "Sectorial" && (
            <div className="form-group">
              <label>
                <FaLayerGroup /> Recinto/Sector
              </label>
              <select
                className="role-filter-select"
                value={formData.sector}
                onChange={(e) => handleChange("sector", e.target.value)}
                disabled={!formData.zona}
              >
                <option value="">-- Seleccionar Recinto --</option>
                {formData.zona &&
                  OBTIENE_SECTORES(formData.zona).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="save-button"
            onClick={() => onSave(formData)}
            disabled={!formData.cargo || !formData.userId}
          >
            <FaSave /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
function Comandos() {
  const [users, setUsers] = useState([]);
  const [organigrama, setOrganigrama] = useState({
    Municipal: [],
    Zonal: [],
    Sectorial: [],
  });
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState("Municipal");

  // Estado del Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const usersList = usersSnap.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        setUsers(usersList);

        const unsub = onSnapshot(
          doc(db, "organigrama", "estructura"),
          (docSnap) => {
            if (docSnap.exists()) setOrganigrama(docSnap.data());
            setLoading(false);
          }
        );
        return () => unsub();
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- ACCIONES ---

  const openModal = (nivel, item = null, index = null) => {
    setEditingLevel(nivel);
    setEditingItem(item); // Si es null, el modal sabrá que es "Crear"
    setEditingIndex(index);
    setModalOpen(true);
  };

  const handleSaveFromModal = async (data) => {
    // 1. Copiar el array actual
    const newList = [...(organigrama[editingLevel] || [])];

    if (editingIndex !== null) {
      // Editar existente
      newList[editingIndex] = data;
    } else {
      // Crear nuevo (Agregar al principio)
      newList.unshift(data);
    }

    const newOrganigrama = { ...organigrama, [editingLevel]: newList };

    // 2. Guardar en Firestore
    try {
      await setDoc(doc(db, "organigrama", "estructura"), newOrganigrama);
      setModalOpen(false);
    } catch (error) {
      alert("Error al guardar en la base de datos.");
    }
  };

  const handleDelete = async (nivel, index) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cargo?")) return;

    const newList = [...organigrama[nivel]];
    newList.splice(index, 1);
    const newOrganigrama = { ...organigrama, [nivel]: newList };

    try {
      await setDoc(doc(db, "organigrama", "estructura"), newOrganigrama);
    } catch (error) {
      alert("Error al eliminar.");
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    NIVELES.forEach((nivel) => {
      const data = (organigrama[nivel] || []).map((item) => {
        const u = users.find((user) => user.uid === item.userId);
        return {
          Cargo: item.cargo,
          Responsable: u ? u.nombre : "Sin asignar",
          Cédula: u ? u.cedula : "N/A",
          Teléfono: u ? u.telefono : "N/A",
          Zona: item.zona || "N/A",
          Sector: item.sector || "N/A",
        };
      });
      if (data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, nivel);
      }
    });
    XLSX.writeFile(wb, "Estructura_Comandos.xlsx");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", gap: "16px" }}>
        <div style={{ width: "48px", height: "48px", border: "4px solid rgba(0,77,153,0.15)", borderTopColor: "#004d99", borderRadius: "50%", animation: "spinC 0.75s linear infinite" }} />
        <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>Cargando estructura...</p>
        <style>{`@keyframes spinC { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  return (
    <div className="comandos-container glass-panel">
      <div className="comandos-header no-print">
        <div>
          <h2>Gestión de Comandos</h2>
          <p>Define la estructura jerárquica y asigna responsables.</p>
        </div>

        <div className="header-actions">
          <button
            onClick={handleExportExcel}
            className="action-btn excel-btn"
            title="Exportar Excel"
          >
            <FaFileExcel /> Exportar
          </button>
          <button
            onClick={handlePrint}
            className="action-btn print-btn"
            title="Imprimir"
          >
            <FaPrint /> Imprimir
          </button>
        </div>
      </div>

      {NIVELES.map((nivel) => (
        <div
          key={nivel}
          className={`nivel-section ${expandedLevel === nivel ? "active" : ""}`}
        >
          <div
            className="nivel-header"
            onClick={() =>
              setExpandedLevel(nivel === expandedLevel ? null : nivel)
            }
          >
            <h3>Comando {nivel}</h3>
            <span className="counter-badge">
              {organigrama[nivel]?.length || 0} Cargos
            </span>
          </div>

          {/* Contenido visible */}
          <div
            className={`nivel-content ${
              expandedLevel === nivel ? "expanded" : ""
            }`}
          >
            {/* BOTÓN AGREGAR (Arriba) */}
            <div className="level-actions-top no-print">
              <button className="add-row-btn" onClick={() => openModal(nivel)}>
                <FaPlus /> Agregar Cargo
              </button>
            </div>

            {/* LISTA DE ITEMS */}
            <div className="renglones-list">
              {organigrama[nivel]?.map((item, index) => {
                const u = users.find((user) => user.uid === item.userId);
                return (
                  <div key={item.id} className="comando-item-view">
                    {/* Foto */}
                    <div className="col-avatar">
                      <AvatarFoto
                        cedula={u?.cedula}
                        nombre={u?.nombre}
                        size="45px"
                      />
                    </div>

                    {/* Info */}
                    <div className="col-info">
                      <div className="info-name">
                        {u?.nombre || "Sin asignar"}
                      </div>
                      <div className="info-cargo">{item.cargo}</div>
                    </div>

                    {/* Zona/Sector */}
                    <div className="col-zone">
                      {item.zona && (
                        <span className="zone-tag">{item.zona}</span>
                      )}
                      {item.sector && (
                        <div className="sector-text">{item.sector}</div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="col-actions no-print">
                      <button
                        onClick={() => openModal(nivel, item, index)}
                        className="icon-btn edit"
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(nivel, index)}
                        className="icon-btn delete"
                        title="Eliminar"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {(!organigrama[nivel] || organigrama[nivel].length === 0) && (
              <p className="empty-level">No hay cargos definidos.</p>
            )}
          </div>
        </div>
      ))}

      {/* MODAL FLOTANTE */}
      <ComandoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveFromModal}
        initialData={editingItem}
        nivel={editingLevel}
        users={users}
      />
    </div>
  );
}

export default Comandos;
````

## File: src/components/admin/EditUserModal.js
````javascript
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ROL_ADMIN, ROL_LIDER, ROL_MULTIPLICADOR } from '../../constants';

function EditUserModal({ user, onClose, onSave }) {
  const [rol, setRol] = useState(user.rol);
  // 1. Estados para manejar la lista de multiplicadores
  const [multiplicadores, setMultiplicadores] = useState([]);
  const [asignados, setAsignados] = useState(user.multiplicadoresAsignados || []);
  const [loading, setLoading] = useState(true);

  // 2. useEffect para cargar todos los usuarios con rol 'multiplicador'
  useEffect(() => {
    const fetchMultiplicadores = async () => {
      // Creamos una consulta que solo trae a los multiplicadores
      const q = query(collection(db, "users"), where("rol", "==", ROL_MULTIPLICADOR));
      const querySnapshot = await getDocs(q);
      const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMultiplicadores(lista);
      setLoading(false);
    };

    fetchMultiplicadores();
  }, []);

  // 3. Función para manejar la selección de checkboxes
  const handleCheckboxChange = (multiplicadorId) => {
    setAsignados(prevAsignados => {
      if (prevAsignados.includes(multiplicadorId)) {
        // Si ya está, lo quitamos
        return prevAsignados.filter(id => id !== multiplicadorId);
      } else {
        // Si no está, lo añadimos
        return [...prevAsignados, multiplicadorId];
      }
    });
  };

  const handleSave = () => {
    // Ahora pasamos el usuario, el nuevo rol Y la lista de asignados
    onSave(user.id, rol, asignados);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Editar Usuario</h2>
        <p><strong>Nombre:</strong> {user.nombre}</p>
        <p><strong>Email:</strong> {user.email}</p>
        
        <div className="input-group">
          <label htmlFor="rol">Rol del Usuario</label>
          <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value={ROL_MULTIPLICADOR}>Multiplicador</option>
            <option value={ROL_LIDER}>Lider de Zona</option>
            <option value={ROL_ADMIN}>Administrador</option>
          </select>
        </div>

        {/* --- 4. SECCIÓN CONDICIONAL PARA LÍDER DE ZONA --- */}
        {rol === ROL_LIDER && (
          <div className="assignment-section">
            <h4>Asignar Multiplicadores</h4>
            {loading ? <p>Cargando multiplicadores...</p> : (
              <div className="multiplicadores-list">
                {multiplicadores.map(m => (
                  <div key={m.id} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      id={m.id} 
                      checked={asignados.includes(m.id)} 
                      onChange={() => handleCheckboxChange(m.id)}
                    />
                    <label htmlFor={m.id}>{m.nombre} ({m.email})</label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={handleSave} className="save-button">Guardar Cambios</button>
          <button onClick={onClose} className="cancel-button">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default EditUserModal;
````

## File: src/components/admin/EmailTest.js
````javascript
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { ROL_ADMIN, ROL_MULTIPLICADOR } from '../../constants';

const EmailTest = () => {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    template: 'simpatizante_welcome',
    nombre: '',
    email: '',
    rol: ROL_MULTIPLICADOR
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const templates = [
    { value: 'simpatizante_welcome', label: 'Bienvenida Simpatizante' },
    { value: 'user_welcome', label: 'Bienvenida Usuario' },
    { value: 'password_reset', label: 'Recuperar Contraseña' },
    { value: 'goal_notification', label: 'Notificación de Meta' }
  ];

  const roles = [
    { value: ROL_MULTIPLICADOR, label: 'Multiplicador' },
    { value: 'coordinador', label: 'Coordinador' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: ROL_ADMIN, label: 'Administrador' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const sendCustomEmail = httpsCallable(functions, 'sendCustomEmail');
      
      const emailData = {
        to: formData.to,
        subject: formData.subject,
        template: formData.template,
        data: {
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          resetLink: 'https://fe28.com/reset-password?token=example', // Para pruebas
          meta: { objetivo: 50, periodo: 'mensual' }, // Para pruebas
          progreso: 25 // Para pruebas
        }
      };

      const response = await sendCustomEmail(emailData);
      setResult(response.data);
    } catch (err) {
      console.error('Error enviando correo:', err);
      setError(err.message || 'Error enviando correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-test-container">
      <div className="email-test-card">
        <h2>🧪 Prueba de Correos Electrónicos</h2>
        <p className="email-test-description">
          Herramienta para probar el envío de correos con las plantillas de Resend
        </p>

        <form onSubmit={handleSubmit} className="email-test-form">
          <div className="form-group">
            <label htmlFor="to">Destinatario:</label>
            <input
              type="email"
              id="to"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              required
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Asunto:</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              placeholder="Asunto del correo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="template">Plantilla:</label>
            <select
              id="template"
              name="template"
              value={formData.template}
              onChange={handleInputChange}
              required
            >
              {templates.map(template => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre del Destinatario:</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              placeholder="Juan Pérez"
            />
          </div>

          {formData.template === 'user_welcome' && (
            <>
              <div className="form-group">
                <label htmlFor="email">Email (para plantilla):</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Mismo que destinatario"
                />
              </div>

              <div className="form-group">
                <label htmlFor="rol">Rol del Usuario:</label>
                <select
                  id="rol"
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                >
                  {roles.map(rol => (
                    <option key={rol.value} value={rol.value}>
                      {rol.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="send-button"
            disabled={loading}
          >
            {loading ? '📤 Enviando...' : '📧 Enviar Correo de Prueba'}
          </button>
        </form>

        {result && (
          <div className="result success">
            <h3>✅ Correo Enviado Exitosamente</h3>
            <p><strong>Message ID:</strong> {result.messageId}</p>
            <p>Revisa la bandeja de entrada del destinatario.</p>
          </div>
        )}

        {error && (
          <div className="result error">
            <h3>❌ Error al Enviar Correo</h3>
            <p>{error}</p>
            <details>
              <summary>Posibles soluciones:</summary>
              <ul>
                <li>Verifica que el API Key de Resend esté configurado</li>
                <li>Confirma que el dominio esté verificado en Resend</li>
                <li>Revisa los logs de Firebase Functions</li>
                <li>Verifica que el email del destinatario sea válido</li>
              </ul>
            </details>
          </div>
        )}

        <div className="email-test-info">
          <h3>📋 Información de las Plantillas</h3>
          <ul>
            <li><strong>Bienvenida Simpatizante:</strong> Para personas que se registran como simpatizantes</li>
            <li><strong>Bienvenida Usuario:</strong> Para usuarios que acceden al dashboard</li>
            <li><strong>Recuperar Contraseña:</strong> Para reset de contraseñas</li>
            <li><strong>Notificación de Meta:</strong> Para informar progreso de objetivos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailTest;
````

## File: src/components/admin/ManageTeams.js
````javascript
import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { FaFileExcel, FaPrint } from "react-icons/fa";
import { ROL_LIDER, ROL_MULTIPLICADOR } from "../../constants";
import AvatarFoto from "../ui/AvatarFoto";

// --- Spinner de carga ---
function LoadingSpinner({ message = "Cargando..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", gap: "16px" }}>
      <div style={{ width: "48px", height: "48px", border: "4px solid rgba(0,77,153,0.15)", borderTopColor: "#004d99", borderRadius: "50%", animation: "spinTeams 0.75s linear infinite" }} />
      <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>{message}</p>
      <style>{`@keyframes spinTeams { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ManageTeams() {
  const [leaders, setLeaders] = useState([]);
  const [multipliers, setMultipliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLeaderId, setExpandedLeaderId] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Estado para controlar qué se imprime (null = todo, ID = solo un líder)
  const [printTargetId, setPrintTargetId] = useState(null);

  // 1. CARGA DE DATOS EN TIEMPO REAL
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const allUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLeaders(allUsers.filter((user) => user.rol === ROL_LIDER));
        setMultipliers(allUsers.filter((user) => user.rol === ROL_MULTIPLICADOR));
        setLoading(false);
      },
      (error) => {
        console.error("Error:", error);
        setNotification({ message: "Error de conexión.", type: "error" });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- LÓGICA DE ASIGNACIÓN ---
  const assignMultiplier = async (leaderId, multiplierId) => {
    try {
      await updateDoc(doc(db, "users", leaderId), {
        multiplicadoresAsignados: arrayUnion(multiplierId),
      });
      await updateDoc(doc(db, "users", multiplierId), {
        liderAsignado: leaderId,
      });
      setNotification({ message: "Soldado asignado.", type: "success" });
    } catch (error) {
      setNotification({ message: "Error al asignar.", type: "error" });
    }
  };

  const unassignMultiplier = async (leaderId, multiplierId) => {
    try {
      await updateDoc(doc(db, "users", leaderId), {
        multiplicadoresAsignados: arrayRemove(multiplierId),
      });
      await updateDoc(doc(db, "users", multiplierId), { liderAsignado: null });
      setNotification({ message: "Soldado desasignado.", type: "success" });
    } catch (error) {
      setNotification({ message: "Error al desasignar.", type: "error" });
    }
  };

  const handleToggleExpand = (leaderId) => {
    setExpandedLeaderId((prevId) => (prevId === leaderId ? null : leaderId));
  };

  // --- HELPERS ---
  const availableMultipliers = multipliers.filter((m) => !m.liderAsignado);
  const getAssignedMultipliers = (leader) => {
    const assignedIds = leader.multiplicadoresAsignados || [];
    return multipliers.filter((multiplier) =>
      assignedIds.includes(multiplier.id)
    );
  };

  // --- EXPORTACIÓN EXCEL ---
  const exportAllTeams = () => {
    if (leaders.length === 0) return;
    const data = leaders.map((leader) => {
      const assigned = getAssignedMultipliers(leader);
      return {
        Líder: leader.nombre,
        Cédula: leader.cedula || "N/A",
        "Total Soldados": assigned.length,
        Nombres: assigned.map((m) => m.nombre).join(", "),
      };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Resumen");
    XLSX.writeFile(wb, "Equipos_Global.xlsx");
  };

  const exportIndividualTeam = (leader) => {
    const assigned = getAssignedMultipliers(leader);
    if (assigned.length === 0) {
      setNotification({ message: `Pelotón vacío.`, type: "error" });
      return;
    }
    const data = assigned.map((m) => ({
      Líder: leader.nombre,
      Soldado: m.nombre,
      Cédula: m.cedula || "N/A",
      Email: m.email,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Pelotón");
    XLSX.writeFile(wb, `Peloton_${leader.nombre}.xlsx`);
  };

  // --- IMPRESIÓN ---
  const handlePrintGlobal = () => {
    setPrintTargetId(null); // Imprimir todo
    setTimeout(() => window.print(), 100);
  };

  const handlePrintIndividual = (leaderId) => {
    setPrintTargetId(leaderId); // Marcar solo este líder para imprimir
    // Abrimos el acordeón automáticamente para que salga el contenido
    setExpandedLeaderId(leaderId);
    setTimeout(() => {
      window.print();
      setPrintTargetId(null); // Resetear después de imprimir
    }, 500);
  };

  if (loading) return <LoadingSpinner message="Cargando pelotones..." />;

  return (
    // Añadimos clase condicional para controlar estilos de impresión
    <div
      className={`manage-teams-container glass-panel ${
        printTargetId ? "printing-single" : ""
      }`}
    >
      <div className="manage-teams-header no-print">
        <h2>Gestión de Pelotones</h2>
        <div className="header-actions">
          <button
            onClick={exportAllTeams}
            className="export-teams-button"
            disabled={leaders.length === 0}
          >
            <FaFileExcel /> Exportar Todo
          </button>
          <button onClick={handlePrintGlobal} className="action-btn print-btn">
            <FaPrint /> Imprimir Todo
          </button>
        </div>
      </div>

      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="leaders-accordion">
        {leaders.length === 0 && (
          <p className="empty-state-global">No hay líderes de zona.</p>
        )}
        {leaders.map((leader) => {
          const assigned = getAssignedMultipliers(leader);
          const isExpanded = expandedLeaderId === leader.id;
          // Verificar si este líder es el objetivo de impresión (o si no hay objetivo, se muestran todos)
          const isPrintingThis = printTargetId === leader.id;

          return (
            <div
              key={leader.id}
              className={`leader-item ${isExpanded ? "expanded" : ""} ${
                isPrintingThis ? "print-target" : ""
              }`}
            >
              <div
                className="leader-header no-print"
                onClick={() => handleToggleExpand(leader.id)}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "15px" }}
                >
                  <AvatarFoto
                    cedula={leader.cedula}
                    nombre={leader.nombre}
                    size="50px"
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                      {leader.nombre}
                    </h3>
                    <span className="team-count-badge">
                      {assigned.length} soldados
                    </span>
                  </div>
                </div>

                <div
                  className="actions-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => exportIndividualTeam(leader)}
                    className="icon-button excel-mini"
                    title="Descargar Excel"
                    disabled={assigned.length === 0}
                  >
                    <FaFileExcel />
                  </button>

                  {/* BOTÓN RESTAURADO: IMPRIMIR UN SOLO PELOTÓN */}
                  <button
                    onClick={() => handlePrintIndividual(leader.id)}
                    className="icon-button print-mini"
                    title="Imprimir este Pelotón"
                    disabled={assigned.length === 0}
                  >
                    <FaPrint />
                  </button>

                  <span
                    className="expand-icon"
                    onClick={() => handleToggleExpand(leader.id)}
                  >
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Contenido del Líder */}
              <div className={`leader-content ${isExpanded ? "expanded" : ""}`}>
                {/* Título solo visible al imprimir */}
                <div className="print-header">
                  <h2>Reporte de Pelotón</h2>
                  <div className="print-leader-info">
                    <AvatarFoto
                      cedula={leader.cedula}
                      nombre={leader.nombre}
                      size="60px"
                    />
                    <div>
                      <h3>{leader.nombre}</h3>
                      <p>Líder de Zona • {assigned.length} Soldados</p>
                    </div>
                  </div>
                </div>

                <div className="team-section">
                  <h4 className="section-title">Soldados Asignados</h4>
                  {assigned.length > 0 ? (
                    <ul className="multiplicadores-list">
                      {assigned.map((m) => (
                        <li key={m.id} className="multiplicador-item">
                          <div className="multiplicador-info">
                            <AvatarFoto
                              cedula={m.cedula}
                              nombre={m.nombre}
                              size="40px"
                            />
                            <div className="info-text">
                              <span className="name">{m.nombre}</span>
                              <span className="cedula">
                                {m.cedula || "Sin Cédula"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => unassignMultiplier(leader.id, m.id)}
                            className="assign-button remove no-print"
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">Sin asignaciones.</p>
                  )}
                </div>

                <div className="available-section no-print">
                  <h4 className="section-title">Disponible para Asignar</h4>
                  {availableMultipliers.length > 0 ? (
                    <ul className="multiplicadores-list">
                      {availableMultipliers.map((m) => (
                        <li key={m.id} className="multiplicador-item">
                          <div className="multiplicador-info">
                            <AvatarFoto
                              cedula={m.cedula}
                              nombre={m.nombre}
                              size="40px"
                            />
                            <div className="info-text">
                              <span className="name">{m.nombre}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => assignMultiplier(leader.id, m.id)}
                            className="assign-button add"
                          >
                            Asignar
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No hay soldados libres.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ManageTeams;
````

## File: src/components/charts/PadronCoverageChart.js
````javascript
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { TOTAL_PADRON_META } from "../../constants";

ChartJS.register(ArcElement, Tooltip, Legend);

const PadronCoverageChart = () => {
  // TOTAL_PADRON_META se lee desde .env (REACT_APP_PADRON_META) vía constants.js

  const [totalSimpatizantes, setTotalSimpatizantes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchamos la colección completa para tener el número en tiempo real
    // Nota: Para optimizar costos en producción con miles de usuarios,
    // podríamos cambiar esto por una Cloud Function que actualice un contador.
    const unsub = onSnapshot(collection(db, "simpatizantes"), (snap) => {
      setTotalSimpatizantes(snap.size);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Cálculos
  const porcentaje = ((totalSimpatizantes / TOTAL_PADRON_META) * 100).toFixed(
    1
  );
  const faltantes = Math.max(0, TOTAL_PADRON_META - totalSimpatizantes);

  const data = {
    labels: ["Cubierto", "Pendiente"],
    datasets: [
      {
        data: [totalSimpatizantes, faltantes],
        backgroundColor: [
          "#28a745", // Verde (Éxito/Cubierto)
          "#e9ecef", // Gris (Fondo/Pendiente)
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    cutout: "70%", // Hace que parezca un anillo (Doughnut) más fino
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ${context.label}: ${context.raw.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <div className="metric-card glass-panel" style={{ textAlign: "center" }}>
      <div className="metric-card-header">
        <h3>Cobertura del Padrón</h3>
      </div>

      <div
        style={{
          position: "relative",
          height: "200px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <Doughnut data={data} options={options} />
            {/* Texto central con el porcentaje */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -60%)", // Ajuste visual
                fontSize: "1.5rem",
                fontWeight: "800",
                color: "#004d99",
              }}
            >
              {porcentaje}%
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: "10px", fontSize: "0.9rem", color: "#666" }}>
        <strong>{totalSimpatizantes.toLocaleString()}</strong> de{" "}
        {TOTAL_PADRON_META.toLocaleString()} votantes
      </div>
    </div>
  );
};

export default PadronCoverageChart;
````

## File: src/components/charts/RegistrationsByDayChart.js
````javascript
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function RegistrationsByDayChart({ filterUserIds }) {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const simpatizantesRef = collection(db, "simpatizantes");
    let q;

    if (filterUserIds && filterUserIds.length > 0) {
      q = query(simpatizantesRef, where("registradoPor", "in", filterUserIds));
    } else if (filterUserIds === null) {
        setLoading(false);
        setChartData({ labels: [], datasets: [] });
        return;
    } else {
      q = query(simpatizantesRef);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const countsByDay = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.fechaRegistro && data.fechaRegistro.toDate) { // Check if it's a Firestore Timestamp
            const date = data.fechaRegistro.toDate();
            const day = date.toLocaleDateString('es-DO', {day: '2-digit', month: '2-digit', year: 'numeric'}); // Format DD/MM/YYYY
            countsByDay[day] = (countsByDay[day] || 0) + 1;
        }
      });

      // Sort labels chronologically (DD/MM/YYYY)
      const labels = Object.keys(countsByDay).sort((a, b) => {
          const [dayA, monthA, yearA] = a.split('/');
          const [dayB, monthB, yearB] = b.split('/');
          return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
      });
      const data = labels.map(label => countsByDay[label]);

      setChartData({
        labels: labels,
        datasets: [
          {
            label: filterUserIds ? 'Registros por Día (Equipo)' : 'Registros por Día (General)',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue color
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      });
      setLoading(false);
    }, (error) => {
        console.error("Error fetching daily chart data:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [filterUserIds]);

  // Define chartOptions completely here
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows setting height
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        // Set dynamic title directly
        text: filterUserIds ? 'Evolución Diaria (Equipo)' : 'Evolución Diaria (General)',
      },
    },
    scales: { // Optional: ensure Y-axis starts at 0
        y: {
            beginAtZero: true
        }
    }
  };

  return (
    // Added a container div to control chart height
    <div className="metric-card chart-card" style={{ height: '400px' }}>
      {loading ? <p>Generando gráfico...</p> : <Bar options={chartOptions} data={chartData} />}
    </div>
  );
}

export default RegistrationsByDayChart;
````

## File: src/components/charts/RegistrationsByZoneChart.js
````javascript
import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// PALETA EXTENDIDA (30 Colores Distintos)
// Diseñada para que zonas adyacentes tengan alto contraste
const ZONE_COLORS = [
  "#004d99", // 1. Azul Institucional (A1)
  "#FF6384", // 2. Rojo suave (A)
  "#36A2EB", // 3. Azul claro (B)
  "#FFCE56", // 4. Amarillo (C)
  "#4BC0C0", // 5. Turquesa (D)
  "#9966FF", // 6. Violeta (E)
  "#FF9F40", // 7. Naranja (F)
  "#C9CBCF", // 8. Gris (G)
  "#28a745", // 9. Verde Éxito (H)
  "#dc3545", // 10. Rojo Fuerte (I)
  "#6f42c1", // 11. Púrpura (J)
  "#e83e8c", // 12. Rosa (K)
  "#fd7e14", // 13. Naranja Intenso (L)
  "#20c997", // 14. Verde Azulado (M)
  "#17a2b8", // 15. Cian (N)
  "#6610f2", // 16. Índigo (O)
  "#343a40", // 17. Gris Oscuro (P)
  "#023e8a", // 18. Azul Marino (Q)
  "#0077b6", // 19. Azul Océano (R)
  "#0096c7", // 20. Azul Cielo (S)
  "#00b4d8", // 21. Azul Glaciar (T)
  "#48cae4", // 22. Azul Pálido (U)
  "#90e0ef", // 23. Hielo (W)
  "#588157", // 24. Verde Bosque (X)
  "#3a5a40", // 25. Verde Militar (Y)
  "#a3b18a", // 26. Verde Salvia (Z)
  "#dad7cd", // 27. Beige (Ñ)
  "#e63946", // Extra 1
  "#f1faee", // Extra 2
  "#a8dadc", // Extra 3
];

function RegistrationsByZoneChart({ filterUserIds }) {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const simpatizantesRef = collection(db, "simpatizantes");
    let q;

    if (filterUserIds && filterUserIds.length > 0) {
      q = query(simpatizantesRef, where("registradoPor", "in", filterUserIds));
    } else if (filterUserIds === null) {
      setLoading(false);
      return;
    } else {
      q = query(simpatizantesRef);
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const countsByZone = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const zona = data.zona || "Por Asignar";
          countsByZone[zona] = (countsByZone[zona] || 0) + 1;
        });

        const labels = Object.keys(countsByZone).sort(); // Orden alfabético (A, A1, B...)
        const data = labels.map((label) => countsByZone[label]);

        // Asignación cíclica de colores
        const backgroundColors = labels.map(
          (_, index) => ZONE_COLORS[index % ZONE_COLORS.length]
        );

        setChartData({
          labels: labels,
          datasets: [
            {
              label: filterUserIds ? "Tu Equipo" : "Total por Zona",
              data: data,
              backgroundColor: backgroundColors,
              borderColor: "#ffffff",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        });
        setLoading(false);
      },
      (error) => {
        console.error("Error cargando gráfica de zonas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filterUserIds]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Ocultamos la leyenda para limpiar la vista
      },
      title: {
        display: true,
        text: "Distribución por Zona Electoral",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ${context.label}: ${context.raw} inscritos`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="metric-card chart-card" style={{ height: "400px" }}>
      {loading ? (
        <p>Cargando zonas...</p>
      ) : (
        <Bar options={chartOptions} data={chartData} />
      )}
    </div>
  );
}

export default RegistrationsByZoneChart;
````

## File: src/components/dashboard/BottomNavBar.js
````javascript
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom"; // 1. IMPORTANTE: Agregamos useNavigate
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaSun,
  FaMoon,
  FaChevronRight,
} from "react-icons/fa";
import { useTheme } from "../../ThemeContext";
import { getVisibleNavItems } from "../../data/navConfig";

function BottomNavBar({ user, onSetGoalClick, onLogout }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Logout seguro
  const handleLogout = async () => {
    try {
      await onLogout(); // Esperamos a que Firebase cierre sesión
    } catch (error) {
      console.error("Error al salir:", error);
    } finally {
      navigate("/login"); // 4. Forzamos la redirección inmediata
    }
  };

  const allItems = getVisibleNavItems(user);
  const mainItems = allItems.slice(0, 3);
  const overflowItems = allItems.slice(3);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* MENÚ EXPANDIBLE */}
      <div className={`bottom-nav-expandable ${isMenuOpen ? "open" : ""}`}>
        <div className="expandable-overlay" onClick={closeMenu} />
        <div className="expandable-content">
          {overflowItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className="expandable-item"
              onClick={closeMenu}
            >
              <span className="expand-icon">
                <item.icon />
              </span>
              <span>{item.label}</span>
              <FaChevronRight
                style={{ marginLeft: "auto", opacity: 0.3, fontSize: "0.8rem" }}
              />
            </NavLink>
          ))}

          {overflowItems.length > 0 && <div className="expandable-divider" />}

          <button
            onClick={() => {
              toggleDarkMode();
              closeMenu();
            }}
            className="expandable-item"
          >
            <span className="expand-icon">
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </span>
            <span>{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>
          </button>

          {/* 5. USAMOS LA NUEVA FUNCIÓN AQUÍ */}
          <button onClick={handleLogout} className="expandable-item logout">
            <span className="expand-icon">
              <FaSignOutAlt />
            </span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* BARRA INFERIOR */}
      <nav className="bottom-nav-bar">
        {mainItems.map((item) => {
          if (item.id === "set-goal") {
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSetGoalClick();
                  closeMenu();
                }}
                className="nav-item action-button"
              >
                <item.icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={closeMenu}
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          onClick={toggleMenu}
          className={`nav-item ${isMenuOpen ? "active-menu" : ""}`}
        >
          {isMenuOpen ? (
            <FaTimes className="nav-icon" />
          ) : (
            <FaBars className="nav-icon" />
          )}
          <span className="nav-label">{isMenuOpen ? "Cerrar" : "Menú"}</span>
        </button>
      </nav>
    </>
  );
}

export default BottomNavBar;
````

## File: src/components/dashboard/Dashboard.js
````javascript
import React, { useState, useEffect, useMemo } from "react";

import MyTeam from "./MyTeam";
import TotalRegistrations from "./TotalRegistrations";
import RegistrationsByDayChart from "../charts/RegistrationsByDayChart";
import MyGoals from "./MyGoals";
import RegistrationsByZoneChart from "../charts/RegistrationsByZoneChart";
import MyReferralLink from "./MyReferralLink";
import MyRegisteredSimpatizantes from "./MyRegisteredSimpatizantes";
import PadronCoverageChart from "../charts/PadronCoverageChart";
import DashboardWelcome from "./DashboardWelcome";
import Loader from "../ui/Loader";
import { ROL_ADMIN, ROL_LIDER, ROL_MULTIPLICADOR } from "../../constants";

const Dashboard = ({ user }) => {
  // 1. Lógica de Datos (IDs relevantes para seguridad)
  const [relevantUserIds, setRelevantUserIds] = useState(undefined);

  useEffect(() => {
    if (!user) return;
    if (user.rol === ROL_LIDER) {
      setRelevantUserIds([user.uid, ...(user.multiplicadoresAsignados || [])]);
    } else if (user.rol === ROL_MULTIPLICADOR) {
      setRelevantUserIds([user.uid]);
    } else if (user.rol === ROL_ADMIN) {
      setRelevantUserIds(undefined); // undefined = ver todo (Admin)
    } else {
      setRelevantUserIds(null); // null = no ver nada (Seguridad)
    }
  }, [user]);

  // 2. Memorización de componentes estáticos
  const referralLinkSection = useMemo(
    () => <MyReferralLink key="link" user={user} />,
    [user]
  );
  const personalGoal = useMemo(
    () => <MyGoals key="goals" user={user} />,
    [user]
  );
  const myRegistrationsList = useMemo(
    () => <MyRegisteredSimpatizantes key="reg-list" user={user} />,
    [user]
  );

  // 3. Métricas Filtradas
  const filteredMetrics = useMemo(
    () => (
      <>
        <div className="metrics-grid">
          <TotalRegistrations filterUserIds={relevantUserIds} />

          {/* CORRECCIÓN: Solo el ADMIN ve la cobertura del Padrón */}
          {user.rol === ROL_ADMIN && <PadronCoverageChart />}
        </div>

        {/* Gráficos con filtro aplicado */}
        <div
          className="charts-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <RegistrationsByDayChart filterUserIds={relevantUserIds} />
          <RegistrationsByZoneChart filterUserIds={relevantUserIds} />
        </div>
      </>
    ),
    [relevantUserIds, user.rol]
  ); // Agregamos user.rol a dependencias

  if (!user) return <Loader message="Cargando datos..." />;

  return (
    <div className="dashboard-container-inner">
      {/* VISTA LÍDER DE ZONA */}
      {user.rol === ROL_LIDER && (
        <>
          <DashboardWelcome user={user} />
          {referralLinkSection}
          {personalGoal}
          {myRegistrationsList}
          <div className="dashboard-section-title">Métricas de mi Equipo</div>
          {filteredMetrics}
          <div className="dashboard-section-title">Mi Pelotón Asignado</div>
          <MyTeam user={user} />
        </>
      )}

      {/* VISTA ADMIN */}
      {user.rol === ROL_ADMIN && (
        <>
          <DashboardWelcome user={user} />
          {filteredMetrics}
        </>
      )}

      {/* VISTA MULTIPLICADOR */}
      {(user.rol === ROL_MULTIPLICADOR ||
        ![ROL_ADMIN, ROL_LIDER].includes(user.rol)) && (
        <>
          <DashboardWelcome user={user} />
          {referralLinkSection}
          {personalGoal}
          {myRegistrationsList}
          <div className="dashboard-section-title">Métricas Personales</div>
          {filteredMetrics}
        </>
      )}
    </div>
  );
};

export default Dashboard;
````

## File: src/components/dashboard/DashboardSidebar.js
````javascript
import React from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../../ThemeContext";
import { FaBars, FaTimes, FaSignOutAlt, FaSun, FaMoon } from "react-icons/fa";
import { getVisibleNavItems } from "../../data/navConfig";

function DashboardSidebar({
  user,
  onSetGoalClick,
  onLogout,
  isCollapsed,
  onToggleSidebar,
}) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Obtener ítems según el rol
  const visibleNavItems = getVisibleNavItems(user);

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* --- HEADER --- */}
      <div className="sidebar-header">
        <h3>{isCollapsed ? "" : "Menú"}</h3>
        <button
          onClick={onToggleSidebar}
          className="toggle-button"
          aria-label="Alternar barra lateral"
        >
          {isCollapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      {/* --- MENU LIST --- */}
      <ul className="sidebar-menu">
        {visibleNavItems.map((item) => {
          const IconComponent = item.icon;

          // Identificar si es la raíz del dashboard para usar 'end'
          const isDashboardHome = item.path === "/dashboard";

          // Renderizar enlace de navegación
          if (!item.isAction) {
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={isDashboardHome} // evita el doble resaltado
                  className={({ isActive }) => (isActive ? "active" : "")}
                  title={isCollapsed ? item.label : ""}
                >
                  <IconComponent />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          }

          // 2. Renderizar Botón de Acción (ej. Meta)
          if (item.isAction && item.id === "meta") {
            return (
              <li key={item.id}>
                <button
                  onClick={onSetGoalClick}
                  className="sidebar-action-button"
                  title={isCollapsed ? item.label : ""}
                >
                  <IconComponent />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          }
          return null;
        })}
      </ul>

      {/* --- FOOTER --- */}
      <div className="sidebar-footer">
        <button
          onClick={toggleDarkMode}
          className="theme-toggle-button"
          title={isCollapsed ? "Cambiar Tema" : ""}
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
          {!isCollapsed && (
            <span>{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>
          )}
        </button>

        <button
          onClick={onLogout}
          className="logout-button-sidebar"
          title={isCollapsed ? "Cerrar Sesión" : ""}
        >
          <FaSignOutAlt />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}

export default DashboardSidebar;
````

## File: src/components/dashboard/DashboardWelcome.js
````javascript
import React from "react";
import AvatarFoto from "../ui/AvatarFoto";

// Encabezado de bienvenida del dashboard (avatar + saludo + rol).
// Reutilizado por las vistas de líder de zona, admin y multiplicador.
const DashboardWelcome = ({ user }) => (
  <div
    className="dashboard-welcome-row"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginBottom: "20px",
    }}
  >
    <AvatarFoto
      cedula={user.cedula}
      nombre={user.nombre}
      size="60px"
      allowReport={true} // Activa el botón de WhatsApp
    />
    <div>
      <h1 style={{ margin: 0 }}>¡Bienvenido, {user.nombre.split(" ")[0]}!</h1>
      <small style={{ color: "#666" }}>{user.rol}</small>
    </div>
  </div>
);

export default DashboardWelcome;
````

## File: src/components/dashboard/MyGoals.js
````javascript
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const getStartOfWeek = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(start.setDate(diff));
};

const getStartOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

function MyGoals({ user }) {
  const [myRegistrations, setMyRegistrations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Estado para guardar errores

  const goal = user.goal || { amount: 50, period: 'mensual' }; 

  useEffect(() => {
    if (!user) return;
    
    const now = new Date();
    const startDate = goal.period === 'semanal' ? getStartOfWeek(now) : getStartOfMonth(now);
    
    const q = query(
      collection(db, "simpatizantes"), 
      where("registradoPor", "==", user.uid),
      where("fechaRegistro", ">=", startDate)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        // Callback de éxito
        setMyRegistrations(snapshot.size);
        setLoading(false);
      }, 
      (err) => {
        // Callback de error
        console.error("Error al obtener metas:", err);
        setError("No se pudieron cargar las metas. Es posible que falte un índice en la base de datos.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, goal.period]);

  const progressPercentage = goal.amount > 0 ? (myRegistrations / goal.amount) * 100 : 0;

  if (error) {
    return <div className="metric-card"><p style={{ color: 'red' }}>{error}</p></div>
  }

  return (
    <div className="metric-card goal-card">
      <h3>Meta de Registros ({goal.period.charAt(0).toUpperCase() + goal.period.slice(1)})</h3>
      {loading ? (
        <p className="metric-value">...</p>
      ) : (
        <div>
          <p className="metric-value">{myRegistrations} / {goal.amount}</p>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="progress-text">{Math.round(progressPercentage)}% completado</p>
        </div>
      )}
    </div>
  );
}

export default MyGoals;
````

## File: src/components/dashboard/MyReferralLink.js
````javascript
import React, { useState } from 'react';

function MyReferralLink({ user }) {
  // Construimos la URL completa usando window.location.origin para la base
  const referralLink = `${window.location.origin}/registro?ref=${user.uid}`;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    // navigator.clipboard solo funciona en contextos seguros (HTTPS o localhost)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000); // Mensaje dura 2 segundos
        })
        .catch(err => {
          console.error('Error al copiar el enlace: ', err);
          alert('No se pudo copiar el enlace automáticamente. Cópialo manualmente.');
        });
    } else {
      // Fallback para entornos no seguros (aunque raro en desarrollo)
      alert('La función de copiar no está disponible en este navegador/contexto. Cópialo manualmente.');
    }
  };

  return (
    <div className="referral-link-container">
      <h3>Tu Enlace Personal de Referido</h3>
      <p>Comparte este enlace para que los nuevos simpatizantes queden registrados bajo tu perfil:</p>
      <div className="link-box">
        {/* Usamos un input de solo lectura para mostrar el enlace */}
        <input type="text" value={referralLink} readOnly />
        <button onClick={copyToClipboard} disabled={copied}>
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

export default MyReferralLink;
````

## File: src/components/dashboard/MyTeam.js
````javascript
import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import AvatarFoto from "../ui/AvatarFoto";
import { ROL_LIDER } from "../../constants";

function MyTeam({ user }) {
  const [teamMembersWithMetrics, setTeamMembersWithMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.rol !== ROL_LIDER) {
      setLoading(false);
      setTeamMembersWithMetrics([]);
      return;
    }

    const teamQuery = query(
      collection(db, "users"),
      where("liderAsignado", "==", user.uid)
    );

    const unsubscribeTeam = onSnapshot(
      teamQuery,
      async (teamSnapshot) => {
        let membersData = teamSnapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.id,
          ...doc.data(),
        }));
        const memberIds = membersData.map((member) => member.uid);

        if (memberIds.length === 0) {
          setTeamMembersWithMetrics([]);
          setLoading(false);
          return;
        }

        try {
          const simpatizantesQuery = query(
            collection(db, "simpatizantes"),
            where("registradoPor", "in", memberIds)
          );
          const simpatizantesSnapshot = await getDocs(simpatizantesQuery);
          const registrationCounts = {};

          simpatizantesSnapshot.forEach((doc) => {
            const registeredBy = doc.data().registradoPor;
            registrationCounts[registeredBy] =
              (registrationCounts[registeredBy] || 0) + 1;
          });

          const membersWithMetrics = membersData.map((member) => ({
            ...member,
            registrationCount: registrationCounts[member.uid] || 0,
          }));

          setTeamMembersWithMetrics(membersWithMetrics);
        } catch (error) {
          console.error(
            "Error al obtener las métricas de los simpatizantes:",
            error
          );
          setTeamMembersWithMetrics(
            membersData.map((m) => ({ ...m, registrationCount: "Error" }))
          );
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error al obtener los miembros del equipo:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeTeam();
    };
  }, [user]);

  // FUNCIÓN DE EXPORTACIÓN A EXCEL
  const handleExport = () => {
    if (teamMembersWithMetrics.length === 0) {
      alert("No hay miembros del equipo para exportar.");
      return;
    }
    
    const dataToExport = teamMembersWithMetrics.map((member) => ({
      Nombre: member.nombre || "N/A",
      Cedula: member.cedula || "N/A",
      Email: member.email || "N/A",
      Rol: member.rol || "N/A",
      Registros: member.registrationCount || 0,
    })); 

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MiEquipo");

    const fileName = `Mi_Peloton_${user.nombre.replace(/\s/g, "_")}_${new Date()
      .toLocaleDateString("es-DO")
      .replace(/\//g, "-")}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    alert(
      `Se han exportado ${teamMembersWithMetrics.length} miembros del equipo.`
    );
  };
  
  if (loading) {
    return <p>Cargando información del peloton...</p>;
  }

  if (user.rol !== ROL_LIDER) {
    return (
      <div className="my-team-container">
        <p>Esta sección solo está disponible para líderes de zona.</p>
      </div>
    );
  }

  return (
    <div className="my-team-container glass-panel">
      {/* Botón de Exportar */}
      {teamMembersWithMetrics.length > 0 && (
        <div className="team-actions-bar">
          <p className="team-size">
            Miembros del Pelotón: <strong>{teamMembersWithMetrics.length}</strong>
          </p>
          <button
            onClick={handleExport}
            className="export-excel-button team-export-button"
            disabled={loading}
          >
            Exportar a Excel
          </button>
        </div>
      )}
      
      {/* Tabla del Equipo */}
      {teamMembersWithMetrics.length > 0 ? (
        <div className="table-wrapper">
          <table className="team-table">
            <thead>
              <tr>
                <th>Foto</th> {/* Nueva Columna */}
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Registros</th>
              </tr>
            </thead>
            <tbody>
              {teamMembersWithMetrics.map((member) => (
                <tr key={member.id}>
                  {/* Célula de Foto */}
                  <td style={{ width: '50px' }}>
                    <AvatarFoto 
                        cedula={member.cedula} 
                        nombre={member.nombre} 
                        size="40px" 
                    />
                  </td>

                  <td>
                    <div style={{fontWeight: '600'}}>{member.nombre}</div>
                    {member.cedula ? (
                        <small style={{color: '#666'}}>{member.cedula}</small>
                    ) : (
                        <small style={{color: '#e63946'}}>Sin Cédula</small>
                    )}
                  </td>

                  <td>{member.email}</td>
                  <td>
                    <span className={`role-badge role-${member.rol?.replace(/\s+/g, '-')}`}>
                        {member.rol}
                    </span>
                  </td>
                  <td>
                    <div className="count-badge">{member.registrationCount}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        user.rol === ROL_LIDER && (
          <p className="empty-team-message">
            Aún no tienes soldados asignados a tu peloton.
          </p>
        )
      )}
    </div>
  );
}

export default MyTeam;
````

## File: src/components/dashboard/SetGoalModal.js
````javascript
import React, { useState } from 'react';
// Reutilizaremos los estilos de la otra modal para mantener la consistencia

function SetGoalModal({ user, onClose, onSave }) {
  // Leemos la meta actual del usuario o ponemos valores por defecto
  const [goalAmount, setGoalAmount] = useState(user.goal?.amount || 50);
  const [goalPeriod, setGoalPeriod] = useState(user.goal?.period || 'mensual');

  const handleSave = () => {
    // Validamos que el número sea válido
    if (isNaN(goalAmount) || goalAmount <= 0) {
      alert("Por favor, ingresa un número válido para tu meta.");
      return;
    }
    // Llamamos a la función de guardado y le pasamos los nuevos valores
    onSave({
      amount: parseInt(goalAmount, 10), // Nos aseguramos de que sea un número
      period: goalPeriod
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Establecer Mi Meta</h2>
        <p>Define tu objetivo de registros para motivar tu trabajo.</p>
        
        <div className="input-group">
          <label htmlFor="goalAmount">Número de Simpatizantes a Registrar</label>
          <input 
            type="number" 
            id="goalAmount" 
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="goalPeriod">Período de la Meta</label>
          <select id="goalPeriod" value={goalPeriod} onChange={(e) => setGoalPeriod(e.target.value)}>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>

        <div className="modal-actions">
          <button onClick={handleSave} className="save-button">Guardar Meta</button>
          <button onClick={onClose} className="cancel-button">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default SetGoalModal;
````

## File: src/components/dashboard/TotalRegistrations.js
````javascript
import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
// 1. Importamos getCountFromServer
import {
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";

function TotalRegistrations({ filterUserIds }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función asíncrona para pedir el conteo
    const fetchCount = async () => {
      setLoading(true);
      try {
        const simpatizantesRef = collection(db, "simpatizantes");
        let q;

        if (filterUserIds && filterUserIds.length > 0) {
          // Nota: Firestore limita el operador 'in' a un máximo de 10-30 valores.
          // Si un líder tiene más de 30 multiplicadores, esto podría requerir otra estrategia.
          q = query(
            simpatizantesRef,
            where("registradoPor", "in", filterUserIds)
          );
        } else if (filterUserIds === null) {
          setCount(0);
          setLoading(false);
          return;
        } else {
          // Admin: Cuenta toda la colección sin descargar los documentos
          q = query(simpatizantesRef);
        }

        // 2. Usamos la función optimizada
        const snapshot = await getCountFromServer(q);
        setCount(snapshot.data().count);
      } catch (error) {
        console.error("Error obteniendo conteo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    // Nota: Ya no hay 'unsubscribe' porque no es una conexión en vivo
  }, [filterUserIds]);

  return (
    <div className="metric-card">
      <h3>
        {filterUserIds ? "Registros (Equipo)" : "Total Registros (General)"}
      </h3>
      {loading ? (
        <p className="metric-value">Calculando...</p>
      ) : (
        <p className="metric-value">{count}</p>
      )}
    </div>
  );
}

export default TotalRegistrations;
````

## File: src/components/pages/Home.js
````javascript
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
````

## File: src/components/pages/NotFound.js
````javascript
import React from "react";
import { Link } from "react-router-dom";

// Página 404. Se renderiza dentro de PublicLayout, por lo que hereda
// Navbar y Footer del sitio público.
const NotFound = () => (
  <div className="not-found-page" style={{ textAlign: "center", padding: "60px 20px" }}>
    <h1 style={{ fontSize: "4rem", margin: 0 }}>404</h1>
    <h2 style={{ marginTop: "10px" }}>Página no encontrada</h2>
    <p style={{ color: "#666", marginBottom: "24px" }}>
      La página que buscas no existe o fue movida.
    </p>
    <Link to="/" className="back-button">
      Volver al inicio
    </Link>
  </div>
);

export default NotFound;
````

## File: src/components/pages/Propuestas.js
````javascript
import React from "react";
import {
  FaGraduationCap,
  FaHeart,
  FaUserShield,
  FaCrosshairs,
} from "react-icons/fa";

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
````

## File: src/components/pages/UserProfile.js
````javascript
import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import AvatarFoto from "../ui/AvatarFoto";
import { auth } from "../../firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { FaEnvelope, FaIdBadge, FaLock, FaCheckCircle, FaTimes } from "react-icons/fa";

const INITIAL_FORM = { currentPassword: "", newPassword: "" };
const INITIAL_STATUS = { type: "", message: "" };

const UserProfile = () => {
    const { user } = useAuth();
    const [form, setForm] = useState(INITIAL_FORM);
    const [status, setStatus] = useState(INITIAL_STATUS);
    const [isChanging, setIsChanging] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleInput = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);

    const openModal = useCallback(() => {
        setForm(INITIAL_FORM);
        setStatus(INITIAL_STATUS);
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        if (isChanging) return; // evita cerrar mientras procesa
        setShowModal(false);
    }, [isChanging]);

    const handleChangePassword = useCallback(async (e) => {
        e.preventDefault();
        setIsChanging(true);
        setStatus(INITIAL_STATUS);
        try {
            const firebaseUser = auth.currentUser;
            const credential = EmailAuthProvider.credential(firebaseUser.email, form.currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, form.newPassword);
            setStatus({ type: "success", message: "¡Contraseña actualizada con éxito!" });
            setForm(INITIAL_FORM);
        } catch (error) {
            console.error(error);
            setStatus({
                type: "error",
                message: "Error: Verifica tu contraseña actual o intenta cerrar sesión y volver a entrar.",
            });
        } finally {
            setIsChanging(false);
        }
    }, [form]);

    // Cerrar con tecla Escape
    useEffect(() => {
        if (!showModal) return;
        const onKey = (e) => e.key === "Escape" && closeModal();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showModal, closeModal]);

    if (!user) return <div className="loading">Cargando perfil...</div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <AvatarFoto cedula={user.cedula} nombre={user.nombre} size="120px" allowReport />
                    <h2>{user.nombre || "Usuario"}</h2>
                    <span className="badge-rol">{user.rol || "Activista"}</span>
                </div>

                <div className="profile-info">
                    <div className="info-item">
                        <FaEnvelope className="icon" />
                        <div>
                            <label>Correo Electrónico</label>
                            <p>{user.email}</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <FaIdBadge className="icon" />
                        <div>
                            <label>Cédula</label>
                            <p>{user.cedula || "No registrada"}</p>
                        </div>
                    </div>
                </div>

                <hr />

                <div className="profile-settings">
                    <button type="button" className="btn-change-password" onClick={openModal}>
                        <FaLock /> Cambiar Contraseña
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-close"
                            onClick={closeModal}
                            disabled={isChanging}
                            aria-label="Cerrar"
                        >
                            <FaTimes />
                        </button>

                        <h3 id="modal-title"><FaLock /> Cambiar Contraseña</h3>

                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <input
                                    type="password"
                                    name="currentPassword"
                                    placeholder="Contraseña Actual"
                                    value={form.currentPassword}
                                    onChange={handleInput}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    name="newPassword"
                                    placeholder="Nueva Contraseña"
                                    value={form.newPassword}
                                    onChange={handleInput}
                                    required
                                    minLength="6"
                                />
                            </div>
                            {status.message && (
                                <div className={`status-msg ${status.type}`}>
                                    {status.type === "success" && <FaCheckCircle />} {status.message}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={closeModal} disabled={isChanging}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isChanging} className="btn-save">
                                    {isChanging ? "Procesando..." : "Actualizar Contraseña"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
````

## File: src/components/pages/ZonasElectorales.js
````javascript
/**
 * MAPA ELECTORAL COMPLETO
 * Estructura de datos extraída del listado de carpetas (tree /f /a).
 * Incluye Zonas, Centros de Votación (Colegios) y los archivos de Padrón asociados.
 * Utilizar para filtros de asignación y referenciación de documentos.
 */

// 1. LISTA SIMPLE DE ZONAS (Para Selectores de Nivel Zonal)
export const ZONAS_DISPONIBLES = [
    "ZONA A1", "ZONA A", "ZONA B", "ZONA C", "ZONA D", "ZONA E", 
    "ZONA F", "ZONA G", "ZONA H", "ZONA I", "ZONA J", "ZONA K", 
    "ZONA L", "ZONA M", "ZONA N", "ZONA O", "ZONA P", "ZONA Q", 
    "ZONA R", "ZONA S", "ZONA T", "ZONA U", "ZONA W", "ZONA X", 
    "ZONA Y", "ZONA Z", "ZONA Ñ"
];

// 2. MAPEO DETALLADO DE ZONAS A SUS CENTROS (Colegios/Sectores)
// Estructura: { [Zona]: [Centro1, Centro2, ...] }
export const MAPA_CENTROS_POR_ZONA = {
    "ZONA A1": [
        "00457 - CENTRO COMUNAL EL CAFÉ", 
        "00512 - ESCUELA BASICA CAFÉ CON LECHE", 
        "00545 - LICEO CARMEN LUISA DE LOS SANTOS"
    ],
    "ZONA A": [
        "00305 - ESC. PRIM. INT. RAFAELA SANTAELLA", 
        "00520 - COLEGIO EVANGELICO SHALOM"
    ],
    "ZONA B": [
        "00260 - CLINICA DIAZ PIÑEYRO", 
        "00261 - ESC. P. NTRA. SRA. DE LA ALTAGRACIA", 
        "00262 - PARROQUIA NTRA.SRA. DE LA ALTAGRACIA",
        "00417 - CENTRO DE ESTUDIOS PENIEL", 
        "00458 - COLEGIO MAXIMO GOMEZ", 
        "00517 - SALON PARROQUIAL", 
        "00523 - POLITECNICO TURISTICO CENTRO PARROQUIAL SANTO SOCORRO"
    ],
    "ZONA C": [
        "00357 - ESC. PRIM. E INTERMEDIA ESTEBAN MARTINEZ", 
        "00488 - ESCUELA PRIMARIA VILLA NAZARET", 
        "00498 - COLEGIO GREGORIO LUPERON"
    ],
    "ZONA D": [
        "00306 - ESCUELA CAMILA HENRIQUEZ", 
        "00522 - CENTRO DE ESTUDIO HUERTO DEL EDEN"
    ],
    "ZONA E": [
        "00264 - COLEGIO AMERICO LUGO", 
        "00354 - COLEGIO EL BUEN PASTOR", 
        "00355 - COLEGIO HORA DE DIOS",
        "00500 - COLEGIO ADVENTISTA BETEL", 
        "00535 - ESCUELA PRIMARIA LOS AMIGUITOS"
    ],
    "ZONA F": [
        "00366 - ESCUELA PRIMARIA NICOLAS UREÑA DE MENDOZA", 
        "00428 - ESCUELA DOÑA FILOMENA CANALDA"
    ],
    "ZONA G": [
        "00353 - HOSPITAL ZONA NORTE", 
        "00363 - ESCUELA PRIMARIA DUARTE", 
        "00430 - ESCUELA PRIMARIA RENOVACION", 
        "00479 - CENTRO DE ESTUDIO PROGRESO"
    ],
    "ZONA H": [
        "00360 - ESCUELA BASICA ANTIGUA Y BARBADOS", 
        "00508 - ESCUELA PRIMARIA MADRE TERESA DE CALCUTA"
    ],
    "ZONA I": [
        "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO", 
        "00359 - ESC. PRIMARIA INICIAL Y BASICA BARBADOS", 
        "00431 - ESCUELA PUBLICA LAS MERCEDES", 
        "00456 - COLEGIO PSICOEDUCATIVO GESTSMANI"
    ],
    "ZONA J": [
        "00370 - POLITECNICO DE LAS CAOBAS", 
        "00477 - UNIVERSIDAD ODONTOLOGICA DOMINICANA", 
        "00519 - CENTRO EDUCATIVO LOS OLIVOS FE Y ALEGRIA"
    ],
    "ZONA K": [
        "00307 - ESCUELA BASICA LIC. CRISTOBALINA BATISTA TAVARES", 
        "00416 - ESCUELA BASICA CURAZAO", 
        "00459 - UNIVERSIDAD UTESA", 
        "00460 - UNIV. FEDERICO HENRIQUEZ. Y CARVAJAL",
        "00529 - COLEGIO SAN ANTON", 
        "00546 - LICEO PEDRO APONTE"
    ],
    "ZONA L": [
        "00369 - ESCUELA DE EDUCACION BASICA SAN MIGUEL", 
        "00435 - LICEO SECUNDARIO LAS AMERICAS", 
        "00490 - ESCUELA BASICA JAPON"
    ],
    "ZONA M": [
        "00365 - ESCUELA BASICA JAMAICA", 
        "00511 - CENTRO EDUC. INDEPENDENCIA", 
        "00542 - ESCUELA BASICA NUESTRA SEÑORA DE LAS MERCEDES", 
        "00544 - LICEO ADELAIDA ACOSTA"
    ],
    "ZONA N": [
        "00364 - CENTRO EDUCATIVO ROSA EVANGELINA SOLANO", 
        "00502 - ESCUELA PRIMARIA ELIZARDO TAMAREZ SANTAMARIA", 
        "00538 - LICEO PROFESOR VICTOR PASCUAL AGUERO", 
        "00541 - ESCUELA BASICA CONCEPCION BONA"
    ],
    "ZONA O": [
        "00367 - MANOGUAYABO", 
        "00435 - LICEO SECUNDARIO LAS AMERICAS", 
        "00516 - COLEGIO INFANTIL LOS QUERUBINES", 
        "00525 - COLEGIO TRAZO DE COLORES"
    ],
    "ZONA P": [
        "00001 - COLEGIO EL ANGEL", 
        "00356 - COLEGIO JUAN 23", 
        "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO"
    ],
    "ZONA Q": [
        "00425 - ESCUELA BASICA LAS PALMAS #1", 
        "00487 - ESCUELA VEDRUNA", 
        "00492 - COLEGIO SANTA MARIA", 
        "00524 - CLUB ESCUELA BASICA FRANCISCO A. CAAMAÑO"
    ],
    "ZONA R": [
        "00361 - ESCUELA ING. AGR. IVAN GUZMAN K", 
        "00455 - EXTENSION DE LA UASD", 
        "00515 - HOSPITAL MUNICIPAL DE ENGOMBE"
    ],
    "ZONA S": [
        "00362 - ESCUELA PRIMARIA BUENOS AIRES", 
        "00454 - CLUB 16 DE AGOSTO", 
        "00543 - ESCUELA PROFESOR JUAN BOSCH GAVIÑO"
    ],
    "ZONA T": [
        "00338 - COMEDOR ECONOMICO", 
        "00476 - ASOCIACION DE IMPEDIDO FISICO MOTORES", 
        "00526 - POLITECNICO MADRE RAFAELA IBARRA"
    ],
    "ZONA U": [
        "00513 - ESCUELA BASICA HERMANAS MIRABAL"
    ],
    "ZONA W": [
        "00518 - PROYECTO DESARROLLO COMUNITARIO INTEGRAL", 
        "00534 - SALON MULTIUSO EL ABANICO"
    ],
    "ZONA X": [
        "00510 - ESCUELA DE EDUCACION BASICA PROF. JUAN GABINO"
    ],
    "ZONA Y": [
        "00474 - ESCUELA PRIMARI ERCILIA PEPIN BATEY BIENVENIDO"
    ],
    "ZONA Z": [
        "00368 - CENTRO EDUCATIVO ALBERTO PEREZ Y SANTIAGO"
    ],
    "ZONA Ñ": [
        "00308 - SINDICATO UNIDO DE TRAB. PORTUARIO", 
        "00453 - ESCUELA PADRE MARTIN EGUSQUIZA"
    ]
};

// 3. MAPEO COMPLETO DE CENTROS A SUS ARCHIVOS PDF (Padrón Electoral)
// Estructura: { [Centro de Votación]: [Archivo1.pdf, Archivo2.pdf, ...] }
export const MAPA_PADRON_POR_CENTRO = {
    // --- ZONA A1 ---
    "00457 - CENTRO COMUNAL EL CAFÉ": ["1312A.pdf", "1644.pdf", "1690.pdf", "1738.pdf", "1788.pdf", "1846.pdf", "1866.pdf"],
    "00512 - ESCUELA BASICA CAFÉ CON LECHE": ["1746.pdf", "1795.pdf", "1838.pdf", "1881.pdf"],
    "00545 - LICEO CARMEN LUISA DE LOS SANTOS": ["1260.pdf", "1260A.pdf", "1260B.pdf", "1260C.pdf", "1261.pdf", "1261A.pdf", "1312.pdf"],
    // --- ZONA A ---
    "00305 - ESC. PRIM. INT. RAFAELA SANTAELLA": ["1256.pdf", "1256A.pdf", "1256B.pdf", "1256C.pdf", "1256D.pdf", "1256E.pdf", "1259.pdf", "1259A.pdf", "1259B.pdf", "1259C.pdf"],
    "00520 - COLEGIO EVANGELICO SHALOM": ["1798.pdf", "1827.pdf", "1885.pdf", "1912.pdf"],
    // --- ZONA B ---
    "00260 - CLINICA DIAZ PIÑEYRO": ["1250.pdf", "1250A.pdf", "1250B.pdf"],
    "00261 - ESC. P. NTRA. SRA. DE LA ALTAGRACIA": ["1252.pdf", "1252A.pdf", "1252B.pdf", "1252C.pdf", "1252D.pdf", "1254.pdf", "1254A.pdf", "1254B.pdf", "1255.pdf", "1255A.pdf", "1255B.pdf", "1311.pdf", "1311A.pdf", "1311B.pdf", "1334.pdf", "1334A.pdf", "1334B.pdf", "1643.pdf", "1643A.pdf", "1643B.pdf"],
    "00262 - PARROQUIA NTRA.SRA. DE LA ALTAGRACIA": ["1251.pdf", "1251A.pdf", "1251B.pdf"],
    "00417 - CENTRO DE ESTUDIOS PENIEL": ["1380.pdf", "1380A.pdf", "1380B.pdf", "1380C.pdf", "1821.pdf", "1861.pdf"],
    "00458 - COLEGIO MAXIMO GOMEZ": ["1691.pdf", "1764.pdf", "1789.pdf", "1823.pdf", "1867.pdf"],
    "00517 - SALON PARROQUIAL": ["1778.pdf", "1883.pdf"],
    "00523 - POLITECNICO TURISTICO CENTRO PARROQUIAL SANTO SOCORRO": ["1253.pdf", "1253A.pdf", "1801.pdf"],
    // --- ZONA C ---
    "00357 - ESC. PRIM. E INTERMEDIA ESTEBAN MARTINEZ": ["1241.pdf", "1241A.pdf", "1241B.pdf", "1242.pdf", "1242A.pdf", "1242B.pdf", "1640.pdf", "1751.pdf", "1844.pdf", "1850.pdf"],
    "00488 - ESCUELA PRIMARIA VILLA NAZARET": ["1699.pdf", "1716.pdf", "1770.pdf", "1842.pdf", "1872.pdf"],
    "00498 - COLEGIO GREGORIO LUPERON": ["1719.pdf", "1773.pdf", "1876.pdf"],
    // --- ZONA D ---
    "00306 - ESCUELA CAMILA HENRIQUEZ": ["1258.pdf", "1258A.pdf", "1258B.pdf", "1258C.pdf", "1258D.pdf", "1258E.pdf", "1258F.pdf", "1646.pdf", "1646A.pdf", "1816.pdf"],
    "00522 - CENTRO DE ESTUDIO HUERTO DEL EDEN": ["1726.pdf", "1800.pdf", "1886.pdf"],
    // --- ZONA E ---
    "00264 - COLEGIO AMERICO LUGO": ["1244.pdf", "1244A.pdf", "1244B.pdf", "1244C.pdf", "1245.pdf", "1245A.pdf"],
    "00354 - COLEGIO EL BUEN PASTOR": ["1238.pdf", "1238A.pdf", "1238B.pdf", "1239.pdf", "1239A.pdf", "1239B.pdf"],
    "00355 - COLEGIO HORA DE DIOS": ["1240.pdf", "1240A.pdf", "1240B.pdf", "1308.pdf", "1308A.pdf", "1308B.pdf", "1750.pdf", "1817.pdf"],
    "00500 - COLEGIO ADVENTISTA BETEL": ["1721.pdf", "1774.pdf", "1826.pdf", "1877.pdf"],
    "00535 - ESCUELA PRIMARIA LOS AMIGUITOS": ["1720.pdf", "1735.pdf"],
    // --- ZONA F ---
    "00366 - ESCUELA PRIMARIA NICOLAS UREÑA DE MENDOZA": ["1217.pdf", "1217A.pdf", "1218.pdf", "1218A.pdf", "1218B.pdf", "1632.pdf", "1722.pdf", "1756.pdf", "1757.pdf", "1831.pdf", "1857.pdf"],
    "00428 - ESCUELA DOÑA FILOMENA CANALDA": ["1364.pdf", "1364A.pdf", "1364B.pdf", "1783.pdf", "1862.pdf"],
    // --- ZONA G ---
    "00353 - HOSPITAL ZONA NORTE": ["1275.pdf", "1275A.pdf", "1275B.pdf", "1275C.pdf", "1345B.pdf", "1639.pdf", "1807.pdf", "1818.pdf", "1854.pdf"],
    "00363 - ESCUELA PRIMARIA DUARTE": ["1232.pdf", "1232A.pdf", "1232B.pdf", "1233.pdf", "1233A.pdf", "1345.pdf", "1345A.pdf"],
    "00430 - ESCUELA PRIMARIA RENOVACION": ["1247.pdf", "1247A.pdf", "1248.pdf", "1248A.pdf", "1248B.pdf", "1642.pdf"],
    "00479 - CENTRO DE ESTUDIO PROGRESO": ["1680.pdf", "1792.pdf"],
    // --- ZONA H ---
    "00360 - ESCUELA BASICA ANTIGUA Y BARBADOS": ["1431.pdf", "1431A.pdf", "1431B.pdf", "1752.pdf", "1852.pdf", "1900.pdf"],
    "00508 - ESCUELA PRIMARIA MADRE TERESA DE CALCUTA": ["1729.pdf", "1776.pdf"],
    // --- ZONA I ---
    "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO": ["1306.pdf", "1306A.pdf", "1307.pdf", "1307A.pdf", "1333.pdf", "1333A.pdf", "1333B.pdf", "1357.pdf", "1357A.pdf", "1357B.pdf", "1391.pdf", "1391A.pdf", "1418.pdf", "1418A.pdf", "1418B.pdf", "1635.pdf", "1635A.pdf", "1636.pdf", "1636A.pdf", "1637.pdf"],
    "00359 - ESC. PRIMARIA INICIAL Y BASICA BARBADOS": ["1228.pdf", "1228A.pdf", "1228B.pdf", "1229.pdf", "1229A.pdf", "1229B.pdf", "1634.pdf", "1634A.pdf", "1781.pdf", "1851.pdf"],
    "00431 - ESCUELA PUBLICA LAS MERCEDES": ["1226.pdf", "1226A.pdf", "1227.pdf", "1227A.pdf", "1227B.pdf", "1230.pdf", "1230A.pdf", "1230B.pdf", "1784.pdf", "1813.pdf"],
    "00456 - COLEGIO PSICOEDUCATIVO GESTSMANI": ["1689.pdf", "1822.pdf"],
    // --- ZONA J ---
    "00370 - POLITECNICO DE LAS CAOBAS": ["1271.pdf", "1271A.pdf", "1271B.pdf", "1271C.pdf", "1271D.pdf", "1271E.pdf", "1271F.pdf", "1272.pdf", "1272A.pdf", "1272B.pdf", "1272C.pdf", "1272D.pdf", "1273.pdf", "1273A.pdf", "1274.pdf", "1274A.pdf", "1274B.pdf"],
    "00477 - UNIVERSIDAD ODONTOLOGICA DOMINICANA": ["1697.pdf", "1768.pdf", "1871.pdf"],
    "00519 - CENTRO EDUCATIVO LOS OLIVOS FE Y ALEGRIA": ["1797.pdf", "1884.pdf", "1911.pdf"],
    // --- ZONA K ---
    "00307 - ESCUELA BASICA LIC. CRISTOBALINA BATISTA TAVARES": ["1249.pdf", "1249A.pdf", "1249B.pdf", "1267.pdf", "1267A.pdf", "1267B.pdf", "1267C.pdf", "1310.pdf", "1310A.pdf", "1362B.pdf"],
    "00416 - ESCUELA BASICA CURAZAO": ["1677.pdf", "1677A.pdf", "1677B.pdf", "1742.pdf", "1761.pdf", "1820.pdf", "1860.pdf", "1905.pdf"],
    "00459 - UNIVERSIDAD UTESA": ["1688.pdf", "1743.pdf", "1765.pdf", "1790.pdf", "1824.pdf", "1868.pdf", "1906.pdf"],
    "00460 - UNIV. FEDERICO HENRIQUEZ. Y CARVAJAL": ["1641A.pdf", "1641B.pdf", "1687.pdf", "1791.pdf", "1869.pdf"],
    "00529 - COLEGIO SAN ANTON": ["1814.pdf", "1891.pdf"],
    "00546 - LICEO PEDRO APONTE": ["1243.pdf", "1243A.pdf", "1243B.pdf", "1243C.pdf", "1243D.pdf", "1245B.pdf", "1246.pdf", "1246A.pdf", "1310B.pdf", "1362.pdf", "1362A.pdf", "1641.pdf", "1749.pdf"],
    // --- ZONA L ---
    "00369 - ESCUELA DE EDUCACION BASICA SAN MIGUEL": ["1631.pdf", "1701.pdf", "1741.pdf", "1760.pdf", "1819.pdf", "1859.pdf", "1904.pdf"],

    "00490 - ESCUELA BASICA JAPON": ["1703.pdf", "1734.pdf", "1744.pdf", "1771.pdf", "1811.pdf", "1841.pdf", "1874.pdf", "1907.pdf"],
    // --- ZONA M ---
    "00365 - ESCUELA BASICA JAMAICA": ["1215.pdf", "1215A.pdf", "1630.pdf", "1902.pdf"],
    "00511 - CENTRO EDUC. INDEPENDENCIA": ["1745.pdf", "1880.pdf"],
    "00542 - ESCUELA BASICA NUESTRA SEÑORA DE LAS MERCEDES": ["1829.pdf"],
    "00544 - LICEO ADELAIDA ACOSTA": ["1320.pdf", "1320A.pdf", "1320B.pdf", "1702.pdf", "1740.pdf", "1755.pdf", "1794.pdf", "1845.pdf", "1856.pdf", "1873.pdf"],
    // --- ZONA N ---
    "00364 - CENTRO EDUCATIVO ROSA EVANGELINA SOLANO": ["1221.pdf", "1221A.pdf", "1221B.pdf", "1222.pdf", "1222A.pdf", "1737.pdf", "1754.pdf", "1808.pdf", "1843.pdf", "1855.pdf", "1901.pdf"],
    "00502 - ESCUELA PRIMARIA ELIZARDO TAMAREZ SANTAMARIA": ["1723.pdf", "1775.pdf"],
    "00538 - LICEO PROFESOR VICTOR PASCUAL AGUERO": ["1896.pdf"],
    "00541 - ESCUELA BASICA CONCEPCION BONA": ["1835.pdf", "1878.pdf"],
    // --- ZONA O ---
    "00367 - MANOGUAYABO": ["1224.pdf", "1224A.pdf", "1224B.pdf", "1225.pdf", "1225A.pdf", "1633.pdf", "1724.pdf", "1758.pdf", "1809.pdf", "1858.pdf"],
    "00435 - LICEO SECUNDARIO LAS AMERICAS": ["1216.pdf", "1216A.pdf", "1216B.pdf", "1216C.pdf", "1223.pdf", "1223A.pdf", "1223B.pdf", "1223C.pdf", "1223D.pdf", "1762.pdf", "1785.pdf", "1863.pdf"],
    "00516 - COLEGIO INFANTIL LOS QUERUBINES": ["1777.pdf"],
    "00525 - COLEGIO TRAZO DE COLORES": ["1803.pdf", "1889.pdf"],
    // --- ZONA P ---
    "00001 - COLEGIO EL ANGEL": ["0001.pdf", "1748.pdf", "1806.pdf", "1847.pdf", "1899.pdf"],
    "00356 - COLEGIO JUAN 23": ["1234.pdf", "1234A.pdf", "1235.pdf", "1235A.pdf", "1235B.pdf", "1384.pdf", "1384A.pdf", "1485.pdf", "1485A.pdf", "1485B.pdf"],
   
    // --- ZONA Q ---
    "00425 - ESCUELA BASICA LAS PALMAS #1": ["1403.pdf", "1403A.pdf", "1403B.pdf", "1483.pdf", "1483A.pdf", "1483B.pdf", "1484.pdf", "1484A.pdf", "1484B.pdf"],
    "00487 - ESCUELA VEDRUNA": ["1231.pdf", "1231A.pdf", "1231B.pdf", "1231C.pdf", "1262.pdf", "1262A.pdf"],
    "00492 - COLEGIO SANTA MARIA": ["1705.pdf", "1772.pdf", "1812.pdf", "1837.pdf", "1875.pdf", "1908.pdf"],
    "00524 - CLUB ESCUELA BASICA FRANCISCO A. CAAMAÑO": ["1686.pdf", "1802.pdf", "1888.pdf"],
    // --- ZONA R ---
    "00361 - ESCUELA ING. AGR. IVAN GUZMAN K": ["1375.pdf", "1375A.pdf", "1375B.pdf", "1375C.pdf", "1375D.pdf", "1375E.pdf"],
    "00455 - EXTENSION DE LA UASD": ["1375F.pdf", "1692.pdf", "1710.pdf", "1753.pdf", "1763.pdf", "1810.pdf", "1833.pdf", "1853.pdf", "1865.pdf"],
    "00515 - HOSPITAL MUNICIPAL DE ENGOMBE": ["1725.pdf", "1840.pdf"],
    // --- ZONA S ---
    "00362 - ESCUELA PRIMARIA BUENOS AIRES": ["1236.pdf", "1236A.pdf", "1237.pdf", "1237A.pdf", "1279.pdf", "1279A.pdf", "1282.pdf", "1282A.pdf", "1284.pdf", "1284A.pdf", "1284B.pdf", "1284C.pdf", "1638.pdf"],
    "00454 - CLUB 16 DE AGOSTO": ["1638A.pdf", "1638B.pdf", "1693.pdf", "1787.pdf", "1864.pdf"],
    "00543 - ESCUELA PROFESOR JUAN BOSCH GAVIÑO": ["1486.pdf", "1486A.pdf", "1487.pdf", "1487A.pdf", "1488.pdf", "1488A.pdf"],
    // --- ZONA T ---
    "00338 - COMEDOR ECONOMICO": ["1329.pdf", "1329A.pdf", "1329B.pdf", "1370.pdf", "1370A.pdf", "1370B.pdf", "1849.pdf"],
    "00476 - ASOCIACION DE IMPEDIDO FISICO MOTORES": ["1309.pdf", "1309A.pdf", "1309B.pdf", "1309C.pdf", "1695.pdf", "1767.pdf", "1828.pdf", "1832.pdf"],
    "00526 - POLITECNICO MADRE RAFAELA IBARRA": ["1314.pdf", "1314A.pdf", "1314B.pdf", "1314C.pdf", "1314D.pdf", "1314E.pdf", "1314F.pdf", "1696.pdf", "1769.pdf", "1804.pdf", "1890.pdf"],
    // --- ZONA U ---
    "00513 - ESCUELA BASICA HERMANAS MIRABAL": ["1747.pdf", "1796.pdf", "1839.pdf", "1882.pdf"],
    // --- ZONA W ---
    "00518 - PROYECTO DESARROLLO COMUNITARIO INTEGRAL": ["1727.pdf", "1780.pdf"],
    "00534 - SALON MULTIUSO EL ABANICO": ["1799.pdf", "1830.pdf", "1893.pdf"],
    // --- ZONA X ---
    "00510 - ESCUELA DE EDUCACION BASICA PROF. JUAN GABINO": ["1736.pdf", "1779.pdf", "1879.pdf"],
    // --- ZONA Y ---
    "00474 - ESCUELA PRIMARI ERCILIA PEPIN BATEY BIENVENIDO": ["1676.pdf", "1739.pdf", "1766.pdf", "1836.pdf", "1870.pdf"],
    // --- ZONA Z ---
    "00368 - CENTRO EDUCATIVO ALBERTO PEREZ Y SANTIAGO": ["1219.pdf", "1219A.pdf", "1220.pdf", "1220A.pdf", "1759.pdf", "1834.pdf", "1903.pdf"],
    // --- ZONA Ñ ---
    "00308 - SINDICATO UNIDO DE TRAB. PORTUARIO": ["1257.pdf", "1257A.pdf", "1356.pdf"],
    "00453 - ESCUELA PADRE MARTIN EGUSQUIZA": ["1356A.pdf", "1645.pdf", "1698.pdf", "1786.pdf"],
};
// Nota: Los archivos PDF referenciados deben estar ubicados en la estructura de carpetas correspondiente para su correcta asociación.
````

## File: src/components/ui/EmailStatus.js
````javascript
import React from 'react';

const EmailStatus = ({ 
  isVisible, 
  status, 
  message, 
  onClose,
  emailDetails = {} 
}) => {
  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return '📤';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '📧';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'sending':
        return 'email-status-sending';
      case 'success':
        return 'email-status-success';
      case 'error':
        return 'email-status-error';
      case 'warning':
        return 'email-status-warning';
      default:
        return 'email-status-info';
    }
  };

  return (
    <div className={`email-status-overlay ${getStatusClass()}`}>
      <div className="email-status-modal">
        <div className="email-status-header">
          <span className="email-status-icon">{getStatusIcon()}</span>
          <h3>Estado del Correo Electrónico</h3>
          {onClose && (
            <button 
              className="email-status-close" 
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="email-status-content">
          <p className="email-status-message">{message}</p>
          
          {emailDetails.to && (
            <div className="email-details">
              <h4>📋 Detalles del Envío:</h4>
              <ul>
                <li><strong>Destinatario:</strong> {emailDetails.to}</li>
                <li><strong>Plantilla:</strong> {emailDetails.template || 'Bienvenida Simpatizante'}</li>
                {emailDetails.messageId && (
                  <li><strong>ID del Mensaje:</strong> {emailDetails.messageId}</li>
                )}
                {emailDetails.customMessage && (
                  <li><strong>Mensaje Personalizado:</strong> Incluido</li>
                )}
              </ul>
            </div>
          )}

          {status === 'sending' && (
            <div className="email-loading">
              <div className="email-spinner"></div>
              <p>Enviando correo, por favor espera...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="email-success-actions">
              <p>🎉 El correo ha sido enviado exitosamente.</p>
              <p>El destinatario debería recibirlo en los próximos minutos.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="email-error-actions">
              <p>💡 <strong>Posibles soluciones:</strong></p>
              <ul>
                <li>Verifica que el email sea válido</li>
                <li>Revisa tu conexión a internet</li>
                <li>Intenta nuevamente en unos minutos</li>
                <li>Contacta soporte si el problema persiste</li>
              </ul>
            </div>
          )}
        </div>

        {onClose && status !== 'sending' && (
          <div className="email-status-footer">
            <button 
              className="email-status-button" 
              onClick={onClose}
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailStatus;
````

## File: src/components/ui/ErrorBoundary.js
````javascript
import React from "react";

/**
 * Error Boundary global.
 * Captura errores de renderizado en cualquier parte del árbol de componentes
 * y muestra una pantalla de respaldo en lugar de dejar la app en blanco.
 *
 * Nota: los Error Boundaries deben ser componentes de clase. No capturan
 * errores en manejadores de eventos ni en código asíncrono (eso es esperado).
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Actualiza el estado para mostrar la UI de respaldo en el próximo render.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Punto único para registrar el error (consola hoy, servicio externo a futuro).
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ marginBottom: "10px" }}>Algo salió mal</h1>
          <p style={{ color: "#666", marginBottom: "20px", maxWidth: "420px" }}>
            Ocurrió un error inesperado. Por favor, vuelve a la página de inicio
            e inténtalo de nuevo.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#1976d2",
              color: "#fff",
            }}
          >
            Volver al inicio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
````

## File: src/components/ui/Footer.js
````javascript
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
````

## File: src/components/ui/Loader.js
````javascript
import React from "react";

// Indicador de carga unificado.
// Reemplaza los <div className="loading-screen">...</div> dispersos por la app.
// Acepta un mensaje opcional (por defecto "Cargando...").
const Loader = ({ message = "Cargando..." }) => (
  <div className="loading-screen" role="status" aria-live="polite">
    {message}
  </div>
);

export default Loader;
````

## File: src/components/ui/Navbar.js
````javascript
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          {/* LADO IZQUIERDO: LOGO */}
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            FELIX <span>ENCARNACIÓN</span>
          </Link>

          {/* LADO DERECHO: ICONO (Solo móvil) */}
          <button
            className="menu-icon"
            onClick={toggleMenu}
            aria-label="Abrir menú"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* MENÚ DE NAVEGACIÓN */}
          <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
            <li className="nav-item">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Inicio
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/propuestas" className={`nav-link ${location.pathname === '/propuestas' ? 'active' : ''}`}>
                Propuestas
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/registro" className="nav-link nav-link-btn">
                ¡Inscríbete!
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/login" className="nav-link nav-login-link">
                Login
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* OVERLAY PARA CERRAR AL TOCAR FUERA */}
      <div className={`nav-overlay ${isOpen ? 'active' : ''}`} onClick={closeMenu} />
    </>
  );
}

export default Navbar;
````

## File: src/data/navConfig.test.js
````javascript
import { getVisibleNavItems } from "./navConfig";
import { ROL_ADMIN, ROL_LIDER, ROL_MULTIPLICADOR } from "../constants";

const ids = (items) => items.map((item) => item.id);

describe("getVisibleNavItems", () => {
  it("devuelve una lista vacía si no hay usuario", () => {
    expect(getVisibleNavItems(null)).toEqual([]);
    expect(getVisibleNavItems(undefined)).toEqual([]);
  });

  it("incluye siempre los ítems comunes (inicio, registro, perfil)", () => {
    const items = getVisibleNavItems({ rol: ROL_MULTIPLICADOR });
    expect(ids(items)).toEqual(expect.arrayContaining(["home", "registro", "perfil"]));
  });

  it("admin: muestra usuarios, equipos y comandos, sin acción de meta", () => {
    const items = getVisibleNavItems({ rol: ROL_ADMIN });
    expect(ids(items)).toEqual([
      "home",
      "registro",
      "perfil",
      "usuarios",
      "equipos",
      "comandos",
    ]);
    expect(ids(items)).not.toContain("meta");
  });

  it("multiplicador: incluye la acción de meta", () => {
    const items = getVisibleNavItems({ rol: ROL_MULTIPLICADOR });
    expect(ids(items)).toContain("meta");
    const meta = items.find((item) => item.id === "meta");
    expect(meta.isAction).toBe(true);
    expect(meta.path).toBeNull();
  });

  it("líder de zona: incluye la acción de meta", () => {
    const items = getVisibleNavItems({ rol: ROL_LIDER });
    expect(ids(items)).toContain("meta");
  });

  it("rol desconocido: solo ítems comunes, sin meta ni opciones de admin", () => {
    const items = getVisibleNavItems({ rol: "invitado" });
    expect(ids(items)).toEqual(["home", "registro", "perfil"]);
  });
});
````

## File: src/data/sectores.json
````json
[
  {
    "zona": "ZONA N",
    "sectores": [
      {
        "sector": "Hato Nuevo",
        "subsectores": [
          "EL BRUGAL",
          "LOS TRINITARIOS",
          "YOLENNY",
          "SANTIAGO APOSTOL",
          "BRISA DEL SUR",
          "BRISA DEL NORTE",
          "AMAPOLA",
          "BUENAS NOCHES",
          "BUENAS NOCHES ARRIBA",
          "BUENAS NOCHES 2",
          "VILLA CAROLINA 2",
          "SAN JOSE",
          "HATO NUEVO CENTRO",
          "ROALVA",
          "LOS PINOS",
          "LA ESPERANZA",
          "VILLA CAROLINA 1",
          "NUEVO HORIZONTE",
          "EL ZUMBOM",
          "CONTRESA",
          "ARROLLO PIEDRA",
          "INESPRE",
          "TANQUE AZUL",
          "CEDEE",
          "MARIA LUISA",
          "5 CASITA",
          "LA DELEGACION",
          "BARRIO LA OMSA",
          "EDF. BANRESERVAS",
          "PRIMAVERAL",
          "SAN LUIS",
          "LA PRADERA",
          "QUINTO SUEÑO",
          "VALERIO JAQUEZ",
          "VILLA PROGRESO",
          "JOSE REYES",
          "EL CONTROL"
        ]
      }
    ]
  }
]
````

## File: src/data/ubicaciones.js
````javascript
export const ubicacionesData = [
  {
    provincia: "Azua",
    municipios: [
      {
        municipio: "Azua de Compostela",
        sectores: [
          "La Bombita",
          "Los Solares",
          "El Centro",
          "Mejía",
          "Pueblo Abajo",
        ],
      },
      { municipio: "Estebanía", sectores: [] },
      { municipio: "Guayabal", sectores: [] },
      { municipio: "Las Charcas", sectores: [] },
      { municipio: "Las Yayas de Viajama", sectores: [] },
      { municipio: "Padre Las Casas", sectores: [] },
      { municipio: "Peralta", sectores: [] },
      { municipio: "Pueblo Viejo", sectores: [] },
      { municipio: "Sabana Yegua", sectores: [] },
      { municipio: "Tábara Arriba", sectores: [] },
    ],
  },
  {
    provincia: "Bahoruco",
    municipios: [
      {
        municipio: "Neiba",
        sectores: ["El Centro", "Villa Pando", "Cachón Seco"],
      },
      { municipio: "Galván", sectores: [] },
      { municipio: "Los Ríos", sectores: [] },
      { municipio: "Tamayo", sectores: [] },
      { municipio: "Villa Jaragua", sectores: [] },
    ],
  },
  {
    provincia: "Barahona",
    municipios: [
      {
        municipio: "Santa Cruz de Barahona",
        sectores: [
          "Villa Estela",
          "Pueblo Nuevo",
          "Baitoita",
          "Savica",
          "El Centro",
        ],
      },
      { municipio: "Cabral", sectores: [] },
      { municipio: "El Peñón", sectores: [] },
      { municipio: "Enriquillo", sectores: [] },
      { municipio: "Fundación", sectores: [] },
      { municipio: "Jaquimeyes", sectores: [] },
      { municipio: "La Ciénaga", sectores: [] },
      { municipio: "Las Salinas", sectores: [] },
      { municipio: "Paraíso", sectores: [] },
      { municipio: "Polo", sectores: [] },
      { municipio: "Vicente Noble", sectores: [] },
    ],
  },
  {
    provincia: "Dajabón",
    municipios: [
      {
        municipio: "Dajabón",
        sectores: ["El Centro", "Benito Monción", "La Fe"],
      },
      { municipio: "El Pino", sectores: [] },
      { municipio: "Loma de Cabrera", sectores: [] },
      { municipio: "Partido", sectores: [] },
      { municipio: "Restauración", sectores: [] },
    ],
  },
  {
    provincia: "Distrito Nacional",
    municipios: [
      {
        municipio: "Distrito Nacional",
        sectores: [
          "Arroyo Hondo",
          "Bella Vista",
          "Buenos Aires del Mirador",
          "Cacicazgos",
          "Centro de los Héroes",
          "Cerros de Arroyo Hondo",
          "Ciudad Colonial",
          "Ciudad Nueva",
          "Cristo Rey",
          "El Millón",
          "Ensanche Naco",
          "Ensanche Piantini",
          "Ensanche Quisqueya",
          "Gazcue",
          "General Antonio Duvergé",
          "Honduras del Norte",
          "Jardín Botánico",
          "Jardines del Sur",
          "Julieta Morales",
          "La Agustina",
          "La Castellana",
          "La Esperilla",
          "La Fe",
          "La Julia",
          "La Zurza",
          "Los Cacicazgos",
          "Los Jardines del Norte",
          "Los Prados",
          "Los Restauradores",
          "Los Ríos",
          "Mata Hambre",
          "Mejoramiento Social",
          "Mirador Norte",
          "Mirador Sur",
          "Miraflores",
          "Naco",
          "Paraíso",
          "Paseo de los Indios",
          "Piantini",
          "Plaza de la Cultura",
          "Renacimiento",
          "San Carlos",
          "San Gerónimo",
          "San Juan Bosco",
          "Urb. Fernández",
          "Viejo Arroyo Hondo",
          "Villa Consuelo",
          "Villa Francisca",
          "Villa Juana",
        ],
      },
    ],
  },
  {
    provincia: "Duarte",
    municipios: [
      {
        municipio: "San Francisco de Macorís",
        sectores: [
          "El Centro",
          "Pueblo Nuevo",
          "Capotillo",
          "Santa Ana",
          "San Martín",
        ],
      },
      { municipio: "Arenoso", sectores: [] },
      { municipio: "Castillo", sectores: [] },
      { municipio: "Eugenio María de Hostos", sectores: [] },
      { municipio: "Las Guáranas", sectores: [] },
      { municipio: "Pimentel", sectores: [] },
      { municipio: "Villa Riva", sectores: [] },
    ],
  },
  {
    provincia: "El Seibo",
    municipios: [
      {
        municipio: "Santa Cruz de El Seibo",
        sectores: ["El Centro", "Ginandiana", "Villa Guerrero"],
      },
      { municipio: "Miches", sectores: [] },
    ],
  },
  {
    provincia: "Elías Piña",
    municipios: [
      { municipio: "Comendador", sectores: [] },
      { municipio: "Bánica", sectores: [] },
      { municipio: "El Llano", sectores: [] },
      { municipio: "Hondo Valle", sectores: [] },
      { municipio: "Juan Santiago", sectores: [] },
      { municipio: "Pedro Santana", sectores: [] },
    ],
  },
  {
    provincia: "Espaillat",
    municipios: [
      {
        municipio: "Moca",
        sectores: ["El Centro", "La Española", "Villa Bartola"],
      },
      { municipio: "Cayetano Germosén", sectores: [] },
      { municipio: "Gaspar Hernández", sectores: [] },
      { municipio: "Jamao al Norte", sectores: [] },
    ],
  },
  {
    provincia: "Hato Mayor",
    municipios: [
      {
        municipio: "Hato Mayor del Rey",
        sectores: ["El Centro", "Villa Canto", "Las Malvinas"],
      },
      { municipio: "El Valle", sectores: [] },
      { municipio: "Sabana de la Mar", sectores: [] },
    ],
  },
  {
    provincia: "Hermanas Mirabal",
    municipios: [
      { municipio: "Salcedo", sectores: [] },
      { municipio: "Tenares", sectores: [] },
      { municipio: "Villa Tapia", sectores: [] },
    ],
  },
  {
    provincia: "Independencia",
    municipios: [
      { municipio: "Jimaní", sectores: [] },
      { municipio: "Cristóbal", sectores: [] },
      { municipio: "Duvergé", sectores: [] },
      { municipio: "La Descubierta", sectores: [] },
      { municipio: "Mella", sectores: [] },
      { municipio: "Postrer Río", sectores: [] },
    ],
  },
  {
    provincia: "La Altagracia",
    municipios: [
      {
        municipio: "Salvaleón de Higüey",
        sectores: ["El Centro", "Villa Cerro", "San Martín", "La Malena"],
      },
      { municipio: "San Rafael del Yuma", sectores: [] },
      {
        municipio: "Distrito Municipal Verón-Punta Cana",
        sectores: ["Bávaro", "Punta Cana", "Verón", "Friusa"],
      },
    ],
  },
  {
    provincia: "La Romana",
    municipios: [
      {
        municipio: "La Romana",
        sectores: ["El Centro", "Villa Verde", "Buena Vista", "Bancola"],
      },
      { municipio: "Guaymate", sectores: [] },
      { municipio: "Villa Hermosa", sectores: [] },
    ],
  },
  {
    provincia: "La Vega",
    municipios: [
      {
        municipio: "Concepción de La Vega",
        sectores: ["El Centro", "Villa Rosa", "Palmarito", "Las Carolinas"],
      },
      { municipio: "Constanza", sectores: [] },
      { municipio: "Jarabacoa", sectores: [] },
      { municipio: "Jima Abajo", sectores: [] },
    ],
  },
  {
    provincia: "María Trinidad Sánchez",
    municipios: [
      { municipio: "Nagua", sectores: [] },
      { municipio: "Cabrera", sectores: [] },
      { municipio: "El Factor", sectores: [] },
      { municipio: "Río San Juan", sectores: [] },
    ],
  },
  {
    provincia: "Monseñor Nouel",
    municipios: [
      {
        municipio: "Bonao",
        sectores: ["El Centro", "Prosperidad", "Los Transformadores"],
      },
      { municipio: "Maimón", sectores: [] },
      { municipio: "Piedra Blanca", sectores: [] },
    ],
  },
  {
    provincia: "Monte Cristi",
    municipios: [
      { municipio: "San Fernando de Monte Cristi", sectores: [] },
      { municipio: "Castañuelas", sectores: [] },
      { municipio: "Guayubín", sectores: [] },
      { municipio: "Las Matas de Santa Cruz", sectores: [] },
      { municipio: "Pepillo Salcedo", sectores: [] },
      { municipio: "Villa Vásquez", sectores: [] },
    ],
  },
  {
    provincia: "Monte Plata",
    municipios: [
      { municipio: "Monte Plata", sectores: [] },
      { municipio: "Bayaguana", sectores: [] },
      { municipio: "Peralvillo", sectores: [] },
      { municipio: "Sabana Grande de Boyá", sectores: [] },
      { municipio: "Yamasá", sectores: [] },
    ],
  },
  {
    provincia: "Pedernales",
    municipios: [
      { municipio: "Pedernales", sectores: [] },
      { municipio: "Oviedo", sectores: [] },
    ],
  },
  {
    provincia: "Peravia",
    municipios: [
      {
        municipio: "Baní",
        sectores: ["El Centro", "Santa Rosa", "Villa Majega"],
      },
      { municipio: "Matanzas", sectores: [] },
      { municipio: "Nizao", sectores: [] },
    ],
  },
  {
    provincia: "Puerto Plata",
    municipios: [
      {
        municipio: "San Felipe de Puerto Plata",
        sectores: ["El Centro", "Costambar", "Long Beach", "Torre Alta"],
      },
      { municipio: "Altamira", sectores: [] },
      { municipio: "Guananico", sectores: [] },
      { municipio: "Imbert", sectores: [] },
      { municipio: "Los Hidalgos", sectores: [] },
      { municipio: "Luperón", sectores: [] },
      { municipio: "Sosúa", sectores: ["El Batey", "Los Charamicos"] },
      { municipio: "Villa Isabela", sectores: [] },
      { municipio: "Villa Montellano", sectores: [] },
    ],
  },
  {
    provincia: "Samaná",
    municipios: [
      { municipio: "Santa Bárbara de Samaná", sectores: [] },
      { municipio: "Las Terrenas", sectores: [] },
      { municipio: "Sánchez", sectores: [] },
    ],
  },
  {
    provincia: "San Cristóbal",
    municipios: [
      {
        municipio: "San Cristóbal",
        sectores: [
          "El Centro",
          "Pueblo Nuevo",
          "Canastica",
          "Lavapiés",
          "Madre Vieja",
        ],
      },
      {
        municipio: "Bajos de Haina",
        sectores: ["Haina", "El Carril", "Quita Sueño"],
      },
      { municipio: "Cambita Garabitos", sectores: [] },
      { municipio: "Los Cacaos", sectores: [] },
      { municipio: "Sabana Grande de Palenque", sectores: [] },
      { municipio: "San Gregorio de Nigua", sectores: [] },
      { municipio: "Villa Altagracia", sectores: [] },
      { municipio: "Yaguate", sectores: [] },
    ],
  },
  {
    provincia: "San José de Ocoa",
    municipios: [
      { municipio: "San José de Ocoa", sectores: [] },
      { municipio: "Rancho Arriba", sectores: [] },
      { municipio: "Sabana Larga", sectores: [] },
    ],
  },
  {
    provincia: "San Juan",
    municipios: [
      {
        municipio: "San Juan de la Maguana",
        sectores: ["El Centro", "Villa Liberación", "Corbano Sur"],
      },
      { municipio: "Bohechío", sectores: [] },
      { municipio: "El Cercado", sectores: [] },
      { municipio: "Juan de Herrera", sectores: [] },
      { municipio: "Las Matas de Farfán", sectores: [] },
      { municipio: "Vallejuelo", sectores: [] },
    ],
  },
  {
    provincia: "San Pedro de Macorís",
    municipios: [
      {
        municipio: "San Pedro de Macorís",
        sectores: [
          "El Centro",
          "Villa Providencia",
          "Miramar",
          "Placer Bonito",
        ],
      },
      { municipio: "Consuelo", sectores: [] },
      { municipio: "Guayacanes", sectores: [] },
      { municipio: "Quisqueya", sectores: [] },
      { municipio: "Ramón Santana", sectores: [] },
      { municipio: "San José de los Llanos", sectores: [] },
    ],
  },
  {
    provincia: "Sánchez Ramírez",
    municipios: [
      {
        municipio: "Cotuí",
        sectores: ["El Centro", "La Esperanza", "Los Pomos"],
      },
      { municipio: "Cevicos", sectores: [] },
      { municipio: "Fantino", sectores: [] },
      { municipio: "La Mata", sectores: [] },
    ],
  },
  {
    provincia: "Santiago",
    municipios: [
      {
        municipio: "Santiago de los Caballeros",
        sectores: [
          "Baracoa",
          "Bella Vista",
          "Centro Histórico",
          "Cerros de Gurabo",
          "Cienfuegos",
          "El Ensueño",
          "El Retiro",
          "Gurabo",
          "Jardines Metropolitanos",
          "La Esmeralda",
          "La Trinitaria",
          "La Zurza",
          "Licey",
          "Los Jardines",
          "Los Pepines",
          "Marilópez",
          "Pekín",
          "Pueblo Nuevo",
          "Reparto Peralta",
          "Villa Olga",
        ],
      },
      { municipio: "Bisonó", sectores: [] },
      { municipio: "Jánico", sectores: [] },
      { municipio: "Licey al Medio", sectores: [] },
      { municipio: "Puñal", sectores: [] },
      { municipio: "Sabana Iglesia", sectores: [] },
      { municipio: "San José de las Matas", sectores: [] },
      { municipio: "Tamboril", sectores: [] },
      { municipio: "Villa González", sectores: [] },
    ],
  },
  {
    provincia: "Santiago Rodríguez",
    municipios: [
      { municipio: "San Ignacio de Sabaneta", sectores: [] },
      { municipio: "Los Almácigos", sectores: [] },
      { municipio: "Monción", sectores: [] },
    ],
  },
  {
    provincia: "Santo Domingo",
    municipios: [
      {
        municipio: "Santo Domingo Este",
        sectores: [
          "Alma Rosa I",
          "Alma Rosa II",
          "Cancino Adentro",
          "El Almirante",
          "Ensanche Ozama",
          "Hainamosa",
          "Invivienda",
          "Isabelita",
          "Los Frailes",
          "Los Mameyes",
          "Los Mina",
          "Los Trinitarios",
          "Lucerna",
          "Mendoza",
          "San Isidro",
          "Villa Carmen",
          "Villa Duarte",
          "Villa Faro",
          "Distrito Municipal de Guerra",
          "Distrito Municipal de La Caleta",
          "Distrito Municipal de San Luis",
        ],
      },
      {
        municipio: "Santo Domingo Norte",
        sectores: [
          "Buena Vista I y II",
          "Guaricano",
          "Jacagua",
          "Lotes y Servicios",
          "Ponce",
          "Sabana Perdida",
          "Villa Mella",
          "Distrito Municipal de La Victoria",
        ],
      },
      {
        municipio: "Santo Domingo Oeste",
        sectores: [
          "Buenos Aires de Herrera",
          "El Abanico de Herrera",
          "El Café de Herrera",
          "Engombe",
          "Herrera",
          "Iván Guzmán",
          "Juan Pablo Duarte",
          "Las Caobas",
          "Las Palmas de Herrera",
          "Manoguayabo",
          "Bayona",
          "Palmarejo",
          "Pantoja",
          "Pueblo Chico",
        ],
      },
      { municipio: "Boca Chica", sectores: ["Andrés", "La Caleta"] },
      { municipio: "Los Alcarrizos", sectores: ["Pantoja", "Pedro Brand"] },
      { municipio: "Pedro Brand", sectores: [] },
      { municipio: "San Antonio de Guerra", sectores: [] },
    ],
  },
  {
    provincia: "Valverde",
    municipios: [
      { municipio: "Mao", sectores: ["El Centro", "Sibila", "San Antonio"] },
      { municipio: "Esperanza", sectores: [] },
      { municipio: "Laguna Salada", sectores: [] },
    ],
  },
];
````

## File: src/hooks/useMediaQuery.js
````javascript
import { useState, useEffect } from "react";

// Hook de detección de dispositivo: devuelve true si el media query coincide.
// Ej.: const isMobile = useMediaQuery("(max-width: 768px)");
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

export default useMediaQuery;
````

## File: src/hooks/usePageTracking.js
````javascript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

// Hook para rastrear automáticamente las páginas visitadas
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Rastrear la página actual cuando cambie la ruta
    trackPageView(location.pathname + location.search);
  }, [location]);
};

export default usePageTracking;
````

## File: src/utils/analytics.js
````javascript
// Google Analytics utilities
export const GA_TRACKING_ID = 'G-EB27HNVEQY';

// Función para enviar eventos personalizados
export const trackEvent = (action, category, label, value) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Función para rastrear páginas
export const trackPageView = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Eventos específicos de la campaña
export const trackCampaignEvents = {
  // Registro de usuarios
  userRegistration: (method) => {
    trackEvent('sign_up', 'engagement', 'user_registration', method);
  },
  
  // Login
  userLogin: (method) => {
    trackEvent('login', 'engagement', 'user_login', method);
  },
  
  // Visualización de propuestas
  viewProposals: () => {
    trackEvent('view_item', 'content', 'proposals_page');
  },
  
  // Registro de simpatizantes
  registerSimpatizante: () => {
    trackEvent('generate_lead', 'conversion', 'simpatizante_registration');
  },
  
  // Compartir enlace de referido
  shareReferralLink: (method) => {
    trackEvent('share', 'engagement', 'referral_link', method);
  },
  
  // Navegación del dashboard
  dashboardNavigation: (section) => {
    trackEvent('select_content', 'navigation', 'dashboard_section', section);
  },
  
  // Establecer metas
  setGoal: (goalType) => {
    trackEvent('set_goal', 'engagement', 'goal_setting', goalType);
  },
  
  // Descarga de documentos
  downloadDocument: (documentName) => {
    trackEvent('file_download', 'engagement', 'document_download', documentName);
  }
};

// Hook para usar en componentes React
export const useAnalytics = () => {
  return {
    trackEvent,
    trackPageView,
    trackCampaignEvents
  };
};
````

## File: src/utils/comprimirImagen.js
````javascript
// Compresión/redimensionado de imágenes EN EL NAVEGADOR antes de subir a
// Storage. Las fotos vienen de cámara profesional (varios MB), lo que hacía
// lentísimo el export a PDF (~43s por imagen) y la carga de ManageUsers.
//
// JUSTIFICACIÓN DE PARÁMETROS:
// - maxLado = 1000px: cubre de sobra el lightbox a pantalla completa y la
//   ficha del PDF (~30mm ≈ 350px a 300dpi) con margen; subir más resolución no
//   aporta nada visible en esos usos.
// - calidad = 0.82: a 1000px es visualmente indistinguible del original.
// - Resultado típico: ~150-300KB por foto, frente a los varios MB de origen.

/**
 * Carga un File de imagen respetando la orientación EXIF cuando el navegador
 * lo soporta (createImageBitmap con imageOrientation: "from-image"). Si no,
 * cae a un <img>, que en navegadores modernos ya auto-orienta imágenes.
 *
 * @param {File|Blob} file
 * @returns {Promise<{ draw: CanvasImageSource, width: number, height: number, close: () => void }>}
 */
async function cargarImagen(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        draw: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close && bitmap.close(),
      };
    } catch {
      // Algunos navegadores no soportan la opción imageOrientation: caemos
      // al método <img> más abajo.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("No se pudo decodificar la imagen"));
      el.src = url;
    });
    return {
      draw: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Comprime y redimensiona una imagen en el cliente.
 *
 * Mantiene la proporción de modo que el lado MAYOR no exceda `maxLado` (no
 * agranda si ya es menor). Exporta JPEG con la `calidad` dada.
 *
 * Si el archivo no es imagen o algo falla, devuelve el original como fallback
 * (con un warning), para no bloquear nunca la subida.
 *
 * @param {File} file
 * @param {{ maxLado?: number, calidad?: number }} [opts]
 * @returns {Promise<Blob|File>} Blob JPEG comprimido (o el file original si falla).
 */
export async function comprimirImagen(
  file,
  { maxLado = 1000, calidad = 0.82 } = {}
) {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    console.warn(
      "[comprimirImagen] El archivo no es una imagen; se sube sin procesar.",
      file && file.type
    );
    return file;
  }

  let imagen;
  try {
    imagen = await cargarImagen(file);
    const { draw, width: w0, height: h0 } = imagen;

    const escala = Math.min(1, maxLado / Math.max(w0, h0)); // nunca > 1
    const width = Math.max(1, Math.round(w0 * escala));
    const height = Math.max(1, Math.round(h0 * escala));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(draw, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", calidad)
    );

    if (!blob) {
      console.warn(
        "[comprimirImagen] canvas.toBlob devolvió null; se sube el original."
      );
      return file;
    }
    return blob;
  } catch (err) {
    console.warn(
      "[comprimirImagen] Falló la compresión; se sube el original.",
      err && err.message
    );
    return file;
  } finally {
    if (imagen && imagen.close) imagen.close();
  }
}
````

## File: src/utils/excelConFoto.js
````javascript
import ExcelJS from "exceljs";
import { fetchFotosBatch } from "./fotoExport";

// ------------------------------------------------------------------
// NOTA DE RENDIMIENTO: este export descarga UNA imagen por persona desde
// Firebase Storage (vía fetchFotosBatch) y la embebe en la hoja. Para muchos
// registros el proceso puede tardar; la concurrencia de descarga la controla
// fetchFotosBatch (opción `concurrency`). El callback onProgress permite
// mostrar "Generando Excel... X/Y" mientras se bajan las fotos.
// ------------------------------------------------------------------

// Tamaño de la miniatura embebida, en px.
const FOTO_PX = 56;
// Alto de fila en puntos (~ FOTO_PX + margen). ExcelJS usa puntos para height.
const ROW_HEIGHT = 46;
// Ancho de la columna de foto en "caracteres" de Excel (≈ FOTO_PX / 7).
const FOTO_COL_WIDTH = 10;
// Pequeño margen (px) para centrar la foto dentro de la celda.
const FOTO_OFFSET = 3;

// Bordes suaves reutilizados en todas las celdas.
const BORDE_SUAVE = {
  top: { style: "thin", color: { argb: "FFE0E0E0" } },
  left: { style: "thin", color: { argb: "FFE0E0E0" } },
  bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
  right: { style: "thin", color: { argb: "FFE0E0E0" } },
};

/**
 * Extrae el base64 puro y la extensión de una data URL.
 * @param {string} dataUrl p.ej. "data:image/jpeg;base64,...."
 * @returns {{ base64: string, extension: "jpeg"|"png" } | null}
 */
function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const coma = dataUrl.indexOf(",");
  if (coma === -1) return null;
  const meta = dataUrl.slice(0, coma);
  const base64 = dataUrl.slice(coma + 1);
  const extension = /png/i.test(meta) ? "png" : "jpeg";
  return { base64, extension };
}

/**
 * Dispara la descarga de un ArrayBuffer como archivo .xlsx usando un <a> con
 * URL.createObjectURL (no dependemos de file-saver).
 * @param {ArrayBuffer} buffer
 * @param {string} fileName
 */
function descargarBuffer(buffer, fileName) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "export.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera y descarga un Excel (.xlsx) con la foto de cada persona embebida en
 * la primera columna.
 *
 * @param {Array<object>} personas objetos ya normalizados (deben tener `cedula`).
 * @param {object} opts
 * @param {string} opts.hojaNombre nombre de la hoja.
 * @param {Array<{header: string, key: string, width?: number}>} opts.columnas
 *        columnas de datos (la columna "Foto" se antepone automáticamente).
 * @param {string} opts.fileName nombre del archivo a descargar.
 * @param {number} [opts.concurrency] concurrencia de descarga de fotos.
 * @param {(fase: string, hechos: number, total: number) => void} [opts.onProgress]
 *        progreso: fase "fotos" durante la descarga, "excel" durante el armado.
 * @returns {Promise<void>}
 */
export async function generarExcelConFoto(
  personas,
  { hojaNombre, columnas, fileName, concurrency = 6, onProgress } = {}
) {
  const lista = Array.isArray(personas) ? personas : [];
  const cols = Array.isArray(columnas) ? columnas : [];
  const emitir = (fase, hechos, total) => {
    if (typeof onProgress === "function") onProgress(fase, hechos, total);
  };

  // 1) Descarga de fotos con progreso.
  const fotos = await fetchFotosBatch(lista, {
    concurrency,
    onProgress: (hechos, total) => emitir("fotos", hechos, total),
  });

  // 2) Armado del workbook.
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(hojaNombre || "Datos");

  // La primera columna es "Foto"; el resto vienen de `columnas`.
  ws.columns = [
    { header: "Foto", key: "__foto__", width: FOTO_COL_WIDTH },
    ...cols.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width || 18,
    })),
  ];

  // Cabecera en negrita.
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.border = BORDE_SUAVE;
  });

  const total = lista.length;
  emitir("excel", 0, total);

  for (let i = 0; i < total; i++) {
    const persona = lista[i];
    const rowNumber = i + 2; // fila 1 = cabecera

    // Datos (fallback "N/A"). La celda de foto queda vacía; la imagen se ancla.
    const rowData = { __foto__: "" };
    for (const c of cols) {
      const v = persona ? persona[c.key] : undefined;
      rowData[c.key] = v === null || v === undefined || v === "" ? "N/A" : v;
    }
    const row = ws.getRow(rowNumber);
    row.values = rowData;
    row.height = ROW_HEIGHT;
    row.alignment = { vertical: "middle" };
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = BORDE_SUAVE;
    });

    // Foto embebida anclada a la celda de esta fila (columna 0).
    const foto = persona ? fotos.get(persona.cedula) : null;
    const parsed = foto ? parseDataUrl(foto.dataUrl) : null;
    if (parsed) {
      const imageId = workbook.addImage({
        base64: parsed.base64,
        extension: parsed.extension,
      });
      // Anclaje por offsets absolutos (en px) dentro de la celda de foto,
      // para controlar el tamaño exacto de la miniatura.
      ws.addImage(imageId, {
        tl: { col: 0, row: rowNumber - 1, offsetX: FOTO_OFFSET, offsetY: FOTO_OFFSET },
        ext: { width: FOTO_PX, height: FOTO_PX },
        editAs: "oneCell",
      });
    }

    emitir("excel", i + 1, total);
  }

  // 3) Descarga.
  const buffer = await workbook.xlsx.writeBuffer();
  descargarBuffer(buffer, fileName || "export.xlsx");
}
````

## File: src/utils/fotoCache.js
````javascript
// Cache de módulo COMPARTIDO para la resolución de fotos de Storage.
//
// Clave: cédula normalizada (solo dígitos, para que "001-1234567-8" y
// "00112345678" compartan entrada). Valor: Promise<url|null>.
//
// Cachea también los NEGATIVOS (Promise que resuelve a null): cuando una
// persona no tiene foto, evitamos repetir el sondeo de hasta 8 rutas cada vez
// que su avatar re-entra al viewport (lazy-load) o que se re-exporta.
//
// PARCHE temporal: cuando exista `fotoPath` en Firestore (Fase D) ya no habrá
// sondeo que cachear y este módulo podrá retirarse.

const cache = new Map();

const normalizar = (cedula) => String(cedula || "").replace(/\D/g, "");

/**
 * @param {string} cedula
 * @returns {Promise<string|null>|undefined} promesa cacheada, o undefined si
 *          esa cédula aún no se resolvió en esta sesión.
 */
export function get(cedula) {
  return cache.get(normalizar(cedula));
}

/**
 * Guarda la promesa de resolución de una cédula.
 * @param {string} cedula
 * @param {Promise<string|null>} promise
 * @returns {Promise<string|null>} la misma promesa (para encadenar).
 */
export function set(cedula, promise) {
  cache.set(normalizar(cedula), promise);
  return promise;
}

/** Vacía el cache (opcional; útil tras subir/actualizar fotos). */
export function clear() {
  cache.clear();
}
````

## File: src/utils/pdfPadron.js
````javascript
import { jsPDF } from "jspdf";
import { fetchFotosBatch } from "./fotoExport";

// ------------------------------------------------------------------
// Geometría del layout (todo en mm sobre A4 vertical: 210 x 297).
// ------------------------------------------------------------------
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12; // margen exterior de la página
const HEADER_H = 16; // alto reservado para el encabezado
const FOOTER_H = 10; // alto reservado para el pie
const COLS = 2; // fichas por fila
const COL_GAP = 6; // separación horizontal entre columnas
const ROW_GAP = 5; // separación vertical entre filas
const CARD_H = 38; // alto de cada ficha
const CARD_PAD = 3; // padding interno de la ficha
const FOTO_SIZE = 30; // lado de la foto (mm)

// Color del borde suave de la ficha y del placeholder.
const BORDE = 210; // gris claro (0-255)
const PLACEHOLDER_BG = 224;
const PLACEHOLDER_FG = 120;

// Ancho útil y ancho de columna derivados de los márgenes.
const CONTENT_W = PAGE_W - MARGIN * 2;
const CARD_W = (CONTENT_W - COL_GAP * (COLS - 1)) / COLS;

// Área vertical disponible para fichas dentro de una página.
const GRID_TOP = MARGIN + HEADER_H;
const GRID_BOTTOM = PAGE_H - MARGIN - FOOTER_H;
const ROWS_PER_PAGE = Math.max(
  1,
  Math.floor((GRID_BOTTOM - GRID_TOP + ROW_GAP) / (CARD_H + ROW_GAP))
);
const CARDS_PER_PAGE = ROWS_PER_PAGE * COLS;

/**
 * Fecha de generación en formato dd/mm/aaaa hh:mm (es-DO).
 * @returns {string}
 */
function fechaGeneracion() {
  const d = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(
    d.getHours()
  )}:${dos(d.getMinutes())}`;
}

/**
 * Corta un texto para que quepa en un ancho dado, añadiendo "…" si sobra.
 * @param {jsPDF} doc
 * @param {string} texto
 * @param {number} maxW ancho máximo en mm
 * @returns {string}
 */
function truncar(doc, texto, maxW) {
  const str = texto == null ? "" : String(texto);
  if (doc.getTextWidth(str) <= maxW) return str;
  let recorte = str;
  while (recorte.length > 1 && doc.getTextWidth(recorte + "…") > maxW) {
    recorte = recorte.slice(0, -1);
  }
  return recorte + "…";
}

/**
 * Dibuja el encabezado (título + fecha) de la página actual.
 * @param {jsPDF} doc
 * @param {string} titulo
 * @param {string} fecha
 */
function dibujarEncabezado(doc, titulo, fecha) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text(titulo || "Padrón", MARGIN, MARGIN + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generado: ${fecha}`, PAGE_W - MARGIN, MARGIN + 6, {
    align: "right",
  });

  // Línea separadora bajo el encabezado.
  doc.setDrawColor(BORDE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, GRID_TOP - 4, PAGE_W - MARGIN, GRID_TOP - 4);
}

/**
 * Dibuja el pie con la numeración de página.
 * @param {jsPDF} doc
 * @param {number} pagina 1-indexado
 * @param {number} totalPaginas
 */
function dibujarPie(doc, pagina, totalPaginas) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    `Página ${pagina} de ${totalPaginas}`,
    PAGE_W / 2,
    PAGE_H - MARGIN,
    { align: "center" }
  );
}

/**
 * Dibuja el placeholder gris con la inicial del nombre cuando no hay foto.
 * @param {jsPDF} doc
 * @param {number} x
 * @param {number} y
 * @param {string} nombre
 */
function dibujarPlaceholderFoto(doc, x, y, nombre) {
  doc.setFillColor(PLACEHOLDER_BG);
  doc.setDrawColor(BORDE);
  doc.setLineWidth(0.2);
  doc.rect(x, y, FOTO_SIZE, FOTO_SIZE, "FD");

  const inicial = nombre ? String(nombre).trim().charAt(0).toUpperCase() : "?";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(PLACEHOLDER_FG);
  doc.text(inicial, x + FOTO_SIZE / 2, y + FOTO_SIZE / 2 + 5, {
    align: "center",
  });
}

/**
 * Dibuja una ficha (recuadro con foto + datos) en la posición indicada.
 * @param {jsPDF} doc
 * @param {number} x esquina superior izquierda de la ficha
 * @param {number} y
 * @param {object} persona
 * @param {Array<{label: string, key: string}>} campos
 * @param {{dataUrl: string} | null} foto
 */
function dibujarFicha(doc, x, y, persona, campos, foto) {
  // Recuadro con borde suave.
  doc.setDrawColor(BORDE);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, CARD_W, CARD_H, 1.5, 1.5, "S");

  const fotoX = x + CARD_PAD;
  const fotoY = y + (CARD_H - FOTO_SIZE) / 2;

  if (foto && foto.dataUrl) {
    try {
      doc.addImage(foto.dataUrl, "JPEG", fotoX, fotoY, FOTO_SIZE, FOTO_SIZE);
      // Borde fino sobre la foto para separarla del fondo blanco.
      doc.setDrawColor(BORDE);
      doc.setLineWidth(0.2);
      doc.rect(fotoX, fotoY, FOTO_SIZE, FOTO_SIZE, "S");
    } catch {
      dibujarPlaceholderFoto(doc, fotoX, fotoY, persona.nombre);
    }
  } else {
    dibujarPlaceholderFoto(doc, fotoX, fotoY, persona.nombre);
  }

  // Zona de datos a la derecha de la foto.
  const datosX = fotoX + FOTO_SIZE + CARD_PAD;
  const datosW = x + CARD_W - CARD_PAD - datosX;
  let cursorY = y + CARD_PAD + 4;

  // Nombre en negrita.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20);
  const nombre = persona.nombre || persona.nombres || "—";
  doc.text(truncar(doc, nombre, datosW), datosX, cursorY);
  cursorY += 5;

  // Campos label: valor.
  doc.setFontSize(8);
  for (const campo of campos || []) {
    const valorRaw = persona[campo.key];
    const valor =
      valorRaw === null || valorRaw === undefined || valorRaw === ""
        ? "—"
        : String(valorRaw);

    const etiqueta = `${campo.label}: `;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(90);
    const etW = doc.getTextWidth(etiqueta);
    doc.text(etiqueta, datosX, cursorY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(40);
    doc.text(truncar(doc, valor, datosW - etW), datosX + etW, cursorY);

    cursorY += 4;
    if (cursorY > y + CARD_H - CARD_PAD) break; // no desbordar la ficha
  }
}

/**
 * Genera y descarga un PDF tipo padrón: una ficha por persona (foto grande a
 * la izquierda, datos a la derecha) en grid de 2 columnas por página A4.
 *
 * @param {Array<object>} personas objetos ya normalizados (deben tener `cedula`).
 * @param {object} opts
 * @param {string} opts.titulo título del encabezado.
 * @param {Array<{label: string, key: string}>} opts.campos campos a mostrar por ficha.
 * @param {string} opts.fileName nombre del archivo a descargar.
 * @param {number} [opts.concurrency] concurrencia de descarga de fotos.
 * @param {(fase: string, hechos: number, total: number) => void} [opts.onProgress]
 *        progreso: fase "fotos" durante la descarga, "pdf" durante el dibujado.
 * @returns {Promise<void>}
 */
export async function generarPadronPDF(
  personas,
  { titulo, campos, fileName, concurrency = 6, onProgress } = {}
) {
  const lista = Array.isArray(personas) ? personas : [];
  const emitir = (fase, hechos, total) => {
    if (typeof onProgress === "function") onProgress(fase, hechos, total);
  };

  // 1) Descarga de fotos con progreso.
  const fotos = await fetchFotosBatch(lista, {
    concurrency,
    onProgress: (hechos, total) => emitir("fotos", hechos, total),
  });

  // 2) Dibujado del PDF.
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const fecha = fechaGeneracion();
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / CARDS_PER_PAGE));

  emitir("pdf", 0, total);

  for (let i = 0; i < total; i++) {
    const indiceEnPagina = i % CARDS_PER_PAGE;

    if (i > 0 && indiceEnPagina === 0) doc.addPage();

    if (indiceEnPagina === 0) {
      const pagina = Math.floor(i / CARDS_PER_PAGE) + 1;
      dibujarEncabezado(doc, titulo, fecha);
      dibujarPie(doc, pagina, totalPaginas);
    }

    const fila = Math.floor(indiceEnPagina / COLS);
    const col = indiceEnPagina % COLS;
    const x = MARGIN + col * (CARD_W + COL_GAP);
    const y = GRID_TOP + fila * (CARD_H + ROW_GAP);

    const persona = lista[i];
    const foto = persona ? fotos.get(persona.cedula) : null;
    dibujarFicha(doc, x, y, persona, campos, foto);

    emitir("pdf", i + 1, total);
  }

  // Si no hay personas, dejamos al menos el encabezado de la página vacía.
  if (total === 0) {
    dibujarEncabezado(doc, titulo, fecha);
    dibujarPie(doc, 1, 1);
  }

  doc.save(fileName || "padron.pdf");
}
````

## File: src/utils/subirFotoUsuario.js
````javascript
// Lógica COMPARTIDA para subir la foto de un usuario a Storage, reutilizada por
// EditUserModal (editar) y CreateUser (crear). Antes vivía inline dentro del
// modal de edición, acoplada al componente; aquí queda como util independiente.
//
// CONTRATO:
// - Este util SOLO comprime + sube el Blob a Storage y devuelve la ruta.
// - NO escribe `fotoPath` en Firestore: el id/ref del doc difiere según el
//   caller (updateDoc por user.id al editar, doc del usuario recién creado al
//   crear), así que la escritura la hace cada caller con la ruta devuelta.
// - La foto se guarda como .jpg con la cédula SIN guiones (estándar normalizado).
//   AvatarFoto prueba primero este formato, así la foto nueva siempre gana sobre
//   el recorte viejo del padrón (que está con guiones).

import { storage } from "../firebase";
import { ref, uploadBytes } from "firebase/storage";
import { comprimirImagen } from "./comprimirImagen";
import { normalizarCedula } from "../constants";

/**
 * Comprime y sube la foto de un usuario a `votantes_fotos/{cedulaSinGuiones}.jpg`.
 *
 * @param {File} file   Archivo de imagen elegido por el usuario.
 * @param {string} cedula Cédula del usuario (con o sin guiones). Debe tener 11
 *   dígitos; de lo contrario lanza (no se puede nombrar el archivo).
 * @returns {Promise<{ fotoPath: string }>} Ruta en Storage donde quedó la foto.
 *   El caller decide si la persiste en el doc de Firestore.
 * @throws {Error} Si la cédula no es válida o falla la subida a Storage.
 */
export async function subirFotoUsuario(file, cedula) {
  if (!file) {
    throw new Error("No se proporcionó ningún archivo de imagen.");
  }

  const cleanCedula = normalizarCedula(cedula);
  if (cleanCedula.length !== 11) {
    throw new Error(
      "El usuario debe tener una cédula válida (11 dígitos) para subir la foto."
    );
  }

  // Comprimimos/redimensionamos en el navegador ANTES de subir: las fotos de
  // cámara pesan varios MB y ralentizaban el export a PDF y la carga.
  const comprimida = await comprimirImagen(file);

  const fotoPath = `votantes_fotos/${cleanCedula}.jpg`;
  const storageRef = ref(storage, fotoPath);
  await uploadBytes(storageRef, comprimida);

  return { fotoPath };
}
````

## File: src/logo.svg
````xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 841.9 595.3"><g fill="#61DAFB"><path d="M666.3 296.5c0-32.5-40.7-63.3-103.1-82.4 14.4-63.6 8-114.2-20.2-130.4-6.5-3.8-14.1-5.6-22.4-5.6v22.3c4.6 0 8.3.9 11.4 2.6 13.6 7.8 19.5 37.5 14.9 75.7-1.1 9.4-2.9 19.3-5.1 29.4-19.6-4.8-41-8.5-63.5-10.9-13.5-18.5-27.5-35.3-41.6-50 32.6-30.3 63.2-46.9 84-46.9V78c-27.5 0-63.5 19.6-99.9 53.6-36.4-33.8-72.4-53.2-99.9-53.2v22.3c20.7 0 51.4 16.5 84 46.6-14 14.7-28 31.4-41.3 49.9-22.6 2.4-44 6.1-63.6 11-2.3-10-4-19.7-5.2-29-4.7-38.2 1.1-67.9 14.6-75.8 3-1.8 6.9-2.6 11.5-2.6V78.5c-8.4 0-16 1.8-22.6 5.6-28.1 16.2-34.4 66.7-19.9 130.1-62.2 19.2-102.7 49.9-102.7 82.3 0 32.5 40.7 63.3 103.1 82.4-14.4 63.6-8 114.2 20.2 130.4 6.5 3.8 14.1 5.6 22.5 5.6 27.5 0 63.5-19.6 99.9-53.6 36.4 33.8 72.4 53.2 99.9 53.2 8.4 0 16-1.8 22.6-5.6 28.1-16.2 34.4-66.7 19.9-130.1 62-19.1 102.5-49.9 102.5-82.3zm-130.2-66.7c-3.7 12.9-8.3 26.2-13.5 39.5-4.1-8-8.4-16-13.1-24-4.6-8-9.5-15.8-14.4-23.4 14.2 2.1 27.9 4.7 41 7.9zm-45.8 106.5c-7.8 13.5-15.8 26.3-24.1 38.2-14.9 1.3-30 2-45.2 2-15.1 0-30.2-.7-45-1.9-8.3-11.9-16.4-24.6-24.2-38-7.6-13.1-14.5-26.4-20.8-39.8 6.2-13.4 13.2-26.8 20.7-39.9 7.8-13.5 15.8-26.3 24.1-38.2 14.9-1.3 30-2 45.2-2 15.1 0 30.2.7 45 1.9 8.3 11.9 16.4 24.6 24.2 38 7.6 13.1 14.5 26.4 20.8 39.8-6.3 13.4-13.2 26.8-20.7 39.9zm32.3-13c5.4 13.4 10 26.8 13.8 39.8-13.1 3.2-26.9 5.9-41.2 8 4.9-7.7 9.8-15.6 14.4-23.7 4.6-8 8.9-16.1 13-24.1zM421.2 430c-9.3-9.6-18.6-20.3-27.8-32 9 .4 18.2.7 27.5.7 9.4 0 18.7-.2 27.8-.7-9 11.7-18.3 22.4-27.5 32zm-74.4-58.9c-14.2-2.1-27.9-4.7-41-7.9 3.7-12.9 8.3-26.2 13.5-39.5 4.1 8 8.4 16 13.1 24 4.7 8 9.5 15.8 14.4 23.4zM420.7 163c9.3 9.6 18.6 20.3 27.8 32-9-.4-18.2-.7-27.5-.7-9.4 0-18.7.2-27.8.7 9-11.7 18.3-22.4 27.5-32zm-74 58.9c-4.9 7.7-9.8 15.6-14.4 23.7-4.6 8-8.9 16-13 24-5.4-13.4-10-26.8-13.8-39.8 13.1-3.1 26.9-5.8 41.2-7.9zm-90.5 125.2c-35.4-15.1-58.3-34.9-58.3-50.6 0-15.7 22.9-35.6 58.3-50.6 8.6-3.7 18-7 27.7-10.1 5.7 19.6 13.2 40 22.5 60.9-9.2 20.8-16.6 41.1-22.2 60.6-9.9-3.1-19.3-6.5-28-10.2zM310 490c-13.6-7.8-19.5-37.5-14.9-75.7 1.1-9.4 2.9-19.3 5.1-29.4 19.6 4.8 41 8.5 63.5 10.9 13.5 18.5 27.5 35.3 41.6 50-32.6 30.3-63.2 46.9-84 46.9-4.5-.1-8.3-1-11.3-2.7zm237.2-76.2c4.7 38.2-1.1 67.9-14.6 75.8-3 1.8-6.9 2.6-11.5 2.6-20.7 0-51.4-16.5-84-46.6 14-14.7 28-31.4 41.3-49.9 22.6-2.4 44-6.1 63.6-11 2.3 10.1 4.1 19.8 5.2 29.1zm38.5-66.7c-8.6 3.7-18 7-27.7 10.1-5.7-19.6-13.2-40-22.5-60.9 9.2-20.8 16.6-41.1 22.2-60.6 9.9 3.1 19.3 6.5 28.1 10.2 35.4 15.1 58.3 34.9 58.3 50.6-.1 15.7-23 35.6-58.4 50.6zM320.8 78.4z"/><circle cx="420.9" cy="296.5" r="45.7"/><path d="M520.5 78.1z"/></g></svg>
````

## File: src/reportWebVitals.js
````javascript
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
````

## File: src/setupTests.js
````javascript
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
````

## File: .firebaserc
````
{
  "projects": {
    "default": "politicard-cfd"
  }
}
````

## File: cors.json
````json
[
  {
    "origin": ["http://localhost:3000", "https://www.felixencarnacion.com", "https://felixencarnacion.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Content-Length", "Content-Range", "Content-Encoding", "Accept-Ranges", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
````

## File: RESEND_FRONTEND_INTEGRATION.md
````markdown
# 📧 Integración de Resend en Frontend - PublicRegister

## ✅ Implementación Completada

### Funcionalidades Agregadas:

#### 1. **Envío Directo desde Formulario**
- ✅ Opción para enviar correo de confirmación inmediato
- ✅ Mensaje personalizado opcional
- ✅ Preview de configuración de correo
- ✅ Control granular del usuario

#### 2. **Componente EmailStatus**
- ✅ Modal profesional para mostrar estado del envío
- ✅ Estados: enviando, éxito, error, advertencia
- ✅ Detalles del correo enviado
- ✅ Animaciones y feedback visual
- ✅ Responsive design

#### 3. **Integración con Analytics**
- ✅ Tracking automático de registros de simpatizantes
- ✅ Métricas de correos enviados
- ✅ Seguimiento de conversiones

## 🎯 Flujo de Usuario

### Registro de Simpatizante:
1. **Usuario llena formulario** con datos personales
2. **Ingresa email** → aparecen opciones de correo
3. **Selecciona opciones**:
   - ✅ Enviar correo de confirmación
   - 📝 Mensaje personalizado (opcional)
4. **Envía formulario** → registro en Firestore
5. **Si habilitado** → envío inmediato de correo
6. **Modal de estado** muestra progreso y resultado
7. **Confirmación final** con detalles del envío

## 📨 Opciones de Correo Implementadas

### Configuración Disponible:
```javascript
emailOptions: {
  sendConfirmation: true,    // Enviar correo inmediato
  sendWelcome: true,         // Correo de bienvenida
  customMessage: ""          // Mensaje personalizado
}
```

### Preview en Tiempo Real:
- 📬 **Destinatario**: Muestra email ingresado
- 📝 **Plantilla**: "Bienvenida de Simpatizante"
- 💬 **Mensaje personalizado**: Si está incluido

## 🎨 Componentes Creados

### 1. **EmailStatus.js**
```javascript
<EmailStatus
  isVisible={emailStatus.isVisible}
  status="sending|success|error|warning"
  message="Mensaje descriptivo"
  emailDetails={{
    to: "email@ejemplo.com",
    template: "Bienvenida Simpatizante",
    messageId: "resend_id_123",
    customMessage: "Mensaje personalizado"
  }}
  onClose={() => setEmailStatus({...})}
/>
```

### 2. **Estilos CSS Agregados**
- `.email-options-group` - Contenedor de opciones
- `.email-preview` - Preview de configuración
- `.email-status-*` - Estilos del modal de estado
- Animaciones y transiciones suaves
- Responsive design completo

## 🔧 Funciones Implementadas

### 1. **sendConfirmationEmail()**
```javascript
const sendConfirmationEmail = async (registrationData) => {
  // 1. Validar opciones de correo
  // 2. Mostrar modal "enviando"
  // 3. Llamar a sendCustomEmailCallable
  // 4. Actualizar modal con resultado
  // 5. Tracking de analytics
}
```

### 2. **Estados de Correo**
```javascript
const [emailStatus, setEmailStatus] = useState({
  isVisible: false,
  status: 'info',
  message: '',
  details: {}
});
```

## 🚀 Ventajas de la Implementación

### **Para el Usuario:**
- ✅ **Control total**: Decide si quiere correo inmediato
- ✅ **Personalización**: Puede agregar mensaje propio
- ✅ **Feedback visual**: Ve el progreso del envío
- ✅ **Confirmación clara**: Sabe si el correo se envió

### **Para el Administrador:**
- ✅ **Flexibilidad**: Correos automáticos + manuales
- ✅ **Tracking**: Métricas de todos los envíos
- ✅ **Debugging**: Logs detallados de errores
- ✅ **Escalabilidad**: Fácil agregar más plantillas

### **Técnicas:**
- ✅ **Doble seguridad**: Trigger automático + manual
- ✅ **Manejo de errores**: Graceful degradation
- ✅ **Performance**: No bloquea el registro principal
- ✅ **UX**: Feedback inmediato y claro

## 📊 Casos de Uso

### 1. **Registro Normal**
- Usuario se registra
- ✅ Correo automático (trigger de Firestore)
- ✅ Correo manual (si está habilitado)
- Resultado: Usuario recibe confirmación inmediata

### 2. **Registro con Mensaje Personalizado**
- Usuario agrega mensaje especial
- ✅ Correo incluye mensaje personalizado
- ✅ Experiencia más personal y cercana

### 3. **Registro Sin Correo Inmediato**
- Usuario deshabilita correo manual
- ✅ Solo recibe correo automático del trigger
- ✅ Menos saturación de emails

### 4. **Manejo de Errores**
- Si falla correo manual
- ✅ Registro se completa normalmente
- ✅ Usuario ve error específico
- ✅ Correo automático sigue funcionando

## 🔍 Testing y Validación

### Casos de Prueba:
1. **✅ Registro con correo habilitado**
2. **✅ Registro con mensaje personalizado**
3. **✅ Registro sin correo manual**
4. **✅ Error en envío de correo**
5. **✅ Email inválido**
6. **✅ Conexión perdida durante envío**

### Verificación:
```bash
# Ver logs de correos
firebase functions:log --filter="correo"

# Verificar en Resend Dashboard
# - Emails enviados
# - Tasa de entrega
# - Errores específicos
```

## 🎯 Próximas Mejoras

### Funcionalidades Adicionales:
- [ ] **Plantillas múltiples**: Elegir entre diferentes estilos
- [ ] **Programación**: Enviar correo en horario específico
- [ ] **Seguimiento**: Ver si el correo fue abierto
- [ ] **Reenvío**: Opción de reenviar si falló
- [ ] **Historial**: Ver correos enviados por usuario

### Optimizaciones:
- [ ] **Cache**: Guardar preferencias de correo
- [ ] **Batch**: Envío masivo optimizado
- [ ] **A/B Testing**: Probar diferentes plantillas
- [ ] **Segmentación**: Correos por zona geográfica

## 📝 Notas de Implementación

### **Archivos Modificados:**
- `src/components/PublicRegister.js` - Lógica principal
- `src/components/PublicRegister.css` - Estilos de opciones

### **Archivos Creados:**
- `src/components/EmailStatus.js` - Modal de estado
- `src/components/EmailStatus.css` - Estilos del modal

### **Dependencias:**
- `useAnalytics` hook para tracking
- `sendCustomEmail` Firebase Function
- Plantillas de Resend existentes

### **Configuración Requerida:**
- ✅ API Key de Resend configurada
- ✅ Funciones de Firebase desplegadas
- ✅ Plantillas de correo creadas
- ✅ Analytics configurado

---

## ✅ Estado Final

**Implementación**: ✅ **Completa y funcional**
**Testing**: ✅ **Listo para pruebas**
**Documentación**: ✅ **Completa**
**UX/UI**: ✅ **Profesional y responsive**

La integración de Resend en el frontend está **completamente implementada** y lista para usar. Los usuarios ahora tienen control total sobre los correos que reciben, con feedback visual profesional y manejo robusto de errores.
````

## File: RESEND_IMPLEMENTATION_SUMMARY.md
````markdown
# 📧 Implementación de Resend - Resumen Completo

## ✅ Estado de la Implementación

### Archivos Creados/Modificados:

1. **`functions/emailTemplates.js`** ✅
   - Plantillas HTML profesionales para todos los tipos de correo
   - Diseño responsive con branding FE28
   - 4 plantillas: simpatizante, usuario, reset password, notificaciones

2. **`functions/index.js`** ✅ (Modificado)
   - Migrado de Nodemailer a Resend
   - Nuevas funciones de correo implementadas
   - Triggers automáticos configurados

3. **`functions/package.json`** ✅ (Actualizado)
   - Resend instalado (v6.12.3)
   - Nodemailer mantenido por compatibilidad

4. **`src/components/EmailTest.js`** ✅
   - Componente React para probar correos
   - Interfaz amigable para testing

5. **`src/components/EmailTest.css`** ✅
   - Estilos para el componente de pruebas

6. **`functions/RESEND_SETUP.md`** ✅
   - Documentación completa de configuración

7. **`setup-resend.bat`** ✅
   - Script automatizado para Windows

## 🔧 Funciones Implementadas

### 1. Correos Automáticos

#### Para Simpatizantes:
```javascript
exports.sendWelcomeEmailToSimpatizante
```
- **Trigger**: Creación de documento en `simpatizantes/`
- **Plantilla**: Mensaje de bienvenida al movimiento
- **Contenido**: Información sobre propuestas y participación

#### Para Usuarios:
```javascript
exports.sendWelcomeEmailToUser
```
- **Trigger**: Creación de documento en `users/`
- **Plantilla**: Información sobre rol y acceso al dashboard
- **Contenido**: Credenciales y funcionalidades disponibles

#### Para Registro por Auth Provider:
```javascript
exports.createProfileForProvider (modificado)
```
- **Trigger**: Registro con Google/Apple
- **Acción**: Crea perfil + envía correo de bienvenida

#### Para Usuarios Creados por Admin:
```javascript
exports.createUserAdmin (modificado)
```
- **Trigger**: Creación manual de usuario
- **Acción**: Crea usuario + envía correo de bienvenida

### 2. Correos Personalizados

#### Función Callable:
```javascript
exports.sendCustomEmail
```
- **Uso**: Desde frontend con `httpsCallable`
- **Plantillas**: Todas las disponibles
- **Parámetros**: Destinatario, asunto, plantilla, datos

## 📨 Plantillas de Correo

### 1. Bienvenida Simpatizante (`simpatizante_welcome`)
- **Asunto**: "¡Bienvenido al movimiento FE28! 🇩🇴"
- **Contenido**: 
  - Mensaje de bienvenida personal
  - Información sobre próximos pasos
  - Enlace a propuestas
  - Call-to-action para participar

### 2. Bienvenida Usuario (`user_welcome`)
- **Asunto**: "¡Bienvenido al equipo FE28! 🚀"
- **Contenido**:
  - Detalles de la cuenta (email, rol)
  - Funcionalidades disponibles
  - Enlace al dashboard
  - Información de soporte

### 3. Recuperación de Contraseña (`password_reset`)
- **Asunto**: "Restablecer contraseña - FE28"
- **Contenido**:
  - Enlace seguro para reset
  - Instrucciones de seguridad
  - Tiempo de expiración

### 4. Notificación de Meta (`goal_notification`)
- **Asunto**: "Progreso de tu meta - FE28"
- **Contenido**:
  - Resumen de progreso
  - Porcentaje completado
  - Motivación y próximos pasos

## 🎨 Características de Diseño

### Elementos Visuales:
- ✅ Header con imagen de campaña
- ✅ Colores corporativos (#004d99, gradientes)
- ✅ Tipografía profesional (Segoe UI)
- ✅ Botones con efectos hover
- ✅ Footer con imagen y enlaces sociales
- ✅ Responsive design para móviles

### Branding:
- ✅ Logo y colores de FE28
- ✅ Firma de Félix Encarnación
- ✅ Información de contacto
- ✅ Enlaces a redes sociales
- ✅ Mensaje de unsubscribe

## 🚀 Próximos Pasos para Activar

### 1. Configurar API Key de Resend:
```bash
firebase functions:secrets:set RESEND_API_KEY
```

### 2. Verificar Dominio (Recomendado):
- Registrar dominio en Resend Dashboard
- Configurar DNS (SPF, DKIM, DMARC)
- Cambiar `from: 'notificaciones@felixencarnacion.com'` por tu dominio

### 3. Desplegar Funciones:
```bash
firebase deploy --only functions
```

### 4. Probar Implementación:
- Usar componente `EmailTest` para pruebas
- Registrar simpatizante de prueba
- Crear usuario de prueba
- Verificar logs: `firebase functions:log`

## 🔍 Testing y Verificación

### Casos de Prueba:

1. **Registro de Simpatizante**:
   ```javascript
   // Se ejecuta automáticamente al crear simpatizante
   // Verifica: correo llega, plantilla correcta, imágenes cargan
   ```

2. **Registro de Usuario**:
   ```javascript
   // Se ejecuta automáticamente al crear usuario
   // Verifica: información de rol, enlaces funcionan
   ```

3. **Correo Personalizado**:
   ```javascript
   const sendCustomEmail = httpsCallable(functions, 'sendCustomEmail');
   await sendCustomEmail({
     to: 'test@ejemplo.com',
     subject: 'Prueba',
     template: 'user_welcome',
     data: { nombre: 'Juan', email: 'juan@test.com', rol: 'coordinador' }
   });
   ```

### Monitoreo:
```bash
# Ver logs en tiempo real
firebase functions:log --only sendWelcomeEmailToSimpatizante,sendWelcomeEmailToUser

# Ver logs específicos de correos
firebase functions:log --filter="correo"
```

## 📊 Métricas y Analytics

### Dashboard de Resend:
- Emails enviados/entregados
- Tasa de apertura
- Bounces y quejas
- Reputación del dominio

### Logs de Firebase:
- Éxito/error de envíos
- Message IDs para tracking
- Errores de configuración

## 🔧 Troubleshooting Común

### Error: "API Key not found"
```bash
firebase functions:secrets:access RESEND_API_KEY
firebase functions:secrets:set RESEND_API_KEY
```

### Error: "Domain not verified"
- Usar dominio de prueba temporalmente
- Verificar registros DNS
- Esperar propagación (24h)

### Correos no llegan:
1. Revisar carpeta spam
2. Verificar logs de Firebase
3. Comprobar dashboard de Resend
4. Validar email del destinatario

## 💡 Mejoras Futuras

### Funcionalidades Adicionales:
- [ ] Correos de seguimiento automático
- [ ] Plantillas para eventos especiales
- [ ] Notificaciones de metas alcanzadas
- [ ] Newsletter periódico
- [ ] Correos de recordatorio de actividad

### Optimizaciones:
- [ ] A/B testing de plantillas
- [ ] Personalización por zona geográfica
- [ ] Segmentación por rol de usuario
- [ ] Métricas avanzadas de engagement

## 📝 Notas Importantes

- **Límites**: Plan gratuito de Resend (100 emails/día)
- **Dominio**: Verificar dominio mejora deliverability significativamente
- **Backup**: Funciones de Nodemailer comentadas como respaldo
- **Logs**: Siempre revisar logs para debugging
- **Testing**: Usar EmailTest component antes de producción

---

## ✅ Checklist de Implementación

- [x] Instalar Resend
- [x] Crear plantillas HTML
- [x] Migrar funciones de correo
- [x] Configurar triggers automáticos
- [x] Crear función callable personalizada
- [x] Desarrollar componente de testing
- [x] Documentar configuración
- [x] Crear scripts de setup
- [ ] Configurar API Key de Resend
- [ ] Verificar dominio personalizado
- [ ] Desplegar a producción
- [ ] Probar todos los flujos
- [ ] Monitorear métricas iniciales

**Estado**: ✅ Implementación completa - Lista para configuración y despliegue
````

## File: storage.rules
````
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Aplica a todos los archivos en el almacenamiento
    match /{allPaths=**} {
      // 1. PERMITIR LECTURA:
      // Opción A (Segura): Solo usuarios que han iniciado sesión pueden ver las fotos
      allow read: if request.auth != null;

      // Opción B (Pública - Solo para probar si falla la autenticación):
      // allow read: if true; 

      // 2. PERMITIR ESCRITURA:
      // Solo usuarios autenticados pueden subir archivos
      allow write: if request.auth != null;
    }
  }
}
````

## File: functions/package.json
````json
{
  "name": "functions",
  "description": "Cloud Functions for Firebase",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "22"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^6.0.1",
    "nodemailer": "^7.0.9",
    "resend": "^6.12.3"
  },
  "devDependencies": {
    "eslint": "^8.15.0",
    "eslint-config-google": "^0.14.0",
    "firebase-functions-test": "^3.1.0"
  },
  "private": true
}
````

## File: src/components/dashboard/MyRegistrations.js
````javascript
import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import * as XLSX from "xlsx"; // Librería de Excel
import { FaFileExcel } from "react-icons/fa"; // Icono para el botón

// Este componente recibe el usuario actual para saber a quién buscar
function MyRegistrations({ user }) {
  const [registrations, setRegistrations] = useState([]); // Estado para guardar los datos completos
  const [loading, setLoading] = useState(true);

  // Conteo de registros para la visualización
  const count = useMemo(() => registrations.length, [registrations]);

  useEffect(() => {
    if (!user || !user.uid) return;

    const simpatizantesRef = collection(db, "simpatizantes");
    // Consulta: trae solo los registros hechos por el usuario actual
    const q = query(simpatizantesRef, where("registradoPor", "==", user.uid));

    // Escucha de cambios en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRegistrations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Función de EXPORTACIÓN A EXCEL
  const handleExport = () => {
    if (registrations.length === 0) {
      alert("No hay registros para exportar.");
      return;
    }

    // Mapear los datos para crear un formato limpio para el Excel
    const dataToExport = registrations.map((reg) => ({
      Nombre: reg.nombre || "N/A",
      Cedula: reg.cedula || "N/A",
      Telefono: reg.telefono || "N/A",
      Zona: reg.zona || "N/A",
      Sector: reg.sector || "N/A",
      Subsector: reg.subsector || "N/A",
      Recinto: reg.recinto || "N/A",
      Colegio: reg.colegioElectoral || "N/A",
      // Convertir el timestamp de Firestore a una cadena de fecha legible
      FechaRegistro: reg.timestamp
        ? new Date(reg.timestamp.toDate()).toLocaleDateString()
        : "N/A",
    }));

    // Crear la hoja de cálculo, el libro de trabajo y descargar
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MisRegistros");

    // Construir el nombre del archivo
    const userNameClean = (user.nombre || 'usuario').replace(/\s/g, "_");
    const dateStamp = new Date().toLocaleDateString("es-DO").replace(/\//g, "-");
    const fileName = `Mis_Registros_${userNameClean}_${dateStamp}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);

    alert(`Se han exportado ${registrations.length} registros.`);
  };

  return (
    <div className="metric-card my-registrations-card">
      <div className="metric-card-header">
        <h3>Mis Registros Personales</h3>
        <button
          onClick={handleExport}
          className="export-metric-button"
          disabled={loading || count === 0}
          title="Exportar mis registros a Excel"
        >
          <FaFileExcel />
        </button>
      </div>
      {loading ? (
        <p className="metric-value">...</p>
      ) : (
        <p className="metric-value">{count}</p>
      )}
    </div>
  );
}

export default MyRegistrations;
````

## File: src/components/pages/Login.js
````javascript
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, functions } from "../../firebase"; // Importamos functions
import { httpsCallable } from "firebase/functions"; // Importamos httpsCallable
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

// Función auxiliar simple
const isEmail = (input) => input.includes("@");

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let userEmailForAuth = "";
    const inputLimpio = identifier.trim();

    try {
      // 1. ESTRATEGIA DE IDENTIFICACIÓN
      if (isEmail(inputLimpio)) {
        // A) Es un correo: lo usamos directamente
        userEmailForAuth = inputLimpio;
      } else {
        // B) Es una Cédula: Preguntamos a la Cloud Function por el correo
        try {
          // Llamamos a la función que ya tienes en index.js
          const getEmailFn = httpsCallable(functions, "getEmailByCedula");
          const result = await getEmailFn({ cedula: inputLimpio });

          if (result.data.success) {
            userEmailForAuth = result.data.email;
            console.log("Email recuperado:", userEmailForAuth);
          } else {
            throw new Error("Cédula no encontrada");
          }
        } catch (lookupError) {
          console.warn("Fallo búsqueda por cédula:", lookupError);
          setError(
            "No encontramos un usuario con esta cédula. Verifica que esté escrita correctamente."
          );
          setLoading(false);
          return; // Detenemos el proceso aquí
        }
      }

      // 2. AUTENTICACIÓN (Login con el correo resuelto)
      await signInWithEmailAndPassword(auth, userEmailForAuth, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error al iniciar sesión:", err);

      // Manejo de errores específicos
      if (err.message === "Cédula no encontrada") {
        setError("Esa cédula no está registrada en el sistema.");
      } else if (err.code === "auth/wrong-password") {
        setError("La contraseña es incorrecta.");
      } else if (err.code === "auth/user-not-found") {
        setError("Usuario no encontrado.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Muchos intentos fallidos. Intenta más tarde.");
      } else {
        setError("Error al iniciar sesión. Inténtalo de nuevo.");
      }
    } finally {
      // Solo desactivamos loading si falló, si tuvo éxito el navigate cambia de página
      if (!window.location.pathname.includes("/dashboard")) {
        setLoading(false);
      }
    }
  };

  // --- Login con Google ---
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // No navegamos manualmente: AuthContext detecta la sesión y
      // PublicOnlyRoute redirige a /dashboard automáticamente.
    } catch (err) {
      // Mostramos el código real de Firebase para poder diagnosticar.
      console.error("Error Google Login:", err.code, err.message);

      switch (err.code) {
        case "auth/popup-closed-by-user":
        case "auth/cancelled-popup-request":
          // El usuario cerró el popup: no es un error real.
          break;
        case "auth/operation-not-allowed":
          setError(
            "El acceso con Google no está habilitado en Firebase (Authentication → Sign-in method)."
          );
          break;
        case "auth/unauthorized-domain":
          setError(
            "Este dominio no está autorizado en Firebase (Authentication → Settings → Authorized domains)."
          );
          break;
        case "auth/popup-blocked":
          // El navegador o la cabecera COOP bloqueó el popup: caemos a redirección.
          try {
            await signInWithRedirect(auth, provider);
            return;
          } catch (redirectErr) {
            console.error("Error Google redirect:", redirectErr.code);
            setError("No se pudo abrir la ventana de Google.");
          }
          break;
        default:
          setError(`No se pudo iniciar sesión con Google. (${err.code})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Acceso de Miembros</h2>
        {error && <p className="error-message">{error}</p>}

        <div className="input-group">
          <label htmlFor="identifier">Correo Electrónico o Cédula</label>
          <input
            type="text"
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={loading}
            placeholder="Ej. juan@gmail.com o 001002..."
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </div>

        <div className="divider">O entra con</div>

        <div className="input-group">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-google"
          >
            <img
              src="https://img.icons8.com/color/48/000000/google-logo.png"
              alt="Google"
              className="google-icon"
            />
            Google
          </button>
        </div>

        <div className="extra-links">
          <p>
            ¿No tienes cuenta? <Link to="/registro-app">Regístrate aquí</Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Login;
````

## File: src/components/pages/SignUp.js
````javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ROL_MULTIPLICADOR, normalizarCedula } from '../../constants';

const CEDULA_DOMAIN = '@cedula.temp';
const MIN_PASSWORD_LENGTH = 6;
// Asumo que la cédula debe ser solo números (ajustar si es necesario)
const CEDULA_REGEX = /^\d+$/; 
const CEDULA_LENGTH = 11; // Longitud típica de una cédula dominicana

function SignUp() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const trimmedCedula = cedula.trim();
    const trimmedEmail = email.trim();
    
    // ===========================================
    // 1. VALIDACIÓN INICIAL Y PRE-PROCESAMIENTO
    // ===========================================
    
    // Validación de la Contraseña
    if (password.length < MIN_PASSWORD_LENGTH) {
      alert(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      setLoading(false);
      return;
    }

    let authEmail = trimmedEmail;

    if (trimmedCedula) {
      // 1.1. Validar formato de Cédula si se proporciona
      if (!CEDULA_REGEX.test(trimmedCedula) || trimmedCedula.length !== CEDULA_LENGTH) {
        alert('Por favor, ingresa un Número de Cédula válido (solo números y 11 dígitos).');
        setLoading(false);
        return;
      }
      // 1.2. Usar Cédula para Auth
      authEmail = trimmedCedula + CEDULA_DOMAIN; 
    } else if (!trimmedEmail) {
      // 1.3. Asegurar que al menos un campo de login se llenó
      alert('Debes proporcionar un Correo Electrónico o un Número de Cédula.');
      setLoading(false);
      return;
    }

    try {
      // ===========================================
      // 2. FIREBASE AUTHENTICATION
      // ===========================================

      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
      const user = userCredential.user;

      // ===========================================
      // 3. FIRESTORE: CREACIÓN DE PERFIL DE USUARIO
      // ===========================================
      
      const userData = {
        uid: user.uid,
        nombre: nombre,
        // Almacenamos el email utilizado para la autenticación
        email: authEmail,
        // Cédula normalizada (solo dígitos) en el campo estándar `cedula`,
        // el mismo que consultan el login y el resto de la app.
        cedula: trimmedCedula ? normalizarCedula(trimmedCedula) : null,
        rol: ROL_MULTIPLICADOR,
        createdAt: new Date(), // Buena práctica: añadir timestamp
      };

      await setDoc(doc(db, "users", user.uid), userData);

      alert('¡Registro exitoso! Serás redirigido al panel.');
      navigate('/dashboard'); 

    } catch (error) {
      console.error("Error en el registro:", error.code, error.message);
      
      // Mapeo de errores de Firebase Auth a mensajes amigables
      let userMessage = 'Ocurrió un error al registrar. Por favor, inténtalo de nuevo.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          // Este error cubre tanto el correo real como la cédula sintética
          userMessage = 'Esa cuenta (correo o cédula) ya está registrada. Intenta Iniciar Sesión.';
          break;
        case 'auth/weak-password':
          userMessage = 'Contraseña débil. Por favor, elige una contraseña más segura (mínimo 6 caracteres).';
          break;
        case 'auth/invalid-email':
          // Esto puede ocurrir si el 'authEmail' (cedula + dominio) falla la validación interna de Firebase
          userMessage = 'El formato de correo/cédula es inválido. Por favor, verifica tu entrada.';
          break;
        default:
          userMessage = `Error desconocido: ${error.message}`;
          break;
      }

      alert(`Error: ${userMessage}`);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSignUp}>
        <h2>Crear Cuenta de Activista</h2>
        <div className="input-group">
          <label htmlFor="nombre">Nombre Completo</label>
          {/* Se añade el campo nombre como requerido para la metadata de Firestore */}
          <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        
        <div className="input-group">
          <label htmlFor="email">Correo Electrónico (Opcional)</label>
          <input 
            type="email" 
            id="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        <div className="input-group">
          <label htmlFor="cedula">Número de Cédula (Opcional)</label>
          {/* Se sugiere tipo 'tel' para móviles, pero 'text' es más flexible para la validación */}
          <input 
            type="text" 
            inputMode="numeric" // Mejora la UX en móvil
            pattern="\d*" // Ayuda a la validación del navegador, aunque se hace manualmente en JS
            maxLength={CEDULA_LENGTH}
            id="cedula" 
            value={cedula} 
            onChange={(e) => setCedula(e.target.value)} 
          />
        </div>
        <p className="hint">Puedes registrarte usando tu Correo **o** tu Cédula. Asegúrate de que el número sea correcto.</p>

        <div className="input-group">
          <label htmlFor="password">Contraseña (mínimo {MIN_PASSWORD_LENGTH} caracteres)</label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={MIN_PASSWORD_LENGTH} // HTML5 validation fallback
          />
        </div>
        <button type="submit" disabled={loading || !nombre || !(email || cedula) || !password}>
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>
    </div>
  );
}

export default SignUp;
````

## File: src/components/ui/UbicacionElectoralFields.js
````javascript
import React from "react";
import {
  OPCION_NO_IDENTIFICADO,
  OPCION_OTRO,
  ZONA_FIJA,
  SECTOR_FIJO,
  getSubsectores,
  getRecintos,
  getColegios,
} from "../../data/ubicacionElectoral";

/**
 * Campos de ubicación electoral en cascada de 5 niveles, en orden fijo:
 *   Zona → Sector → Subsector → Recinto → Colegio Electoral
 *
 * Contrato (estado controlado por el padre):
 *   props:
 *     value = { zona, sector, subsector, recinto, colegioElectoral }
 *     onChange(campo, valor)   -> el padre actualiza value[campo]
 *     disabled                 -> deshabilita los selects editables
 *
 * IMPORTANTE (resets, los hará el padre en la Fase 2):
 *   Colegio Electoral está encadenado a Recinto. Cuando el padre reciba un
 *   onChange("recinto", ...) DEBE resetear "colegioElectoral" (a "" o a
 *   OPCION_NO_IDENTIFICADO), porque las opciones de colegio dependen del
 *   recinto elegido. Sector y Subsector NO dependen de Recinto: son ramas
 *   independientes y no requieren reset al cambiar Recinto.
 *
 * La opción "No identificado" es un valor SELECCIONABLE y válido (distinto del
 * placeholder vacío inicial), presente en Sector, Subsector, Recinto y Colegio.
 *
 * SUBSECTOR "Otro" (texto libre): además del catálogo y "No identificado", el
 * subsector ofrece "Otro". El estado vive en el padre mediante DOS campos:
 *   - subsectorEsOtro (bool): si la opción activa es "Otro".
 *   - subsector (string): cuando esOtro, guarda el texto libre TAL CUAL se
 *     escribe; en otro caso, el valor del catálogo o "No identificado".
 * Hacia el payload solo sale `subsector` con el valor final (el padre normaliza
 * el texto libre con normalizarSubsector al enviar). El centinela OPCION_OTRO
 * es solo el value del <option>: nunca se persiste.
 */
function UbicacionElectoralFields({ value, onChange, disabled }) {
  const {
    zona = ZONA_FIJA,
    sector = "",
    subsector = "",
    subsectorEsOtro = false,
    recinto = "",
    colegioElectoral = "",
  } = value || {};

  // Al elegir en el select de subsector: "Otro" activa el texto libre (y limpia
  // el campo para empezar en blanco); cualquier otra opción desactiva "Otro".
  const handleSubsectorSelect = (e) => {
    const v = e.target.value;
    if (v === OPCION_OTRO) {
      onChange("subsectorEsOtro", true);
      onChange("subsector", "");
    } else {
      onChange("subsectorEsOtro", false);
      onChange("subsector", v);
    }
  };

  const subsectores = getSubsectores(zona, sector);
  const recintos = getRecintos(zona);
  // Encadenado a Recinto: sin recinto elegido (vacío o "No identificado"),
  // solo se permite "No identificado" como colegio.
  const hayRecinto = recinto && recinto !== OPCION_NO_IDENTIFICADO;
  const colegios = hayRecinto ? getColegios(zona, recinto) : [];

  return (
    <>
      {/* Zona: bloqueada, sin opción "No identificado". */}
      <div className="input-group">
        <label htmlFor="ubic-zona">Zona</label>
        <select id="ubic-zona" value={zona} disabled={true}>
          <option value={ZONA_FIJA}>{ZONA_FIJA}</option>
        </select>
      </div>

      {/* Sector: único por ahora (fijo en SECTOR_FIJO), pero editable/required. */}
      <div className="input-group">
        <label htmlFor="ubic-sector">Sector</label>
        <select
          id="ubic-sector"
          value={sector}
          onChange={(e) => onChange("sector", e.target.value)}
          required
          disabled={disabled}
        >
          <option value="">-- Selecciona --</option>
          <option value={SECTOR_FIJO}>{SECTOR_FIJO}</option>
          <option value={OPCION_NO_IDENTIFICADO}>{OPCION_NO_IDENTIFICADO}</option>
        </select>
      </div>

      {/* Subsector: catálogo + "Otro" (texto libre) + "No identificado". */}
      <div className="input-group">
        <label htmlFor="ubic-subsector">Subsector</label>
        <select
          id="ubic-subsector"
          value={subsectorEsOtro ? OPCION_OTRO : subsector}
          onChange={handleSubsectorSelect}
          required
          disabled={disabled}
        >
          <option value="">-- Selecciona --</option>
          {subsectores.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value={OPCION_OTRO}>Otro</option>
          <option value={OPCION_NO_IDENTIFICADO}>{OPCION_NO_IDENTIFICADO}</option>
        </select>
        {/* Texto libre cuando la opción activa es "Otro". Se normaliza (mayúsculas,
            sin espacios sobrantes) en el submit del padre. La validación de vacío
            también vive en el submit, para mostrar la notificación del formulario. */}
        {subsectorEsOtro && (
          <input
            type="text"
            id="ubic-subsector-otro"
            placeholder="Escribe el subsector"
            value={subsector}
            onChange={(e) => onChange("subsector", e.target.value)}
            disabled={disabled}
          />
        )}
      </div>

      {/* Recinto: centros de la zona + "No identificado". */}
      <div className="input-group">
        <label htmlFor="ubic-recinto">Recinto</label>
        <select
          id="ubic-recinto"
          value={recinto}
          onChange={(e) => onChange("recinto", e.target.value)}
          required
          disabled={disabled}
        >
          <option value="">-- Selecciona --</option>
          {recintos.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
          <option value={OPCION_NO_IDENTIFICADO}>{OPCION_NO_IDENTIFICADO}</option>
        </select>
      </div>

      {/* Colegio Electoral: padrones del recinto + "No identificado".
          Encadenado a Recinto: sin recinto, solo "No identificado". */}
      <div className="input-group">
        <label htmlFor="ubic-colegio">Colegio Electoral</label>
        <select
          id="ubic-colegio"
          value={colegioElectoral}
          onChange={(e) => onChange("colegioElectoral", e.target.value)}
          required
          disabled={disabled}
        >
          <option value="">-- Selecciona --</option>
          {colegios.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={OPCION_NO_IDENTIFICADO}>{OPCION_NO_IDENTIFICADO}</option>
        </select>
      </div>
    </>
  );
}

export default UbicacionElectoralFields;
````

## File: src/data/ubicacionElectoral.js
````javascript
import zonas from "./zonas.json";
import sectores from "./sectores.json";

/** Última opción de los selectores cuando no se puede ubicar al simpatizante. */
export const OPCION_NO_IDENTIFICADO = "No identificado";

/**
 * Valor CENTINELA (solo UI) de la opción "Otro" del subsector. Nunca se guarda
 * en el payload: cuando está activa, el subsector efectivo es el texto libre
 * que el usuario escribe (normalizado con normalizarSubsector al enviar).
 */
export const OPCION_OTRO = "__OTRO__";

/**
 * Normaliza un subsector escrito a mano al estilo del catálogo: sin espacios
 * sobrantes (trim + colapso de espacios internos) y en MAYÚSCULAS.
 * @param {string} str
 * @returns {string}
 */
export function normalizarSubsector(str) {
  return String(str || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/** Zona y sector fijos por ahora (a la espera de poblar el resto). */
export const ZONA_FIJA = "ZONA N";
export const SECTOR_FIJO = "Hato Nuevo";

/** Todas las zonas de zonas.json, ordenadas alfabéticamente. */
export const LISTA_ZONAS = zonas
  .map((z) => z.zona)
  .sort((a, b) => a.localeCompare(b));

/** Devuelve los nombres de los centros/recintos de una zona. */
export function getRecintos(zona) {
  const z = zonas.find((item) => item.zona === zona);
  if (!z) return [];
  return z.centros.map((c) => c.nombre);
}

/**
 * Devuelve los colegios (padrones) de un recinto, limpiando la extensión
 * de archivo (ej. "1221.pdf" -> "1221").
 */
export function getColegios(zona, recinto) {
  const z = zonas.find((item) => item.zona === zona);
  if (!z) return [];
  const centro = z.centros.find((c) => c.nombre === recinto);
  if (!centro) return [];
  return centro.padrones.map((p) =>
    p.replace(/(\.pdf|\.xlsx|\.xls)/gi, "").trim()
  );
}

/** Devuelve los sectores de una zona según sectores.json. */
export function getSectores(zona) {
  const z = sectores.find((item) => item.zona === zona);
  if (!z) return [];
  return z.sectores.map((s) => s.sector);
}

/** Devuelve los subsectores de un sector dentro de una zona. */
export function getSubsectores(zona, sector) {
  const z = sectores.find((item) => item.zona === zona);
  if (!z) return [];
  const s = z.sectores.find((item) => item.sector === sector);
  if (!s) return [];
  return s.subsectores;
}
````

## File: src/data/zonas.json
````json
[
  {
    "zona": "ZONA A1",
    "centros": [
      {
        "nombre": "00457 - CENTRO COMUNAL EL CAFÉ",
        "padrones": [
          "1312A.pdf",
          "1644.pdf",
          "1690.pdf",
          "1738.pdf",
          "1788.pdf",
          "1846.pdf",
          "1866.pdf"
        ]
      },
      {
        "nombre": "00512 - ESCUELA BASICA CAFÉ CON LECHE",
        "padrones": ["1746.pdf", "1795.pdf", "1838.pdf", "1881.pdf"]
      },
      {
        "nombre": "00545 - LICEO CARMEN LUISA DE LOS SANTOS",
        "padrones": [
          "1260.pdf",
          "1260A.pdf",
          "1260B.pdf",
          "1260C.pdf",
          "1261.pdf",
          "1261A.pdf",
          "1312.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA A",
    "centros": [
      {
        "nombre": "00305 - ESC. PRIM. INT. RAFAELA SANTAELLA",
        "padrones": [
          "1256.pdf",
          "1256A.pdf",
          "1256B.pdf",
          "1256C.pdf",
          "1256D.pdf",
          "1256E.pdf",
          "1259.pdf",
          "1259A.pdf",
          "1259B.pdf",
          "1259C.pdf"
        ]
      },
      {
        "nombre": "00520 - COLEGIO EVANGELICO SHALOM",
        "padrones": ["1798.pdf", "1827.pdf", "1885.pdf", "1912.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA B",
    "centros": [
      {
        "nombre": "00260 - CLINICA DIAZ PIÑEYRO",
        "padrones": ["1250.pdf", "1250A.pdf", "1250B.pdf"]
      },
      {
        "nombre": "00261 - ESC. P. NTRA. SRA. DE LA ALTAGRACIA",
        "padrones": [
          "1252.pdf",
          "1252A.pdf",
          "1252B.pdf",
          "1252C.pdf",
          "1252D.pdf",
          "1254.pdf",
          "1254A.pdf",
          "1254B.pdf",
          "1255.pdf",
          "1255A.pdf",
          "1255B.pdf",
          "1311.pdf",
          "1311A.pdf",
          "1311B.pdf",
          "1334.pdf",
          "1334A.pdf",
          "1334B.pdf",
          "1643.pdf",
          "1643A.pdf",
          "1643B.pdf"
        ]
      },
      {
        "nombre": "00262 - PARROQUIA NTRA.SRA. DE LA ALTAGRACIA",
        "padrones": ["1251.pdf", "1251A.pdf", "1251B.pdf"]
      },
      {
        "nombre": "00417 - CENTRO DE ESTUDIOS PENIEL",
        "padrones": [
          "1380.pdf",
          "1380A.pdf",
          "1380B.pdf",
          "1380C.pdf",
          "1821.pdf",
          "1861.pdf"
        ]
      },
      {
        "nombre": "00458 - COLEGIO MAXIMO GOMEZ",
        "padrones": ["1691.pdf", "1764.pdf", "1789.pdf", "1823.pdf", "1867.pdf"]
      },
      {
        "nombre": "00517 - SALON PARROQUIAL",
        "padrones": ["1778.pdf", "1883.pdf"]
      },
      {
        "nombre": "00523 - POLITECNICO TURISTICO CENTRO PARROQUIAL SANTO SOCORRO",
        "padrones": ["1253.pdf", "1253A.pdf", "1801.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA C",
    "centros": [
      {
        "nombre": "00357 - ESC. PRIM. E INTERMEDIA ESTEBAN MARTINEZ",
        "padrones": [
          "1241.pdf",
          "1241A.pdf",
          "1241B.pdf",
          "1242.pdf",
          "1242A.pdf",
          "1242B.pdf",
          "1640.pdf",
          "1751.pdf",
          "1844.pdf",
          "1850.pdf"
        ]
      },
      {
        "nombre": "00488 - ESCUELA PRIMARIA VILLA NAZARET",
        "padrones": ["1699.pdf", "1716.pdf", "1770.pdf", "1842.pdf", "1872.pdf"]
      },
      {
        "nombre": "00498 - COLEGIO GREGORIO LUPERON",
        "padrones": ["1719.pdf", "1773.pdf", "1876.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA D",
    "centros": [
      {
        "nombre": "00306 - ESCUELA CAMILA HENRIQUEZ",
        "padrones": [
          "1258.pdf",
          "1258A.pdf",
          "1258B.pdf",
          "1258C.pdf",
          "1258D.pdf",
          "1258E.pdf",
          "1258F.pdf",
          "1646.pdf",
          "1646A.pdf",
          "1816.pdf"
        ]
      },
      {
        "nombre": "00522 - CENTRO DE ESTUDIO HUERTO DEL EDEN",
        "padrones": ["1726.pdf", "1800.pdf", "1886.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA E",
    "centros": [
      {
        "nombre": "00264 - COLEGIO AMERICO LUGO",
        "padrones": [
          "1244.pdf",
          "1244A.pdf",
          "1244B.pdf",
          "1244C.pdf",
          "1245.pdf",
          "1245A.pdf"
        ]
      },
      {
        "nombre": "00354 - COLEGIO EL BUEN PASTOR",
        "padrones": [
          "1238.pdf",
          "1238A.pdf",
          "1238B.pdf",
          "1239.pdf",
          "1239A.pdf",
          "1239B.pdf"
        ]
      },
      {
        "nombre": "00355 - COLEGIO HORA DE DIOS",
        "padrones": [
          "1240.pdf",
          "1240A.pdf",
          "1240B.pdf",
          "1308.pdf",
          "1308A.pdf",
          "1308B.pdf",
          "1750.pdf",
          "1817.pdf"
        ]
      },
      {
        "nombre": "00500 - COLEGIO ADVENTISTA BETEL",
        "padrones": ["1721.pdf", "1774.pdf", "1826.pdf", "1877.pdf"]
      },
      {
        "nombre": "00535 - ESCUELA PRIMARIA LOS AMIGUITOS",
        "padrones": ["1720.pdf", "1735.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA F",
    "centros": [
      {
        "nombre": "00366 - ESCUELA PRIMARIA NICOLAS UREÑA DE MENDOZA",
        "padrones": [
          "1217.pdf",
          "1217A.pdf",
          "1218.pdf",
          "1218A.pdf",
          "1218B.pdf",
          "1632.pdf",
          "1722.pdf",
          "1756.pdf",
          "1757.pdf",
          "1831.pdf",
          "1857.pdf"
        ]
      },
      {
        "nombre": "00428 - ESCUELA DOÑA FILOMENA CANALDA",
        "padrones": [
          "1364.pdf",
          "1364A.pdf",
          "1364B.pdf",
          "1783.pdf",
          "1862.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA G",
    "centros": [
      {
        "nombre": "00353 - HOSPITAL ZONA NORTE",
        "padrones": [
          "1275.pdf",
          "1275A.pdf",
          "1275B.pdf",
          "1275C.pdf",
          "1345B.pdf",
          "1639.pdf",
          "1807.pdf",
          "1818.pdf",
          "1854.pdf"
        ]
      },
      {
        "nombre": "00363 - ESCUELA PRIMARIA DUARTE",
        "padrones": [
          "1232.pdf",
          "1232A.pdf",
          "1232B.pdf",
          "1233.pdf",
          "1233A.pdf",
          "1345.pdf",
          "1345A.pdf"
        ]
      },
      {
        "nombre": "00430 - ESCUELA PRIMARIA RENOVACION",
        "padrones": [
          "1247.pdf",
          "1247A.pdf",
          "1248.pdf",
          "1248A.pdf",
          "1248B.pdf",
          "1642.pdf"
        ]
      },
      {
        "nombre": "00479 - CENTRO DE ESTUDIO PROGRESO",
        "padrones": ["1680.pdf", "1792.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA H",
    "centros": [
      {
        "nombre": "00360 - ESCUELA BASICA ANTIGUA Y BARBADOS",
        "padrones": [
          "1431.pdf",
          "1431A.pdf",
          "1431B.pdf",
          "1752.pdf",
          "1852.pdf",
          "1900.pdf"
        ]
      },
      {
        "nombre": "00508 - ESCUELA PRIMARIA MADRE TERESA DE CALCUTA",
        "padrones": ["1729.pdf", "1776.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA I",
    "centros": [
      {
        "nombre": "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO",
        "padrones": [
          "1306.pdf",
          "1306A.pdf",
          "1307.pdf",
          "1307A.pdf",
          "1333.pdf",
          "1333A.pdf",
          "1333B.pdf",
          "1357.pdf",
          "1357A.pdf",
          "1357B.pdf",
          "1391.pdf",
          "1391A.pdf",
          "1418.pdf",
          "1418A.pdf",
          "1418B.pdf",
          "1635.pdf",
          "1635A.pdf",
          "1636.pdf",
          "1636A.pdf",
          "1637.pdf"
        ]
      },
      {
        "nombre": "00359 - ESC. PRIMARIA INICIAL Y BASICA BARBADOS",
        "padrones": [
          "1228.pdf",
          "1228A.pdf",
          "1228B.pdf",
          "1229.pdf",
          "1229A.pdf",
          "1229B.pdf",
          "1634.pdf",
          "1634A.pdf",
          "1781.pdf",
          "1851.pdf"
        ]
      },
      {
        "nombre": "00431 - ESCUELA PUBLICA LAS MERCEDES",
        "padrones": [
          "1226.pdf",
          "1226A.pdf",
          "1227.pdf",
          "1227A.pdf",
          "1227B.pdf",
          "1230.pdf",
          "1230A.pdf",
          "1230B.pdf",
          "1784.pdf",
          "1813.pdf"
        ]
      },
      {
        "nombre": "00456 - COLEGIO PSICOEDUCATIVO GESTSMANI",
        "padrones": ["1689.pdf", "1822.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA J",
    "centros": [
      {
        "nombre": "00370 - POLITECNICO DE LAS CAOBAS",
        "padrones": [
          "1271.pdf",
          "1271A.pdf",
          "1271B.pdf",
          "1271C.pdf",
          "1271D.pdf",
          "1271E.pdf",
          "1271F.pdf",
          "1272.pdf",
          "1272A.pdf",
          "1272B.pdf",
          "1272C.pdf",
          "1272D.pdf",
          "1273.pdf",
          "1273A.pdf",
          "1274.pdf",
          "1274A.pdf",
          "1274B.pdf"
        ]
      },
      {
        "nombre": "00477 - UNIVERSIDAD ODONTOLOGICA DOMINICANA",
        "padrones": ["1697.pdf", "1768.pdf", "1871.pdf"]
      },
      {
        "nombre": "00519 - CENTRO EDUCATIVO LOS OLIVOS FE Y ALEGRIA",
        "padrones": ["1797.pdf", "1884.pdf", "1911.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA K",
    "centros": [
      {
        "nombre": "00307 - ESCUELA BASICA LIC. CRISTOBALINA BATISTA TAVARES",
        "padrones": [
          "1249.pdf",
          "1249A.pdf",
          "1249B.pdf",
          "1267.pdf",
          "1267A.pdf",
          "1267B.pdf",
          "1267C.pdf",
          "1310.pdf",
          "1310A.pdf",
          "1362B.pdf"
        ]
      },
      {
        "nombre": "00416 - ESCUELA BASICA CURAZAO",
        "padrones": [
          "1677.pdf",
          "1677A.pdf",
          "1677B.pdf",
          "1742.pdf",
          "1761.pdf",
          "1820.pdf",
          "1860.pdf",
          "1905.pdf"
        ]
      },
      {
        "nombre": "00459 - UNIVERSIDAD UTESA",
        "padrones": [
          "1688.pdf",
          "1743.pdf",
          "1765.pdf",
          "1790.pdf",
          "1824.pdf",
          "1868.pdf",
          "1906.pdf"
        ]
      },
      {
        "nombre": "00460 - UNIV. FEDERICO HENRIQUEZ. Y CARVAJAL",
        "padrones": [
          "1641A.pdf",
          "1641B.pdf",
          "1687.pdf",
          "1791.pdf",
          "1869.pdf"
        ]
      },
      {
        "nombre": "00529 - COLEGIO SAN ANTON",
        "padrones": ["1814.pdf", "1891.pdf"]
      },
      {
        "nombre": "00546 - LICEO PEDRO APONTE",
        "padrones": [
          "1243.pdf",
          "1243A.pdf",
          "1243B.pdf",
          "1243C.pdf",
          "1243D.pdf",
          "1245B.pdf",
          "1246.pdf",
          "1246A.pdf",
          "1310B.pdf",
          "1362.pdf",
          "1362A.pdf",
          "1641.pdf",
          "1749.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA L",
    "centros": [
      {
        "nombre": "00369 - ESCUELA DE EDUCACION BASICA SAN MIGUEL",
        "padrones": [
          "1631.pdf",
          "1701.pdf",
          "1741.pdf",
          "1760.pdf",
          "1819.pdf",
          "1859.pdf",
          "1904.pdf"
        ]
      },
      {
        "nombre": "00435 - LICEO SECUNDARIO LAS AMERICAS",
        "padrones": []
      },
      {
        "nombre": "00490 - ESCUELA BASICA JAPON",
        "padrones": [
          "1703.pdf",
          "1734.pdf",
          "1744.pdf",
          "1771.pdf",
          "1811.pdf",
          "1841.pdf",
          "1874.pdf",
          "1907.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA M",
    "centros": [
      {
        "nombre": "00365 - ESCUELA BASICA JAMAICA",
        "padrones": ["1215.pdf", "1215A.pdf", "1630.pdf", "1902.pdf"]
      },
      {
        "nombre": "00511 - CENTRO EDUC. INDEPENDENCIA",
        "padrones": ["1745.pdf", "1880.pdf"]
      },
      {
        "nombre": "00542 - ESCUELA BASICA NUESTRA SEÑORA DE LAS MERCEDES",
        "padrones": ["1829.pdf"]
      },
      {
        "nombre": "00544 - LICEO ADELAIDA ACOSTA",
        "padrones": [
          "1320.pdf",
          "1320A.pdf",
          "1320B.pdf",
          "1702.pdf",
          "1740.pdf",
          "1755.pdf",
          "1794.pdf",
          "1845.pdf",
          "1856.pdf",
          "1873.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA N",
    "centros": [
      {
        "nombre": "00364 - CENTRO EDUCATIVO ROSA EVANGELINA SOLANO",
        "padrones": [
          "1221.pdf",
          "1221A.pdf",
          "1221B.pdf",
          "1222.pdf",
          "1222A.pdf",
          "1737.pdf",
          "1754.pdf",
          "1808.pdf",
          "1843.pdf",
          "1855.pdf",
          "1901.pdf"
        ]
      },
      {
        "nombre": "00502 - ESCUELA PRIMARIA ELIZARDO TAMAREZ SANTAMARIA",
        "padrones": ["1723.pdf", "1775.pdf"]
      },
      {
        "nombre": "00538 - LICEO PROFESOR VICTOR PASCUAL AGUERO",
        "padrones": ["1896.pdf"]
      },
      {
        "nombre": "00541 - ESCUELA BASICA CONCEPCION BONA",
        "padrones": ["1835.pdf", "1878.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA O",
    "centros": [
      {
        "nombre": "00367 - MANOGUAYABO",
        "padrones": [
          "1224.pdf",
          "1224A.pdf",
          "1224B.pdf",
          "1225.pdf",
          "1225A.pdf",
          "1633.pdf",
          "1724.pdf",
          "1758.pdf",
          "1809.pdf",
          "1858.pdf"
        ]
      },
      {
        "nombre": "00435 - LICEO SECUNDARIO LAS AMERICAS",
        "padrones": [
          "1216.pdf",
          "1216A.pdf",
          "1216B.pdf",
          "1216C.pdf",
          "1223.pdf",
          "1223A.pdf",
          "1223B.pdf",
          "1223C.pdf",
          "1223D.pdf",
          "1762.pdf",
          "1785.pdf",
          "1863.pdf"
        ]
      },
      {
        "nombre": "00516 - COLEGIO INFANTIL LOS QUERUBINES",
        "padrones": ["1777.pdf"]
      },
      {
        "nombre": "00525 - COLEGIO TRAZO DE COLORES",
        "padrones": ["1803.pdf", "1889.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA P",
    "centros": [
      {
        "nombre": "00001 - COLEGIO EL ANGEL",
        "padrones": ["0001.pdf", "1748.pdf", "1806.pdf", "1847.pdf", "1899.pdf"]
      },
      {
        "nombre": "00356 - COLEGIO JUAN 23",
        "padrones": [
          "1234.pdf",
          "1234A.pdf",
          "1235.pdf",
          "1235A.pdf",
          "1235B.pdf",
          "1384.pdf",
          "1384A.pdf",
          "1485.pdf",
          "1485A.pdf",
          "1485B.pdf"
        ]
      },
      {
        "nombre": "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO",
        "padrones": []
      }
    ]
  },
  {
    "zona": "ZONA Q",
    "centros": [
      {
        "nombre": "00425 - ESCUELA BASICA LAS PALMAS #1",
        "padrones": [
          "1403.pdf",
          "1403A.pdf",
          "1403B.pdf",
          "1483.pdf",
          "1483A.pdf",
          "1483B.pdf",
          "1484.pdf",
          "1484A.pdf",
          "1484B.pdf"
        ]
      },
      {
        "nombre": "00487 - ESCUELA VEDRUNA",
        "padrones": [
          "1231.pdf",
          "1231A.pdf",
          "1231B.pdf",
          "1231C.pdf",
          "1262.pdf",
          "1262A.pdf"
        ]
      },
      {
        "nombre": "00492 - COLEGIO SANTA MARIA",
        "padrones": [
          "1705.pdf",
          "1772.pdf",
          "1812.pdf",
          "1837.pdf",
          "1875.pdf",
          "1908.pdf"
        ]
      },
      {
        "nombre": "00524 - CLUB ESCUELA BASICA FRANCISCO A. CAAMAÑO",
        "padrones": ["1686.pdf", "1802.pdf", "1888.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA R",
    "centros": [
      {
        "nombre": "00361 - ESCUELA ING. AGR. IVAN GUZMAN K",
        "padrones": [
          "1375.pdf",
          "1375A.pdf",
          "1375B.pdf",
          "1375C.pdf",
          "1375D.pdf",
          "1375E.pdf"
        ]
      },
      {
        "nombre": "00455 - EXTENSION DE LA UASD",
        "padrones": [
          "1375F.pdf",
          "1692.pdf",
          "1710.pdf",
          "1753.pdf",
          "1763.pdf",
          "1810.pdf",
          "1833.pdf",
          "1853.pdf",
          "1865.pdf"
        ]
      },
      {
        "nombre": "00515 - HOSPITAL MUNICIPAL DE ENGOMBE",
        "padrones": ["1725.pdf", "1840.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA S",
    "centros": [
      {
        "nombre": "00362 - ESCUELA PRIMARIA BUENOS AIRES",
        "padrones": [
          "1236.pdf",
          "1236A.pdf",
          "1237.pdf",
          "1237A.pdf",
          "1279.pdf",
          "1279A.pdf",
          "1282.pdf",
          "1282A.pdf",
          "1284.pdf",
          "1284A.pdf",
          "1284B.pdf",
          "1284C.pdf",
          "1638.pdf"
        ]
      },
      {
        "nombre": "00454 - CLUB 16 DE AGOSTO",
        "padrones": [
          "1638A.pdf",
          "1638B.pdf",
          "1693.pdf",
          "1787.pdf",
          "1864.pdf"
        ]
      },
      {
        "nombre": "00543 - ESCUELA PROFESOR JUAN BOSCH GAVIÑO",
        "padrones": [
          "1486.pdf",
          "1486A.pdf",
          "1487.pdf",
          "1487A.pdf",
          "1488.pdf",
          "1488A.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA T",
    "centros": [
      {
        "nombre": "00338 - COMEDOR ECONOMICO",
        "padrones": [
          "1329.pdf",
          "1329A.pdf",
          "1329B.pdf",
          "1370.pdf",
          "1370A.pdf",
          "1370B.pdf",
          "1849.pdf"
        ]
      },
      {
        "nombre": "00476 - ASOCIACION DE IMPEDIDO FISICO MOTORES",
        "padrones": [
          "1309.pdf",
          "1309A.pdf",
          "1309B.pdf",
          "1309C.pdf",
          "1695.pdf",
          "1767.pdf",
          "1828.pdf",
          "1832.pdf"
        ]
      },
      {
        "nombre": "00526 - POLITECNICO MADRE RAFAELA IBARRA",
        "padrones": [
          "1314.pdf",
          "1314A.pdf",
          "1314B.pdf",
          "1314C.pdf",
          "1314D.pdf",
          "1314E.pdf",
          "1314F.pdf",
          "1696.pdf",
          "1769.pdf",
          "1804.pdf",
          "1890.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA U",
    "centros": [
      {
        "nombre": "00513 - ESCUELA BASICA HERMANAS MIRABAL",
        "padrones": ["1747.pdf", "1796.pdf", "1839.pdf", "1882.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA W",
    "centros": [
      {
        "nombre": "00518 - PROYECTO DESARROLLO COMUNITARIO INTEGRAL",
        "padrones": ["1727.pdf", "1780.pdf"]
      },
      {
        "nombre": "00534 - SALON MULTIUSO EL ABANICO",
        "padrones": ["1799.pdf", "1830.pdf", "1893.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA X",
    "centros": [
      {
        "nombre": "00510 - ESCUELA DE EDUCACION BASICA PROF. JUAN GABINO",
        "padrones": ["1736.pdf", "1779.pdf", "1879.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA Y",
    "centros": [
      {
        "nombre": "00474 - ESCUELA PRIMARI ERCILIA PEPIN BATEY BIENVENIDO",
        "padrones": ["1676.pdf", "1739.pdf", "1766.pdf", "1836.pdf", "1870.pdf"]
      }
    ]
  },
  {
    "zona": "ZONA Z",
    "centros": [
      {
        "nombre": "00368 - CENTRO EDUCATIVO ALBERTO PEREZ Y SANTIAGO",
        "padrones": [
          "1219.pdf",
          "1219A.pdf",
          "1220.pdf",
          "1220A.pdf",
          "1759.pdf",
          "1834.pdf",
          "1903.pdf"
        ]
      }
    ]
  },
  {
    "zona": "ZONA Ñ",
    "centros": [
      {
        "nombre": "00308 - SINDICATO UNIDO DE TRAB. PORTUARIO",
        "padrones": ["1257.pdf", "1257A.pdf", "1356.pdf"]
      },
      {
        "nombre": "00453 - ESCUELA PADRE MARTIN EGUSQUIZA",
        "padrones": ["1356A.pdf", "1645.pdf", "1698.pdf", "1786.pdf"]
      }
    ]
  }
]
````

## File: src/constants.test.js
````javascript
import {
  validarCedula,
  validarTelefono,
  CEDULA_LONGITUD,
  normalizarCedula,
} from "./constants";

describe("validarCedula", () => {
  it("acepta una cédula con formato XXX-XXXXXXX-X", () => {
    expect(validarCedula("001-1234567-8")).toBe(true);
  });

  it("acepta 11 dígitos sin guiones (los guiones son opcionales)", () => {
    expect(validarCedula("00112345678")).toBe(true);
  });

  it("rechaza cadenas con menos de 11 dígitos", () => {
    expect(validarCedula("0011234567")).toBe(false);
    expect(validarCedula("123")).toBe(false);
  });

  it("rechaza la cadena vacía", () => {
    expect(validarCedula("")).toBe(false);
  });

  it("rechaza cédulas con letras", () => {
    expect(validarCedula("abc-1234567-8")).toBe(false);
  });

  it("la longitud esperada de la cédula es 11", () => {
    expect(CEDULA_LONGITUD).toBe(11);
  });
});

describe("normalizarCedula", () => {
  it("quita los guiones", () => {
    expect(normalizarCedula("001-1234567-8")).toBe("00112345678");
  });

  it("deja igual una cédula que ya viene sin guiones", () => {
    expect(normalizarCedula("00112345678")).toBe("00112345678");
  });

  it("quita espacios y cualquier caracter no numérico", () => {
    expect(normalizarCedula(" 001 1234567 8 ")).toBe("00112345678");
  });

  it("maneja null y undefined devolviendo cadena vacía", () => {
    expect(normalizarCedula(null)).toBe("");
    expect(normalizarCedula(undefined)).toBe("");
  });

  it("dos formatos distintos de la misma cédula normalizan igual", () => {
    expect(normalizarCedula("001-1234567-8")).toBe(normalizarCedula("00112345678"));
  });
});

describe("validarTelefono", () => {
  it("acepta la cadena vacía (campo opcional)", () => {
    expect(validarTelefono("")).toBe(true);
  });

  it("acepta un teléfono con dígitos y guiones", () => {
    expect(validarTelefono("809-555-1234")).toBe(true);
  });

  it("acepta 7 dígitos seguidos (mínimo permitido)", () => {
    expect(validarTelefono("1234567")).toBe(true);
  });

  it("rechaza menos de 7 caracteres", () => {
    expect(validarTelefono("123")).toBe(false);
  });

  it("rechaza valores con letras", () => {
    expect(validarTelefono("abc1234")).toBe(false);
  });
});
````

## File: src/ThemeContext.js
````javascript
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 1. Inicializar estado leyendo de localStorage (o false por defecto)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });

  // 2. EFECTO CRÍTICO: Sincronizar la clase CSS con el estado
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    // Guardar la preferencia para la próxima vez
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Optimización de rendimiento con useMemo
  const value = useMemo(() => ({ isDarkMode, toggleDarkMode }), [isDarkMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
````

## File: firestore.indexes.json
````json
{
  "indexes": [
    {
      "collectionGroup": "simpatizantes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "registradoPor", "order": "ASCENDING" },
        { "fieldPath": "fechaRegistro", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "simpatizantes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sector", "order": "ASCENDING" },
        { "fieldPath": "fechaRegistro", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "simpatizantes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "subsector", "order": "ASCENDING" },
        { "fieldPath": "fechaRegistro", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "simpatizantes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "municipio", "order": "ASCENDING" },
        { "fieldPath": "fechaRegistro", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "rol", "order": "ASCENDING" },
        { "fieldPath": "nombre", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
````

## File: SEO_SETUP.md
````markdown
# Configuración SEO y Google Analytics

## 📋 Archivos Creados/Modificados

### 1. Sitemap.xml
- **Ubicación**: `/public/sitemap.xml`
- **Descripción**: Mapa del sitio para indexación en Google
- **URLs incluidas**:
  - Página principal (/)
  - Propuestas (/propuestas)
  - Registro público (/registro)
  - Registro de app (/registro-app)
  - Login (/login)

### 2. Robots.txt
- **Ubicación**: `/public/robots.txt`
- **Modificaciones**:
  - Permite indexación de páginas públicas
  - Bloquea rutas administrativas (/admin/, /dashboard/)
  - Incluye referencia al sitemap

### 3. Google Analytics
- **ID de seguimiento**: `G-EB27HNVEQY`
- **Implementación**:
  - Script de Google Analytics en `index.html`
  - Utilidades de seguimiento en `/src/utils/analytics.js`
  - Hook de rastreo automático en `/src/hooks/usePageTracking.js`

## 🔧 Configuración Requerida

### 1. Actualizar el Dominio
**IMPORTANTE**: Debes reemplazar `https://www.felixencarnacion.com/` en los siguientes archivos:

1. **sitemap.xml** - Líneas con `<loc>https://www.felixencarnacion.com/...</loc>`
2. **robots.txt** - Línea `Sitemap: https://www.felixencarnacion.com/sitemap.xml`
3. **index.html** - Meta tags Open Graph y Twitter

### 2. Verificar Google Analytics
- El código `G-EB27HNVEQY` ya está configurado
- Verifica que sea el ID correcto en Google Analytics Console

## 📊 Eventos de Google Analytics Configurados

### Eventos Automáticos
- **Visualizaciones de página**: Se rastrean automáticamente
- **Navegación**: Cambios de ruta se registran

### Eventos Personalizados Disponibles
```javascript
import { trackCampaignEvents } from './utils/analytics';

// Registro de usuario
trackCampaignEvents.userRegistration('email');

// Login
trackCampaignEvents.userLogin('email');

// Ver propuestas
trackCampaignEvents.viewProposals();

// Registro de simpatizante
trackCampaignEvents.registerSimpatizante();

// Compartir enlace
trackCampaignEvents.shareReferralLink('whatsapp');

// Navegación del dashboard
trackCampaignEvents.dashboardNavigation('usuarios');

// Establecer meta
trackCampaignEvents.setGoal('monthly_registrations');

// Descarga de documento
trackCampaignEvents.downloadDocument('propuestas.pdf');
```

## 🚀 Pasos para Activar SEO

### 1. Google Search Console
1. Ve a [Google Search Console](https://search.google.com/search-console/)
2. Agrega tu dominio
3. Verifica la propiedad del sitio
4. Envía el sitemap: `https://tu-dominio.com/sitemap.xml`

### 2. Google Analytics
1. Ve a [Google Analytics](https://analytics.google.com/)
2. Verifica que el ID `G-EB27HNVEQY` esté activo
3. Configura objetivos de conversión si es necesario

### 3. Meta Tags Adicionales
El archivo `index.html` ya incluye:
- Meta description optimizada
- Keywords relevantes
- Open Graph para redes sociales
- Twitter Cards
- Idioma configurado a español

## 📈 Monitoreo y Optimización

### Métricas Importantes a Monitorear
1. **Páginas más visitadas**
2. **Tasa de conversión de registro**
3. **Fuentes de tráfico**
4. **Tiempo en el sitio**
5. **Tasa de rebote**

### Recomendaciones SEO Adicionales
1. **Contenido**: Agregar más contenido textual en las páginas
2. **Velocidad**: Optimizar imágenes y recursos
3. **Mobile**: Verificar responsividad completa
4. **Enlaces**: Crear estrategia de link building
5. **Contenido regular**: Blog o sección de noticias

## 🔍 Verificación de Implementación

Para verificar que todo funciona:

1. **Sitemap**: Visita `https://tu-dominio.com/sitemap.xml`
2. **Robots**: Visita `https://tu-dominio.com/robots.txt`
3. **Analytics**: Abre las herramientas de desarrollador y verifica que se envían eventos a GA
4. **Meta tags**: Usa herramientas como [Open Graph Debugger](https://developers.facebook.com/tools/debug/)

## 📝 Notas Importantes

- El sitemap se actualiza automáticamente con cada build
- Los eventos de Analytics se pueden personalizar según las necesidades
- Considera implementar Google Tag Manager para gestión avanzada de tags
- Revisa periódicamente el rendimiento en Google Search Console
````

## File: scripts/recomprimirFotos.js
````javascript
/**
 * Recompresión one-off de fotos crudas en Storage.
 * -------------------------------------------------
 * Las fotos subidas antes del fix de compresión en cliente están crudas
 * (varios MB), lo que hace lentísimo el export a PDF/Excel y la carga de las
 * listas. Este script recorre votantes_fotos/ en el bucket, y para cada imagen
 * grande la redimensiona (lado mayor 1000px, sin agrandar) y recomprime a JPEG
 * calidad 82 con sharp, SOBREESCRIBIENDO el mismo objeto.
 *
 * Corre del lado SERVIDOR con el Admin SDK (bajar/procesar/resubir cientos de
 * fotos en el navegador sería inviable).
 *
 * USO:
 *   node scripts/recomprimirFotos.js              # dry-run (por defecto, NO escribe)
 *   node scripts/recomprimirFotos.js --dry-run    # idem, explícito
 *   node scripts/recomprimirFotos.js --apply      # corrida REAL (sobreescribe)
 *
 * SEGURIDAD: la corrida real SOBREESCRIBE los originales, pero AUTOMÁTICAMENTE
 * respalda ANTES cada foto que va a tocar, copiándola dentro del mismo bucket a
 * backup_votantes_fotos_YYYYMMDD/{nombreRelativo}. El backup cubre SOLO las
 * fotos modificadas (no los ~225k objetos). Nunca sobreescribe sin backup
 * exitoso; si el backup falla para una foto, la salta. Es idempotente: si el
 * objeto de backup ya existe, no lo pisa. Ver README para revertir.
 *
 * Requiere la service account (gitignored) en la raíz del repo, o la ruta en
 * la env var GOOGLE_APPLICATION_CREDENTIALS / SERVICE_ACCOUNT.
 */

const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const sharp = require("sharp");

// ------------------------------ Config ------------------------------
const BUCKET = "politicard-cfd.firebasestorage.app";
const PREFIX = "votantes_fotos/";
const MAX_LADO = 1000; // lado mayor objetivo (px)
const CALIDAD = 82; // calidad JPEG
const UMBRAL_BYTES = 400 * 1024; // 400 KB: por debajo se considera ya optimizada
const CONCURRENCIA = 5;

const DEFAULT_SA = "politicard-cfd-firebase-adminsdk-fbsvc-0dfcb72afa.json";

// Carpeta de backup de ESTA corrida (una sola por ejecución, con su fecha).
const hoy = new Date();
const YYYYMMDD = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(
  2,
  "0"
)}${String(hoy.getDate()).padStart(2, "0")}`;
const BACKUP_PREFIX = `backup_votantes_fotos_${YYYYMMDD}/`;

// Nombre del objeto dentro de la carpeta de backup (sin el prefijo original,
// para que revertir sea copiar de vuelta a votantes_fotos/ directo).
const rutaBackup = (name) =>
  BACKUP_PREFIX + (name.startsWith(PREFIX) ? name.slice(PREFIX.length) : name);

// --------------------------- CLI flags ------------------------------
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
// Dry-run es el modo por defecto y seguro: solo escribe si se pasa --apply.
const DRY_RUN = !APPLY;

// ----------------------- Init Admin SDK -----------------------------
function resolverServiceAccount() {
  const env =
    process.env.SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const ruta = env
    ? path.resolve(env)
    : path.resolve(__dirname, "..", DEFAULT_SA);
  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(ruta);
}

initializeApp({
  credential: cert(resolverServiceAccount()),
  storageBucket: BUCKET,
});
const bucket = getStorage().bucket();

// ----------------------------- Helpers ------------------------------
const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(2);
const kb = (bytes) => Math.round(bytes / 1024);

/**
 * Copia el objeto original a la carpeta de backup de esta corrida, ANTES de
 * sobreescribirlo. Idempotente: si el backup ya existe, no lo pisa.
 * @returns {Promise<boolean>} true si el backup quedó garantizado.
 */
async function respaldar(name) {
  const destino = rutaBackup(name);
  const destFile = bucket.file(destino);
  const [existe] = await destFile.exists();
  if (existe) {
    console.log(`  backup ya existe -> ${destino}`);
    return true;
  }
  await bucket.file(name).copy(destFile);
  console.log(`  backup OK -> ${destino}`);
  return true;
}

/**
 * Procesa una foto CANDIDATA (ya pre-filtrada por tamaño >= UMBRAL_BYTES según
 * metadata, sin haber descargado). Descarga, comprueba dimensiones y, si hay
 * que recomprimir, PRIMERO respalda el original y solo entonces sobreescribe.
 * @returns {Promise<{ estado: string, antes: number, despues: number, backup: boolean }>}
 *   estado: "recomprimida" | "saltada" | "fallida_backup" | "fallida_recompresion"
 */
async function procesarFoto(file) {
  const name = file.name;
  let antes = 0;
  let despues = 0;

  // 1) Descarga + análisis + recompresión en memoria (aún NO escribe nada).
  let nuevo;
  try {
    const [buffer] = await file.download();
    antes = buffer.length;

    const meta = await sharp(buffer).metadata();
    const ladoMayor = Math.max(meta.width || 0, meta.height || 0);

    // Aunque pese >= umbral, si su lado mayor ya es <= 1000px está optimizada
    // en dimensiones: recomprimir no aportaría y evitamos degradar de más.
    if (ladoMayor <= MAX_LADO) {
      console.log(
        `  SALTA   ${name}  (${kb(antes)}KB, ${meta.width}x${meta.height}, lado<=${MAX_LADO})`
      );
      return { estado: "saltada", antes, despues: antes, backup: false };
    }

    // Recomprime: .rotate() aplica la orientación EXIF antes de redimensionar.
    nuevo = await sharp(buffer)
      .rotate()
      .resize({ width: MAX_LADO, height: MAX_LADO, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: CALIDAD })
      .toBuffer();
    despues = nuevo.length;
  } catch (err) {
    console.error(`  FALLA (recompresión) ${name}: ${err && err.message}`);
    return { estado: "fallida_recompresion", antes, despues: 0, backup: false };
  }

  if (DRY_RUN) {
    console.log(
      `  DRY     ${name}  backup -> ${rutaBackup(name)}  |  ${kb(antes)}KB -> ${kb(despues)}KB`
    );
    return { estado: "recomprimida", antes, despues, backup: true };
  }

  // 2) BACKUP primero. Si falla, NO se sobreescribe: se salta la foto.
  try {
    await respaldar(name);
  } catch (err) {
    console.error(`  FALLA (backup) ${name}: ${err && err.message}`);
    return { estado: "fallida_backup", antes, despues: 0, backup: false };
  }

  // 3) Solo con backup garantizado, sobreescribe el original.
  try {
    await bucket.file(name).save(nuevo, {
      contentType: "image/jpeg",
      resumable: false,
      metadata: { contentType: "image/jpeg" },
    });
    console.log(`  recomprimida ${name}  ${kb(antes)}KB -> ${kb(despues)}KB`);
    return { estado: "recomprimida", antes, despues, backup: true };
  } catch (err) {
    // El backup ya está a salvo, así que el original es recuperable.
    console.error(`  FALLA (recompresión) ${name}: ${err && err.message}`);
    return { estado: "fallida_recompresion", antes, despues: 0, backup: true };
  }
}

/** Ejecuta tareas con concurrencia limitada. */
async function conConcurrencia(items, limite, tarea) {
  const resultados = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      resultados[i] = await tarea(items[i]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limite, items.length || 1) }, worker)
  );
  return resultados;
}

// ------------------------------- Main -------------------------------
async function main() {
  console.log(
    `\n=== Recompresión de fotos — bucket ${BUCKET} prefijo ${PREFIX} ===`
  );
  console.log(
    DRY_RUN
      ? "MODO: DRY-RUN (no escribe nada). Usa --apply para la corrida real.\n"
      : "MODO: APPLY (SOBREESCRIBE los originales). Asegúrate de tener backup.\n"
  );

  // PRE-FILTRO POR METADATA (sin descargar): el prefijo tiene ~225k objetos
  // (recortes del padrón, ~8KB c/u) y solo un puñado son fotos crudas grandes.
  // Descargar todo para medir sería inviable (~2.3GB), así que paginamos y nos
  // quedamos SOLO con los objetos cuyo metadata.size >= UMBRAL_BYTES.
  let totalObjetos = 0;
  let saltadasPorTamano = 0;
  const candidatas = [];
  let pageToken;
  do {
    const [files, , resp] = await bucket.getFiles({
      prefix: PREFIX,
      maxResults: 1000,
      autoPaginate: false,
      pageToken,
    });
    for (const f of files) {
      if (f.name.endsWith("/")) continue; // ignora "carpetas"
      totalObjetos++;
      if (Number(f.metadata.size || 0) >= UMBRAL_BYTES) candidatas.push(f);
      else saltadasPorTamano++;
    }
    pageToken = resp && resp.nextPageToken;
    console.log(
      `... listados ${totalObjetos} objetos (candidatas por tamaño: ${candidatas.length})`
    );
  } while (pageToken);

  console.log(
    `\nObjetos: ${totalObjetos} · candidatas >=${kb(UMBRAL_BYTES)}KB: ${candidatas.length}`
  );
  console.log(`Carpeta de backup de esta corrida: ${BACKUP_PREFIX}\n`);

  const resultados = await conConcurrencia(candidatas, CONCURRENCIA, procesarFoto);

  const recomprimidas = resultados.filter((r) => r.estado === "recomprimida");
  const saltadasPorDimension = resultados.filter((r) => r.estado === "saltada");
  const fallidasBackup = resultados.filter((r) => r.estado === "fallida_backup");
  const fallidasRecompresion = resultados.filter(
    (r) => r.estado === "fallida_recompresion"
  );
  const respaldados = resultados.filter((r) => r.backup).length;
  const ahorroBytes = recomprimidas.reduce(
    (acc, r) => acc + (r.antes - r.despues),
    0
  );

  console.log("\n=== RESUMEN ===");
  console.log(`Total objetos:            ${totalObjetos}`);
  console.log(`Revisados (candidatas):   ${candidatas.length}`);
  console.log(
    `Respaldados:              ${respaldados}${DRY_RUN ? " (se crearían, dry-run)" : ` -> ${BACKUP_PREFIX}`}`
  );
  console.log(
    `Recomprimidos:            ${recomprimidas.length}${DRY_RUN ? " (estimado, dry-run)" : ""}`
  );
  console.log(`Saltados (por tamaño):    ${saltadasPorTamano}`);
  console.log(`Saltados (por lado):      ${saltadasPorDimension.length}`);
  console.log(`Fallidos (backup):        ${fallidasBackup.length}`);
  console.log(`Fallidos (recompresión):  ${fallidasRecompresion.length}`);
  console.log(
    `MB ahorrados:             ${mb(ahorroBytes)} MB${DRY_RUN ? " (estimado)" : ""}`
  );
  if (DRY_RUN) {
    console.log(
      "\nDry-run: no se escribió ni copió nada. Revisa el reporte y corre con --apply."
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error fatal:", err);
    process.exit(1);
  });
````

## File: src/components/dashboard/MyRegisteredSimpatizantes.js
````javascript
import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { FaFileExcel, FaFilePdf, FaFileImage } from "react-icons/fa";
import AvatarFoto from "../ui/AvatarFoto";
import { generarPadronPDF } from "../../utils/pdfPadron";
import { generarExcelConFoto } from "../../utils/excelConFoto";

// Campos/columnas para los exports con foto de simpatizantes. Usa los campos
// nuevos de ubicación electoral; fallback "N/A" lo aplican los generadores.
const CAMPOS_PDF_SIMP = [
  { label: "Nombre", key: "nombre" },
  { label: "Cédula", key: "cedula" },
  { label: "Teléfono", key: "telefono" },
  { label: "Zona", key: "zona" },
  { label: "Sector", key: "sector" },
  { label: "Subsector", key: "subsector" },
  { label: "Recinto", key: "recinto" },
  { label: "Colegio", key: "colegio" },
];

const COLUMNAS_EXCEL_SIMP = [
  { header: "Nombre", key: "nombre", width: 28 },
  { header: "Cédula", key: "cedula", width: 16 },
  { header: "Teléfono", key: "telefono", width: 16 },
  { header: "Zona", key: "zona", width: 16 },
  { header: "Sector", key: "sector", width: 18 },
  { header: "Subsector", key: "subsector", width: 18 },
  { header: "Recinto", key: "recinto", width: 22 },
  { header: "Colegio", key: "colegio", width: 14 },
  { header: "FechaRegistro", key: "fechaRegistro", width: 16 },
];

function MyRegisteredSimpatizantes({ user }) {
  const [simpatizantes, setSimpatizantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado de los exports con foto (PDF/Excel).
  const [exportando, setExportando] = useState(false);
  const [progreso, setProgreso] = useState(null); // { fase, hechos, total }
  const textoProgreso = progreso
    ? `Generando... ${progreso.hechos}/${progreso.total}`
    : "";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const simpatizantesRef = collection(db, "simpatizantes");
    const q = query(
      simpatizantesRef,
      where("registradoPor", "==", user.uid),
      orderBy("fechaRegistro", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const registeredList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSimpatizantes(registeredList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching registered simpatizantes:", err);
        setError(
          "Error al cargar tus registros. Verifica la consola o contacta al administrador."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- FUNCIÓN DE EXPORTACIÓN A EXCEL ---
  const handleExport = () => {
    if (simpatizantes.length === 0) {
      alert("No tienes registros para exportar.");
      return;
    }

    const dataToExport = simpatizantes.map((simpatizante) => ({
      Nombre: simpatizante.nombre || "N/A",
      Cédula: simpatizante.cedula || "N/A",
      Teléfono: simpatizante.telefono || "N/A",
      Zona: simpatizante.zona || "N/A",
      Sector: simpatizante.sector || "N/A",
      Subsector: simpatizante.subsector || "N/A",
      Recinto: simpatizante.recinto || "N/A",
      Colegio: simpatizante.colegioElectoral || "N/A",
      FechaRegistro: simpatizante.fechaRegistro
        ? simpatizante.fechaRegistro.toDate().toLocaleDateString("es-DO")
        : "N/A",
      Registrador: user.nombre || "Yo mismo",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mis Registros");

    const fileName = `Mis_Registros_Personales_${user.nombre.replace(
      /\s/g,
      "_"
    )}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Normaliza los simpatizantes al shape que consumen los generadores:
  // debe incluir `cedula` (para resolver la foto) y las `key` referenciadas.
  // La fecha se pre-formatea porque los generadores solo convierten a texto.
  const buildPersonasExport = () =>
    simpatizantes.map((s) => ({
      cedula: s.cedula,
      nombre: s.nombre,
      telefono: s.telefono,
      zona: s.zona,
      sector: s.sector,
      subsector: s.subsector,
      recinto: s.recinto,
      colegio: s.colegioElectoral,
      fechaRegistro: s.fechaRegistro
        ? s.fechaRegistro.toDate().toLocaleDateString("es-DO")
        : "",
    }));

  const safeNombre = (user.nombre || "usuario").replace(/\s/g, "_");

  // Export PDF tipo padrón (foto grande + datos por ficha).
  const handleExportPDF = async () => {
    if (simpatizantes.length === 0) {
      alert("No tienes registros para exportar.");
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: simpatizantes.length });
    try {
      await generarPadronPDF(buildPersonasExport(), {
        titulo: "Padrón de Simpatizantes",
        campos: CAMPOS_PDF_SIMP,
        fileName: `Mis_Registros_Padron_${safeNombre}.pdf`,
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  // Export Excel con la foto embebida en cada fila.
  const handleExportExcelFoto = async () => {
    if (simpatizantes.length === 0) {
      alert("No tienes registros para exportar.");
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: simpatizantes.length });
    try {
      await generarExcelConFoto(buildPersonasExport(), {
        hojaNombre: "Mis Registros",
        columnas: COLUMNAS_EXCEL_SIMP,
        fileName: `Mis_Registros_Con_Foto_${safeNombre}.xlsx`,
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (err) {
      console.error("Error generando Excel:", err);
      alert("Hubo un error al generar el Excel.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };
  // ------------------------------------

  if (loading) {
    return <p>Cargando tus registros...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="my-registrations-container glass-panel">
      {/* Barra de Acciones y Botón de Exportar */}
      {simpatizantes.length > 0 && (
        <div className="registration-actions-bar">
          <p className="registration-count">
             Total Registrados: <strong>{simpatizantes.length}</strong>
          </p>
          <button
            onClick={handleExport}
            className="export-registros-button"
            title="Exportar mis registros a Excel"
            disabled={exportando}
          >
            <FaFileExcel /> Exportar Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="export-registros-button"
            title="Exportar PDF tipo padrón con foto"
            disabled={exportando}
          >
            <FaFilePdf /> {exportando ? textoProgreso : "PDF con foto (padrón)"}
          </button>
          <button
            onClick={handleExportExcelFoto}
            className="export-registros-button"
            title="Exportar Excel con foto embebida"
            disabled={exportando}
          >
            <FaFileImage /> {exportando ? textoProgreso : "Excel con foto"}
          </button>
        </div>
      )}

      {simpatizantes.length > 0 ? (
        <div className="table-wrapper">
          <table className="registrations-table">
            <thead>
              <tr>
                <th>Foto</th> {/* Nueva Columna */}
                <th>Nombre</th>
                <th>Sector</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {simpatizantes.map((simpatizante) => (
                <tr key={simpatizante.id}>
                  {/* Célula de Foto */}
                  <td style={{ width: '60px' }}>
                    <AvatarFoto 
                        cedula={simpatizante.cedula} 
                        nombre={simpatizante.nombre} 
                        size="40px" 
                        allowReport={true}
                    />
                  </td>

                  <td>
                    <div style={{fontWeight: '600'}}>{simpatizante.nombre}</div>
                    {simpatizante.cedula ? (
                        <small style={{color: '#666'}}>{simpatizante.cedula}</small>
                    ) : (
                        <small style={{color: '#e63946'}}>Sin Cédula</small>
                    )}
                  </td>

                  <td>{simpatizante.sector}</td>
                  
                  <td>
                    {simpatizante.fechaRegistro
                      ?.toDate()
                      .toLocaleDateString("es-DO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aún no has registrado ningún simpatizante.</p>
          <p style={{fontSize: '0.9rem', color: '#666'}}>¡Empieza hoy mismo usando el formulario de registro!</p>
        </div>
      )}
    </div>
  );
}

export default MyRegisteredSimpatizantes;
````

## File: src/components/dashboard/RegisterByActivist.js
````javascript
import React, { useState, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

import {
  PROVINCIA_FIJA,
  MUNICIPIO_FIJO,
  MAP_INITIAL_CENTER,
  MAP_DEFAULT_ZOOM,
  CEDULA_LONGITUD,
  validarCedula,
  validarTelefono,
} from "../../constants.js";
import {
  ZONA_FIJA,
  SECTOR_FIJO,
  OPCION_NO_IDENTIFICADO,
  normalizarSubsector,
} from "../../data/ubicacionElectoral";
import UbicacionElectoralFields from "../ui/UbicacionElectoralFields";
import Loader from "../ui/Loader";

const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Opciones del mapa
const mapContainerStyle = {
  width: "100%",
  height: "400px",
  marginBottom: "15px",
};
const libraries = ["places", "marker"];

// Estado inicial de la ubicación electoral (zona y sector fijos por ahora)
const UBICACION_INICIAL = {
  zona: ZONA_FIJA,
  sector: SECTOR_FIJO,
  subsector: "",
  subsectorEsOtro: false,
  recinto: "",
  colegioElectoral: "",
};

// Convierte "No identificado" en cadena vacía para el payload.
const limpiarUbicacion = (valor) =>
  valor === OPCION_NO_IDENTIFICADO ? "" : valor;

// Initialize Firebase Functions connection
const functions = getFunctions();
const registerSimpatizanteCallable = httpsCallable(
  functions,
  "registerSimpatizante"
);
const searchVotanteCallable = httpsCallable(functions, "searchVotanteByCedula");

function RegisterByActivist({ user }) {
  // Form field states
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  // Estados de carga y búsqueda
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Provincia y municipio siguen fijos
  const [selectedProvincia, setSelectedProvincia] = useState(PROVINCIA_FIJA);
  const [selectedMunicipio, setSelectedMunicipio] = useState(MUNICIPIO_FIJO);

  // Ubicación electoral en cascada (5 niveles)
  const [ubicacion, setUbicacion] = useState(UBICACION_INICIAL);

  // Estado para las coordenadas (ubicación pineada)
  const [coordinates, setCoordinates] = useState(MAP_INITIAL_CENTER);
  // Estado para el mapa (referencia)
  const [, setMap] = useState(null);

  // Cargar script de Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries,
  });

  // Función para manejar el movimiento del marcador
  const onMarkerDragEnd = useCallback((event) => {
    setCoordinates({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  }, []);

  // Guardar la referencia del mapa
  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  // Limpiar la referencia del mapa
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Al cambiar un campo de ubicación; si cambia "recinto", resetea el colegio.
  const handleUbicacionChange = (campo, valor) => {
    setUbicacion((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "recinto") {
        next.colegioElectoral = "";
      }
      return next;
    });
  };

  const [notification, setNotification] = useState({ message: "", type: "" });

  // Buscar votante al ingresar cédula válida
  const handleCedulaSearch = useCallback(async (inputCedula) => {
    const cedulaNormalizada = inputCedula.replace(/-/g, "");

    if (cedulaNormalizada.length === CEDULA_LONGITUD && validarCedula(inputCedula)) {
      setIsSearching(true);
      setNotification({ message: "Buscando datos...", type: "info" });

      try {
        const result = await searchVotanteCallable({ cedula: inputCedula });
        const { found, data } = result.data;

        if (found) {
          // Llenar Nombre
          setNombre(data.nombre);

          // Llenar Teléfono si existe
          if (data.telefono) setTelefono(data.telefono);

          setNotification({
            message: "Datos cargados correctamente.",
            type: "success",
          });
        } else {
          // Si no aparece, limpiamos para que escriban manualmente
          setNombre("");
          setNotification({
            message: "No encontrado en el padrón.",
            type: "error",
          });
        }
      } catch (error) {
        console.error(error);
        setNotification({ message: "Error de conexión.", type: "error" });
      } finally {
        setIsSearching(false);
      }
    }
  }, []);

  const handleCedulaChange = (e) => {
    // 1. Obtener valor limpio (solo números)
    const input = e.target.value.replace(/[^0-9]/g, "");

    // 2. Limitar a 11 dígitos máximo
    const normalized = input.slice(0, 11);

    // 3. Aplicar formato visual (XXX-XXXXXXX-X)
    let formatted = normalized;
    if (normalized.length > 3) {
      formatted = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    }
    if (normalized.length > 10) {
      formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
    }

    // 4. Actualizar estado SIEMPRE (Esto arregla el bloqueo)
    setCedula(formatted);

    // 5. Disparar búsqueda si está completa
    if (normalized.length === CEDULA_LONGITUD) {
      // Validamos con tu regex existente para seguridad extra
      if (validarCedula(formatted)) {
        handleCedulaSearch(formatted);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" });

    if (isSearching || loading) return;

    // Validations (ajustadas para el nuevo flujo fijo de ubicación)
    const cedulaNormalizada = cedula.replace(/-/g, "");
    if (cedulaNormalizada.length !== CEDULA_LONGITUD) {
      setNotification({
        message: "Formato de cédula incorrecto (debe tener 11 dígitos).",
        type: "error",
      });
      return;
    }
    const cedulaFormateada = `${cedulaNormalizada.substring(
      0,
      3
    )}-${cedulaNormalizada.substring(3, 10)}-${cedulaNormalizada.substring(
      10,
      11
    )}`;
    if (!validarCedula(cedulaFormateada)) {
      setNotification({
        message: "Formato de cédula incorrecto (ej: 001-1234567-8).",
        type: "error",
      });
      return;
    }
    if (!validarTelefono(telefono)) {
      setNotification({
        message: "Teléfono inválido (mínimo 7 dígitos).",
        type: "error",
      });
      return;
    }
    // Subsector "Otro": el texto libre no puede quedar vacío.
    if (ubicacion.subsectorEsOtro && !normalizarSubsector(ubicacion.subsector)) {
      setNotification({ message: "Escribe el subsector", type: "error" });
      return;
    }
    // Validación de ubicación electoral: sector, subsector, recinto y colegio
    // deben tener valor (incluido "No identificado"). La zona ya viene fija.
    if (
      !ubicacion.sector ||
      !ubicacion.subsector ||
      !ubicacion.recinto ||
      !ubicacion.colegioElectoral
    ) {
      setNotification({
        message:
          "Por favor, completa la ubicación electoral (sector, subsector, recinto y colegio).",
        type: "error",
      });
      return;
    }

    // Opcional: Validar que el pin esté ubicado
    if (
      !coordinates ||
      (coordinates.lat === MAP_INITIAL_CENTER.lat &&
        coordinates.lng === MAP_INITIAL_CENTER.lng)
    ) {
      setNotification({
        message:
          "Por favor, arrastra el pin en el mapa para especificar la ubicación.",
        type: "error",
      });
    }

    setLoading(true);

    // Call the Callable Function
    try {
      const result = await registerSimpatizanteCallable({
        // Pass form data
        nombre,
        cedula: cedulaFormateada,
        telefono,
        provincia: selectedProvincia, // Valor fijo: Santo Domingo
        municipio: selectedMunicipio, // Valor fijo: Santo Domingo Oeste
        // Ubicación electoral ("No identificado" se envía como "")
        zona: limpiarUbicacion(ubicacion.zona),
        sector: limpiarUbicacion(ubicacion.sector),
        subsector: ubicacion.subsectorEsOtro
          ? normalizarSubsector(ubicacion.subsector)
          : limpiarUbicacion(ubicacion.subsector),
        recinto: limpiarUbicacion(ubicacion.recinto),
        colegioElectoral: limpiarUbicacion(ubicacion.colegioElectoral),
        // Enviar las coordenadas
        lat: coordinates.lat,
        lng: coordinates.lng,
        // Pass activist's data
        registradoPor: user.uid,
        registradoPorEmail: user.email,
      });

      if (result.data.success) {
        setNotification({ message: result.data.message, type: "success" });
        // Clear form y reset location states a fixed values
        setNombre("");
        setCedula("");
        setTelefono("");
        setSelectedProvincia(PROVINCIA_FIJA);
        setSelectedMunicipio(MUNICIPIO_FIJO);
        setUbicacion(UBICACION_INICIAL);
        setCoordinates(MAP_INITIAL_CENTER);
      } else {
        setNotification({ message: result.data.message, type: "error" });
      }
    } catch (error) {
      console.error("Error calling registerSimpatizante:", error);
      setNotification({
        message: error.message || "No se pudo completar el registro.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadError) return <div>Error al cargar Google Maps.</div>;
  if (!isLoaded) return <Loader message="Cargando Mapa..." />;

  return (
    <div className="register-container">
      <form className="register-form register-form--activist" onSubmit={handleSubmit}>
        <h2>Registrar Nuevo Simpatizante</h2>
        <p>Los datos se asociarán a tu perfil.</p>

        {/* Cédula: Nuevo manejo de cambio */}
        <div className="input-group">
          <label htmlFor="cedula">Cédula de Identidad</label>
          <input
            type="text"
            id="cedula"
            placeholder="001-1234567-8"
            value={cedula}
            onChange={handleCedulaChange}
            required
            disabled={isSearching || loading}
          />
        </div>

        <div className="input-group">
          <label htmlFor="nombre">Nombre Completo</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={isSearching || loading}
          />
        </div>
        <div className="input-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="tel"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={isSearching || loading}
          />
        </div>

        {/* Provincia: Fija y deshabilitada */}
        <div className="input-group">
          <label htmlFor="provincia">Provincia</label>
          <select
            id="provincia"
            value={selectedProvincia}
            onChange={(e) => setSelectedProvincia(e.target.value)}
            required
            disabled={true}
          >
            <option value={PROVINCIA_FIJA}>{PROVINCIA_FIJA}</option>
          </select>
        </div>
        {/* Municipio: Fijo y deshabilitado */}
        <div className="input-group">
          <label htmlFor="municipio">Municipio</label>
          <select
            id="municipio"
            value={selectedMunicipio}
            onChange={(e) => setSelectedMunicipio(e.target.value)}
            required
            disabled={true}
          >
            <option value={MUNICIPIO_FIJO}>{MUNICIPIO_FIJO}</option>
          </select>
        </div>

        {/* Ubicación electoral: Zona → Sector → Subsector → Recinto → Colegio */}
        <UbicacionElectoralFields
          value={ubicacion}
          onChange={handleUbicacionChange}
          disabled={isSearching || loading}
        />

        {/* ---------------------------------------------------- */}
        {/* Contenedor del Mapa de Google Maps */}
        {/* ---------------------------------------------------- */}
        <div className="map-group">
          <label>📍 Ubicación Exacta (Arrastra el Pin)</label>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={MAP_DEFAULT_ZOOM}
            center={coordinates}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            <Marker
              position={coordinates}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
            />
          </GoogleMap>
          <p className="coords-display">
            Coordenadas: Lat: {coordinates.lat.toFixed(6)}, Lng:{" "}
            {coordinates.lng.toFixed(6)}
          </p>
        </div>

        <button type="submit" disabled={loading || isSearching}>
          {loading
            ? "Registrando..."
            : isSearching
            ? "Buscando..."
            : "Registrar Simpatizante"}
        </button>

        {/* Notification Area */}
        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </form>
    </div>
  );
}

export default RegisterByActivist;
````

## File: src/components/pages/PublicRegister.js
````javascript
import React, { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getDoc } from "firebase/firestore";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useAnalytics } from "../../utils/analytics";
import {
  ZONA_FIJA,
  SECTOR_FIJO,
  OPCION_NO_IDENTIFICADO,
  normalizarSubsector,
} from "../../data/ubicacionElectoral";
import UbicacionElectoralFields from "../ui/UbicacionElectoralFields";
import logo from "../../Felix/Inscribete.png";
import {
  PROVINCIA_FIJA,
  MUNICIPIO_FIJO,
  MAP_INITIAL_CENTER,
  MAP_DEFAULT_ZOOM,
  CEDULA_REGEX,
} from "../../constants";

const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  marginBottom: "20px",
  borderRadius: "8px",
};
const initialCenter = MAP_INITIAL_CENTER;
const defaultZoom = MAP_DEFAULT_ZOOM;
const libraries = ["places"];

// Estado inicial de la ubicación electoral (zona y sector fijos por ahora)
const UBICACION_INICIAL = {
  zona: ZONA_FIJA,
  sector: SECTOR_FIJO,
  subsector: "",
  subsectorEsOtro: false,
  recinto: "",
  colegioElectoral: "",
};

// Convierte "No identificado" en cadena vacía para el payload.
const limpiarUbicacion = (valor) =>
  valor === OPCION_NO_IDENTIFICADO ? "" : valor;

function useQuery() {
  const location = useLocation();
  return React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
}

const validarCedula = (cedula) => CEDULA_REGEX.test(cedula);
const validarTelefono = (telefono) => {
  const telefonoRegex = /^[\d\s-]{7,}$/;
  return telefono === "" || telefonoRegex.test(telefono);
};

const functions = getFunctions();
const registerSimpatizanteCallable = httpsCallable(functions, "registerSimpatizante");
const searchVotanteCallable = httpsCallable(functions, "searchVotanteByCedula");

function PublicRegister() {
  // Form field states
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Estados de carga y búsqueda
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { trackCampaignEvents } = useAnalytics();

  const [selectedProvincia, setSelectedProvincia] = useState(PROVINCIA_FIJA);
  const [selectedMunicipio, setSelectedMunicipio] = useState(MUNICIPIO_FIJO);
  const [ubicacion, setUbicacion] = useState(UBICACION_INICIAL);
  const [coordinates, setCoordinates] = useState(initialCenter);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const queryParams = useQuery();
  const referrerId = queryParams.get("ref");
  const navigate = useNavigate();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries,
  });

  const onMarkerDragEnd = useCallback((event) => {
    setCoordinates({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  }, []);

  // Al cambiar un campo de ubicación; si cambia "recinto", resetea el colegio.
  const handleUbicacionChange = (campo, valor) => {
    setUbicacion((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "recinto") {
        next.colegioElectoral = "";
      }
      return next;
    });
  };

  const handleCedulaSearch = useCallback(async (inputCedula) => {
    const cedulaNormalizada = inputCedula.replace(/-/g, "");

    if (cedulaNormalizada.length === 11 && validarCedula(inputCedula)) {
      setIsSearching(true);
      setNotification({ message: "Buscando datos...", type: "info" });

      try {
        const result = await searchVotanteCallable({ cedula: inputCedula });
        const { found, data } = result.data;

        if (found) {
          setNombre(data.nombre);

          if (data.telefono) setTelefono(data.telefono);

          setNotification({
            message: "Datos cargados correctamente.",
            type: "success",
          });
        } else {
          setNombre("");
          setNotification({
            message: "No encontrado en el padrón.",
            type: "error",
          });
        }
      } catch (error) {
        console.error(error);
        setNotification({ message: "Error de conexión.", type: "error" });
      } finally {
        setIsSearching(false);
      }
    }
  }, []);

  const handleCedulaChange = (e) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    const normalized = input.slice(0, 11);

    let formatted = normalized;
    if (normalized.length > 3) {
      formatted = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    }
    if (normalized.length > 10) {
      formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
    }

    setCedula(formatted);

    if (normalized.length === 11) {
      if (validarCedula(formatted)) {
        handleCedulaSearch(formatted);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" });

    if (isSearching || loading) return;

    if (!aceptaTerminos) {
      setNotification({ message: "Debes aceptar los términos y condiciones.", type: "error" });
      return;
    }

    const cedulaNormalizada = cedula.replace(/-/g, "");
    if (cedulaNormalizada.length !== 11) {
      setNotification({ message: "Formato de cédula incorrecto (debe tener 11 dígitos).", type: "error" });
      return;
    }

    const cedulaFormateada = `${cedulaNormalizada.substring(0, 3)}-${cedulaNormalizada.substring(3, 10)}-${cedulaNormalizada.substring(10, 11)}`;
    if (!validarCedula(cedulaFormateada)) {
      setNotification({ message: "Formato de cédula incorrecto (ej: 001-1234567-8).", type: "error" });
      return;
    }
    if (!validarTelefono(telefono)) {
      setNotification({ message: "Teléfono inválido (mínimo 7 dígitos).", type: "error" });
      return;
    }
    // Subsector "Otro": el texto libre no puede quedar vacío.
    if (ubicacion.subsectorEsOtro && !normalizarSubsector(ubicacion.subsector)) {
      setNotification({ message: "Escribe el subsector", type: "error" });
      return;
    }
    // Validación de ubicación electoral: sector, subsector, recinto y colegio
    // deben tener valor (incluido "No identificado"). La zona ya viene fija.
    if (
      !ubicacion.sector ||
      !ubicacion.subsector ||
      !ubicacion.recinto ||
      !ubicacion.colegioElectoral
    ) {
      setNotification({
        message:
          "Por favor, completa la ubicación electoral (sector, subsector, recinto y colegio).",
        type: "error",
      });
      return;
    }

    if (!coordinates || (coordinates.lat === initialCenter.lat && coordinates.lng === initialCenter.lng)) {
      setNotification({
        message: "Por favor, arrastra el pin en el mapa para especificar tu ubicación exacta.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    let registeredByData = {
      registradoPor: "Página Pública",
      registradoPorEmail: null,
    };

    if (referrerId) {
      try {
        const userDocRef = doc(db, "users", referrerId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          registeredByData = {
            registradoPor: referrerId,
            registradoPorEmail: userDocSnap.data().email,
          };
        } else {
          setNotification({ message: "El enlace de referido no es válido.", type: "error" });
          setLoading(false);
          navigate("/registro");
          return;
        }
      } catch (error) {
        setNotification({ message: "Error al verificar el referido.", type: "error" });
        setLoading(false);
        return;
      }
    }

    try {
      const registrationData = {
        nombre,
        cedula: cedulaFormateada,
        telefono,
        provincia: selectedProvincia,
        municipio: selectedMunicipio,
        // Ubicación electoral ("No identificado" se envía como "")
        zona: limpiarUbicacion(ubicacion.zona),
        sector: limpiarUbicacion(ubicacion.sector),
        subsector: ubicacion.subsectorEsOtro
          ? normalizarSubsector(ubicacion.subsector)
          : limpiarUbicacion(ubicacion.subsector),
        recinto: limpiarUbicacion(ubicacion.recinto),
        colegioElectoral: limpiarUbicacion(ubicacion.colegioElectoral),
        lat: coordinates.lat,
        lng: coordinates.lng,
        ...registeredByData,
      };

      const result = await registerSimpatizanteCallable(registrationData);

      if (result.data.success) {
        setNotification({ message: result.data.message, type: "success" });

        trackCampaignEvents.registerSimpatizante();

        // Limpiar el estado del formulario
        setNombre("");
        setCedula("");
        setTelefono("");
        setAceptaTerminos(false);
        setSelectedProvincia(PROVINCIA_FIJA);
        setSelectedMunicipio(MUNICIPIO_FIJO);
        setUbicacion(UBICACION_INICIAL);
        setCoordinates(initialCenter);
      } else {
        setNotification({ message: result.data.message, type: "error" });
      }
    } catch (error) {
      console.error("Error calling registerSimpatizante:", error);
      setNotification({
        message: error.message || "No se pudo completar el registro.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadError)
    return (
      <div className="register-container">
        <p className="notification error">
          Error al cargar el mapa de Google Maps. Por favor, verifica la clave API.
        </p>
      </div>
    );

  if (!isLoaded)
    return (
      <div className="register-container">
        <p className="notification success">Cargando formulario y mapa...</p>
      </div>
    );

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        {referrerId && (
          <p className="referrer-info">Registro referido por un activista.</p>
        )}
        <div className="logo-container">
          <img src={logo} alt="Inscríbete" className="register-logo" />
        </div>
        <h2>Regístrate como simpatizante de Felix Encarnación</h2>
        <p>¡Quiero ser parte!</p>

        {/* Cédula */}
        <div className="input-group">
          <label htmlFor="cedula">Cédula de Identidad</label>
          <input
            type="text"
            id="cedula"
            placeholder="001-1234567-8"
            value={cedula}
            onChange={handleCedulaChange}
            required
            disabled={isSearching || loading}
          />
        </div>

        {/* Nombre */}
        <div className="input-group">
          <label htmlFor="nombre">Nombre Completo</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={isSearching || loading}
          />
        </div>

        {/* Teléfono */}
        <div className="input-group">
          <label htmlFor="telefono">Teléfono / Celular</label>
          <input
            type="tel"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={isSearching || loading}
          />
        </div>

        {/* Provincia */}
        <div className="input-group">
          <label htmlFor="provincia">Provincia</label>
          <select
            id="provincia"
            value={selectedProvincia}
            onChange={(e) => setSelectedProvincia(e.target.value)}
            required
            disabled={true}
          >
            <option value={PROVINCIA_FIJA}>{PROVINCIA_FIJA}</option>
          </select>
        </div>

        {/* Municipio */}
        <div className="input-group">
          <label htmlFor="municipio">Municipio</label>
          <select
            id="municipio"
            value={selectedMunicipio}
            onChange={(e) => setSelectedMunicipio(e.target.value)}
            required
            disabled={true}
          >
            <option value={MUNICIPIO_FIJO}>{MUNICIPIO_FIJO}</option>
          </select>
        </div>

        {/* Ubicación electoral: Zona → Sector → Subsector → Recinto → Colegio */}
        <UbicacionElectoralFields
          value={ubicacion}
          onChange={handleUbicacionChange}
          disabled={isSearching || loading}
        />

        {/* Google Maps */}
        <div className="map-group input-group">
          <label className="map-label">
            📍 Ubicación Exacta (Arrastra el Pin)
          </label>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={defaultZoom}
            center={coordinates}
          >
            <Marker
              position={coordinates}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
            />
          </GoogleMap>
          <p className="coords-display">
            Coordenadas: Lat: {coordinates.lat.toFixed(6)}, Lng:{" "}
            {coordinates.lng.toFixed(6)}
          </p>
        </div>

        {/* Checkbox de Términos */}
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="terminos"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            required
            disabled={isSearching || loading}
          />
          <label htmlFor="terminos">Acepto los términos y condiciones.</label>
        </div>

        <button type="submit" disabled={loading || isSearching}>
          {loading
            ? "Registrando..."
            : isSearching
            ? "Buscando..."
            : "Firmar y Enviar"}
        </button>

        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </form>
    </div>
  );
}

export default PublicRegister;
````

## File: src/components/pages/RegisterAppUser.js
````javascript
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, functions } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ROL_MULTIPLICADOR, normalizarCedula } from "../../constants";

function RegisterAppUser() {
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [votanteData, setVotanteData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const searchVotanteCallable = httpsCallable(functions, "searchVotanteByCedula");
  const registerSimpatizanteCallable = httpsCallable(functions, "registerSimpatizante");

  const validarCedula = (ced) => {
    return /^\d{3}-?\d{7}-?\d{1}$/.test(ced);
  };

  const handleCedulaChange = (e) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    const normalized = input.slice(0, 11);
    
    let formatted = normalized;
    if (normalized.length > 3) {
      formatted = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    }
    if (normalized.length > 10) {
      formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
    }
    
    setCedula(formatted);

    // Auto-buscar en el padrón cuando tiene 11 dígitos
    if (normalized.length === 11 && validarCedula(formatted)) {
      buscarVotante(formatted);
    }
  };

  const buscarVotante = async (cedulaBuscada) => {
    setIsSearching(true);
    setError("");
    setSuccessMsg("");
    try {
      const result = await searchVotanteCallable({ cedula: cedulaBuscada });
      const { found, data } = result.data;
      
      if (found) {
        setNombre(data.nombre);
        setVotanteData(data); // Guardamos toda la data del padrón para el simpatizante
        setSuccessMsg("Cédula encontrada en el padrón.");
      } else {
        setNombre("");
        setVotanteData(null);
        setError("Cédula no encontrada en el padrón. Puedes continuar escribiendo tu nombre.");
      }
    } catch (err) {
      console.error(err);
      setError("Error buscando en el padrón.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!validarCedula(cedula)) {
      setError("Formato de cédula incorrecto.");
      return;
    }

    setLoading(true);
    setError("");

    // Estándar: cédula SOLO dígitos en Firestore.
    const cedulaNorm = normalizarCedula(cedula);

    try {
      // 1. Crear el Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Guardar el nuevo usuario en la colección 'users' (sobrescribe la creación automática si llega antes)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        nombre: nombre,
        email: email,
        cedula: cedulaNorm,
        rol: ROL_MULTIPLICADOR,
        registrationCount: 0,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        metodoRegistro: "email"
      });

      // 3. Registrar como Simpatizante (si no está registrado aún)
      try {
        await registerSimpatizanteCallable({
          nombre: nombre,
          cedula: cedulaNorm,
          email: email,
          telefono: votanteData?.telefono || "",
          // Ubicación electoral: este flujo no la captura, se deja vacía
          // (no se autoasigna zona ni el resto de niveles).
          zona: "",
          sector: "",
          subsector: "",
          recinto: "",
          colegioElectoral: "",
          municipio: votanteData?.municipio || "N/A",
          provincia: votanteData?.provincia || "N/A",
          registradoPor: "App Reg Automático",
          esUsuarioInterno: true
        });
      } catch (simpErr) {
        // Ignoramos si "Ya registrado", eso está bien porque no duplicamos.
        console.warn("Registrando simpatizante fallback:", simpErr);
      }

      // 4. Redirigir al inicio
      navigate("/dashboard");

    } catch (err) {
      console.error("Error al registrar:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado.");
      } else {
        setError("Ocurrió un error al intentar crear tu cuenta.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleRegister}>
        <h2>Crear una Cuenta</h2>
        
        {error && <p className="error-message">{error}</p>}
        {successMsg && <p className="success-message" style={{ color: "green", fontSize: "0.9rem", marginBottom: "15px" }}>{successMsg}</p>}

        <div className="input-group">
          <label htmlFor="cedula">Cédula</label>
          <input
            type="text"
            id="cedula"
            value={cedula}
            onChange={handleCedulaChange}
            required
            disabled={loading || isSearching}
            placeholder="001-0000000-0"
          />
        </div>

        <div className="input-group">
          <label htmlFor="nombre">Nombre Completo</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={loading || isSearching}
            placeholder="Tu nombre completo"
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || isSearching}
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || isSearching}
            minLength="6"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary" disabled={loading || isSearching}>
            {loading ? "Creando Cuenta..." : isSearching ? "Buscando Padrón..." : "Registrarse"}
          </button>
        </div>

        <div className="extra-links">
          <p>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión aquí</Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default RegisterAppUser;
````

## File: src/data/navConfig.js
````javascript
// src/data/navConfig.js
// src/data/navConfig.js
import {
  FaHome, FaUserPlus, FaUsers, FaTasks, FaBullseye, FaLayerGroup, FaUser
} from 'react-icons/fa';
import { ROL_ADMIN, ROL_LIDER, ROL_MULTIPLICADOR } from '../constants';

export const getVisibleNavItems = (user) => {
  if (!user) return [];

  // 1. Ítems Comunes (Todo el mundo los ve)
  const commonItems = [
    {
      id: 'home',
      label: 'Inicio',
      path: '/dashboard',
      icon: FaHome,
      end: true, // IMPORTANTE: Forzamos 'end' aquí para evitar doble resaltado
    },
    {
      id: 'registro',
      label: 'Registro',
      path: '/dashboard/registrar', // Ruta hija
      icon: FaUserPlus,
    },
    {
      id: 'perfil',
      label: 'Perfil',
      path: '/dashboard/perfil',
      icon: FaUser,
    }
  ];

  // 2. Ítems de Admin
  if (user.rol === ROL_ADMIN) {
    return [
      ...commonItems,
      {
        id: 'usuarios',
        label: 'Usuarios',
        path: '/admin/usuarios',
        icon: FaUsers,
      },
      {
        id: 'equipos',
        label: 'Pelotones',
        path: '/admin/equipos',
        icon: FaTasks,
      },
      {
        id: 'comandos',
        label: 'Comandos',
        path: '/admin/comandos',
        icon: FaLayerGroup,
      },
    ];
  }

  // 3. Ítems de Líder / Multiplicador
  const roleItems = [...commonItems];

  if ([ROL_MULTIPLICADOR, ROL_LIDER].includes(user.rol)) {
    roleItems.push({
      id: 'meta',
      label: 'Meta',
      path: null, // Es una acción (botón), no una ruta
      isAction: true,
      icon: FaBullseye,
    });
  }

  return roleItems;
};
````

## File: src/constants.js
````javascript
// =============================================================================
// CONSTANTES CENTRALIZADAS — app-campana-rd
// Importar desde aquí para evitar duplicación en los componentes.
// =============================================================================

// --- Roles de Usuario ---
export const ROLES_DISPONIBLES = ["admin", "lider de zona", "multiplicador"];

export const ROL_ADMIN = "admin";
export const ROL_LIDER = "lider de zona";
export const ROL_MULTIPLICADOR = "multiplicador";

// --- Colecciones de Firestore ---
export const COLECCION_USERS = "users";
export const COLECCION_SIMPATIZANTES = "simpatizantes";
export const COLECCION_ORGANIGRAMA = "organigrama";

// --- Configuración de Paginación ---
export const USUARIOS_POR_PAGINA = 20;
export const SIMPATIZANTES_POR_PAGINA = 25;

// --- Meta del Padrón Electoral (también en .env como REACT_APP_PADRON_META) ---
export const TOTAL_PADRON_META =
  parseInt(process.env.REACT_APP_PADRON_META, 10) || 244000;

// --- Ubicación Fija (SDO) ---
export const PROVINCIA_FIJA = "Santo Domingo";
export const MUNICIPIO_FIJO = "Santo Domingo Oeste";

// --- Configuración de Storage ---
export const STORAGE_FOTOS_PATH = "votantes_fotos";

// --- Validaciones de Cédula ---
export const CEDULA_REGEX = /^\d{3}-?\d{7}-?\d{1}$/;
export const CEDULA_LONGITUD = 11;

// --- Validaciones de Teléfono ---
export const TELEFONO_REGEX = /^[\d\s-]{7,}$/;

// Valida el formato de una cédula dominicana (XXX-XXXXXXX-X).
export const validarCedula = (cedula) => CEDULA_REGEX.test(cedula);

// Normaliza una cédula al estándar de almacenamiento: SOLO dígitos, sin guiones
// ni espacios. Debe usarse antes de CUALQUIER escritura o consulta por cédula en
// Firestore, para evitar duplicados por diferencias de formato.
export const normalizarCedula = (cedula) =>
  (cedula === null || cedula === undefined ? "" : String(cedula)).replace(/\D/g, "");

// Valida un teléfono (mínimo 7 dígitos). Acepta cadena vacía (campo opcional).
export const validarTelefono = (telefono) =>
  telefono === "" || TELEFONO_REGEX.test(telefono);

// --- Coordenadas iniciales del mapa (Santo Domingo) ---
export const MAP_INITIAL_CENTER = { lat: 18.4861, lng: -69.9309 };
export const MAP_DEFAULT_ZOOM = 12;
````

## File: firebase.json
````json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "storage": {
    "rules": "storage.rules"
  }
}
````

## File: optimizacion.md
````markdown
# 🚀 Plan de Optimización — AppCampañaRD

> Plan de mejora basado en la revisión de arquitectura del proyecto.
> Marca cada casilla al completar la tarea y actualiza la tabla de seguimiento.

---

## 📋 Resumen del proyecto

PWA en React 19 (Create React App) + Firebase (Auth, Firestore, Functions, Storage, Hosting) para gestionar una campaña política en Santo Domingo Oeste. Captura simpatizantes (públicamente y vía activistas), mide cobertura del padrón y ofrece paneles diferenciados por rol (admin, líder de zona, multiplicador). Integra Google Maps, Chart.js y Resend.

---

## 🏗️ Arquitectura actual

- **Punto de entrada** (`src/index.js`): monta `<App/>` en `StrictMode` y registra el service worker solo en producción.
- **Routing** (`src/App.js`): `BrowserRouter` con layouts anidados (`PublicLayout`, `DashboardLayout`), guards `ProtectedRoute`/`PublicOnlyRoute` inline y rutas de admin condicionadas por rol.
- **Estado**: `AuthContext` (sesión + heartbeat 15 min), `ThemeContext` y un `LayoutContext` local. Sin capa de datos centralizada — cada componente consulta Firestore con `useEffect`.
- **Componentes**: 34 archivos planos en `src/components/`.
- **Datos/config**: `constants.js`, `data/ubicaciones.js`, `data/zonas.json`, `data/navConfig.js`.
- **Backend**: `functions/` con Cloud Functions callable y plantillas Resend.

---

## ✅ Tareas por categoría

### 🔧 Estructura y reutilización de componentes
- [x] Eliminar el `ProtectedRoute` duplicado (inline en `App.js` vs `src/ProtectedRoute.js` muerto)
- [x] Extraer el bloque "welcome-row" repetido 3× en `Dashboard.js` a `<DashboardWelcome/>`
- [x] Reorganizar `src/components/` en subcarpetas (`pages/`, `dashboard/`, `charts/`, `admin/`, `ui/`)
- [ ] Consolidar estilos inline dispersos en `global.css` o módulos CSS
- [x] Mover `useMediaQuery` de `App.js` a `hooks/useMediaQuery.js`

### 🗃️ Manejo de estado
- [ ] Introducir cache de datos (React Query/SWR) para evitar lecturas Firestore redundantes
- [x] Importar constantes desde `constants.js` en `RegisterByActivist.js` (no redefinir `PROVINCIA_FIJA`, `validarCedula`, etc.)
- [x] Reemplazar literales de rol mágicos (`"admin"`, `"lider de zona"`) por `ROL_ADMIN`/`ROL_LIDER`

### ⚡ Rendimiento
- [x] Aplicar `React.lazy` + `Suspense` por ruta (mapas, admin, gráficos)
- [ ] Resolver límite de query `in` de Firestore (>30 multiplicadores) con contadores agregados
- [ ] Evaluar frecuencia del heartbeat `updateDoc` cada 15 min en `AuthContext`
- [ ] Revisar carga bajo demanda de `xlsx` (peso y vulnerabilidades)

### 🎨 Funcionalidades faltantes / gaps de UX
- [x] Crear página 404 real (con layout, Navbar/Footer)
- [x] Añadir Error Boundary global
- [x] Unificar estados de carga en un componente `<Loader/>`
- [ ] Revisar accesibilidad (labels/aria) en formularios largos y mapa

### 🧪 Pruebas
- [x] Arreglar/eliminar `App.test.js` obsoleto ("learn react link")
- [x] Tests de validadores (cédula/teléfono)
- [x] Tests de `getVisibleNavItems` (lógica de rol pura)
- [ ] Tests de guards de ruta y flujo de registro

### 📝 Claridad del código / documentación
- [x] Quitar `console.log("DEBUG API Key…")` y comentarios de diagnóstico en `firebase.js`
- [x] Confirmar que `.env` no está versionado; rotar claves si se filtró
- [x] Eliminar `initializeAuthAndGetUser` si es código muerto
- [x] Limpiar comentarios de desarrollo ("❌ ELIMINAMOS", "[INICIO CORRECCIÓN SDO]", etc.)
- [x] Mover `fix_colors.js` y `setup-resend.bat` a `scripts/`
- [ ] Planear migración CRA → Vite (mediano plazo)

---

## 📊 Tabla de seguimiento

| # | Prioridad | Tarea | Categoría | Estado |
|---|-----------|-------|-----------|--------|
| 1 | 🔴 Alta | Quitar `console.log` de API key y diagnóstico en `firebase.js` | Documentación | ✅ Completada |
| 2 | 🔴 Alta | Confirmar `.env` no versionado; rotar claves si se filtró | Documentación | ✅ Completada |
| 3 | 🔴 Alta | Arreglar/eliminar `App.test.js` obsoleto | Pruebas | ✅ Completada |
| 4 | 🔴 Alta | Eliminar `ProtectedRoute.js` duplicado y `initializeAuthAndGetUser` muertos | Estructura | ✅ Completada |
| 5 | 🔴 Alta | Añadir Error Boundary global | UX | ✅ Completada |
| 6 | 🟡 Media | Importar constantes desde `constants.js` (roles, ubicación, regex) | Estado | ✅ Completada |
| 7 | 🟡 Media | Extraer `<DashboardWelcome/>` y `useMediaQuery` a sus archivos | Estructura | ✅ Completada |
| 8 | 🟡 Media | Aplicar `React.lazy`/`Suspense` por ruta | Rendimiento | ✅ Completada |
| 9 | 🟡 Media | Cache de datos (React Query/SWR) para Firestore | Estado | ⬜ Pendiente |
| 10 | 🟡 Media | Tests de validadores y `getVisibleNavItems` | Pruebas | ✅ Completada |
| 11 | 🟢 Baja | Reorganizar `src/components/` en subcarpetas | Estructura | ✅ Completada ⁽¹⁾ |
| 12 | 🟢 Baja | Resolver límite `in` de Firestore con contadores agregados | Rendimiento | ⬜ Pendiente |
| 13 | 🟢 Baja | Página 404 con layout, `<Loader/>` unificado, limpiar estilos inline | UX | ✅ Completada ⁽²⁾ |
| 14 | 🟢 Baja | Mover scripts a `scripts/`; **limpiar comentarios dev**; migración CRA → Vite | Documentación | 🟦 Parcial ⁽³⁾ |

**Leyenda de estado:** ⬜ Pendiente · 🟦 En progreso/Parcial · ✅ Completada

---

## 📈 Progreso general

- **Total de tareas:** 14
- **Completadas:** 11 / 14 (+ 1 parcial)
- **Alta prioridad:** 5 / 5
- **Media prioridad:** 4 / 5
- **Baja prioridad:** 2 / 4 (+ #14 parcial)

---

## 🗒️ Notas de implementación

- **⁽¹⁾ #11 (reorganización):** mapeo con decisiones de criterio a revisar — `RegisterByActivist` → `dashboard/` (es la ruta `/dashboard/registrar`); `NotFound` y `ZonasElectorales` → `pages/`; `EmailStatus` → `ui/` y `EmailTest` → `admin/`; `ErrorBoundary` → `ui/`. Imports actualizados y verificados con `npm run build`. **Posible código muerto detectado** (no eliminado, fuera de alcance): `ZonasElectorales`, `MyRegistrations`, `EmailTest` no parecen importados desde ninguna ruta/componente.
- **⁽²⁾ #13:** entregables principales hechos (página 404 con layout + `<Loader/>` unificado en loaders de página/ruta). El subpunto "limpiar estilos inline" es trabajo más amplio que se solapa con *"Consolidar estilos inline dispersos"* (estructura, pendiente) y **no** se abordó. Loaders internos de componentes (`LoadingSpinner` de `ManageUsers`, `<p>` inline de `MyTeam`/`EditUserModal`) se dejaron sin migrar para evitar regresiones visuales.
- **⁽³⁾ #14 (parcial):** `fix_colors.js` y `setup-resend.bat` movidos a `scripts/` (14a) y comentarios de desarrollo limpiados (14b). **Migración CRA → Vite queda fuera de alcance** por indicación del usuario. La limpieza de comentarios se ciñó al chatter de proceso (emojis, "ELIMINAMOS/PASO/FIX/NUEVO/CORRECCIÓN/<---"); se conservaron comentarios explicativos y numeraciones genéricas sueltas. Nota: `RESEND_IMPLEMENTATION_SUMMARY.md` aún referencia la ruta vieja de `setup-resend.bat`.
- **#2:** marcada como completada en el checklist por el usuario; la verificación del historial de git (`.env` versionado / rotación de claves) **no** fue ejecutada por el asistente.
- **#6:** en `EmailTest.js` se dejaron `'coordinador'`/`'supervisor'` como literales (no tienen constante en `constants.js`).
- **#9 (cache de datos):** fuera de alcance por indicación del usuario (no implementar React Query/SWR).
````

## File: src/utils/fotoExport.js
````javascript
import { ref, getBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import * as fotoCache from "./fotoCache";

// Máximo lado (px) de la foto redimensionada antes de exportar. Mantiene el
// archivo final (PDF/Excel) pequeño sin degradar demasiado la miniatura.
const MAX_LADO = 240;
// Calidad JPEG al recomprimir en el canvas.
const JPEG_QUALITY = 0.8;

/**
 * Réplica de la lógica de rutas de src/components/ui/AvatarFoto.js.
 *
 * Las fotos en Storage pueden estar nombradas SIN guiones (00112345678.jpg)
 * o CON guiones (001-1234567-8.jpg). Reconstruimos ambos formatos desde los
 * dígitos y probamos.
 *
 * ORDEN de formato de cédula — SIN guiones PRIMERO: las fotos NUEVAS (cámara,
 * correctas) se suben con la cédula normalizada; las VIEJAS del padrón
 * (frecuentemente de otra persona) están con guiones y quedan solo como
 * respaldo. NO invertir este orden: acertar antes con la del padrón mostraría
 * la cara equivocada.
 *
 * ORDEN de extensión — .jpg PRIMERO (el más común), luego JPG, jpeg, png: así
 * el sondeo acierta cuanto antes y hace menos llamadas fallidas.
 *
 * @param {string} cedula
 * @returns {string[]} 8 rutas candidatas en Storage.
 */
export function getPathsToTry(cedula) {
  if (!cedula) return [];

  const digitos = String(cedula).replace(/\D/g, "");
  const cedulaSinGuiones = digitos;
  const cedulaConGuiones =
    digitos.length === 11
      ? `${digitos.slice(0, 3)}-${digitos.slice(3, 10)}-${digitos.slice(10)}`
      : String(cedula);

  return [
    `votantes_fotos/${cedulaSinGuiones}.jpg`,
    `votantes_fotos/${cedulaSinGuiones}.JPG`,
    `votantes_fotos/${cedulaSinGuiones}.jpeg`,
    `votantes_fotos/${cedulaSinGuiones}.png`,
    `votantes_fotos/${cedulaConGuiones}.jpg`,
    `votantes_fotos/${cedulaConGuiones}.JPG`,
    `votantes_fotos/${cedulaConGuiones}.jpeg`,
    `votantes_fotos/${cedulaConGuiones}.png`,
  ];
}

/**
 * Lee un blob como data URL base64 usando FileReader.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Carga una imagen desde una data URL en un elemento <img>.
 * @param {string} dataUrl
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo decodificar la imagen"));
    img.src = dataUrl;
  });
}

/**
 * Redimensiona una imagen a MAX_LADO en el lado mayor y la recomprime como
 * JPEG para no inflar el archivo final. Si algo falla, devuelve el original.
 * @param {string} dataUrl
 * @returns {Promise<{ dataUrl: string, width: number, height: number, mime: string }>}
 */
async function redimensionar(dataUrl) {
  const img = await loadImage(dataUrl);
  const { naturalWidth: w0, naturalHeight: h0 } = img;

  const escala = Math.min(1, MAX_LADO / Math.max(w0, h0));
  const width = Math.max(1, Math.round(w0 * escala));
  const height = Math.max(1, Math.round(h0 * escala));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
    width,
    height,
    mime: "image/jpeg",
  };
}

/**
 * Deriva el mime de una URL/ruta a partir de su extensión (ignora query).
 * @param {string} urlOrPath
 * @returns {string}
 */
function mimePorExtension(urlOrPath) {
  const limpio = String(urlOrPath).split("?")[0].toLowerCase();
  return limpio.endsWith(".png") ? "image/png" : "image/jpeg";
}

/**
 * Sondea las rutas candidatas y devuelve el downloadURL de la primera que
 * exista, o null. Uso interno de resolveFotoUrl.
 * @param {string} cedula
 * @returns {Promise<string|null>}
 */
async function sondearFotoUrl(cedula) {
  const paths = getPathsToTry(cedula);
  for (const path of paths) {
    try {
      return await getDownloadURL(ref(storage, path));
    } catch {
      // Ruta inexistente (404) u otro error: probamos la siguiente.
    }
  }
  return null;
}

/**
 * Resuelve el downloadURL de la foto de una cédula, con CACHE COMPARTIDO.
 *
 * El sondeo de hasta 8 rutas se hace UNA sola vez por cédula y sesión: tanto
 * AvatarFoto (que usa la URL en un <img>) como el export (que la usa para
 * getBytes) reutilizan la misma promesa. Cachea también los negativos (null)
 * para no re-sondear a quienes no tienen foto.
 *
 * @param {string} cedula
 * @returns {Promise<string|null>}
 */
export function resolveFotoUrl(cedula) {
  if (!cedula) return Promise.resolve(null);
  const cacheada = fotoCache.get(cedula);
  if (cacheada) return cacheada;
  return fotoCache.set(cedula, sondearFotoUrl(cedula));
}

/**
 * Descarga la foto de una cédula desde Storage como base64.
 *
 * Resuelve la URL vía cache compartido (resolveFotoUrl) y lee sus bytes con
 * getBytes() del SDK (petición autenticada por el SDK, NO un fetch() directo).
 * Esto evita el bloqueo CORS que sí afecta a fetch(downloadURL) — motivo por el
 * que antes las fotos salían como placeholder gris en el PDF/Excel. Con
 * getBytes el canvas tampoco queda "tainted".
 *
 * Luego redimensiona/recomprime por canvas y devuelve un objeto
 * { dataUrl, width, height, mime }, o null si la persona no tiene foto.
 *
 * @param {string} cedula
 * @returns {Promise<{ dataUrl: string, width: number, height: number, mime: string } | null>}
 */
export async function fetchFotoBase64(cedula) {
  const url = await resolveFotoUrl(cedula);
  if (!url) return null; // sin foto -> placeholder

  try {
    const bytes = await getBytes(ref(storage, url));
    const mime = mimePorExtension(url);
    const blob = new Blob([bytes], { type: mime });
    const dataUrl = await blobToDataUrl(blob);

    try {
      return await redimensionar(dataUrl);
    } catch {
      // Si el redimensionado falla, devolvemos el original sin dimensiones.
      return { dataUrl, width: null, height: null, mime };
    }
  } catch (err) {
    console.error(
      `fetchFotoBase64: no se pudo leer la foto de ${cedula}:`,
      err && err.code ? err.code : err && err.message
    );
    return null;
  }
}

/**
 * Descarga las fotos de un array de personas con concurrencia limitada.
 *
 * No falla en bloque si una foto falla: cada resultado es independiente.
 *
 * @param {Array<{ cedula: string }>} personas
 * @param {{ concurrency?: number, onProgress?: (hechos: number, total: number) => void }} [opts]
 * @returns {Promise<Map<string, ({ dataUrl, width, height, mime } | null)>>}
 *          Map cedula -> resultado de fetchFotoBase64 (o null).
 */
export async function fetchFotosBatch(
  personas,
  { concurrency = 6, onProgress } = {}
) {
  const resultado = new Map();
  const lista = Array.isArray(personas) ? personas : [];
  const total = lista.length;
  let hechos = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < lista.length) {
      const index = cursor++;
      const persona = lista[index];
      const cedula = persona && persona.cedula;

      let foto = null;
      if (cedula) {
        try {
          foto = await fetchFotoBase64(cedula);
        } catch {
          foto = null;
        }
        resultado.set(cedula, foto);
      }

      hechos++;
      if (typeof onProgress === "function") onProgress(hechos, total);
    }
  };

  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, lista.length || 1)) },
    () => worker()
  );
  await Promise.all(workers);

  return resultado;
}
````

## File: src/index.js
````javascript
import React from "react";
import ReactDOM from "react-dom/client";
import "./global.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import ErrorBoundary from "./components/ui/ErrorBoundary";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// --- REGISTRO DEL SERVICE WORKER ---
// Solo registra el SW en producción para evitar problemas de caché en desarrollo.
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // En CRA el SW se sirve desde la raíz ('/').
    const swUrl = `/service-worker.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("Service Worker registrado:", registration.scope);
      })
      .catch((error) => {
        console.error("Fallo el registro de Service Worker:", error);
      });
  });
}
````

## File: firestore.rules
````
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ==========================================================
    // 1. FUNCIONES DE AYUDA (REUTILIZABLES)
    // ==========================================================
    
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.rol == 'admin';
    }

    // Permite ver el perfil de TU LÍDER (Subordinado -> Jefe)
    function isMyAssignedLeader(leaderId) {
      return isSignedIn() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.liderAsignado == leaderId;
    }

    // ==========================================================
    // 2. COLECCIÓN: USERS (Perfiles de Equipo)
    // ==========================================================
    match /users/{userId} {
      
      // Nueva función auxiliar local:
      // ¿El documento que intentas leer dice que TÚ eres su líder?
      function isAssignedToMe() {
        return isSignedIn() && resource.data.liderAsignado == request.auth.uid;
      }

      // LEER (get): 
      // 1. Es mi perfil (isOwner)
      // 2. Soy Admin (isAdmin)
      // 3. Es el perfil de mi jefe (isMyAssignedLeader)
      // 4. NUEVO: Es el perfil de alguien de mi equipo (isAssignedToMe)
      allow get: if isOwner(userId) || isAdmin() || isMyAssignedLeader(userId) || isAssignedToMe();
      
      // LISTAR (consultas): 
      // 1. Admin
      // 2. NUEVO: Consultas donde filtro por "liderAsignado == mi ID"
      allow list: if isAdmin() || isAssignedToMe();

      // CREAR: Permitido si el UID coincide (Login Google/AuthContext)
      allow create: if isOwner(userId);
      
      // ACTUALIZAR: Admin (todo) o Dueño (campos limitados).
      allow update: if isAdmin() 
                    || (isOwner(userId) && 
                        request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['lastActivity', 'forceLogout', 'goal', 'fotoUrl', 'customPhotoUrl']));

      // BORRAR: Solo Admin.
      allow delete: if isAdmin();
    }

    // ==========================================================
    // 3. COLECCIÓN: SIMPATIZANTES (Registros)
    // ==========================================================
    match /simpatizantes/{docId} {
      // CREAR: Usuarios logueados.
      allow create: if isSignedIn();

      // LEER: Todo el equipo logueado.
      allow read: if isSignedIn();

      // EDICIÓN/BORRADO: Solo Admin.
      allow update, delete: if isAdmin();
    }

    // ==========================================================
    // 4. COLECCIÓN: VOTANTES (Padrón - Solo Lectura)
    // ==========================================================
    match /votantes/{cedula} {
      allow get: if isSignedIn();
      allow list: if false;
      allow write: if false;
    }
    
    // ==========================================================
    // 5. COLECCIÓN: ORGANIGRAMA (Gestión de Comandos)
    // ==========================================================
    match /organigrama/{docId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
````

## File: src/components/admin/CreateUser.js
````javascript
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, updateDoc } from "firebase/firestore";
import { subirFotoUsuario } from "../../utils/subirFotoUsuario";
import {
  ROL_ADMIN,
  ROL_LIDER,
  ROL_MULTIPLICADOR,
  PROVINCIA_FIJA,
  MUNICIPIO_FIJO,
  CEDULA_LONGITUD,
  validarCedula,
  validarTelefono,
} from "../../constants";
import {
  ZONA_FIJA,
  SECTOR_FIJO,
  OPCION_NO_IDENTIFICADO,
  normalizarSubsector,
} from "../../data/ubicacionElectoral";
import UbicacionElectoralFields from "../ui/UbicacionElectoralFields";

// Cloud Functions
const functions = getFunctions();
const createUserAdminCallable = httpsCallable(functions, "createUserAdmin");
const searchVotanteCallable = httpsCallable(functions, "searchVotanteByCedula");

// Estado inicial de la ubicación electoral (zona y sector fijos por ahora)
const UBICACION_INICIAL = {
  zona: ZONA_FIJA,
  sector: SECTOR_FIJO,
  subsector: "",
  subsectorEsOtro: false,
  recinto: "",
  colegioElectoral: "",
};

// Convierte "No identificado" en cadena vacía para el payload.
const limpiarUbicacion = (valor) =>
  valor === OPCION_NO_IDENTIFICADO ? "" : valor;

function CreateUser() {
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState(UBICACION_INICIAL);
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(ROL_MULTIPLICADOR);

  // Foto OPCIONAL: se elige aquí pero NO se sube hasta que el usuario exista
  // (necesitamos su cédula/uid). Guardamos el File y una URL de preview local.
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  // Revoca la URL de preview al cambiar de foto o al desmontar (evita fugas).
  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  // Al elegir una foto: guardamos el File y generamos la miniatura. NO subimos
  // todavía; la subida ocurre tras crear el usuario en handleCreateUser.
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    setFotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setFotoFile(file || null);
  };

  // Al cambiar un campo de ubicación; si cambia "recinto", resetea el colegio.
  const handleUbicacionChange = (campo, valor) => {
    setUbicacion((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "recinto") {
        next.colegioElectoral = "";
      }
      return next;
    });
  };

  // Autocompletar desde el padrón cuando la cédula está completa
  const buscarVotante = useCallback(async (cedulaFormateada) => {
    setIsSearching(true);
    try {
      const result = await searchVotanteCallable({ cedula: cedulaFormateada });
      const { found, data } = result.data;
      if (found) {
        setNombre(data.nombre || "");
        if (data.telefono) setTelefono(data.telefono);
        setNotification({ message: "Datos cargados desde el padrón.", type: "success" });
      } else {
        setNotification({ message: "Cédula no encontrada en el padrón. Completa los datos manualmente.", type: "info" });
      }
    } catch (error) {
      console.error("Error buscando en el padrón:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Formato visual con guiones (XXX-XXXXXXX-X) + disparo de búsqueda
  const handleCedulaChange = (e) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    const normalized = input.slice(0, 11);
    let formatted = normalized;
    if (normalized.length > 3) formatted = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    if (normalized.length > 10) formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
    setCedula(formatted);
    if (normalized.length === CEDULA_LONGITUD && validarCedula(formatted)) {
      buscarVotante(formatted);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" });

    const cedulaNormalizada = cedula.replace(/-/g, "");
    if (cedulaNormalizada.length !== CEDULA_LONGITUD || !validarCedula(cedula)) {
      setNotification({ message: "Formato de cédula incorrecto (ej: 001-1234567-8).", type: "error" });
      return;
    }
    // Teléfono OBLIGATORIO
    if (!telefono.trim() || !validarTelefono(telefono)) {
      setNotification({ message: "El teléfono es obligatorio (mínimo 7 dígitos).", type: "error" });
      return;
    }
    if (password.length < 6) {
      setNotification({ message: "La contraseña debe tener al menos 6 caracteres.", type: "error" });
      return;
    }
    // Subsector "Otro": el texto libre no puede quedar vacío.
    if (ubicacion.subsectorEsOtro && !normalizarSubsector(ubicacion.subsector)) {
      setNotification({ message: "Escribe el subsector", type: "error" });
      return;
    }
    // Validación de ubicación electoral: sector, subsector, recinto y colegio
    // deben tener valor (incluido "No identificado"). La zona ya viene fija.
    if (
      !ubicacion.sector ||
      !ubicacion.subsector ||
      !ubicacion.recinto ||
      !ubicacion.colegioElectoral
    ) {
      setNotification({
        message:
          "Por favor, completa la ubicación electoral (sector, subsector, recinto y colegio).",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createUserAdminCallable({
        nombre,
        cedula: cedulaNormalizada,
        email, // opcional; el backend sintetiza uno si viene vacío
        telefono,
        provincia: PROVINCIA_FIJA,
        municipio: MUNICIPIO_FIJO,
        // Ubicación electoral ("No identificado" se envía como "")
        zona: limpiarUbicacion(ubicacion.zona),
        sector: limpiarUbicacion(ubicacion.sector),
        subsector: ubicacion.subsectorEsOtro
          ? normalizarSubsector(ubicacion.subsector)
          : limpiarUbicacion(ubicacion.subsector),
        recinto: limpiarUbicacion(ubicacion.recinto),
        colegioElectoral: limpiarUbicacion(ubicacion.colegioElectoral),
        password,
        rol,
      });

      if (result.data.success) {
        // El usuario YA quedó creado. Si el admin eligió foto, la subimos ahora
        // (aislado): si la subida falla, NO reventamos: el usuario sigue creado
        // y se avisa que la foto puede agregarse editándolo.
        let mensaje = result.data.message || "Usuario creado.";
        let tipo = "success";
        if (fotoFile) {
          setSubiendoFoto(true);
          try {
            const { fotoPath } = await subirFotoUsuario(fotoFile, cedulaNormalizada);
            // Persistimos la ruta en el doc del usuario recién creado (id === uid).
            if (result.data.uid) {
              await updateDoc(doc(db, "users", result.data.uid), { fotoPath });
            }
          } catch (fotoError) {
            console.error("Error subiendo la foto del nuevo usuario:", fotoError);
            mensaje =
              "Usuario creado, pero la foto no se pudo subir (agrégala editando el usuario).";
            tipo = "info";
          } finally {
            setSubiendoFoto(false);
          }
        }

        setNotification({ message: mensaje, type: tipo });
        // Limpiar formulario
        setNombre("");
        setCedula("");
        setEmail("");
        setTelefono("");
        setUbicacion(UBICACION_INICIAL);
        setPassword("");
        setRol(ROL_MULTIPLICADOR);
        setFotoFile(null);
        setFotoPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }
    } catch (error) {
      console.error("Error al llamar a createUserAdmin:", error);
      setNotification({
        message: error.message || "Ocurrió un error al crear el usuario.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-container">
      <h2>Crear Nuevo Usuario Activista</h2>
      <form onSubmit={handleCreateUser} className="create-user-form">
        <div className="input-group">
          <label htmlFor="cedula">Cédula (Identificación)</label>
          <input
            type="text"
            id="cedula"
            value={cedula}
            onChange={handleCedulaChange}
            required
            disabled={loading || isSearching}
            placeholder="001-0000000-0"
          />
        </div>

        <div className="input-group">
          <label htmlFor="nombre">Nombre Completo</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={loading || isSearching}
          />
        </div>

        <div className="input-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="tel"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
            disabled={loading || isSearching}
            placeholder="809-000-0000"
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Correo Electrónico (opcional)</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || isSearching}
            placeholder="Si se deja vacío, iniciará sesión con la cédula"
          />
        </div>

        <div className="input-group">
          <label htmlFor="foto">Foto (opcional)</label>
          <input
            type="file"
            id="foto"
            accept="image/*"
            onChange={handleFotoChange}
            disabled={loading || isSearching}
            className="foto-input"
          />
          {fotoPreview && (
            <div className="foto-preview-wrapper">
              <img
                src={fotoPreview}
                alt="Vista previa de la foto"
                className="foto-preview-img"
              />
            </div>
          )}
        </div>

        {/* Provincia y Municipio fijos (SDO) */}
        <div className="input-group">
          <label htmlFor="provincia">Provincia</label>
          <select id="provincia" value={PROVINCIA_FIJA} disabled>
            <option value={PROVINCIA_FIJA}>{PROVINCIA_FIJA}</option>
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="municipio">Municipio</label>
          <select id="municipio" value={MUNICIPIO_FIJO} disabled>
            <option value={MUNICIPIO_FIJO}>{MUNICIPIO_FIJO}</option>
          </select>
        </div>

        {/* Ubicación electoral: Zona → Sector → Subsector → Recinto → Colegio */}
        <UbicacionElectoralFields
          value={ubicacion}
          onChange={handleUbicacionChange}
          disabled={loading || isSearching}
        />

        <div className="input-group">
          <label htmlFor="password">Contraseña Temporal (mín. 6 caracteres)</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || isSearching}
          />
        </div>

        <div className="input-group">
          <label htmlFor="rol">Asignar Rol</label>
          <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value={ROL_MULTIPLICADOR}>Multiplicador</option>
            <option value={ROL_LIDER}>Lider de Zona</option>
            <option value={ROL_ADMIN}>Administrador</option>
          </select>
        </div>

        <button type="submit" disabled={loading || isSearching}>
          {loading
            ? subiendoFoto
              ? "Subiendo foto..."
              : "Creando..."
            : isSearching
            ? "Buscando padrón..."
            : "Crear Usuario"}
        </button>

        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/admin/usuarios")}
          className="back-button"
        >
          Volver a la Lista
        </button>
      </form>
    </div>
  );
}

export default CreateUser;
````

## File: src/AuthContext.js
````javascript
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ROL_MULTIPLICADOR } from "./constants";

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. LÓGICA DE ACTIVIDAD (Heartbeat) ---
  useEffect(() => {
    if (!user) return;

    const reportActivity = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          lastActivity: serverTimestamp(),
          forceLogout: false,
        });
      } catch (error) {
        console.warn("Error reportando actividad:", error);
      }
    };

    reportActivity();
    const INTERVAL_MS = 15 * 60 * 1000;
    const intervalId = setInterval(reportActivity, INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [user]);

  // --- 2. VERIFICACIÓN DE SESIÓN ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // --- USUARIO EXISTENTE ---
            const userData = userDoc.data();
            const lastSignInTime = new Date(
              firebaseUser.metadata.lastSignInTime
            ).getTime();
            const now = Date.now();
            const isFreshLogin = now - lastSignInTime < 60 * 1000;

            if (userData.forceLogout && !isFreshLogin) {
              console.warn("Sesión cerrada por inactividad.");
              await signOut(auth);
              setUser(null);
            } else {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...userData,
              });
            }
          } else {
            // --- USUARIO NUEVO ---
            // Intentamos crear el perfil automáticamente
            const newUserProfile = {
              uid: firebaseUser.uid,
              nombre: firebaseUser.displayName || "Activista Google",
              email: firebaseUser.email,
              rol: ROL_MULTIPLICADOR, // Rol por defecto
              cedula: null,
              fechaRegistro: new Date().toISOString(),
              metodoRegistro: "Google Auth Automático",
            };

            try {
              // Creamos el documento en Firestore
              await setDoc(userDocRef, newUserProfile);
              // Actualizamos el estado con el perfil creado
              setUser(newUserProfile);
            } catch (createError) {
              console.error("Error creando perfil de Google:", createError);

              // --- FALLBACK ROBUSTO (Para evitar crash en Dashboard) ---
              // Si falla la escritura (ej. por permisos), cargamos un usuario temporal seguro en memoria
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                rol: "invitado", // Rol seguro
                nombre: firebaseUser.displayName || "Usuario Google", // Evita error .split()
                fechaRegistro: new Date().toISOString(), // Evita error de fecha
              });
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error sesión:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setIsLoading(true);
    await signOut(auth);
    setUser(null);
    setIsLoading(false);
  };

  const value = { user, isAuthenticated: !!user, isLoading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
````

## File: src/global.css
````css
/* =========================================================================
   SISTEMA DE DISEÑO GLOBAL - app-campana-rd
   ========================================================================= */

/* --- From index.css --- */
/* src/index.css - SISTEMA DE DISEÑO CENTRALIZADO & COMPATIBILIDAD TOTAL */

:root {
  /* =========================================
     1. PALETA BASE (MODO CLARO)
     ========================================= */
  --color-bg: #f4f7f6;
  --color-surface: #ffffff;
  --color-text-main: #1f2937; /* Gris muy oscuro */
  --color-text-muted: #6b7280; /* Gris medio */
  --color-border:  var(--color-border);

  /* Colores de Marca */
  --primary: #004d99; /* Azul Institucional */
  --primary-hover: #003d80;
  --accent: #3b82f6; /* Azul Brillante */
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;

  /* =========================================
     2. EFECTO CRISTAL MATE (GLASSMORPHISM)
     ========================================= */
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-blur: blur(12px);
  --glass-border: 1px solid rgba(255, 255, 255, 0.5);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);

  /* =========================================
     3. VARIABLES DE COMPATIBILIDAD (PUENTE)
     ========================================= */
  /* Conectamos las variables de tus componentes al sistema global */

  /* Generales */
  --page-bg: var(--color-bg);
  --bg-color: var(--color-bg);
  --bg: var(--color-bg); /* Para ManageUsers.css */

  /* Superficies / Tarjetas */
  --element-bg: var(--color-surface);
  --card: var(--color-surface); /* Para ManageUsers.css */
  --form-bg: var(--color-surface); /* Para Login.css */

  /* Textos */
  --text-primary: var(--color-text-main);
  --text: var(--color-text-main); /* Para ManageUsers.css */
  --text-soft: var(--color-text-muted);

  /* Sidebar */
  --sidebar-bg: var(--glass-bg);
  --sidebar-text: var(--color-text-main);
  --sidebar-text-hover: var(--primary);
  --sidebar-hover-bg: rgba(0, 77, 153, 0.1);
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 88px;

  /* Constantes */
  --radius-lg: 16px;
  --radius-md: 12px;
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* =========================================
   4. MODO OSCURO (OVERRIDES)
   ========================================= */
body.dark-mode {
  /* Redefinimos la paleta base para oscuro */
  --color-bg: #0f172a; /* Azul noche profundo */
  --color-surface: #1e293b; /* Azul grisáceo */
  --color-text-main: #f3f4f6; /* Blanco humo */
  --color-text-muted: #9ca3af; /* Gris claro */
  --color-border: #374151;

  --primary: #60a5fa; /* Azul más claro para contraste */
  --primary-hover: #93c5fd;

  /* Cristal Mate Oscuro */
  --glass-bg: rgba(30, 41, 59, 0.85);
  --glass-border: 1px solid rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);

  /* Actualizamos compatibilidad automáticamente */
  --page-bg: var(--color-bg);
  --bg: var(--color-bg);
  --card: var(--color-surface);
  --element-bg: var(--color-surface);

  --sidebar-bg: var(--glass-bg);
  --sidebar-text: var(--color-text-main);
  --sidebar-text-hover: var(--primary);
  --sidebar-hover-bg: rgba(255, 255, 255, 0.05);
}

/* =========================================
   5. ESTILOS GLOBALES
   ========================================= */
body {
  margin: 0;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--color-text-main);
  transition: background-color 0.3s ease, color 0.3s ease;
  -webkit-font-smoothing: antialiased;
}

.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-lg);
}

/* src/index.css - CORRECCIÓN DE FONDO */

:root {
  /* --- 1. DEFINICIÓN DE COLORES (Modo Claro por Defecto) --- */
  --color-bg: #f4f7f6; /* Gris muy claro (NO NEGRO) */
  --color-surface: #ffffff;
  --color-text-main: #1f2937;
  /* ... resto de tus variables ... */

  /* COMPATIBILIDAD */
  --page-bg: var(--color-bg);
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 88px;
}

/* --- 2. MODO OSCURO --- */
body.dark-mode {
  --color-bg: #0f172a; /* Solo aquí debe ser oscuro */
  --color-surface: #1e293b;
  --color-text-main: #f3f4f6;
}

/* --- 3. REGLA MAESTRA DEL BODY (CRÍTICO) --- */
body {
  margin: 0;
  font-family: "Inter", sans-serif;

  /* ESTA LÍNEA ES LA CLAVE: */
  background-color: var(
    --color-bg
  ) !important; /* !important fuerza el cambio si algo estorba */
  color: var(--color-text-main);

  transition: background-color 0.3s ease, color 0.3s ease;
}


/* --- From App.css --- */
/* src/App.css */

/* Layout Principal */
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  /* Eliminamos background-color aquí para que herede del body */
}

/* Contenido */
.dashboard-content {
  flex-grow: 1;

  /* Layout */
  margin-left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width));
  padding: 20px;
  box-sizing: border-box;

  /* Transiciones de layout (no de color, eso va en body) */
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Sidebar Colapsado */
.dashboard-layout.sidebar-collapsed .dashboard-content {
  margin-left: var(--sidebar-collapsed-width);
  width: calc(100% - var(--sidebar-collapsed-width));
}

/* Móvil */
@media (max-width: 768px) {
  .dashboard-layout {
    flex-direction: column;
  }

  .dashboard-content {
    margin-left: 0 !important;
    width: 100% !important;
    padding-bottom: 85px;
    /* Espacio para bottom nav */
  }
}

/* --- CORRECCIÓN DE ESPACIADO PARA EL NAVBAR FIJO --- */

/* Contenedor para páginas públicas (Home, Propuestas, Login) */
.public-content-wrapper {
  /* Forzar modo claro en páginas públicas */
  --color-bg: #f4f7f6;
  --color-surface: #ffffff;
  --color-text-main: #1f2937;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  
  min-height: calc(100vh - 60px);
  width: 100%;
  box-sizing: border-box;
  background-color: var(--color-surface);
  color: var(--color-text-main);
}

/* Ajuste específico para móviles si el navbar cambia de altura */
@media (max-width: 768px) {
  .public-content-wrapper {
    padding-top: 85px;
    /* Ajuste fino para pantallas pequeñas */
  }
}

/* --- (El resto de tu App.css para el Dashboard se mantiene igual) --- */

/* --- Component: AvatarFoto.css --- */
/* src/components/AvatarFoto.css */

/* --- CONTENEDOR BASE --- */
.avatar-container {
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-surface);
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
  user-select: none;
  position: relative;
}

.avatar-container.clickable {
  cursor: zoom-in; /* Indica que se puede ampliar */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.avatar-container.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  border-color: var(--primary, #004d99); /* Borde azul al pasar mouse */
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

/* --- MODAL (LIGHTBOX) --- */
.avatar-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.85); /* Fondo oscuro */
  backdrop-filter: blur(5px); /* Efecto borroso detrás */
  z-index: 9999; /* Siempre encima de todo */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

.avatar-modal-content {
  position: relative;
  /* El contenedor se ajusta al tamaño de la imagen (marco), sin forzar ancho. */
  max-width: 90vw;
  width: auto;
  max-height: 90vh;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Imagen Grande: se muestra a su tamaño natural, acotada al viewport, sin scroll.
   80vh deja espacio para el pie (nombre/cédula) dentro del 90vh del marco. */
.avatar-modal-image {
  max-width: 90vw;
  max-height: 80vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border: 4px solid white;
  background-color: var(--color-surface);
}

/* Botón Cerrar */
.avatar-modal-close {
  position: absolute;
  top: -40px;
  right: -10px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.avatar-modal-close:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: rotate(90deg);
}

/* Pie de foto en el modal */
.avatar-modal-footer {
  margin-top: 15px;
  text-align: center;
  color: white;
}

.avatar-modal-footer h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.avatar-modal-footer p {
  margin: 5px 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

/* Animaciones */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Estilos del Reporte */
.report-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255,255,255,0.2);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.report-text {
  color: #ffdd57; /* Amarillo alerta */
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
}

.report-button {
  background-color: #25D366; /* Verde WhatsApp */
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s;
}

.report-button:hover {
  transform: scale(1.05);
  background-color: #1ebc57;
}

/* --- Component: BottomNavBar.css --- */
/* src/components/BottomNavBar.css */

/* --- Barra Fija Inferior --- */
.bottom-nav-bar {
  display: flex;
  justify-content: space-between; /* Distribución uniforme */
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 65px;
  z-index: 2000; /* Muy por encima */
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--color-text-muted);
  background: none;
  border: none;
  height: 100%;
  cursor: pointer;
}

.nav-icon {
  font-size: 1.4rem;
  margin-bottom: 4px;
}
.nav-label {
  font-size: 0.7rem;
  font-weight: 500;
}

/* Estado Activo */
.nav-item.active {
  color: var(--primary);
}
.nav-item.active-menu {
  color: var(--primary);
} /* Para el botón 'Más' */

/* --- MENÚ EXPANDIBLE (Action Sheet) --- */
.bottom-nav-expandable {
  position: fixed;
  bottom: 65px; /* Justo encima de la barra */
  left: 0;
  width: 100%;
  z-index: 1999;
  visibility: hidden;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(20px);
}

.bottom-nav-expandable.open {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
}

/* Contenido del menú (Lista) */
.expandable-content {
  background-color: var(--color-surface);
  margin: 0 10px 10px 10px; /* Margen lateral */
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 5px 0;
  border: 1px solid var(--color-border);
}

.expandable-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  text-decoration: none;
  color: var(--color-text-main);
  font-size: 0.95rem;
  font-weight: 500;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.expandable-item:active {
  background-color: var(--color-surface);
}
.expandable-item.logout {
  color: var(--danger);
}

.expand-icon {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}
.expandable-item.logout .expand-icon {
  color: var(--danger);
}

.expandable-divider {
  height: 1px;
  background-color: #e5e7eb;
  border: none;
  margin: 4px 0;
}

/* Overlay oscuro detrás del menú */
.expandable-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: -1; /* Detrás del contenido expandible */
}

/* Modo Oscuro */
body.dark-mode .bottom-nav-bar,
body.dark-mode .expandable-content {
  background-color: var(--color-surface);
  border-color: var(--color-border);
}
body.dark-mode .nav-item,
body.dark-mode .expandable-item {
  color: #d1d5db;
}
body.dark-mode .nav-item.active {
  color: #60a5fa;
}
body.dark-mode .expandable-overlay {
  background-color: rgba(0, 0, 0, 0.6);
}

/* Agrega esto al final de BottomNavBar.css */
.menu-separator {
  height: 1px;
  background-color: #e5e7eb;
  margin: 5px 15px;
}

/* Ajuste opcional para que el botón de menú activo se vea diferente */
.nav-item.active-menu {
  color: var(--primary); /* O tu color primario */
}


/* --- Component: Comandos.css --- */
/* src/components/Comandos.css */

/* CONTENEDOR */
.comandos-container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  margin-right: 70px;
}

/* HEADER */
.comandos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.comandos-header h2 {
  margin: 0;
  font-size: 2rem;
  color: var(--primary);
}

/* BOTONES DE ACCIÓN */
.action-btn {
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s, filter 0.2s;
}

.excel-btn { background-color: #217346; color: white; }
.print-btn { background-color: #6c757d; color: white; }

.excel-btn:hover,
.print-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
}

/* ACORDEÓN */
.nivel-section {
  background-color: var(--color-surface);
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

/* HEADER ACORDEÓN */
.nivel-header {
  padding: 15px 20px;
  background-color: rgba(0,0,0,0.02);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}
.nivel-header:hover {
  background-color: rgba(0,0,0,0.04);
}

.counter-badge {
  background-color: var(--color-bg);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

/* -------------------------------------
   ACORDEÓN ANIMADO — SLIDE + FADE
-------------------------------------- */

.nivel-content {
  max-height: 0;
  overflow: hidden;
  padding: 0 20px;
  opacity: 0;
  background-color: var(--color-surface);

  /* Animación */
  transition: 
    max-height 0.35s ease,
    opacity 0.25s ease,
    padding 0.35s ease;
}

/* cuando el acordeón se abre */
.nivel-content.expanded {
  max-height: 1000px; /* suf para un listado largo */
  opacity: 1;
  padding: 20px;
}

/* BOTÓN AGREGAR */
.level-actions-top {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: 15px;
}

.add-row-btn {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  box-shadow: 0 4px 10px rgba(0, 77, 153, 0.2);
  transition: transform 0.2s, background 0.2s;
}
.add-row-btn:hover {
  transform: translateY(-2px);
  background-color: var(--primary-hover);
}

/* LISTA DE ITEMS */
.renglones-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comando-item-view {
  display: flex;
  align-items: center;
  background-color: var(--color-bg);
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  gap: 15px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.comando-item-view:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

/* COLUMNAS */
.col-avatar { flex-shrink: 0; }

.col-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.info-name {
  font-weight: 700;
  color: var(--color-text-main);
  font-size: 1rem;
}
.info-cargo {
  color: var(--primary);
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 2px;
}

.col-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.85rem;
}
.zone-tag {
  background-color: rgba(0,0,0,0.05);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}
.sector-text { color: var(--color-text-light); }

/* ACCIONES */
.col-actions { display: flex; gap: 8px; }

.icon-btn {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn.edit { color: var(--primary); }
.icon-btn.edit:hover { background-color: rgba(0, 77, 153, 0.1); }

.icon-btn.delete { color: var(--danger); }
.icon-btn.delete:hover { background-color: rgba(239, 68, 68, 0.1); }

.empty-level {
  text-align: center;
  padding: 20px;
  color: var(--color-text-muted);
  font-style: italic;
}

/* MODAL */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 10px;
}
.modal-header h3 {
  margin: 0;
  color: var(--primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-text-muted);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-muted);
  margin-bottom: 5px;
}

.search-input,
.role-filter-select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text-main);
  font-size: 0.95rem;
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.save-button {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}
.save-button:disabled { opacity: 0.5; cursor: not-allowed; }
.save-button:hover:not(:disabled) { background-color: var(--primary-hover); }

/* IMPRESIÓN */
@media print {
  .no-print, .sidebar, .navbar {
    display: none !important;
  }
  .comandos-container {
    padding: 0;
    margin: 0;
    max-width: 100%;
  }
  .nivel-section {
    border: none;
    margin: 0;
  }
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .comando-item-view {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .col-actions {
    width: 100%;
    justify-content: flex-end;
    border-top: 1px dashed var(--color-border);
    padding-top: 10px;
  }
}



/* --- Component: CreateUser.css --- */
.create-user-container {
    padding: 2rem;
    max-width: 600px;
    margin: 2rem auto;
    background-color: var(--color-surface);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .create-user-container h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: var(--color-text-main);
  }
  
  .create-user-form .input-group {
    margin-bottom: 1.5rem;
  }
  
  .create-user-form label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--color-text-main);
  }
  
  .create-user-form input[type="text"],
  .create-user-form input[type="email"],
  .create-user-form input[type="password"],
  .create-user-form select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 1rem;
  }

  /* Input de archivo y preview: legibles en claro y oscuro (usan variables). */
  .create-user-form .foto-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px dashed var(--color-border);
    border-radius: 4px;
    font-size: 0.95rem;
    background-color: var(--color-surface);
    color: var(--color-text-main);
    cursor: pointer;
  }

  .create-user-form .foto-input::file-selector-button {
    margin-right: 12px;
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background-color: var(--color-bg);
    color: var(--color-text-main);
    font-weight: 600;
    cursor: pointer;
  }

  .create-user-form .foto-preview-wrapper {
    margin-top: 12px;
    display: flex;
    justify-content: center;
  }

  .create-user-form .foto-preview-img {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
    border: 2px solid var(--color-border);
  }

  .create-user-form button[type="submit"] {
    width: 100%;
    padding: 12px;
    background-color: #28a745; /* Verde para crear */
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .create-user-form button[type="submit"]:hover {
    background-color: #218838;
  }
  
  .create-user-form button[type="submit"]:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  /* Estilos de Notificación (puedes moverlos a un archivo global si quieres) */
  .notification {
    padding: 12px 15px;
    margin-top: 1.5rem;
    border-radius: 5px;
    font-weight: 500;
    text-align: center;
    border: 1px solid transparent;
  }
  .notification.success {
    background-color: #d1e7dd; color: #0f5132; border-color: #badbcc;
  }
  .notification.error {
    background-color: #f8d7da; color: #842029; border-color: #f5c2c7;
  }
  
  /* Botón para volver */
  .back-button {
    width: 100%;
    padding: 10px;
    margin-top: 1rem;
    background-color: #6c757d; /* Gris */
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  .back-button:hover {
    background-color: #5a6268;
  }

/* --- Component: Dashboard.css --- */
/* src/components/Dashboard.css - FINAL & OPTIMIZADO */

/* NOTA: 
   Este archivo maneja la estética interna de los widgets.
   El layout general (sidebar, márgenes) lo controla App.css.
*/

/* Contenedor interno */
.dashboard-container-inner {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px; /* Espacio entre filas */

  /* Animación de entrada */
  animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* --- 1. ENCABEZADO DE BIENVENIDA (Avatar + Texto) --- */
.dashboard-welcome-row {
  display: flex;
  align-items: center; /* Centrado vertical con el avatar */
  gap: 20px;
  margin-bottom: 10px;
  padding: 10px 0;
}

.dashboard-welcome-row h1 {
  font-size: 2.2rem; /* Tamaño equilibrado */
  font-weight: 800;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.5px;
  color: var(--color-text-main);

  /* Gradiente en el texto */
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
}

/* Estilo para el Rol (el <small> debajo del nombre) */
.dashboard-welcome-row small {
  display: block;
  margin-top: 4px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
  color: var(--color-text-muted);
  opacity: 0.8;
}

/* --- 2. TÍTULOS DE SECCIÓN --- */
.dashboard-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-top: 10px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Línea decorativa */
.dashboard-section-title::before {
  content: "";
  display: block;
  width: 4px;
  height: 20px;
  background: linear-gradient(to bottom, var(--primary), var(--accent));
  border-radius: 4px;
}

/* --- 3. GRID DE WIDGETS (Métricas) --- */
.metrics-grid {
  display: grid;
  /* Columnas responsivas automáticas */
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
}

/* Grid específico para gráficas (pueden necesitar más ancho) */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  width: 100%;
}

/* --- 4. ANIMACIONES --- */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- 5. RESPONSIVO (Móvil) --- */
@media (max-width: 768px) {
  .dashboard-welcome-row {
    gap: 15px;
  }

  .dashboard-welcome-row h1 {
    font-size: 1.6rem; /* Ajuste para móviles */
  }

  .dashboard-welcome-row small {
    font-size: 0.75rem;
  }

  .dashboard-section-title {
    font-size: 1rem;
    margin-top: 5px;
  }

  .metrics-grid,
  .charts-grid {
    grid-template-columns: 1fr; /* Una sola columna */
    gap: 15px;
  }

  .dashboard-container-inner {
    gap: 15px;
  }
}


/* --- Component: DashboardSidebar.css --- */
.sidebar {
  width: 260px;
  height: 100vh;
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  position: sticky;
  top: 0;
  flex-shrink: 0;
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 0.5rem;
}
.sidebar-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
}
.toggle-button {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
}
.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
}
.sidebar-menu li a, .sidebar-menu li button {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  background-color: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  box-sizing: border-box;
  transition: background-color 0.2s, color 0.2s;
}
.sidebar-menu li a:hover, .sidebar-menu li button:hover {
  background-color: var(--sidebar-hover-bg);
  color: var(--sidebar-text-hover);
}
.sidebar-menu li a.active {
  background-color: var(--accent-color);
  color: #ffffff;
  font-weight: 600;
}
.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sidebar-footer button {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--sidebar-text);
  background-color: transparent;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  box-sizing: border-box;
  transition: background-color 0.2s, color 0.2s;
}
.sidebar-footer button:hover {
  background-color: var(--sidebar-hover-bg);
  color: var(--sidebar-text-hover);
}
.sidebar.collapsed {
  width: 88px;
}
.sidebar.collapsed span {
  opacity: 0;
  width: 0;
  pointer-events: none;
  transition: opacity 0.1s;
}
.sidebar.collapsed .sidebar-menu li a,
.sidebar.collapsed .sidebar-menu li button,
.sidebar.collapsed .sidebar-footer button {
  justify-content: center;
  padding: 12px;
}


/* --- Component: EditUserModal.css --- */
/* El fondo oscuro semitransparente */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Asegura que esté por encima de todo */
}

/* La ventana blanca */
.modal-content {
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 100%;
  max-width: 500px;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-text-main);
}

.modal-content p {
  color: var(--color-text-main);
}

.modal-content .input-group {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
}

.modal-content select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
}

/* Contenedor para los botones */
.modal-actions {
  display: flex;
  justify-content: flex-end; /* Alinea los botones a la derecha */
  gap: 1rem;
}

.modal-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.save-button {
  background-color: #007bff;
  color: white;
}
.save-button:hover {
  background-color: #0056b3;
}

.cancel-button {
  background-color: var(--color-surface);
  color: var(--color-text-main);
}
.cancel-button:hover {
  background-color: var(--color-surface);
}

/* --- Estilos para la sección de asignación --- */
.assignment-section {
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
}

.assignment-section h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-text-main);
}

.multiplicadores-list {
  max-height: 200px; /* Altura máxima con scroll */
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 1rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.checkbox-item input[type="checkbox"] {
  margin-right: 10px;
  transform: scale(1.1);
}

.checkbox-item label {
  font-size: 0.95rem;
  color: var(--color-text-main);
}

/* --- Component: EmailStatus.css --- */
.email-status-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.email-status-modal {
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: emailStatusSlideIn 0.3s ease-out;
}

@keyframes emailStatusSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.email-status-header {
  display: flex;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e9ecef;
  position: relative;
}

.email-status-icon {
  font-size: 24px;
  margin-right: 12px;
}

.email-status-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-main);
  flex: 1;
}

.email-status-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text-main);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.email-status-close:hover {
  background-color: var(--color-surface);
  color: var(--color-text-main);
}

.email-status-content {
  padding: 20px 24px;
}

.email-status-message {
  font-size: 16px;
  line-height: 1.5;
  margin: 0 0 20px 0;
  color: var(--color-text-main);
}

.email-details {
  background-color: var(--color-surface);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.email-details h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.email-details ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.email-details li {
  margin: 8px 0;
  font-size: 14px;
  color: var(--color-text-main);
}

.email-details strong {
  color: var(--color-text-main);
}

.email-loading {
  text-align: center;
  padding: 20px 0;
}

.email-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #004d99;
  border-radius: 50%;
  animation: emailSpin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes emailSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.email-loading p {
  color: var(--color-text-main);
  font-size: 14px;
  margin: 0;
}

.email-success-actions {
  text-align: center;
  padding: 16px 0;
}

.email-success-actions p {
  margin: 8px 0;
  color: #155724;
}

.email-error-actions {
  background-color: var(--color-surface)3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.email-error-actions p {
  margin: 0 0 12px 0;
  color: #856404;
  font-weight: 600;
}

.email-error-actions ul {
  margin: 0;
  padding-left: 20px;
  color: #856404;
}

.email-error-actions li {
  margin: 6px 0;
  font-size: 14px;
}

.email-status-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #e9ecef;
  text-align: center;
}

.email-status-button {
  background: linear-gradient(135deg, #004d99, #0066cc);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.email-status-button:hover {
  background: linear-gradient(135deg, #003d7a, #0052a3);
  transform: translateY(-1px);
}

/* Estados específicos */
.email-status-sending .email-status-header {
  background: linear-gradient(135deg, #e3f2fd, var(--color-surface));
}

.email-status-success .email-status-header {
  background: linear-gradient(135deg, #d4edda, var(--color-surface));
}

.email-status-error .email-status-header {
  background: linear-gradient(135deg, #f8d7da, var(--color-surface));
}

.email-status-warning .email-status-header {
  background: linear-gradient(135deg, var(--color-surface)3cd, var(--color-surface));
}

/* Responsive */
@media (max-width: 768px) {
  .email-status-modal {
    width: 95%;
    margin: 20px;
  }
  
  .email-status-header {
    padding: 16px 20px 12px;
  }
  
  .email-status-content {
    padding: 16px 20px;
  }
  
  .email-status-footer {
    padding: 12px 20px 16px;
  }
  
  .email-status-header h3 {
    font-size: 16px;
  }
  
  .email-status-message {
    font-size: 15px;
  }
}

/* --- Component: EmailTest.css --- */
.email-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.email-test-card {
  background: var(--color-surface);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
  border: 1px solid #e9ecef;
}

.email-test-card h2 {
  color: var(--primary);
  margin-bottom: 10px;
  font-size: 24px;
  font-weight: 600;
}

.email-test-description {
  color: var(--color-text-main);
  margin-bottom: 30px;
  font-size: 16px;
  line-height: 1.5;
}

.email-test-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text-main);
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  background-color: var(--color-surface);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 77, 153, 0.1);
}

.form-group input::placeholder {
  color: var(--color-text-main);
}

.send-button {
  background: linear-gradient(135deg, #004d99, #0066cc);
  color: white;
  border: none;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 77, 153, 0.3);
}

.send-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #003d7a, #0052a3);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 77, 153, 0.4);
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.result {
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.result.success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.result.error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.result h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

.result p {
  margin: 5px 0;
  font-size: 14px;
}

.result details {
  margin-top: 15px;
}

.result summary {
  cursor: pointer;
  font-weight: 600;
  padding: 5px 0;
}

.result ul {
  margin: 10px 0 0 20px;
  font-size: 14px;
}

.result li {
  margin: 5px 0;
}

.email-test-info {
  background-color: var(--color-surface);
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #004d99;
}

.email-test-info h3 {
  color: var(--primary);
  margin: 0 0 15px 0;
  font-size: 18px;
}

.email-test-info ul {
  margin: 0;
  padding-left: 20px;
}

.email-test-info li {
  margin: 8px 0;
  line-height: 1.5;
}

.email-test-info strong {
  color: var(--color-text-main);
}

/* Responsive */
@media (max-width: 768px) {
  .email-test-container {
    padding: 15px;
  }
  
  .email-test-card {
    padding: 20px;
  }
  
  .email-test-card h2 {
    font-size: 20px;
  }
  
  .form-group input,
  .form-group select {
    font-size: 16px; /* Evita zoom en iOS */
  }
  
  .send-button {
    padding: 14px 20px;
    font-size: 15px;
  }
}

/* --- Component: Footer.css --- */
.main-footer {
  background-color: #022340;
  /* Azul marino profundo para contraste */
  color: #ffffff;
  padding: 60px 0 40px;
  border-top: 4px solid #10b981;
  /* Detalle en el verde de acento de Felix */
}

.footer-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 40px;
}

.footer-section {
  flex: 1;
  min-width: 250px;
}

.footer-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #93c5fd;
  /* Azul claro para títulos */
  text-transform: uppercase;
  letter-spacing: 1px;
}

.footer-copy,
.dev-credit {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.dev-credit a {
  color: var(--success);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.dev-credit a:hover {
  color: #ffffff;
  text-decoration: underline;
}

/* Botón de descarga estilizado */
.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 8px;
  color: #ffffff;
  text-decoration: none;
  transition: all 0.3s ease;
}

.download-btn:hover {
  background-color: var(--danger);
  /* Rojo PDF al hacer hover */
  border-color: var(--danger);
  transform: translateY(-3px);
}

.download-btn svg {
  font-size: 1.4rem;
}

/* Redes Sociales */
.social-grid {
  display: flex;
  gap: 15px;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  color: #ffffff;
  font-size: 1.3rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.social-icon:hover {
  background-color: var(--primary);
  transform: scale(1.15) rotate(5deg);
  color: #ffffff;
}

/* Media Query para móviles */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .social-grid {
    justify-content: center;
  }

  .download-btn {
    width: 90%;
    justify-content: center;
  }
}

/* --- Component: Home.css --- */
/* --- VARIABLES --- */
:root {
  --primary: #003366;
  --secondary: #3b82f6;
  --accent: #10b981;
  --bg-light: #f8fafc;
  --white: #ffffff;
  --text-dark: #1e293b;
  --text-muted: #64748b;
  --transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.home-container {
  overflow-x: hidden;
  background-color: var(--bg-light);
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

/* --- HERO SECTION (ORGANIZACIÓN ORIGINAL) --- */
.hero-section {
  background: linear-gradient(135deg, #022340 0%, #004d99 100%);
  color: #ffffff;
  padding-top: 60px;
  overflow: hidden;
}

.hero-main-content {
  display: flex;
  flex-direction: row-reverse;
  /* Conservamos tu row-reverse */
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.hero-image-left {
  flex: 0 0 45%;
  display: flex;
  align-items: flex-end;
}

.desktop-portrait {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.4));
  vertical-align: bottom;
}

.mobile-portrait {
  display: none;
}

.hero-text-right {
  flex: 1;
  padding-bottom: 80px;
  text-align: left;
}

.hero-tag {
  font-size: 0.9rem;
  font-weight: 700;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.2);
  padding: 5px 15px;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 1rem;
}

.hero-text-right h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  margin-bottom: 0.5rem;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 1.1rem;
  opacity: 0.8;
  margin-bottom: 2rem;
  max-width: 500px;
}

/* --- BOTONES --- */
.cta-button {
  padding: 14px 30px;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.primary-cta {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.primary-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.secondary-cta {
  border: 2px solid var(--primary);
  color: var(--primary);
}

.secondary-cta:hover {
  background: var(--primary);
  color: white;
}

/* --- CARDS --- */
.gestion-section,
.biografia-section,
.gallery-section {
  padding: 80px 0;
  text-align: center;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.card {
  background: var(--var(--color-surface));
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  transition: var(--transition);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.card svg {
  font-size: 2.5rem;
  color: var(--secondary);
  margin-bottom: 20px;
}

/* --- CAROUSEL --- */
.carousel-wrapper {
  max-width: 900px;
  margin: 40px auto 0;
}

.carousel-container {
  overflow: hidden;
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
}

.gallery-carousel {
  display: flex;
  transition: transform 0.6s cubic-bezier(0.45, 0, 0.55, 1);
}

.gallery-item {
  min-width: 100%;
  flex: 1;
  background: var(--color-surface);
}

.gallery-image-wrapper img {
  width: 100%;
  height: 450px;
  object-fit: cover;
}

.gallery-caption {
  padding: 25px;
  border-top: 1px solid var(--color-border);
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
  border: none;
  cursor: pointer;
  transition: 0.3s;
}

.dot.active {
  background: var(--primary);
  transform: scale(1.3);
}

/* --- TIMELINE (PUNTOS VERDES) --- */
.biografia-section {
  padding: 80px 0;
  background: var(--var(--color-surface));
}

.timeline-container {
  position: relative;
  max-width: 900px;
  margin: 50px auto;
  padding: 10px 0;
}

/* La línea vertical central */
.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e2e8f0;
  transform: translateX(-50%);
}

.timeline-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 40px;
  position: relative;
}

/* El Punto Verde con Sombra */
.timeline-dot {
  position: absolute;
  left: 50%;
  top: 15px;
  width: 16px;
  height: 16px;
  background: var(--accent);
  border: 4px solid var(--white);
  border-radius: 50%;
  transform: translateX(-50%);
  z-index: 2;
  box-shadow: 0 0 0 3px var(--accent);
  transition: var(--transition);
}

.timeline-item:hover .timeline-dot {
  transform: translateX(-50%) scale(1.3);
  background: var(--primary);
  box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.2);
}

/* Contenedor de texto */
.timeline-content {
  width: 42%;
  padding: 25px;
  background: var(--bg-light);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: var(--transition);
}

.timeline-item:nth-child(odd) .timeline-content {
  text-align: right;
  margin-right: auto;
}

.timeline-item:nth-child(even) .timeline-content {
  text-align: left;
  margin-left: auto;
}

.timeline-year {
  font-weight: 900;
  color: var(--primary);
  font-size: 1.3rem;
  margin-bottom: 5px;
}

.timeline-description {
  color: var(--text-dark);
  font-size: 0.95rem;
  line-height: 1.5;
}

.timeline-content:hover {
  background: var(--var(--color-surface));
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  border-color: var(--secondary);
}

/* --- RESPONSIVIDAD TIMELINE --- */
@media (max-width: 992px) {
  .timeline-line {
    left: 20px;
    transform: none;
  }

  .timeline-dot {
    left: 20px;
    transform: none;
  }

  .timeline-item,
  .timeline-item:nth-child(even) {
    flex-direction: row;
  }

  .timeline-content {
    width: calc(100% - 60px);
    margin-left: 60px !important;
    text-align: left !important;
  }
}



/* --- RESPONSIVIDAD --- */
@media (max-width: 992px) {

  .hero-main-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .hero-image-left {
    order: 1;
    width: 80%;
    max-width: 320px;
  }

  .hero-text-right {
    order: 2;
    padding-bottom: 40px;
  }

  .desktop-portrait {
    display: none;
  }

  .mobile-portrait {
    display: block;
    width: 100%;
    border-radius: 15px;
  }

  .gallery-image-wrapper img {
    height: 300px;
  }
}

/* --- Component: Login.css --- */
.login-container {
  /* Brand Colors - Basados en tus clases */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-google: #ffffff;
  /* Ajustado a estilo moderno (blanco con borde) */
  --color-google-text: #3c4043;
  --color-google-hover: #f8fafc;

  /* Neutros para superficies */
  --page-bg: var(--color-bg);
  --form-bg: var(--color-surface);
  --text-primary: var(--color-text-main);
  --text-secondary: var(--color-text-muted);
  --text-placeholder: #94a3b8;

  /* Bordes y Feedback */
  --border-light: #f1f5f9;
  --border-medium: #e2e8f0;
  --color-error: #ef4444;
  --bg-error: #fef2f2;

  /* UX & Accesibilidad */
  --focus-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
  --form-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  --transition-smooth: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-container {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  overflow: hidden;
  /* Centrado perfecto en 2 líneas */
  min-height: 100vh;
  padding: 1.5rem;
  background-color: transparent;
  font-family: 'Inter', system-ui, sans-serif;
  margin-top: 2.5rem;

}

.login-form {
  padding: 2.5rem 2rem;
  border-radius: 12px;
  /* Bordes más modernos */
  background-color: var(--form-bg);
  box-shadow: var(--form-shadow);
  width: 100%;
  max-width: 350px;
  border: 1px solid var(--border-medium);

}

.login-form h2 {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-primary);

}

.input-group {
  margin-bottom: 1.25rem;

}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.input-group input {
  width: 100%;
  padding: 1rem 1rem;
  border: 1.5px solid var(--border-medium);
  /* Un poco más grueso para legibilidad */
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text-primary);
  background-color: transparent;
  transition: var(--transition-smooth);

}

.input-group input::placeholder {
  color: var(--text-placeholder);
}

.input-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--focus-shadow);
  background-color: var(--color-surface);
}

button {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  background-color: var(--primary);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
  display: flex;
  align-items: center;
  justify-content: center;
}

button:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  /* Efecto de elevación */
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  background-color: var(--border-medium);
  color: var(--text-placeholder);
  cursor: not-allowed;
  filter: grayscale(1);
}

.btn-google {
  background-color: var(--color-google);
  color: var(--color-google-text);
  border: 1px solid var(--border-medium);
  margin-top: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-google:hover {
  background-color: var(--color-google-hover);
  border-color: var(--text-placeholder);
}

.google-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
}

.divider {
  display: flex;
  align-items: center;
  margin: 1.75rem 0;
  color: var(--text-placeholder);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-medium);
}

.divider:not(:empty)::before {
  margin-right: 1rem;
}

.divider:not(:empty)::after {
  margin-left: 1rem;
}

.error-message {
  color: var(--color-error);
  background-color: var(--bg-error);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.extra-links {
  text-align: center;
  margin-top: 1.75rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.extra-links a {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}

.extra-links a:hover {
  text-decoration: underline;
}

/* --- Component: ManageTeams.css --- */
/* src/components/ManageTeams.css - FINAL & OPTIMIZADO */

.manage-teams-container {
  width: 100%;
  /* FIX MARGEN DERECHO: Aseguramos que respete el padding */
  box-sizing: border-box;
  padding: 30px;
  /* Max width controlado */
  max-width: 1400px;
  margin: 0 auto;

  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* HEADER */
.manage-teams-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.manage-teams-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.export-teams-button,
.print-btn {
  border: none;
  padding: 10px 20px;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s;
  color: white;
}

.export-teams-button {
  background-color: var(--success);
}
.print-btn {
  background-color: var(--color-text-muted);
}
.export-teams-button:hover,
.print-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

/* ACORDEÓN */
.leaders-accordion {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.leader-item {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: all 0.2s;
}
.leader-item.expanded {
  border-color: var(--primary);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.leader-header {
  padding: 15px 25px;
  background-color: rgba(0, 0, 0, 0.02);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.leader-header:hover {
  background-color: rgba(0, 77, 153, 0.05);
}

.team-count-badge {
  background-color: var(--color-bg);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  margin-left: 10px;
}

/* BOTONES MINI EN FILA DE LÍDER */
.actions-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-button {
  background: transparent;
  border: 1px solid transparent;
  font-size: 1rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--color-text-muted);
}

.excel-mini:hover {
  color: var(--success);
  background-color: rgba(34, 197, 94, 0.1);
}
.print-mini:hover {
  color: var(--primary);
  background-color: rgba(0, 77, 153, 0.1);
}
.expand-icon {
  margin-left: 5px;
  font-size: 0.8rem;
}

/* CONTENIDO DEL LÍDER */
.leader-content {
  display: none;
  padding: 25px;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
}
.leader-content.expanded {
  display: block;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  margin: 0 0 15px 0;
  color: var(--primary);
  font-size: 0.95rem;
  text-transform: uppercase;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 5px;
}

/* LISTA DE SOLDADOS */
/* Listas de Soldados */
.team-section,
.available-section {
  margin-bottom: 25px;
}

/* 1. CONTENEDOR PADRE: Cambiamos de Grid a Flex Columna */
.multiplicadores-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex; /* Flexbox en lugar de Grid */
  flex-direction: column; /* Elementos uno debajo del otro */
  width: 100%; /* Asegura ancho total */
  gap: 0; /* Quitamos huecos, usamos bordes */
}

/* 2. ITEM INDIVIDUAL: Ajustado para ancho completo */
.multiplicador-item {
  width: 100%; /* Ocupar todo el espacio horizontal */
  box-sizing: border-box; /* El padding no aumenta el ancho total */

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;

  /* Estilo limpio de lista (sin tarjetas) */
  background-color: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border);
  border-radius: 0; /* Recto para lista continua */
  transition: background-color 0.2s;
}

/* Efecto Hover suave en la fila completa */
.multiplicador-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Quitar borde al último elemento para limpieza visual */
.multiplicador-item:last-child {
  border-bottom: none;
}

.multiplicador-item:hover {
  border-color: var(--accent);
}

.multiplicador-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.info-text {
  display: flex;
  flex-direction: column;
}
.info-text .name {
  font-weight: 600;
  color: var(--color-text-main);
  font-size: 0.95rem;
}
.info-text .cedula {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.assign-button {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
}
.assign-button.add {
  background-color: rgba(0, 77, 153, 0.1);
  color: var(--primary);
  width: fit-content;
}
.assign-button.add:hover {
  background-color: var(--primary);
  color: white;
}
.assign-button.remove {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  width: fit-content;
}
.assign-button.remove:hover {
  background-color: var(--danger);
  color: white;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: var(--color-text-muted);
  font-style: italic;
}

/* --- ESTILOS DE IMPRESIÓN --- */
.print-header {
  display: none;
}

@media print {
  /* Ocultar elementos de UI */
  .no-print,
  .navbar,
  .sidebar,
  .header-actions,
  .assign-button,
  .expand-icon {
    display: none !important;
  }

  /* Layout */
  .manage-teams-container {
    padding: 0;
    margin: 0;
    max-width: 100%;
    background: var(--color-surface);
    box-shadow: none;
  }

  /* --- LÓGICA DE IMPRESIÓN INDIVIDUAL --- */

  /* Si estamos imprimiendo SOLO UNO (clase .printing-single activa) */
  .printing-single .leader-item {
    display: none; /* Ocultar todos por defecto */
  }

  /* Mostrar SOLO el objetivo */
  .printing-single .leader-item.print-target {
    display: block !important;
    border: none;
    box-shadow: none;
    margin: 0;
  }

  /* Forzar expansión del contenido */
  .leader-content {
    display: block !important;
    padding: 0;
    border: none;
  }

  /* Header de impresión */
  .print-header {
    display: block;
    margin-bottom: 30px;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
  }
  .print-leader-info {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 10px;
  }
  .print-header h2 {
    margin: 0;
    font-size: 1.8rem;
    color: var(--color-text-main);
  }
  .print-leader-info h3 {
    margin: 0;
    font-size: 1.4rem;
    color: var(--color-text-main);
  }

  /* Lista en papel */
  .multiplicadores-list {
    display: block; /* Lista vertical */
  }
  .multiplicador-item {
    border: none;
    border-bottom: 1px solid var(--color-border);
    padding: 8px 0;
    background: transparent;
    page-break-inside: avoid;
  }

  .available-section {
    display: none;
  } /* No imprimir los disponibles */
}

/* Responsive */
@media (max-width: 768px) {
  .manage-teams-container {
    padding: 15px;
  }
  .manage-teams-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  .leader-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .actions-row {
    width: 100%;
    justify-content: flex-end;
    border-top: 1px dashed var(--color-border);
    padding-top: 10px;
  }
  .multiplicadores-list {
    grid-template-columns: 1fr;
  }
}


/* --- Component: ManageUsers.css --- */
/* src/components/ManageUsers.css - OPTIMIZADO & INTEGRADO */

/* NOTA: No definimos :root ni body aquí. 
   Usamos las variables globales de index.css para mantener la coherencia. */

/* Contenedor Principal */
.manage-users-container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px;

  /* Animación de entrada suave */
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Encabezado */
/* Contenedor del Encabezado */
.manage-users-header {
  display: flex; /* Activa el modo fila */
  justify-content: space-between; /* Uno a la izquierda, otro a la derecha */
  align-items: center; /* Centrados verticalmente */
  flex-wrap: nowrap; /* FUERZA a que se mantengan en la misma línea */
  gap: 20px; /* Espacio mínimo entre ellos */
  margin-bottom: 30px;
  width: 100%;
}

/* Tu H1 (Mantenemos tu estilo con el gradiente) */
.manage-users-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  white-space: nowrap; /* Evita que el título se parta en dos líneas si es posible */

  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
}

/* Tu Botón (Con tus ajustes de padding) */
.create-user-button {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 8px 16px; /* Ajustado ligeramente para mejor toque */
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  display: inline-block;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 77, 153, 0.2);

  /* Asegura que el botón no se encoja */
  flex-shrink: 0;
  width: fit-content;
}

.create-user-button:hover {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 77, 153, 0.3);
}

/* RESPONSIVE: Solo en pantallas MUY pequeñas permitimos que bajen */
@media (max-width: 480px) {
  .manage-users-header {
    flex-direction: column; /* Uno sobre otro solo en celular estrecho */
    align-items: flex-start;
    gap: 15px;
  }

  .create-user-button {
    width: 100%; /* Botón ancho completo en celular */
    justify-content: center;
  }
}

/* Barra de Filtros */
.filters-bar-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
  align-items: end;
}

.search-input,
.role-filter-select {
  width: 100%;
  padding: 12px 15px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-main);
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.search-input:focus,
.role-filter-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Botón Exportar Excel */
.export-excel-button {
  background-color: var(--success);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.export-excel-button:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

/* TABLA con Efecto Cristal */
.table-wrapper {
  width: 100%;
  overflow-x: auto;

  /* Glassmorphism aplicado desde variables globales */
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-lg);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px; /* Evita que se aplaste en móvil */
}

.users-table th {
  text-align: left;
  padding: 18px;
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-border);
  background-color: rgba(0, 0, 0, 0.02); /* Diferencia sutil del header */
}

.users-table td {
  padding: 16px 18px;
  color: var(--color-text-main);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.users-table tr:last-child td {
  border-bottom: none;
}

/* Efecto Hover en Filas */
.users-table tr:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
body.dark-mode .users-table tr:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

/* Badges de Roles */
.role-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-admin {
  background-color: rgba(59, 130, 246, 0.15);
  color: var(--primary);
}
body.dark-mode .role-admin {
  color: #60a5fa;
}

.role-lider-de-zona {
  background-color: rgba(34, 197, 94, 0.15);
  color: var(--success);
}
body.dark-mode .role-lider-de-zona {
  color: #4ade80;
}

.role-multiplicador {
  background-color: rgba(234, 179, 8, 0.15);
  color: var(--warning);
}
body.dark-mode .role-multiplicador {
  color: #facc15;
}

/* Acciones (Botones Editar/Eliminar) */
.actions-cell {
  display: flex;
  gap: 8px;
}

.edit-button,
.delete-button {
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-button {
  background-color: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}

.edit-button:hover {
  background-color: var(--primary);
  color: white;
}

.delete-button {
  background-color: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
}

.delete-button:hover {
  background-color: var(--danger);
  color: white;
}

/* Resumen de resultados */
.results-summary {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

/* Estado Vacío */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

.empty-state span {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
  opacity: 0.5;
}

/* Error Message */
.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  padding: 15px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* ---- SPINNER OVERLAY ---- */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(3px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg, 16px);
}

body.dark-mode .loading-overlay {
  background: rgba(15, 23, 42, 0.75);
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 77, 153, 0.15);
  border-top-color: var(--primary, #004d99);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner-text {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: 500;
  margin: 0;
}

/* Asegura que el contenedor padre tenga position relative para el overlay */
.manage-users-container {
  position: relative;
}

/* ---- PAGINACIÓN MEJORADA ---- */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.pagination-btn {
  /* width:auto anula la regla global `button { width: 100% }`, que si no
     hace que cada número de página ocupe una línea completa. */
  width: auto;
  min-width: 38px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  background: var(--color-surface);
  color: var(--color-text-main);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--primary, #004d99);
  color: var(--primary, #004d99);
  background-color: rgba(0, 77, 153, 0.06);
  transform: translateY(-1px);
}

.pagination-btn.active {
  background-color: var(--primary, #004d99);
  color: #fff;
  border-color: var(--primary, #004d99);
  box-shadow: 0 3px 10px rgba(0, 77, 153, 0.3);
  font-weight: 700;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.pagination-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  color: var(--color-text-muted);
  font-size: 1rem;
}

/* MODAL (Glassmorphism) */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: var(--color-surface);
  padding: 30px;
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border);
  animation: modalUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modalUp {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-content h3 {
  color: var(--primary);
  margin-top: 0;
}

.modal-actions {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.save-button {
  background-color: var(--success);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
}

.cancel-button {
  background-color: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .manage-users-container {
    padding: 15px;
  }

  .manage-users-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .create-user-button {
    width: 100%;
    justify-content: center;
  }

  .filters-bar-wrapper {
    grid-template-columns: 1fr;
  }

  /* Scroll horizontal para la tabla en móviles */
  .table-wrapper {
    overflow-x: auto;
  }

  .pagination-controls {
    gap: 4px;
  }

  .pagination-btn {
    min-width: 34px;
    height: 34px;
    font-size: 0.85rem;
  }
}


/* --- Component: Metrics.css --- */
/* src/components/Metrics.css - OPTIMIZADO (Sistema Cristal Mate) */

/* ===============================================================
   TARJETAS DE MÉTRICAS & GRÁFICOS
   =============================================================== */

/* --- Estilo Base (Efecto Cristal) --- */
.metric-card,
.chart-card,
.goal-card {
  /* Aplicamos el Glassmorphism global */
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-lg);

  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  /* Para asegurar que el contenido no se rompa */
  display: flex;
  flex-direction: column;
}

.metric-card:hover,
.goal-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.chart-card {
  /* Los gráficos necesitan más espacio */
  min-height: 350px;
  justify-content: center;
}

/* --- Encabezado de Tarjeta --- */
.metric-card-header,
.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.metric-card-header h3,
.goal-header h3 {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* --- Valores Numéricos --- */
.metric-value {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0.5rem 0;

  /* Gradiente en el texto para destacar */
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
  line-height: 1.2;
}

/* Ajuste específico para la tarjeta de Objetivos */
.goal-card .metric-value {
  font-size: 2.2rem;
}

/* --- Botón de Exportar (Excel) --- */
.export-metric-button {
  background-color: rgba(33, 163, 102, 0.1); /* Verde transparente */
  color: #21a366; /* Verde Excel */
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  padding: 6px 10px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-metric-button:hover:not(:disabled) {
  background-color: #21a366;
  color: white;
  box-shadow: 0 4px 10px rgba(33, 163, 102, 0.3);
}

.export-metric-button:disabled {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}

/* --- Barra de Progreso (Moderna) --- */
.progress-bar-container {
  height: 12px; /* Más fina y elegante */
  width: 100%;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  margin-top: 1.5rem;
  overflow: hidden;
  position: relative;
}

body.dark-mode .progress-bar-container {
  background-color: rgba(255, 255, 255, 0.1);
}

.progress-bar-fill {
  height: 100%;
  /* Gradiente para la barra de progreso */
  background: linear-gradient(90deg, var(--success) 0%, #34d399 100%);
  border-radius: 20px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.4); /* Glow effect */
}

.progress-text {
  margin-top: 0.8rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-main);
  text-align: right;
}

/* --- Botón Editar Objetivo --- */
.edit-goal-button {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.edit-goal-button:hover {
  background-color: var(--primary);
  color: white;
  box-shadow: 0 4px 10px rgba(0, 77, 153, 0.2);
}

/* --- Responsive --- */
@media (max-width: 768px) {
  .metric-card,
  .chart-card,
  .goal-card {
    padding: 1.2rem;
  }

  .metric-value {
    font-size: 2rem;
  }
}


/* --- Component: MyReferralLink.css --- */
/* src/components/MyReferralLink.css - OPTIMIZADO (Cristal Mate) */

.referral-link-container {
  /* Hereda el efecto cristal del sistema global */
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-lg);

  padding: 2rem;
  text-align: center; /* Centrado para mayor impacto */
  margin: 2rem 0;
  transition: transform 0.3s ease;
}

.referral-link-container:hover {
  transform: translateY(-3px); /* Elevación suave al pasar el mouse */
}

.referral-link-container h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--primary); /* Azul Institucional */
  font-size: 1.4rem;
  font-weight: 800;
}

.referral-link-container p {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* Caja del Link (Input + Botón) */
.link-box {
  display: flex;
  gap: 8px;
  background-color: var(--color-surface); /* Fondo sólido para contraste */
  padding: 6px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  max-width: 600px;
  margin: 0 auto; /* Centrado horizontal */
  align-items: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);
}

/* Input de solo lectura */
.link-box input[type="text"] {
  flex-grow: 1;
  border: none;
  background: transparent;
  padding: 10px 15px;
  color: var(--color-text-main);
  font-family: "Courier New", monospace; /* Estilo código para el link */
  font-size: 0.95rem;
  outline: none;
  width: 100%;
}

/* Botón Copiar */
.link-box button {
  padding: 10px 24px;
  border: none;
  background-color: var(--primary);
  color: white;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.link-box button:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 77, 153, 0.25);
}

.link-box button:active {
  transform: scale(0.98);
}

/* Estado: Copiado (Feedback visual) */
.link-box button:disabled {
  background-color: var(--success); /* Verde Éxito */
  color: white;
  cursor: default;
  box-shadow: none;
  transform: none;
}

/* RESPONSIVE (Móvil) */
@media (max-width: 600px) {
  .referral-link-container {
    padding: 1.5rem;
  }

  .link-box {
    flex-direction: column;
    background: transparent;
    border: none;
    padding: 0;
    box-shadow: none;
  }

  .link-box input[type="text"] {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px;
    margin-bottom: 10px;
    text-align: center;
    font-size: 0.9rem;
  }

  .link-box button {
    width: 100%;
    padding: 12px;
  }
}


/* --- Component: MyRegisteredSimpatizantes.css --- */
/* ===============================================================
   MY REGISTERED SIMPATIZANTES CSS - FINAL
   =============================================================== */

.my-registrations-container {
  padding: 1rem;
  background-color: var(--page-bg, var(--color-surface));
  color: var(--primary-text, var(--color-text-main));
}

/* --- Alineación del Título y el Botón --- */

/* Contenedor que alinea el título del dashboard con el botón de exportar */
.page-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

/* Nota: Si el título no está en este componente, este div alineará el botón con el borde izquierdo. */

/* --- Barra de Acciones (Botón de Exportar) --- */
.registration-actions-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  /* Eliminamos bordes aquí; se gestiona mejor con page-title-bar si se usa */
  border-bottom: none;
  padding-bottom: 0;
}

.export-registros-button {
  background-color: #21a366; /* Verde Excel */
  color: white;

  /* HACE EL BOTÓN MÁS PEQUEÑO Y COMPACTO */
  padding: 6px 10px;
  font-size: 0.9rem;

  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  width: fit-content;
}

.export-registros-button:hover:not(:disabled) {
  background-color: #1a7e4e;
}

.export-registros-button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

/* --- Tabla de Registros --- */

.table-wrapper {
  /* Wrapper para manejar el scroll horizontal en pantallas pequeñas */
  overflow-x: auto;
  background-color: var(--element-bg, var(--color-surface));
  border-radius: 8px;
  box-shadow: 0 4px 10px var(--shadow-color, rgba(0, 0, 0, 0.08));
}

.registrations-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
}

/* CORRECCIÓN CLAVE: Asegurar alineación izquierda para datos y encabezados */
.registrations-table th,
.registrations-table td {
  padding: 10px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #eee);
  color: var(--primary-text);
}

.registrations-table thead th {
  background-color: var(--header-bg, var(--color-surface));
  color: var(--secondary-text, var(--color-text-main));
  font-size: 0.8rem;
  text-transform: uppercase;
  text-align: left; /* RE-ASEGURAR alineación */
}

.registrations-table tbody tr:hover {
  background-color: var(--hover-bg, var(--color-surface));
}

.empty-state {
  padding: 2rem;
  color: var(--secondary-text);
  font-style: italic;
  text-align: center;
}

/* --- Responsividad --- */
@media (max-width: 600px) {
  .my-registrations-container {
    padding: 1rem;
  }
  /* Asegura que los elementos se apilen en lugar de desbordarse */
  .page-title-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .registration-actions-bar {
    justify-content: flex-start;
    width: 100%; /* El botón ocupa todo el ancho disponible */
  }
}


/* --- Component: MyTeam.css --- */
/* ===============================================================
   MY TEAM CSS - (Líder de Zona: Pelotón Asignado)
   =============================================================== */

.my-team-container {
    padding: 2rem;
    background-color: var(--page-bg);
    color: var(--primary-text);
}

/* --- Barra de Acciones y Exportación (team-actions-bar) --- */
.team-actions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color, #eee);
    flex-wrap: wrap;
    gap: 1rem;
}

.team-size {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--primary-text, var(--color-text-main));
    margin: 0;
}

/* Estilo para el botón de Exportar (usado por la clase team-export-button) */
.export-excel-button.team-export-button {
    background-color: #21a366; /* Verde Excel */
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
    white-space: nowrap;
}

.team-export-button:hover:not(:disabled) {
    background-color: #1a7e4e;
}

.team-export-button:disabled {
    background-color: #a0a0a0;
    cursor: not-allowed;
}

/* --- Estilos de la Tabla (team-table) --- */
.team-table {
    width: 100%;
    border-collapse: collapse;
    background-color: var(--element-bg, var(--color-surface));
    box-shadow: 0 4px 10px var(--shadow-color, rgba(0, 0, 0, 0.1));
    border-radius: 8px;
    overflow: hidden;
    /* Permite el scroll horizontal en móviles si la tabla es muy ancha */
    display: block; 
    overflow-x: auto;
    white-space: nowrap;
}

.team-table th,
.team-table td {
    padding: 12px 18px;
    text-align: left;
    border-bottom: 1px solid var(--border-color, #eee);
    color: var(--primary-text);
}

.team-table thead th {
    background-color: var(--header-bg, var(--color-surface));
    color: var(--secondary-text, var(--color-text-main));
    font-size: 0.85rem;
    text-transform: uppercase;
}

.team-table tbody tr:hover {
    background-color: var(--hover-bg, var(--color-surface));
}

/* Mensajes de estado */
.empty-team-message {
    padding: 2rem;
    color: var(--secondary-text);
    font-style: italic;
    text-align: center;
}

/* --- Responsividad (Opcional, si deseas que la tabla se vea mejor que solo scroll) --- */
@media (max-width: 600px) {
    .team-actions-bar {
        flex-direction: column;
        align-items: flex-start;
    }
}


/* --- Component: Navbar.css --- */
:root {
  --nav-bg: rgba(0, 31, 63, 0.95);
  --accent: #3b82f6;
  --text-white: #ffffff;
  --nav-h: 75px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  height: var(--nav-h);
  background: var(--nav-bg);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  z-index: 1000;
}

.nav-container {
  width: 90%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  /* Empuja logo a izq e icono a der */
  align-items: center;
}

.nav-logo {
  color: var(--text-white);
  text-decoration: none;
  font-weight: 800;
  font-size: 1.3rem;
  letter-spacing: -0.5px;
  flex-shrink: 0;
  /* Evita que el logo se comprima */
}

.nav-logo span {
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
}

.nav-menu {
  display: flex;
  align-items: center;
  list-style: none;
  gap: 1.2rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition);
}

.nav-link:hover,
.nav-link.active {
  color: var(--text-white);
}

.nav-link-btn {
  background: var(--accent);
  color: white !important;
  border-radius: 8px;
  padding: 8px 18px;
}

/* BOTÓN DE HAMBURGUESA OPTIMIZADO */
.menu-icon {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.6rem;
  cursor: pointer;
  padding: 5px;
  width: fit-content;
  /* Ocupa solo el ancho del icono */
  height: fit-content;
  -webkit-tap-highlight-color: transparent;
  /* ELIMINA EL RECUADRO AZUL EN MÓVIL */
  outline: none;
}

/* --- DISEÑO MÓVIL --- */
@media screen and (max-width: 820px) {
  .menu-icon {
    display: block;
    /* Solo visible en móvil */
    z-index: 1001;
  }

  .nav-menu {
    position: absolute;
    top: calc(var(--nav-h) + 10px);
    right: 5%;
    width: 200px;
    background: rgba(2, 20, 38, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    flex-direction: column;
    padding: 1rem;
    gap: 0.5rem;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);

    /* Animación fluida */
    opacity: 0;
    visibility: hidden;
    transform: translateY(-15px) scale(0.95);
    transition: var(--transition);
  }

  .nav-menu.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  }

  .nav-item {
    width: 100%;
  }

  .nav-link {
    display: block;
    padding: 10px;
    font-size: 1rem;
    border-radius: 8px;
  }

  .nav-link-btn {
    text-align: center;
    margin-top: 5px;
  }

  .nav-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    visibility: hidden;
    transition: var(--transition);
    z-index: 999;
  }

  .nav-overlay.active {
    opacity: 1;
    visibility: visible;
  }
}

/* --- Component: Propuestas.css --- */
/* -------------------------- */
/* 1. VARIABLES Y RESET       */
/* -------------------------- */
.propuestas-page {
  --primary: #003366;
  --primary-light: #004a94;
  --accent: #d4af37;
  /* Dorado para iconos */
  --accent-success: #28a745;
  --text-main: #2d3436;
  --text-light: #636e72;
  --bg-alt: #f4f7f9;
  --white: #ffffff;
  --shadow: 0 4px 20px rgba(0, 43, 85, 0.08);
  --border-light: #e1e8ed;

  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-main);
  background-color: var(--var(--color-surface));
}

/* -------------------------- */
/* 2. HEADER Y SECCIONES      */
/* -------------------------- */
.header-section {
  text-align: center;
  padding: 60px 20px;
  background: var(--var(--color-surface));
}

.page-header {
  color: var(--primary);
  font-size: clamp(2rem, 5vw, 2.8rem);
  margin-bottom: 15px;
  font-weight: 800;
}

.header-subtitle {
  color: var(--text-light);
  font-size: 1.1rem;
  max-width: 700px;
  margin: 0 auto;
}

.prop-section {
  padding: 60px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.bg-alt {
  background-color: var(--bg-alt);
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  max-width: 100%;
  /* Para que el fondo ocupe todo el ancho */
}

.prop-section h2 {
  font-size: 1.8rem;
  color: var(--primary);
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
}

.prop-section h2 svg {
  color: var(--accent);
}

/* -------------------------- */
/* 3. GRID Y LAYOUT           */
/* -------------------------- */
.grid-3,
.grid-2 {
  display: grid;
  gap: 32px;
  /* Espacio uniforme horizontal y vertical */
  padding: 10px 0;
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
}

/* -------------------------- */
/* 4. TARJETAS (CARDS)        */
/* -------------------------- */
.prop-card {
  background: var(--var(--color-surface));
  border-radius: 12px;
  padding: 35px 25px 25px 25px;
  box-shadow: var(--shadow);
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.prop-card:hover {
  transform: translateY(-8px);
  border-color: var(--primary-light);
  box-shadow: 0 12px 30px rgba(0, 43, 85, 0.15);
}

.card-accent-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: var(--primary);
  border-radius: 12px 12px 0 0;
}

.prop-card h3 {
  margin-top: 10px;
  margin-bottom: 12px;
  color: var(--primary);
  font-size: 1.25rem;
  line-height: 1.3;
  font-weight: 700;
}

.prop-card p {
  color: var(--text-light);
  line-height: 1.6;
  font-size: 0.95rem;
  margin-bottom: 20px;
  flex-grow: 1;
  /* Empuja el detalle al fondo */
}

/* -------------------------- */
/* 5. BLOQUE DE IMPORTANCIA   */
/* -------------------------- */
.card-detail {
  margin-top: auto;
  padding: 15px;
  background-color: #f0f7ff;
  /* Azul suave no morado */
  border-left: 5px solid var(--primary);
  border-radius: 6px;
  font-size: 0.88rem !important;
  color: var(--primary) !important;
  line-height: 1.5;
}

.card-detail strong {
  display: block;
  color: var(--primary);
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 1px;
  margin-bottom: 5px;
  opacity: 0.9;
}

/* -------------------------- */
/* 6. ETIQUETAS (TAGS)        */
/* -------------------------- */
.tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  align-self: flex-start;
}

.tag-infra,
.tag-comision {
  background: #e0e7ff;
  color: #3730a3;
}

.tag-salud {
  background: #dcfce7;
  color: #166534;
}

.tag-infancia {
  background: #fef3c7;
  color: #92400e;
}

.tag-politica {
  background: var(--color-surface);
  color: var(--color-text-main);
}

/* -------------------------- */
/* 7. RESPONSIVIDAD           */
/* -------------------------- */
@media (max-width: 768px) {
  .header-section {
    padding: 40px 15px;
  }

  .page-header {
    font-size: 2rem;
  }

  .prop-section {
    padding: 40px 15px;
  }

  .grid-3,
  .grid-2 {
    grid-template-columns: 1fr;
    gap: 30px;
    /* Asegura que no se peguen verticalmente */
  }

  .prop-card {
    padding: 25px 20px;
  }
}

/* --- Component: PublicPages.css --- */
/* Estilos Generales para Páginas Públicas */
.page-container {
    font-family: sans-serif;
}

/* Estilos de la Página de Inicio (HomePage) */
.hero-section {
    background: linear-gradient(135deg, #022340 0%, #004d99 100%);
    color: white;
    text-align: center;
    padding: 100px 20px;
}

.hero-content h1 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
}

.cta-button {
    background-color: #007bff;
    color: white;
    padding: 15px 30px;
    border-radius: 5px;
    text-decoration: none;
    font-weight: bold;
    font-size: 1.1rem;
    transition: background-color 0.3s;
}

.cta-button:hover {
    background-color: #0056b3;
}

.info-section {
    padding: 60px 20px;
    text-align: center;
}

.info-section h2 {
    font-size: 2.5rem;
    margin-bottom: 3rem;
}

.vision-cards {
    display: flex;
    justify-content: center;
    gap: 30px;
    flex-wrap: wrap;
}

.card {
    background-color: var(--color-surface);
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    max-width: 300px;
}

/* Estilos de la Página de Propuestas (ProposalsPage) */
.proposals-page {
    padding: 40px 20px;
    max-width: 900px;
    margin: 0 auto;
}

.page-header {
    text-align: center;
    margin-bottom: 3rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 1.5rem;
}

.proposal-item {
    background-color: var(--color-surface);
    padding: 2rem;
    margin-bottom: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.proposal-item h3 {
    color: #0056b3;
    margin-top: 0;
}

/* --- Component: PublicRegister.css --- */
/* === Contenedor Principal === */
.register-container {
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Alinea arriba para formularios largos */
  min-height: 100vh;
  background-color: var(--color-surface); /* Un gris muy suave */
  padding: 40px 30px; /* Separar padding-top/bottom de padding-left/right */
  box-sizing: border-box; /* Asegura que el padding no desborde */
}

/* Variables CSS */
:root {
  /* Paleta */
  --primary-blue: #004d99; /* Azul fuerte institucional */
  --secondary-blue: #007bff; /* Azul de acento */
  --accent-green: #28a745; /* Verde de acción */
  --dark-navy: #022340; /* Azul Marino para degradado */

  /* Colores Funcionales */
  --color-bg-light: #f4f7f9;
  --color-white: #ffffff;
  --color-text-dark: #333333;
  --color-text-light: #555555;

  /* Tipografía y Espaciado */
  --font-primary: "Montserrat", sans-serif;
  --spacing-xs: 5px;
  --spacing-sm: 10px;
  --spacing-md: 20px;
  --spacing-lg: 40px;
  --spacing-xl: 60px;
}

/* === Estructura del Formulario === */
.register-form {
  width: 100%;
  max-width: 600px; /* Ancho máximo para legibilidad */
  padding: 2.5rem; /* Más espacio interno */
  background-color: var(--color-var(--color-surface));
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08); /* Sombra más sutil */
  border-top: 5px solid #0056b3; /* Acento de color */
}

/* === Encabezado y Textos === */
.register-form h2 {
  text-align: center;
  margin-bottom: 1rem;
  color: var(--color-text-main); /* Azul oscuro, más profesional */
  font-size: 2rem;
  font-weight: 700;
}

.register-form p {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--color-text-main); /* Gris para texto secundario */
  font-size: 1rem;
}

/* === Grupos de Campos (Label + Input) === */
.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-main); /* Color de texto más oscuro para las etiquetas */
  font-weight: 600;
  font-size: 0.9rem;
}

/* === Estilo de los Campos de Entrada y Selectores === */
.input-group input[type="text"],
.input-group input[type="email"],
.input-group input[type="tel"],
.input-group input[type="number"],
.input-group select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid var(--color-border); /* Borde gris claro */
  border-radius: 5px;
  font-size: 1rem;
  color: var(--color-text-dark);
  background-color: var(--color-var(--color-surface)); /* Fondo blanco para selects */
  transition: border-color 0.3s, box-shadow 0.3s; /* Transición suave */
}

/* Efecto de 'glow' al seleccionar el campo */
.input-group input:focus,
.input-group select:focus {
  outline: none;
  border-color: var(--secondary-blue); /* Borde azul al seleccionar */
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
}

/* Deshabilitado para Selectores encadenados */
.input-group select:disabled {
  background-color: var(--color-surface);
  cursor: not-allowed;
}

/* Texto escrito en los inputs de los formularios (modo oscuro).
   --color-text-dark (#333333) no se redefine en dark mode, así que aquí
   forzamos el texto claro. No afecta placeholders, bordes ni fondos.
   Incluye create-user-form (Crear Usuario) además del de activistas. */
body.dark-mode .create-user-form .input-group input,
body.dark-mode .create-user-form .input-group select,
body.dark-mode .register-form--activist .input-group input,
body.dark-mode .register-form--activist .input-group select {
  color: var(--color-text-main);
}

/* Neutraliza el estilo de AUTOFILL del navegador en modo oscuro. Chrome pinta
   los campos autocompletados con su amarillo por defecto y texto de bajo
   contraste vía :-webkit-autofill, que IGNORA la regla normal de `color`. El
   truco del box-shadow inset es el estándar para tapar ese fondo (background-
   color normal no aplica sobre :-webkit-autofill). --color-surface es la
   superficie oscura del tema (#1e293b en dark). */
body.dark-mode .create-user-form .input-group input:-webkit-autofill,
body.dark-mode .create-user-form .input-group input:-webkit-autofill:hover,
body.dark-mode .create-user-form .input-group input:-webkit-autofill:focus,
body.dark-mode .register-form--activist .input-group input:-webkit-autofill,
body.dark-mode .register-form--activist .input-group input:-webkit-autofill:hover,
body.dark-mode .register-form--activist .input-group input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--color-text-main) !important;
  -webkit-box-shadow: 0 0 0px 1000px var(--color-input-bg, var(--color-surface)) inset !important;
  caret-color: var(--color-text-main) !important;
  transition: background-color 9999s ease-in-out 0s;
}

/* === Checkbox de Términos y Condiciones === */
.checkbox-group {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
}

.checkbox-group input {
  width: auto;
  margin-right: 10px;
  transform: scale(1.2);
  border: 1px solid var(--color-border); /* Asegura un borde visible */
}

.checkbox-group label {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-light);
  font-weight: 500;
}

/* === Botón Principal === */
.register-form > button {
  /* Aseguramos que solo afecte al botón del formulario */
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 5px;
  background-color: var(--secondary-blue); /* Azul primario */
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin-top: 1rem; /* Asegura espacio después del último campo */
}

.register-form > button:hover {
  background-color: #0056b3; /* Un azul más oscuro al pasar el mouse */
  transform: translateY(-2px); /* Un ligero efecto de levantamiento */
}

/* Estilo para el botón cuando está deshabilitado (cargando) */
.register-form > button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
}

/* === Logo y Banner === */
.register-logo {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
  padding: 10px 0; /* Espacio vertical dentro del contenedor de logo */
}

.logo-container {
  text-align: center;
  margin: -2.5rem -2.5rem 1.5rem -2.5rem; /* Margen negativo para extender el fondo */
  padding: 0;
  border-radius: 10px 10px 0 0; /* Bordes redondeados superiores */
  background: linear-gradient(
    145deg,
    var(--dark-navy) 0%,
    var(--primary-blue) 100%
  );
}

/* === Referidos === */
.referrer-info {
  background-color: #e7f3ff; /* Fondo azul claro */
  border-left: 5px solid var(--secondary-blue); /* Borde izquierdo azul */
  padding: 10px 15px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #004085; /* Texto azul oscuro */
  border-radius: 0 4px 4px 0; /* Bordes redondeados a la derecha */
  text-align: center;
}

/* --- Estilos para Notificaciones Inline --- */
.notification {
  padding: 12px 15px;
  margin-top: 1.5rem;
  border-radius: 5px;
  font-weight: 500;
  text-align: center;
  border: 1px solid transparent;
}

.notification.success {
  background-color: #d1e7dd;
  color: #0f5132;
  border-color: #badbcc;
}

.notification.error {
  background-color: #f8d7da;
  color: #842029;
  border-color: #f5c2c7;
}

/* --- Estilos para el Mapa Simulado/Coordenadas --- */
.simulated-map-container {
  border: 1px solid var(--color-border);
  border-radius: 5px;
  padding: 15px;
  background-color: var(--color-surface);
}

.map-controls {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.map-controls button {
  width: 50%;
  padding: 10px;
  font-size: 0.9rem;
  /* Sobreescribir estilos de botón principal */
  transition: background-color 0.3s;
  transform: none !important;
  font-weight: 600;
}

.apply-coords-btn {
  background-color: var(--accent-green);
}

.apply-coords-btn:hover {
  background-color: #1e7e34;
}

.reset-coords-btn {
  background-color: #6c757d;
}

.reset-coords-btn:hover {
  background-color: #5a6268;
}

.coords-display {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-main);
  margin-top: 1rem;
}

/* === Responsividad para Móviles === */
@media (max-width: 640px) {
  .register-form {
    padding: 1.5rem;
    border-radius: 0; /* En móviles, borde a borde */
  }
  .register-form h2 {
    font-size: 1.5rem;
  }
  .logo-container {
    /* Ajustar margen negativo para móviles */
    margin: -1.5rem -1.5rem 1.5rem -1.5rem;
  }
}

/* Estilos para opciones de correo */
.email-options-group {
  background-color: var(--color-surface);
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  border-left: 4px solid #004d99;
}

.email-options-group h3 {
  color: var(--primary);
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
}

.email-options-group .checkbox-group {
  margin-bottom: 15px;
}

.email-options-group .input-group {
  margin-bottom: 15px;
}

.email-options-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
}

.email-options-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 77, 153, 0.1);
}

.email-preview {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
}

.email-preview p {
  margin: 5px 0;
  font-size: 14px;
  color: #1565c0;
}

.email-preview strong {
  color: #0d47a1;
}

/* Responsive para opciones de correo */
@media (max-width: 768px) {
  .email-options-group {
    padding: 15px;
    margin: 15px 0;
  }
  
  .email-options-group h3 {
    font-size: 15px;
  }
  
  .email-preview {
    padding: 12px;
  }
  
  .email-preview p {
    font-size: 13px;
  }
}

/* --- Component: UserProfile.css --- */
/* =========================================
   Contenedores Principales
   ========================================= */
.profile-container {
    display: flex;
    justify-content: center;
    padding: 20px;
    min-height: 80vh;
    /* Se eliminó background-color: transparent porque es el valor por defecto */
}

.profile-card {
    background: var(--color-surface);
    width: 100%;
    max-width: 500px;
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    padding: 30px;
}

/* =========================================
   Cabecera e Información
   ========================================= */
.profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 25px;
}

.profile-header h2 {
    margin: 15px 0 5px;
    color: var(--color-text-main);
}

.badge-rol {
    background: #007bff; /* Sugerencia: Cambiar por var(--primary) si la tienes */
    color: #fff;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    text-transform: uppercase;
    font-weight: bold;
}

.profile-info {
    margin-bottom: 25px;
}

.info-item {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.info-item .icon {
    font-size: 1.5rem;
    color: var(--color-text-muted);
    margin-right: 15px;
}

.info-item label {
    display: block;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-bottom: 2px;
}

.info-item p {
    margin: 0;
    font-weight: 500;
    color: var(--color-text-main);
}

/* =========================================
   Ajustes y Formularios
   ========================================= */
.profile-settings h3 {
    font-size: 1.1rem;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--color-text-main);
}

.form-group {
    margin-bottom: 12px;
}

.form-group input {
    width: 100%;
    padding: 10px;
    background-color: var(--color-bg);
    color: var(--color-text-main);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-sizing: border-box;
}

/* =========================================
   Botones (Estilos Unificados)
   ========================================= */
/* Clase base compartida para todos los botones */
.btn-save,
.btn-change-password,
.btn-cancel {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s ease;
    box-sizing: border-box;
}

.btn-save {
    background-color: #28a745;
    color: #fff;
    border: none;
    font-weight: bold;
}

.btn-save:hover { background-color: #218838; }

/* Agrupamos los botones secundarios que comparten estilo */
.btn-change-password,
.btn-cancel {
    background: #07367c;
    border: 1px solid var(--color-border);
    color: inherit;
}

.btn-change-password:hover,
.btn-cancel:hover { background: #e4e6eb; }

/* =========================================
   Mensajes de Estado
   ========================================= */
.status-msg {
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 10px;
    font-size: 0.9rem;
}

.status-msg.error { background: #f8d7da; color: #721c24; }
.status-msg.success { background: #d4edda; color: #155724; }

/* =========================================
   Modal
   ========================================= */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
}

.modal-content {
    position: relative;
    background: var(--color-surface); /* Sugerencia: Podrías usar var(--color-surface) */
    border-radius: 12px;
    padding: 28px 24px 24px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-muted);
    transition: color 0.2s;
    width: auto;
    padding: 0;
    box-shadow: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.modal-close:hover { 
    color: var(--danger);
    background: transparent;
    transform: scale(1.1);
}

.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
}

.modal-actions .btn-cancel,
.modal-actions .btn-save {
    flex: 1;
}




/* Fix inputs in dark mode globally */
input, select, textarea {
  color: var(--color-text-main);
  background-color: transparent;
}
input:focus, select:focus, textarea:focus {
  background-color: var(--color-surface);
}
````

## File: src/service-worker.js
````javascript
/* eslint-disable no-restricted-globals */

// Importaciones de Workbox (CRUCIALES para el build)
// Se usa workbox-precaching y workbox-core (que contiene clientsClaim, aunque se usa nativo).
import { precacheAndRoute } from "workbox-precaching";

// 🌟 PUNTO DE INYECCIÓN DE MANIFIESTO 🌟
// El Webpack plugin inyectará aquí la lista de archivos estáticos.
precacheAndRoute(self.__WB_MANIFEST || []);

// Nombre de la caché estática
const CACHE_NAME = "campaign-cache-v1";

// Recursos esenciales para precache manual (la base de tu app)
const urlsToCache = [
  "/", // Importante para la navegación de la raíz
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  // Si usas assets específicos en la raíz, añádelos aquí.
];

// Instalación: Cargar los archivos esenciales en la caché
self.addEventListener("install", (event) => {
  console.log(
    "Service Worker: Install event triggered. Caching essential assets."
  );
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Ignoramos el error si no se puede cachear algún recurso (como un archivo grande)
        return cache.addAll(urlsToCache).catch((error) => {
          console.error("Error adding URLs to cache:", error);
        });
      })
      // Forzar la activación del nuevo SW inmediatamente
      .then(() => self.skipWaiting())
  );
});

// Activación: Limpiar cachés antiguas y reclamar clientes (resuelve array-callback-return)
self.addEventListener("activate", (event) => {
  console.log(
    "Service Worker: Activate event triggered. Cleaning up old caches."
  );
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          // Se asegura que el .map siempre devuelve algo (sea un Promise o null)
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("Service Worker: Deleting old cache: " + cacheName);
              return caches.delete(cacheName);
            }
            // RETURN: Caso en que el nombre está en la whitelist (no se hace nada)
            return null;
          })
        );
      })
      .then(() => self.clients.claim()) // Tomar control de las páginas no controladas
  );
});

// Fetch: Estrategia de Cache-First para recursos en caché (modo offline)
self.addEventListener("fetch", (event) => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== "GET") {
    return;
  }

  // Permite que el SW no intercepte peticiones de extensiones o CORS no necesarias
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - devolver respuesta en caché
      if (response) {
        console.log("[Cache] Serving:", event.request.url);
        return response;
      }

      // Si no está en caché, ir a la red
      console.log("[Network] Fetching:", event.request.url);
      return fetch(event.request).catch((error) => {
        console.error(
          "Fetch failed: Network error during fetch. App may be offline.",
          error
        );
      });
    })
  );
});
````

## File: src/components/ui/AvatarFoto.js
````javascript
import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaWhatsapp, FaExclamationTriangle } from "react-icons/fa";
import { resolveFotoUrl } from "../../utils/fotoExport";

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
    if (!cedula || !isVisible) return;

    let isMounted = true;
    setLoading(true);
    // resolveFotoUrl consulta el cache compartido ANTES de sondear: el mismo
    // avatar re-entrando al viewport (o el export) no repite las 8 rutas.
    resolveFotoUrl(cedula)
      .then((url) => {
        if (!isMounted) return;
        setImageUrl(url); // url encontrada o null (sin foto)
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

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
````

## File: README.md
````markdown
# 🗳️ Plataforma Digital de Campaña Política | AppCampañaRD

**AppCampañaRD** es una Plataforma Digital para Candidatura Política, implementada como una **Progressive Web App (PWA) con React y Firebase**, diseñada para maximizar la eficiencia, la organización y la medición en una campaña electoral en la República Dominicana.

## 🎯 Objetivos del Proyecto

Esta plataforma resuelve la necesidad de una gestión de campaña moderna y basada en datos, cumpliendo con los siguientes objetivos funcionales y no funcionales:

- **Inscripción y Base de Datos:** Capturar y gestionar la información de simpatizantes de manera pública y privada.
- **Medición de Cobertura:** Cuantificar el **Porcentaje de Cobertura del Padrón** (votantes convertidos en simpatizantes) a nivel de distrito y total.
- **Motivación por Roles:** Proporcionar paneles de control personalizados para **Multiplicadores**, **Líderes de Zona** y **Administradores**, mostrando progreso y metas personales.
- **Seguridad y Escalabilidad:** Asegurar soporte para miles de registros y garantizar el **Control de Acceso Basado en Roles (RBAC)** mediante reglas de Firestore.

## 💻 Stack Tecnológico

| Componente          | Tecnología                                    | Propósito Principal                                                         |
| :------------------ | :-------------------------------------------- | :------------------------------------------------------------------------- |
| **Frontend (PWA)**  | **React.js** (Create React App)               | Interfaz móvil-first con capacidad offline básica (service worker/workbox). |
| **Hosting cliente** | **Vercel**                                     | Sirve la app en `www.felixencarnacion.com` (deploy automático por Git).     |
| **Backend / DB**    | **Firebase** (Firestore, Auth, Storage, Functions) | Autenticación, DB en tiempo real, almacenamiento de fotos y Cloud Functions. |
| **Correos**         | **Resend** (desde Cloud Functions)            | Correos de bienvenida a usuarios y simpatizantes.                          |
| **Navegación**      | **React Router**                              | Rutas para páginas públicas y paneles privados.                            |
| **Gráficos**        | **Chart.js**                                  | Visualización de métricas y progreso.                                      |
| **Mapas**           | **Google Maps** (`@react-google-maps/api`)    | Ubicación exacta de simpatizantes.                                         |

> **Importante:** el proyecto Firebase es **`politicard-cfd`**, pero el **cliente NO se sirve desde Firebase Hosting**, sino desde **Vercel**. Firebase provee solo el backend (Firestore, Auth, Storage, Functions).

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos

- Node.js 22 (el mismo runtime que usan las Cloud Functions).
- Archivo `.env` en la raíz con las variables `REACT_APP_FIREBASE_*`, `REACT_APP_GOOGLE_MAPS_API_KEY`, etc. (no se versiona).
- Para tareas de administración/scripts: clave de servicio del Admin SDK (`*-firebase-adminsdk-*.json`, gitignored).

### Pasos

1. **Clonar e instalar dependencias:**
   ```bash
   git clone https://github.com/ChannelF-Oleo/app-campana-rd
   cd app-campana-rd
   npm install
   ```
2. **Dependencias de las Cloud Functions** (tienen su propio `package.json`):
   ```bash
   cd functions && npm install && cd ..
   ```
3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm start        # http://localhost:3000
   ```

## 🚀 Despliegue

El despliegue tiene **dos destinos separados**:

### 1. Cliente (React) → Vercel

Vercel está conectado al repositorio de GitHub y **despliega automáticamente al hacer push a `main`**:

```bash
git push origin main
```

- El build en Vercel corre con `CI=true` (los warnings se tratan como errores); verificá localmente con `CI=true npm run build` antes de pushear.
- Tras el deploy, el service worker puede requerir recargar la página 1–2 veces para tomar la versión nueva.

### 2. Backend (Cloud Functions) → Firebase

Requiere el `firebase` CLI y **login interactivo con una cuenta Owner** (la clave de servicio del Admin SDK **no** tiene permisos para desplegar functions):

```bash
# una sola vez: instalar CLI y autenticarse
npm install -g firebase-tools
firebase login

# instalar deps de functions (si no está hecho) y desplegar
cd functions && npm install && cd ..
firebase deploy --only functions --project politicard-cfd
```

- Para desplegar una función puntual: `firebase deploy --only functions:createUserAdmin --project politicard-cfd`.
- El CLI ofrece borrar funciones que están en producción pero no en el código; responder **N** salvo que sea una limpieza deliberada.
- Las reglas/índices se despliegan con `firebase deploy --only firestore` / `--only storage`.

## 🔒 Estructura de Datos (Firestore)

Proyecto: **`politicard-cfd`**.

| Colección       | Propósito                                             | Campos clave                                                                 |
| :-------------- | :--------------------------------------------------- | :-------------------------------------------------------------------------- |
| `users`         | Perfiles del equipo (multiplicadores/líderes/admin). | `uid`, `nombre`, `cedula`, `telefono`, `email`, `rol`, `registrationCount`, `liderAsignado`. |
| `simpatizantes` | Simpatizantes registrados.                           | `nombre`, `cedula`, `telefono`, `direccion`, `sector`, `zona`, `usuarioId`, `registradoPor`, `fechaRegistro`. |
| `votantes`      | Padrón electoral (solo lectura).                     | doc id = cédula; `nombre`, `sector`, `origen` (colegio), etc.               |
| `organigrama`   | Gestión de comandos/estructura.                      | según configuración.                                                        |

### Convenciones importantes

- **Cédula:** se almacena **normalizada = solo dígitos, sin guiones** (ej. `00112345678`). Al mostrarla en la UI puede formatearse con guiones. Usar `normalizarCedula()` (`src/constants.js` y su gemelo en `functions/index.js`) antes de cualquier escritura o consulta por cédula.
- **Vínculo users ↔ simpatizantes:** `users` y `simpatizantes` son colecciones separadas relacionadas por **cédula** y por el campo **`usuarioId`** en el doc de simpatizante (= `uid` del usuario). Al crear un usuario no se duplica el simpatizante: si ya existe, solo se vincula.
- **Fotos de perfil (Storage `votantes_fotos/`):** los recortes del padrón están nombrados **con guiones** (`001-1234567-8.jpg`); las fotos nuevas subidas desde la app se guardan **sin guiones** (`00112345678.jpg`). `AvatarFoto` prueba **sin guiones primero** (foto nueva) y con guiones como respaldo (padrón).

## 🧰 Scripts de administración (`scripts/`)

Se ejecutan con Node usando la clave de servicio del Admin SDK (ver Prerrequisitos):

- `scripts/fase1-backup-audit.js` — **solo lectura**: exporta `users` y `simpatizantes` a `backups/` y audita el formato de cédula.
- `scripts/fase2-migracion.js` — normaliza cédulas, deduplica `simpatizantes` y vincula por `usuarioId`. **Dry-run por defecto**; `--apply` es el único modo que escribe (hace backup previo). Simulación offline con `--source=backup`.
- `scripts/recomprimirFotos.js` — recompresión one-off de fotos crudas en Storage (`votantes_fotos/`) con **sharp** (lado mayor 1000px, JPEG q82). Salta las que ya están optimizadas (< 400KB o lado mayor ≤ 1000px) y **sobreescribe** las grandes. **Dry-run por defecto**; `--apply` es el único modo que escribe.

> `backups/` y las claves `*-firebase-adminsdk-*.json` están en `.gitignore`; nunca se versionan.

### Recompresión de fotos (`recomprimirFotos.js`)

La corrida real **sobreescribe los originales**, pero hace **backup automático de SOLO las fotos que va a tocar** (las ~65 crudas, no los ~225k objetos). Antes de sobreescribir cada foto, la copia dentro del mismo bucket a `backup_votantes_fotos_YYYYMMDD/{nombre}` (una carpeta por corrida, con su fecha). Es idempotente (si el backup ya existe no lo pisa) y **nunca sobreescribe sin backup exitoso**: si el backup de una foto falla, la salta.

```bash
# 1) Dry-run: revisa el reporte, incluye qué rutas de backup se crearían (no escribe nada)
node scripts/recomprimirFotos.js --dry-run

# 2) Corrida real (tras verificar el dry-run). Respalda y luego recomprime.
node scripts/recomprimirFotos.js --apply
```

**Revertir** (si algo salió mal): copiar de vuelta los originales desde la carpeta de backup de esa corrida sobre el prefijo `votantes_fotos/` (ajusta la FECHA a la de la carpeta creada):

```bash
gcloud storage cp -r \
  gs://politicard-cfd.firebasestorage.app/backup_votantes_fotos_YYYYMMDD/* \
  gs://politicard-cfd.firebasestorage.app/votantes_fotos/
```

## 🖼️ CORS de Storage (fotos en el export a PDF/Excel)

El export a PDF/Excel lee cada foto con `getBytes()` del SDK, que internamente hace un **XHR** a `firebasestorage.googleapis.com` → **sí requiere CORS** en el bucket. En cambio `<img src>` (la miniatura en pantalla) **no usa CORS**.

> ⚠️ **La prueba de éxito NO es "las fotos se ven en pantalla".** El `<img>` funciona sin CORS y da **falsos positivos**. El éxito real es: en la consola aparece `[fotoExport][…] getBytes OK` **y** el PDF muestra **caras** (no placeholders grises). Un GET a Storage con `200` tampoco basta: puede tener CORS incompleto (sin los `responseHeader` que `getBytes` necesita leer).

La config vive en [`cors.json`](cors.json) (raíz del repo), con `responseHeader` amplio para que `getBytes` pueda leer la respuesta.

```bash
# Ver la config CORS actual (vacío = nunca aplicada)
gcloud storage buckets describe gs://politicard-cfd.firebasestorage.app --format="default(cors_config)"

# Aplicar / actualizar la config
gcloud storage buckets update gs://politicard-cfd.firebasestorage.app --cors-file=cors.json

# Verificar que quedó aplicada
gcloud storage buckets describe gs://politicard-cfd.firebasestorage.app --format="default(cors_config)"
```

Los `origin` incluyen `http://localhost:3000` y el dominio de producción (`felixencarnacion.com` con y sin `www`). **Pendiente:** si se usan previews `*.vercel.app`, agregar ese patrón a `origin` (CORS no admite comodines de subdominio arbitrarios; hay que listar los orígenes concretos).

## 🤝 Contribuciones

Trabajo por ramas y PRs desde `main`. Verificar `CI=true npm run build` y `CI=true npm test` antes de abrir PR.
````

## File: src/components/admin/ManageUsers.js
````javascript
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import AvatarFoto from "../ui/AvatarFoto";
import { generarPadronPDF } from "../../utils/pdfPadron";
import { generarExcelConFoto } from "../../utils/excelConFoto";
import { subirFotoUsuario } from "../../utils/subirFotoUsuario";
import {
  ROLES_DISPONIBLES,
  USUARIOS_POR_PAGINA,
  ROL_ADMIN,
  ROL_LIDER,
  ROL_MULTIPLICADOR,
  normalizarCedula,
} from "../../constants";

// Inicializar Functions
const functions = getFunctions();
const deleteUserCallable = httpsCallable(functions, "deleteUserAndData");

// Campos/columnas para los exports con foto. `key` referencia propiedades de
// cada objeto de filteredUsers (que ya trae cedula, nombre, telefono, rol,
// zona y registrationCount). Sin Dirección (se está retirando del modelo).
const CAMPOS_PDF_USUARIOS = [
  { label: "Nombre", key: "nombre" },
  { label: "Cédula", key: "cedula" },
  { label: "Teléfono", key: "telefono" },
  { label: "Rol", key: "rol" },
  { label: "Zona", key: "zona" },
  { label: "Registros", key: "registrationCount" },
];

const COLUMNAS_EXCEL_USUARIOS = [
  { header: "Nombre", key: "nombre", width: 28 },
  { header: "Cédula", key: "cedula", width: 16 },
  { header: "Teléfono", key: "telefono", width: 16 },
  { header: "Rol", key: "rol", width: 16 },
  { header: "Zona", key: "zona", width: 16 },
  { header: "Registros", key: "registrationCount", width: 12 },
];

// --- SPINNER DE CARGA ---
function LoadingSpinner({ message = "Cargando..." }) {
  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="spinner" aria-label="Cargando"></div>
        <p className="spinner-text">{message}</p>
      </div>
    </div>
  );
}

// --- MODAL DE EDICIÓN (Con Cambio de Foto) ---
function EditUserModal({ user, onClose, onSave }) {
  const [newRole, setNewRole] = useState(user.rol || ROL_MULTIPLICADOR);
  const [newCedula, setNewCedula] = useState(user.cedula || "");
  const [newTelefono, setNewTelefono] = useState(user.telefono || "");
  const [loadingSave, setLoadingSave] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Formateador de Cédula
  const handleCedulaChange = (e) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    const normalized = input.slice(0, 11);
    let formatted = normalized;
    if (normalized.length > 3)
      formatted = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    if (normalized.length > 10)
      formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
    setNewCedula(formatted);
  };

  // SUBIR NUEVA FOTO
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que tengamos cédula para nombrar el archivo (misma exigencia que
    // antes: la foto se sube en el acto y la cédula debe existir ya).
    const cleanCedula = newCedula.replace(/-/g, "");
    if (cleanCedula.length !== 11) {
      alert(
        "❌ Error: El usuario debe tener una cédula válida (11 dígitos) antes de subir la foto."
      );
      return;
    }

    setUploading(true);
    try {
      // Lógica compartida (comprimir + subir a Storage) extraída a un util.
      await subirFotoUsuario(file, cleanCedula);
      alert(
        "✅ Foto actualizada correctamente.\n\nNota: Puede tardar unos minutos en reflejarse o requerir recargar la página."
      );
      setUploading(false);
    } catch (error) {
      console.error("Error subiendo foto:", error);
      alert("❌ Error al subir la imagen. Verifica tu conexión.");
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    const cleanCedula = newCedula.replace(/-/g, "");

    if (cleanCedula.length > 0 && cleanCedula.length !== 11) {
      setError("La cédula debe tener 11 dígitos.");
      return;
    }

    setLoadingSave(true);
    try {
      await onSave(user.id, {
        rol: newRole,
        cedula: newCedula,
        telefono: newTelefono,
        multiplicadoresAsignados: user.multiplicadoresAsignados,
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      setError("Error al guardar los cambios.");
      setLoadingSave(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel">
        <h3>Editar Usuario: {user.nombre}</h3>

        {/* ÁREA DE FOTO Y SUBIDA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "20px 0",
            gap: "10px",
          }}
        >
          <AvatarFoto
            cedula={newCedula || user.cedula}
            nombre={user.nombre}
            size="100px"
          />

          {/* Botón de carga de archivo */}
          <label
            className="upload-btn"
            style={{
              cursor: uploading ? "wait" : "pointer",
              color: "#004d99",
              fontSize: "0.9rem",
              fontWeight: "bold",
              padding: "5px 10px",
              border: "1px dashed #004d99",
              borderRadius: "5px",
              backgroundColor: uploading ? "#f0f0f0" : "transparent",
            }}
          >
            {uploading ? "⏳ Subiendo..." : "📷 Subir/Cambiar Foto"}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="form-group">
          <label>Email (No editable):</label>
          <input
            type="text"
            value={user.email}
            disabled
            className="input-disabled"
          />
        </div>

        <div className="form-group">
          <label>Cédula de Identidad:</label>
          <input
            type="text"
            value={newCedula}
            onChange={handleCedulaChange}
            placeholder="001-0000000-0"
            className="search-input"
          />
        </div>

        <div className="form-group">
          <label>Teléfono:</label>
          <input
            type="tel"
            value={newTelefono}
            onChange={(e) => setNewTelefono(e.target.value)}
            placeholder="809-000-0000"
            className="search-input"
            disabled={loadingSave}
          />
        </div>

        <div className="form-group">
          <label htmlFor="role-select">Rol del Usuario:</label>
          <select
            id="role-select"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="role-filter-select"
            disabled={loadingSave}
          >
            {ROLES_DISPONIBLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="modal-actions">
          <button
            onClick={handleSave}
            className="save-button"
            disabled={loadingSave || uploading}
          >
            {loadingSave ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button
            onClick={onClose}
            className="cancel-button"
            disabled={loadingSave || uploading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
function ManageUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");

  // Estado de los exports con foto (PDF/Excel).
  const [exportando, setExportando] = useState(false);
  const [progreso, setProgreso] = useState(null); // { fase, hechos, total }
  const textoProgreso = progreso
    ? `Generando... ${progreso.hechos}/${progreso.total}`
    : "";

  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredUsers.length / USUARIOS_POR_PAGINA);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USUARIOS_POR_PAGINA,
    currentPage * USUARIOS_POR_PAGINA
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Regresar al top de la tabla suavemente
    document.querySelector(".table-wrapper")?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUsersAndMetrics = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      let usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data(),
      }));

      const simpatizantesSnapshot = await getDocs(
        collection(db, "simpatizantes")
      );
      const registrationCounts = {};
      // Mapa cédula normalizada -> datos del simpatizante vinculado (teléfono,
      // zona, dirección). Los usuarios existentes no tienen estos campos en su
      // propio doc, así que se toman del simpatizante con la misma cédula.
      const datosSimpPorCedula = {};
      simpatizantesSnapshot.forEach((doc) => {
        const data = doc.data();
        const registeredBy = data.registradoPor;
        if (registeredBy)
          registrationCounts[registeredBy] =
            (registrationCounts[registeredBy] || 0) + 1;
        const ced = normalizarCedula(data.cedula);
        if (ced && !datosSimpPorCedula[ced]) {
          datosSimpPorCedula[ced] = {
            telefono: data.telefono || "",
            zona: data.zona || "",
            direccion: data.direccion || "",
          };
        }
      });

      usersList = usersList.map((user) => {
        const simp = datosSimpPorCedula[normalizarCedula(user.cedula)] || {};
        return {
          ...user,
          registrationCount: registrationCounts[user.uid] || 0,
          telefono: user.telefono || simp.telefono || "",
          zona: user.zona || simp.zona || "",
          direccion: user.direccion || simp.direccion || "",
        };
      });

      setAllUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirm = window.confirm(
      `¿Estás SEGURO de que quieres eliminar a ${user.nombre}?\n\nEsta acción borrará su acceso y sus datos personales permanentemente.`
    );

    if (confirm) {
      setLoading(true);
      try {
        const result = await deleteUserCallable({ uid: user.uid });
        if (result.data.success) {
          alert("Usuario eliminado correctamente.");
          fetchUsersAndMetrics();
        } else {
          alert("Error al eliminar usuario.");
        }
      } catch (error) {
        console.error("Error eliminando:", error);
        alert("Error de servidor al eliminar usuario.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios para exportar.");
      return;
    }
    const dataToExport = filteredUsers.map((user) => ({
      Nombre: user.nombre || "N/A",
      Cedula: user.cedula || "N/A",
      Telefono: user.telefono || "",
      Rol: user.rol || "N/A",
      Zona: user.zona || "",
      Direccion: user.direccion || "",
      Registros: user.registrationCount || 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios Filtrados");
    XLSX.writeFile(workbook, "Usuarios_Filtrados.xlsx");
  };

  // Export PDF tipo padrón (foto grande + datos por ficha).
  const handleExportPDF = async () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios para exportar.");
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: filteredUsers.length });
    try {
      await generarPadronPDF(filteredUsers, {
        titulo: "Padrón de Usuarios",
        campos: CAMPOS_PDF_USUARIOS,
        fileName: "Usuarios_Padron.pdf",
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  // Export Excel con la foto embebida en cada fila.
  const handleExportExcelFoto = async () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios para exportar.");
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: filteredUsers.length });
    try {
      await generarExcelConFoto(filteredUsers, {
        hojaNombre: "Usuarios",
        columnas: COLUMNAS_EXCEL_USUARIOS,
        fileName: "Usuarios_Con_Foto.xlsx",
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (error) {
      console.error("Error generando Excel:", error);
      alert("Hubo un error al generar el Excel.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  useEffect(() => {
    fetchUsersAndMetrics();
  }, []);

  useEffect(() => {
    let currentUsers = [...allUsers];
    if (roleFilter !== "todos") {
      currentUsers = currentUsers.filter((user) => user.rol === roleFilter);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentUsers = currentUsers.filter(
        (user) =>
          (user.nombre &&
            user.nombre.toLowerCase().includes(lowerSearchTerm)) ||
          (user.email && user.email.toLowerCase().includes(lowerSearchTerm)) ||
          (user.cedula && user.cedula.includes(searchTerm))
      );
    }
    setFilteredUsers(currentUsers);
    setCurrentPage(1); // Resetear a página 1 al filtrar
  }, [searchTerm, roleFilter, allUsers]);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (userId, data) => {
    const userDocRef = doc(db, "users", userId);
    try {
      let dataToUpdate = {
        rol: data.rol,
        // Estándar: cédula SOLO dígitos en Firestore.
        cedula: normalizarCedula(data.cedula),
        telefono: data.telefono || "",
        multiplicadoresAsignados:
          data.rol === ROL_LIDER
            ? data.multiplicadoresAsignados || []
            : [],
      };

      await updateDoc(userDocRef, dataToUpdate);
      alert("Usuario actualizado con éxito.");
      handleCloseModal();
      fetchUsersAndMetrics();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Hubo un error al guardar.");
    }
  };

  return (
    <div className="manage-users-container glass-panel">
      {/* SPINNER GLOBAL (Overlay) */}
      {loading && <LoadingSpinner message="Cargando usuarios..." />}

      <div className="manage-users-header">
        <h2>Gestión de Usuarios</h2>
        <button
          onClick={() => navigate("/admin/crear-usuario")}
          className="create-user-button"
        >
          + Crear Nuevo Usuario
        </button>
      </div>

      <div className="filters-bar-wrapper">
        <input
          type="text"
          placeholder="Buscar por nombre, email o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="role-filter-select"
        >
          <option value="todos">Todos los Roles</option>
          <option value={ROL_ADMIN}>Administrador</option>
          <option value={ROL_LIDER}>Lider de Zona</option>
          <option value={ROL_MULTIPLICADOR}>Multiplicador</option>
        </select>
        <button
          onClick={handleExport}
          className="export-excel-button"
          disabled={loading || exportando || filteredUsers.length === 0}
        >
          Exportar Excel
        </button>
        <button
          onClick={handleExportPDF}
          className="export-excel-button"
          disabled={loading || exportando || filteredUsers.length === 0}
        >
          {exportando ? textoProgreso : "PDF con foto (padrón)"}
        </button>
        <button
          onClick={handleExportExcelFoto}
          className="export-excel-button"
          disabled={loading || exportando || filteredUsers.length === 0}
        >
          {exportando ? textoProgreso : "Excel con foto"}
        </button>
      </div>

      {/* Resumen de resultados */}
      <div className="results-summary">
        {filteredUsers.length > 0 ? (
          <span>
            Mostrando{" "}
            <strong>
              {(currentPage - 1) * USUARIOS_POR_PAGINA + 1}–
              {Math.min(currentPage * USUARIOS_POR_PAGINA, filteredUsers.length)}
            </strong>{" "}
            de <strong>{filteredUsers.length}</strong> usuarios
          </span>
        ) : (
          !loading && <span>No se encontraron usuarios.</span>
        )}
      </div>

      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Registros</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td data-label="Foto" style={{ width: "60px" }}>
                    <AvatarFoto
                      cedula={user.cedula}
                      nombre={user.nombre}
                      size="40px"
                    />
                  </td>
                  <td data-label="Nombre">
                    <div style={{ fontWeight: "600" }}>
                      {user.nombre || "N/A"}
                    </div>
                    {user.cedula ? (
                      <small style={{ color: "#666" }}>{user.cedula}</small>
                    ) : (
                      <small style={{ color: "#e63946" }}>Sin Cédula</small>
                    )}
                  </td>
                  <td data-label="Teléfono">{user.telefono || "—"}</td>
                  <td data-label="Rol">
                    <span
                      className={`role-badge role-${user.rol?.replace(
                        /\s+/g,
                        "-"
                      )}`}
                    >
                      {user.rol || "N/A"}
                    </span>
                  </td>
                  <td data-label="Registros">
                    <div className="count-badge">{user.registrationCount}</div>
                  </td>
                  <td data-label="Acciones" className="actions-cell">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="edit-button icon-only"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="delete-button icon-only"
                      title="Eliminar"
                      style={{
                        marginLeft: "8px",
                        borderColor: "#ef4444",
                        color: "#ef4444",
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              !loading && (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* --- CONTROLES DE PAGINACIÓN --- */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            title="Primera página"
          >
            «
          </button>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Página anterior"
          >
            ‹
          </button>

          {/* Números de página */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
            )
            .reduce((acc, page, idx, arr) => {
              if (idx > 0 && page - arr[idx - 1] > 1) {
                acc.push("...");
              }
              acc.push(page);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "..." ? (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  className={`pagination-btn ${
                    item === currentPage ? "active" : ""
                  }`}
                  onClick={() => handlePageChange(item)}
                >
                  {item}
                </button>
              )
            )}

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Página siguiente"
          >
            ›
          </button>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Última página"
          >
            »
          </button>
        </div>
      )}

      {isModalOpen && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}

export default ManageUsers;
````

## File: .gitignore
````
# ==============================================================================
# DEPENDENCIES & SYSTEM
# ==============================================================================
# Dependency directories (Remove slash to ignore in root AND /functions)
node_modules
/.pnp
.pnp.js

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# ==============================================================================
# BUILD OUTPUTS & GENERATED FILES
# ==============================================================================
/build
/dist
/out
/coverage
/.next/
/esnext
/lib
/cjs
/esm
/temp

# Testing
/coverage
/lcov-report

# Caches
.eslintcache
.cache
.npm
.yarn
*.tsbuildinfo

# ==============================================================================
# IDE & OS FILES
# ==============================================================================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
.vscode/
.idea/
*.swp
*.swo

# ==============================================================================
# ENVIRONMENT & SECRETS (CRITICAL)
# ==============================================================================
# Local Env Files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*

# Firebase specific
.runtimeconfig.json
firebase-debug.log*
firestore-debug.log*
ui-debug.log*

# ==============================================================================
# USER CUSTOM IGNORES
# ==============================================================================

# Backend Keys & Credentials
politicard-cfd-firebase-adminsdk-fbsvc-0dfcb72afa.json
serviceAccountKey.json
*-firebase-adminsdk-*.json
*.p12
*.pem

# Backups de Firestore (datos reales, no versionar)
/backups

# Data & Media
fotos
consolidated_data.json

# Specific Files
# Nota: Si 'firebase.js' contiene solo la config pública, no es necesario ignorarlo.
# Si contiene credenciales de Admin SDK, mantenlo aquí.
firebase.js
````

## File: package.json
````json
{
  "$schema": "https://json.schemastore.org/package.json",
  "name": "app-campana-rd",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@react-google-maps/api": "^2.20.7",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^13.5.0",
    "chart.js": "^4.5.1",
    "csv-parser": "^3.2.0",
    "exceljs": "^4.4.0",
    "firebase": "^12.4.0",
    "firebase-admin": "^14.0.0",
    "fs-extra": "^11.3.2",
    "inquirer": "^13.0.1",
    "jspdf": "^4.2.1",
    "react": "^19.2.1",
    "react-chartjs-2": "^5.3.0",
    "react-dom": "^19.2.1",
    "react-icons": "^5.5.0",
    "react-router-dom": "^7.9.4",
    "react-scripts": "^5.0.1",
    "web-vitals": "^2.1.4",
    "workbox-core": "^7.3.0",
    "workbox-expiration": "^7.3.0",
    "workbox-precaching": "^7.3.0",
    "workbox-routing": "^7.3.0",
    "workbox-strategies": "^7.3.0",
    "xlsx": "^0.18.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "sharp": "^0.35.3"
  }
}
````

## File: src/App.js
````javascript
import React, { useState, createContext, useContext, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// --- CONTEXTOS ---
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";
import { ROL_ADMIN } from "./constants";

// --- HOOKS ---
import usePageTracking from "./hooks/usePageTracking";
import useMediaQuery from "./hooks/useMediaQuery";

// --- COMPONENTES GLOBALES ---
import Navbar from "./components/ui/Navbar";
import Footer from "./components/ui/Footer";

// --- COMPONENTES DEL DASHBOARD ---
import DashboardSidebar from "./components/dashboard/DashboardSidebar";
import BottomNavBar from "./components/dashboard/BottomNavBar";

// --- PÁGINAS (carga estática) ---
import HomePage from "./components/pages/Home"; // landing / primera pintura
import SetGoalModal from "./components/dashboard/SetGoalModal"; // modal, no es una ruta
import NotFound from "./components/pages/NotFound";
import Loader from "./components/ui/Loader";

// --- PÁGINAS (carga diferida con React.lazy / code-splitting) ---
// Se prioriza separar las rutas más pesadas: mapas (RegisterByActivist),
// gráficos (Dashboard) y panel de administración.
const Login = lazy(() => import("./components/pages/Login"));
const PublicRegister = lazy(() => import("./components/pages/PublicRegister"));
const RegisterAppUser = lazy(() => import("./components/pages/RegisterAppUser"));
const ProposalsPage = lazy(() => import("./components/pages/Propuestas"));
const Dashboard = lazy(() => import("./components/dashboard/Dashboard")); // gráficos (Chart.js)
const RegisterByActivist = lazy(() => import("./components/dashboard/RegisterByActivist")); // Google Maps
const UserProfile = lazy(() => import("./components/pages/UserProfile"));
const ManageUsers = lazy(() => import("./components/admin/ManageUsers"));
const ManageTeams = lazy(() => import("./components/admin/ManageTeams"));
const CreateUser = lazy(() => import("./components/admin/CreateUser"));
const Comandos = lazy(() => import("./components/admin/Comandos"));

// Contexto para UI del Layout
const LayoutContext = createContext(null);
const useLayoutContext = () => useContext(LayoutContext);

// --- LAYOUTS ---
function PublicLayout() {
  return (
    <>
      <Navbar />
      <div className="public-content-wrapper">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}

function DashboardLayout() {
  const { user, logout } = useAuth();
  const { handleOpenGoalModal } = useLayoutContext();

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (!user) return null;

  return (
    <div
      className={`dashboard-layout ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {/* Navegación Inteligente */}
      {!isMobile ? (
        <DashboardSidebar
          user={user}
          onLogout={logout}
          isCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onSetGoalClick={handleOpenGoalModal}
        />
      ) : (
        <BottomNavBar
          user={user}
          onSetGoalClick={handleOpenGoalModal}
          onLogout={logout}
        />
      )}

      <main className="dashboard-content">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

// --- RUTAS PROTEGIDAS ---
function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader message="Verificando..." />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// --- DEFINICIÓN DE RUTAS ---
function AppRoutes() {
  const { user } = useAuth();
  // Rastreo automático de páginas con Google Analytics
  usePageTracking();
  
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const handleOpenGoalModal = () => setGoalModalOpen(true);
  const handleCloseGoalModal = () => setGoalModalOpen(false);

  return (
    <LayoutContext.Provider value={{ handleOpenGoalModal }}>
      {isGoalModalOpen && user && (
        <SetGoalModal user={user} onClose={handleCloseGoalModal} />
      )}

      <Routes>
        {/* ZONA PÚBLICA */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/propuestas" element={<ProposalsPage />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<PublicRegister />} />
            <Route path="/registro-app" element={<RegisterAppUser />} />
          </Route>
          {/* 404 dentro del layout público: hereda Navbar y Footer */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ZONA PRIVADA (DASHBOARD) - RUTAS PLANAS */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route
              path="/dashboard/registrar"
              element={<RegisterByActivist user={user} />}
            />
            <Route path="/dashboard/perfil" element={<UserProfile />} />

            {/* Admin */}
            {user?.rol === ROL_ADMIN && (
              <>
                <Route path="/admin/usuarios" element={<ManageUsers />} />
                <Route path="/admin/crear-usuario" element={<CreateUser />} />
                <Route path="/admin/equipos" element={<ManageTeams />} />
                <Route path="/admin/comandos" element={<Comandos />} />
              </>
            )}
          </Route>
        </Route>
      </Routes>
    </LayoutContext.Provider>
  );
}

// --- ROOT ---
function App() {
  return (
    <Router>
      <AuthProvider>
        {/* ThemeProvider debe envolver a los componentes que usen useTheme */}
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
````

## File: functions/index.js
````javascript
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const {
  onDocumentCreated,
  onDocumentDeleted,
} = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { Resend } = require("resend");

// Importación específica para Triggers de Auth (Aún usan v1)
const { user } = require("firebase-functions/v1/auth");

// Importar plantillas de email
const {
  getSimpatizanteWelcomeTemplate,
  getUserWelcomeTemplate,
  getPasswordResetTemplate,
  getGoalNotificationTemplate
} = require("./emailTemplates");

admin.initializeApp();

// Normaliza una cédula al estándar de almacenamiento: SOLO dígitos, sin guiones
// ni espacios. Debe usarse antes de CUALQUIER escritura/consulta por cédula para
// evitar duplicados por diferencias de formato. (Gemelo de src/constants.js.)
const normalizarCedula = (cedula) =>
  (cedula === null || cedula === undefined ? "" : String(cedula)).replace(/\D/g, "");

// Configuración Global (V2)
setGlobalOptions({
  region: "us-central1",
  memory: "512MiB",
  cors: true,
});

// Secretos para Resend
const resendApiKey = defineSecret("RESEND_API_KEY");

// Configuración de Resend
let resendClient;

// =========================================================================
// 1. AUTH TRIGGER: CREAR PERFIL AUTOMÁTICO Y ENVIAR CORREO DE BIENVENIDA
// =========================================================================
exports.createProfileForProvider = user().onCreate(async (userRecord) => {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(userRecord.uid);

  try {
    const userData = {
      uid: userRecord.uid,
      nombre: userRecord.displayName || "Usuario Sin Nombre",
      email: userRecord.email,
      fotoUrl: userRecord.photoURL || null,
      rol: "multiplicador", // Rol por defecto
      cedula: null,
      registrationCount: 0, // Inicializamos contador
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      metodoRegistro: "google",
    };

    // Anti-carrera: este trigger (onCreate de Auth) puede ejecutarse en paralelo
    // con createUserAdmin, que escribe el mismo doc con la cédula/rol correctos.
    // Con una transacción, si el doc ya existe (p.ej. lo creó createUserAdmin)
    // NO lo tocamos; y si otro flujo lo escribe entre la lectura y el commit,
    // Firestore reintenta la transacción y vuelve a ver que ya existe. Así el
    // trigger nunca pisa la cédula con null.
    const created = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (snap.exists) return false;
      tx.set(userRef, userData);
      return true;
    });

    if (created) {
      logger.info(`Perfil creado automáticamente para: ${userRecord.email}`);
      // Correo de bienvenida SOLO si este trigger realmente creó el perfil
      // (evita el correo duplicado cuando createUserAdmin ya lo creó y notificó).
      if (userRecord.email) {
        try {
          await sendUserWelcomeEmail(userRecord.email, userData.nombre, userData.rol);
        } catch (mailError) {
          logger.error(`Perfil creado, pero falló el correo a ${userRecord.email}:`, mailError);
        }
      }
    }
  } catch (error) {
    logger.error("Error creando perfil automático:", error);
  }
});

// =========================================================================
// 2. SCHEDULER: CERRAR SESIONES INACTIVAS (>1 Hora)
// =========================================================================
exports.enforceInactivityTimeout = onSchedule(
  {
    schedule: "every 60 minutes",
    timeoutSeconds: 540,
  },
  async () => {
    const db = admin.firestore();
    const auth = admin.auth();
    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 Hora
    const cutoffTime = new Date(Date.now() - INACTIVITY_LIMIT);

    try {
      const inactiveQuery = await db
        .collection("users")
        .where("lastActivity", "<", cutoffTime)
        .get();

      if (inactiveQuery.empty) return;

      const promises = [];
      inactiveQuery.forEach((doc) => {
        const uid = doc.id;
        const promise = auth
          .revokeRefreshTokens(uid)
          .then(() =>
            db.collection("users").doc(uid).update({
              forceLogout: true,
              lastActivity: null,
            })
          )
          .catch((err) => logger.error(`Error revocando ${uid}:`, err));
        promises.push(promise);
      });

      await Promise.all(promises);
      logger.info(`Sesiones cerradas por inactividad: ${promises.length}`);
    } catch (error) {
      logger.error("Error en enforceInactivityTimeout:", error);
    }
  }
);

// =========================================================================
// 3. FIRESTORE TRIGGER: CONTADOR DE REGISTROS (IncrementUserRegistrationCount)
// =========================================================================
// Se ejecuta cada vez que se crea un simpatizante para sumar +1 al usuario que lo registró
exports.incrementUserRegistrationCount = onDocumentCreated(
  "simpatizantes/{simpatizanteId}",
  async (event) => {
    const newData = event.data?.data();
    if (!newData || !newData.registradoPor) return;

    const userId = newData.registradoPor;
    // Ignoramos si fue "Página Pública" o "Admin Console" (no son UIDs reales)
    if (userId === "Página Pública" || userId === "Admin Console") return;

    try {
      const userRef = admin.firestore().collection("users").doc(userId);
      await userRef.update({
        registrationCount: admin.firestore.FieldValue.increment(1),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Contador incrementado para usuario: ${userId}`);
    } catch (error) {
      logger.error("Error incrementando contador:", error);
    }
  }
);

// =========================================================================
// 4. CALLABLE: ELIMINAR USUARIO Y DATOS (DeleteUserAndData)
// =========================================================================
exports.deleteUserAndData = onCall(async (request) => {
  // Verificar autenticación (Opcional: Verificar si es Admin)
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes estar autenticado.");
  }

  const { uid } = request.data;
  if (!uid) throw new HttpsError("invalid-argument", "UID requerido.");

  try {
    // 1. Eliminar de Authentication
    await admin.auth().deleteUser(uid);

    // 2. Eliminar perfil de Firestore
    await admin.firestore().collection("users").doc(uid).delete();

    // 3. (Opcional) ¿Qué hacer con los simpatizantes que registró?
    // Opción A: Dejarlos huérfanos (mantienen el ID pero el usuario ya no existe)
    // Opción B: Reasignarlos a un admin.
    // Por ahora, solo borramos el usuario.

    logger.info(`Usuario ${uid} eliminado correctamente.`);
    return { success: true, message: "Usuario eliminado." };
  } catch (error) {
    logger.error("Error eliminando usuario:", error);
    throw new HttpsError("internal", "No se pudo eliminar el usuario.");
  }
});

// =========================================================================
// 4. CALLABLE: CREAR USUARIO ADMIN Y ENVIAR CORREO DE BIENVENIDA
// =========================================================================
exports.createUserAdmin = onCall({ secrets: [resendApiKey] }, async (request) => {
  const {
    nombre,
    email,
    password,
    rol,
    cedula,
    telefono,
    direccion,
    zona,
    sector,
    subsector,
    recinto,
    provincia,
    municipio,
    colegioElectoral,
  } = request.data;

  // Fase 5: email OPCIONAL, teléfono OBLIGATORIO.
  if (!nombre || !password || !rol || !cedula || !telefono) {
    throw new HttpsError("invalid-argument", "Faltan datos obligatorios (nombre, cédula, teléfono, rol, contraseña).");
  }

  // Estándar: cédula SOLO dígitos en Firestore.
  const cedulaNorm = normalizarCedula(cedula);
  if (cedulaNorm.length !== 11) {
    throw new HttpsError("invalid-argument", "La cédula debe tener 11 dígitos.");
  }

  // Email: si el admin lo provee, se usa para Auth y notificación. Si no, se
  // sintetiza uno a partir de la cédula (misma convención que SignUp) para que
  // Firebase Auth tenga un identificador y el login por cédula siga funcionando.
  const emailReal = email && email.trim() ? email.trim() : null;
  const authEmail = emailReal || `${cedulaNorm}@cedula.temp`;

  try {
    const userRecord = await admin.auth().createUser({
      email: authEmail,
      password,
      displayName: nombre,
      disabled: false,
    });

    const userData = {
      uid: userRecord.uid,
      nombre,
      email: authEmail,
      telefono,
      rol,
      cedula: cedulaNorm,
      registrationCount: 0,
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection("users").doc(userRecord.uid).set(userData);

    // Datos del perfil de simpatizante (mismos campos que el form de simpatizante).
    const perfilSimpatizante = {
      nombre,
      cedula: cedulaNorm,
      email: authEmail,
      telefono,
      direccion: direccion || "",
      zona: zona || "",
      sector: sector || "",
      subsector: subsector || "",
      recinto: recinto || "",
      provincia: provincia || "",
      municipio: municipio || "",
      colegioElectoral: colegioElectoral || "",
    };

    // Perfil de simpatizante vinculado (colecciones separadas, unidas por cédula/UID).
    // Regla (Fase 3): si la cédula YA existe en simpatizantes, no se crea otro doc,
    // solo se vincula por usuarioId. Si no existe, se crea el perfil ya vinculado.
    const simpRef = admin.firestore().collection("simpatizantes");
    const existing = await simpRef.where("cedula", "==", cedulaNorm).get();
    if (existing.empty) {
      await simpRef.add({
        ...perfilSimpatizante,
        usuarioId: userRecord.uid,
        registradoPor: "Admin Console",
        esUsuarioInterno: true,
        fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Ya existe: vincular por UID y completar datos (merge, sin duplicar).
      await existing.docs[0].ref.set(
        {
          ...perfilSimpatizante,
          usuarioId: userRecord.uid,
          esUsuarioInterno: true,
        },
        { merge: true }
      );
    }

    // Correo de bienvenida SOLO si hay email real (no al sintético @cedula.temp).
    // Además se AÍSLA: si Resend falla, el usuario YA quedó creado y no debe
    // hacer fallar toda la operación ni aparentar que el usuario no se creó.
    let emailSent = false;
    if (emailReal) {
      try {
        await sendUserWelcomeEmail(emailReal, nombre, rol);
        emailSent = true;
      } catch (mailError) {
        logger.error(
          `Usuario ${emailReal} creado OK, pero falló el correo de bienvenida:`,
          mailError
        );
      }
    }

    return {
      success: true,
      uid: userRecord.uid,
      emailSent,
      message: emailReal
        ? emailSent
          ? "Usuario creado y correo de bienvenida enviado."
          : "Usuario creado. El correo de bienvenida no pudo enviarse."
        : "Usuario creado (sin email; podrá iniciar sesión con su cédula).",
    };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

// =========================================================================
// 6. HELPERS: BÚSQUEDAS (Login y Padrón)
// =========================================================================

// Buscar Email por Cédula
exports.getEmailByCedula = onCall(async (request) => {
  const { cedula } = request.data;
  if (!cedula) throw new HttpsError("invalid-argument", "Cédula requerida.");

  try {
    const usersRef = admin.firestore().collection("users");
    // Las cédulas se guardan normalizadas (solo dígitos), así que consultamos
    // con el valor normalizado.
    const cedulaNorm = normalizarCedula(cedula);
    let query = await usersRef.where("cedula", "==", cedulaNorm).limit(1).get();

    // Respaldo: registros antiguos que hayan quedado con guiones.
    if (query.empty) {
      query = await usersRef.where("cedula", "==", cedula).limit(1).get();
    }

    if (!query.empty)
      return { success: true, email: query.docs[0].data().email };

    return { success: false, message: "Cédula no encontrada." };
  } catch (error) {
    throw new HttpsError("internal", "Error buscando usuario.");
  }
});

// Buscar Votante (Directo por ID)
// =========================================================================
// FUNCIÓN CORREGIDA: BÚSQUEDA EXACTA SEGÚN TUS LOGS
// =========================================================================
exports.searchVotanteByCedula = onCall(async (request) => {
  const { cedula } = request.data;
  if (!cedula) throw new HttpsError("invalid-argument", "Cédula requerida.");

  try {
    const db = admin.firestore();
    const votantesRef = db.collection("votantes");

    // 1. Limpieza: Probamos ambos formatos (con y sin guiones)
    const cedulaLimpia = cedula.replace(/-/g, ""); // 00100000000
    const cedulaGuiones = cedulaLimpia.replace(
      /^(\d{3})(\d{7})(\d{1})$/,
      "$1-$2-$3"
    ); // 001-0000000-0

    // Intento 1: Buscar con guiones (Lo más probable según tu DB)
    let docSnap = await votantesRef.doc(cedulaGuiones).get();

    // Intento 2: Buscar sin guiones (Respaldo)
    if (!docSnap.exists) {
      docSnap = await votantesRef.doc(cedulaLimpia).get();
    }

    if (docSnap.exists) {
      const data = docSnap.data();

      // ¡AQUÍ ESTABA EL ERROR!
      // Tu base de datos ya tiene el campo 'nombre' listo. No hay que inventar.

      return {
        found: true,
        data: {
          // Leemos 'nombre' directamente del log que me mostraste
          nombre: data.nombre || data.NOMBRE || "NOMBRE NO REGISTRADO",

          telefono: data.telefono || data.TELEFONO || "",
          direccion: data.direccion || data.DIRECCION || "",

          // En tu log el colegio viene en el campo 'origen'
          colegioElectoral: data.origen || data.ORIGEN || data.colegio || "",

          // Estos campos quizás no estén en ese documento específico, los dejamos opcionales
          sector: data.sector || data.SECTOR || "",
          municipio: data.municipio || data.MUNICIPIO || "",
          provincia: data.provincia || data.PROVINCIA || "",
          recinto: data.recinto || data.RECINTO || "",
        },
      };
    }

    return { found: false };
  } catch (error) {
    logger.error("[ERROR] Fallo en búsqueda:", error);
    return { found: false };
  }
});

// =========================================================================
// 7. REGISTRO Y COMUNICACIÓN
// =========================================================================

exports.registerSimpatizante = onCall(async (request) => {
  const data = request.data;
  if (!data.cedula) throw new HttpsError("invalid-argument", "Falta cédula");

  // Estándar: cédula SOLO dígitos. Normalizamos ANTES de consultar y guardar,
  // para que el chequeo de duplicado funcione sin importar el formato de entrada.
  const cedulaNorm = normalizarCedula(data.cedula);
  if (cedulaNorm.length !== 11) {
    throw new HttpsError("invalid-argument", "La cédula debe tener 11 dígitos.");
  }

  const db = admin.firestore();
  const simpRef = db.collection("simpatizantes");

  try {
    // Vínculo con usuario: si la cédula pertenece a un usuario, guardamos su UID.
    const userSnap = await db
      .collection("users")
      .where("cedula", "==", cedulaNorm)
      .limit(1)
      .get();
    const usuarioId = userSnap.empty ? null : userSnap.docs[0].id;

    // Campos derivados/normalizados comunes.
    const payload = {
      ...data,
      cedula: cedulaNorm,
      ubicacion:
        data.lat && data.lng
          ? new admin.firestore.GeoPoint(data.lat, data.lng)
          : null,
    };
    if (usuarioId) payload.usuarioId = usuarioId;

    // ¿Ya existe un simpatizante con esta cédula?
    const dup = await simpRef.where("cedula", "==", cedulaNorm).get();

    if (!dup.empty) {
      // Ya registrado: actualizamos sus datos (sin duplicar, conservando
      // fechaRegistro y sin re-contar el registro del activista).
      await dup.docs[0].ref.set(payload, { merge: true });
      return {
        success: true,
        updated: true,
        message: "Usuario ya registrado, se actualizarán los datos.",
      };
    }

    // No existe: creamos el perfil (vinculado si corresponde).
    await simpRef.add({
      ...payload,
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, message: "Registro exitoso." };
  } catch (error) {
    logger.error("Error registro:", error);
    throw new HttpsError("internal", "Error al guardar.");
  }
});

// =========================================================================
// 7. CORREOS ELECTRÓNICOS CON RESEND
// =========================================================================

// Función auxiliar para inicializar Resend
const getResendClient = () => {
  if (!resendClient) {
    resendClient = new Resend(resendApiKey.value());
  }
  return resendClient;
};

// Función para enviar correo de bienvenida a simpatizantes
const sendSimpatizanteWelcomeEmail = async (email, nombre, additionalData = {}) => {
  try {
    const resend = getResendClient();
    const htmlContent = getSimpatizanteWelcomeTemplate(nombre, additionalData);
    
    const result = await resend.emails.send({
      from: 'Félix Encarnación <notificaciones@felixencarnacion.com>',
      to: [email],
      subject: '¡Bienvenido al movimiento FE28! 🇩🇴',
      html: htmlContent,
    });
    
    logger.info(`Correo de bienvenida enviado a simpatizante: ${email}`, { messageId: result.id });
    return result;
  } catch (error) {
    logger.error(`Error enviando correo a simpatizante ${email}:`, error);
    throw error;
  }
};

// Función para enviar correo de bienvenida a usuarios registrados
const sendUserWelcomeEmail = async (email, nombre, rol = 'multiplicador') => {
  try {
    const resend = getResendClient();
    const htmlContent = getUserWelcomeTemplate(nombre, email, rol);
    
    const result = await resend.emails.send({
      from: 'Félix Encarnación <notificaciones@felixencarnacion.com>',
      to: [email],
      subject: '¡Bienvenido al equipo FE28! 🚀',
      html: htmlContent,
    });
    
    logger.info(`Correo de bienvenida enviado a usuario: ${email}`, { messageId: result.id });
    return result;
  } catch (error) {
    logger.error(`Error enviando correo a usuario ${email}:`, error);
    throw error;
  }
};

// Trigger: Enviar correo de bienvenida cuando se registra un simpatizante
exports.sendWelcomeEmailToSimpatizante = onDocumentCreated(
  { 
    document: "simpatizantes/{docId}", 
    secrets: [resendApiKey] 
  },
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.email) {
      logger.info("Simpatizante sin email, no se envía correo");
      return;
    }

    const nombre = data.nombre || "Simpatizante";
    
    try {
      await sendSimpatizanteWelcomeEmail(data.email, nombre, {
        provincia: data.provincia,
        municipio: data.municipio,
        sector: data.sector,
        registradoPor: data.registradoPor
      });
    } catch (error) {
      logger.error("Error en trigger de correo para simpatizante:", error);
    }
  }
);

// Trigger: Enviar correo de bienvenida cuando se crea un usuario
exports.sendWelcomeEmailToUser = onDocumentCreated(
  { 
    document: "users/{userId}", 
    secrets: [resendApiKey] 
  },
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.email) {
      logger.info("Usuario sin email, no se envía correo");
      return;
    }

    // Solo enviar si no es un registro automático de Google/Apple
    // (esos ya se manejan en el auth trigger)
    if (data.metodoRegistro === "google" || data.metodoRegistro === "apple") {
      logger.info("Usuario de proveedor externo, correo ya enviado en auth trigger");
      return;
    }

    const nombre = data.nombre || "Usuario";
    const rol = data.rol || "multiplicador";
    
    try {
      await sendUserWelcomeEmail(data.email, nombre, rol);
    } catch (error) {
      logger.error("Error en trigger de correo para usuario:", error);
    }
  }
);

// Función callable para enviar correos personalizados
exports.sendCustomEmail = onCall(
  { secrets: [resendApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes estar autenticado.");
    }

    const { to, subject, template, data } = request.data;
    
    if (!to || !subject || !template) {
      throw new HttpsError("invalid-argument", "Faltan parámetros requeridos.");
    }

    try {
      const resend = getResendClient();
      let htmlContent;

      switch (template) {
        case 'simpatizante_welcome':
          htmlContent = getSimpatizanteWelcomeTemplate(data.nombre, data);
          break;
        case 'user_welcome':
          htmlContent = getUserWelcomeTemplate(data.nombre, data.email, data.rol);
          break;
        case 'password_reset':
          htmlContent = getPasswordResetTemplate(data.nombre, data.resetLink);
          break;
        case 'goal_notification':
          htmlContent = getGoalNotificationTemplate(data.nombre, data.meta, data.progreso);
          break;
        default:
          throw new HttpsError("invalid-argument", "Plantilla no válida.");
      }

      const result = await resend.emails.send({
        from: 'Félix Encarnación <notificaciones@felixencarnacion.com>',
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: htmlContent,
      });

      return { success: true, messageId: result.id };
    } catch (error) {
      logger.error("Error enviando correo personalizado:", error);
      throw new HttpsError("internal", "Error enviando correo.");
    }
  }
);


// ... (MANTÉN TUS IMPORTS Y CONFIGURACIONES ANTERIORES ARRIBA) ...
````
