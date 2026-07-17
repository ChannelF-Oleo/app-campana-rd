import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  ROL_ADMIN,
  ROL_LIDER,
  ROL_MULTIPLICADOR,
  PROVINCIA_FIJA,
  MUNICIPIO_FIJO,
  CEDULA_LONGITUD,
  validarCedula,
  validarTelefono,
} from "../../constants";
import {
  ZONA_FIJA,
  SECTOR_FIJO,
  OPCION_NO_IDENTIFICADO,
} from "../../data/ubicacionElectoral";
import UbicacionElectoralFields from "../ui/UbicacionElectoralFields";

// Cloud Functions
const functions = getFunctions();
const createUserAdminCallable = httpsCallable(functions, "createUserAdmin");
const searchVotanteCallable = httpsCallable(functions, "searchVotanteByCedula");

// Estado inicial de la ubicación electoral (zona y sector fijos por ahora)
const UBICACION_INICIAL = {
  zona: ZONA_FIJA,
  sector: SECTOR_FIJO,
  subsector: "",
  recinto: "",
  colegioElectoral: "",
};

// Convierte "No identificado" en cadena vacía para el payload.
const limpiarUbicacion = (valor) =>
  valor === OPCION_NO_IDENTIFICADO ? "" : valor;

function CreateUser() {
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState(UBICACION_INICIAL);
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(ROL_MULTIPLICADOR);

  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  // Al cambiar un campo de ubicación; si cambia "recinto", resetea el colegio.
  const handleUbicacionChange = (campo, valor) => {
    setUbicacion((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "recinto") {
        next.colegioElectoral = "";
      }
      return next;
    });
  };

  // Autocompletar desde el padrón cuando la cédula está completa
  const buscarVotante = useCallback(async (cedulaFormateada) => {
    setIsSearching(true);
    try {
      const result = await searchVotanteCallable({ cedula: cedulaFormateada });
      const { found, data } = result.data;
      if (found) {
        setNombre(data.nombre || "");
        if (data.telefono) setTelefono(data.telefono);
        setNotification({ message: "Datos cargados desde el padrón.", type: "success" });
      } else {
        setNotification({ message: "Cédula no encontrada en el padrón. Completa los datos manualmente.", type: "info" });
      }
    } catch (error) {
      console.error("Error buscando en el padrón:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Formato visual con guiones (XXX-XXXXXXX-X) + disparo de búsqueda
  const handleCedulaChange = (e) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    const normalized = input.slice(0, 11);
    let formatted = normalized;
    if (normalized.length > 3) formatted = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    if (normalized.length > 10) formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
    setCedula(formatted);
    if (normalized.length === CEDULA_LONGITUD && validarCedula(formatted)) {
      buscarVotante(formatted);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" });

    const cedulaNormalizada = cedula.replace(/-/g, "");
    if (cedulaNormalizada.length !== CEDULA_LONGITUD || !validarCedula(cedula)) {
      setNotification({ message: "Formato de cédula incorrecto (ej: 001-1234567-8).", type: "error" });
      return;
    }
    // Teléfono OBLIGATORIO
    if (!telefono.trim() || !validarTelefono(telefono)) {
      setNotification({ message: "El teléfono es obligatorio (mínimo 7 dígitos).", type: "error" });
      return;
    }
    if (password.length < 6) {
      setNotification({ message: "La contraseña debe tener al menos 6 caracteres.", type: "error" });
      return;
    }
    // Validación de ubicación electoral: sector, subsector, recinto y colegio
    // deben tener valor (incluido "No identificado"). La zona ya viene fija.
    if (
      !ubicacion.sector ||
      !ubicacion.subsector ||
      !ubicacion.recinto ||
      !ubicacion.colegioElectoral
    ) {
      setNotification({
        message:
          "Por favor, completa la ubicación electoral (sector, subsector, recinto y colegio).",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createUserAdminCallable({
        nombre,
        cedula: cedulaNormalizada,
        email, // opcional; el backend sintetiza uno si viene vacío
        telefono,
        provincia: PROVINCIA_FIJA,
        municipio: MUNICIPIO_FIJO,
        // Ubicación electoral ("No identificado" se envía como "")
        zona: limpiarUbicacion(ubicacion.zona),
        sector: limpiarUbicacion(ubicacion.sector),
        subsector: limpiarUbicacion(ubicacion.subsector),
        recinto: limpiarUbicacion(ubicacion.recinto),
        colegioElectoral: limpiarUbicacion(ubicacion.colegioElectoral),
        password,
        rol,
      });

      if (result.data.success) {
        setNotification({ message: result.data.message || "Usuario creado.", type: "success" });
        // Limpiar formulario
        setNombre("");
        setCedula("");
        setEmail("");
        setTelefono("");
        setUbicacion(UBICACION_INICIAL);
        setPassword("");
        setRol(ROL_MULTIPLICADOR);
      }
    } catch (error) {
      console.error("Error al llamar a createUserAdmin:", error);
      setNotification({
        message: error.message || "Ocurrió un error al crear el usuario.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-container">
      <h2>Crear Nuevo Usuario Activista</h2>
      <form onSubmit={handleCreateUser} className="create-user-form">
        <div className="input-group">
          <label htmlFor="cedula">Cédula (Identificación)</label>
          <input
            type="text"
            id="cedula"
            value={cedula}
            onChange={handleCedulaChange}
            required
            disabled={loading || isSearching}
            placeholder="001-0000000-0"
          />
        </div>

        <div className="input-group">
          <label htmlFor="nombre">Nombre Completo</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={loading || isSearching}
          />
        </div>

        <div className="input-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="tel"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
            disabled={loading || isSearching}
            placeholder="809-000-0000"
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Correo Electrónico (opcional)</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || isSearching}
            placeholder="Si se deja vacío, iniciará sesión con la cédula"
          />
        </div>

        {/* Provincia y Municipio fijos (SDO) */}
        <div className="input-group">
          <label htmlFor="provincia">Provincia</label>
          <select id="provincia" value={PROVINCIA_FIJA} disabled>
            <option value={PROVINCIA_FIJA}>{PROVINCIA_FIJA}</option>
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="municipio">Municipio</label>
          <select id="municipio" value={MUNICIPIO_FIJO} disabled>
            <option value={MUNICIPIO_FIJO}>{MUNICIPIO_FIJO}</option>
          </select>
        </div>

        {/* Ubicación electoral: Zona → Sector → Subsector → Recinto → Colegio */}
        <UbicacionElectoralFields
          value={ubicacion}
          onChange={handleUbicacionChange}
          disabled={loading || isSearching}
        />

        <div className="input-group">
          <label htmlFor="password">Contraseña Temporal (mín. 6 caracteres)</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || isSearching}
          />
        </div>

        <div className="input-group">
          <label htmlFor="rol">Asignar Rol</label>
          <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value={ROL_MULTIPLICADOR}>Multiplicador</option>
            <option value={ROL_LIDER}>Lider de Zona</option>
            <option value={ROL_ADMIN}>Administrador</option>
          </select>
        </div>

        <button type="submit" disabled={loading || isSearching}>
          {loading ? "Creando Usuario..." : isSearching ? "Buscando padrón..." : "Crear Usuario"}
        </button>

        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/admin/usuarios")}
          className="back-button"
        >
          Volver a la Lista
        </button>
      </form>
    </div>
  );
}

export default CreateUser;
