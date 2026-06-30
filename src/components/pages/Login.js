import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, functions } from "../../firebase"; // Importamos functions
import { httpsCallable } from "firebase/functions"; // Importamos httpsCallable
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

// Función auxiliar simple
const isEmail = (input) => input.includes("@");

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let userEmailForAuth = "";
    const inputLimpio = identifier.trim();

    try {
      // 1. ESTRATEGIA DE IDENTIFICACIÓN
      if (isEmail(inputLimpio)) {
        // A) Es un correo: lo usamos directamente
        userEmailForAuth = inputLimpio;
      } else {
        // B) Es una Cédula: Preguntamos a la Cloud Function por el correo
        try {
          // Llamamos a la función que ya tienes en index.js
          const getEmailFn = httpsCallable(functions, "getEmailByCedula");
          const result = await getEmailFn({ cedula: inputLimpio });

          if (result.data.success) {
            userEmailForAuth = result.data.email;
            console.log("Email recuperado:", userEmailForAuth);
          } else {
            throw new Error("Cédula no encontrada");
          }
        } catch (lookupError) {
          console.warn("Fallo búsqueda por cédula:", lookupError);
          setError(
            "No encontramos un usuario con esta cédula. Verifica que esté escrita correctamente."
          );
          setLoading(false);
          return; // Detenemos el proceso aquí
        }
      }

      // 2. AUTENTICACIÓN (Login con el correo resuelto)
      await signInWithEmailAndPassword(auth, userEmailForAuth, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error al iniciar sesión:", err);

      // Manejo de errores específicos
      if (err.message === "Cédula no encontrada") {
        setError("Esa cédula no está registrada en el sistema.");
      } else if (err.code === "auth/wrong-password") {
        setError("La contraseña es incorrecta.");
      } else if (err.code === "auth/user-not-found") {
        setError("Usuario no encontrado.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Muchos intentos fallidos. Intenta más tarde.");
      } else {
        setError("Error al iniciar sesión. Inténtalo de nuevo.");
      }
    } finally {
      // Solo desactivamos loading si falló, si tuvo éxito el navigate cambia de página
      if (!window.location.pathname.includes("/dashboard")) {
        setLoading(false);
      }
    }
  };

  // --- Login con Google ---
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // No navegamos manualmente: AuthContext detecta la sesión y
      // PublicOnlyRoute redirige a /dashboard automáticamente.
    } catch (err) {
      // Mostramos el código real de Firebase para poder diagnosticar.
      console.error("Error Google Login:", err.code, err.message);

      switch (err.code) {
        case "auth/popup-closed-by-user":
        case "auth/cancelled-popup-request":
          // El usuario cerró el popup: no es un error real.
          break;
        case "auth/operation-not-allowed":
          setError(
            "El acceso con Google no está habilitado en Firebase (Authentication → Sign-in method)."
          );
          break;
        case "auth/unauthorized-domain":
          setError(
            "Este dominio no está autorizado en Firebase (Authentication → Settings → Authorized domains)."
          );
          break;
        case "auth/popup-blocked":
          // El navegador o la cabecera COOP bloqueó el popup: caemos a redirección.
          try {
            await signInWithRedirect(auth, provider);
            return;
          } catch (redirectErr) {
            console.error("Error Google redirect:", redirectErr.code);
            setError("No se pudo abrir la ventana de Google.");
          }
          break;
        default:
          setError(`No se pudo iniciar sesión con Google. (${err.code})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Acceso de Miembros</h2>
        {error && <p className="error-message">{error}</p>}

        <div className="input-group">
          <label htmlFor="identifier">Correo Electrónico o Cédula</label>
          <input
            type="text"
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={loading}
            placeholder="Ej. juan@gmail.com o 001002..."
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
            disabled={loading}
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </div>

        <div className="divider">O entra con</div>

        <div className="input-group">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-google"
          >
            <img
              src="https://img.icons8.com/color/48/000000/google-logo.png"
              alt="Google"
              className="google-icon"
            />
            Google
          </button>
        </div>

        <div className="extra-links">
          <p>
            ¿No tienes cuenta? <Link to="/registro-app">Regístrate aquí</Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Login;
