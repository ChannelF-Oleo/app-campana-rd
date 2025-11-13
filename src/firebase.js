// Importa las funciones que necesitas de los SDKs que necesitas
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Al principio, con las otras importaciones de firebase
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};

// TODO: Agrega la configuración de tu SDK de Firebase
// La configuración de tu app web de Firebase

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios que necesitarás en otras partes de la aplicación
export const auth = getAuth(app);
export const db = getFirestore(app);
