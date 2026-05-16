# Configuración SEO y Google Analytics

## 📋 Archivos Creados/Modificados

### 1. Sitemap.xml
- **Ubicación**: `/public/sitemap.xml`
- **Descripción**: Mapa del sitio para indexación en Google
- **URLs incluidas**:
  - Página principal (/)
  - Propuestas (/propuestas)
  - Registro público (/registro)
  - Registro de app (/registro-app)
  - Login (/login)

### 2. Robots.txt
- **Ubicación**: `/public/robots.txt`
- **Modificaciones**:
  - Permite indexación de páginas públicas
  - Bloquea rutas administrativas (/admin/, /dashboard/)
  - Incluye referencia al sitemap

### 3. Google Analytics
- **ID de seguimiento**: `G-EB27HNVEQY`
- **Implementación**:
  - Script de Google Analytics en `index.html`
  - Utilidades de seguimiento en `/src/utils/analytics.js`
  - Hook de rastreo automático en `/src/hooks/usePageTracking.js`

## 🔧 Configuración Requerida

### 1. Actualizar el Dominio
**IMPORTANTE**: Debes reemplazar `https://your-domain.com/` en los siguientes archivos:

1. **sitemap.xml** - Líneas con `<loc>https://your-domain.com/...</loc>`
2. **robots.txt** - Línea `Sitemap: https://your-domain.com/sitemap.xml`
3. **index.html** - Meta tags Open Graph y Twitter

### 2. Verificar Google Analytics
- El código `G-EB27HNVEQY` ya está configurado
- Verifica que sea el ID correcto en Google Analytics Console

## 📊 Eventos de Google Analytics Configurados

### Eventos Automáticos
- **Visualizaciones de página**: Se rastrean automáticamente
- **Navegación**: Cambios de ruta se registran

### Eventos Personalizados Disponibles
```javascript
import { trackCampaignEvents } from './utils/analytics';

// Registro de usuario
trackCampaignEvents.userRegistration('email');

// Login
trackCampaignEvents.userLogin('email');

// Ver propuestas
trackCampaignEvents.viewProposals();

// Registro de simpatizante
trackCampaignEvents.registerSimpatizante();

// Compartir enlace
trackCampaignEvents.shareReferralLink('whatsapp');

// Navegación del dashboard
trackCampaignEvents.dashboardNavigation('usuarios');

// Establecer meta
trackCampaignEvents.setGoal('monthly_registrations');

// Descarga de documento
trackCampaignEvents.downloadDocument('propuestas.pdf');
```

## 🚀 Pasos para Activar SEO

### 1. Google Search Console
1. Ve a [Google Search Console](https://search.google.com/search-console/)
2. Agrega tu dominio
3. Verifica la propiedad del sitio
4. Envía el sitemap: `https://tu-dominio.com/sitemap.xml`

### 2. Google Analytics
1. Ve a [Google Analytics](https://analytics.google.com/)
2. Verifica que el ID `G-EB27HNVEQY` esté activo
3. Configura objetivos de conversión si es necesario

### 3. Meta Tags Adicionales
El archivo `index.html` ya incluye:
- Meta description optimizada
- Keywords relevantes
- Open Graph para redes sociales
- Twitter Cards
- Idioma configurado a español

## 📈 Monitoreo y Optimización

### Métricas Importantes a Monitorear
1. **Páginas más visitadas**
2. **Tasa de conversión de registro**
3. **Fuentes de tráfico**
4. **Tiempo en el sitio**
5. **Tasa de rebote**

### Recomendaciones SEO Adicionales
1. **Contenido**: Agregar más contenido textual en las páginas
2. **Velocidad**: Optimizar imágenes y recursos
3. **Mobile**: Verificar responsividad completa
4. **Enlaces**: Crear estrategia de link building
5. **Contenido regular**: Blog o sección de noticias

## 🔍 Verificación de Implementación

Para verificar que todo funciona:

1. **Sitemap**: Visita `https://tu-dominio.com/sitemap.xml`
2. **Robots**: Visita `https://tu-dominio.com/robots.txt`
3. **Analytics**: Abre las herramientas de desarrollador y verifica que se envían eventos a GA
4. **Meta tags**: Usa herramientas como [Open Graph Debugger](https://developers.facebook.com/tools/debug/)

## 📝 Notas Importantes

- El sitemap se actualiza automáticamente con cada build
- Los eventos de Analytics se pueden personalizar según las necesidades
- Considera implementar Google Tag Manager para gestión avanzada de tags
- Revisa periódicamente el rendimiento en Google Search Console