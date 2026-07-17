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
 * SEGURIDAD: la corrida real SOBREESCRIBE los originales. Haz un backup del
 * prefijo ANTES (ver README, sección "Recompresión de fotos"):
 *   gcloud storage cp -r gs://politicard-cfd.firebasestorage.app/votantes_fotos \
 *     gs://politicard-cfd.firebasestorage.app/backup_votantes_fotos_YYYYMMDD
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
 * Procesa una foto: decide si saltarla o recomprimirla.
 * @returns {Promise<{ estado: "recomprimida"|"saltada"|"fallida", antes: number, despues: number }>}
 */
async function procesarFoto(file) {
  const name = file.name;
  try {
    const [buffer] = await file.download();
    const antes = buffer.length;

    const meta = await sharp(buffer).metadata();
    const ladoMayor = Math.max(meta.width || 0, meta.height || 0);

    // Se salta si YA está optimizada: pequeña en peso O pequeña en dimensiones.
    if (antes < UMBRAL_BYTES || ladoMayor <= MAX_LADO) {
      console.log(
        `  SALTA   ${name}  (${kb(antes)}KB, ${meta.width}x${meta.height})`
      );
      return { estado: "saltada", antes, despues: antes };
    }

    // Recomprime: .rotate() aplica la orientación EXIF antes de redimensionar.
    const nuevo = await sharp(buffer)
      .rotate()
      .resize({ width: MAX_LADO, height: MAX_LADO, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: CALIDAD })
      .toBuffer();

    const despues = nuevo.length;

    if (DRY_RUN) {
      console.log(
        `  DRY     ${name}  ${kb(antes)}KB -> ${kb(despues)}KB  (${meta.width}x${meta.height} -> lado<=${MAX_LADO})`
      );
      return { estado: "recomprimida", antes, despues };
    }

    await bucket.file(name).save(nuevo, {
      contentType: "image/jpeg",
      resumable: false,
      metadata: { contentType: "image/jpeg" },
    });
    console.log(`  OK      ${name}  ${kb(antes)}KB -> ${kb(despues)}KB`);
    return { estado: "recomprimida", antes, despues };
  } catch (err) {
    console.error(`  FALLA   ${name}: ${err && err.message}`);
    return { estado: "fallida", antes: 0, despues: 0 };
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

  const [files] = await bucket.getFiles({ prefix: PREFIX });
  // Ignora "carpetas" (objetos que terminan en / y tamaño 0).
  const fotos = files.filter((f) => !f.name.endsWith("/"));
  console.log(`Objetos encontrados: ${fotos.length}\n`);

  const resultados = await conConcurrencia(fotos, CONCURRENCIA, procesarFoto);

  const total = resultados.length;
  const recomprimidas = resultados.filter((r) => r.estado === "recomprimida");
  const saltadas = resultados.filter((r) => r.estado === "saltada");
  const fallidas = resultados.filter((r) => r.estado === "fallida");
  const ahorroBytes = recomprimidas.reduce(
    (acc, r) => acc + (r.antes - r.despues),
    0
  );

  console.log("\n=== RESUMEN ===");
  console.log(`Total:            ${total}`);
  console.log(
    `Recomprimidas:    ${recomprimidas.length}${DRY_RUN ? " (estimado, dry-run)" : ""}`
  );
  console.log(`Saltadas:         ${saltadas.length}`);
  console.log(`Fallidas:         ${fallidas.length}`);
  console.log(
    `MB ahorrados:     ${mb(ahorroBytes)} MB${DRY_RUN ? " (estimado)" : ""}`
  );
  if (DRY_RUN) {
    console.log(
      "\nDry-run: no se escribió nada. Revisa el reporte y, tras el backup, corre con --apply."
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error fatal:", err);
    process.exit(1);
  });
