import React from "react";
import {
  OPCION_NO_IDENTIFICADO,
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
 */
function UbicacionElectoralFields({ value, onChange, disabled }) {
  const {
    zona = ZONA_FIJA,
    sector = "",
    subsector = "",
    recinto = "",
    colegioElectoral = "",
  } = value || {};

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

      {/* Subsector: opciones del sector + "No identificado". */}
      <div className="input-group">
        <label htmlFor="ubic-subsector">Subsector</label>
        <select
          id="ubic-subsector"
          value={subsector}
          onChange={(e) => onChange("subsector", e.target.value)}
          required
          disabled={disabled}
        >
          <option value="">-- Selecciona --</option>
          {subsectores.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value={OPCION_NO_IDENTIFICADO}>{OPCION_NO_IDENTIFICADO}</option>
        </select>
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
