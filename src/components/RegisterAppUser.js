import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, functions } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

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
  const registerSimpatizanteCallable = httpsCallable(functions, "registerSimpatizante");

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

    try {
      // 1. Crear el Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Guardar el nuevo usuario en la colección 'users' (sobrescribe la creación automática si llega antes)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        nombre: nombre,
        email: email,
        cedula: cedula,
        rol: "multiplicador",
        registrationCount: 0,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        metodoRegistro: "email"
      });

      // 3. Registrar como Simpatizante (si no está registrado aún)
      try {
        await registerSimpatizanteCallable({
          nombre: nombre,
          cedula: cedula,
          email: email,
          telefono: votanteData?.telefono || "",
          direccion: votanteData?.direccion || "",
          colegioElectoral: votanteData?.colegioElectoral || "",
          sector: votanteData?.sector || "N/A",
          municipio: votanteData?.municipio || "N/A",
          provincia: votanteData?.provincia || "N/A",
          registradoPor: "App Reg Automático",
          esUsuarioInterno: true
        });
      } catch (simpErr) {
        // Ignoramos si "Ya registrado", eso está bien porque no duplicamos.
        console.warn("Registrando simpatizante fallback:", simpErr);
      }

      // 4. Redirigir al inicio
      navigate("/dashboard");

    } catch (err) {
      console.error("Error al registrar:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado.");
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
