// Importa las funciones que necesitas de los SDKs que necesitas
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Al principio, con las otras importaciones de firebase
import { getFirestore } from "firebase/firestore";

// TODO: Agrega la configuración de tu SDK de Firebase
// La configuración de tu app web de Firebase

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios que necesitarás en otras partes de la aplicación
export const auth = getAuth(app);
export const db = getFirestore(app);
