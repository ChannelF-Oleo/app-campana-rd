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
 *     value = { zona, sector, subsector, recinto, colegioElectoral,
 *               sectorEsOtro, subsectorEsOtro, recintoEsOtro,
 *               colegioElectoralEsOtro }
 *     onChange(campo, valor)   -> el padre actualiza value[campo]
 *     disabled                 -> deshabilita los selects editables
 *
 * IMPORTANTE (resets, los hace el padre):
 *   Colegio Electoral está encadenado a Recinto. Cuando el padre reciba un
 *   onChange("recinto", ...) o onChange("recintoEsOtro", ...) DEBE resetear
 *   "colegioElectoral" y "colegioElectoralEsOtro", porque las opciones de
 *   colegio dependen del recinto elegido. Sector y Subsector NO dependen de
 *   Recinto: son ramas independientes y no requieren reset al cambiar Recinto.
 *
 * La opción "No identificado" es un valor SELECCIONABLE y válido (distinto del
 * placeholder vacío inicial), presente en los cuatro selects editables.
 *
 * OPCIÓN "Otro" (texto libre) en los CUATRO selects (Sector, Subsector, Recinto,
 * Colegio): además del catálogo y "No identificado", cada campo ofrece "Otro".
 * El estado vive en el padre mediante DOS campos por cada uno:
 *   - <campo>EsOtro (bool): si la opción activa es "Otro".
 *   - <campo> (string): cuando esOtro, guarda el texto libre TAL CUAL se
 *     escribe; en otro caso, el valor del catálogo o "No identificado".
 * Hacia el payload solo sale `<campo>` con el valor final (el padre normaliza el
 * texto libre con normalizarUbicacion al enviar). El centinela OPCION_OTRO es
 * solo el value del <option>: nunca se persiste.
 *
 * ADVERTENCIA: un Colegio o Recinto escrito a mano ("Otro") NO existe en
 * zonas.json, por lo que la función de relleno desde el padrón (script) no podrá
 * derivar zona/recinto a partir de él. Es un comportamiento ACEPTADO: el texto
 * libre queda persistido tal cual (normalizado) pero fuera del catálogo.
 */
function UbicacionElectoralFields({ value, onChange, disabled }) {
  const v = value || {};
  const zona = v.zona ?? ZONA_FIJA;
  const sector = v.sector ?? "";
  const sectorEsOtro = v.sectorEsOtro ?? false;
  const recinto = v.recinto ?? "";
  const recintoEsOtro = v.recintoEsOtro ?? false;

  // Al elegir en un select con "Otro": "Otro" activa el texto libre (y limpia el
  // campo para empezar en blanco); cualquier otra opción desactiva "Otro".
  const handleSelect = (campo) => (e) => {
    const val = e.target.value;
    if (val === OPCION_OTRO) {
      onChange(`${campo}EsOtro`, true);
      onChange(campo, "");
    } else {
      onChange(`${campo}EsOtro`, false);
      onChange(campo, val);
    }
  };

  // Subsectores dependen del Sector; si el sector es texto libre ("Otro"), no
  // hay match en el catálogo y la lista queda vacía (solo Otro/No identificado).
  const subsectores = sectorEsOtro ? [] : getSubsectores(zona, sector);
  const recintos = getRecintos(zona);
  // Colegios encadenados a Recinto: un recinto vacío, "No identificado" o texto
  // libre ("Otro") no deriva colegios del catálogo.
  const hayRecinto =
    !recintoEsOtro && recinto && recinto !== OPCION_NO_IDENTIFICADO;
  const colegios = hayRecinto ? getColegios(zona, recinto) : [];

  // Config declarativa de los cuatro selects con opción "Otro". El orden del
  // array es el orden de render (Sector → Subsector → Recinto → Colegio).
  const campos = [
    {
      campo: "sector",
      label: "Sector",
      id: "ubic-sector",
      opciones: [SECTOR_FIJO],
      placeholderOtro: "Escribe el sector",
    },
    {
      campo: "subsector",
      label: "Subsector",
      id: "ubic-subsector",
      opciones: subsectores,
      placeholderOtro: "Escribe el subsector",
    },
    {
      campo: "recinto",
      label: "Recinto",
      id: "ubic-recinto",
      opciones: recintos,
      placeholderOtro: "Escribe el recinto",
    },
    {
      campo: "colegioElectoral",
      label: "Colegio Electoral",
      id: "ubic-colegio",
      opciones: colegios,
      placeholderOtro: "Escribe el colegio electoral",
    },
  ];

  // Renderiza un select del catálogo + "Otro" + "No identificado", y el input de
  // texto libre cuando la opción activa es "Otro". La normalización y la
  // validación de vacío viven en el submit del padre (notificación del form).
  const renderCampo = ({ campo, label, id, opciones, placeholderOtro }) => {
    const esOtro = v[`${campo}EsOtro`] ?? false;
    const valor = v[campo] ?? "";
    return (
      <div className="input-group" key={campo}>
        <label htmlFor={id}>{label}</label>
        <select
          id={id}
          value={esOtro ? OPCION_OTRO : valor}
          onChange={handleSelect(campo)}
          required
          disabled={disabled}
        >
          <option value="">-- Selecciona --</option>
          {opciones.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value={OPCION_OTRO}>Otro</option>
          <option value={OPCION_NO_IDENTIFICADO}>
            {OPCION_NO_IDENTIFICADO}
          </option>
        </select>
        {esOtro && (
          <input
            type="text"
            id={`${id}-otro`}
            placeholder={placeholderOtro}
            value={valor}
            onChange={(e) => onChange(campo, e.target.value)}
            disabled={disabled}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {/* Zona: bloqueada, sin opción "Otro" ni "No identificado". */}
      <div className="input-group">
        <label htmlFor="ubic-zona">Zona</label>
        <select id="ubic-zona" value={zona} disabled={true}>
          <option value={ZONA_FIJA}>{ZONA_FIJA}</option>
        </select>
      </div>

      {/* Sector → Subsector → Recinto → Colegio, todos con opción "Otro". */}
      {campos.map(renderCampo)}
    </>
  );
}

export default UbicacionElectoralFields;
