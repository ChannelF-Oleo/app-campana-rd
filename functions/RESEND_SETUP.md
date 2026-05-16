# Configuración de Resend para Firebase Functions

## 📧 Migración de Nodemailer a Resend

Se ha migrado el sistema de correos de **Nodemailer + Gmail** a **Resend** para mayor confiabilidad y mejores características.

## 🔧 Configuración Requerida

### 1. Obtener API Key de Resend

1. Ve a [Resend.com](https://resend.com) y crea una cuenta
2. Verifica tu dominio (recomendado) o usa el dominio de prueba
3. Genera una API Key en el dashboard
4. Copia la API Key (formato: `re_xxxxxxxxxx`)

### 2. Configurar Secreto en Firebase

```bash
# Configurar el secreto de Resend
firebase functions:secrets:set RESEND_API_KEY

# Cuando te pida el valor, pega tu API Key de Resend
```

### 3. Verificar Dominio (Recomendado)

Para usar un dominio personalizado como `notificaciones@felixencarnacion.com`:

1. En Resend Dashboard, ve a "Domains"
2. Agrega tu dominio (ej: `fe28.com`)
3. Configura los registros DNS requeridos:
   - SPF: `v=spf1 include:_spf.resend.com ~all`
   - DKIM: Los registros que te proporcione Resend
   - DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@fe28.com`

## 📨 Funciones de Correo Implementadas

### 1. Correo de Bienvenida para Simpatizantes
- **Trigger**: Cuando se crea un documento en `simpatizantes/`
- **Función**: `sendWelcomeEmailToSimpatizante`
- **Plantilla**: Diseño profesional con imágenes de campaña
- **Contenido**: Mensaje de bienvenida al movimiento

### 2. Correo de Bienvenida para Usuarios
- **Trigger**: Cuando se crea un documento en `users/`
- **Función**: `sendWelcomeEmailToUser`
- **Plantilla**: Información sobre el rol y acceso al dashboard
- **Contenido**: Credenciales y funcionalidades disponibles

### 3. Correos Personalizados
- **Función**: `sendCustomEmail` (callable)
- **Plantillas disponibles**:
  - `simpatizante_welcome`
  - `user_welcome`
  - `password_reset`
  - `goal_notification`

## 🎨 Plantillas de Correo

### Características de las Plantillas:
- **Responsive**: Se adaptan a móviles y desktop
- **Branding**: Colores y logos de la campaña FE28
- **Profesionales**: Diseño moderno con gradientes y sombras
- **Accesibles**: Contraste adecuado y fuentes legibles
- **Interactivas**: Botones de llamada a la acción

### Elementos Incluidos:
- Header con imagen de campaña
- Contenido personalizado por tipo de correo
- Firma de Félix Encarnación
- Footer con imagen de campaña
- Enlaces a redes sociales
- Información de contacto

## 🔄 Migración desde Gmail

### Cambios Realizados:
1. ✅ Reemplazado `nodemailer` por `resend`
2. ✅ Eliminados secretos de Gmail (`GMAIL_EMAIL`, `GMAIL_PASSWORD`)
3. ✅ Agregado secreto de Resend (`RESEND_API_KEY`)
4. ✅ Nuevas plantillas HTML profesionales
5. ✅ Separación de lógica en `emailTemplates.js`
6. ✅ Triggers separados para simpatizantes y usuarios
7. ✅ Función callable para correos personalizados

### Ventajas de Resend:
- ✅ Mayor deliverability (menos spam)
- ✅ API más simple y confiable
- ✅ Mejor manejo de errores
- ✅ Métricas detalladas de entrega
- ✅ Soporte nativo para dominios personalizados
- ✅ No requiere configuración de 2FA como Gmail

## 🚀 Despliegue

### 1. Instalar Dependencias
```bash
cd functions
npm install resend
```

### 2. Configurar Secretos
```bash
# Configurar API Key de Resend
firebase functions:secrets:set RESEND_API_KEY

# Eliminar secretos antiguos de Gmail (opcional)
firebase functions:secrets:destroy GMAIL_EMAIL
firebase functions:secrets:destroy GMAIL_PASSWORD
```

### 3. Desplegar Funciones
```bash
firebase deploy --only functions
```

## 🧪 Pruebas

### Probar Correo de Simpatizante:
1. Registra un nuevo simpatizante con email válido
2. Verifica que llegue el correo de bienvenida
3. Revisa los logs: `firebase functions:log`

### Probar Correo de Usuario:
1. Crea un nuevo usuario desde el admin
2. Verifica que llegue el correo de bienvenida
3. Revisa que el contenido sea apropiado para el rol

### Probar Correo Personalizado:
```javascript
// Desde el frontend
const sendCustomEmail = httpsCallable(functions, 'sendCustomEmail');

await sendCustomEmail({
  to: 'usuario@ejemplo.com',
  subject: 'Prueba de correo',
  template: 'user_welcome',
  data: {
    nombre: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    rol: 'coordinador'
  }
});
```

## 📊 Monitoreo

### Logs de Firebase:
```bash
# Ver logs en tiempo real
firebase functions:log --only sendWelcomeEmailToSimpatizante,sendWelcomeEmailToUser

# Ver logs específicos
firebase functions:log --filter="correo"
```

### Dashboard de Resend:
- Ve a [Resend Dashboard](https://resend.com/emails)
- Revisa métricas de entrega
- Verifica bounces y quejas
- Monitorea reputación del dominio

## 🔧 Troubleshooting

### Error: "API Key not found"
```bash
# Verificar que el secreto esté configurado
firebase functions:secrets:access RESEND_API_KEY

# Reconfigurar si es necesario
firebase functions:secrets:set RESEND_API_KEY
```

### Error: "Domain not verified"
- Verifica los registros DNS en tu proveedor
- Espera hasta 24 horas para propagación
- Usa el dominio de prueba mientras tanto

### Correos no llegan:
1. Revisa la carpeta de spam
2. Verifica logs de Firebase Functions
3. Revisa dashboard de Resend para errores
4. Confirma que el email del destinatario sea válido

## 📝 Notas Importantes

- **Límites**: Resend tiene límites según el plan (100 emails/día gratis)
- **Dominio**: Usar dominio verificado mejora la deliverability
- **Plantillas**: Se pueden personalizar en `emailTemplates.js`
- **Logs**: Siempre revisar logs para debugging
- **Backup**: Mantener las funciones antiguas comentadas por si acaso