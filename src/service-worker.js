/* eslint-disable no-restricted-globals */

// Importaciones de Workbox (CRUCIALES para el build)
// Se usa workbox-precaching y workbox-core (que contiene clientsClaim, aunque se usa nativo).
import { precacheAndRoute } from "workbox-precaching";

// 🌟 PUNTO DE INYECCIÓN DE MANIFIESTO 🌟
// El Webpack plugin inyectará aquí la lista de archivos estáticos.
precacheAndRoute(self.__WB_MANIFEST || []);

// Nombre de la caché estática
const CACHE_NAME = "campaign-cache-v1";

// Recursos esenciales para precache manual (la base de tu app)
const urlsToCache = [
  "/", // Importante para la navegación de la raíz
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  // Si usas assets específicos en la raíz, añádelos aquí.
];

// Instalación: Cargar los archivos esenciales en la caché
self.addEventListener("install", (event) => {
  console.log(
    "Service Worker: Install event triggered. Caching essential assets."
  );
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Ignoramos el error si no se puede cachear algún recurso (como un archivo grande)
        return cache.addAll(urlsToCache).catch((error) => {
          console.error("Error adding URLs to cache:", error);
        });
      })
      // Forzar la activación del nuevo SW inmediatamente
      .then(() => self.skipWaiting())
  );
});

// Activación: Limpiar cachés antiguas y reclamar clientes (resuelve array-callback-return)
self.addEventListener("activate", (event) => {
  console.log(
    "Service Worker: Activate event triggered. Cleaning up old caches."
  );
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          // Se asegura que el .map siempre devuelve algo (sea un Promise o null)
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("Service Worker: Deleting old cache: " + cacheName);
              return caches.delete(cacheName);
            }
            // RETURN: Caso en que el nombre está en la whitelist (no se hace nada)
            return null;
          })
        );
      })
      .then(() => self.clients.claim()) // Tomar control de las páginas no controladas
  );
});

// Fetch: Estrategia de Cache-First para recursos en caché (modo offline)
self.addEventListener("fetch", (event) => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== "GET") {
    return;
  }

  // Permite que el SW no intercepte peticiones de extensiones o CORS no necesarias
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - devolver respuesta en caché
      if (response) {
        console.log("[Cache] Serving:", event.request.url);
        return response;
      }

      // Si no está en caché, ir a la red
      console.log("[Network] Fetching:", event.request.url);
      return fetch(event.request).catch((error) => {
        console.error(
          "Fetch failed: Network error during fetch. App may be offline.",
          error
        );
      });
    })
  );
});
