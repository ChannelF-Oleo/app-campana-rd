import { jsPDF } from "jspdf";
import { fetchFotosBatch } from "./fotoExport";

// ------------------------------------------------------------------
// Geometría del layout (todo en mm sobre A4 vertical: 210 x 297).
// ------------------------------------------------------------------
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12; // margen exterior de la página
const HEADER_H = 16; // alto reservado para el encabezado
const FOOTER_H = 10; // alto reservado para el pie
const COLS = 2; // fichas por fila
const COL_GAP = 6; // separación horizontal entre columnas
const ROW_GAP = 5; // separación vertical entre filas
const CARD_H = 38; // alto de cada ficha
const CARD_PAD = 3; // padding interno de la ficha
const FOTO_SIZE = 30; // lado de la foto (mm)

// Color del borde suave de la ficha y del placeholder.
const BORDE = 210; // gris claro (0-255)
const PLACEHOLDER_BG = 224;
const PLACEHOLDER_FG = 120;

// Ancho útil y ancho de columna derivados de los márgenes.
const CONTENT_W = PAGE_W - MARGIN * 2;
const CARD_W = (CONTENT_W - COL_GAP * (COLS - 1)) / COLS;

// Área vertical disponible para fichas dentro de una página.
const GRID_TOP = MARGIN + HEADER_H;
const GRID_BOTTOM = PAGE_H - MARGIN - FOOTER_H;
const ROWS_PER_PAGE = Math.max(
  1,
  Math.floor((GRID_BOTTOM - GRID_TOP + ROW_GAP) / (CARD_H + ROW_GAP))
);
const CARDS_PER_PAGE = ROWS_PER_PAGE * COLS;

/**
 * Fecha de generación en formato dd/mm/aaaa hh:mm (es-DO).
 * @returns {string}
 */
function fechaGeneracion() {
  const d = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(
    d.getHours()
  )}:${dos(d.getMinutes())}`;
}

/**
 * Corta un texto para que quepa en un ancho dado, añadiendo "…" si sobra.
 * @param {jsPDF} doc
 * @param {string} texto
 * @param {number} maxW ancho máximo en mm
 * @returns {string}
 */
function truncar(doc, texto, maxW) {
  const str = texto == null ? "" : String(texto);
  if (doc.getTextWidth(str) <= maxW) return str;
  let recorte = str;
  while (recorte.length > 1 && doc.getTextWidth(recorte + "…") > maxW) {
    recorte = recorte.slice(0, -1);
  }
  return recorte + "…";
}

/**
 * Dibuja el encabezado (título + fecha) de la página actual.
 * @param {jsPDF} doc
 * @param {string} titulo
 * @param {string} fecha
 */
function dibujarEncabezado(doc, titulo, fecha) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text(titulo || "Padrón", MARGIN, MARGIN + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generado: ${fecha}`, PAGE_W - MARGIN, MARGIN + 6, {
    align: "right",
  });

  // Línea separadora bajo el encabezado.
  doc.setDrawColor(BORDE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, GRID_TOP - 4, PAGE_W - MARGIN, GRID_TOP - 4);
}

/**
 * Dibuja el pie con la numeración de página.
 * @param {jsPDF} doc
 * @param {number} pagina 1-indexado
 * @param {number} totalPaginas
 */
function dibujarPie(doc, pagina, totalPaginas) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    `Página ${pagina} de ${totalPaginas}`,
    PAGE_W / 2,
    PAGE_H - MARGIN,
    { align: "center" }
  );
}

/**
 * Dibuja el placeholder gris con la inicial del nombre cuando no hay foto.
 * @param {jsPDF} doc
 * @param {number} x
 * @param {number} y
 * @param {string} nombre
 */
function dibujarPlaceholderFoto(doc, x, y, nombre) {
  doc.setFillColor(PLACEHOLDER_BG);
  doc.setDrawColor(BORDE);
  doc.setLineWidth(0.2);
  doc.rect(x, y, FOTO_SIZE, FOTO_SIZE, "FD");

  const inicial = nombre ? String(nombre).trim().charAt(0).toUpperCase() : "?";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(PLACEHOLDER_FG);
  doc.text(inicial, x + FOTO_SIZE / 2, y + FOTO_SIZE / 2 + 5, {
    align: "center",
  });
}

/**
 * Dibuja una ficha (recuadro con foto + datos) en la posición indicada.
 * @param {jsPDF} doc
 * @param {number} x esquina superior izquierda de la ficha
 * @param {number} y
 * @param {object} persona
 * @param {Array<{label: string, key: string}>} campos
 * @param {{dataUrl: string} | null} foto
 */
