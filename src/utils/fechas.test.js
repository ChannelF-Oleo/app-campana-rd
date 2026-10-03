import { aFecha, enRangoFecha, RANGOS_RAPIDOS, calcularRangoRapido, formatearDia } from "./fechas";

const ts = (iso) => ({ toDate: () => new Date(iso) });

describe("aFecha", () => {
  test("acepta Timestamp, Date y cadena ISO", () => {
    expect(aFecha(ts("2026-09-16T15:34:39")).getDate()).toBe(16);
    expect(aFecha(new Date("2026-09-16T10:00:00")).getMonth()).toBe(8);
    expect(aFecha("2026-07-01T00:00:00").getFullYear()).toBe(2026);
  });

  test("devuelve null si no hay fecha o es inválida", () => {
    expect(aFecha(null)).toBeNull();
    expect(aFecha(undefined)).toBeNull();
    expect(aFecha("no es fecha")).toBeNull();
  });
});

describe("enRangoFecha", () => {
  const d = ts("2026-09-16T15:34:39");

  test("sin límites deja pasar todo, incluso sin fecha", () => {
    expect(enRangoFecha(null, "", "")).toBe(true);
  });

  test("los límites son inclusivos por día completo", () => {
    expect(enRangoFecha(d, "2026-09-16", "2026-09-16")).toBe(true);
    expect(enRangoFecha(d, "2026-09-17", "")).toBe(false);
    expect(enRangoFecha(d, "", "2026-09-15")).toBe(false);
  });

  test("filtrando, un registro sin fecha queda fuera", () => {
    expect(enRangoFecha(null, "2026-01-01", "")).toBe(false);
  });
});

describe("calcularRangoRapido", () => {
  const hoy = new Date(2026, 9, 3, 11, 0); // 3 oct 2026
  const rango = (id) => RANGOS_RAPIDOS.find((r) => r.id === id);

  test("todo el tiempo no tiene límites", () => {
    expect(calcularRangoRapido(rango("todo"), hoy)).toEqual({ desde: "", hasta: "" });
  });

  test("cuenta hoy como el primer día", () => {
    expect(calcularRangoRapido(rango("hoy"), hoy)).toEqual({ desde: "2026-10-03", hasta: "2026-10-03" });
    expect(calcularRangoRapido(rango("7d"), hoy)).toEqual({ desde: "2026-09-27", hasta: "2026-10-03" });
  });

  test("los meses retroceden en el calendario", () => {
    expect(calcularRangoRapido(rango("3m"), hoy).desde).toBe("2026-07-03");
    expect(calcularRangoRapido(rango("1a"), hoy).desde).toBe("2025-10-03");
  });
});

test("formatearDia muestra DD/MM/YYYY", () => {
  expect(formatearDia("2026-09-01")).toBe("01/09/2026");
  expect(formatearDia("")).toBe("");
});
