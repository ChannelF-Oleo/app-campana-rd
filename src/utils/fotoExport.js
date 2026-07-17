import { ref, getBytes } from "firebase/storage";
import { storage } from "../firebase";

// Máximo lado (px) de la foto redimensionada antes de exportar. Mantiene el
// archivo final (PDF/Excel) pequeño sin degradar demasiado la miniatura.
const MAX_LADO = 240;
// Calidad JPEG al recomprimir en el canvas.
const JPEG_QUALITY = 0.8;

/**
 * Réplica de la lógica de rutas de src/components/ui/AvatarFoto.js.
 *
 * Las fotos en Storage pueden estar nombradas SIN guiones (00112345678.jpg)
 * o CON guiones (001-1234567-8.jpg). Reconstruimos ambos formatos desde los
 * dígitos y probamos.
 *
 * ORDEN IMPORTANTE — SIN guiones PRIMERO: las fotos NUEVAS (cámara, correctas)
 * se suben con la cédula normalizada; las VIEJAS del padrón (frecuentemente de
 * otra persona) están con guiones y quedan solo como respaldo.
 *
 * @param {string} cedula
 * @returns {string[]} 8 rutas candidatas en Storage.
 */
export function getPathsToTry(cedula) {
  if (!cedula) return [];

  const digitos = String(cedula).replace(/\D/g, "");
  const cedulaSinGuiones = digitos;
  const cedulaConGuiones =
    digitos.length === 11
      ? `${digitos.slice(0, 3)}-${digitos.slice(3, 10)}-${digitos.slice(10)}`
      : String(cedula);

  return [
    `votantes_fotos/${cedulaSinGuiones}.jpg`,
    `votantes_fotos/${cedulaSinGuiones}.JPG`,
    `votantes_fotos/${cedulaSinGuiones}.jpeg`,
    `votantes_fotos/${cedulaSinGuiones}.png`,
    `votantes_fotos/${cedulaConGuiones}.jpg`,
    `votantes_fotos/${cedulaConGuiones}.JPG`,
    `votantes_fotos/${cedulaConGuiones}.jpeg`,
    `votantes_fotos/${cedulaConGuiones}.png`,
  ];
}

/**
 * Lee un blob como data URL base64 usando FileReader.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Carga una imagen desde una data URL en un elemento <img>.
 * @param {string} dataUrl
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo decodificar la imagen"));
    img.src = dataUrl;
  });
}

/**
 * Redimensiona una imagen a MAX_LADO en el lado mayor y la recomprime como
 * JPEG para no inflar el archivo final. Si algo falla, devuelve el original.
 * @param {string} dataUrl
 * @returns {Promise<{ dataUrl: string, width: number, height: number, mime: string }>}
 */
async function redimensionar(dataUrl) {
  const img = await loadImage(dataUrl);
  const { naturalWidth: w0, naturalHeight: h0 } = img;

  const escala = Math.min(1, MAX_LADO / Math.max(w0, h0));
  const width = Math.max(1, Math.round(w0 * escala));
  const height = Math.max(1, Math.round(h0 * escala));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
    width,
    height,
    mime: "image/jpeg",
  };
}

/**
 * Deriva el mime de una ruta a partir de su extensión.
 * @param {string} path
 * @returns {string}
 */
function mimePorExtension(path) {
  const ext = path.split(".").pop().toLowerCase();
  if (ext === "png") return "image/png";
  return "image/jpeg"; // jpg / JPG / jpeg
}

/**
 * Descarga la foto de una cédula desde Storage como base64.
 *
 * Prueba las rutas candidatas en orden, se queda con la primera que exista,
 * y lee sus bytes con getBytes() del SDK de Storage (petición autenticada por
 * el SDK, NO un fetch() directo). Esto evita el bloqueo CORS que sí afecta a
 * fetch(downloadURL) — motivo por el que antes las fotos salían como
 * placeholder gris en el PDF/Excel. Con getBytes el canvas tampoco queda
 * "tainted" porque los bytes no entran como recurso remoto cross-origin.
 *
 * Luego redimensiona/recomprime por canvas igual que antes y devuelve un
 * objeto { dataUrl, width, height, mime }, o null si ninguna ruta existe.
 *
 * @param {string} cedula
 * @returns {Promise<{ dataUrl: string, width: number, height: number, mime: string } | null>}
 */
