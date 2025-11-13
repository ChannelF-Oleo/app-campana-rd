import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
// ❌ 1. ELIMINAMOS la importación fallida.
// import * as serviceWorkerRegistration from "./service-worker";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// --- 2. REGISTRO NATIVO DEL SERVICE WORKER ---
// Solo registra el SW en el entorno de producción para evitar problemas de caché en desarrollo.
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Asegúrate de que la ruta sea correcta. En CRA, se asume que el SW se copia a la raíz ('/').
    const swUrl = `/service-worker.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("Service Worker registrado:", registration.scope);
      })
      .catch((error) => {
        console.error("Fallo el registro de Service Worker:", error);
      });
  });
}
