import React, { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
// No need for db or getDoc here unless verifying referrer (which isn't needed here)
import { ubicacionesData } from "../data/ubicaciones.js";
import "./PublicRegister.css"; // Reusing styles

// Validation Functions
const validarCedula = (cedula) => {
  const cedulaRegex = /^\d{3}-?\d{7}-?\d{1}$/;
  return cedulaRegex.test(cedula);
};
const validarTelefono = (telefono) => {
  const telefonoRegex = /^[\d\s-]{7,}$/;
  return telefono === "" || telefonoRegex.test(telefono);
};

// Initialize Firebase Functions connection
const functions = getFunctions();
const registerSimpatizanteCallable = httpsCallable(
  functions,
  "registerSimpatizante"
);

function RegisterByActivist({ user }) {
  // Receives the activist user object
  // Form field states
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [colegioElectoral, setColegioElectoral] = useState("");
  const [loading, setLoading] = useState(false);
  // Dropdown states
  const [selectedProvincia, setSelectedProvincia] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [municipios, setMunicipios] = useState([]);
  const [sectores, setSectores] = useState([]);
  // Notification state
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Effect for provincia -> municipio cascade
  useEffect(() => {
    if (selectedProvincia) {
      const provinciaEncontrada = ubicacionesData.find(
        (p) => p.provincia === selectedProvincia
      );
      setMunicipios(provinciaEncontrada ? provinciaEncontrada.municipios : []);
      setSelectedMunicipio("");
      setSectores([]);
    } else {
      setMunicipios([]);
      setSectores([]);
    }
  }, [selectedProvincia]);

  // Effect for municipio -> sector cascade
  useEffect(() => {
    if (selectedMunicipio) {
      const provinciaActual = ubicacionesData.find(
        (p) => p.provincia === selectedProvincia
      );
      if (provinciaActual) {
        const municipioActual = provinciaActual.municipios.find(
          (m) => m.municipio === selectedMunicipio
        );
        setSectores(municipioActual ? municipioActual.sectores : []);
      } else {
        setSectores([]);
      }
      setSelectedSector("");
    } else {
      setSectores([]);
    }
  }, [selectedMunicipio, selectedProvincia]); // Corrected dependency

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" }); // Clear previous notification

    // Validations
    const cedulaNormalizada = cedula.replace(/-/g, "");
    if (cedulaNormalizada.length !== 11) {
      setNotification({
        message: "Formato de cédula incorrecto (debe tener 11 dígitos).",
        type: "error",
      });
      return;
    }
    const cedulaFormateada = `${cedulaNormalizada.substring(
      0,
      3
    )}-${cedulaNormalizada.substring(3, 10)}-${cedulaNormalizada.substring(
      10,
      11
    )}`;
    if (!validarCedula(cedulaFormateada)) {
      setNotification({
        message: "Formato de cédula incorrecto (ej: 001-1234567-8).",
        type: "error",
      });
      return;
    }
    if (!validarTelefono(telefono)) {
      setNotification({
        message: "Teléfono inválido (mínimo 7 dígitos).",
        type: "error",
      });
      return;
    }
    if (!selectedProvincia || !selectedMunicipio || !selectedSector) {
      setNotification({
        message: "Por favor, selecciona Provincia, Municipio y Sector.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    // Call the Callable Function
    try {
      const result = await registerSimpatizanteCallable({
        // Pass form data
        nombre,
        cedula: cedulaFormateada,
        email,
        telefono,
        direccion,
        colegioElectoral,
        provincia: selectedProvincia,
        municipio: selectedMunicipio,
        sector: selectedSector,
        // Pass activist's data
        registradoPor: user.uid,
        registradoPorEmail: user.email,
      });

      if (result.data.success) {
        setNotification({ message: result.data.message, type: "success" });
        // Clear form
        setNombre("");
        setCedula("");
        setEmail("");
        setTelefono("");
        setDireccion("");
        setColegioElectoral("");
        setSelectedProvincia("");
        setSelectedMunicipio("");
        setSelectedSector("");
      } else {
        setNotification({ message: result.data.message, type: "error" });
      }
    } catch (error) {
      console.error("Error calling registerSimpatizante:", error);
      setNotification({
        message: error.message || "No se pudo completar el registro.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Registrar Nuevo Simpatizante</h2>
        <p>Los datos se asociarán a tu perfil.</p>

        {/* Form Fields */}
        <div className="input-group">
          <label htmlFor="nombre">Nombre Completo</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="cedula">Cédula de Identidad</label>
          <input
            type="text"
            id="cedula"
            placeholder="001-1234567-8"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="tel"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="provincia">Provincia</label>
          <select
            id="provincia"
            value={selectedProvincia}
            onChange={(e) => setSelectedProvincia(e.target.value)}
            required
          >
            <option value="">-- Selecciona --</option>
            {ubicacionesData.map((p) => (
              <option key={p.provincia} value={p.provincia}>
                {p.provincia}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="municipio">Municipio</label>
          <select
            id="municipio"
            value={selectedMunicipio}
            onChange={(e) => setSelectedMunicipio(e.target.value)}
            required
            disabled={!selectedProvincia}
          >
            <option value="">-- Selecciona --</option>
            {municipios.map((m) => (
              <option key={m.municipio} value={m.municipio}>
                {m.municipio}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="sector">Sector o Barrio</label>
          <select
            id="sector"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            required
            disabled={!selectedMunicipio}
          >
            <option value="">-- Selecciona --</option>
            {Array.isArray(sectores) &&
              sectores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="direccion">Dirección</label>
          <input
            type="text"
            id="direccion"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="colegio">Colegio Electoral (Opcional)</label>
          <input
            type="text"
            id="colegio"
            value={colegioElectoral}
            onChange={(e) => setColegioElectoral(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrar Simpatizante"}
        </button>

        {/* Notification Area */}
        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
      </form>
    </div>
  );
}

export default RegisterByActivist;
