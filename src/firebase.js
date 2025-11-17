// Importa las funciones que necesitas de los SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions"; 

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
  // No lanzamos un error para que la aplicación no se bloquee.
}

console.log("DEBUG API Key (¿Undefined?):", firebaseConfig.apiKey);

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios de autenticación y base de datos
// Aquí es donde obtendrás el error de 'auth/invalid-api-key' si la clave está mal.
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Exporta la app de firebase
export default app;