function dibujarFicha(doc, x, y, persona, campos, foto) {
  // Recuadro con borde suave.
  doc.setDrawColor(BORDE);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, CARD_W, CARD_H, 1.5, 1.5, "S");

  const fotoX = x + CARD_PAD;
  const fotoY = y + (CARD_H - FOTO_SIZE) / 2;

  if (foto && foto.dataUrl) {
    try {
      doc.addImage(foto.dataUrl, "JPEG", fotoX, fotoY, FOTO_SIZE, FOTO_SIZE);
      // Borde fino sobre la foto para separarla del fondo blanco.
      doc.setDrawColor(BORDE);
      doc.setLineWidth(0.2);
      doc.rect(fotoX, fotoY, FOTO_SIZE, FOTO_SIZE, "S");
    } catch {
      dibujarPlaceholderFoto(doc, fotoX, fotoY, persona.nombre);
    }
  } else {
    dibujarPlaceholderFoto(doc, fotoX, fotoY, persona.nombre);
  }

  // Zona de datos a la derecha de la foto.
  const datosX = fotoX + FOTO_SIZE + CARD_PAD;
  const datosW = x + CARD_W - CARD_PAD - datosX;
  let cursorY = y + CARD_PAD + 4;

  // Nombre en negrita.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20);
  const nombre = persona.nombre || persona.nombres || "—";
  doc.text(truncar(doc, nombre, datosW), datosX, cursorY);
  cursorY += 5;

  // Apodo (opcional): justo debajo del nombre. Solo si el registro lo trae;
  // si está vacío se omite la línea para no desperdiciar espacio en la ficha.
  const apodo = persona.apodo;
  if (apodo != null && String(apodo).trim() !== "") {
    doc.setFontSize(8);
    const etiqueta = "Apodo: ";
    doc.setFont("helvetica", "bold");
    doc.setTextColor(90);
    const etW = doc.getTextWidth(etiqueta);
    doc.text(etiqueta, datosX, cursorY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(40);
    doc.text(truncar(doc, String(apodo), datosW - etW), datosX + etW, cursorY);
    cursorY += 4;
  }

  // Campos label: valor.
  doc.setFontSize(8);
  for (const campo of campos || []) {
    const valorRaw = persona[campo.key];
    const valor =
      valorRaw === null || valorRaw === undefined || valorRaw === ""
        ? "—"
        : String(valorRaw);

    const etiqueta = `${campo.label}: `;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(90);
    const etW = doc.getTextWidth(etiqueta);
    doc.text(etiqueta, datosX, cursorY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(40);
    doc.text(truncar(doc, valor, datosW - etW), datosX + etW, cursorY);

    cursorY += 4;
    if (cursorY > y + CARD_H - CARD_PAD) break; // no desbordar la ficha
  }
}

/**
 * Genera y descarga un PDF tipo padrón: una ficha por persona (foto grande a
 * la izquierda, datos a la derecha) en grid de 2 columnas por página A4.
 *
 * @param {Array<object>} personas objetos ya normalizados (deben tener `cedula`).
 * @param {object} opts
 * @param {string} opts.titulo título del encabezado.
 * @param {Array<{label: string, key: string}>} opts.campos campos a mostrar por ficha.
 * @param {string} opts.fileName nombre del archivo a descargar.
 * @param {number} [opts.concurrency] concurrencia de descarga de fotos.
 * @param {(fase: string, hechos: number, total: number) => void} [opts.onProgress]
 *        progreso: fase "fotos" durante la descarga, "pdf" durante el dibujado.
 * @returns {Promise<void>}
 */
export async function generarPadronPDF(
  personas,
  { titulo, campos, fileName, concurrency = 6, onProgress } = {}
) {
  const lista = Array.isArray(personas) ? personas : [];
  const emitir = (fase, hechos, total) => {
    if (typeof onProgress === "function") onProgress(fase, hechos, total);
  };

  // 1) Descarga de fotos con progreso.
  const fotos = await fetchFotosBatch(lista, {
    concurrency,
    onProgress: (hechos, total) => emitir("fotos", hechos, total),
  });

  // 2) Dibujado del PDF.
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const fecha = fechaGeneracion();
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / CARDS_PER_PAGE));

  emitir("pdf", 0, total);

  for (let i = 0; i < total; i++) {
    const indiceEnPagina = i % CARDS_PER_PAGE;

    if (i > 0 && indiceEnPagina === 0) doc.addPage();

    if (indiceEnPagina === 0) {
      const pagina = Math.floor(i / CARDS_PER_PAGE) + 1;
      dibujarEncabezado(doc, titulo, fecha);
      dibujarPie(doc, pagina, totalPaginas);
    }

    const fila = Math.floor(indiceEnPagina / COLS);
    const col = indiceEnPagina % COLS;
    const x = MARGIN + col * (CARD_W + COL_GAP);
    const y = GRID_TOP + fila * (CARD_H + ROW_GAP);

    const persona = lista[i];
    const foto = persona ? fotos.get(persona.cedula) : null;
    dibujarFicha(doc, x, y, persona, campos, foto);

    emitir("pdf", i + 1, total);
  }

  // Si no hay personas, dejamos al menos el encabezado de la página vacía.
  if (total === 0) {
    dibujarEncabezado(doc, titulo, fecha);
    dibujarPie(doc, 1, 1);
  }

  doc.save(fileName || "padron.pdf");
}
