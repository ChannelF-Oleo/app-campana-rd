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
