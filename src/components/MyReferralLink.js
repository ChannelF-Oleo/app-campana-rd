import React, { useState } from 'react';
import './MyReferralLink.css';

function MyReferralLink({ user }) {
  // Construimos la URL completa usando window.location.origin para la base
  const referralLink = `${window.location.origin}/registro?ref=${user.uid}`;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    // navigator.clipboard solo funciona en contextos seguros (HTTPS o localhost)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000); // Mensaje dura 2 segundos
        })
        .catch(err => {
          console.error('Error al copiar el enlace: ', err);
          alert('No se pudo copiar el enlace automáticamente. Cópialo manualmente.');
        });
    } else {
      // Fallback para entornos no seguros (aunque raro en desarrollo)
      alert('La función de copiar no está disponible en este navegador/contexto. Cópialo manualmente.');
    }
  };

  return (
    <div className="referral-link-container">
      <h3>Tu Enlace Personal de Referido</h3>
      <p>Comparte este enlace para que los nuevos simpatizantes queden registrados bajo tu perfil:</p>
      <div className="link-box">
        {/* Usamos un input de solo lectura para mostrar el enlace */}
        <input type="text" value={referralLink} readOnly />
        <button onClick={copyToClipboard} disabled={copied}>
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

export default MyReferralLink;