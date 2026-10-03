import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, functions } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { normalizarCedula } from "../../constants";

function RegisterAppUser() {
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [votanteData, setVotanteData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const searchVotanteCallable = httpsCallable(functions, "searchVotanteByCedula");
  const registerAppUserCallable = httpsCallable(functions, "registerAppUser");

  const validarCedula = (ced) => {
    return /^\d{3}-?\d{7}-?\d{1}$/.test(ced);
  };

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

    // Auto-buscar en el padrón cuando tiene 11 dígitos
    if (normalized.length === 11 && validarCedula(formatted)) {
      buscarVotante(formatted);
    }
  };

  const buscarVotante = async (cedulaBuscada) => {
    setIsSearching(true);
    setError("");
    setSuccessMsg("");
    try {
      const result = await searchVotanteCallable({ cedula: cedulaBuscada });
      const { found, data } = result.data;
      
      if (found) {
        setNombre(data.nombre);
        setVotanteData(data); // Guardamos toda la data del padrón para el simpatizante
        setSuccessMsg("Cédula encontrada en el padrón.");
      } else {
        setNombre("");
        setVotanteData(null);
        setError("Cédula no encontrada en el padrón. Puedes continuar escribiendo tu nombre.");
      }
    } catch (err) {
      console.error(err);
      setError("Error buscando en el padrón.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!validarCedula(cedula)) {
      setError("Formato de cédula incorrecto.");
      return;
    }

    setLoading(true);
    setError("");

    // Estándar: cédula SOLO dígitos en Firestore.
    const cedulaNorm = normalizarCedula(cedula);

    try {
      // El alta (Auth + perfil + simpatizante vinculado) la hace el servidor,
      // que rechaza la cédula si ya pertenece a otro usuario.
      await registerAppUserCallable({
        nombre,
        cedula: cedulaNorm,
        email,
        password,
        telefono: votanteData?.telefono || "",
        municipio: votanteData?.municipio || "",
        provincia: votanteData?.provincia || "",
      });

      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error al registrar:", err);
      // Los errores del callable ya traen un mensaje legible (cédula o correo
      // duplicados, datos inválidos).
      if (
        err.code === "functions/already-exists" ||
        err.code === "functions/invalid-argument"
      ) {
        setError(err.message);
      } else {
        setError("Ocurrió un error al intentar crear tu cuenta.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleRegister}>
        <h2>Crear una Cuenta</h2>
        
        {error && <p className="error-message">{error}</p>}
        {successMsg && <p className="success-message" style={{ color: "green", fontSize: "0.9rem", marginBottom: "15px" }}>{successMsg}</p>}

        <div className="input-group">
          <label htmlFor="cedula">Cédula</label>
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
            placeholder="Tu nombre completo"
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
            disabled={loading || isSearching}
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || isSearching}
            minLength="6"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary" disabled={loading || isSearching}>
            {loading ? "Creando Cuenta..." : isSearching ? "Buscando Padrón..." : "Registrarse"}
          </button>
        </div>

        <div className="extra-links">
          <p>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión aquí</Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default RegisterAppUser;
