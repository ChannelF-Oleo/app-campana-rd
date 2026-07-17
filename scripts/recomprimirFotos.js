/**
 * Recompresión one-off de fotos crudas en Storage.
 * -------------------------------------------------
 * Las fotos subidas antes del fix de compresión en cliente están crudas
 * (varios MB), lo que hace lentísimo el export a PDF/Excel y la carga de las
 * listas. Este script recorre votantes_fotos/ en el bucket, y para cada imagen
 * grande la redimensiona (lado mayor 1000px, sin agrandar) y recomprime a JPEG
 * calidad 82 con sharp, SOBREESCRIBIENDO el mismo objeto.
 *
 * Corre del lado SERVIDOR con el Admin SDK (bajar/procesar/resubir cientos de
 * fotos en el navegador sería inviable).
 *
 * USO:
 *   node scripts/recomprimirFotos.js              # dry-run (por defecto, NO escribe)
 *   node scripts/recomprimirFotos.js --dry-run    # idem, explícito
 *   node scripts/recomprimirFotos.js --apply      # corrida REAL (sobreescribe)
 *
 * SEGURIDAD: la corrida real SOBREESCRIBE los originales, pero AUTOMÁTICAMENTE
 * respalda ANTES cada foto que va a tocar, copiándola dentro del mismo bucket a
 * backup_votantes_fotos_YYYYMMDD/{nombreRelativo}. El backup cubre SOLO las
 * fotos modificadas (no los ~225k objetos). Nunca sobreescribe sin backup
 * exitoso; si el backup falla para una foto, la salta. Es idempotente: si el
 * objeto de backup ya existe, no lo pisa. Ver README para revertir.
 *
 * Requiere la service account (gitignored) en la raíz del repo, o la ruta en
 * la env var GOOGLE_APPLICATION_CREDENTIALS / SERVICE_ACCOUNT.
 */

const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const sharp = require("sharp");

// ------------------------------ Config ------------------------------
const BUCKET = "politicard-cfd.firebasestorage.app";
const PREFIX = "votantes_fotos/";
const MAX_LADO = 1000; // lado mayor objetivo (px)
const CALIDAD = 82; // calidad JPEG
const UMBRAL_BYTES = 400 * 1024; // 400 KB: por debajo se considera ya optimizada
const CONCURRENCIA = 5;

const DEFAULT_SA = "politicard-cfd-firebase-adminsdk-fbsvc-0dfcb72afa.json";

