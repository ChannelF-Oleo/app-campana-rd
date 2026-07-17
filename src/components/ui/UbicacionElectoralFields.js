import React from "react";
import {
  OPCION_NO_IDENTIFICADO,
  OPCION_OTRO,
  ZONA_FIJA,
  SECTOR_FIJO,
  getSubsectores,
  getRecintos,
  getColegios,
} from "../../data/ubicacionElectoral";

/**
 * Campos de ubicación electoral en cascada de 5 niveles, en orden fijo:
 *   Zona → Sector → Subsector → Recinto → Colegio Electoral
 *
 * Contrato (estado controlado por el padre):
 *   props:
 *     value = { zona, sector, subsector, recinto, colegioElectoral }
 *     onChange(campo, valor)   -> el padre actualiza value[campo]
 *     disabled                 -> deshabilita los selects editables
 *
 * IMPORTANTE (resets, los hará el padre en la Fase 2):
 *   Colegio Electoral está encadenado a Recinto. Cuando el padre reciba un
 *   onChange("recinto", ...) DEBE resetear "colegioElectoral" (a "" o a
 *   OPCION_NO_IDENTIFICADO), porque las opciones de colegio dependen del
 *   recinto elegido. Sector y Subsector NO dependen de Recinto: son ramas
 *   independientes y no requieren reset al cambiar Recinto.
 *
 * La opción "No identificado" es un valor SELECCIONABLE y válido (distinto del
 * placeholder vacío inicial), presente en Sector, Subsector, Recinto y Colegio.
 *
 * SUBSECTOR "Otro" (texto libre): además del catálogo y "No identificado", el
 * subsector ofrece "Otro". El estado vive en el padre mediante DOS campos:
 *   - subsectorEsOtro (bool): si la opción activa es "Otro".
 *   - subsector (string): cuando esOtro, guarda el texto libre TAL CUAL se
 *     escribe; en otro caso, el valor del catálogo o "No identificado".
 * Hacia el payload solo sale `subsector` con el valor final (el padre normaliza
 * el texto libre con normalizarSubsector al enviar). El centinela OPCION_OTRO
 * es solo el value del <option>: nunca se persiste.
 */
function UbicacionElectoralFields({ value, onChange, disabled }) {
  const {
    zona = ZONA_FIJA,
    sector = "",
    subsector = "",
    subsectorEsOtro = false,
    recinto = "",
    colegioElectoral = "",
  } = value || {};

  // Al elegir en el select de subsector: "Otro" activa el texto libre (y limpia
  // el campo para empezar en blanco); cualquier otra opción desactiva "Otro".
  const handleSubsectorSelect = (e) => {
    const v = e.target.value;
    if (v === OPCION_OTRO) {
      onChange("subsectorEsOtro", true);
      onChange("subsector", "");
    } else {
      onChange("subsectorEsOtro", false);
      onChange("subsector", v);
    }
  };

  const subsectores = getSubsectores(zona, sector);
  const recintos = getRecintos(zona);
  // Encadenado a Recinto: sin recinto elegido (vacío o "No identificado"),
  // solo se permite "No identificado" como colegio.
  const hayRecinto = recinto && recinto !== OPCION_NO_IDENTIFICADO;
  const colegios = hayRecinto ? getColegios(zona, recinto) : [];

  return (
    <>
      {/* Zona: bloqueada, sin opción "No identificado". */}
      <div className="input-group">
        <label htmlFor="ubic-zona">Zona</label>
        <select id="ubic-zona" value={zona} disabled={true}>
          <option value={ZONA_FIJA}>{ZONA_FIJA}</option>
        </select>
      </div>

      {/* Sector: único por ahora (fijo en SECTOR_FIJO), pero editable/required. */}
      <div className="input-group">
        <label htmlFor="ubic-sector">Sector</label>
        <select
          id="ubic-sector"
          value={sector}
          onChange={(e) => onChange("sector", e.target.value)}
          required
          disabled={disabled}
        >
          <option value="">-- Selecciona --</option>
          <option value={SECTOR_FIJO}>{SECTOR_FIJO}</option>
          <option value={OPCION_NO_IDENTIFICADO}>{OPCION_NO_IDENTIFICADO}</option>
        </select>
      </div>

      {/* Subsector: catálogo + "Otro" (texto libre) + "No identificado". */}
      <div className="input-group">
        <label htmlFor="ubic-subsector">Subsector</label>
        <select
          id="ubic-subsector"
          value={subsectorEsOtro ? OPCION_OTRO : subsector}
          onChange={handleSubsectorSelect}
          required
          disabled={disabled}
        >
          <option value="">-- Selecciona --</option>
          {subsectores.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value={OPCION_OTRO}>Otro</option>
          <option value={OPCION_NO_IDENTIFICADO}>{OPCION_NO_IDENTIFICADO}</option>
        </select>
        {/* Texto libre cuando la opción activa es "Otro". Se normaliza (mayúsculas,
            sin espacios sobrantes) en el submit del padre. La validación de vacío
            también vive en el submit, para mostrar la notificación del formulario. */}
        {subsectorEsOtro && (
          <input
            type="text"
            id="ubic-subsector-otro"
            placeholder="Escribe el subsector"
            value={subsector}
            onChange={(e) => onChange("subsector", e.target.value)}
            disabled={disabled}
          />
        )}
      </div>

      {/* Recinto: centros de la zona + "No identificado". */}
      <div className="input-group">
        <label htmlFor="ubic-recinto">Recinto</label>
        <select
          id="ubic-recinto"
          value={recinto}
          onChange={(e) => onChange("recinto", e.target.value)}
          required
          disabled={disabled}
        >
          <option value="">-- Selecciona --</option>
          {recintos.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
          <option value={OPCION_NO_IDENTIFICADO}>{OPCION_NO_IDENTIFICADO}</option>
        </select>
      </div>

      {/* Colegio Electoral: padrones del recinto + "No identificado".
          Encadenado a Recinto: sin recinto, solo "No identificado". */}
      <div className="input-group">
        <label htmlFor="ubic-colegio">Colegio Electoral</label>
        <select
          id="ubic-colegio"
          value={colegioElectoral}
          onChange={(e) => onChange("colegioElectoral", e.target.value)}
          required
          disabled={disabled}
        >
          <option value="">-- Selecciona --</option>
          {colegios.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={OPCION_NO_IDENTIFICADO}>{OPCION_NO_IDENTIFICADO}</option>
        </select>
      </div>
    </>
  );
}

export default UbicacionElectoralFields;
