// Importa las funciones y parámetros necesarios
const functions = require("firebase-functions"); 
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https"); 
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { onSchedule } = require("firebase-functions/v2/scheduler"); 

// Inicializa el SDK de Admin
admin.initializeApp();

// Define los secretos que la función de correo necesita
const gmailEmail = defineSecret("GMAIL_EMAIL");
const gmailPassword = defineSecret("GMAIL_PASSWORD");

// 🆕 PARÁMETRO DE CONFIGURACIÓN DE INACTIVIDAD (8 horas en milisegundos)
const INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000; 

// --- CONFIGURACIÓN DE OPTIMIZACIÓN GLOBAL (B4) y FIX CORS ---
const DEFAULT_REGION = 'us-central1'; 
// APLICANDO CORRECCIÓN CORS: Añadimos cors: true para permitir llamadas desde localhost
const CALLABLE_OPTS = { region: DEFAULT_REGION, memory: '512MiB', cors: true }; 
const TRIGGER_OPTS = { region: DEFAULT_REGION };
// ----------------------------------------------------------------------

// =========================================================================
// FUNCIÓN PROGRAMADA: VENCIMIENTO DE SESIÓN POR INACTIVIDAD
// =========================================================================
exports.enforceInactivityTimeout = onSchedule(TRIGGER_OPTS, "0 1 * * *", async (event) => { // Aplicando TRIGGER_OPTS
    logger.info("Iniciando revisión de inactividad de usuarios...");
    const now = Date.now();
    let usersRevoked = 0;
    
    try {
        let nextPageToken;
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            nextPageToken = listUsersResult.pageToken;
            
            const inactiveUsers = listUsersResult.users.filter(user => {
                const lastSignIn = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).getTime() : 0;
                return lastSignIn > 0 && (now - lastSignIn) > INACTIVITY_TIMEOUT_MS;
            });
            
            for (const user of inactiveUsers) {
                await admin.auth().revokeRefreshTokens(user.uid);
                logger.log(`Tokens revocados para el usuario inactivo: ${user.email} (Última sesión: ${user.metadata.lastSignInTime})`);
                usersRevoked++;
            }
            
        } while (nextPageToken);

        logger.info(`Revisión de inactividad completada. Tokens revocados: ${usersRevoked}`);
        return null;
        
    } catch (error) {
        logger.error("Error al ejecutar la revisión de inactividad:", error);
        return null;
    }
});


// =========================================================================
// CALLABLE FUNCTION: CREAR USUARIO
// =========================================================================
exports.createUserAdmin = onCall(
    // Aplicando CALLABLE_OPTS
    { ...CALLABLE_OPTS, enforceAppCheck: false }, 
    async (request) => {
        // ... (cuerpo de la función mantenido)
        const { nombre, email, password, rol, cedula } = request.data;

        // 2. Validar datos de entrada
        if (
            !nombre || !email || !password || !rol || !cedula || password.length < 6
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
            // 3. Crear usuario en Auth
            logger.info(`Admin creando usuario: ${email} con rol ${rol}`);
            const userRecord = await admin.auth().createUser({
                email: email,
                password: password,
                displayName: nombre,
                disabled: false,
            });

            // 4. Crear el perfil del usuario en Firestore
            await admin.firestore().collection("users").doc(userRecord.uid).set({
                uid: userRecord.uid,
                nombre: nombre,
                email: email,
                rol: rol,
                cedula: cedula, 
            });

            // 5. Añadir/Verificar el registro en la colección "simpatizantes"
            const simpatizantesRef = admin.firestore().collection("simpatizantes");
            const sympathizerQuery = simpatizantesRef.where("cedula", "==", cedula);
            const querySnapshot = await sympathizerQuery.get();

            if (querySnapshot.empty) {
                logger.info(`Simpatizante no encontrado para cédula ${cedula}. Creando registro de usuario interno.`);
                await simpatizantesRef.add({
                    nombre: nombre,
                    cedula: cedula,
                    email: email,
                    telefono: null,
                    provincia: "N/A (Usuario Interno)",
                    municipio: "N/A (Usuario Interno)",
                    sector: "N/A (Usuario Interno)",
                    direccion: "N/A (Usuario Interno)",
                    colegioElectoral: null,
                    ubicacion: new admin.firestore.GeoPoint(18.4861, -69.9309),
                    lat: 18.4861,
                    lng: -69.9309,
                    fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
                    registradoPor: "Creación Admin",
                    registradoPorEmail: request.auth?.token?.email || "System/Admin Console",
                    esUsuarioInterno: true,
                    rolInterno: rol,
                });
            } else {
                logger.info(`Simpatizante con cédula ${cedula} ya existe. No se creó un registro duplicado.`);
            }

            logger.info(`Usuario ${userRecord.uid} (${email}) creado exitosamente por admin y registro de simpatizante verificado.`);
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
            throw new HttpsError("unknown", clientMessage, error.message);
        }
    }
);

