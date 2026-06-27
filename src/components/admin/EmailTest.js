import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { ROL_ADMIN, ROL_MULTIPLICADOR } from '../../constants';

const EmailTest = () => {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    template: 'simpatizante_welcome',
    nombre: '',
    email: '',
    rol: ROL_MULTIPLICADOR
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const templates = [
    { value: 'simpatizante_welcome', label: 'Bienvenida Simpatizante' },
    { value: 'user_welcome', label: 'Bienvenida Usuario' },
    { value: 'password_reset', label: 'Recuperar Contraseña' },
    { value: 'goal_notification', label: 'Notificación de Meta' }
  ];

  const roles = [
    { value: ROL_MULTIPLICADOR, label: 'Multiplicador' },
    { value: 'coordinador', label: 'Coordinador' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: ROL_ADMIN, label: 'Administrador' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const sendCustomEmail = httpsCallable(functions, 'sendCustomEmail');
      
      const emailData = {
        to: formData.to,
        subject: formData.subject,
        template: formData.template,
        data: {
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          resetLink: 'https://fe28.com/reset-password?token=example', // Para pruebas
          meta: { objetivo: 50, periodo: 'mensual' }, // Para pruebas
          progreso: 25 // Para pruebas
        }
      };

      const response = await sendCustomEmail(emailData);
      setResult(response.data);
    } catch (err) {
      console.error('Error enviando correo:', err);
      setError(err.message || 'Error enviando correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-test-container">
      <div className="email-test-card">
        <h2>🧪 Prueba de Correos Electrónicos</h2>
        <p className="email-test-description">
          Herramienta para probar el envío de correos con las plantillas de Resend
        </p>

        <form onSubmit={handleSubmit} className="email-test-form">
          <div className="form-group">
            <label htmlFor="to">Destinatario:</label>
            <input
              type="email"
              id="to"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              required
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Asunto:</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              placeholder="Asunto del correo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="template">Plantilla:</label>
            <select
              id="template"
              name="template"
              value={formData.template}
              onChange={handleInputChange}
              required
            >
              {templates.map(template => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre del Destinatario:</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              placeholder="Juan Pérez"
            />
          </div>

          {formData.template === 'user_welcome' && (
            <>
              <div className="form-group">
                <label htmlFor="email">Email (para plantilla):</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Mismo que destinatario"
                />
              </div>

              <div className="form-group">
                <label htmlFor="rol">Rol del Usuario:</label>
                <select
                  id="rol"
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                >
                  {roles.map(rol => (
                    <option key={rol.value} value={rol.value}>
                      {rol.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="send-button"
            disabled={loading}
          >
            {loading ? '📤 Enviando...' : '📧 Enviar Correo de Prueba'}
          </button>
        </form>

        {result && (
          <div className="result success">
            <h3>✅ Correo Enviado Exitosamente</h3>
            <p><strong>Message ID:</strong> {result.messageId}</p>
            <p>Revisa la bandeja de entrada del destinatario.</p>
          </div>
        )}

        {error && (
          <div className="result error">
            <h3>❌ Error al Enviar Correo</h3>
            <p>{error}</p>
            <details>
              <summary>Posibles soluciones:</summary>
              <ul>
                <li>Verifica que el API Key de Resend esté configurado</li>
                <li>Confirma que el dominio esté verificado en Resend</li>
                <li>Revisa los logs de Firebase Functions</li>
                <li>Verifica que el email del destinatario sea válido</li>
              </ul>
            </details>
          </div>
        )}

        <div className="email-test-info">
          <h3>📋 Información de las Plantillas</h3>
          <ul>
            <li><strong>Bienvenida Simpatizante:</strong> Para personas que se registran como simpatizantes</li>
            <li><strong>Bienvenida Usuario:</strong> Para usuarios que acceden al dashboard</li>
            <li><strong>Recuperar Contraseña:</strong> Para reset de contraseñas</li>
            <li><strong>Notificación de Meta:</strong> Para informar progreso de objetivos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailTest;