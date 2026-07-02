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
    const doc = await userRef.get();
    if (!doc.exists) {
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
      
      await userRef.set(userData);
      logger.info(`Perfil creado automáticamente para: ${userRecord.email}`);
      
      // Enviar correo de bienvenida para usuario registrado
      if (userRecord.email) {
        await sendUserWelcomeEmail(
          userRecord.email,
          userData.nombre,
          userData.rol
        );
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
  const { nombre, email, password, rol, cedula } = request.data;

  if (!nombre || !email || !password || !rol || !cedula) {
    throw new HttpsError("invalid-argument", "Datos incompletos.");
  }

  // Estándar: cédula SOLO dígitos en Firestore.
  const cedulaNorm = normalizarCedula(cedula);
  if (cedulaNorm.length !== 11) {
    throw new HttpsError("invalid-argument", "La cédula debe tener 11 dígitos.");
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre,
      disabled: false,
    });

    const userData = {
      uid: userRecord.uid,
      nombre,
      email,
      rol,
      cedula: cedulaNorm,
      registrationCount: 0,
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection("users").doc(userRecord.uid).set(userData);

    // Perfil de simpatizante vinculado (colecciones separadas, unidas por cédula/UID).
    // Regla (Fase 3): si la cédula YA existe en simpatizantes, no se crea otro doc,
    // solo se vincula por usuarioId. Si no existe, se crea el perfil ya vinculado.
    const simpRef = admin.firestore().collection("simpatizantes");
    const existing = await simpRef.where("cedula", "==", cedulaNorm).get();
    if (existing.empty) {
      await simpRef.add({
        nombre,
        cedula: cedulaNorm,
        email,
        usuarioId: userRecord.uid,
        registradoPor: "Admin Console",
        esUsuarioInterno: true,
        fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
        provincia: "N/A",
        municipio: "N/A",
        sector: "N/A",
        direccion: "N/A",
      });
    } else {
      // Ya existe: solo vincular por UID (sin duplicar).
      await existing.docs[0].ref.update({
        usuarioId: userRecord.uid,
        esUsuarioInterno: true,
      });
    }

    // Enviar correo de bienvenida para usuario creado por admin
    await sendUserWelcomeEmail(email, nombre, rol);

    return { success: true };
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

// Agrega este import específico si no lo tenías
const { onDocumentWritten } = require("firebase-functions/v2/firestore");

// Importar el archivo de zonas (Asegúrate de haberlo pegado en la carpeta functions)
const zonasData = require("./zonas.json");

// =========================================================================
// 8. TRIGGER: ASIGNACIÓN AUTOMÁTICA DE ZONA Y RECINTO
// =========================================================================
exports.asignarZonaYRecinto = onDocumentWritten("simpatizantes/{docId}", async (event) => {
  // Si el documento se borró, no hacemos nada
  if (!event.data.after.exists) return;

  const newData = event.data.after.data();
  const oldData = event.data.before.exists ? event.data.before.data() : null;
  
  const colegio = newData.colegioElectoral;

  // Si no hay colegio, o si el colegio no ha cambiado y ya tiene zona, salimos
  // (Esto evita bucles infinitos de escritura)
  if (!colegio) return;
  if (oldData && oldData.colegioElectoral === colegio && newData.zona) return;

  // Normalizamos el colegio buscado (quitamos extensiones si vienen del padrón antiguo)
  // Ej: "1234.xlsx" -> "1234", "0012" -> "12"
  const colegioBuscado = String(colegio).replace(/(\.pdf|\.xlsx|\.xls)/gi, "").trim();

  let zonaEncontrada = "Sin Asignar";
  let recintoEncontrado = "Desconocido";

  // Algoritmo de Búsqueda en el JSON
  // Recorremos Zonas -> Centros -> Padrones
  outerLoop:
  for (const z of zonasData) {
    for (const centro of z.centros) {
      // Buscamos si el colegio está en la lista de padrones de este centro
      const match = centro.padrones.some(padronFile => {
        // Limpiamos el nombre del archivo en el JSON también
        const padronLimpio = padronFile.replace(/(\.pdf|\.xlsx|\.xls)/gi, "").trim();
        // Comparamos exacto o si está contenido (para casos como 0025 vs 25)
        return padronLimpio === colegioBuscado || padronLimpio === colegioBuscado.padStart(4, '0');
      });

      if (match) {
        zonaEncontrada = z.zona; // Ej: "ZONA A"
        recintoEncontrado = centro.nombre; // Ej: "00305 - ESC. PRIM..."
        break outerLoop; // ¡Lo encontramos! Dejamos de buscar.
      }
    }
  }

  // Si encontramos datos nuevos, actualizamos el documento
  if (zonaEncontrada !== newData.zona || recintoEncontrado !== newData.recinto) {
    logger.info(`Asignando ${colegioBuscado} -> ${zonaEncontrada} | ${recintoEncontrado}`);
    return event.data.after.ref.update({
      zona: zonaEncontrada,
      recinto: recintoEncontrado,
      zonaAutoasignada: true // Marca de auditoría
    });
  }
});

