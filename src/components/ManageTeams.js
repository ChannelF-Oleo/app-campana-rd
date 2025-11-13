import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import * as XLSX from 'xlsx'; 
import { FaFileExcel } from 'react-icons/fa'; 
import './ManageTeams.css';

function ManageTeams() {
    const [leaders, setLeaders] = useState([]);
    const [multipliers, setMultipliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedLeaderId, setExpandedLeaderId] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // [Lógica fetchUsers, assignMultiplier, unassignMultiplier, handleToggleExpand, etc. - Se mantiene igual]
    // ... [Tu código de funciones y useEffect permanece aquí]

    const fetchUsers = async () => {
      setLoading(true);
      setNotification({ message: '', type: '' });
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaders(allUsers.filter(user => user.rol === 'lider de zona'));
        setMultipliers(allUsers.filter(user => user.rol === 'multiplicador'));
      } catch (error) {
        console.error("Error fetching users:", error);
        setNotification({ message: 'Error al cargar usuarios.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchUsers();
    }, []);

    const assignMultiplier = async (leaderId, multiplierId) => {
        const leaderDocRef = doc(db, "users", leaderId);
        const multiplierDocRef = doc(db, "users", multiplierId);
        setNotification({ message: '', type: '' });
        try {
            await updateDoc(leaderDocRef, { multiplicadoresAsignados: arrayUnion(multiplierId) });
            await updateDoc(multiplierDocRef, { liderAsignado: leaderId });
            setMultipliers(prev => prev.map(m => m.id === multiplierId ? { ...m, liderAsignado: leaderId } : m));
            setLeaders(prev => prev.map(l => l.id === leaderId ? { ...l, multiplicadoresAsignados: [...(l.multiplicadoresAsignados || []), multiplierId] } : l));
            setNotification({ message: 'Soldado asignado.', type: 'success' });
        } catch (error) {
            console.error("Error assigning:", error);
            setNotification({ message: 'Error al asignar.', type: 'error' });
        }
    };

    const unassignMultiplier = async (leaderId, multiplierId) => {
        const leaderDocRef = doc(db, "users", leaderId);
        const multiplierDocRef = doc(db, "users", multiplierId);
        setNotification({ message: '', type: '' });
        try {
            await updateDoc(leaderDocRef, { multiplicadoresAsignados: arrayRemove(multiplierId) });
            await updateDoc(multiplierDocRef, { liderAsignado: null });
            setMultipliers(prev => prev.map(m => m.id === multiplierId ? { ...m, liderAsignado: null } : m));
            setLeaders(prev => prev.map(l => l.id === leaderId ? { ...l, multiplicadoresAsignados: (l.multiplicadoresAsignados || []).filter(id => id !== multiplierId) } : l));
            setNotification({ message: 'Soldado desasignado.', type: 'success' });
        } catch (error) {
            console.error("Error unassigning:", error);
            setNotification({ message: 'Error al desasignar.', type: 'error' });
        }
    };

    const handleToggleExpand = (leaderId) => {
        setExpandedLeaderId(prevId => (prevId === leaderId ? null : leaderId));
    };

    const availableMultipliers = multipliers.filter(m => !m.liderAsignado);
    
    // Función central para obtener los miembros asignados
    const getAssignedMultipliers = (leader) => {
        const assignedIds = leader.multiplicadoresAsignados || [];
        return multipliers.filter(multiplier => assignedIds.includes(multiplier.id));
    };

    // --- FUNCIÓN DE EXPORTACIÓN GLOBAL ---
    const exportAllTeams = () => {
        if (leaders.length === 0) {
            setNotification({ message: 'No hay líderes para exportar.', type: 'error' });
            return;
        }
        
        const dataToExport = leaders.map(leader => {
            const assigned = getAssignedMultipliers(leader);
            const assignedNames = assigned.map(m => m.nombre).join(', ');
            
            return {
                'Líder de Zona': leader.nombre,
                'Email del Líder': leader.email,
                'Total Soldados': assigned.length,
                'Nombres de Soldados': assignedNames || 'Ninguno',
            };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen Global de Equipos');
        
        XLSX.writeFile(workbook, 'Resumen_Global_Equipos.xlsx');
        setNotification({ message: 'Reporte global exportado con éxito.', type: 'success' });
    };

    // --- FUNCIÓN DE EXPORTACIÓN INDIVIDUAL ---
    const exportIndividualTeam = (leader) => {
        const assigned = getAssignedMultipliers(leader);
        if (assigned.length === 0) {
            setNotification({ message: `El pelotón de ${leader.nombre} está vacío.`, type: 'error' });
            return;
        }

        const dataToExport = assigned.map(multiplier => ({
            'Líder Asignado': leader.nombre,
            'Nombre del Soldado': multiplier.nombre,
            'Email del Soldado': multiplier.email,
            'Rol del Soldado': multiplier.rol,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Peloton de ${leader.nombre}`);
        
        const fileName = `Peloton_${leader.nombre.replace(/\s/g, '_')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        setNotification({ message: `Pelotón de ${leader.nombre} exportado.`, type: 'success' });
    };

    if (loading) return <p>Cargando pelotones...</p>;

    return (
        <div className="manage-teams-container">
            <h2>Gestión de Pelotones</h2>
            {notification.message && (<div className={`notification ${notification.type}`}>{notification.message}</div>)}

            {/* Barra de Exportación Global */}
            <div className="global-actions-bar">
                <button 
                    onClick={exportAllTeams} 
                    className="export-teams-button"
                    disabled={leaders.length === 0}
                    title="Exportar resumen de todos los líderes y sus equipos."
                >
                    <FaFileExcel /> Exportar Resumen Global ({leaders.length})
                </button>
            </div>

            <div className="leaders-accordion">
                {leaders.length === 0 && <p className="empty-state-global">No hay usuarios con el rol "Lider de Zona" creados.</p>}
                {leaders.map(leader => {
                    const assigned = getAssignedMultipliers(leader);
                    const isExpanded = expandedLeaderId === leader.id;

                    return (
                        <div key={leader.id} className={`leader-item ${isExpanded ? 'expanded' : ''}`}>
                            {/* Cabecera Clickeable */}
                            <div className="leader-header" onClick={() => handleToggleExpand(leader.id)}>
                                <h3>
                                    {leader.nombre} 
                                    <span className="team-count-badge">
                                        {assigned.length} {assigned.length === 1 ? 'asignado' : 'asignados'}
                                    </span>
                                </h3>
                                
                                {/* Botón de Exportación Individual */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); exportIndividualTeam(leader); }}
                                    className="icon-button export-individual-button"
                                    title={`Exportar Pelotón de ${leader.nombre}`}
                                    disabled={assigned.length === 0}
                                >
                                    <FaFileExcel />
                                </button>
                                
                                <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
                            </div>

                            {/* Contenido Desplegable */}
                            {isExpanded && (
                                <div className="leader-content">
                                    <div className="team-section">
                                        <h4>Soldados Asignados:</h4>
                                        {assigned.length > 0 ? (
                                            <ul className="multiplicadores-list">
                                                {assigned.map(m => (
                                                    <li key={m.id} className="multiplicador-item">
                                                        <span className="multiplicador-name">{m.nombre}</span>
                                                        <button onClick={() => unassignMultiplier(leader.id, m.id)} className="assign-button remove">Quitar</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (<p className="empty-state">No hay soldados asignados.</p>)}
                                    </div>
                                    <div className="available-section">
                                        <h4>Asignar Soldados Disponibles:</h4>
                                        {availableMultipliers.length > 0 ? (
                                            <ul className="multiplicadores-list">
                                                {availableMultipliers.map(m => (
                                                    <li key={m.id} className="multiplicador-item">
                                                        <span className="multiplicador-name">{m.nombre}</span>
                                                        <button onClick={() => assignMultiplier(leader.id, m.id)} className="assign-button add">Asignar</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (<p className="empty-state">No hay soldados sin asignar.</p>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ManageTeams;
