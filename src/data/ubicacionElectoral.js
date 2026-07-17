import zonas from "./zonas.json";
import sectores from "./sectores.json";

/** Última opción de los selectores cuando no se puede ubicar al simpatizante. */
export const OPCION_NO_IDENTIFICADO = "No identificado";

/** Zona y sector fijos por ahora (a la espera de poblar el resto). */
export const ZONA_FIJA = "ZONA N";
export const SECTOR_FIJO = "Hato Nuevo";

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

/** Devuelve los subsectores de un sector dentro de una zona. */
export function getSubsectores(zona, sector) {
  const z = sectores.find((item) => item.zona === zona);
  if (!z) return [];
  const s = z.sectores.find((item) => item.sector === sector);
  if (!s) return [];
  return s.subsectores;
}
