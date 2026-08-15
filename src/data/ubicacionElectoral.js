import zonas from "./zonas.json";
import sectores from "./sectores.json";

/** Última opción de los selectores cuando no se puede ubicar al simpatizante. */
export const OPCION_NO_IDENTIFICADO = "No identificado";

/**
 * Valor CENTINELA (solo UI) de la opción "Otro" de un desplegable de ubicación
 * (Sector, Subsector, Recinto o Colegio). Nunca se guarda en el payload: cuando
 * está activa, el valor efectivo del campo es el texto libre que el usuario
 * escribe (normalizado con normalizarUbicacion al enviar).
 */
export const OPCION_OTRO = "__OTRO__";

/**
 * Normaliza un valor de ubicación escrito a mano al estilo del catálogo: sin
 * espacios sobrantes (trim + colapso de espacios internos) y en MAYÚSCULAS.
 * Se usa para los cuatro campos con opción "Otro" (sector, subsector, recinto,
 * colegio electoral).
 * @param {string} str
 * @returns {string}
 */
export function normalizarUbicacion(str) {
  return String(str || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/**
 * @deprecated Usa {@link normalizarUbicacion}. Alias conservado por
 * compatibilidad con importaciones existentes.
 */
export const normalizarSubsector = normalizarUbicacion;

/** Todas las zonas de zonas.json, ordenadas alfabéticamente. */
export const LISTA_ZONAS = zonas
  .map((z) => z.zona)
  .sort((a, b) => a.localeCompare(b));

/** Devuelve los nombres de los centros/recintos de una zona. */
export function getRecintos(zona) {
  const z = zonas.find((item) => item.zona === zona);
  if (!z) return [];
  return z.centros.map((c) => c.nombre);
}

/**
 * Devuelve los colegios (padrones) de un recinto, limpiando la extensión
 * de archivo (ej. "1221.pdf" -> "1221").
 */
export function getColegios(zona, recinto) {
  const z = zonas.find((item) => item.zona === zona);
  if (!z) return [];
  const centro = z.centros.find((c) => c.nombre === recinto);
  if (!centro) return [];
  return centro.padrones.map((p) =>
    p.replace(/(\.pdf|\.xlsx|\.xls)/gi, "").trim()
  );
}

/** Devuelve los sectores de una zona según sectores.json. */
export function getSectores(zona) {
  const z = sectores.find((item) => item.zona === zona);
  if (!z) return [];
  return z.sectores.map((s) => s.sector);
}

/**
 * Niveles inferiores cuyo catálogo depende de cada nivel de la cascada. El
 * Subsector cuelga de Zona+Sector y el Colegio de Zona+Recinto, por eso Zona
 * arrastra a los cuatro.
 */
const DEPENDIENTES_UBICACION = {
  zona: ["sector", "subsector", "recinto", "colegioElectoral"],
  sector: ["subsector"],
  recinto: ["colegioElectoral"],
};

/**
 * Aplica el cambio de un campo de la cascada de ubicación sobre el estado
 * previo, reseteando (valor y flag "Otro") los niveles inferiores que dependen
 * de él. `campo` puede ser un nivel ("sector") o su flag ("sectorEsOtro"); zona
 * no tiene flag porque es un catálogo cerrado, sin opción "Otro".
 * @param {object} prev estado previo de la ubicación
 * @param {string} campo campo que cambia
 * @param {string|boolean} valor nuevo valor del campo
 * @returns {object} nuevo estado de la ubicación
 */
export function aplicarCambioUbicacion(prev, campo, valor) {
  const next = { ...prev, [campo]: valor };
  const nivel = campo.replace(/EsOtro$/, "");
  // Teclear el texto libre de un nivel en "Otro" no cambia ningún catálogo (no
  // hay match posible), así que no se resetean sus dependientes en cada tecla:
  // ya se resetearon al activar la opción "Otro". Zona nunca entra aquí (no
  // admite "Otro"): elegir zona siempre resetea sus cuatro dependientes.
  const editandoTextoLibre = campo === nivel && prev[`${nivel}EsOtro`];
  if (!editandoTextoLibre) {
    for (const dep of DEPENDIENTES_UBICACION[nivel] || []) {
      next[dep] = "";
      next[`${dep}EsOtro`] = false;
    }
  }
  return next;
}

/** Devuelve los subsectores de un sector dentro de una zona. */
export function getSubsectores(zona, sector) {
  const z = sectores.find((item) => item.zona === zona);
  if (!z) return [];
  const s = z.sectores.find((item) => item.sector === sector);
  if (!s) return [];
  return s.subsectores;
}
