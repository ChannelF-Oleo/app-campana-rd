// Compresión/redimensionado de imágenes EN EL NAVEGADOR antes de subir a
// Storage. Las fotos vienen de cámara profesional (varios MB), lo que hacía
// lentísimo el export a PDF (~43s por imagen) y la carga de ManageUsers.
//
// JUSTIFICACIÓN DE PARÁMETROS:
// - maxLado = 1000px: cubre de sobra el lightbox a pantalla completa y la
//   ficha del PDF (~30mm ≈ 350px a 300dpi) con margen; subir más resolución no
//   aporta nada visible en esos usos.
// - calidad = 0.82: a 1000px es visualmente indistinguible del original.
// - Resultado típico: ~150-300KB por foto, frente a los varios MB de origen.

/**
 * Carga un File de imagen respetando la orientación EXIF cuando el navegador
 * lo soporta (createImageBitmap con imageOrientation: "from-image"). Si no,
 * cae a un <img>, que en navegadores modernos ya auto-orienta imágenes.
 *
 * @param {File|Blob} file
 * @returns {Promise<{ draw: CanvasImageSource, width: number, height: number, close: () => void }>}
 */
async function cargarImagen(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        draw: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close && bitmap.close(),
      };
    } catch {
      // Algunos navegadores no soportan la opción imageOrientation: caemos
      // al método <img> más abajo.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("No se pudo decodificar la imagen"));
      el.src = url;
    });
    return {
      draw: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Comprime y redimensiona una imagen en el cliente.
 *
 * Mantiene la proporción de modo que el lado MAYOR no exceda `maxLado` (no
 * agranda si ya es menor). Exporta JPEG con la `calidad` dada.
 *
 * Si el archivo no es imagen o algo falla, devuelve el original como fallback
 * (con un warning), para no bloquear nunca la subida.
 *
 * @param {File} file
 * @param {{ maxLado?: number, calidad?: number }} [opts]
 * @returns {Promise<Blob|File>} Blob JPEG comprimido (o el file original si falla).
 */
export async function comprimirImagen(
  file,
  { maxLado = 1000, calidad = 0.82 } = {}
) {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    console.warn(
      "[comprimirImagen] El archivo no es una imagen; se sube sin procesar.",
      file && file.type
    );
    return file;
  }

  let imagen;
  try {
    imagen = await cargarImagen(file);
    const { draw, width: w0, height: h0 } = imagen;

    const escala = Math.min(1, maxLado / Math.max(w0, h0)); // nunca > 1
    const width = Math.max(1, Math.round(w0 * escala));
    const height = Math.max(1, Math.round(h0 * escala));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(draw, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", calidad)
    );

    if (!blob) {
      console.warn(
        "[comprimirImagen] canvas.toBlob devolvió null; se sube el original."
      );
      return file;
    }
    return blob;
  } catch (err) {
    console.warn(
      "[comprimirImagen] Falló la compresión; se sube el original.",
      err && err.message
    );
    return file;
  } finally {
    if (imagen && imagen.close) imagen.close();
  }
}
