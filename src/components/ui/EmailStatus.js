import React from 'react';

const EmailStatus = ({ 
  isVisible, 
  status, 
  message, 
  onClose,
  emailDetails = {} 
}) => {
  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return '📤';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '📧';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'sending':
        return 'email-status-sending';
      case 'success':
        return 'email-status-success';
      case 'error':
        return 'email-status-error';
      case 'warning':
        return 'email-status-warning';
      default:
        return 'email-status-info';
    }
  };

  return (
    <div className={`email-status-overlay ${getStatusClass()}`}>
      <div className="email-status-modal">
        <div className="email-status-header">
          <span className="email-status-icon">{getStatusIcon()}</span>
          <h3>Estado del Correo Electrónico</h3>
          {onClose && (
            <button 
              className="email-status-close" 
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="email-status-content">
          <p className="email-status-message">{message}</p>
          
          {emailDetails.to && (
            <div className="email-details">
              <h4>📋 Detalles del Envío:</h4>
              <ul>
                <li><strong>Destinatario:</strong> {emailDetails.to}</li>
                <li><strong>Plantilla:</strong> {emailDetails.template || 'Bienvenida Simpatizante'}</li>
                {emailDetails.messageId && (
                  <li><strong>ID del Mensaje:</strong> {emailDetails.messageId}</li>
                )}
                {emailDetails.customMessage && (
                  <li><strong>Mensaje Personalizado:</strong> Incluido</li>
                )}
              </ul>
            </div>
          )}

          {status === 'sending' && (
            <div className="email-loading">
              <div className="email-spinner"></div>
              <p>Enviando correo, por favor espera...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="email-success-actions">
              <p>🎉 El correo ha sido enviado exitosamente.</p>
              <p>El destinatario debería recibirlo en los próximos minutos.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="email-error-actions">
              <p>💡 <strong>Posibles soluciones:</strong></p>
              <ul>
                <li>Verifica que el email sea válido</li>
                <li>Revisa tu conexión a internet</li>
                <li>Intenta nuevamente en unos minutos</li>
                <li>Contacta soporte si el problema persiste</li>
              </ul>
            </div>
          )}
        </div>

        {onClose && status !== 'sending' && (
          <div className="email-status-footer">
            <button 
              className="email-status-button" 
              onClick={onClose}
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailStatus;