// Cache de módulo COMPARTIDO para la resolución de fotos de Storage.
//
// Clave: cédula normalizada (solo dígitos, para que "001-1234567-8" y
// "00112345678" compartan entrada). Valor: Promise<url|null>.
//
// Cachea también los NEGATIVOS (Promise que resuelve a null): cuando una
// persona no tiene foto, evitamos repetir el sondeo de hasta 8 rutas cada vez
// que su avatar re-entra al viewport (lazy-load) o que se re-exporta.
//
// PARCHE temporal: cuando exista `fotoPath` en Firestore (Fase D) ya no habrá
// sondeo que cachear y este módulo podrá retirarse.

const cache = new Map();

const normalizar = (cedula) => String(cedula || "").replace(/\D/g, "");

/**
 * @param {string} cedula
 * @returns {Promise<string|null>|undefined} promesa cacheada, o undefined si
 *          esa cédula aún no se resolvió en esta sesión.
 */
export function get(cedula) {
  return cache.get(normalizar(cedula));
}

/**
 * Guarda la promesa de resolución de una cédula.
 * @param {string} cedula
 * @param {Promise<string|null>} promise
 * @returns {Promise<string|null>} la misma promesa (para encadenar).
 */
export function set(cedula, promise) {
  cache.set(normalizar(cedula), promise);
  return promise;
}

/** Vacía el cache (opcional; útil tras subir/actualizar fotos). */
export function clear() {
  cache.clear();
}
