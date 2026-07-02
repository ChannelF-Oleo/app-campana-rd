# 🗳️ Plataforma Digital de Campaña Política | AppCampañaRD

**AppCampañaRD** es una Plataforma Digital para Candidatura Política, implementada como una **Progressive Web App (PWA) con React y Firebase**, diseñada para maximizar la eficiencia, la organización y la medición en una campaña electoral en la República Dominicana.

## 🎯 Objetivos del Proyecto

Esta plataforma resuelve la necesidad de una gestión de campaña moderna y basada en datos, cumpliendo con los siguientes objetivos funcionales y no funcionales:

- **Inscripción y Base de Datos:** Capturar y gestionar la información de simpatizantes de manera pública y privada.
- **Medición de Cobertura:** Cuantificar el **Porcentaje de Cobertura del Padrón** (votantes convertidos en simpatizantes) a nivel de distrito y total.
- **Motivación por Roles:** Proporcionar paneles de control personalizados para **Multiplicadores**, **Líderes de Zona** y **Administradores**, mostrando progreso y metas personales.
- **Seguridad y Escalabilidad:** Asegurar soporte para miles de registros y garantizar el **Control de Acceso Basado en Roles (RBAC)** mediante reglas de Firestore.

## 💻 Stack Tecnológico

| Componente          | Tecnología                                    | Propósito Principal                                                         |
| :------------------ | :-------------------------------------------- | :------------------------------------------------------------------------- |
| **Frontend (PWA)**  | **React.js** (Create React App)               | Interfaz móvil-first con capacidad offline básica (service worker/workbox). |
| **Hosting cliente** | **Vercel**                                     | Sirve la app en `www.felixencarnacion.com` (deploy automático por Git).     |
| **Backend / DB**    | **Firebase** (Firestore, Auth, Storage, Functions) | Autenticación, DB en tiempo real, almacenamiento de fotos y Cloud Functions. |
| **Correos**         | **Resend** (desde Cloud Functions)            | Correos de bienvenida a usuarios y simpatizantes.                          |
| **Navegación**      | **React Router**                              | Rutas para páginas públicas y paneles privados.                            |
| **Gráficos**        | **Chart.js**                                  | Visualización de métricas y progreso.                                      |
| **Mapas**           | **Google Maps** (`@react-google-maps/api`)    | Ubicación exacta de simpatizantes.                                         |

> **Importante:** el proyecto Firebase es **`politicard-cfd`**, pero el **cliente NO se sirve desde Firebase Hosting**, sino desde **Vercel**. Firebase provee solo el backend (Firestore, Auth, Storage, Functions).

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos

- Node.js 22 (el mismo runtime que usan las Cloud Functions).
- Archivo `.env` en la raíz con las variables `REACT_APP_FIREBASE_*`, `REACT_APP_GOOGLE_MAPS_API_KEY`, etc. (no se versiona).
- Para tareas de administración/scripts: clave de servicio del Admin SDK (`*-firebase-adminsdk-*.json`, gitignored).

### Pasos

1. **Clonar e instalar dependencias:**
   ```bash
   git clone https://github.com/ChannelF-Oleo/app-campana-rd
   cd app-campana-rd
   npm install
   ```
2. **Dependencias de las Cloud Functions** (tienen su propio `package.json`):
   ```bash
   cd functions && npm install && cd ..
   ```
3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm start        # http://localhost:3000
   ```

## 🚀 Despliegue

El despliegue tiene **dos destinos separados**:

### 1. Cliente (React) → Vercel

Vercel está conectado al repositorio de GitHub y **despliega automáticamente al hacer push a `main`**:

```bash
git push origin main
```

- El build en Vercel corre con `CI=true` (los warnings se tratan como errores); verificá localmente con `CI=true npm run build` antes de pushear.
- Tras el deploy, el service worker puede requerir recargar la página 1–2 veces para tomar la versión nueva.

### 2. Backend (Cloud Functions) → Firebase

Requiere el `firebase` CLI y **login interactivo con una cuenta Owner** (la clave de servicio del Admin SDK **no** tiene permisos para desplegar functions):

```bash
# una sola vez: instalar CLI y autenticarse
npm install -g firebase-tools
firebase login

# instalar deps de functions (si no está hecho) y desplegar
cd functions && npm install && cd ..
firebase deploy --only functions --project politicard-cfd
```

- Para desplegar una función puntual: `firebase deploy --only functions:createUserAdmin --project politicard-cfd`.
- El CLI ofrece borrar funciones que están en producción pero no en el código; responder **N** salvo que sea una limpieza deliberada.
- Las reglas/índices se despliegan con `firebase deploy --only firestore` / `--only storage`.

## 🔒 Estructura de Datos (Firestore)

Proyecto: **`politicard-cfd`**.

| Colección       | Propósito                                             | Campos clave                                                                 |
| :-------------- | :--------------------------------------------------- | :-------------------------------------------------------------------------- |
| `users`         | Perfiles del equipo (multiplicadores/líderes/admin). | `uid`, `nombre`, `cedula`, `telefono`, `email`, `rol`, `registrationCount`, `liderAsignado`. |
| `simpatizantes` | Simpatizantes registrados.                           | `nombre`, `cedula`, `telefono`, `direccion`, `sector`, `zona`, `usuarioId`, `registradoPor`, `fechaRegistro`. |
| `votantes`      | Padrón electoral (solo lectura).                     | doc id = cédula; `nombre`, `sector`, `origen` (colegio), etc.               |
| `organigrama`   | Gestión de comandos/estructura.                      | según configuración.                                                        |

### Convenciones importantes

- **Cédula:** se almacena **normalizada = solo dígitos, sin guiones** (ej. `00112345678`). Al mostrarla en la UI puede formatearse con guiones. Usar `normalizarCedula()` (`src/constants.js` y su gemelo en `functions/index.js`) antes de cualquier escritura o consulta por cédula.
- **Vínculo users ↔ simpatizantes:** `users` y `simpatizantes` son colecciones separadas relacionadas por **cédula** y por el campo **`usuarioId`** en el doc de simpatizante (= `uid` del usuario). Al crear un usuario no se duplica el simpatizante: si ya existe, solo se vincula.
- **Fotos de perfil (Storage `votantes_fotos/`):** los recortes del padrón están nombrados **con guiones** (`001-1234567-8.jpg`); las fotos nuevas subidas desde la app se guardan **sin guiones** (`00112345678.jpg`). `AvatarFoto` prueba **sin guiones primero** (foto nueva) y con guiones como respaldo (padrón).

## 🧰 Scripts de administración (`scripts/`)

Se ejecutan con Node usando la clave de servicio del Admin SDK (ver Prerrequisitos):

- `scripts/fase1-backup-audit.js` — **solo lectura**: exporta `users` y `simpatizantes` a `backups/` y audita el formato de cédula.
- `scripts/fase2-migracion.js` — normaliza cédulas, deduplica `simpatizantes` y vincula por `usuarioId`. **Dry-run por defecto**; `--apply` es el único modo que escribe (hace backup previo). Simulación offline con `--source=backup`.

> `backups/` y las claves `*-firebase-adminsdk-*.json` están en `.gitignore`; nunca se versionan.

## 🤝 Contribuciones

Trabajo por ramas y PRs desde `main`. Verificar `CI=true npm run build` y `CI=true npm test` antes de abrir PR.
