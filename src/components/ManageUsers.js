import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import * as XLSX from "xlsx"; // Librería para Excel (SheetJS)
// import EditUserModal from './EditUserModal'; // Asegúrate que la ruta es correcta
import "./ManageUsers.css";

// Opciones de roles disponibles
const ROLES_DISPONIBLES = ["admin", "lider de zona", "multiplicador"];

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
        <p>Email: {user.email}</p>

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
                {role.charAt(0).toUpperCase() + role.slice(1)}{" "}
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
            específicamente en `handleSaveRole`.
          </p>
        )}
      </div>
    </div>
  );
}

function ManageUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); // EL ESTADO QUE NECESITAS
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
        uid: doc.id, // Asegurarse de que el UID es el ID del documento
        ...doc.data(),
      }));
      const simpatizantesSnapshot = await getDocs(
        collection(db, "simpatizantes")
      );
      const registrationCounts = {};
      simpatizantesSnapshot.forEach((doc) => {
        const registeredBy = doc.data().registradoPor;
        if (registeredBy) {
          registrationCounts[registeredBy] =
            (registrationCounts[registeredBy] || 0) + 1;
        }
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

  // === FUNCIÓN DE EXPORTACIÓN AHORA DENTRO DEL COMPONENTE ===
  const handleExport = () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios filtrados para exportar.");
      return;
    }

    // 1. Mapear los datos para crear un formato limpio para el Excel
    const dataToExport = filteredUsers.map((user) => ({
      Nombre: user.nombre || "N/A",
      Email: user.email || "N/A",
      Rol: user.rol || "N/A",
      Registros: user.registrationCount || 0,
      // Opcional: Agregar campos de interés, como el ID
      UID: user.id
    }));

    // 2. Crear la hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // 3. Crear el libro de trabajo (workbook)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios Filtrados");

    // 4. Escribir y descargar el archivo
    XLSX.writeFile(workbook, "Usuarios_Filtrados.xlsx");

    alert(`Se han exportado ${filteredUsers.length} usuarios.`);
  };
  // ==========================================================

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
          (user.email && user.email.toLowerCase().includes(lowerSearchTerm))
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
        // Si no es líder de zona, limpiamos los asignados para evitar errores
        multiplicadoresAsignados:
          newRole === "lider de zona" ? asignados || [] : [],
      };
      await updateDoc(userDocRef, dataToUpdate);
      alert("Usuario actualizado con éxito!");
      handleCloseModal();
      fetchUsersAndMetrics();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Hubo un error al guardar los cambios.");
    }
  };

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="manage-users-container">
      <div className="manage-users-header">
        <h2>Gestión de Usuarios</h2>
        <button
          onClick={() => navigate("/admin/crear-usuario")}
          className="create-user-button"
        >
          + Crear Nuevo Usuario
        </button>
      </div>

      <div className="filters-section">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
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
        {/* BOTÓN DE EXPORTAR AHORA DENTRO DE filters-section */}
        <button
          onClick={handleExport}
          className="export-excel-button"
          disabled={loading || filteredUsers.length === 0}
        >
          Exportar ({filteredUsers.length}) a Excel
        </button>
      </div>

      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
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
                  <td data-label="Nombre">{user.nombre || "N/A"}</td>
                  <td data-label="Email">{user.email || "N/A"}</td>
                  <td data-label="Rol">{user.rol || "N/A"}</td>
                  <td data-label="Registros">{user.registrationCount}</td>
                  <td data-label="Acciones">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="edit-button"
                    >
                      Editar Rol
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