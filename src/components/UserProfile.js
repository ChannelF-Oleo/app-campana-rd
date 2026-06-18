import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../AuthContext";
import AvatarFoto from "./AvatarFoto";
import { auth } from "../firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { FaEnvelope, FaIdBadge, FaLock, FaCheckCircle, FaTimes } from "react-icons/fa";

const INITIAL_FORM = { currentPassword: "", newPassword: "" };
const INITIAL_STATUS = { type: "", message: "" };

const UserProfile = () => {
    const { user } = useAuth();
    const [form, setForm] = useState(INITIAL_FORM);
    const [status, setStatus] = useState(INITIAL_STATUS);
    const [isChanging, setIsChanging] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleInput = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);

    const openModal = useCallback(() => {
        setForm(INITIAL_FORM);
        setStatus(INITIAL_STATUS);
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        if (isChanging) return; // evita cerrar mientras procesa
        setShowModal(false);
    }, [isChanging]);

    const handleChangePassword = useCallback(async (e) => {
        e.preventDefault();
        setIsChanging(true);
        setStatus(INITIAL_STATUS);
        try {
            const firebaseUser = auth.currentUser;
            const credential = EmailAuthProvider.credential(firebaseUser.email, form.currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, form.newPassword);
            setStatus({ type: "success", message: "¡Contraseña actualizada con éxito!" });
            setForm(INITIAL_FORM);
        } catch (error) {
            console.error(error);
            setStatus({
                type: "error",
                message: "Error: Verifica tu contraseña actual o intenta cerrar sesión y volver a entrar.",
            });
        } finally {
            setIsChanging(false);
        }
    }, [form]);

    // Cerrar con tecla Escape
    useEffect(() => {
        if (!showModal) return;
        const onKey = (e) => e.key === "Escape" && closeModal();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showModal, closeModal]);

    if (!user) return <div className="loading">Cargando perfil...</div>;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <AvatarFoto cedula={user.cedula} nombre={user.nombre} size="120px" allowReport />
                    <h2>{user.nombre || "Usuario"}</h2>
                    <span className="badge-rol">{user.rol || "Activista"}</span>
                </div>

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

                <div className="profile-settings">
                    <button type="button" className="btn-change-password" onClick={openModal}>
                        <FaLock /> Cambiar Contraseña
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-close"
                            onClick={closeModal}
                            disabled={isChanging}
                            aria-label="Cerrar"
                        >
                            <FaTimes />
                        </button>

                        <h3 id="modal-title"><FaLock /> Cambiar Contraseña</h3>

                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <input
                                    type="password"
                                    name="currentPassword"
                                    placeholder="Contraseña Actual"
                                    value={form.currentPassword}
                                    onChange={handleInput}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    name="newPassword"
                                    placeholder="Nueva Contraseña"
                                    value={form.newPassword}
                                    onChange={handleInput}
                                    required
                                    minLength="6"
                                />
                            </div>
                            {status.message && (
                                <div className={`status-msg ${status.type}`}>
                                    {status.type === "success" && <FaCheckCircle />} {status.message}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={closeModal} disabled={isChanging}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isChanging} className="btn-save">
                                    {isChanging ? "Procesando..." : "Actualizar Contraseña"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;

