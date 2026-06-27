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

  it("admin: muestra usuarios, equipos y comandos, sin acción de meta", () => {
    const items = getVisibleNavItems({ rol: ROL_ADMIN });
    expect(ids(items)).toEqual([
      "home",
      "registro",
      "perfil",
      "usuarios",
      "equipos",
      "comandos",
    ]);
    expect(ids(items)).not.toContain("meta");
  });

  it("multiplicador: incluye la acción de meta", () => {
    const items = getVisibleNavItems({ rol: ROL_MULTIPLICADOR });
    expect(ids(items)).toContain("meta");
    const meta = items.find((item) => item.id === "meta");
    expect(meta.isAction).toBe(true);
    expect(meta.path).toBeNull();
  });

  it("líder de zona: incluye la acción de meta", () => {
    const items = getVisibleNavItems({ rol: ROL_LIDER });
    expect(ids(items)).toContain("meta");
  });

  it("rol desconocido: solo ítems comunes, sin meta ni opciones de admin", () => {
    const items = getVisibleNavItems({ rol: "invitado" });
    expect(ids(items)).toEqual(["home", "registro", "perfil"]);
  });
});
