// =============================================================================
// CONSTANTES CENTRALIZADAS — app-campana-rd
// Importar desde aquí para evitar duplicación en los componentes.
// =============================================================================

// --- Roles de Usuario ---
export const ROLES_DISPONIBLES = ["admin", "lider de zona", "multiplicador"];

export const ROL_ADMIN = "admin";
export const ROL_LIDER = "lider de zona";
export const ROL_MULTIPLICADOR = "multiplicador";

// --- Colecciones de Firestore ---
export const COLECCION_USERS = "users";
export const COLECCION_SIMPATIZANTES = "simpatizantes";
export const COLECCION_ORGANIGRAMA = "organigrama";

// --- Configuración de Paginación ---
export const USUARIOS_POR_PAGINA = 20;
export const SIMPATIZANTES_POR_PAGINA = 25;

// --- Meta del Padrón Electoral (también en .env como REACT_APP_PADRON_META) ---
export const TOTAL_PADRON_META =
  parseInt(process.env.REACT_APP_PADRON_META, 10) || 244000;

// --- Ubicación Fija (SDO) ---
export const PROVINCIA_FIJA = "Santo Domingo";
export const MUNICIPIO_FIJO = "Santo Domingo Oeste";

// --- Configuración de Storage ---
export const STORAGE_FOTOS_PATH = "votantes_fotos";

// --- Validaciones de Cédula ---
export const CEDULA_REGEX = /^\d{3}-?\d{7}-?\d{1}$/;
export const CEDULA_LONGITUD = 11;

// --- Coordenadas iniciales del mapa (Santo Domingo) ---
export const MAP_INITIAL_CENTER = { lat: 18.4861, lng: -69.9309 };
export const MAP_DEFAULT_ZOOM = 12;
