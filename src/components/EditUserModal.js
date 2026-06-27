import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ROL_ADMIN, ROL_LIDER, ROL_MULTIPLICADOR } from '../constants';

function EditUserModal({ user, onClose, onSave }) {
  const [rol, setRol] = useState(user.rol);
  // 1. Estados para manejar la lista de multiplicadores
  const [multiplicadores, setMultiplicadores] = useState([]);
  const [asignados, setAsignados] = useState(user.multiplicadoresAsignados || []);
  const [loading, setLoading] = useState(true);

  // 2. useEffect para cargar todos los usuarios con rol 'multiplicador'
  useEffect(() => {
    const fetchMultiplicadores = async () => {
      // Creamos una consulta que solo trae a los multiplicadores
      const q = query(collection(db, "users"), where("rol", "==", ROL_MULTIPLICADOR));
      const querySnapshot = await getDocs(q);
      const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMultiplicadores(lista);
      setLoading(false);
    };

    fetchMultiplicadores();
  }, []);

  // 3. Función para manejar la selección de checkboxes
  const handleCheckboxChange = (multiplicadorId) => {
    setAsignados(prevAsignados => {
      if (prevAsignados.includes(multiplicadorId)) {
        // Si ya está, lo quitamos
        return prevAsignados.filter(id => id !== multiplicadorId);
      } else {
        // Si no está, lo añadimos
        return [...prevAsignados, multiplicadorId];
      }
    });
  };

  const handleSave = () => {
    // Ahora pasamos el usuario, el nuevo rol Y la lista de asignados
    onSave(user.id, rol, asignados);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Editar Usuario</h2>
        <p><strong>Nombre:</strong> {user.nombre}</p>
        <p><strong>Email:</strong> {user.email}</p>
        
        <div className="input-group">
          <label htmlFor="rol">Rol del Usuario</label>
          <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value={ROL_MULTIPLICADOR}>Multiplicador</option>
            <option value={ROL_LIDER}>Lider de Zona</option>
            <option value={ROL_ADMIN}>Administrador</option>
          </select>
        </div>

        {/* --- 4. SECCIÓN CONDICIONAL PARA LÍDER DE ZONA --- */}
        {rol === ROL_LIDER && (
          <div className="assignment-section">
            <h4>Asignar Multiplicadores</h4>
            {loading ? <p>Cargando multiplicadores...</p> : (
              <div className="multiplicadores-list">
                {multiplicadores.map(m => (
                  <div key={m.id} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      id={m.id} 
                      checked={asignados.includes(m.id)} 
                      onChange={() => handleCheckboxChange(m.id)}
                    />
                    <label htmlFor={m.id}>{m.nombre} ({m.email})</label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={handleSave} className="save-button">Guardar Cambios</button>
          <button onClick={onClose} className="cancel-button">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default EditUserModal;