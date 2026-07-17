import ExcelJS from "exceljs";
import { fetchFotosBatch } from "./fotoExport";

// ------------------------------------------------------------------
// NOTA DE RENDIMIENTO: este export descarga UNA imagen por persona desde
// Firebase Storage (vía fetchFotosBatch) y la embebe en la hoja. Para muchos
// registros el proceso puede tardar; la concurrencia de descarga la controla
// fetchFotosBatch (opción `concurrency`). El callback onProgress permite
// mostrar "Generando Excel... X/Y" mientras se bajan las fotos.
// ------------------------------------------------------------------

// Tamaño de la miniatura embebida, en px.
const FOTO_PX = 56;
// Alto de fila en puntos (~ FOTO_PX + margen). ExcelJS usa puntos para height.
const ROW_HEIGHT = 46;
// Ancho de la columna de foto en "caracteres" de Excel (≈ FOTO_PX / 7).
const FOTO_COL_WIDTH = 10;
// Pequeño margen (px) para centrar la foto dentro de la celda.
const FOTO_OFFSET = 3;

// Bordes suaves reutilizados en todas las celdas.
const BORDE_SUAVE = {
  top: { style: "thin", color: { argb: "FFE0E0E0" } },
  left: { style: "thin", color: { argb: "FFE0E0E0" } },
  bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
  right: { style: "thin", color: { argb: "FFE0E0E0" } },
};

/**
 * Extrae el base64 puro y la extensión de una data URL.
 * @param {string} dataUrl p.ej. "data:image/jpeg;base64,...."
 * @returns {{ base64: string, extension: "jpeg"|"png" } | null}
 */
function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const coma = dataUrl.indexOf(",");
  if (coma === -1) return null;
  const meta = dataUrl.slice(0, coma);
  const base64 = dataUrl.slice(coma + 1);
  const extension = /png/i.test(meta) ? "png" : "jpeg";
  return { base64, extension };
}

/**
 * Dispara la descarga de un ArrayBuffer como archivo .xlsx usando un <a> con
 * URL.createObjectURL (no dependemos de file-saver).
 * @param {ArrayBuffer} buffer
 * @param {string} fileName
 */
function descargarBuffer(buffer, fileName) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "export.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera y descarga un Excel (.xlsx) con la foto de cada persona embebida en
 * la primera columna.
 *
 * @param {Array<object>} personas objetos ya normalizados (deben tener `cedula`).
 * @param {object} opts
 * @param {string} opts.hojaNombre nombre de la hoja.
 * @param {Array<{header: string, key: string, width?: number}>} opts.columnas
 *        columnas de datos (la columna "Foto" se antepone automáticamente).
 * @param {string} opts.fileName nombre del archivo a descargar.
 * @param {number} [opts.concurrency] concurrencia de descarga de fotos.
 * @param {(fase: string, hechos: number, total: number) => void} [opts.onProgress]
 *        progreso: fase "fotos" durante la descarga, "excel" durante el armado.
 * @returns {Promise<void>}
 */
export async function generarExcelConFoto(
  personas,
  { hojaNombre, columnas, fileName, concurrency = 6, onProgress } = {}
) {
  const lista = Array.isArray(personas) ? personas : [];
  const cols = Array.isArray(columnas) ? columnas : [];
  const emitir = (fase, hechos, total) => {
    if (typeof onProgress === "function") onProgress(fase, hechos, total);
  };

  // 1) Descarga de fotos con progreso.
  const fotos = await fetchFotosBatch(lista, {
    concurrency,
    onProgress: (hechos, total) => emitir("fotos", hechos, total),
  });

  // 2) Armado del workbook.
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(hojaNombre || "Datos");

  // La primera columna es "Foto"; el resto vienen de `columnas`.
  ws.columns = [
    { header: "Foto", key: "__foto__", width: FOTO_COL_WIDTH },
    ...cols.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width || 18,
    })),
  ];

  // Cabecera en negrita.
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.border = BORDE_SUAVE;
  });

  const total = lista.length;
  emitir("excel", 0, total);

  for (let i = 0; i < total; i++) {
    const persona = lista[i];
    const rowNumber = i + 2; // fila 1 = cabecera

    // Datos (fallback "N/A"). La celda de foto queda vacía; la imagen se ancla.
    const rowData = { __foto__: "" };
    for (const c of cols) {
      const v = persona ? persona[c.key] : undefined;
      rowData[c.key] = v === null || v === undefined || v === "" ? "N/A" : v;
    }
    const row = ws.getRow(rowNumber);
    row.values = rowData;
    row.height = ROW_HEIGHT;
    row.alignment = { vertical: "middle" };
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = BORDE_SUAVE;
    });

    // Foto embebida anclada a la celda de esta fila (columna 0).
    const foto = persona ? fotos.get(persona.cedula) : null;
    const parsed = foto ? parseDataUrl(foto.dataUrl) : null;
    if (parsed) {
      const imageId = workbook.addImage({
        base64: parsed.base64,
        extension: parsed.extension,
      });
      // Anclaje por offsets absolutos (en px) dentro de la celda de foto,
      // para controlar el tamaño exacto de la miniatura.
      ws.addImage(imageId, {
        tl: { col: 0, row: rowNumber - 1, offsetX: FOTO_OFFSET, offsetY: FOTO_OFFSET },
        ext: { width: FOTO_PX, height: FOTO_PX },
        editAs: "oneCell",
      });
    }

    emitir("excel", i + 1, total);
  }

  // 3) Descarga.
  const buffer = await workbook.xlsx.writeBuffer();
  descargarBuffer(buffer, fileName || "export.xlsx");
}
