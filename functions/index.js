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
const nodemailer = require("nodemailer");

// Importación específica para Triggers de Auth (Aún usan v1)
const { user } = require("firebase-functions/v1/auth");

admin.initializeApp();

// Configuración Global (V2)
setGlobalOptions({
  region: "us-central1",
  memory: "512MiB",
  cors: true,
});

const gmailEmail = defineSecret("GMAIL_EMAIL");
const gmailPassword = defineSecret("GMAIL_PASSWORD");

// =========================================================================
// 1. AUTH TRIGGER: CREAR PERFIL AUTOMÁTICO (Google/Apple)
// =========================================================================
exports.createProfileForProvider = user().onCreate(async (userRecord) => {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(userRecord.uid);

  try {
    const doc = await userRef.get();
    if (!doc.exists) {
      await userRef.set({
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
      });
      logger.info(`Perfil creado automáticamente para: ${userRecord.email}`);
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
// 5. CALLABLE: CREAR USUARIO ADMIN (CreateUserAdmin)
// =========================================================================
exports.createUserAdmin = onCall(async (request) => {
  const { nombre, email, password, rol, cedula } = request.data;

  if (!nombre || !email || !password || !rol || !cedula) {
    throw new HttpsError("invalid-argument", "Datos incompletos.");
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre,
      disabled: false,
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      nombre,
      email,
      rol,
      cedula,
      registrationCount: 0,
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Espejo en Simpatizantes
    const simpRef = admin.firestore().collection("simpatizantes");
    const existing = await simpRef.where("cedula", "==", cedula).get();
    if (existing.empty) {
      await simpRef.add({
        nombre,
        cedula,
        email,
        registradoPor: "Admin Console",
        esUsuarioInterno: true,
        fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
        provincia: "N/A",
        municipio: "N/A",
        sector: "N/A",
        direccion: "N/A",
      });
    }

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
    // Intento 1: Directo
    let query = await usersRef.where("cedula", "==", cedula).limit(1).get();

    // Intento 2: Formateado
    if (query.empty) {
      const clean = cedula.replace(/-/g, "");
      const formatted = `${clean.slice(0, 3)}-${clean.slice(
        3,
        10
      )}-${clean.slice(10)}`;
      query = await usersRef.where("cedula", "==", formatted).limit(1).get();

      // Intento 3: Limpio
      if (query.empty) {
        query = await usersRef.where("cedula", "==", clean).limit(1).get();
      }
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

  const ref = admin.firestore().collection("simpatizantes");
  // Verificar duplicado (asumiendo formato consistente)
  const dup = await ref.where("cedula", "==", data.cedula).get();
  if (!dup.empty) return { success: false, message: "Ya registrado." };

  try {
    await ref.add({
      ...data,
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
      ubicacion:
        data.lat && data.lng
          ? new admin.firestore.GeoPoint(data.lat, data.lng)
          : null,
    });
    return { success: true, message: "Registro exitoso." };
  } catch (error) {
    logger.error("Error registro:", error);
    throw new HttpsError("internal", "Error al guardar.");
  }
});

exports.sendWelcomeEmail = onDocumentCreated(
  { document: "simpatizantes/{docId}", secrets: [gmailEmail, gmailPassword] },
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.email) return;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailEmail.value(), pass: gmailPassword.value() },
    });

    const nombreSimpatizante = data.nombre || "Simpatizante";
    const projectId = process.env.GCLOUD_PROJECT;
    const baseUrl = `https://${projectId}.web.app`;

    try {
      await transporter.sendMail({
        from: `"Félix Encarnación" <${gmailEmail.value()}>`,
        to: data.email,
        subject: "¡Bienvenido al equipo! 🇩🇴",
        html: getWelcomeHtml(nombreSimpatizante, baseUrl),
      });
      logger.info(`Email enviado a ${data.email}`);
    } catch (e) {
      logger.error(e);
    }
  }
);

// Plantilla HTML
const getWelcomeHtml = (nombre, baseUrl) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
  .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .header img { width: 100%; height: auto; display: block; }
  .content { padding: 40px 30px; color: #333333; line-height: 1.6; font-size: 16px; }
  .btn { display: inline-block; background-color: #004d99; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
  .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${baseUrl}/images/899dfce2a4eff0d9abc920e56e8f5748.png" alt="Cabecera">
    </div>
    <div class="content">
      <p><strong>Hola, ${nombre}:</strong></p>
      <p>¡Gracias por dar el paso y unirte a nuestra plataforma!</p>
      <p>Me llena de entusiasmo darte la bienvenida oficial. Tu registro es una señal clara de que compartimos el mismo deseo: ver a <strong>Santo Domingo Oeste</strong> desarrollarse de verdad.</p>
      <center>
        <a href="https://tucampana.com" class="btn">Visitar Portal Web</a>
      </center>
      <br>
      <p>Un fuerte abrazo,<br><strong>Felix Encarnación</strong><br>Tu Diputado | Santo Domingo Oeste</p>
    </div>
    <div class="header">
      <img src="${baseUrl}/images/d95804dd27a28dfe32433fa713acb0de.png" alt="Pie de página">
    </div>
    <div class="footer">
      <p>Recibiste este correo porque te registraste en nuestra plataforma.</p>
    </div>
  </div>
</body>
</html>
`;
