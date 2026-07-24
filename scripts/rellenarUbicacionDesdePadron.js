/**
 * Relleno one-off de ubicación electoral desde el padrón (colección votantes).
 * ---------------------------------------------------------------------------
 * Algunos simpatizantes se registraron con "No identificado" (guardado como "")
 * en colegioElectoral / zona / recinto. El padrón (colección `votantes`) tiene,
 * por cédula, el colegio en el campo `origen`. De ese colegio se puede DERIVAR
 * zona y recinto cruzando con functions/zonas.json (misma lógica del antiguo
 * trigger asignarZonaYRecinto: buscar el padrón dentro de centros[].padrones[]
 * y tomar z.zona y centro.nombre).
 *
 * QUÉ HACE (por cada simpatizante con colegio y/o zona/recinto vacíos):
 *   1. Si le falta el colegio, consulta `votantes` por su cédula (probando con y
 *      sin guiones, igual que searchVotanteByCedula) y lee `origen`. Normaliza
 *      quitando extensión (.pdf/.xlsx/.xls), como el trigger antiguo.
 *   2. Rellena colegioElectoral (si estaba vacío).
 *   3. Deriva zona y recinto desde zonas.json y los rellena SOLO si estaban
 *      vacíos.
 *   4. NUNCA toca sector ni subsector (no son derivables del padrón).
 *   5. NUNCA sobreescribe un valor que el usuario ya puso: es ADITIVO sobre
 *      campos vacíos, por eso es reversible (ver más abajo).
 *
 * El padrón NO tiene sector ni subsector: es imposible rellenarlos aquí.
 *
 * SEGURIDAD / REVERSIBILIDAD:
 *   - Modo por defecto = DRY-RUN: NO escribe nada, solo reporta qué haría y con
 *     qué valores. La corrida real requiere --apply y la supervisa una persona.
 *   - En --apply, ANTES de escribir se vuelca un backup línea-a-línea (JSONL) en
 *     backups/rellenoUbicacion_<timestamp>.jsonl (repo-root, gitignored) con { id, cedula,
 *     before, after } de cada doc tocado. Como el cambio es aditivo sobre
 *     campos vacíos, revertir es reponer los `before` (todos vacíos) — el backup
 *     lo documenta explícitamente.
 *   - Cada doc actualizado se marca con ubicacionRellenadaDesdePadron: true y
 *     ubicacionRellenadaEn (timestamp) para auditoría.
 *
 * USO:
 *   node scripts/rellenarUbicacionDesdePadron.js              # dry-run (por defecto)
 *   node scripts/rellenarUbicacionDesdePadron.js --dry-run    # idem, explícito
 *   node scripts/rellenarUbicacionDesdePadron.js --apply      # corrida REAL (escribe)
 *
 * Requiere la service account (gitignored) en la raíz del repo, o su ruta en la
 * env var GOOGLE_APPLICATION_CREDENTIALS / SERVICE_ACCOUNT.
 */

const fs = require("fs");
const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Cruce con el MISMO catálogo que usa el backend (functions/zonas.json).
const zonasData = require("../functions/zonas.json");

// ------------------------------ Config ------------------------------
const DEFAULT_SA = "politicard-cfd-firebase-adminsdk-fbsvc-0dfcb72afa.json";
const COLECCION_SIMP = "simpatizantes";
const COLECCION_VOTANTES = "votantes";
const CONCURRENCIA = 6; // lecturas simultáneas al padrón

// Marca textual de "no identificado" que algunos docs antiguos pudieran tener
// literal (lo normal es que esté como ""). Se trata igual que vacío.
const NO_IDENTIFICADO = "no identificado";

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

initializeApp({ credential: cert(resolverServiceAccount()) });
const db = getFirestore();

// ----------------------------- Helpers ------------------------------

/** Un valor de ubicación cuenta como "vacío" si no hay nada útil que preservar. */
function estaVacio(valor) {
  if (valor === null || valor === undefined) return true;
  const s = String(valor).trim();
  return s === "" || s.toLowerCase() === NO_IDENTIFICADO;
}

/** Cédula solo dígitos. */
function normalizarCedula(cedula) {
  return String(cedula || "").replace(/\D/g, "");
}

/** Formatea 11 dígitos como 000-0000000-0; si no son 11, devuelve null. */
function conGuiones(cedulaLimpia) {
  if (cedulaLimpia.length !== 11) return null;
  return cedulaLimpia.replace(/^(\d{3})(\d{7})(\d{1})$/, "$1-$2-$3");
}

