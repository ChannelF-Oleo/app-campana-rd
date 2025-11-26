import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../firebase"; // Importamos storage
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage"; // Funciones de Storage
import * as XLSX from "xlsx";
import "./ManageUsers.css";
import AvatarFoto from "./AvatarFoto";

// Inicializar Functions
const functions = getFunctions();
const deleteUserCallable = httpsCallable(functions, "deleteUserAndData");

const ROLES_DISPONIBLES = ["admin", "lider de zona", "multiplicador"];

// --- MODAL DE EDICIÓN (Con Cambio de Foto) ---
function EditUserModal({ user, onClose, onSave }) {
  const [newRole, setNewRole] = useState(user.rol || "multiplicador");
  const [newCedula, setNewCedula] = useState(user.cedula || "");
  const [loadingSave, setLoadingSave] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Formateador de Cédula
  const handleCedulaChange = (e) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    const normalized = input.slice(0, 11);
    let formatted = normalized;
    if (normalized.length > 3)
      formatted = `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    if (normalized.length > 10)
      formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
    setNewCedula(formatted);
  };

  // SUBIR NUEVA FOTO
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que tengamos cédula para nombrar el archivo
    const cleanCedula = newCedula.replace(/-/g, "");
    if (cleanCedula.length !== 11) {
      alert(
        "❌ Error: El usuario debe tener una cédula válida (11 dígitos) antes de subir la foto."
      );
      return;
    }

    setUploading(true);
    try {
      // Guardamos como .jpg para estandarizar (AvatarFoto lo buscará primero)
      // Usamos la cédula con guiones para el nombre del archivo
      const storageRef = ref(storage, `votantes_fotos/${newCedula}.jpg`);

      await uploadBytes(storageRef, file);

      alert(
        "✅ Foto actualizada correctamente.\n\nNota: Puede tardar unos minutos en reflejarse o requerir recargar la página."
      );
      setUploading(false);
    } catch (error) {
      console.error("Error subiendo foto:", error);
      alert("❌ Error al subir la imagen. Verifica tu conexión.");
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    const cleanCedula = newCedula.replace(/-/g, "");

    if (cleanCedula.length > 0 && cleanCedula.length !== 11) {
      setError("La cédula debe tener 11 dígitos.");
      return;
    }

    setLoadingSave(true);
    try {
      await onSave(user.id, {
        rol: newRole,
        cedula: newCedula,
        multiplicadoresAsignados: user.multiplicadoresAsignados,
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      setError("Error al guardar los cambios.");
      setLoadingSave(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel">
        <h3>Editar Usuario: {user.nombre}</h3>

        {/* ÁREA DE FOTO Y SUBIDA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "20px 0",
            gap: "10px",
          }}
        >
          <AvatarFoto
            cedula={newCedula || user.cedula}
            nombre={user.nombre}
            size="100px"
          />

          {/* Botón de carga de archivo */}
          <label
            className="upload-btn"
            style={{
              cursor: uploading ? "wait" : "pointer",
              color: "#004d99",
              fontSize: "0.9rem",
              fontWeight: "bold",
              padding: "5px 10px",
              border: "1px dashed #004d99",
              borderRadius: "5px",
              backgroundColor: uploading ? "#f0f0f0" : "transparent",
            }}
          >
            {uploading ? "⏳ Subiendo..." : "📷 Subir/Cambiar Foto"}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="form-group">
          <label>Email (No editable):</label>
          <input
            type="text"
            value={user.email}
            disabled
            className="input-disabled"
          />
        </div>

        <div className="form-group">
          <label>Cédula de Identidad:</label>
          <input
            type="text"
            value={newCedula}
            onChange={handleCedulaChange}
            placeholder="001-0000000-0"
            className="search-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="role-select">Rol del Usuario:</label>
          <select
            id="role-select"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="role-filter-select"
            disabled={loadingSave}
          >
            {ROLES_DISPONIBLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="modal-actions">
          <button
            onClick={handleSave}
            className="save-button"
            disabled={loadingSave || uploading}
          >
            {loadingSave ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button
            onClick={onClose}
            className="cancel-button"
            disabled={loadingSave || uploading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
function ManageUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");

  const fetchUsersAndMetrics = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      let usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data(),
      }));

      const simpatizantesSnapshot = await getDocs(
        collection(db, "simpatizantes")
      );
      const registrationCounts = {};
      simpatizantesSnapshot.forEach((doc) => {
        const registeredBy = doc.data().registradoPor;
        if (registeredBy)
          registrationCounts[registeredBy] =
            (registrationCounts[registeredBy] || 0) + 1;
      });

      usersList = usersList.map((user) => ({
        ...user,
        registrationCount: registrationCounts[user.uid] || 0,
      }));

      setAllUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirm = window.confirm(
      `¿Estás SEGURO de que quieres eliminar a ${user.nombre}?\n\nEsta acción borrará su acceso y sus datos personales permanentemente.`
    );

    if (confirm) {
      setLoading(true);
      try {
        const result = await deleteUserCallable({ uid: user.uid });
        if (result.data.success) {
          alert("Usuario eliminado correctamente.");
          fetchUsersAndMetrics();
        } else {
          alert("Error al eliminar usuario.");
        }
      } catch (error) {
        console.error("Error eliminando:", error);
        alert("Error de servidor al eliminar usuario.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios para exportar.");
      return;
    }
    const dataToExport = filteredUsers.map((user) => ({
      Nombre: user.nombre || "N/A",
      Email: user.email || "N/A",
      Rol: user.rol || "N/A",
      Cedula: user.cedula || "N/A",
      Registros: user.registrationCount || 0,
      UID: user.id,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios Filtrados");
    XLSX.writeFile(workbook, "Usuarios_Filtrados.xlsx");
  };

  useEffect(() => {
    fetchUsersAndMetrics();
  }, []);

  useEffect(() => {
    let currentUsers = [...allUsers];
    if (roleFilter !== "todos") {
      currentUsers = currentUsers.filter((user) => user.rol === roleFilter);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentUsers = currentUsers.filter(
        (user) =>
          (user.nombre &&
            user.nombre.toLowerCase().includes(lowerSearchTerm)) ||
          (user.email && user.email.toLowerCase().includes(lowerSearchTerm)) ||
          (user.cedula && user.cedula.includes(searchTerm))
      );
    }
    setFilteredUsers(currentUsers);
  }, [searchTerm, roleFilter, allUsers]);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (userId, data) => {
    const userDocRef = doc(db, "users", userId);
    try {
      let dataToUpdate = {
        rol: data.rol,
        cedula: data.cedula,
        multiplicadoresAsignados:
          data.rol === "lider de zona"
            ? data.multiplicadoresAsignados || []
            : [],
      };

      await updateDoc(userDocRef, dataToUpdate);
      alert("Usuario actualizado con éxito.");
      handleCloseModal();
      fetchUsersAndMetrics();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Hubo un error al guardar.");
    }
  };

  if (loading) return <p className="loading-text">Cargando sistema...</p>;

  return (
    <div className="manage-users-container glass-panel">
      <div className="manage-users-header">
        <h2>Gestión de Usuarios</h2>
        <button
          onClick={() => navigate("/admin/crear-usuario")}
          className="create-user-button"
        >
          + Crear Nuevo Usuario
        </button>
      </div>

      <div className="filters-bar-wrapper">
        <input
          type="text"
          placeholder="Buscar por nombre, email o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="role-filter-select"
        >
          <option value="todos">Todos los Roles</option>
          <option value="admin">Administrador</option>
          <option value="lider de zona">Lider de Zona</option>
          <option value="multiplicador">Multiplicador</option>
        </select>
        <button
          onClick={handleExport}
          className="export-excel-button"
          disabled={loading || filteredUsers.length === 0}
        >
          Exportar Excel
        </button>
      </div>

      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Registros</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td data-label="Foto" style={{ width: "60px" }}>
                    <AvatarFoto
                      cedula={user.cedula}
                      nombre={user.nombre}
                      size="40px"
                    />
                  </td>
                  <td data-label="Nombre">
                    <div style={{ fontWeight: "600" }}>
                      {user.nombre || "N/A"}
                    </div>
                    {user.cedula ? (
                      <small style={{ color: "#666" }}>{user.cedula}</small>
                    ) : (
                      <small style={{ color: "#e63946" }}>Sin Cédula</small>
                    )}
                  </td>
                  <td data-label="Email">{user.email || "N/A"}</td>
                  <td data-label="Rol">
                    <span
                      className={`role-badge role-${user.rol?.replace(
                        /\s+/g,
                        "-"
                      )}`}
                    >
                      {user.rol || "N/A"}
                    </span>
                  </td>
                  <td data-label="Registros">
                    <div className="count-badge">{user.registrationCount}</div>
                  </td>
                  <td data-label="Acciones" className="actions-cell">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="edit-button icon-only"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="delete-button icon-only"
                      title="Eliminar"
                      style={{
                        marginLeft: "8px",
                        borderColor: "#ef4444",
                        color: "#ef4444",
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-state">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}

export default ManageUsers;