export async function fetchFotoBase64(cedula) {
  const paths = getPathsToTry(cedula);

  for (const path of paths) {
    try {
      const bytes = await getBytes(ref(storage, path));
      // [DIAG] Ruta que SÍ existe y de la que leímos bytes.
      console.log(
        `[fotoExport][${cedula}] getBytes OK -> ${path} (${bytes.byteLength} bytes)`
      );

      const mime = mimePorExtension(path);
      const blob = new Blob([bytes], { type: mime });
      const dataUrl = await blobToDataUrl(blob);
      // [DIAG] dataUrl original (prefijo + longitud).
      console.log(
        `[fotoExport][${cedula}] dataUrl original prefijo="${String(
          dataUrl
        ).slice(0, 32)}" len=${dataUrl ? dataUrl.length : 0}`
      );

      try {
        const res = await redimensionar(dataUrl);
        // [DIAG] dataUrl tras canvas (prefijo + longitud + dimensiones).
        console.log(
          `[fotoExport][${cedula}] canvas dataUrl prefijo="${String(
            res.dataUrl
          ).slice(0, 32)}" len=${
            res.dataUrl ? res.dataUrl.length : 0
          } ${res.width}x${res.height} mime=${res.mime}`
        );
        return res;
      } catch (canvasErr) {
        // [DIAG] El canvas falló (no debería con getBytes; sería un bug real).
        console.error(
          `[fotoExport][${cedula}] redimensionar/canvas LANZÓ:`,
          canvasErr && canvasErr.name,
          canvasErr && canvasErr.message,
          canvasErr
        );
        // Si el redimensionado falla, devolvemos el original sin dimensiones.
        return { dataUrl, width: null, height: null, mime };
      }
    } catch (err) {
      // [DIAG] getBytes falló (404 objeto inexistente u otro). Ruidoso a
      // propósito para ver cuántas rutas se descartan por cédula.
      console.warn(
        `[fotoExport][${cedula}] getBytes FALLÓ en ${path}:`,
        err && err.code ? err.code : err && err.message
      );
    }
  }

  // [DIAG] Ninguna ruta produjo foto -> placeholder (persona sin foto real).
  console.warn(
    `[fotoExport][${cedula}] RESULTADO null (todas las rutas fallaron)`
  );
  return null;
}

/**
 * Descarga las fotos de un array de personas con concurrencia limitada.
 *
 * No falla en bloque si una foto falla: cada resultado es independiente.
 *
 * @param {Array<{ cedula: string }>} personas
 * @param {{ concurrency?: number, onProgress?: (hechos: number, total: number) => void }} [opts]
 * @returns {Promise<Map<string, ({ dataUrl, width, height, mime } | null)>>}
 *          Map cedula -> resultado de fetchFotoBase64 (o null).
 */
export async function fetchFotosBatch(
  personas,
  { concurrency = 6, onProgress } = {}
) {
  const resultado = new Map();
  const lista = Array.isArray(personas) ? personas : [];
  const total = lista.length;
  let hechos = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < lista.length) {
      const index = cursor++;
      const persona = lista[index];
      const cedula = persona && persona.cedula;

      let foto = null;
      if (cedula) {
        try {
          foto = await fetchFotoBase64(cedula);
        } catch {
          foto = null;
        }
        resultado.set(cedula, foto);
      }

      hechos++;
      if (typeof onProgress === "function") onProgress(hechos, total);
    }
  };

  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, lista.length || 1)) },
    () => worker()
  );
  await Promise.all(workers);

  return resultado;
}
