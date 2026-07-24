import React, { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getDoc } from "firebase/firestore";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useAnalytics } from "../../utils/analytics";
import {
  ZONA_FIJA,
  SECTOR_FIJO,
  OPCION_NO_IDENTIFICADO,
  normalizarSubsector,
} from "../../data/ubicacionElectoral";
import UbicacionElectoralFields from "../ui/UbicacionElectoralFields";
import logo from "../../Felix/Inscribete.png";
import {
  PROVINCIA_FIJA,
  MUNICIPIO_FIJO,
  MAP_INITIAL_CENTER,
  MAP_DEFAULT_ZOOM,
  CEDULA_REGEX,
} from "../../constants";

const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  marginBottom: "20px",
  borderRadius: "8px",
};
const initialCenter = MAP_INITIAL_CENTER;
const defaultZoom = MAP_DEFAULT_ZOOM;
const libraries = ["places"];

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

function useQuery() {
  const location = useLocation();
  return React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
}

const validarCedula = (cedula) => CEDULA_REGEX.test(cedula);
const validarTelefono = (telefono) => {
  const telefonoRegex = /^[\d\s-]{7,}$/;
  return telefono === "" || telefonoRegex.test(telefono);
};

const functions = getFunctions();
const registerSimpatizanteCallable = httpsCallable(functions, "registerSimpatizante");
const searchVotanteCallable = httpsCallable(functions, "searchVotanteByCedula");

