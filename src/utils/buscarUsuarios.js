// Texto en minúsculas y sin acentos, para comparar "Jose" con "José".
const plano = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Filtra usuarios por un texto libre. Cada palabra debe aparecer en el nombre,
// apodo, email o rol (sin importar acentos ni orden: "perez jose" encuentra
// "José Pérez"); si el texto trae dígitos, también se busca en la cédula sin
// guiones. Devuelve los resultados en el mismo orden de `usuarios`.
export const filtrarUsuarios = (usuarios, texto) => {
  const palabras = plano(texto).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return usuarios;
  const digitos = String(texto).replace(/\D/g, "");

  return usuarios.filter((u) => {
    const cedula = String(u.cedula || "").replace(/\D/g, "");
    if (digitos.length >= 3 && cedula.includes(digitos)) return true;
    const pajar = plano(`${u.nombre} ${u.apodo || ""} ${u.email || ""} ${u.rol || ""}`);
    return palabras.every((p) => pajar.includes(p));
  });
};
