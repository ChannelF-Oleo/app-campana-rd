import React from "react";
import {
  OPCION_NO_IDENTIFICADO,
  OPCION_OTRO,
  LISTA_ZONAS,
  getSectores,
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
 *               zonaEsOtro, sectorEsOtro, subsectorEsOtro, recintoEsOtro,
 *               colegioElectoralEsOtro }
 *     onChange(campo, valor)   -> el padre actualiza value[campo]
 *     disabled                 -> deshabilita todos los selects
 *
 * IMPORTANTE (resets, los hace el padre):
 *   Cada nivel depende del anterior, así que al cambiar uno el padre DEBE
 *   resetear los inferiores (valor y flag *EsOtro):
 *     - zona    -> sector, subsector, recinto, colegioElectoral
 *     - sector  -> subsector
 *     - recinto -> colegioElectoral
 *   Sector/Subsector y Recinto/Colegio son ramas hermanas colgando de Zona:
 *   cambiar Recinto no toca Sector ni Subsector.
 *
 * Cada select se deshabilita mientras su dependencia no esté elegida (un
 * catálogo vacío no se puede recorrer): Sector y Recinto necesitan Zona,
 * Subsector necesita Zona+Sector, Colegio necesita Zona+Recinto.
 *
 * La opción "No identificado" es un valor SELECCIONABLE y válido (distinto del
 * placeholder vacío inicial), presente en los cinco selects.
 *
 * OPCIÓN "Otro" (texto libre) en los CINCO selects: además del catálogo y "No
 * identificado", cada campo ofrece "Otro". El estado vive en el padre mediante
 * DOS campos por cada uno:
 *   - <campo>EsOtro (bool): si la opción activa es "Otro".
 *   - <campo> (string): cuando esOtro, guarda el texto libre TAL CUAL se
 *     escribe; en otro caso, el valor del catálogo o "No identificado".
 * Hacia el payload solo sale `<campo>` con el valor final (el padre normaliza el
 * texto libre con normalizarUbicacion al enviar). El centinela OPCION_OTRO es
 * solo el value del <option>: nunca se persiste.
 *
 * ADVERTENCIA: un valor escrito a mano ("Otro") NO existe en zonas.json /
 * sectores.json, por lo que sus niveles inferiores quedan sin catálogo (solo
 * Otro / No identificado) y la función de relleno desde el padrón (script) no
 * podrá derivar zona/recinto a partir de él. Es un comportamiento ACEPTADO: el
 * texto libre queda persistido tal cual (normalizado) pero fuera del catálogo.
 */

// Un nivel solo alimenta al siguiente si es un valor real del catálogo: ni
// vacío, ni "No identificado", ni texto libre ("Otro").
const esValorDeCatalogo = (valor, esOtro) =>
  !esOtro && !!valor && valor !== OPCION_NO_IDENTIFICADO;

function UbicacionElectoralFields({ value, onChange, disabled }) {
  const v = value || {};
  const zona = v.zona ?? "";
  const zonaEsOtro = v.zonaEsOtro ?? false;
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

  const hayZona = esValorDeCatalogo(zona, zonaEsOtro);
  const haySector = esValorDeCatalogo(sector, sectorEsOtro);
  const hayRecinto = esValorDeCatalogo(recinto, recintoEsOtro);

  // Catálogos encadenados: sin la dependencia elegida la lista queda vacía y el
  // select se deshabilita (solo quedarían Otro / No identificado).
  const sectores = hayZona ? getSectores(zona) : [];
  const subsectores = hayZona && haySector ? getSubsectores(zona, sector) : [];
  const recintos = hayZona ? getRecintos(zona) : [];
  const colegios = hayZona && hayRecinto ? getColegios(zona, recinto) : [];

  // Config declarativa de los cinco selects. El orden del array es el orden de
  // render (Zona → Sector → Subsector → Recinto → Colegio).
  const campos = [
    {
      campo: "zona",
      label: "Zona",
      id: "ubic-zona",
      opciones: LISTA_ZONAS,
      placeholder: "-- Selecciona Zona --",
      placeholderOtro: "Escribe la zona",
      bloqueado: false,
    },
    {
      campo: "sector",
      label: "Sector",
      id: "ubic-sector",
      opciones: sectores,
      placeholderOtro: "Escribe el sector",
      bloqueado: !hayZona,
    },
    {
      campo: "subsector",
      label: "Subsector",
      id: "ubic-subsector",
      opciones: subsectores,
      placeholderOtro: "Escribe el subsector",
      bloqueado: !hayZona || !haySector,
    },
    {
      campo: "recinto",
      label: "Recinto",
      id: "ubic-recinto",
      opciones: recintos,
      placeholderOtro: "Escribe el recinto",
      bloqueado: !hayZona,
    },
    {
      campo: "colegioElectoral",
      label: "Colegio Electoral",
      id: "ubic-colegio",
      opciones: colegios,
      placeholderOtro: "Escribe el colegio electoral",
      bloqueado: !hayZona || !hayRecinto,
    },
  ];

  // Renderiza un select del catálogo + "Otro" + "No identificado", y el input de
  // texto libre cuando la opción activa es "Otro". La normalización y la
  // validación de vacío viven en el submit del padre (notificación del form).
  const renderCampo = ({
    campo,
    label,
    id,
    opciones,
    placeholder,
    placeholderOtro,
    bloqueado,
  }) => {
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
          disabled={disabled || bloqueado}
        >
          <option value="">{placeholder || "-- Selecciona --"}</option>
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

  return <>{campos.map(renderCampo)}</>;
}

export default UbicacionElectoralFields;
