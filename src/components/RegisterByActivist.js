import React, { useState, useEffect, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

import { ubicacionesData } from "../data/ubicaciones.js";
import "./PublicRegister.css"; // Reusing styles

const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// [INICIO CORRECCIÓN SDO]
const PROVINCIA_FIJA = "Santo Domingo";
const MUNICIPIO_FIJO = "Santo Domingo Oeste";

// Cargar sectores fijos de SDO una sola vez
const provinciaSDO = ubicacionesData.find(
  (p) => p.provincia === PROVINCIA_FIJA
);
const municipioData = provinciaSDO
  ? provinciaSDO.municipios.find((m) => m.municipio === MUNICIPIO_FIJO)
  : null;
const sectoresSDO = municipioData ? municipioData.sectores : [];
// [FIN CORRECCIÓN SDO]

// Opciones del mapa
const mapContainerStyle = {
  width: "100%",
  height: "400px",
  marginBottom: "15px",
};
// Centro inicial: Por ejemplo, Santo Domingo, República Dominicana
const initialCenter = {
  lat: 18.4861,
  lng: -69.9309,
};
const defaultZoom = 12;
const libraries = ["places", "marker"];

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
const searchVotanteCallable = httpsCallable(functions, "searchVotanteByCedula");

function RegisterByActivist({ user }) {
  // Form field states
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [colegioElectoral, setColegioElectoral] = useState("");
  // Estados de carga y búsqueda
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Dropdown states: Inicializados a valores fijos
  const [selectedProvincia, setSelectedProvincia] = useState(PROVINCIA_FIJA);
  const [selectedMunicipio, setSelectedMunicipio] = useState(MUNICIPIO_FIJO);
  const [selectedSector, setSelectedSector] = useState("");

  // NUEVO: Estado para las coordenadas (ubicación pineada)
  const [coordinates, setCoordinates] = useState(initialCenter);
  // Estado para el mapa (referencia)
  const [map, setMap] = useState(null);

  // Cargar script de Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries,
  });

  // Función para manejar el movimiento del marcador
  const onMarkerDragEnd = useCallback((event) => {
    setCoordinates({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  }, []);

  // Guardar la referencia del mapa
  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  // Limpiar la referencia del mapa
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Función para geocodificar una dirección y centrar el mapa
  const geocodeAddress = useCallback(
    (address) => {
      if (!isLoaded || !map) return;
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { address: `${address}, República Dominicana` },
        (results, status) => {
          if (status === "OK" && results[0]) {
            const location = results[0].geometry.location;
            map.panTo(location);
          } else {
            console.error(
              `La geocodificación falló por la siguiente razón: ${status}`
            );
          }
        }
      );
    },
    [isLoaded, map]
  );
  // Notification state
  const [notification, setNotification] = useState({ message: "", type: "" });

  // NUEVA FUNCIÓN: Buscar votante al ingresar cédula válida
  // En PublicRegister.js y RegisterByActivist.js

  const handleCedulaSearch = useCallback(async (inputCedula) => {
    const cedulaNormalizada = inputCedula.replace(/-/g, "");

    if (cedulaNormalizada.length === 11 && validarCedula(inputCedula)) {
      setIsSearching(true);
      setNotification({ message: "Buscando datos...", type: "info" });

      try {
        const result = await searchVotanteCallable({ cedula: inputCedula });
        const { found, data } = result.data;

        if (found) {
          // 1. Llenar Nombre y Colegio (Origen)
          setNombre(data.nombre);
          setColegioElectoral(data.colegioElectoral || "");

          // 2. NUEVO: Llenar Teléfono y Dirección si existen
          if (data.telefono) setTelefono(data.telefono);
          if (data.direccion) setDireccion(data.direccion);

          // 3. Llenar Sector (Solo si coincide con SDO)
          const foundSector = sectoresSDO.includes(data.sector)
            ? data.sector
            : "";
          setSelectedSector(foundSector);

          setNotification({
            message: "Datos cargados correctamente.",
            type: "success",
          });
        } else {
          // Si no aparece, limpiamos para que escriban manualmente
          setNombre("");
          setColegioElectoral("");
          setSelectedSector("");
          // Opcional: Limpiar o mantener tel/dir si quieres
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
    // 1. Obtener valor limpio (solo números)
    const input = e.target.value.replace(/[^0-9]/g, "");

    // 2. Limitar a 11 dígitos máximo
    const normalized = input.slice(0, 11);

    // 3. Aplicar formato visual (XXX-XXXXXXX-X)
    let formatted = normalized;
    if (normalized.length > 3) {
      formatted = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    }
    if (normalized.length > 10) {
      formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
    }

    // 4. Actualizar estado SIEMPRE (Esto arregla el bloqueo)
    setCedula(formatted);

    // 5. Disparar búsqueda si está completa
    if (normalized.length === 11) {
      // Validamos con tu regex existente para seguridad extra
      if (validarCedula(formatted)) {
        handleCedulaSearch(formatted);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" });

    if (isSearching || loading) return;

    // Validations (ajustadas para el nuevo flujo fijo de ubicación)
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
    // VALIDACIÓN SIMPLIFICADA: Solo se revisa el Sector
    if (!selectedSector) {
      setNotification({
        message: "Por favor, selecciona un Sector.",
        type: "error",
      });
      return;
    }

    // Opcional: Validar que el pin esté ubicado
    if (
      !coordinates ||
      (coordinates.lat === initialCenter.lat &&
        coordinates.lng === initialCenter.lng)
    ) {
      setNotification({
        message:
          "Por favor, arrastra el pin en el mapa para especificar la ubicación.",
        type: "error",
      });
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
        provincia: selectedProvincia, // Valor fijo: Santo Domingo
        municipio: selectedMunicipio, // Valor fijo: Santo Domingo Oeste
        sector: selectedSector,
        // NUEVO: Enviar las coordenadas
        lat: coordinates.lat,
        lng: coordinates.lng,
        // Pass activist's data
        registradoPor: user.uid,
        registradoPorEmail: user.email,
      });

      if (result.data.success) {
        setNotification({ message: result.data.message, type: "success" });
        // Clear form y reset location states a fixed values
        setNombre("");
        setCedula("");
        setEmail("");
        setTelefono("");
        setDireccion("");
        setColegioElectoral("");
        setSelectedProvincia(PROVINCIA_FIJA);
        setSelectedMunicipio(MUNICIPIO_FIJO);
        setSelectedSector("");
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

  if (loadError) return <div>Error al cargar Google Maps.</div>;
  if (!isLoaded) return <div>Cargando Mapa...</div>;

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Registrar Nuevo Simpatizante</h2>
        <p>Los datos se asociarán a tu perfil.</p>

        {/* Cédula: Nuevo manejo de cambio */}
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
        <div className="input-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSearching || loading}
          />
        </div>
        <div className="input-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="tel"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={isSearching || loading}
          />
        </div>

        {/* Provincia: Fija y deshabilitada */}
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
        {/* Municipio: Fijo y deshabilitado */}
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
        {/* Sector: Ahora usa la lista fija de SDO y es editable/autocompletable */}
        <div className="input-group">
          <label htmlFor="sector">Sector o Barrio</label>
          <select
            id="sector"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            required
            disabled={sectoresSDO.length === 0 || isSearching || loading}
          >
            <option value="">-- Selecciona --</option>
            {sectoresSDO.map((s) => (
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
            disabled={isSearching || loading}
          />
        </div>
        <div className="input-group">
          <label htmlFor="colegio">Colegio Electoral (Opcional)</label>
          <input
            type="text"
            id="colegio"
            value={colegioElectoral}
            onChange={(e) => setColegioElectoral(e.target.value)}
            disabled={isSearching || loading}
          />
        </div>

        {/* ---------------------------------------------------- */}
        {/* Contenedor del Mapa de Google Maps */}
        {/* ---------------------------------------------------- */}
        <div className="map-group">
          <label>📍 Ubicación Exacta (Arrastra el Pin)</label>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={defaultZoom}
            center={coordinates}
            onLoad={onLoad}
            onUnmount={onUnmount}
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

        <button type="submit" disabled={loading || isSearching}>
          {loading
            ? "Registrando..."
            : isSearching
            ? "Buscando..."
            : "Registrar Simpatizante"}
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
