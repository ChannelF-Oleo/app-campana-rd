// Convierte a Date las fechas tal como conviven en Firestore: Timestamp (lo
// normal), Date o cadena ISO (perfiles antiguos guardaron `fechaRegistro` como
// texto). Devuelve null si no hay fecha o no es válida.
export const aFecha = (valor) => {
  if (!valor) return null;
  const d =
    typeof valor.toDate === "function"
      ? valor.toDate()
      : valor instanceof Date
      ? valor
      : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
};

// ¿La fecha cae dentro del rango [desde, hasta]? Los límites son cadenas
// "YYYY-MM-DD" (input date); vacío = sin límite por ese lado.
export const enRangoFecha = (valor, desde, hasta) => {
  if (!desde && !hasta) return true;
  const d = aFecha(valor);
  if (!d) return false; // filtrando por fecha, sin fecha => fuera
  if (desde && d < new Date(`${desde}T00:00:00`)) return false;
  if (hasta && d > new Date(`${hasta}T23:59:59.999`)) return false;
  return true;
};

// Date -> "YYYY-MM-DD" en hora local (el formato de <input type="date">).
export const aISODia = (d) => {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// "YYYY-MM-DD" -> "DD/MM/YYYY" para mostrar.
export const formatearDia = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

// Rangos rápidos del selector de fechas. `dias`/`meses` cuentan hacia atrás
// desde hoy (incluido); sin ninguno = sin límite.
export const RANGOS_RAPIDOS = [
  { id: "todo", label: "Todo el tiempo" },
  { id: "hoy", label: "Hoy", dias: 1 },
  { id: "7d", label: "Últimos 7 días", dias: 7 },
  { id: "30d", label: "Últimos 30 días", dias: 30 },
  { id: "3m", label: "Últimos 3 meses", meses: 3 },
  { id: "6m", label: "Últimos 6 meses", meses: 6 },
  { id: "1a", label: "Último año", meses: 12 },
];

// Devuelve { desde, hasta } ("YYYY-MM-DD" o "") para un rango rápido.
export const calcularRangoRapido = (rango, hoy = new Date()) => {
  if (!rango.dias && !rango.meses) return { desde: "", hasta: "" };
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  if (rango.dias) inicio.setDate(inicio.getDate() - (rango.dias - 1));
  if (rango.meses) inicio.setMonth(inicio.getMonth() - rango.meses);
  return { desde: aISODia(inicio), hasta: aISODia(hoy) };
};
