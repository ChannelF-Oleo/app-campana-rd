import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// 1. Quitar imports de auth y firestore directos, importar functions
import { getFunctions, httpsCallable } from "firebase/functions";
import "./CreateUser.css";

// 2. Preparar la llamada a la nueva función
const functions = getFunctions();
const createUserAdminCallable = httpsCallable(functions, "createUserAdmin");

function CreateUser() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // PASO 1: Agregar el estado para la cédula
  const [cedula, setCedula] = useState("");
  const [rol, setRol] = useState("multiplicador");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" });

    if (password.length < 6) {
      setNotification({
        message: "La contraseña debe tener al menos 6 caracteres.",
        type: "error",
      });
      return;
    }

    // **Validación de Cédula (Opcional, pero recomendado)**
    if (!cedula.trim()) {
      setNotification({ message: "La cédula es obligatoria.", type: "error" });
      return;
    }

    setLoading(true);

    try {
      // 3. Llamar a la Callable Function con los datos
      // PASO 3: Incluir 'cedula' en los datos enviados
      const result = await createUserAdminCallable({
        nombre,
        email,
        password,
        rol,
        cedula,
      });

      if (result.data.success) {
        setNotification({ message: result.data.message, type: "success" });
        // Limpiar formulario
        setNombre("");
        setEmail("");
        setPassword("");
        // Limpiar el campo de cédula también
        setCedula("");
        setRol("multiplicador");
      }
      // Los errores ahora vienen directamente en el 'catch'
    } catch (error) {
      console.error("Error al llamar a createUserAdmin:", error);
      // Los HttpsError vienen con un 'message' útil para el usuario
      setNotification({
        message: error.message || "Ocurrió un error al crear el usuario.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- JSX del formulario (con cambios) ---
  return (
    <div className="create-user-container">
      <h2>Crear Nuevo Usuario Activista</h2>
      <form onSubmit={handleCreateUser} className="create-user-form">
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

        {/* PASO 2: Agregar el campo de la cédula */}
        <div className="input-group">
          <label htmlFor="cedula">Cédula (Identificación)</label>
          <input
            type="text"
            id="cedula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
            // Puedes añadir un patrón de validación si conoces el formato exacto
            // pattern="\d{3}-\d{7}-\d{1}"
            placeholder="Ej: 001-0000000-0"
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
          <label htmlFor="password">
            Contraseña Temporal (mín. 6 caracteres)
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="rol">Asignar Rol</label>
          <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="multiplicador">Multiplicador</option>
            <option value="lider de zona">Lider de Zona</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creando Usuario..." : "Crear Usuario"}
        </button>

        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="back-button"
        >
          Volver a la Lista
        </button>
      </form>
    </div>
  );
}

export default CreateUser;
