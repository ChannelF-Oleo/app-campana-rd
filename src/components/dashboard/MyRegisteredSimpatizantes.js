import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { FaFilePdf, FaFileImage } from "react-icons/fa";
import AvatarFoto from "../ui/AvatarFoto";
import { generarPadronPDF } from "../../utils/pdfPadron";
import { generarExcelConFoto } from "../../utils/excelConFoto";

// Campos/columnas para los exports con foto de simpatizantes. Usa los campos
// nuevos de ubicación electoral; fallback "N/A" lo aplican los generadores.
const CAMPOS_PDF_SIMP = [
  { label: "Nombre", key: "nombre" },
  { label: "Cédula", key: "cedula" },
  { label: "Teléfono", key: "telefono" },
  { label: "Zona", key: "zona" },
  { label: "Sector", key: "sector" },
  { label: "Subsector", key: "subsector" },
  { label: "Recinto", key: "recinto" },
  { label: "Colegio", key: "colegio" },
];

const COLUMNAS_EXCEL_SIMP = [
  { header: "Nombre", key: "nombre", width: 28 },
  { header: "Cédula", key: "cedula", width: 16 },
  { header: "Teléfono", key: "telefono", width: 16 },
  { header: "Zona", key: "zona", width: 16 },
  { header: "Sector", key: "sector", width: 18 },
  { header: "Subsector", key: "subsector", width: 18 },
  { header: "Recinto", key: "recinto", width: 22 },
  { header: "Colegio", key: "colegio", width: 14 },
  { header: "FechaRegistro", key: "fechaRegistro", width: 16 },
];

// ¿La fecha (Timestamp Firestore) cae dentro del rango [desde, hasta]? Los
// límites son cadenas "YYYY-MM-DD" (input date); vacío = sin límite por ese lado.
const enRangoFecha = (ts, desde, hasta) => {
  if (!desde && !hasta) return true;
  if (!ts || !ts.toDate) return false; // filtrando por fecha, sin fecha => fuera
  const d = ts.toDate();
  if (desde && d < new Date(`${desde}T00:00:00`)) return false;
  if (hasta && d > new Date(`${hasta}T23:59:59`)) return false;
  return true;
};

