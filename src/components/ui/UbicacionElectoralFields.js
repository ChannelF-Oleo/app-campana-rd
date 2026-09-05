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
 *               sectorEsOtro, subsectorEsOtro, recintoEsOtro,
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
 * Cada select se deshabilita mientras su dependencia no esté RESUELTA: Sector y
 * Recinto necesitan Zona, Subsector necesita Zona+Sector, Colegio necesita
 * Zona+Recinto. Un nivel está resuelto tanto si es un valor del catálogo como si
 * está en "Otro" (texto libre): en el primer caso el hijo lista su catálogo; en
 * el segundo el catálogo queda vacío pero el select sigue habilitado con "Otro"
 * y "No identificado", para poder seguir escribiendo la cascada a mano. Solo el
 * placeholder vacío y "No identificado" bloquean el nivel siguiente.
 *
 * La opción "No identificado" es un valor SELECCIONABLE y válido (distinto del
 * placeholder vacío inicial), presente en los cinco selects.
 *
 * OPCIÓN "Otro" (texto libre) en CUATRO de los cinco selects (Sector, Subsector,
 * Recinto y Colegio): además del catálogo y "No identificado", esos campos
 * ofrecen "Otro". ZONA NO la ofrece: las zonas electorales son un catálogo
 * cerrado y oficial (las 27 de zonas.json) y el texto libre corrompería la
 * analítica por zona (gráficos, filtros, relleno desde el padrón); solo admite
 * una de las 27 o "No identificado". El estado de "Otro" vive en el padre
 * mediante DOS campos por cada uno de esos cuatro:
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

// Un nivel resuelto habilita al siguiente: vale tanto el catálogo como el texto
// libre de "Otro" (aunque aún esté vacío, para que el select no parpadee entre
// habilitado y bloqueado mientras se teclea).
const esNivelResuelto = (valor, esOtro) =>
  !!esOtro || esValorDeCatalogo(valor, esOtro);

function UbicacionElectoralFields({ value, onChange, disabled }) {
  const v = value || {};
  const zona = v.zona ?? "";
  const sector = v.sector ?? "";
  const sectorEsOtro = v.sectorEsOtro ?? false;
  const recinto = v.recinto ?? "";
  const recintoEsOtro = v.recintoEsOtro ?? false;

  // Al elegir en un select: en los campos con "Otro", esa opción activa el texto
  // libre (y limpia el campo para empezar en blanco) y cualquier otra la
  // desactiva. Zona no admite "Otro", así que solo propaga el valor elegido.
  const handleSelect = (campo, permiteOtro) => (e) => {
    const val = e.target.value;
    if (!permiteOtro) {
      onChange(campo, val);
      return;
    }
    if (val === OPCION_OTRO) {
      onChange(`${campo}EsOtro`, true);
      onChange(campo, "");
    } else {
      onChange(`${campo}EsOtro`, false);
      onChange(campo, val);
    }
  };

  // Zona nunca es texto libre: basta con que no esté vacía ni sea "No
  // identificado" para poder derivar sus sectores y recintos.
  const hayZona = esValorDeCatalogo(zona, false);
  const haySector = esValorDeCatalogo(sector, sectorEsOtro);
  const hayRecinto = esValorDeCatalogo(recinto, recintoEsOtro);
  // Para habilitar al hijo basta con que el padre esté resuelto, aunque sea
  // texto libre y por tanto no aporte catálogo.
  const sectorResuelto = esNivelResuelto(sector, sectorEsOtro);
  const recintoResuelto = esNivelResuelto(recinto, recintoEsOtro);

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
      // Catálogo CERRADO: las 27 zonas oficiales o "No identificado", sin "Otro".
      permiteOtro: false,
      bloqueado: false,
    },
    {
      campo: "sector",
      label: "Sector",
      id: "ubic-sector",
      opciones: sectores,
      permiteOtro: true,
      placeholderOtro: "Escribe el sector",
      bloqueado: !hayZona,
    },
    {
      campo: "subsector",
      label: "Subsector",
      id: "ubic-subsector",
      opciones: subsectores,
      permiteOtro: true,
      placeholderOtro: "Escribe el subsector",
      bloqueado: !hayZona || !sectorResuelto,
    },
    {
      campo: "recinto",
      label: "Recinto",
      id: "ubic-recinto",
      opciones: recintos,
      permiteOtro: true,
      placeholderOtro: "Escribe el recinto",
      bloqueado: !hayZona,
    },
    {
      campo: "colegioElectoral",
      label: "Colegio Electoral",
      id: "ubic-colegio",
      opciones: colegios,
      permiteOtro: true,
      placeholderOtro: "Escribe el colegio electoral",
      bloqueado: !hayZona || !recintoResuelto,
    },
  ];

  // Renderiza un select del catálogo + "No identificado" (+ "Otro" y su input de
  // texto libre en los campos que lo admiten). La normalización y la validación
  // de vacío viven en el submit del padre (notificación del form).
  const renderCampo = ({
    campo,
    label,
    id,
    opciones,
    placeholder,
    permiteOtro,
    placeholderOtro,
    bloqueado,
  }) => {
    const esOtro = permiteOtro && (v[`${campo}EsOtro`] ?? false);
    const valor = v[campo] ?? "";
    return (
      <div className="input-group" key={campo}>
        <label htmlFor={id}>{label}</label>
        <select
          id={id}
          value={esOtro ? OPCION_OTRO : valor}
          onChange={handleSelect(campo, permiteOtro)}
          required
          disabled={disabled || bloqueado}
        >
          <option value="">{placeholder || "-- Selecciona --"}</option>
          {opciones.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          {permiteOtro && <option value={OPCION_OTRO}>Otro</option>}
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
