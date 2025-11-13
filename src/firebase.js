// Importa las funciones que necesitas de los SDKs que necesitas
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Al principio, con las otras importaciones de firebase
import { getFirestore } from "firebase/firestore";


// TODO: Agrega la configuración de tu SDK de Firebase
// La configuración de tu app web de Firebase

const firebaseConfig = {
  apiKey: "AIzaSyBE3sclY-MUR_ynZ5dOKlwhiWWFuhWoU48",
  authDomain: "politicard-cfd.firebaseapp.com",
  projectId: "politicard-cfd",
  storageBucket: "politicard-cfd.firebasestorage.app",
  messagingSenderId: "268987029077",
  appId: "1:268987029077:web:c7b800a18e9ea234a9e6dc",
  measurementId: "G-EB27HNVEQY"
};


// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios que necesitarás en otras partes de la aplicación
export const auth = getAuth(app);
export const db = getFirestore(app);
