// Importa las funciones que necesitas de los SDKs
// Importa las funciones que necesitas de los SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions"; // Añadido getFunctions
import { getStorage } from "firebase/storage";

// Configuración de Firebase usando las variables de entorno
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error(
    "FIREBASE WARNING: La clave de API de Firebase no se cargó correctamente desde .env."
  );
}

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios de autenticación y base de datos
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

if (!firebaseConfig.storageBucket) {
  console.error("FIREBASE ERROR: Falta configurar REACT_APP_FIREBASE_STORAGE_BUCKET en el archivo .env");
}
export const storage = getStorage(app);


// Exporta la app de firebase
export default app;
