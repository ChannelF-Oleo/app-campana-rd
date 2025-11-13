import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase"; // db needed for getDoc
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getDoc } from "firebase/firestore";
import { ubicacionesData } from "../data/ubicaciones.js";
import "./PublicRegister.css";
import logo from "../Felix/Inscribete.png";


// Function to get URL parameters
function useQuery() {
  const location = useLocation();
  return React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
}

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

function PublicRegister() {
  // Form field states
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [colegioElectoral, setColegioElectoral] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  // Dropdown states
  const [selectedProvincia, setSelectedProvincia] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [municipios, setMunicipios] = useState([]);
  const [sectores, setSectores] = useState([]);
  // Notification state
  const [notification, setNotification] = useState({ message: "", type: "" }); // type: 'success' or 'error'

  const queryParams = useQuery();
  const referrerId = queryParams.get("ref");
  const navigate = useNavigate();

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
    if (!aceptaTerminos) {
      setNotification({
        message: "Debes aceptar los términos y condiciones.",
        type: "error",
      });
      return;
    }
    const cedulaNormalizada = cedula.replace(/-/g, "");
    // Ensure normalization doesn't fail if input is too short
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

    let registeredByData = {
      registradoPor: "Página Pública",
      registradoPorEmail: null,
    };

    // Fetch referrer data if ID exists
    if (referrerId) {
      try {
        const userDocRef = doc(db, "users", referrerId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          registeredByData = {
            registradoPor: referrerId,
            registradoPorEmail: userDocSnap.data().email,
          };
        } else {
          setNotification({
            message: "El enlace de referido no es válido.",
            type: "error",
          });
          setLoading(false);
          navigate("/registro");
          return;
        }
      } catch (error) {
        setNotification({
          message: "Error al verificar el referido.",
          type: "error",
        });
        setLoading(false);
        return;
      }
    }

    // Call the Callable Function
    try {
      const result = await registerSimpatizanteCallable({
        nombre,
        cedula: cedulaFormateada,
        email,
        telefono,
        direccion,
        colegioElectoral,
        provincia: selectedProvincia,
        municipio: selectedMunicipio,
        sector: selectedSector,
        ...registeredByData,
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
        setAceptaTerminos(false);
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
        {referrerId && (
          <p className="referrer-info">Registro referido por un activista.</p>
        )}
       <div className="logo-container"><img src={logo} alt="Inscríbete" className="register-logo" /></div> 
        <h2>Registrate como simpatizante</h2>
        <p>¡Quiero ser parte!</p>

        {/* Form Fields */}

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
          <label htmlFor="telefono">Teléfono / Celular</label>
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
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="terminos"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            required
          />
          <label htmlFor="terminos">Acepto los términos y condiciones.</label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Firmar y Enviar"}
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

export default PublicRegister;
