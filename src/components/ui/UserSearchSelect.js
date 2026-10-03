import React, { useMemo, useState } from "react";
import { filtrarUsuarios } from "../../utils/buscarUsuarios";

// Máximo de resultados pintados a la vez: con cientos de usuarios, una lista
// completa es inmanejable; se pide afinar la búsqueda.
const MAX_RESULTADOS = 50;

// Selector de usuario con búsqueda por texto (nombre, apodo, cédula, email o
// rol). Reemplaza a un <select> con todos los usuarios. La lista de resultados
// va en el flujo del documento (no flotante) para que funcione dentro de
// modales con scroll propio sin quedar recortada.
function UserSearchSelect({ users, value, onChange, placeholder }) {
  const [texto, setTexto] = useState("");
  const [activo, setActivo] = useState(0);
  // Solo se enfoca el buscador tras pulsar "Cambiar": al abrir un formulario
  // nuevo el foco debe quedarse donde el usuario empieza a escribir.
  const [enfocar, setEnfocar] = useState(false);
  const seleccionado = users.find((u) => u.uid === value);

  const resultados = useMemo(
    () => (texto.trim() ? filtrarUsuarios(users, texto) : []),
    [users, texto]
  );
  const visibles = resultados.slice(0, MAX_RESULTADOS);

  const elegir = (u) => {
    onChange(u.uid);
    setTexto("");
    setActivo(0);
  };

  const alTecla = (e) => {
    if (!visibles.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => Math.min(i + 1, visibles.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      elegir(visibles[activo]);
    } else if (e.key === "Escape") {
      setTexto("");
    }
  };

  if (seleccionado) {
    return (
      <div className="user-search-elegido">
        <div className="user-search-datos">
          <strong>{seleccionado.nombre}</strong>
          <small>
            {seleccionado.cedula || "Sin cédula"} · {seleccionado.rol}
          </small>
        </div>
        <button
          type="button"
          className="user-search-cambiar"
          onClick={() => {
            setEnfocar(true);
            onChange("");
          }}
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="user-search">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder || "Escribe nombre, apodo o cédula..."}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setActivo(0);
        }}
        onKeyDown={alTecla}
        role="combobox"
        aria-expanded={visibles.length > 0}
        aria-controls="user-search-lista"
        aria-autocomplete="list"
        autoFocus={enfocar}
      />

      {texto.trim() && (
        <ul className="user-search-lista" id="user-search-lista" role="listbox">
          {visibles.length === 0 && (
            <li className="user-search-vacio">Sin resultados para "{texto}".</li>
          )}
          {visibles.map((u, i) => (
            <li key={u.uid} role="option" aria-selected={i === activo}>
              <button
                type="button"
                className={`user-search-opcion ${i === activo ? "is-active" : ""}`}
                onMouseEnter={() => setActivo(i)}
                onClick={() => elegir(u)}
              >
                <span className="user-search-nombre">{u.nombre}</span>
                <small>
                  {u.cedula || "Sin cédula"} · {u.rol}
                </small>
              </button>
            </li>
          ))}
          {resultados.length > MAX_RESULTADOS && (
            <li className="user-search-vacio">
              Mostrando {MAX_RESULTADOS} de {resultados.length}. Sigue escribiendo
              para afinar.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default UserSearchSelect;