// =========================================================================
// CALLABLE FUNCTION: ELIMINAR USUARIO
// =========================================================================
exports.deleteUserAndData = onCall(CALLABLE_OPTS, async (data, context) => { // Aplicando CALLABLE_OPTS
    const { uid } = data;

    // 1. VERIFICACIÓN DE AUTENTICACIÓN
    if (!context.auth) {
        throw new HttpsError('unauthenticated', 'Solo usuarios autentados pueden realizar esta acción.');
    }
    
    const callerUid = context.auth.uid;

    // 1a. Comprobar el rol de administrador
    try {
        const adminDoc = await admin.firestore().collection('users').doc(callerUid).get();
        const isAdmin = adminDoc.exists && adminDoc.data().rol === 'admin';
        
        if (!isAdmin) {
            throw new HttpsError('permission-denied', 'Acceso denegado. Solo administradores pueden eliminar usuarios.');
        }

    } catch (error) {
        logger.error('Error al verificar rol de administrador:', error);
        throw new HttpsError('internal', 'Fallo en la verificación de seguridad.', error.message);
    }

    if (!uid) {
        throw new HttpsError('invalid-argument', 'Falta el UID del usuario a eliminar.');
    }

    try {
        // 2. ELIMINAR LA CUENTA DE FIREBASE AUTH
        await admin.auth().deleteUser(uid);
        logger.info(`Cuenta de Auth eliminada para el UID: ${uid}`);

        // 3. ELIMINAR EL DOCUMENTO DE FIRESTORE
        await admin.firestore().collection('users').doc(uid).delete();
        logger.info(`Documento de Firestore eliminado para el UID: ${uid}`);

        return { success: true, message: 'Usuario y datos eliminados correctamente.' };

    } catch (error) {
        logger.error("Error al eliminar el usuario y datos:", error);

        if (error.code === 'auth/user-not-found') {
             return { success: true, message: 'El usuario de Auth no fue encontrado, se limpiaron los registros de Firestore.' };
        }
        
        throw new HttpsError('internal', 'Fallo la eliminación del usuario.', error.message);
    }
});


// =========================================================================
// CALLABLE FUNCTION: REGISTRAR SIMPATIZANTE
// =========================================================================
exports.registerSimpatizante = onCall(CALLABLE_OPTS, async (request) => { // Aplicando CALLABLE_OPTS
    // ... (cuerpo de la función mantenido)
    const data = request.data;
    const cedula = data.cedula; 
    
    const {
        nombre,
        email,
        telefono,
        direccion,
        colegioElectoral,
        provincia,
        municipio,
        sector,
        registradoPor,
        registradoPorEmail,
        lat, 
        lng, 
    } = data;

    if (
        !cedula ||
        !nombre ||
        !email ||
        !provincia ||
        !municipio ||
        !sector ||
        (lat !== 0 && !lat) ||
        (lng !== 0 && !lng)
    ) {
        logger.error(
            "registerSimpatizante: Faltan datos requeridos.",
            data
        );
        throw new HttpsError(
            "invalid-argument",
            "Faltan datos requeridos (nombre, email, cédula, provincia, municipio, sector, y coordenadas de ubicación)."
        );
    }

    const simpatizantesRef = admin.firestore().collection("simpatizantes");
    const q = simpatizantesRef.where("cedula", "==", cedula);

    try {
        const querySnapshot = await q.get();

        if (!querySnapshot.empty) {
            logger.warn(
                `registerSimpatizante: Intento de registro duplicado para cédula ${cedula}.`
            );
            return {
                success: false,
                message: `La cédula ${cedula} ya se encuentra registrada en nuestra base de datos.`,
            };
        }

        logger.log(`registerSimpatizante: Registrando nueva cédula ${cedula}.`);

        const ubicacionGeoPoint = new admin.firestore.GeoPoint(lat, lng);

        const docRef = await simpatizantesRef.add({
            nombre: nombre,
            cedula: cedula, 
            email: email,
            telefono: telefono || null, 
            provincia: provincia,
            municipio: municipio,
            sector: sector,
            direccion: direccion || null,
            colegioElectoral: colegioElectoral || null,

            ubicacion: ubicacionGeoPoint,
            lat: lat, 
            lng: lng, 

            fechaRegistro: admin.firestore.FieldValue.serverTimestamp(), 
            registradoPor: registradoPor || "Página Pública", 
            registradoPorEmail: registradoPorEmail || null,
        });

        logger.log(
            `registerSimpatizante: Simpatizante ${docRef.id} (cédula: ${cedula}) registrado exitosamente.`
        );
        return {
            success: true,
            message: "¡Registro exitoso! Gracias por unirte a la campaña.",
        };
    } catch (error) {
        logger.error(
            `registerSimpatizante: Error procesando cédula ${cedula}:`,
            error
        );
        throw new HttpsError(
            "internal",
            "Ocurrió un error inesperado al procesar el registro. Por favor, inténtalo de nuevo."
        );
    }
});

