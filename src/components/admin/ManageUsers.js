import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import AvatarFoto from "../ui/AvatarFoto";
import { generarPadronPDF } from "../../utils/pdfPadron";
import { generarExcelConFoto } from "../../utils/excelConFoto";
import { subirFotoUsuario } from "../../utils/subirFotoUsuario";
import {
  ROLES_DISPONIBLES,
  USUARIOS_POR_PAGINA,
  ROL_ADMIN,
  ROL_LIDER,
  ROL_MULTIPLICADOR,
  normalizarCedula,
  validarTelefono,
} from "../../constants";
import {
  aplicarCambioUbicacion,
  estadoUbicacionDesdeDatos,
  CAMPOS_UBICACION_OTRO,
  limpiarUbicacion,
  valorUbicacionFinal,
  normalizarUbicacion,
} from "../../data/ubicacionElectoral";
import UbicacionElectoralFields from "../ui/UbicacionElectoralFields";

// Inicializar Functions
const functions = getFunctions();
const deleteUserCallable = httpsCallable(functions, "deleteUserAndData");

// Campos/columnas para los exports con foto. `key` referencia propiedades de
// cada objeto de filteredUsers (que ya trae cedula, nombre, telefono, rol,
// zona y registrationCount). Sin Dirección (se está retirando del modelo).
const CAMPOS_PDF_USUARIOS = [
  { label: "Nombre", key: "nombre" },
  { label: "Cédula", key: "cedula" },
  { label: "Teléfono", key: "telefono" },
  { label: "Rol", key: "rol" },
  { label: "Zona", key: "zona" },
  { label: "Registros", key: "registrationCount" },
];

const COLUMNAS_EXCEL_USUARIOS = [
  { header: "Nombre", key: "nombre", width: 28 },
  { header: "Cédula", key: "cedula", width: 16 },
  { header: "Teléfono", key: "telefono", width: 16 },
  { header: "Rol", key: "rol", width: 16 },
  { header: "Zona", key: "zona", width: 16 },
  { header: "Registros", key: "registrationCount", width: 12 },
];

// --- SPINNER DE CARGA ---
function LoadingSpinner({ message = "Cargando..." }) {
  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="spinner" aria-label="Cargando"></div>
        <p className="spinner-text">{message}</p>
      </div>
    </div>
  );
}