function MyRegisteredSimpatizantes({ user }) {
  const [simpatizantes, setSimpatizantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Filtros combinables (además del activista, que aquí es el propio user) ---
  const [zonaFilter, setZonaFilter] = useState("todas");
  const [sectorFilter, setSectorFilter] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Estado de los exports con foto (PDF/Excel).
  const [exportando, setExportando] = useState(false);
  const [progreso, setProgreso] = useState(null); // { fase, hechos, total }
  const textoProgreso = progreso
    ? `Generando... ${progreso.hechos}/${progreso.total}`
    : "";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const simpatizantesRef = collection(db, "simpatizantes");
    const q = query(
      simpatizantesRef,
      where("registradoPor", "==", user.uid),
      orderBy("fechaRegistro", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const registeredList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSimpatizantes(registeredList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching registered simpatizantes:", err);
        setError(
          "Error al cargar tus registros. Verifica la consola o contacta al administrador."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Opciones de los selectores, derivadas de los registros cargados.
  const zonasDisponibles = Array.from(
    new Set(simpatizantes.map((s) => s.zona).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  const sectoresDisponibles = Array.from(
    new Set(simpatizantes.map((s) => s.sector).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  // Lista tras aplicar TODOS los filtros activos (zona + sector + rango fechas).
  const simpatizantesFiltrados = simpatizantes.filter((s) => {
    if (zonaFilter !== "todas" && s.zona !== zonaFilter) return false;
    if (sectorFilter !== "todos" && s.sector !== sectorFilter) return false;
    if (!enRangoFecha(s.fechaRegistro, fechaDesde, fechaHasta)) return false;
    return true;
  });

  const hayFiltros =
    zonaFilter !== "todas" ||
    sectorFilter !== "todos" ||
    !!fechaDesde ||
    !!fechaHasta;

  // Partes legibles de los filtros activos (para título/nombre de archivo).
  const partesFiltro = () => {
    const p = [];
    if (zonaFilter !== "todas") p.push(zonaFilter);
    if (sectorFilter !== "todos") p.push(sectorFilter);
    if (fechaDesde) p.push(`desde ${fechaDesde}`);
    if (fechaHasta) p.push(`hasta ${fechaHasta}`);
    return p;
  };
  const tituloConFiltros = (base) => {
    const p = partesFiltro();
    return p.length ? `${base} - ${p.join(" · ")}` : base;
  };
  const nombreConFiltros = (base, ext) => {
    const p = partesFiltro();
    const suf = p.length ? `_${p.join("_").replace(/[\s·]+/g, "_")}` : "";
    return `${base}${suf}.${ext}`;
  };

  const safeNombre = (user.nombre || "usuario").replace(/\s/g, "_");

  const sinDatos = () => {
    alert(
      hayFiltros
        ? "No hay registros que coincidan con los filtros."
        : "No tienes registros para exportar."
    );
  };

  // Normaliza los simpatizantes al shape que consumen los generadores:
  // debe incluir `cedula` (para resolver la foto) y las `key` referenciadas.
  // La fecha se pre-formatea porque los generadores solo convierten a texto.
  const buildPersonasExport = () =>
    simpatizantesFiltrados.map((s) => ({
      cedula: s.cedula,
      nombre: s.nombre,
      telefono: s.telefono,
      zona: s.zona,
      sector: s.sector,
      subsector: s.subsector,
      recinto: s.recinto,
      colegio: s.colegioElectoral,
      fechaRegistro: s.fechaRegistro
        ? s.fechaRegistro.toDate().toLocaleDateString("es-DO")
        : "",
    }));

  // Export PDF tipo padrón (foto grande + datos por ficha).
  const handleExportPDF = async () => {
    if (simpatizantesFiltrados.length === 0) return sinDatos();
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: simpatizantesFiltrados.length });
    try {
      await generarPadronPDF(buildPersonasExport(), {
        titulo: tituloConFiltros("Padrón de Simpatizantes"),
        campos: CAMPOS_PDF_SIMP,
        fileName: nombreConFiltros(`Mis_Registros_Padron_${safeNombre}`, "pdf"),
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };

  // Export Excel con la foto embebida en cada fila.
  const handleExportExcelFoto = async () => {
    if (simpatizantesFiltrados.length === 0) return sinDatos();
    setExportando(true);
    setProgreso({ fase: "fotos", hechos: 0, total: simpatizantesFiltrados.length });
    try {
      await generarExcelConFoto(buildPersonasExport(), {
        hojaNombre: "Mis Registros",
        columnas: COLUMNAS_EXCEL_SIMP,
        fileName: nombreConFiltros(`Mis_Registros_Con_Foto_${safeNombre}`, "xlsx"),
        onProgress: (fase, hechos, total) =>
          setProgreso({ fase, hechos, total }),
      });
    } catch (err) {
      console.error("Error generando Excel:", err);
      alert("Hubo un error al generar el Excel.");
    } finally {
      setExportando(false);
      setProgreso(null);
    }
  };
  // ------------------------------------

  if (loading) {
    return <p>Cargando tus registros...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="my-registrations-container glass-panel">
      {simpatizantes.length > 0 && (
        <>
          {/* Filtros combinables (zona + sector + rango de fechas). */}
          <div className="filters-bar-wrapper">
            <select
              className="role-filter-select"
              value={zonaFilter}
              onChange={(e) => setZonaFilter(e.target.value)}
            >
              <option value="todas">Todas las zonas</option>
              {zonasDisponibles.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <select
              className="role-filter-select"
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
            >
              <option value="todos">Todos los sectores</option>
              {sectoresDisponibles.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
            <label className="filtro-fecha">
              <span>Desde</span>
              <input
                type="date"
                className="search-input"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </label>
            <label className="filtro-fecha">
              <span>Hasta</span>
              <input
                type="date"
                className="search-input"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </label>
          </div>

          {/* Barra de Acciones y Botones de Exportar */}
          <div className="registration-actions-bar">
            <p className="registration-count">
              Mostrando: <strong>{simpatizantesFiltrados.length}</strong> de{" "}
              {simpatizantes.length}
            </p>
            <button
              onClick={handleExportPDF}
              className="export-registros-button"
              title="Exportar PDF tipo padrón con foto (lista filtrada)"
              disabled={exportando || simpatizantesFiltrados.length === 0}
            >
              <FaFilePdf /> {exportando ? textoProgreso : "PDF con foto (padrón)"}
            </button>
            <button
              onClick={handleExportExcelFoto}
              className="export-registros-button"
              title="Exportar Excel con foto embebida (lista filtrada)"
              disabled={exportando || simpatizantesFiltrados.length === 0}
            >
              <FaFileImage /> {exportando ? textoProgreso : "Excel con foto"}
            </button>
          </div>
        </>
      )}

      {simpatizantes.length === 0 ? (
        <div className="empty-state">
          <p>Aún no has registrado ningún simpatizante.</p>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            ¡Empieza hoy mismo usando el formulario de registro!
          </p>
        </div>
      ) : simpatizantesFiltrados.length === 0 ? (
        <div className="empty-state">
          <p>Ningún registro coincide con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="registrations-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nombre</th>
                <th>Sector</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {simpatizantesFiltrados.map((simpatizante) => (
                <tr key={simpatizante.id}>
                  <td style={{ width: "60px" }}>
                    <AvatarFoto
                      cedula={simpatizante.cedula}
                      nombre={simpatizante.nombre}
                      size="40px"
                      allowReport={true}
                    />
                  </td>

                  <td>
                    <div style={{ fontWeight: "600" }}>
                      {simpatizante.nombre}
                    </div>
                    {simpatizante.cedula ? (
                      <small style={{ color: "#666" }}>
                        {simpatizante.cedula}
                      </small>
                    ) : (
                      <small style={{ color: "#e63946" }}>Sin Cédula</small>
                    )}
                  </td>

                  <td>{simpatizante.sector}</td>

                  <td>
                    {simpatizante.fechaRegistro
                      ?.toDate()
                      .toLocaleDateString("es-DO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyRegisteredSimpatizantes;
