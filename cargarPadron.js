// sync-storage.js
// -------------------------------------------------------------
// Sincronizador optimizado Firebase Storage con progreso
// Guarda estado, permite pausar y reanudar automáticamente
// -------------------------------------------------------------

import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import admin from "firebase-admin";

// ------------------------------
// CONFIGURACIÓN DEL USUARIO
// ------------------------------

const LOCAL_FOLDER = "C:/ruta/a/tus/archivos"; // <--- EDITAR
const BUCKET_NAME = "politicard-cfd.appspot.com"; // NO CAMBIAR
const BLOCK_SIZE = 500; // Cuántos archivos procesa por bloque

// ------------------------------
// INICIALIZAR FIREBASE
// ------------------------------

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: BUCKET_NAME,
});

const bucket = admin.storage().bucket();

// ------------------------------
// NOMBRE DEL ARCHIVO DE PROGRESO
// ------------------------------
const PROGRESS_FILE = "progress.json";

function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) return { processed: [], remaining: [] };
  return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// -------------------------------------------------
// Obtiene todos los archivos locales
// -------------------------------------------------

function getLocalFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => fs.lstatSync(path.join(dir, f)).isFile());
}

// -------------------------------------------------
// Verifica si un archivo existe en Firebase
// -------------------------------------------------

async function existsInFirebase(filename) {
  const file = bucket.file(filename);
  const [exists] = await file.exists();
  return exists;
}

// -------------------------------------------------
// Subir archivo
// -------------------------------------------------

async function uploadFile(localPath, remoteName) {
  try {
    await bucket.upload(localPath, { destination: remoteName });
    return true;
  } catch (err) {
    console.error("Error subiendo:", remoteName, err.message);
    return false;
  }
}

// -------------------------------------------------
// PROCESAR BLOQUES
// -------------------------------------------------

async function processBlock(block, progress) {
  console.log(`\n📦 Procesando bloque de ${block.length} archivos...\n`);

  for (const filename of block) {
    const localPath = path.join(LOCAL_FOLDER, filename);

    // 1. Verificar existencia en Firebase
    const exists = await existsInFirebase(filename);

    if (exists) {
      console.log(`✔ Ya existe: ${filename}`);
    } else {
      // 2. Subir solo si no existe
      console.log(`⬆ Subiendo: ${filename}`);
      await uploadFile(localPath, filename);
    }

    // 3. Guardar avance
    progress.processed.push(filename);
    progress.remaining = progress.remaining.filter((x) => x !== filename);
    saveProgress(progress);
  }
}

// -------------------------------------------------
// FLUJO PRINCIPAL
// -------------------------------------------------

async function main() {
  const localFiles = getLocalFiles(LOCAL_FOLDER);

  console.log(`\n📂 Archivos locales: ${localFiles.length}`);

  let progress = loadProgress();

  // Primera vez → crea lista de pendientes
  if (progress.remaining.length === 0 && progress.processed.length === 0) {
    progress.remaining = localFiles;
    saveProgress(progress);
  }

  console.log(`\n⏳ Ya procesados: ${progress.processed.length}`);
  console.log(`📌 Pendientes: ${progress.remaining.length}`);

  // Preguntar si retomar
  const resume = await inquirer.prompt([
    {
      type: "confirm",
      name: "resume",
      message: "¿Deseas retomar donde lo dejaste?",
      default: true,
    },
  ]);

  if (!resume.resume) {
    // Reiniciar progreso
    progress = { processed: [], remaining: localFiles };
    saveProgress(progress);
    console.log("🔄 Progreso reiniciado.\n");
  }

  while (progress.remaining.length > 0) {
    const block = progress.remaining.slice(0, BLOCK_SIZE);

    // Confirmar procesar bloque
    const confirm = await inquirer.prompt([
      {
        type: "confirm",
        name: "go",
        message: `Procesar siguiente bloque de ${block.length} archivos?`,
        default: true,
      },
    ]);

    if (!confirm.go) {
      console.log("⏸ Pausado. Puedes reanudar más tarde.");
      return;
    }

    await processBlock(block, progress);
  }

  console.log("\n🎉 ¡Todo completado y sincronizado!");
}

main();
