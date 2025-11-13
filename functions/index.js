// Importa las funciones y parámetros necesarios
const functions = require("firebase-functions"); // Necesario para config (por ahora)
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https"); // Para Callable Functions
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Inicializa el SDK de Admin
admin.initializeApp();

// Define los secretos que la función de correo necesita
const gmailEmail = defineSecret("GMAIL_EMAIL");
const gmailPassword = defineSecret("GMAIL_PASSWORD");

exports.createUserAdmin = onCall(
  { enforceAppCheck: false },
  async (request) => {
    // 1. Verificar que quien llama es un Administrador
    // if (!request.auth || !request.auth.token.admin) { // Necesitarás configurar custom claims para esto
    //   throw new HttpsError('permission-denied', 'Solo los administradores pueden crear usuarios.');
    // }

    // Incluir 'cedula' en la desestructuración de request.data
    const { nombre, email, password, rol, cedula } = request.data;

    // 2. Validar datos de entrada (ahora incluyendo cédula)
    if (
      !nombre ||
      !email ||
      !password ||
      !rol ||
      !cedula ||
      password.length < 6
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Faltan datos requeridos (nombre, email, cédula, password) o la contraseña es muy corta."
      );
    }
    if (!["multiplicador", "lider de zona", "admin"].includes(rol)) {
      throw new HttpsError("invalid-argument", "El rol asignado no es válido.");
    }

    try {
      // 3. Crear usuario con el Admin SDK
      logger.info(`Admin creando usuario: ${email} con rol ${rol}`);
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: nombre,
        disabled: false,
      });

      // 4. Crear el perfil del usuario en Firestore (users collection)
      await admin.firestore().collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        nombre: nombre,
        email: email,
        rol: rol,
        cedula: cedula, // Guardar el campo cedula en Firestore
        // Puedes añadir goal por defecto aquí si quieres
        // goal: { amount: 50, period: 'mensual' }
      });

      // INICIO DE MODIFICACIÓN: REGISTRO EN SIMPATIZANTES
      // 5. Añadir/Verificar el registro en la colección "simpatizantes"
      const simpatizantesRef = admin.firestore().collection("simpatizantes");
      const sympathizerQuery = simpatizantesRef.where("cedula", "==", cedula);

      const querySnapshot = await sympathizerQuery.get();

      if (querySnapshot.empty) {
        // Si no existe, lo creamos para que cuente en las estadísticas
        logger.info(
          `Simpatizante no encontrado para cédula ${cedula}. Creando registro de usuario interno.`
        );

        await simpatizantesRef.add({
          nombre: nombre,
          cedula: cedula,
          email: email,
          telefono: null,
          // Usamos marcadores de posición para campos geográficos que no se recolectan en este formulario
          provincia: "N/A (Usuario Interno)",
          municipio: "N/A (Usuario Interno)",
          sector: "N/A (Usuario Interno)",
          direccion: "N/A (Usuario Interno)",
          colegioElectoral: null,
          fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
          registradoPor: "Creación Admin",
          // Usamos el UID o email del usuario administrador que ejecuta la función (si request.auth está configurado)
          registradoPorEmail:
            request.auth?.token?.email || "System/Admin Console",
          // Campo de utilidad para identificar que es un usuario administrativo/multiplicador
          esUsuarioInterno: true,
          rolInterno: rol,
        });
      } else {
        // Si ya existe, simplemente registramos que ya estaba
        logger.info(
          `Simpatizante con cédula ${cedula} ya existe. No se creó un registro duplicado.`
        );
        // Opcional: Podrías actualizar el campo 'rolInterno' o 'esUsuarioInterno' aquí si lo deseas
      }
      // FIN DE MODIFICACIÓN

      logger.info(
        `Usuario ${userRecord.uid} (${email}) creado exitosamente por admin y registro de simpatizante verificado.`
      );
      return {
        success: true,
        message: `Usuario "${nombre}" creado exitosamente.`,
      };
    } catch (error) {
      logger.error(`Error al crear usuario ${email} por admin:`, error);
      let clientMessage = "Ocurrió un error interno al crear el usuario.";
      if (error.code === "auth/email-already-exists") {
        clientMessage = "El correo electrónico ya está en uso por otra cuenta.";
      } else if (error.code === "auth/invalid-password") {
        clientMessage = "La contraseña no cumple los requisitos de Firebase.";
      }
      // Devolver un error específico al cliente
      throw new HttpsError("unknown", clientMessage, error.message);
    }
  }
);

