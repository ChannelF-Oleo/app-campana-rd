/* eslint-disable no-restricted-globals */

// Asegúrate de que todas estas funciones se importan desde 'workbox-precache'
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precache';
import { clientsClaim } from 'workbox-core';

// Si usaste mis ejemplos, asegúrate de que estas también están:
import { ExpirationPlugin } from 'workbox-expiration';
import { registerRoute } from 'workbox-routing'; // ¡Esta línea faltaba o estaba incompleta!
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// ... el resto del código (incluyendo precacheAndRoute(self.__WB_MANIFEST); )

/* eslint-disable no-restricted-globals */
// ^ ESTO DESACTIVA LA REGLA SOLO PARA ESTE ARCHIVO, anulando el conflicto de 'google'.
precacheAndRoute(self.__WB_MANIFEST);

// Nombre de la caché estática
const CACHE_NAME = "campaign-cache-v1";

// Recursos esenciales que se precachean (la base de tu app)
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

// Activación: Limpiar cachés antiguas
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
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("Service Worker: Deleting old cache: " + cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Tomar control de las páginas no controladas
  );
});

// Fetch: Estrategia de Cache-First para recursos en caché (modo offline)
self.addEventListener("fetch", (event) => {
  // Solo interceptamos peticiones GET (para evitar problemas con POST/PUT)
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
        // Si la red falla Y estamos offline, podemos devolver una página de fallback
        // Aquí solo devolveremos un error genérico, se podría añadir un cache.match('/offline.html')
        console.error(
          "Fetch failed: Network error during fetch. App may be offline.",
          error
        );
        // Si la petición es para un documento HTML (ej: la ruta principal), devuelve la página offline de fallback si existiera.
        // Para un manejo offline completo, se recomienda usar una biblioteca como Workbox (ver nota).
      });
    })
  );
});