// =========================================================================
// CALLABLE FUNCTION: BUSCAR VOTANTE POR CÉDULA
// =========================================================================
exports.searchVotanteByCedula = onCall(CALLABLE_OPTS, async (request) => { // Aplicando CALLABLE_OPTS
    // ... (Lógica de validación y normalización de cédula) ...
    const cedula = request.data.cedula; 

    if (!cedula) {
        throw new HttpsError('invalid-argument', 'El campo "cedula" es requerido.');
    }

    const cedulaNormalizada = cedula.replace(/-/g, "");
    const votantesRef = admin.firestore().collection("votantes");
    
    try {
        const q = votantesRef.where("cedula", "==", cedulaNormalizada).limit(1);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            logger.log(`searchVotanteByCedula: Cédula ${cedulaNormalizada} no encontrada.`);
            return { found: false, data: {} };
        }

        const doc = querySnapshot.docs[0];
        const votanteData = doc.data();
        
        return {
            found: true,
            data: {
                nombre: votanteData.nombre || "",
                provincia: votanteData.provincia || "", // Se mantiene para consistencia, aunque frontend lo ignora
                municipio: votanteData.municipio || "", // Se mantiene para consistencia, aunque frontend lo ignora
                sector: votanteData.sector || "", 
                colegioElectoral: votanteData.colegioElectoral || "",
                email: "",
                telefono: "",
                direccion: "",
            }
        };

    } catch (error) {
        logger.error(`searchVotanteByCedula: Error buscando cédula ${cedulaNormalizada}:`, error);
        throw new HttpsError(
            "internal",
            "Ocurrió un error inesperado al buscar en la base de datos de votantes."
        );
    }
});


// =========================================================================
// FIRESTORE TRIGGER: ENVIAR CORREO (Mantenido)
// =========================================================================
exports.sendWelcomeEmail = onDocumentCreated(
    {
        document: "simpatizantes/{simpatizanteId}",
        secrets: [gmailEmail, gmailPassword],
        ...TRIGGER_OPTS, // Aplicando TRIGGER_OPTS
    },
    (event) => {
        // ... (cuerpo de la función mantenido)
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


// =========================================================================
// FIRESTORE TRIGGER: INCREMENTAR CONTADOR DE REGISTROS
// =========================================================================
exports.incrementUserRegistrationCount = onDocumentCreated(
    {
        document: "simpatizantes/{simpatizanteId}",
        ...TRIGGER_OPTS, // Aplicando TRIGGER_OPTS
    },
    async (event) => {
        const simpatizanteData = event.data.data();
        const activistUid = simpatizanteData.registradoPor; 

        if (!activistUid || activistUid.length < 20 || activistUid.includes(' ')) {
             // Ignorar registros de "Creación Admin" o "Página Pública" que no son UID válidos
            return null;
        }

        const userRef = admin.firestore().collection('users').doc(activistUid);

        try {
            await userRef.update({
                registrationsCount: admin.firestore.FieldValue.increment(1)
            });
            logger.info(`Contador incrementado para el usuario ${activistUid}.`);
            return null;
        } catch (error) {
            logger.error(`Error al incrementar el contador para ${activistUid}:`, error);
            return null;
        }
    }
);

