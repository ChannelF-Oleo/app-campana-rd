import { getVisibleNavItems } from "./navConfig";
import { ROL_ADMIN, ROL_LIDER, ROL_MULTIPLICADOR } from "../constants";

const ids = (items) => items.map((item) => item.id);

describe("getVisibleNavItems", () => {
  it("devuelve una lista vacía si no hay usuario", () => {
    expect(getVisibleNavItems(null)).toEqual([]);
    expect(getVisibleNavItems(undefined)).toEqual([]);
  });

  it("incluye siempre los ítems comunes (inicio, registro, perfil)", () => {
    const items = getVisibleNavItems({ rol: ROL_MULTIPLICADOR });
    expect(ids(items)).toEqual(expect.arrayContaining(["home", "registro", "perfil"]));
  });

  it("admin: muestra usuarios, equipos, comandos y ranking, sin metas", () => {
    const items = getVisibleNavItems({ rol: ROL_ADMIN });
    expect(ids(items)).toEqual([
      "home",
      "registro",
      "perfil",
      "usuarios",
      "equipos",
      "comandos",
      "ranking",
    ]);
    expect(ids(items)).not.toContain("metas");
  });

  it("multiplicador: incluye el enlace a la página de metas", () => {
    const items = getVisibleNavItems({ rol: ROL_MULTIPLICADOR });
    expect(ids(items)).toContain("metas");
    const metas = items.find((item) => item.id === "metas");
    expect(metas.path).toBe("/dashboard/metas");
  });

  it("líder de zona: incluye el enlace a la página de metas", () => {
    const items = getVisibleNavItems({ rol: ROL_LIDER });
    expect(ids(items)).toContain("metas");
  });

  it("rol desconocido: solo ítems comunes, sin metas ni opciones de admin", () => {
    const items = getVisibleNavItems({ rol: "invitado" });
    expect(ids(items)).toEqual(["home", "registro", "perfil"]);
  });
});
