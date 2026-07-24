import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
// Reutilizamos los estilos de modal existentes para mantener consistencia.

/**
 * Modal para crear una meta. Las metas viven en la subcolección
 * users/{uid}/metas como entidades con ciclo de vida. Regla del modelo: solo
 * puede haber UNA meta con estado "activa" a la vez, así que aquí se verifica
 * antes de permitir crear otra.
 *
 * Tipos:
 *  - "periodo": meta que se mide dentro del período vigente (semanal/mensual).
 *  - "acumulado": meta total a alcanzar DESDE ahora; se guarda baselineCount
 *    (registros del usuario al crear la meta) para medir solo el avance nuevo.
 */
function SetGoalModal({ user, onClose, onSave }) {
  const [goalAmount, setGoalAmount] = useState(50);
  const [tipo, setTipo] = useState("periodo");
  const [goalPeriod, setGoalPeriod] = useState("mensual");

  const [checking, setChecking] = useState(true);
  const [yaHayActiva, setYaHayActiva] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Regla: una sola meta activa. Verificamos al abrir.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const metasRef = collection(db, "users", user.uid, "metas");
        const snap = await getDocs(
          query(metasRef, where("estado", "==", "activa"))
        );
        if (!cancelado) setYaHayActiva(!snap.empty);
      } catch (e) {
        console.error("Error verificando meta activa:", e);
      } finally {
        if (!cancelado) setChecking(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [user.uid]);

  const handleSave = async () => {
    setError("");
    const amount = parseInt(goalAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError("Por favor, ingresa un número válido para tu meta.");
      return;
    }
    if (yaHayActiva) {
      setError("Ya tienes una meta activa. Complétala antes de crear otra.");
      return;
    }

    setSaving(true);
    try {
      const metasRef = collection(db, "users", user.uid, "metas");
      const nuevaMeta = {
        amount,
        tipo,
        estado: "activa",
        createdAt: serverTimestamp(),
        completedAt: null,
      };

      if (tipo === "periodo") {
        nuevaMeta.period = goalPeriod;
      } else {
        // Acumulado: baseline = total de registros del usuario AHORA. El avance
        // será (total actual - baseline), así la meta cuenta solo lo nuevo.
        const simpRef = collection(db, "simpatizantes");
        const totalSnap = await getDocs(
          query(simpRef, where("registradoPor", "==", user.uid))
        );
        nuevaMeta.baselineCount = totalSnap.size;
      }

      await addDoc(metasRef, nuevaMeta);
      if (typeof onSave === "function") onSave(nuevaMeta);
      onClose();
    } catch (e) {
      console.error("Error guardando meta:", e);
      setError("No se pudo guardar la meta. Intenta de nuevo.");
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Establecer Mi Meta</h2>
        <p>Define tu objetivo de registros para motivar tu trabajo.</p>

        {checking ? (
          <p>Verificando...</p>
        ) : yaHayActiva ? (
          <>
            <p className="error-message">
              Ya tienes una meta activa. Complétala antes de crear una nueva.
            </p>
            <div className="modal-actions">
              <button onClick={onClose} className="cancel-button">
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="input-group">
              <label htmlFor="goalAmount">
                Número de Simpatizantes a Registrar
              </label>
              <input
                type="number"
                id="goalAmount"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="input-group">
              <label htmlFor="goalTipo">Tipo de Meta</label>
              <select
                id="goalTipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                disabled={saving}
              >
                <option value="periodo">
                  Por período (se mide cada semana/mes)
                </option>
                <option value="acumulado">
                  Acumulada (total a alcanzar desde ahora)
                </option>
              </select>
            </div>

            {tipo === "periodo" && (
              <div className="input-group">
                <label htmlFor="goalPeriod">Período de la Meta</label>
                <select
                  id="goalPeriod"
                  value={goalPeriod}
                  onChange={(e) => setGoalPeriod(e.target.value)}
                  disabled={saving}
                >
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            )}

            {error && <p className="error-message">{error}</p>}

            <div className="modal-actions">
              <button
                onClick={handleSave}
                className="save-button"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar Meta"}
              </button>
              <button
                onClick={onClose}
                className="cancel-button"
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SetGoalModal;
