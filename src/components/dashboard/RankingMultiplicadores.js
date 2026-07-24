import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import AvatarFoto from "../ui/AvatarFoto";
import {
  ROL_ADMIN,
  ROL_LIDER,
  ROL_MULTIPLICADOR,
  normalizarCedula,
} from "../../constants";

// Ranking de multiplicadores por cantidad de registros (motivacional).
//
// Alcance por rol (limitado por las reglas de Firestore para listar `users`):
//  - ADMIN: lista TODOS los multiplicadores (ranking global).
//  - LÍDER: solo puede listar su propio equipo (liderAsignado == uid), así que
//    ve el ranking de SU pelotón.
//  - MULTIPLICADOR: no puede listar otros usuarios (regla `list`), por eso este
//    componente no se le muestra (se monta solo para admin/líder en Dashboard).
//
// Los conteos se calculan EN VIVO desde `simpatizantes` (legible por cualquier
// usuario logueado), para que coincidan con los que muestran MyTeam/ManageUsers
// y no dependan de que el contador almacenado esté al día.

const MEDALLAS = ["🥇", "🥈", "🥉"];

function RankingMultiplicadores({ user }) {
  const esAdmin = user?.rol === ROL_ADMIN;
  const esLider = user?.rol === ROL_LIDER;

  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zonaFiltro, setZonaFiltro] = useState("todas");

  useEffect(() => {
    if (!user || (!esAdmin && !esLider)) {
      setLoading(false);
      return;
    }

    // Admin: todos los multiplicadores. Líder: su equipo (por reglas de acceso).
    const usersQuery = esAdmin
      ? query(collection(db, "users"), where("rol", "==", ROL_MULTIPLICADOR))
      : query(collection(db, "users"), where("liderAsignado", "==", user.uid));

    const unsub = onSnapshot(
      usersQuery,
      async (snap) => {
        try {
          const miembros = snap.docs
            .map((d) => ({ id: d.id, uid: d.id, ...d.data() }))
            // Para el líder, su query trae todo su equipo: filtramos a multiplicadores.
            .filter((m) => m.rol === ROL_MULTIPLICADOR);

          // Conteo por registradoPor + zona por cédula (desde simpatizantes).
          const simpSnap = await getDocs(collection(db, "simpatizantes"));
          const counts = {};
          const zonaPorCedula = {};
          simpSnap.forEach((docu) => {
            const data = docu.data();
            if (data.registradoPor) {
              counts[data.registradoPor] = (counts[data.registradoPor] || 0) + 1;
            }
            const ced = normalizarCedula(data.cedula);
            if (ced && !zonaPorCedula[ced] && data.zona) {
              zonaPorCedula[ced] = data.zona;
            }
          });

          const enriquecidos = miembros
            .map((m) => ({
              ...m,
              registrationCount: counts[m.uid] || 0,
              zona: m.zona || zonaPorCedula[normalizarCedula(m.cedula)] || "",
            }))
            .sort((a, b) => b.registrationCount - a.registrationCount);

          setRanking(enriquecidos);
          setLoading(false);
        } catch (e) {
          console.error("Error construyendo el ranking:", e);
          setError("No se pudo cargar el ranking.");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error listando multiplicadores:", err);
        setError("No se pudo cargar el ranking.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, esAdmin, esLider]);

  // Solo admin y líder ven el ranking.
  if (!esAdmin && !esLider) return null;

  if (error) {
    return (
      <div className="metric-card">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  // Zonas disponibles para el filtro (opcional).
  const zonasDisponibles = Array.from(
    new Set(ranking.map((m) => m.zona).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  // Aplicamos el filtro por zona y RE-numeramos las posiciones sobre la lista
  // visible (posición 1..n dentro de la zona seleccionada).
  const listaFiltrada =
    zonaFiltro === "todas"
      ? ranking
      : ranking.filter((m) => m.zona === zonaFiltro);

  return (
    <div className="metric-card ranking-card">
      <div className="ranking-header">
        <h3>{esAdmin ? "Ranking de Multiplicadores" : "Ranking de mi Equipo"}</h3>
        {zonasDisponibles.length > 0 && (
          <select
            className="role-filter-select ranking-zona-select"
            value={zonaFiltro}
            onChange={(e) => setZonaFiltro(e.target.value)}
          >
            <option value="todas">Todas las zonas</option>
            {zonasDisponibles.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className="metric-value">...</p>
      ) : listaFiltrada.length === 0 ? (
        <p className="progress-text" style={{ textAlign: "left" }}>
          Aún no hay registros para mostrar.
        </p>
      ) : (
        <ol className="ranking-list">
          {listaFiltrada.map((m, i) => {
            const esTop = i < 3;
            const soyYo = m.uid === user.uid;
            return (
              <li
                key={m.uid}
                className={`ranking-item${esTop ? ` ranking-item--top ranking-item--${i + 1}` : ""}${
                  soyYo ? " ranking-item--me" : ""
                }`}
              >
                <span className="ranking-pos">
                  {esTop ? MEDALLAS[i] : i + 1}
                </span>
                <AvatarFoto cedula={m.cedula} nombre={m.nombre} size="40px" />
                <span className="ranking-nombre">
                  {m.nombre || "Sin nombre"}
                  {soyYo && <small className="ranking-yo"> (tú)</small>}
                </span>
                <span className="ranking-total count-badge">
                  {m.registrationCount}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default RankingMultiplicadores;