function PublicRegister() {
  // Form field states
  const [nombre, setNombre] = useState("");
  const [apodo, setApodo] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Estados de carga y búsqueda
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { trackCampaignEvents } = useAnalytics();

  const [selectedProvincia, setSelectedProvincia] = useState(PROVINCIA_FIJA);
  const [selectedMunicipio, setSelectedMunicipio] = useState(MUNICIPIO_FIJO);
  const [ubicacion, setUbicacion] = useState(UBICACION_INICIAL);
  const [coordinates, setCoordinates] = useState(initialCenter);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const queryParams = useQuery();
  const referrerId = queryParams.get("ref");
  const navigate = useNavigate();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries,
  });

  const onMarkerDragEnd = useCallback((event) => {
    setCoordinates({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  }, []);

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

  const handleCedulaSearch = useCallback(async (inputCedula) => {
    const cedulaNormalizada = inputCedula.replace(/-/g, "");

    if (cedulaNormalizada.length === 11 && validarCedula(inputCedula)) {
      setIsSearching(true);
      setNotification({ message: "Buscando datos...", type: "info" });

      try {
        const result = await searchVotanteCallable({ cedula: inputCedula });
        const { found, data } = result.data;

        if (found) {
          setNombre(data.nombre);

          if (data.telefono) setTelefono(data.telefono);

          setNotification({
            message: "Datos cargados correctamente.",
            type: "success",
          });
        } else {
          setNombre("");
          setNotification({
            message: "No encontrado en el padrón.",
            type: "error",
          });
        }
      } catch (error) {
        console.error(error);
        setNotification({ message: "Error de conexión.", type: "error" });
      } finally {
        setIsSearching(false);
      }
    }
  }, []);

  const handleCedulaChange = (e) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    const normalized = input.slice(0, 11);

    let formatted = normalized;
    if (normalized.length > 3) {
      formatted = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    }
    if (normalized.length > 10) {
      formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
    }

    setCedula(formatted);

    if (normalized.length === 11) {
      if (validarCedula(formatted)) {
        handleCedulaSearch(formatted);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" });

    if (isSearching || loading) return;

    if (!aceptaTerminos) {
      setNotification({ message: "Debes aceptar los términos y condiciones.", type: "error" });
      return;
    }

    const cedulaNormalizada = cedula.replace(/-/g, "");
    if (cedulaNormalizada.length !== 11) {
      setNotification({ message: "Formato de cédula incorrecto (debe tener 11 dígitos).", type: "error" });
      return;
    }

    const cedulaFormateada = `${cedulaNormalizada.substring(0, 3)}-${cedulaNormalizada.substring(3, 10)}-${cedulaNormalizada.substring(10, 11)}`;
    if (!validarCedula(cedulaFormateada)) {
      setNotification({ message: "Formato de cédula incorrecto (ej: 001-1234567-8).", type: "error" });
      return;
    }
    if (!validarTelefono(telefono)) {
      setNotification({ message: "Teléfono inválido (mínimo 7 dígitos).", type: "error" });
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

    if (!coordinates || (coordinates.lat === initialCenter.lat && coordinates.lng === initialCenter.lng)) {
      setNotification({
        message: "Por favor, arrastra el pin en el mapa para especificar tu ubicación exacta.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    let registeredByData = {
      registradoPor: "Página Pública",
      registradoPorEmail: null,
    };

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
          setNotification({ message: "El enlace de referido no es válido.", type: "error" });
          setLoading(false);
          navigate("/registro");
          return;
        }
      } catch (error) {
        setNotification({ message: "Error al verificar el referido.", type: "error" });
        setLoading(false);
        return;
      }
    }

    try {
      const registrationData = {
        nombre,
        apodo,
        cedula: cedulaFormateada,
        telefono,
        provincia: selectedProvincia,
        municipio: selectedMunicipio,
        // Ubicación electoral ("No identificado" se envía como "")
        zona: limpiarUbicacion(ubicacion.zona),
        sector: limpiarUbicacion(ubicacion.sector),
        subsector: ubicacion.subsectorEsOtro
          ? normalizarSubsector(ubicacion.subsector)
          : limpiarUbicacion(ubicacion.subsector),
        recinto: limpiarUbicacion(ubicacion.recinto),
        colegioElectoral: limpiarUbicacion(ubicacion.colegioElectoral),
        lat: coordinates.lat,
        lng: coordinates.lng,
        ...registeredByData,
      };

      const result = await registerSimpatizanteCallable(registrationData);

      if (result.data.success) {
        setNotification({ message: result.data.message, type: "success" });

        trackCampaignEvents.registerSimpatizante();

        // Limpiar el estado del formulario
        setNombre("");
        setApodo("");
        setCedula("");
        setTelefono("");
        setAceptaTerminos(false);
        setSelectedProvincia(PROVINCIA_FIJA);
        setSelectedMunicipio(MUNICIPIO_FIJO);
        setUbicacion(UBICACION_INICIAL);
        setCoordinates(initialCenter);
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

  if (loadError)
    return (
      <div className="register-container">
        <p className="notification error">
          Error al cargar el mapa de Google Maps. Por favor, verifica la clave API.
        </p>
      </div>
    );

  if (!isLoaded)
    return (
      <div className="register-container">
        <p className="notification success">Cargando formulario y mapa...</p>
      </div>
    );

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        {referrerId && (
          <p className="referrer-info">Registro referido por un activista.</p>
        )}
        <div className="logo-container">
          <img src={logo} alt="Inscríbete" className="register-logo" />
        </div>
        <h2>Regístrate como simpatizante de Felix Encarnación</h2>
        <p>¡Quiero ser parte!</p>

        {/* Cédula */}
        <div className="input-group">
          <label htmlFor="cedula">Cédula de Identidad</label>
          <input
            type="text"
            id="cedula"
            placeholder="001-1234567-8"
            value={cedula}
            onChange={handleCedulaChange}
            required
            disabled={isSearching || loading}
          />
        </div>

        {/* Nombre */}
        <div className="input-group">
          <label htmlFor="nombre">Nombre Completo</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={isSearching || loading}
          />
        </div>

        {/* Apodo (opcional) */}
        <div className="input-group">
          <label htmlFor="apodo">Apodo (opcional)</label>
          <input
            type="text"
            id="apodo"
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            disabled={isSearching || loading}
          />
        </div>

        {/* Teléfono */}
        <div className="input-group">
          <label htmlFor="telefono">Teléfono / Celular</label>
          <input
            type="tel"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={isSearching || loading}
          />
        </div>

        {/* Provincia */}
        <div className="input-group">
          <label htmlFor="provincia">Provincia</label>
          <select
            id="provincia"
            value={selectedProvincia}
            onChange={(e) => setSelectedProvincia(e.target.value)}
            required
            disabled={true}
          >
            <option value={PROVINCIA_FIJA}>{PROVINCIA_FIJA}</option>
          </select>
        </div>

        {/* Municipio */}
        <div className="input-group">
          <label htmlFor="municipio">Municipio</label>
          <select
            id="municipio"
            value={selectedMunicipio}
            onChange={(e) => setSelectedMunicipio(e.target.value)}
            required
            disabled={true}
          >
            <option value={MUNICIPIO_FIJO}>{MUNICIPIO_FIJO}</option>
          </select>
        </div>

        {/* Ubicación electoral: Zona → Sector → Subsector → Recinto → Colegio */}
        <UbicacionElectoralFields
          value={ubicacion}
          onChange={handleUbicacionChange}
          disabled={isSearching || loading}
        />

        {/* Google Maps */}
        <div className="map-group input-group">
          <label className="map-label">
            📍 Ubicación Exacta (Arrastra el Pin)
          </label>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={defaultZoom}
            center={coordinates}
          >
            <Marker
              position={coordinates}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
            />
          </GoogleMap>
          <p className="coords-display">
            Coordenadas: Lat: {coordinates.lat.toFixed(6)}, Lng:{" "}
            {coordinates.lng.toFixed(6)}
          </p>
        </div>

        {/* Checkbox de Términos */}
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="terminos"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            required
            disabled={isSearching || loading}
          />
          <label htmlFor="terminos">Acepto los términos y condiciones.</label>
        </div>

        <button type="submit" disabled={loading || isSearching}>
          {loading
            ? "Registrando..."
            : isSearching
            ? "Buscando..."
            : "Firmar y Enviar"}
        </button>

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
