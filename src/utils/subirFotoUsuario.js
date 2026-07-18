// Lógica COMPARTIDA para subir la foto de un usuario a Storage, reutilizada por
// EditUserModal (editar) y CreateUser (crear). Antes vivía inline dentro del
// modal de edición, acoplada al componente; aquí queda como util independiente.
//
// CONTRATO:
// - Este util SOLO comprime + sube el Blob a Storage y devuelve la ruta.
// - NO escribe `fotoPath` en Firestore: el id/ref del doc difiere según el
//   caller (updateDoc por user.id al editar, doc del usuario recién creado al
//   crear), así que la escritura la hace cada caller con la ruta devuelta.
// - La foto se guarda como .jpg con la cédula SIN guiones (estándar normalizado).
//   AvatarFoto prueba primero este formato, así la foto nueva siempre gana sobre
//   el recorte viejo del padrón (que está con guiones).

import { storage } from "../firebase";
import { ref, uploadBytes } from "firebase/storage";
import { comprimirImagen } from "./comprimirImagen";
import { normalizarCedula } from "../constants";

/**
 * Comprime y sube la foto de un usuario a `votantes_fotos/{cedulaSinGuiones}.jpg`.
 *
 * @param {File} file   Archivo de imagen elegido por el usuario.
 * @param {string} cedula Cédula del usuario (con o sin guiones). Debe tener 11
 *   dígitos; de lo contrario lanza (no se puede nombrar el archivo).
 * @returns {Promise<{ fotoPath: string }>} Ruta en Storage donde quedó la foto.
 *   El caller decide si la persiste en el doc de Firestore.
 * @throws {Error} Si la cédula no es válida o falla la subida a Storage.
 */
export async function subirFotoUsuario(file, cedula) {
  if (!file) {
    throw new Error("No se proporcionó ningún archivo de imagen.");
  }

  const cleanCedula = normalizarCedula(cedula);
  if (cleanCedula.length !== 11) {
    throw new Error(
      "El usuario debe tener una cédula válida (11 dígitos) para subir la foto."
    );
  }

  // Comprimimos/redimensionamos en el navegador ANTES de subir: las fotos de
  // cámara pesan varios MB y ralentizaban el export a PDF y la carga.
  const comprimida = await comprimirImagen(file);

  const fotoPath = `votantes_fotos/${cleanCedula}.jpg`;
  const storageRef = ref(storage, fotoPath);
  await uploadBytes(storageRef, comprimida);

  return { fotoPath };
}