/** Limpia el nombre de un padrón/colegio: quita extensión y espacios. */
function limpiarColegio(colegio) {
  return String(colegio || "")
    .replace(/(\.pdf|\.xlsx|\.xls)/gi, "")
    .trim();
}

/**
 * Busca el documento de `votantes` por cédula probando doc-id con y sin guiones
 * (igual que searchVotanteByCedula) y devuelve su `origen` (colegio) ya limpio,
 * o "" si no hay cédula en el padrón o el doc no trae origen.
 */
async function colegioDesdePadron(cedulaLimpia) {
  const guiones = conGuiones(cedulaLimpia);
  const ref = db.collection(COLECCION_VOTANTES);

  let snap = guiones ? await ref.doc(guiones).get() : null;
  if (!snap || !snap.exists) snap = await ref.doc(cedulaLimpia).get();
  if (!snap.exists) return "";

  const data = snap.data() || {};
  const origen = data.origen || data.ORIGEN || data.colegio || "";
  return limpiarColegio(origen);
}

/**
 * Deriva { zona, recinto } cruzando un colegio (ya limpio) con zonas.json.
 * Misma comparación que el trigger antiguo: exacto o con padStart(4,'0').
 * Devuelve { zona: null, recinto: null } si no hay match.
 */
function derivarZonaYRecinto(colegioLimpio) {
  const buscado = limpiarColegio(colegioLimpio);
  if (!buscado) return { zona: null, recinto: null };

  for (const z of zonasData) {
    for (const centro of z.centros) {
      const match = centro.padrones.some((padronFile) => {
        const padronLimpio = limpiarColegio(padronFile);
        return (
          padronLimpio === buscado || padronLimpio === buscado.padStart(4, "0")
        );
      });
      if (match) return { zona: z.zona, recinto: centro.nombre };
    }
  }
  return { zona: null, recinto: null };
}

