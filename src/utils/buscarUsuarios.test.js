import { filtrarUsuarios } from "./buscarUsuarios";

const usuarios = [
  { uid: "1", nombre: "José Pérez", apodo: "Pepe", cedula: "00112345678", rol: "lider de zona" },
  { uid: "2", nombre: "MONTERO MUESES, EDWIN", cedula: "40238602185", rol: "multiplicador" },
  { uid: "3", nombre: "Ana Pérez", email: "ana@correo.com", cedula: null, rol: "admin" },
];
const ids = (r) => r.map((u) => u.uid);

test("sin texto devuelve todos", () => {
  expect(ids(filtrarUsuarios(usuarios, "  "))).toEqual(["1", "2", "3"]);
});

test("ignora acentos, mayúsculas y el orden de las palabras", () => {
  expect(ids(filtrarUsuarios(usuarios, "perez jose"))).toEqual(["1"]);
  expect(ids(filtrarUsuarios(usuarios, "PÉREZ"))).toEqual(["1", "3"]);
  expect(ids(filtrarUsuarios(usuarios, "edwin montero"))).toEqual(["2"]);
});

test("busca por apodo, email y rol", () => {
  expect(ids(filtrarUsuarios(usuarios, "pepe"))).toEqual(["1"]);
  expect(ids(filtrarUsuarios(usuarios, "ana@correo"))).toEqual(["3"]);
  expect(ids(filtrarUsuarios(usuarios, "multiplicador"))).toEqual(["2"]);
});

test("busca por cédula con o sin guiones", () => {
  expect(ids(filtrarUsuarios(usuarios, "402-3860"))).toEqual(["2"]);
  expect(ids(filtrarUsuarios(usuarios, "00112345678"))).toEqual(["1"]);
});
