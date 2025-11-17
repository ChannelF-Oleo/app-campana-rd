import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, functions } from "../firebase";
import { httpsCallable } from "firebase/functions";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import "./ManageUsers.css";

// Opciones de roles disponibles
const ROLES_DISPONIBLES = ["admin", "lider de zona", "multiplicador"];

// Define EditUserModal (se mantiene intacto)
function EditUserModal({ user, onClose, onSave }) {
  const [newRole, setNewRole] = useState(user.rol);
  const [loadingSave, setLoadingSave] = useState(false);

  const handleSave = async () => {
    setLoadingSave(true);
    try {
      await onSave(user.id, newRole, user.multiplicadoresAsignados);
    } catch (error) {
      console.error("Error al guardar en el modal:", error);
      setLoadingSave(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Editando Rol de: {user.nombre}</h3>
        <p>
          Email: {user.email}{" "}
          {user.numeroCedula && `(Cédula: ${user.numeroCedula})`}
        </p>
        <div className="form-group">
          <label htmlFor="role-select">Seleccionar Nuevo Rol:</label>
          <select
            id="role-select"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="role-select-modal"
            disabled={loadingSave}
          >
            {ROLES_DISPONIBLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button
            onClick={handleSave}
            className="save-button"
            disabled={newRole === user.rol || loadingSave}
          >
            {loadingSave ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button
            onClick={onClose}
            className="cancel-button"
            disabled={loadingSave}
          >
            Cancelar
          </button>
        </div>
        {newRole === "lider de zona" && (
          <p className="note-warning">
            **Nota:** Al asignar 'Lider de Zona', el campo
            `multiplicadoresAsignados` será borrado, a menos que lo manejes
          </p>
        )}
      </div>
    </div>
  );
}

// ====================================================================

function ManageUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");

  const remoteDeleteUser = httpsCallable(functions, "deleteUserAndData");

  // 🛑 FUNCIÓN OPTIMIZADA: SOLO LEE LA COLECCIÓN 'users'
  const fetchUsersAndMetrics = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      
      let usersList = usersSnapshot.docs.map((doc) => {
          const userData = doc.data();
          return {
            id: doc.id,
            uid: doc.id,
            ...userData,
            // 🛑 AHORA LEEMOS EL CONTADOR DENORMALIZADO DESDE EL DOCUMENTO DEL USUARIO
            // EL CAMPO ES 'registrationsCount' (implementado en el backend)
            registrationCount: userData.registrationsCount || 0,
          }
      });
      
      // ❌ ELIMINADO EL BLOQUE QUE LEÍA TODA LA COLECCIÓN 'SIMPATIZANTES'
      
      setAllUsers(usersList);
      // Mantener los filtros al actualizar datos
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const idDisplay = user.numeroCedula
      ? `Cédula: ${user.numeroCedula}`
      : `Email: ${user.email}`;
    if (
      !window.confirm(
        `¿Estás seguro de ELIMINAR al usuario ${user.nombre} (${idDisplay})? Esta acción es irreversible.`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const response = await remoteDeleteUser({ uid: user.uid });
      alert(response.data.message);
      await fetchUsersAndMetrics();
    } catch (error) {
      console.error("Error al eliminar el usuario (Cloud Function):", error);
      const errorMessage =
        error.message || "Error desconocido al intentar eliminar el usuario.";
      alert(`Hubo un error al eliminar el usuario: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios filtrados para exportar.");
      return;
    }

    const dataToExport = filteredUsers.map((user) => ({
      Nombre: user.nombre || "N/A",
      Email: user.email || "N/A",
      Cedula: user.numeroCedula || "N/A",
      Rol: user.rol || "N/A",
      Registros: user.registrationCount || 0, // Usamos el campo denormalizado
      UID: user.id,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios Filtrados");
    XLSX.writeFile(workbook, "Usuarios_Filtrados.xlsx");
    alert(`Se han exportado ${filteredUsers.length} usuarios.`);
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
          (user.numeroCedula &&
            user.numeroCedula.toLowerCase().includes(lowerSearchTerm))
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

  const handleSaveRole = async (userId, newRole, asignados) => {
    const userDocRef = doc(db, "users", userId);
    try {
      let dataToUpdate = {
        rol: newRole,
        // Mantenemos esta lógica limpia: solo los líderes tienen asignados
        multiplicadoresAsignados:
          newRole === "lider de zona" ? asignados || [] : [],
      };
      await updateDoc(userDocRef, dataToUpdate);
      alert("Usuario actualizado con éxito!");
      handleCloseModal();
      fetchUsersAndMetrics(); // Recargar datos para reflejar el cambio
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Hubo un error al guardar los cambios.");
    }
  };

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="manage-users-container">
      {/* 1. Barra de control superior (Título y Botón de Creación) */}
      <div className="manage-users-header">
        <h2>Gestión de Usuarios</h2>
        <button
          onClick={() => navigate("/admin/crear-usuario")}
          className="create-user-button"
        >
          + Crear Nuevo Usuario
        </button>
      </div>

      {/* 2. Barra de Búsqueda, Filtro y Exportación (Ajustado para el diseño visual) */}
      <div className="filters-bar-wrapper">
        {/* Input de Búsqueda */}
        <input
          type="text"
          placeholder="Buscar por nombre, email o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {/* Filtro de Roles */}
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

        {/* Botón de Exportar */}
        <button
          onClick={handleExport}
          className="export-excel-button"
          disabled={loading || filteredUsers.length === 0}
        >
          Exportar ({filteredUsers.length}) a Excel
        </button>
      </div>

      {/* 3. Tabla de Usuarios */}
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email / Cédula</th>
              <th>Rol</th>
              <th>Registros</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td data-label="Nombre">{user.nombre || "N/A"}</td>
                  <td data-label="Email">
                    <strong>{user.numeroCedula || user.email || "N/A"}</strong>
                  </td>
                  <td data-label="Rol">{user.rol || "N/A"}</td>
                  <td data-label="Registros">{user.registrationCount}</td>
                  <td data-label="Acciones">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="edit-button"
                    >
                      Editar Rol
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="delete-button"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  No se encontraron usuarios con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSaveRole}
        />
      )}
    </div>
  );
}

export default ManageUsers;

