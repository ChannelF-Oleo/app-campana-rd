import React, { useState } from 'react';
// Reutilizaremos los estilos de la otra modal para mantener la consistencia
import './EditUserModal.css'; 

function SetGoalModal({ user, onClose, onSave }) {
  // Leemos la meta actual del usuario o ponemos valores por defecto
  const [goalAmount, setGoalAmount] = useState(user.goal?.amount || 50);
  const [goalPeriod, setGoalPeriod] = useState(user.goal?.period || 'mensual');

  const handleSave = () => {
    // Validamos que el número sea válido
    if (isNaN(goalAmount) || goalAmount <= 0) {
      alert("Por favor, ingresa un número válido para tu meta.");
      return;
    }
    // Llamamos a la función de guardado y le pasamos los nuevos valores
    onSave({
      amount: parseInt(goalAmount, 10), // Nos aseguramos de que sea un número
      period: goalPeriod
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Establecer Mi Meta</h2>
        <p>Define tu objetivo de registros para motivar tu trabajo.</p>
        
        <div className="input-group">
          <label htmlFor="goalAmount">Número de Simpatizantes a Registrar</label>
          <input 
            type="number" 
            id="goalAmount" 
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="goalPeriod">Período de la Meta</label>
          <select id="goalPeriod" value={goalPeriod} onChange={(e) => setGoalPeriod(e.target.value)}>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>

        <div className="modal-actions">
          <button onClick={handleSave} className="save-button">Guardar Meta</button>
          <button onClick={onClose} className="cancel-button">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default SetGoalModal;