// --- MODAL DE EDICIÓN ---
// Edita TODOS los campos del perfil guardados en Firestore: identidad (nombre,
// apodo, cédula, teléfono), la cascada de ubicación electoral completa, el rol y
// —para un líder— los multiplicadores a su cargo, además de la foto.
// El email es la ÚNICA excepción: vive en Firebase Auth y cambiarlo exige una
// Cloud Function con privilegios de admin (no existe), así que se muestra solo
// lectura.
function EditUserModal({ user, onClose, onSave }) {
  const [newRole, setNewRole] = useState(user.rol || ROL_MULTIPLICADOR);
  const [newNombre, setNewNombre] = useState(user.nombre || "");
  const [newApodo, setNewApodo] = useState(user.apodo || "");
  const [newTelefono, setNewTelefono] = useState(user.telefono || "");
  // La cascada se reconstruye desde los campos planos ya guardados: un valor
  // fuera del catálogo se reabre como texto libre ("Otro") en vez de perderse.
  const [ubicacion, setUbicacion] = useState(() =>
    estadoUbicacionDesdeDatos(user)
  );
  const [asignados, setAsignados] = useState(
    user.multiplicadoresAsignados || []
  );
  const [multiplicadores, setMultiplicadores] = useState([]);
  const [loadingMultis, setLoadingMultis] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const esLider = newRole === ROL_LIDER;
  // Cédula del documento: identifica al usuario y nombra su foto en Storage.
  const cedulaNormalizada = normalizarCedula(user.cedula);

  // Lista de multiplicadores asignables: solo se pide si el rol elegido es
  // líder, y una sola vez por apertura del modal.
  useEffect(() => {
    if (!esLider || multiplicadores.length > 0 || loadingMultis) return;
    let vivo = true;
    setLoadingMultis(true);
    getDocs(
      query(collection(db, "users"), where("rol", "==", ROL_MULTIPLICADOR))
    )
      .then((snap) => {
        if (!vivo) return;
        setMultiplicadores(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""))
        );
      })
      .catch((e) => console.error("Error cargando multiplicadores:", e))
      .finally(() => vivo && setLoadingMultis(false));
    return () => {
      vivo = false;
    };
  }, [esLider, multiplicadores.length, loadingMultis]);

  const handleUbicacionChange = (campo, valor) => {
    setUbicacion((prev) => aplicarCambioUbicacion(prev, campo, valor));
  };

  const toggleAsignado = (id) => {
    setAsignados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // SUBIR NUEVA FOTO
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // La foto se nombra con la cédula del usuario, que aquí es inmutable: si el
    // documento no tiene una válida, no hay nombre de archivo posible.
    if (cedulaNormalizada.length !== 11) {
      alert(
        "❌ Error: este usuario no tiene una cédula válida (11 dígitos) registrada, y la foto se guarda con ella. Corrige la cédula en la base de datos antes de subir la foto."
      );
      return;
    }

    setUploading(true);
    try {
      // Lógica compartida (comprimir + subir a Storage) extraída a un util.
      await subirFotoUsuario(file, cedulaNormalizada);
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

    if (!newNombre.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    if (newTelefono.trim() && !validarTelefono(newTelefono)) {
      setError("Teléfono inválido (mínimo 7 dígitos).");
      return;
    }
    // A diferencia del alta, aquí NO se exige la cascada completa (hay perfiles
    // antiguos sin ubicación); solo que un campo puesto en "Otro" no quede en
    // blanco, que guardaría una ubicación vacía sin avisar.
    for (const { campo, label } of CAMPOS_UBICACION_OTRO) {
      if (ubicacion[`${campo}EsOtro`] && !normalizarUbicacion(ubicacion[campo])) {
        setError(`Escribe ${label}`);
        return;
      }
    }

    setLoadingSave(true);
    try {
      await onSave(user.id, {
        nombre: newNombre.trim(),
        apodo: newApodo.trim(),
        rol: newRole,
        telefono: newTelefono,
        zona: limpiarUbicacion(ubicacion.zona),
        sector: valorUbicacionFinal(ubicacion, "sector"),
        subsector: valorUbicacionFinal(ubicacion, "subsector"),
        recinto: valorUbicacionFinal(ubicacion, "recinto"),
        colegioElectoral: valorUbicacionFinal(ubicacion, "colegioElectoral"),
        multiplicadoresAsignados: asignados,
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      setError("Error al guardar los cambios.");
      setLoadingSave(false);
    }
  };

  const bloqueado = loadingSave || uploading;

  // Portal en <body>: .manage-users-container es .glass-panel y usa
  // backdrop-filter, que crea bloque contenedor para los hijos position:fixed.
  // Dentro de él el modal se centraba respecto al panel (larguísimo), y aparecía
  // muy por debajo del viewport en vez de en el centro de la pantalla.
  return createPortal(
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
            cedula={user.cedula}
            nombre={newNombre || user.nombre}
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
          <label htmlFor="edit-nombre">Nombre Completo:</label>
          <input
            id="edit-nombre"
            type="text"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            className="search-input"
            disabled={bloqueado}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-apodo">Apodo:</label>
          <input
            id="edit-apodo"
            type="text"
            value={newApodo}
            onChange={(e) => setNewApodo(e.target.value)}
            placeholder="Opcional"
            className="search-input"
            disabled={bloqueado}
          />
        </div>

        {/* La cédula IDENTIFICA al usuario (es la clave de su foto en Storage y
            el enlace con su registro de simpatizante): se muestra, nunca se
            edita. */}
        <div className="form-group">
          <label htmlFor="edit-cedula">Cédula de Identidad (no editable):</label>
          <input
            id="edit-cedula"
            type="text"
            value={user.cedula || "Sin cédula"}
            disabled
            className="input-disabled"
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-telefono">Teléfono:</label>
          <input
            id="edit-telefono"
            type="tel"
            value={newTelefono}
            onChange={(e) => setNewTelefono(e.target.value)}
            placeholder="809-000-0000"
            className="search-input"
            disabled={bloqueado}
          />
        </div>

        {/* Ubicación electoral: Zona → Sector → Subsector → Recinto → Colegio */}
        <UbicacionElectoralFields
          value={ubicacion}
          onChange={handleUbicacionChange}
          disabled={bloqueado}
        />

        <div className="form-group">
          <label htmlFor="role-select">Rol del Usuario:</label>
          <select
            id="role-select"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="role-filter-select"
            disabled={bloqueado}
          >
            {ROLES_DISPONIBLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Multiplicadores a cargo: solo aplica al rol Líder de Zona. */}
        {esLider && (
          <div className="assignment-section">
            <h4>Multiplicadores asignados</h4>
            {loadingMultis ? (
              <p>Cargando multiplicadores...</p>
            ) : multiplicadores.length === 0 ? (
              <p>No hay multiplicadores disponibles.</p>
            ) : (
              <div className="multiplicadores-list">
                {multiplicadores.map((m) => (
                  <div key={m.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`multi-${m.id}`}
                      checked={asignados.includes(m.id)}
                      onChange={() => toggleAsignado(m.id)}
                      disabled={bloqueado}
                    />
                    <label htmlFor={`multi-${m.id}`}>
                      {m.nombre} ({m.email})
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        <div className="modal-actions">
          <button
            onClick={handleSave}
            className="save-button"
            disabled={bloqueado}
          >
            {loadingSave ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button
            onClick={onClose}
            className="cancel-button"
            disabled={bloqueado}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const [zonaFilter, setZonaFilter] = useState("todas");
  const [sectorFilter, setSectorFilter] = useState("todos");
  const [subsectorFilter, setSubsectorFilter] = useState("todos");

  // Zonas presentes en los usuarios cargados (para poblar el filtro por zona).
  const zonasDisponibles = Array.from(
    new Set(allUsers.map((u) => u.zona).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  // Sectores presentes (derivados del simpatizante vinculado, como la zona).
  const sectoresDisponibles = Array.from(
    new Set(allUsers.map((u) => u.sector).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  // Subsectores presentes. Si hay un sector elegido, solo los suyos: la lista
  // acompaña a la cascada en vez de mezclar subsectores de otros sectores.
  const subsectoresDisponibles = Array.from(
    new Set(
      allUsers
        .filter((u) => sectorFilter === "todos" || u.sector === sectorFilter)
        .map((u) => u.subsector)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  // Estado de los exports con foto (PDF/Excel).
  const [exportando, setExportando] = useState(false);
  const [progreso, setProgreso] = useState(null); // { fase, hechos, total }
  const textoProgreso = progreso
    ? `Generando... ${progreso.hechos}/${progreso.total}`
    : "";

  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredUsers.length / USUARIOS_POR_PAGINA);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USUARIOS_POR_PAGINA,
    currentPage * USUARIOS_POR_PAGINA
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Regresar al top de la tabla suavemente
    document.querySelector(".table-wrapper")?.scrollIntoView({ behavior: "smooth" });
  };

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
      // Mapa cédula normalizada -> datos del simpatizante vinculado (teléfono,
      // zona, dirección). Los usuarios existentes no tienen estos campos en su
      // propio doc, así que se toman del simpatizante con la misma cédula.
      const datosSimpPorCedula = {};
      simpatizantesSnapshot.forEach((doc) => {
        const data = doc.data();
        const registeredBy = data.registradoPor;
        if (registeredBy)
          registrationCounts[registeredBy] =
            (registrationCounts[registeredBy] || 0) + 1;
        const ced = normalizarCedula(data.cedula);
        if (ced && !datosSimpPorCedula[ced]) {
          datosSimpPorCedula[ced] = {
            telefono: data.telefono || "",
            zona: data.zona || "",
            sector: data.sector || "",
            subsector: data.subsector || "",
            direccion: data.direccion || "",
          };
        }
      });

      usersList = usersList.map((user) => {
        const simp = datosSimpPorCedula[normalizarCedula(user.cedula)] || {};
        return {
          ...user,
          registrationCount: registrationCounts[user.uid] || 0,
          telefono: user.telefono || simp.telefono || "",
          zona: user.zona || simp.zona || "",
          sector: user.sector || simp.sector || "",
          subsector: user.subsector || simp.subsector || "",
          direccion: user.direccion || simp.direccion || "",
        };
      });

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

  // Export PDF tipo padrón (foto grande + datos por ficha).
  const handleExportPDF = async () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios para exportar.");
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: filteredUsers.length });
    // Reflejar TODOS los filtros activos en el título y el nombre del archivo.
    const partes = [];
    if (zonaFilter !== "todas") partes.push(zonaFilter);
    if (sectorFilter !== "todos") partes.push(sectorFilter);
    if (subsectorFilter !== "todos") partes.push(subsectorFilter);

    const titulo = partes.length
      ? `Padrón de Usuarios - ${partes.join(" · ")}`
      : "Padrón de Usuarios";
    const fileName = partes.length
      ? `Usuarios_Padron_${partes.join("_").replace(/[\s·]+/g, "_")}.pdf`
      : "Usuarios_Padron.pdf";
    try {
      await generarPadronPDF(filteredUsers, {
        titulo,
        campos: CAMPOS_PDF_USUARIOS,
        fileName,
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  // Export Excel con la foto embebida en cada fila.
  const handleExportExcelFoto = async () => {
    if (filteredUsers.length === 0) {
      alert("No hay usuarios para exportar.");
      return;
    }
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: filteredUsers.length });
    try {
      await generarExcelConFoto(filteredUsers, {
        hojaNombre: "Usuarios",
        columnas: COLUMNAS_EXCEL_USUARIOS,
        fileName: "Usuarios_Con_Foto.xlsx",
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (error) {
      console.error("Error generando Excel:", error);
      alert("Hubo un error al generar el Excel.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  useEffect(() => {
    fetchUsersAndMetrics();
  }, []);

  useEffect(() => {
    let currentUsers = [...allUsers];
    if (roleFilter !== "todos") {
      currentUsers = currentUsers.filter((user) => user.rol === roleFilter);
    }
    if (zonaFilter !== "todas") {
      currentUsers = currentUsers.filter((user) => user.zona === zonaFilter);
    }
    if (sectorFilter !== "todos") {
      currentUsers = currentUsers.filter((user) => user.sector === sectorFilter);
    }
    if (subsectorFilter !== "todos") {
      currentUsers = currentUsers.filter(
        (user) => user.subsector === subsectorFilter
      );
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
    setCurrentPage(1); // Resetear a página 1 al filtrar
  }, [
    searchTerm,
    roleFilter,
    zonaFilter,
    sectorFilter,
    subsectorFilter,
    allUsers,
  ]);

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
        nombre: data.nombre || "",
        apodo: data.apodo || "",
        rol: data.rol,
        // La cédula NO se toca: no es editable desde el modal.
        telefono: data.telefono || "",
        // Ubicación electoral completa (mismos campos que el alta de usuario).
        zona: data.zona || "",
        sector: data.sector || "",
        subsector: data.subsector || "",
        recinto: data.recinto || "",
        colegioElectoral: data.colegioElectoral || "",
        multiplicadoresAsignados:
          data.rol === ROL_LIDER
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

  return (
    <div className="manage-users-container glass-panel">
      {/* SPINNER GLOBAL (Overlay) */}
      {loading && <LoadingSpinner message="Cargando usuarios..." />}

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
          <option value={ROL_ADMIN}>Administrador</option>
          <option value={ROL_LIDER}>Lider de Zona</option>
          <option value={ROL_MULTIPLICADOR}>Multiplicador</option>
        </select>
        <select
          value={zonaFilter}
          onChange={(e) => {
            setZonaFilter(e.target.value);
            // Sector y subsector cuelgan de la zona: al cambiarla se reinician.
            setSectorFilter("todos");
            setSubsectorFilter("todos");
          }}
          className="role-filter-select"
        >
          <option value="todas">Todas las Zonas</option>
          {zonasDisponibles.map((zona) => (
            <option key={zona} value={zona}>
              {zona}
            </option>
          ))}
        </select>
        <select
          value={sectorFilter}
          onChange={(e) => {
            setSectorFilter(e.target.value);
            // El subsector elegido puede no existir en el nuevo sector.
            setSubsectorFilter("todos");
          }}
          className="role-filter-select"
        >
          <option value="todos">Todos los Sectores</option>
          {sectoresDisponibles.map((sec) => (
            <option key={sec} value={sec}>
              {sec}
            </option>
          ))}
        </select>
        <select
          value={subsectorFilter}
          onChange={(e) => setSubsectorFilter(e.target.value)}
          className="role-filter-select"
        >
          <option value="todos">Todos los Subsectores</option>
          {subsectoresDisponibles.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* Acciones de exportación: fila propia con botones compactos (fuera del
          grid de filtros, para que no ocupen una columna completa cada uno). */}
      <div className="export-actions">
        <button
          onClick={handleExportPDF}
          className="export-excel-button"
          disabled={loading || exportando || filteredUsers.length === 0}
        >
          {exportando ? textoProgreso : "PDF con foto (padrón)"}
        </button>
        <button
          onClick={handleExportExcelFoto}
          className="export-excel-button"
          disabled={loading || exportando || filteredUsers.length === 0}
        >
          {exportando ? textoProgreso : "Excel con foto"}
        </button>
      </div>

      {/* Resumen de resultados */}
      <div className="results-summary">
        {filteredUsers.length > 0 ? (
          <span>
            Mostrando{" "}
            <strong>
              {(currentPage - 1) * USUARIOS_POR_PAGINA + 1}–
              {Math.min(currentPage * USUARIOS_POR_PAGINA, filteredUsers.length)}
            </strong>{" "}
            de <strong>{filteredUsers.length}</strong> usuarios
          </span>
        ) : (
          !loading && <span>No se encontraron usuarios.</span>
        )}
      </div>

      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Registros</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
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
                  <td data-label="Teléfono">{user.telefono || "—"}</td>
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
              !loading && (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* --- CONTROLES DE PAGINACIÓN --- */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            title="Primera página"
          >
            «
          </button>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Página anterior"
          >
            ‹
          </button>

          {/* Números de página */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
            )
            .reduce((acc, page, idx, arr) => {
              if (idx > 0 && page - arr[idx - 1] > 1) {
                acc.push("...");
              }
              acc.push(page);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "..." ? (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  className={`pagination-btn ${
                    item === currentPage ? "active" : ""
                  }`}
                  onClick={() => handlePageChange(item)}
                >
                  {item}
                </button>
              )
            )}

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Página siguiente"
          >
            ›
          </button>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Última página"
          >
            »
          </button>
        </div>
      )}

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
