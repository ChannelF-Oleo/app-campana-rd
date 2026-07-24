import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, updateDoc } from "firebase/firestore";
import { subirFotoUsuario } from "../../utils/subirFotoUsuario";
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
  normalizarSubsector,
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
  subsectorEsOtro: false,
  recinto: "",
  colegioElectoral: "",
};

// Convierte "No identificado" en cadena vacía para el payload.
const limpiarUbicacion = (valor) =>
  valor === OPCION_NO_IDENTIFICADO ? "" : valor;

function CreateUser() {
  const [nombre, setNombre] = useState("");
  const [apodo, setApodo] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState(UBICACION_INICIAL);
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(ROL_MULTIPLICADOR);

  // Foto OPCIONAL: se elige aquí pero NO se sube hasta que el usuario exista
  // (necesitamos su cédula/uid). Guardamos el File y una URL de preview local.
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  // Revoca la URL de preview al cambiar de foto o al desmontar (evita fugas).
  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  // Al elegir una foto: guardamos el File y generamos la miniatura. NO subimos
  // todavía; la subida ocurre tras crear el usuario en handleCreateUser.
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    setFotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setFotoFile(file || null);
  };

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
    // Subsector "Otro": el texto libre no puede quedar vacío.
    if (ubicacion.subsectorEsOtro && !normalizarSubsector(ubicacion.subsector)) {
      setNotification({ message: "Escribe el subsector", type: "error" });
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
        apodo,
        cedula: cedulaNormalizada,
        email, // opcional; el backend sintetiza uno si viene vacío
        telefono,
        provincia: PROVINCIA_FIJA,
        municipio: MUNICIPIO_FIJO,
        // Ubicación electoral ("No identificado" se envía como "")
        zona: limpiarUbicacion(ubicacion.zona),
        sector: limpiarUbicacion(ubicacion.sector),
        subsector: ubicacion.subsectorEsOtro
          ? normalizarSubsector(ubicacion.subsector)
          : limpiarUbicacion(ubicacion.subsector),
        recinto: limpiarUbicacion(ubicacion.recinto),
        colegioElectoral: limpiarUbicacion(ubicacion.colegioElectoral),
        password,
        rol,
      });

      if (result.data.success) {
        // El usuario YA quedó creado. Si el admin eligió foto, la subimos ahora
        // (aislado): si la subida falla, NO reventamos: el usuario sigue creado
        // y se avisa que la foto puede agregarse editándolo.
        let mensaje = result.data.message || "Usuario creado.";
        let tipo = "success";
        if (fotoFile) {
          setSubiendoFoto(true);
          try {
            const { fotoPath } = await subirFotoUsuario(fotoFile, cedulaNormalizada);
            // Persistimos la ruta en el doc del usuario recién creado (id === uid).
            if (result.data.uid) {
              await updateDoc(doc(db, "users", result.data.uid), { fotoPath });
            }
          } catch (fotoError) {
            console.error("Error subiendo la foto del nuevo usuario:", fotoError);
            mensaje =
              "Usuario creado, pero la foto no se pudo subir (agrégala editando el usuario).";
            tipo = "info";
          } finally {
            setSubiendoFoto(false);
          }
        }

        setNotification({ message: mensaje, type: tipo });
        // Limpiar formulario
        setNombre("");
        setApodo("");
        setCedula("");
        setEmail("");
        setTelefono("");
        setUbicacion(UBICACION_INICIAL);
        setPassword("");
        setRol(ROL_MULTIPLICADOR);
        setFotoFile(null);
        setFotoPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
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
          <label htmlFor="apodo">Apodo (opcional)</label>
          <input
            type="text"
            id="apodo"
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
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

        <div className="input-group">
          <label htmlFor="foto">Foto (opcional)</label>
          <input
            type="file"
            id="foto"
            accept="image/*"
            onChange={handleFotoChange}
            disabled={loading || isSearching}
            className="foto-input"
          />
          {fotoPreview && (
            <div className="foto-preview-wrapper">
              <img
                src={fotoPreview}
                alt="Vista previa de la foto"
                className="foto-preview-img"
              />
            </div>
          )}
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
          {loading
            ? subiendoFoto
              ? "Subiendo foto..."
              : "Creando..."
            : isSearching
            ? "Buscando padrón..."
            : "Crear Usuario"}
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
