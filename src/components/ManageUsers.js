import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db, functions } from "../firebase";
import { httpsCallable } from "firebase/functions";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import "./ManageUsers.css";

// Opciones de roles disponibles (capitalizadas para display)
const ROLES_DISPONIBLES = [
  { value: "admin", label: "Administrador" },
  { value: "lider de zona", label: "Líder de Zona" },
  { value: "multiplicador", label: "Multiplicador" },
];

// Iconos (usando emoji para simplicidad; considera react-icons para prod)
const ICONS = {
  add: "➕",
  search: "🔍",
  filter: "🔄",
  export: "📊",
  edit: "✏️",
  delete: "🗑️",
  loading: "⏳",
};

// Componente de Spinner para loading states
function LoadingSpinner({ size = "small" }) {
  return (
    <span
      className="loading-spinner"
      style={{
        display: "inline-block",
        animation: "spin 1s linear infinite",
        fontSize: size === "small" ? "0.8em" : "1em",
      }}
    >
      {ICONS.loading}
    </span>
  );
}

// Define EditUserModal (mejorado con accesibilidad y validación)
function EditUserModal({ user, onClose, onSave }) {
  const [newRole, setNewRole] = useState(user.rol);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState("");

  const handleSave = useCallback(async () => {
    if (newRole === user.rol) {
      setError("Selecciona un rol diferente para continuar.");
      return;
    }
    setLoadingSave(true);
    setError("");
    try {
      await onSave(user.id, newRole, user.multiplicadoresAsignados);
    } catch (err) {
      console.error("Error al guardar en el modal:", err);
      setError("Error al guardar cambios. Intenta de nuevo.");
      setLoadingSave(false);
    }
  }, [newRole, user.rol, user.id, user.multiplicadoresAsignados, onSave]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && !loadingSave) handleSave();
    },
    [onClose, loadingSave, handleSave]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const isLiderDeZona = newRole === "lider de zona";

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      open={true}
    >
      <div className="modal-content" role="document">
        <h3 id="modal-title">Editando Rol de: {user.nombre}</h3>
        <p>
          Email: <strong>{user.email}</strong>{" "}
          {user.numeroCedula && `(Cédula: ${user.numeroCedula})`}
        </p>
        {error && <div className="error-message" role="alert">{error}</div>}
        <div className="form-group">
          <label htmlFor="role-select">Seleccionar Nuevo Rol:</label>
          <select
            id="role-select"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="role-select-modal"
            disabled={loadingSave}
            aria-describedby={isLiderDeZona ? "role-note" : undefined}
          >
            {ROLES_DISPONIBLES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {isLiderDeZona && (
          <p id="role-note" className="note-warning">
            **Nota:** Al asignar 'Líder de Zona', el campo
            `multiplicadoresAsignados` será borrado, a menos que lo manejes
            manualmente.
          </p>
        )}
        <div className="modal-actions">
          <button
            onClick={handleSave}
            className="save-button"
            disabled={newRole === user.rol || loadingSave}
            aria-busy={loadingSave}
          >
            {loadingSave ? (
              <>
                <LoadingSpinner size="small" /> Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
          <button
            onClick={onClose}
            className="cancel-button"
            disabled={loadingSave}
          >
            Cancelar
          </button>
        </div>
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
  const [error, setError] = useState(""); // Estado global para errores

  const remoteDeleteUser = httpsCallable(functions, "deleteUserAndData");

  // Memoizado para performance
  const roleOptions = useMemo(
    () => [
      { value: "todos", label: "Todos los Roles" },
      ...ROLES_DISPONIBLES.map(({ value, label }) => ({ value, label })),
    ],
    []
  );

  // 🛑 FUNCIÓN OPTIMIZADA: SOLO LEE LA COLECCIÓN 'users' con manejo de errores
  const fetchUsersAndMetrics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      let usersList = usersSnapshot.docs.map((doc) => {
        const userData = doc.data();
        return {
          id: doc.id,
          uid: doc.id,
          ...userData,
          registrationCount: userData.registrationsCount || 0,
        };
      });
      setAllUsers(usersList);
      setFilteredUsers(usersList); // Inicial sin filtros
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar usuarios. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtro memoizado para evitar re-renders innecesarios
  const filteredUsersMemo = useMemo(() => {
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
    return currentUsers;
  }, [allUsers, roleFilter, searchTerm]);

  useEffect(() => {
    setFilteredUsers(filteredUsersMemo);
  }, [filteredUsersMemo]);

  useEffect(() => {
    fetchUsersAndMetrics();
  }, [fetchUsersAndMetrics]);

  const handleDeleteUser = useCallback(
    async (user) => {
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
      setError("");
      try {
        const response = await remoteDeleteUser({ uid: user.uid });
        // Mejora: Usa toast en lugar de alert para UX mejor (aquí simulamos con alert)
        alert(response.data.message || "Usuario eliminado exitosamente.");
        await fetchUsersAndMetrics();
      } catch (err) {
        console.error("Error al eliminar el usuario:", err);
        const errorMessage =
          err.message || "Error desconocido al intentar eliminar el usuario.";
        setError(`Error al eliminar: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    },
    [remoteDeleteUser, fetchUsersAndMetrics]
  );

  const handleExport = useCallback(() => {
    if (filteredUsersMemo.length === 0) {
      setError("No hay usuarios filtrados para exportar.");
      return;
    }

    const dataToExport = filteredUsersMemo.map((user) => ({
      Nombre: user.nombre || "N/A",
      Email: user.email || "N/A",
      Cedula: user.numeroCedula || "N/A",
      Rol: ROLES_DISPONIBLES.find((r) => r.value === user.rol)?.label || user.rol || "N/A",
      Registros: user.registrationCount || 0,
      UID: user.id,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios Filtrados");
    XLSX.writeFile(workbook, `Usuarios_Filtrados_${new Date().toISOString().split('T')[0]}.xlsx`);
    // Mejora: Alert con fecha para trazabilidad
    alert(`Se han exportado ${filteredUsersMemo.length} usuarios al archivo con fecha de hoy.`);
  }, [filteredUsersMemo]);

  const handleEditClick = useCallback((user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingUser(null);
  }, []);

  const handleSaveRole = useCallback(
    async (userId, newRole, asignados) => {
      const userDocRef = doc(db, "users", userId);
      try {
        let dataToUpdate = {
          rol: newRole,
          multiplicadoresAsignados:
            newRole === "lider de zona" ? asignados || [] : [],
        };
        await updateDoc(userDocRef, dataToUpdate);
        alert("Usuario actualizado con éxito!");
        handleCloseModal();
        fetchUsersAndMetrics(); // Recarga para reflejar cambios
      } catch (err) {
        console.error("Error updating user:", err);
        throw new Error("Hubo un error al guardar los cambios."); // Re-lanza para catch en modal
      }
    },
    [handleCloseModal, fetchUsersAndMetrics]
  );

  if (loading) {
    return (
      <div className="manage-users-container" style={{ textAlign: "center", padding: "4rem" }}>
        <LoadingSpinner size="large" />
        <p>Cargando datos de usuarios...</p>
      </div>
    );
  }

  return (
    <div className="manage-users-container" role="main" aria-label="Gestión de Usuarios">
      {/* Error Global */}
      {error && (
        <div className="error-message global" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Cerrar error">
            ✕
          </button>
        </div>
      )}

      {/* 1. Barra de control superior */}
      <header className="manage-users-header">
        <h1>Gestión de Usuarios</h1>
        <button
          onClick={() => navigate("/admin/crear-usuario")}
          className="create-user-button"
          aria-label="Crear usuario"
          title="Crear Usuario"
        >
          {ICONS.add} Crear Usuario
        </button>
      </header>

      {/* 2. Barra de Filtros (mejorada con iconos y aria-labels) */}
      <div className="filters-bar-wrapper" role="search">
        <div className="input-wrapper">
          <label htmlFor="search-input" className="visually-hidden">
            Buscar usuarios
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Buscar por nombre, email o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Buscar por nombre, email o cédula"
          />
          <span className="input-icon">{ICONS.search}</span>
        </div>

        <div className="select-wrapper">
          <label htmlFor="role-filter" className="visually-hidden">
            Filtrar por rol
          </label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-filter-select"
            aria-label="Filtrar por rol"
          >
            {roleOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="input-icon">{ICONS.filter}</span>
        </div>

        <button
          onClick={handleExport}
          className="export-excel-button"
          disabled={loading || filteredUsersMemo.length === 0}
          aria-label={`Exportar ${filteredUsersMemo.length} usuarios a Excel`}
          title={`Exportar ${filteredUsersMemo.length} usuarios filtrados`}
        >
          {ICONS.export} Exportar ({filteredUsersMemo.length}) a Excel
        </button>
      </div>

      {/* 3. Tabla (mejorada con role="table" y data-labels para mobile) */}
      <div className="table-wrapper" role="region" aria-label="Tabla de usuarios">
        <table className="users-table" role="table" aria-describedby="table-desc">
          <caption id="table-desc" className="visually-hidden">
            Lista de usuarios con filtros aplicados ({filteredUsersMemo.length} resultados)
          </caption>
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Email / Cédula</th>
              <th scope="col">Rol</th>
              <th scope="col">Registros</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsersMemo.length > 0 ? (
              filteredUsersMemo.map((user) => (
                <tr key={user.id} role="row">
                  <td data-label="Nombre">{user.nombre || "N/A"}</td>
                  <td data-label="Email / Cédula">
                    <strong>
                      {user.numeroCedula || user.email || "N/A"}
                    </strong>
                  </td>
                  <td data-label="Rol">
                    <span
                      className={`role-badge role-${user.rol}`}
                      title={`Rol: ${ROLES_DISPONIBLES.find((r) => r.value === user.rol)?.label || user.rol}`}
                    >
                      {ROLES_DISPONIBLES.find((r) => r.value === user.rol)?.label || user.rol || "N/A"}
                    </span>
                  </td>
                  <td data-label="Registros">{user.registrationCount || 0}</td>
                  <td data-label="Acciones" className="actions-cell">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="edit-button"
                      aria-label={`Editar rol de ${user.nombre}`}
                      title="Editar rol"
                      disabled={loading}
                    >
                      {ICONS.edit} Editar Rol
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="delete-button"
                      aria-label={`Eliminar usuario ${user.nombre}`}
                      title="Eliminar usuario (irreversible)"
                      disabled={loading}
                    >
                      {ICONS.delete} Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state" role="status">
                  <span role="img" aria-label="No results">👥</span>
                  No se encontraron usuarios con los filtros aplicados.
                  <br />
                  <small>Intenta ajustar la búsqueda o el filtro de roles.</small>
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

      {/* Estilos inline para nuevos elementos (mueve a CSS global) */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .visually-hidden {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
        .input-wrapper, .select-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          opacity: 0.5;
        }
        .actions-cell {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .role-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .role-admin { background: var(--primary); color: white; }
        .role-lider-de-zona { background: var(--success); color: white; }
        .role-multiplicador { background: var(--warning); color: black; }
        .error-message {
          padding: 0.75rem;
          margin-bottom: 1rem;
          border-radius: var(--radius);
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          border-left: 3px solid var(--danger);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .error-message.global { max-width: 100%; }
        .error-message button { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
        .loading-spinner { margin-right: 0.5rem; }
      `}</style>
    </div>
  );
}

export default ManageUsers;



