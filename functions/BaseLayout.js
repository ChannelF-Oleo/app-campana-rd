// BaseLayout.js
// Estructura visual tipográfica reutilizable y optimizada para Resend

const getBaseTemplate = (content) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Félix Encarnación - Diputado SDO</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; }
    
    .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
    .campaign-header { background-color: #004d99; padding: 30px; text-align: center; color: #ffffff; }
    .campaign-header h1 { margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; }
    .campaign-header p { margin: 5px 0 0 0; font-size: 14px; color: #e3f2fd; text-transform: uppercase; letter-spacing: 1px; }
    
    .content { padding: 40px 30px; font-size: 16px; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: bold; color: #004d99; margin-bottom: 20px; }
    .message { margin-bottom: 20px; text-align: left; }
    
    .btn-container { text-align: center; margin: 30px 0; }
    .cta-button { 
      display: inline-block; 
      background-color: #004d99; 
      background: linear-gradient(135deg, #004d99, #0066cc); 
      color: #ffffff !important; 
      padding: 14px 28px; 
      text-decoration: none !important; 
      border-radius: 8px; 
      font-weight: bold; 
      box-shadow: 0 2px 4px rgba(0, 77, 153, 0.3);
    }
    
    .highlight { background-color: #e3f2fd; padding: 20px; border-left: 4px solid #004d99; margin: 25px 0; border-radius: 0 8px 8px 0; }
    .signature { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef; }
    .signature-name { font-weight: bold; color: #004d99; font-size: 18px; }
    .signature-title { color: #555555; font-size: 14px; margin-top: 3px; }
    
    .footer-info { background-color: #f8f9fa; padding: 25px 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
    .social-links { margin-bottom: 15px; }
    .social-links a { color: #004d99; text-decoration: none; margin: 0 8px; font-weight: bold; }
    
    @media (max-width: 600px) {
      .content { padding: 25px 20px; }
      .cta-button { width: 80%; text-align: center; padding: 12px 18px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="campaign-header">
      <h1>FÉLIX ENCARNACIÓN</h1>
      <p>Diputado • Santo Domingo Oeste</p>
    </div>
    
    <div class="content">
      ${content}
      
      <div class="signature">
        <div class="signature-name">Félix Encarnación</div>
        <div class="signature-title">Diputado de Santo Domingo Oeste | Circunscripción 4</div>
      </div>
    </div>
    
    <div class="footer-info">
      <div class="social-links">
        <a href="https://facebook.com/felixencarnacion">Facebook</a> |
        <a href="https://instagram.com/felixencarnacion">Instagram</a> |
        <a href="https://twitter.com/felixencarnacion">Twitter</a>
      </div>
      <p>Recibiste este correo electrónico porque te registraste en la plataforma oficial de vinculación de simpatizantes de Félix Encarnación.</p>
      <p>Si deseas gestionar tus preferencias de comunicación, puedes <a href="https://felixencarnacion.com/unsubscribe" style="color: #004d99; text-decoration: underline;">darte de baja aquí</a>.</p>
      <p style="margin-top: 12px; font-size: 11px; color: #a2aab1;">
        © 2026 Félix Encarnación - FE28. Santo Domingo Oeste, República Dominicana. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = getBaseTemplate;
