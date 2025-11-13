import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 1. Importamos useNavigate
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // 2. Obtenemos la función para navegar

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 3. ¡LA LÍNEA CLAVE! Redirigimos al dashboard
      navigate('/dashboard'); 
    } catch (err) {
      console.error("Error al iniciar sesión:", err.message);
      setError('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Acceso de Miembros</h2>
        {error && <p className="error-message">{error}</p>} {/* Mostramos un mensaje de error */}
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
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="button-group">
          <button type="submit" className="btn-primary">Iniciar Sesión</button>
        </div>
        <div className="extra-links">
          <p>¿No tienes una cuenta de activista? <Link to="/signup">Regístrate aquí</Link></p>
        </div>
      </form>
    </div>
  );
}

export default Login;