/** Corre `fn` sobre `items` con concurrencia limitada, preservando el orden. */
async function runPool(items, limit, fn) {
  const resultados = new Array(items.length);
  let siguiente = 0;
  async function worker() {
    while (siguiente < items.length) {
      const i = siguiente++;
      resultados[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return resultados;
}

// ----------------------------- Proceso ------------------------------

/**
 * Calcula el plan de relleno de UN simpatizante (sin escribir). Devuelve el
 * objeto de plan con `updates` (campos a rellenar) y un `estado` de resumen.
 */
async function planificarDoc(docSnap) {
  const data = docSnap.data() || {};
  const cedulaLimpia = normalizarCedula(data.cedula);

  const needsColegio = estaVacio(data.colegioElectoral);
  const needsZona = estaVacio(data.zona);
  const needsRecinto = estaVacio(data.recinto);

  // Nada que rellenar: ya tenían dato en los tres.
  if (!needsColegio && !needsZona && !needsRecinto) {
    return { id: docSnap.id, cedula: cedulaLimpia, estado: "saltado" };
  }

  // Colegio base para derivar zona/recinto: el existente (si lo hay) o el del
  // padrón. Solo consultamos el padrón cuando falta el colegio.
  let colegio = needsColegio ? "" : limpiarColegio(data.colegioElectoral);
  let sinDatoPadron = false;

  if (needsColegio) {
    if (cedulaLimpia.length !== 11) {
      sinDatoPadron = true;
    } else {
      colegio = await colegioDesdePadron(cedulaLimpia);
      if (!colegio) sinDatoPadron = true;
    }
  }

  if (sinDatoPadron) {
    return { id: docSnap.id, cedula: cedulaLimpia, estado: "sinDatoPadron" };
  }

  const { zona, recinto } = derivarZonaYRecinto(colegio);

  const updates = {};
  const before = {};
  if (needsColegio && colegio) {
    updates.colegioElectoral = colegio;
    before.colegioElectoral = data.colegioElectoral ?? "";
  }
  if (needsZona && zona) {
    updates.zona = zona;
    before.zona = data.zona ?? "";
  }
  if (needsRecinto && recinto) {
    updates.recinto = recinto;
    before.recinto = data.recinto ?? "";
  }

  if (Object.keys(updates).length === 0) {
    // Encontramos colegio pero no hubo match en zonas.json (o ya estaba todo lo
    // rellenable). No es "sin dato en padrón": el padrón sí tenía el colegio.
    return {
      id: docSnap.id,
      cedula: cedulaLimpia,
      estado: "sinMatchZonas",
      colegio,
    };
  }

  return {
    id: docSnap.id,
    cedula: cedulaLimpia,
    estado: "rellenar",
    before,
    updates,
  };
}

async function main() {
  console.log(
    `\n=== Relleno de ubicación desde padrón — modo ${
      DRY_RUN ? "DRY-RUN (no escribe)" : "APPLY (ESCRIBE)"
    } ===\n`
  );

  const snapshot = await db.collection(COLECCION_SIMP).get();
  const docs = snapshot.docs;
  console.log(`Simpatizantes totales: ${docs.length}`);

  // Planificación (con concurrencia limitada en las lecturas al padrón).
  const planes = await runPool(docs, CONCURRENCIA, planificarDoc);

  const aRellenar = planes.filter((p) => p.estado === "rellenar");
  const saltados = planes.filter((p) => p.estado === "saltado");
  const sinDatoPadron = planes.filter((p) => p.estado === "sinDatoPadron");
  const sinMatchZonas = planes.filter((p) => p.estado === "sinMatchZonas");
  const revisados = planes.length - saltados.length; // con al menos un campo vacío

  // Contadores por campo.
  let relColegio = 0;
  let relZona = 0;
  let relRecinto = 0;
  for (const p of aRellenar) {
    if (p.updates.colegioElectoral) relColegio++;
    if (p.updates.zona) relZona++;
    if (p.updates.recinto) relRecinto++;
  }

  // Reporte detallado de lo que se rellenaría.
  console.log(`\n--- Detalle de ${aRellenar.length} doc(s) a rellenar ---`);
  for (const p of aRellenar) {
    const partes = Object.entries(p.updates).map(([k, v]) => `${k}="${v}"`);
    console.log(`  [${p.cedula || "sin-cédula"}] ${p.id}: ${partes.join(", ")}`);
  }

  if (sinMatchZonas.length > 0) {
    console.log(
      `\n--- ${sinMatchZonas.length} con colegio en padrón pero SIN match en zonas.json (solo se rellenaría colegio si estaba vacío) ---`
    );
    for (const p of sinMatchZonas) {
      console.log(`  [${p.cedula || "sin-cédula"}] ${p.id}: origen="${p.colegio}"`);
    }
  }

  // Escritura real (solo --apply): backup JSONL primero, luego updates.
  if (!DRY_RUN && aRellenar.length > 0) {
    // Repo-root backups/ (gitignored: contiene cédulas / datos reales).
    const dirBackups = path.resolve(__dirname, "..", "backups");
    fs.mkdirSync(dirBackups, { recursive: true });
    const stamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);
    const backupPath = path.join(dirBackups, `rellenoUbicacion_${stamp}.jsonl`);

    // 1) Backup ANTES de escribir (before/after de cada doc a tocar).
    const lineas = aRellenar
      .map((p) =>
        JSON.stringify({
          id: p.id,
          cedula: p.cedula,
          before: p.before,
          after: p.updates,
        })
      )
      .join("\n");
    fs.writeFileSync(backupPath, lineas + "\n", "utf8");
    console.log(`\nBackup escrito -> ${backupPath}`);

    // 2) Updates aditivos (solo campos vacíos) + marca de auditoría.
    let escritos = 0;
    await runPool(aRellenar, CONCURRENCIA, async (p) => {
      await db
        .collection(COLECCION_SIMP)
        .doc(p.id)
        .update({
          ...p.updates,
          ubicacionRellenadaDesdePadron: true,
          ubicacionRellenadaEn: FieldValue.serverTimestamp(),
        });
      escritos++;
      if (escritos % 25 === 0) console.log(`  ...escritos ${escritos}`);
    });
    console.log(`Escritos ${escritos} doc(s).`);
  }

  // ------------------------------ Resumen ------------------------------
  console.log("\n=========== RESUMEN ===========");
  console.log(`Revisados (con algún campo vacío): ${revisados}`);
  console.log(`Rellenados (docs):                 ${aRellenar.length}`);
  console.log(`  - colegioElectoral:              ${relColegio}`);
  console.log(`  - zona:                          ${relZona}`);
  console.log(`  - recinto:                       ${relRecinto}`);
  console.log(`Sin dato en padrón:                ${sinDatoPadron.length}`);
  console.log(`Con colegio pero sin match zonas:  ${sinMatchZonas.length}`);
  console.log(`Saltados (ya tenían dato):         ${saltados.length}`);
  if (DRY_RUN) {
    console.log(
      "\n(DRY-RUN: no se escribió nada. Repite con --apply para aplicar.)"
    );
  }
  console.log("===============================\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error fatal:", err);
    process.exit(1);
  });
