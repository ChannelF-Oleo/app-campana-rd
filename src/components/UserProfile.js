import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import AvatarFoto from "./AvatarFoto";
import { auth } from "../firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { FaUser, FaEnvelope, FaIdBadge, FaLock, FaCheckCircle } from "react-icons/fa";
import "./UserProfile.css";

const UserProfile = () => {
    const { user } = useAuth();
    const [newPassword, setNewPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [status, setStatus] = useState({ type: "", message: "" });
    const [isChanging, setIsChanging] = useState(false);

    if (!user) return <div className="loading">Cargando perfil...</div>;

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setIsChanging(true);
        setStatus({ type: "", message: "" });

        try {
            const firebaseUser = auth.currentUser;

            // 1. Re-autenticación obligatoria por seguridad en Firebase al cambiar password
            const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);

            // 2. Actualizar contraseña
            await updatePassword(firebaseUser, newPassword);

            setStatus({ type: "success", message: "¡Contraseña actualizada con éxito!" });
            setNewPassword("");
            setCurrentPassword("");
        } catch (error) {
            console.error(error);
            setStatus({
                type: "error",
                message: "Error: Verifica tu contraseña actual o intenta cerrar sesión y volver a entrar."
            });
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-card">
                {/* Encabezado con Foto */}
                <div className="profile-header">
                    <AvatarFoto
                        cedula={user.cedula}
                        nombre={user.nombre}
                        size="120px"
                        allowReport={true}
                    />
                    <h2>{user.nombre || "Usuario"}</h2>
                    <span className="badge-rol">{user.rol || "Activista"}</span>
                </div>

                {/* Información del Usuario */}
                <div className="profile-info">
                    <div className="info-item">
                        <FaEnvelope className="icon" />
                        <div>
                            <label>Correo Electrónico</label>
                            <p>{user.email}</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <FaIdBadge className="icon" />
                        <div>
                            <label>Cédula</label>
                            <p>{user.cedula || "No registrada"}</p>
                        </div>
                    </div>
                </div>

                <hr />

                {/* Sección de Ajustes */}
                <div className="profile-settings">
                    <h3><FaLock /> Cambiar Contraseña</h3>
                    <form onSubmit={handleChangePassword}>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Contraseña Actual"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Nueva Contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength="6"
                            />
                        </div>

                        {status.message && (
                            <div className={`status-msg ${status.type}`}>
                                {status.type === "success" && <FaCheckCircle />} {status.message}
                            </div>
                        )}

                        <button type="submit" disabled={isChanging} className="btn-save">
                            {isChanging ? "Procesando..." : "Actualizar Contraseña"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
