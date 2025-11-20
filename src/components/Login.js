import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Importamos setDoc y getDoc
import './Login.css';


// Constante para el dominio temporal de cédula (debe coincidir con SignUp)
const CEDULA_DOMAIN = '@cedula.temp'; 

// Función auxiliar para validar si la entrada es un correo electrónico o no
const isEmail = (input) => {
  // Verificación simple de si incluye el símbolo '@'
  return input.includes('@');
};

function Login() {
  // Cambiamos 'email' por 'identifier' (puede ser correo o cédula)
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- Lógica de Inicio de Sesión Manual (Email/Cédula) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let userEmailForAuth = '';

    // 1. AJUSTAR EL IDENTIFICADOR PARA FIREBASE AUTH
    if (isEmail(identifier)) {
      // Si tiene '@', lo usamos directamente
      userEmailForAuth = identifier.trim();
    } else {
      // Si es una cédula, agregamos el dominio de marcador (debe coincidir con el registro)
      userEmailForAuth = identifier.trim() + CEDULA_DOMAIN;
    }

    // 2. INICIAR SESIÓN EN FIREBASE AUTH
    try {
      await signInWithEmailAndPassword(auth, userEmailForAuth, password); 
      navigate('/dashboard'); 
    } catch (err) {
      console.error("Error al iniciar sesión:", err.message);
      setError('Credenciales incorrectas. Por favor, verifica tu identificación y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Inicio de Sesión con Google ---
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      // Abrir el popup de Google y esperar el resultado
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 1. Verificar si el usuario ya existe en Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // 2. Si es un usuario NUEVO de Google, creamos su documento en Firestore
        await setDoc(userDocRef, {
          uid: user.uid,
          nombre: user.displayName || 'Activista Google',
          email: user.email,
          rol: 'multiplicador', // Rol por defecto, como lo solicitaste
          cedula: null, // Campo vacío para ser llenado después
          fechaRegistro: new Date().toISOString(),
        });
      }
      
      // 3. Redirigir al dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error("Error al iniciar sesión con Google:", err.message);
      // Algunos errores comunes incluyen el cierre del popup por el usuario
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
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
        
        {/* 🆕 BOTÓN DE GOOGLE (Siempre visible para facilitar el acceso) */}
       
        
        <div className="divider">Usa tu Email/Cédula</div> {/* Divisor */}

        <div className="input-group">
          <label htmlFor="identifier">Correo Electrónico o Cédula</label>
          <input
            type="text" // Cambiamos a 'text' para aceptar cédula
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={loading}
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
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </div>
        <div className="input-group">
            <button 
                type="button" 
                onClick={handleGoogleLogin} 
                disabled={loading}
                className="btn-google"
            >
                <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" className="google-icon"/>
                Inicia sesión con Google
            </button>
        </div>
        <div className="extra-links">
          <p>¿No tienes una cuenta de activista?</p> 
          <p> <Link to="/signup">Regístrate aquí</Link></p>
        </div>
      </form>
    </div>
  );
}

export default Login;
