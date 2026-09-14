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

/**
 * Reconstruye el ESTADO de la cascada (el que consume UbicacionElectoralFields)
 * a partir de los campos planos ya guardados de un documento (zona, sector,
 * subsector, recinto, colegioElectoral).
 *
 * Un valor guardado puede no existir en el catálogo: o se escribió con la opción
 * "Otro", o su nivel padre quedó fuera de catálogo y arrastra al hijo. En esos
 * casos se marca `<campo>EsOtro` para que el formulario lo muestre como texto
 * libre editable en vez de perderlo al abrir el modal.
 * @param {object} datos documento con los campos de ubicación
 * @returns {object} estado de la cascada
 */
export function estadoUbicacionDesdeDatos(datos = {}) {
  const val = (campo) => String(datos[campo] || "").trim();
  const zona = val("zona");
  const sector = val("sector");
  const subsector = val("subsector");
  const recinto = val("recinto");
  const colegioElectoral = val("colegioElectoral");

  // Un valor es "Otro" si tiene contenido, no es "No identificado" y no aparece
  // en el catálogo de su nivel (lista vacía cuando el padre ya está fuera de él).
  const esOtro = (valor, catalogo) =>
    !!valor && valor !== OPCION_NO_IDENTIFICADO && !catalogo.includes(valor);

  const sectorEsOtro = esOtro(sector, getSectores(zona));
  const recintoEsOtro = esOtro(recinto, getRecintos(zona));
  return {
    zona,
    sector,
    sectorEsOtro,
    subsector: subsector,
    subsectorEsOtro: esOtro(
      subsector,
      sectorEsOtro ? [] : getSubsectores(zona, sector)
    ),
    recinto,
    recintoEsOtro,
    colegioElectoral,
    colegioElectoralEsOtro: esOtro(
      colegioElectoral,
      recintoEsOtro ? [] : getColegios(zona, recinto)
    ),
  };
}

/** Estado inicial de la cascada: vacía, se elige desde Zona. */
export const UBICACION_INICIAL = {
  zona: "",
  sector: "",
  sectorEsOtro: false,
  subsector: "",
  subsectorEsOtro: false,
  recinto: "",
  recintoEsOtro: false,
  colegioElectoral: "",
  colegioElectoralEsOtro: false,
};

/**
 * Campos de ubicación con opción "Otro" (texto libre); zona queda fuera porque
 * es un catálogo cerrado. El label se usa en la notificación de validación
 * cuando el texto queda vacío.
 */
export const CAMPOS_UBICACION_OTRO = [
  { campo: "sector", label: "el sector" },
  { campo: "subsector", label: "el subsector" },
  { campo: "recinto", label: "el recinto" },
  { campo: "colegioElectoral", label: "el colegio electoral" },
];

/** Convierte "No identificado" en cadena vacía para el payload. */
export const limpiarUbicacion = (valor) =>
  valor === OPCION_NO_IDENTIFICADO ? "" : valor;

/**
 * Valor final de un campo de ubicación hacia el payload: texto normalizado si la
 * opción activa es "Otro"; "" si es "No identificado"; el valor del catálogo en
 * otro caso.
 */
export const valorUbicacionFinal = (ubicacion, campo) =>
  ubicacion[`${campo}EsOtro`]
    ? normalizarUbicacion(ubicacion[campo])
    : limpiarUbicacion(ubicacion[campo]);

/**
 * Valida la cascada completa antes de enviar. Devuelve el mensaje de error o
 * null si es válida. Reglas:
 *   - un campo en "Otro" no puede quedar con el texto libre vacío;
 *   - los cinco niveles deben tener valor;
 *   - la ZONA es obligatoria de verdad: debe ser una de las 27 del catálogo,
 *     "No identificado" no vale (sin zona real no hay analítica ni asignación).
 * @param {object} ubicacion estado de la cascada
 * @returns {string|null}
 */
export function validarUbicacion(ubicacion) {
  for (const { campo, label } of CAMPOS_UBICACION_OTRO) {
    if (ubicacion[`${campo}EsOtro`] && !normalizarUbicacion(ubicacion[campo])) {
      return `Escribe ${label}`;
    }
  }
  if (!ubicacion.zona || ubicacion.zona === OPCION_NO_IDENTIFICADO) {
    return "La zona es obligatoria: selecciona una zona electoral.";
  }
  if (
    !ubicacion.sector ||
    !ubicacion.subsector ||
    !ubicacion.recinto ||
    !ubicacion.colegioElectoral
  ) {
    return "Por favor, completa la ubicación electoral (zona, sector, subsector, recinto y colegio).";
  }
  return null;
}