// --- Nueva Callable Function para Registrar Simpatizante (sin cambios) ---
exports.registerSimpatizante = onCall(async (request) => {
  // Obtenemos los datos enviados desde el frontend (React)
  const data = request.data;
  const cedula = data.cedula; // Asumimos que viene formateada 000-0000000-0

  // Validaciones básicas de entrada
  if (
    !cedula ||
    !data.nombre ||
    !data.email ||
    !data.provincia ||
    !data.municipio ||
    !data.sector
  ) {
    logger.error("registerSimpatizante: Faltan datos requeridos.", data);
    throw new HttpsError(
      "invalid-argument",
      "Faltan datos requeridos (nombre, email, cédula, provincia, municipio, sector)."
    );
  }

  const simpatizantesRef = admin.firestore().collection("simpatizantes");
  // Buscamos si ya existe alguien con esa cédula
  const q = simpatizantesRef.where("cedula", "==", cedula);

  try {
    const querySnapshot = await q.get();

    // Si la consulta NO está vacía, significa que ya existe
    if (!querySnapshot.empty) {
      logger.warn(
        `registerSimpatizante: Intento de registro duplicado para cédula ${cedula}.`
      );
      // Devolvemos un objeto indicando que falló por duplicado
      return {
        success: false,
        message: `La cédula ${cedula} ya se encuentra registrada en nuestra base de datos.`,
      };
    }

    // --- Si la Cédula es Única, Creamos el Documento ---
    logger.log(`registerSimpatizante: Registrando nueva cédula ${cedula}.`);
    const docRef = await simpatizantesRef.add({
      nombre: data.nombre,
      cedula: data.cedula, // Guardamos la cédula formateada
      email: data.email,
      telefono: data.telefono || null, // Guardar null si está vacío
      provincia: data.provincia,
      municipio: data.municipio,
      sector: data.sector,
      direccion: data.direccion || null,
      colegioElectoral: data.colegioElectoral || null,
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp(), // Usar fecha del servidor
      registradoPor: data.registradoPor || "Página Pública", // Usar datos pasados o por defecto
      registradoPorEmail: data.registradoPorEmail || null,
    });

    logger.log(
      `registerSimpatizante: Simpatizante ${docRef.id} (cédula: ${cedula}) registrado exitosamente.`
    );
    // Devolvemos éxito
    return {
      success: true,
      message: "¡Registro exitoso! Gracias por unirte a la campaña.",
    };
  } catch (error) {
    logger.error(
      `registerSimpatizante: Error procesando cédula ${cedula}:`,
      error
    );
    // Devolvemos un error genérico al frontend
    throw new HttpsError(
      "internal",
      "Ocurrió un error inesperado al procesar el registro. Por favor, inténtalo de nuevo."
    );
  }
});

// --- Función para Enviar Correo de Bienvenida (sin cambios en su lógica interna) ---
// Se activa cuando se crea un nuevo documento en 'simpatizantes'
exports.sendWelcomeEmail = onDocumentCreated(
  {
    document: "simpatizantes/{simpatizanteId}",
    secrets: [gmailEmail, gmailPassword],
  },
  (event) => {
    // Inicialización Perezosa
    const mailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value(),
      },
    });

    const snap = event.data;
    if (!snap) {
      logger.log("sendWelcomeEmail: No data.");
      return null;
    }
    const newSimpatizante = snap.data();
    const email = newSimpatizante?.email;
    const name = newSimpatizante?.nombre || "Nuevo Miembro";

    if (!email) {
      logger.error(
        "sendWelcomeEmail: Email no encontrado:",
        event.params.simpatizanteId
      );
      return null;
    }

    const mailOptions = {
      from: `"App Campaña RD" <${gmailEmail.value()}>`,
      to: email,
      subject: "¡Gracias por unirte a la campaña!",
      html: `<h1>¡Hola, ${name}!</h1><p>Agradecemos tu apoyo...</p><p><strong>El Equipo de Campaña</strong></p>`, // Mensaje abreviado
    };

    logger.info(`Enviando correo de bienvenida a: ${email}`);
    return mailTransport
      .sendMail(mailOptions)
      .then(() => logger.log(`Correo enviado a ${email}.`))
      .catch((error) =>
        logger.error(`Error al enviar correo a ${email}:`, error)
      );
  }
);
