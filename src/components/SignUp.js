import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import './Login.css'; // Asumo que el CSS se mantiene

// 🚨 CONSTANTE CLAVE
const CEDULA_DOMAIN = '@cedula.temp'; 
const MIN_PASSWORD_LENGTH = 6;
// Asumo que la cédula debe ser solo números (ajustar si es necesario)
const CEDULA_REGEX = /^\d+$/; 
const CEDULA_LENGTH = 11; // Longitud típica de una cédula dominicana

function SignUp() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const trimmedCedula = cedula.trim();
    const trimmedEmail = email.trim();
    
    // ===========================================
    // 1. VALIDACIÓN INICIAL Y PRE-PROCESAMIENTO
    // ===========================================
    
    // Validación de la Contraseña
    if (password.length < MIN_PASSWORD_LENGTH) {
      alert(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      setLoading(false);
      return;
    }

    let authEmail = trimmedEmail;

    if (trimmedCedula) {
      // 1.1. Validar formato de Cédula si se proporciona
      if (!CEDULA_REGEX.test(trimmedCedula) || trimmedCedula.length !== CEDULA_LENGTH) {
        alert('Por favor, ingresa un Número de Cédula válido (solo números y 11 dígitos).');
        setLoading(false);
        return;
      }
      // 1.2. Usar Cédula para Auth
      authEmail = trimmedCedula + CEDULA_DOMAIN; 
    } else if (!trimmedEmail) {
      // 1.3. Asegurar que al menos un campo de login se llenó
      alert('Debes proporcionar un Correo Electrónico o un Número de Cédula.');
      setLoading(false);
      return;
    }

    try {
      // ===========================================
      // 2. FIREBASE AUTHENTICATION
      // ===========================================

      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
      const user = userCredential.user;

      // ===========================================
      // 3. FIRESTORE: CREACIÓN DE PERFIL DE USUARIO
      // ===========================================
      
      const userData = {
        uid: user.uid,
        nombre: nombre,
        // Almacenamos el email utilizado para la autenticación
        email: authEmail, 
        // Almacenamos la cédula limpia (o null) en un campo indexable
        numeroCedula: trimmedCedula || null, 
        rol: 'multiplicador',
        createdAt: new Date(), // Buena práctica: añadir timestamp
      };

      await setDoc(doc(db, "users", user.uid), userData);

      alert('¡Registro exitoso! Serás redirigido al panel.');
      navigate('/dashboard'); 

    } catch (error) {
      console.error("Error en el registro:", error.code, error.message);
      
      // Mapeo de errores de Firebase Auth a mensajes amigables
      let userMessage = 'Ocurrió un error al registrar. Por favor, inténtalo de nuevo.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          // Este error cubre tanto el correo real como la cédula sintética
          userMessage = 'Esa cuenta (correo o cédula) ya está registrada. Intenta Iniciar Sesión.';
          break;
        case 'auth/weak-password':
          userMessage = 'Contraseña débil. Por favor, elige una contraseña más segura (mínimo 6 caracteres).';
          break;
        case 'auth/invalid-email':
          // Esto puede ocurrir si el 'authEmail' (cedula + dominio) falla la validación interna de Firebase
          userMessage = 'El formato de correo/cédula es inválido. Por favor, verifica tu entrada.';
          break;
        default:
          userMessage = `Error desconocido: ${error.message}`;
          break;
      }

      alert(`Error: ${userMessage}`);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSignUp}>
        <h2>Crear Cuenta de Activista</h2>
        <div className="input-group">
          <label htmlFor="nombre">Nombre Completo</label>
          {/* Se añade el campo nombre como requerido para la metadata de Firestore */}
          <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        
        <div className="input-group">
          <label htmlFor="email">Correo Electrónico (Opcional)</label>
          <input 
            type="email" 
            id="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        <div className="input-group">
          <label htmlFor="cedula">Número de Cédula (Opcional)</label>
          {/* Se sugiere tipo 'tel' para móviles, pero 'text' es más flexible para la validación */}
          <input 
            type="text" 
            inputMode="numeric" // Mejora la UX en móvil
            pattern="\d*" // Ayuda a la validación del navegador, aunque se hace manualmente en JS
            maxLength={CEDULA_LENGTH}
            id="cedula" 
            value={cedula} 
            onChange={(e) => setCedula(e.target.value)} 
          />
        </div>
        <p className="hint">Puedes registrarte usando tu Correo **o** tu Cédula. Asegúrate de que el número sea correcto.</p>

        <div className="input-group">
          <label htmlFor="password">Contraseña (mínimo {MIN_PASSWORD_LENGTH} caracteres)</label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={MIN_PASSWORD_LENGTH} // HTML5 validation fallback
          />
        </div>
        <button type="submit" disabled={loading || !nombre || !(email || cedula) || !password}>
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>
    </div>
  );
}

export default SignUp;