// Carpeta de backup de ESTA corrida (una sola por ejecución, con su fecha).
const hoy = new Date();
const YYYYMMDD = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(
  2,
  "0"
)}${String(hoy.getDate()).padStart(2, "0")}`;
const BACKUP_PREFIX = `backup_votantes_fotos_${YYYYMMDD}/`;

// Nombre del objeto dentro de la carpeta de backup (sin el prefijo original,
// para que revertir sea copiar de vuelta a votantes_fotos/ directo).
const rutaBackup = (name) =>
  BACKUP_PREFIX + (name.startsWith(PREFIX) ? name.slice(PREFIX.length) : name);

// --------------------------- CLI flags ------------------------------
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
// Dry-run es el modo por defecto y seguro: solo escribe si se pasa --apply.
const DRY_RUN = !APPLY;

// ----------------------- Init Admin SDK -----------------------------
function resolverServiceAccount() {
  const env =
    process.env.SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const ruta = env
    ? path.resolve(env)
    : path.resolve(__dirname, "..", DEFAULT_SA);
  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(ruta);
}

initializeApp({
  credential: cert(resolverServiceAccount()),
  storageBucket: BUCKET,
});
const bucket = getStorage().bucket();

// ----------------------------- Helpers ------------------------------
const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(2);
const kb = (bytes) => Math.round(bytes / 1024);

/**
 * Copia el objeto original a la carpeta de backup de esta corrida, ANTES de
 * sobreescribirlo. Idempotente: si el backup ya existe, no lo pisa.
 * @returns {Promise<boolean>} true si el backup quedó garantizado.
 */
async function respaldar(name) {
  const destino = rutaBackup(name);
  const destFile = bucket.file(destino);
  const [existe] = await destFile.exists();
  if (existe) {
    console.log(`  backup ya existe -> ${destino}`);
    return true;
  }
  await bucket.file(name).copy(destFile);
  console.log(`  backup OK -> ${destino}`);
  return true;
}

/**
 * Procesa una foto CANDIDATA (ya pre-filtrada por tamaño >= UMBRAL_BYTES según
 * metadata, sin haber descargado). Descarga, comprueba dimensiones y, si hay
 * que recomprimir, PRIMERO respalda el original y solo entonces sobreescribe.
 * @returns {Promise<{ estado: string, antes: number, despues: number, backup: boolean }>}
 *   estado: "recomprimida" | "saltada" | "fallida_backup" | "fallida_recompresion"
 */
async function procesarFoto(file) {
  const name = file.name;
  let antes = 0;
  let despues = 0;

  // 1) Descarga + análisis + recompresión en memoria (aún NO escribe nada).
  let nuevo;
  try {
    const [buffer] = await file.download();
    antes = buffer.length;

    const meta = await sharp(buffer).metadata();
    const ladoMayor = Math.max(meta.width || 0, meta.height || 0);

    // Aunque pese >= umbral, si su lado mayor ya es <= 1000px está optimizada
    // en dimensiones: recomprimir no aportaría y evitamos degradar de más.
    if (ladoMayor <= MAX_LADO) {
      console.log(
        `  SALTA   ${name}  (${kb(antes)}KB, ${meta.width}x${meta.height}, lado<=${MAX_LADO})`
      );
      return { estado: "saltada", antes, despues: antes, backup: false };
    }

    // Recomprime: .rotate() aplica la orientación EXIF antes de redimensionar.
    nuevo = await sharp(buffer)
      .rotate()
      .resize({ width: MAX_LADO, height: MAX_LADO, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: CALIDAD })
      .toBuffer();
    despues = nuevo.length;
  } catch (err) {
    console.error(`  FALLA (recompresión) ${name}: ${err && err.message}`);
    return { estado: "fallida_recompresion", antes, despues: 0, backup: false };
  }

  if (DRY_RUN) {
    console.log(
      `  DRY     ${name}  backup -> ${rutaBackup(name)}  |  ${kb(antes)}KB -> ${kb(despues)}KB`
    );
    return { estado: "recomprimida", antes, despues, backup: true };
  }

  // 2) BACKUP primero. Si falla, NO se sobreescribe: se salta la foto.
  try {
    await respaldar(name);
  } catch (err) {
    console.error(`  FALLA (backup) ${name}: ${err && err.message}`);
    return { estado: "fallida_backup", antes, despues: 0, backup: false };
  }

  // 3) Solo con backup garantizado, sobreescribe el original.
  try {
    await bucket.file(name).save(nuevo, {
      contentType: "image/jpeg",
      resumable: false,
      metadata: { contentType: "image/jpeg" },
    });
    console.log(`  recomprimida ${name}  ${kb(antes)}KB -> ${kb(despues)}KB`);
    return { estado: "recomprimida", antes, despues, backup: true };
  } catch (err) {
    // El backup ya está a salvo, así que el original es recuperable.
    console.error(`  FALLA (recompresión) ${name}: ${err && err.message}`);
    return { estado: "fallida_recompresion", antes, despues: 0, backup: true };
  }
}

/** Ejecuta tareas con concurrencia limitada. */
async function conConcurrencia(items, limite, tarea) {
  const resultados = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      resultados[i] = await tarea(items[i]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limite, items.length || 1) }, worker)
  );
  return resultados;
}

// ------------------------------- Main -------------------------------
async function main() {
  console.log(
    `\n=== Recompresión de fotos — bucket ${BUCKET} prefijo ${PREFIX} ===`
  );
  console.log(
    DRY_RUN
      ? "MODO: DRY-RUN (no escribe nada). Usa --apply para la corrida real.\n"
      : "MODO: APPLY (SOBREESCRIBE los originales). Asegúrate de tener backup.\n"
  );

  // PRE-FILTRO POR METADATA (sin descargar): el prefijo tiene ~225k objetos
  // (recortes del padrón, ~8KB c/u) y solo un puñado son fotos crudas grandes.
  // Descargar todo para medir sería inviable (~2.3GB), así que paginamos y nos
  // quedamos SOLO con los objetos cuyo metadata.size >= UMBRAL_BYTES.
  let totalObjetos = 0;
  let saltadasPorTamano = 0;
  const candidatas = [];
  let pageToken;
  do {
    const [files, , resp] = await bucket.getFiles({
      prefix: PREFIX,
      maxResults: 1000,
      autoPaginate: false,
      pageToken,
    });
    for (const f of files) {
      if (f.name.endsWith("/")) continue; // ignora "carpetas"
      totalObjetos++;
      if (Number(f.metadata.size || 0) >= UMBRAL_BYTES) candidatas.push(f);
      else saltadasPorTamano++;
    }
    pageToken = resp && resp.nextPageToken;
    console.log(
      `... listados ${totalObjetos} objetos (candidatas por tamaño: ${candidatas.length})`
    );
  } while (pageToken);

  console.log(
    `\nObjetos: ${totalObjetos} · candidatas >=${kb(UMBRAL_BYTES)}KB: ${candidatas.length}`
  );
  console.log(`Carpeta de backup de esta corrida: ${BACKUP_PREFIX}\n`);

  const resultados = await conConcurrencia(candidatas, CONCURRENCIA, procesarFoto);

  const recomprimidas = resultados.filter((r) => r.estado === "recomprimida");
  const saltadasPorDimension = resultados.filter((r) => r.estado === "saltada");
  const fallidasBackup = resultados.filter((r) => r.estado === "fallida_backup");
  const fallidasRecompresion = resultados.filter(
    (r) => r.estado === "fallida_recompresion"
  );
  const respaldados = resultados.filter((r) => r.backup).length;
  const ahorroBytes = recomprimidas.reduce(
    (acc, r) => acc + (r.antes - r.despues),
    0
  );

  console.log("\n=== RESUMEN ===");
  console.log(`Total objetos:            ${totalObjetos}`);
  console.log(`Revisados (candidatas):   ${candidatas.length}`);
  console.log(
    `Respaldados:              ${respaldados}${DRY_RUN ? " (se crearían, dry-run)" : ` -> ${BACKUP_PREFIX}`}`
  );
  console.log(
    `Recomprimidos:            ${recomprimidas.length}${DRY_RUN ? " (estimado, dry-run)" : ""}`
  );
  console.log(`Saltados (por tamaño):    ${saltadasPorTamano}`);
  console.log(`Saltados (por lado):      ${saltadasPorDimension.length}`);
  console.log(`Fallidos (backup):        ${fallidasBackup.length}`);
  console.log(`Fallidos (recompresión):  ${fallidasRecompresion.length}`);
  console.log(
    `MB ahorrados:             ${mb(ahorroBytes)} MB${DRY_RUN ? " (estimado)" : ""}`
  );
  if (DRY_RUN) {
    console.log(
      "\nDry-run: no se escribió ni copió nada. Revisa el reporte y corre con --apply."
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error fatal:", err);
    process.exit(1);
  });
