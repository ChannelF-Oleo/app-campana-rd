import React, { useEffect, useRef, useState } from "react";
import {
  RANGOS_RAPIDOS,
  calcularRangoRapido,
  formatearDia,
} from "../../utils/fechas";

// Filtro de rango de fechas compacto: un botón que ocupa una sola celda del
// grid de filtros y abre un desplegable con rango personalizado (izquierda) y
// rangos rápidos (derecha). `desde`/`hasta` son "YYYY-MM-DD" o "" (sin límite).
function DateRangeFilter({ desde, hasta, onChange, titulo = "Fecha" }) {
  const [abierto, setAbierto] = useState(false);
  // Rango rápido elegido (para resaltarlo y rotular el botón). null = rango
  // personalizado.
  const [rapidoId, setRapidoId] = useState(desde || hasta ? null : "todo");
  const [borradorDesde, setBorradorDesde] = useState(desde);
  const [borradorHasta, setBorradorHasta] = useState(hasta);
  const contenedorRef = useRef(null);

  // Al abrir, el rango personalizado parte de lo que está aplicado.
  useEffect(() => {
    if (abierto) {
      setBorradorDesde(desde);
      setBorradorHasta(hasta);
    }
  }, [abierto, desde, hasta]);

  // Cerrar con clic fuera o Escape.
  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = (e) => {
      if (!contenedorRef.current?.contains(e.target)) setAbierto(false);
    };
    const alTecla = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", alClicFuera);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierto]);

  const elegirRapido = (rango) => {
    const { desde: d, hasta: h } = calcularRangoRapido(rango);
    setRapidoId(rango.id);
    onChange(d, h);
    setAbierto(false);
  };

  const aplicarPersonalizado = () => {
    setRapidoId(borradorDesde || borradorHasta ? null : "todo");
    onChange(borradorDesde, borradorHasta);
    setAbierto(false);
  };

  const rapido = RANGOS_RAPIDOS.find((r) => r.id === rapidoId);
  let etiqueta;
  if (rapido) etiqueta = rapido.label;
  else if (desde && hasta) etiqueta = `${formatearDia(desde)} – ${formatearDia(hasta)}`;
  else if (desde) etiqueta = `Desde ${formatearDia(desde)}`;
  else if (hasta) etiqueta = `Hasta ${formatearDia(hasta)}`;
  else etiqueta = "Todo el tiempo";

  const rangoInvalido = borradorDesde && borradorHasta && borradorDesde > borradorHasta;

  return (
    <div className="date-range-filter" ref={contenedorRef}>
      <button
        type="button"
        className={`date-range-trigger ${desde || hasta ? "is-active" : ""}`}
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
      >
        <span className="date-range-trigger-titulo">{titulo}:</span>
        <span className="date-range-trigger-valor">{etiqueta}</span>
        <span className="date-range-trigger-icono" aria-hidden="true">
          📅
        </span>
      </button>

      {abierto && (
        <div className="date-range-popover" role="dialog" aria-label={titulo}>
          <div className="date-range-col">
            <h4 className="date-range-heading">Rango personalizado</h4>
            <label className="date-range-campo">
              <span>Desde</span>
              <input
                type="date"
                className="search-input"
                value={borradorDesde}
                max={borradorHasta || undefined}
                onChange={(e) => setBorradorDesde(e.target.value)}
              />
            </label>
            <label className="date-range-campo">
              <span>Hasta</span>
              <input
                type="date"
                className="search-input"
                value={borradorHasta}
                min={borradorDesde || undefined}
                onChange={(e) => setBorradorHasta(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="date-range-aplicar"
              onClick={aplicarPersonalizado}
              disabled={rangoInvalido}
            >
              Aplicar rango
            </button>
          </div>

          <div className="date-range-col date-range-rapidos">
            <h4 className="date-range-heading">Rangos rápidos</h4>
            <ul>
              {RANGOS_RAPIDOS.map((rango) => (
                <li key={rango.id}>
                  <button
                    type="button"
                    className={`date-range-rapido ${
                      rango.id === rapidoId ? "is-selected" : ""
                    }`}
                    onClick={() => elegirRapido(rango)}
                  >
                    {rango.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateRangeFilter;
