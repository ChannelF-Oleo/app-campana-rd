// Importa las funciones que necesitas de los SDKs
// Importa las funciones que necesitas de los SDKs
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Añadido onAuthStateChanged para initializeAuthAndGetUser
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions"; // Añadido getFunctions

// Configuración de Firebase usando las variables de entorno
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// =========================================================================
// ❗❗ LÍNEAS DE DIAGNÓSTICO ❗❗
// Comprobaremos si las claves se están leyendo como UNDEFINED o VACÍAS.
// =========================================================================
if (!firebaseConfig.apiKey) {
  console.error(
    "FIREBASE WARNING: La clave de API de Firebase no se cargó correctamente desde .env."
  );
}

console.log("DEBUG API Key (¿Undefined?):", firebaseConfig.apiKey);

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios de autenticación y base de datos
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); // Añadida exportación de functions

// NUEVA FUNCIÓN: initializeAuthAndGetUser (FIX para AuthContext.js)
// Retorna una promesa que resuelve el UID del usuario inicial (si no es anónimo)
export const initializeAuthAndGetUser = () => {
  return new Promise((resolve) => {
    // Escucha el primer cambio de estado de autenticación.
    // Esto es robusto para manejo de tokens persistentes.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Deja de escuchar después del primer evento
      // Resuelve con el UID si el usuario está presente y NO es anónimo
      resolve(user && !user.isAnonymous ? user.uid : null);
    });
  });
};


// Exporta la app de firebase
export default app;
