import React, { useState, useEffect, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  GoogleMap,
  useLoadScript,
  Marker,
} from "@react-google-maps/api"; // Cambiado: Marker -> AdvancedMarkerElement
 
import { ubicacionesData } from "../data/ubicaciones.js";
import "./PublicRegister.css"; // Reusing styles

const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY; // Corregido: Prefijo de la variable de entorno

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
const libraries = ["places", "marker"]; // Añadido: Cargar la librería 'marker'

// Validation Functions (Mantenemos las tuyas)
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

  // NUEVO: Función para geocodificar una dirección y centrar el mapa
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

  // Effects for location cascades (Mantenemos los tuyos)
  useEffect(() => {
    if (selectedProvincia) {
      const provinciaEncontrada = ubicacionesData.find(
        (p) => p.provincia === selectedProvincia
      );
      setMunicipios(provinciaEncontrada ? provinciaEncontrada.municipios : []);
      setSelectedMunicipio("");
      geocodeAddress(selectedProvincia); // Centrar el mapa en la provincia
      setSectores([]);
    } else {
      setMunicipios([]);
      setSectores([]);
    }
  }, [selectedProvincia, geocodeAddress]);

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
  }, [selectedMunicipio, selectedProvincia]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" }); // Clear previous notification

    // Validations (Mantenemos las tuyas)
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
      // return; // Decide si quieres que la ubicación sea obligatoria
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
        // NUEVO: Enviar las coordenadas
        lat: coordinates.lat,
        lng: coordinates.lng,
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
        setCoordinates(initialCenter); // Resetear coordenadas
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

        {/* Form Fields... (Mantenemos los tuyos) */}

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

        {/* ---------------------------------------------------- */}
        {/* NUEVO: Contenedor del Mapa de Google Maps */}
        {/* ---------------------------------------------------- */}
        <div className="map-group">
          <label>📍 Ubicación Exacta (Arrastra el Pin)</label>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={defaultZoom}
            center={coordinates} // Centrar en la ubicación seleccionada
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {/* Marcador Movible */}

            <Marker
              position={coordinates}
              draggable={true} // Permitir arrastrar el marcador
              onDragEnd={onMarkerDragEnd} // Capturar las nuevas coordenadas
            />
          </GoogleMap>
          <p className="coords-display">
            Coordenadas: Lat: {coordinates.lat.toFixed(6)}, Lng:{" "}
            {coordinates.lng.toFixed(6)}
          </p>
        </div>
        {/* ---------------------------------------------------- */}
        {/* FIN del Contenedor del Mapa */}
        {/* ---------------------------------------------------- */}

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
