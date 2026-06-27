# 🚀 Plan de Optimización — AppCampañaRD

> Plan de mejora basado en la revisión de arquitectura del proyecto.
> Marca cada casilla al completar la tarea y actualiza la tabla de seguimiento.

---

## 📋 Resumen del proyecto

PWA en React 19 (Create React App) + Firebase (Auth, Firestore, Functions, Storage, Hosting) para gestionar una campaña política en Santo Domingo Oeste. Captura simpatizantes (públicamente y vía activistas), mide cobertura del padrón y ofrece paneles diferenciados por rol (admin, líder de zona, multiplicador). Integra Google Maps, Chart.js y Resend.

---

## 🏗️ Arquitectura actual

- **Punto de entrada** (`src/index.js`): monta `<App/>` en `StrictMode` y registra el service worker solo en producción.
- **Routing** (`src/App.js`): `BrowserRouter` con layouts anidados (`PublicLayout`, `DashboardLayout`), guards `ProtectedRoute`/`PublicOnlyRoute` inline y rutas de admin condicionadas por rol.
- **Estado**: `AuthContext` (sesión + heartbeat 15 min), `ThemeContext` y un `LayoutContext` local. Sin capa de datos centralizada — cada componente consulta Firestore con `useEffect`.
- **Componentes**: 34 archivos planos en `src/components/`.
- **Datos/config**: `constants.js`, `data/ubicaciones.js`, `data/zonas.json`, `data/navConfig.js`.
- **Backend**: `functions/` con Cloud Functions callable y plantillas Resend.

---

## ✅ Tareas por categoría

### 🔧 Estructura y reutilización de componentes
- [x] Eliminar el `ProtectedRoute` duplicado (inline en `App.js` vs `src/ProtectedRoute.js` muerto)
- [x] Extraer el bloque "welcome-row" repetido 3× en `Dashboard.js` a `<DashboardWelcome/>`
- [x] Reorganizar `src/components/` en subcarpetas (`pages/`, `dashboard/`, `charts/`, `admin/`, `ui/`)
- [ ] Consolidar estilos inline dispersos en `global.css` o módulos CSS
- [x] Mover `useMediaQuery` de `App.js` a `hooks/useMediaQuery.js`

### 🗃️ Manejo de estado
- [ ] Introducir cache de datos (React Query/SWR) para evitar lecturas Firestore redundantes
- [x] Importar constantes desde `constants.js` en `RegisterByActivist.js` (no redefinir `PROVINCIA_FIJA`, `validarCedula`, etc.)
- [x] Reemplazar literales de rol mágicos (`"admin"`, `"lider de zona"`) por `ROL_ADMIN`/`ROL_LIDER`

### ⚡ Rendimiento
- [x] Aplicar `React.lazy` + `Suspense` por ruta (mapas, admin, gráficos)
- [ ] Resolver límite de query `in` de Firestore (>30 multiplicadores) con contadores agregados
- [ ] Evaluar frecuencia del heartbeat `updateDoc` cada 15 min en `AuthContext`
- [ ] Revisar carga bajo demanda de `xlsx` (peso y vulnerabilidades)

### 🎨 Funcionalidades faltantes / gaps de UX
- [x] Crear página 404 real (con layout, Navbar/Footer)
- [x] Añadir Error Boundary global
- [x] Unificar estados de carga en un componente `<Loader/>`
- [ ] Revisar accesibilidad (labels/aria) en formularios largos y mapa

### 🧪 Pruebas
- [x] Arreglar/eliminar `App.test.js` obsoleto ("learn react link")
- [x] Tests de validadores (cédula/teléfono)
- [x] Tests de `getVisibleNavItems` (lógica de rol pura)
- [ ] Tests de guards de ruta y flujo de registro

### 📝 Claridad del código / documentación
- [x] Quitar `console.log("DEBUG API Key…")` y comentarios de diagnóstico en `firebase.js`
- [x] Confirmar que `.env` no está versionado; rotar claves si se filtró
- [x] Eliminar `initializeAuthAndGetUser` si es código muerto
- [x] Limpiar comentarios de desarrollo ("❌ ELIMINAMOS", "[INICIO CORRECCIÓN SDO]", etc.)
- [x] Mover `fix_colors.js` y `setup-resend.bat` a `scripts/`
- [ ] Planear migración CRA → Vite (mediano plazo)

---

## 📊 Tabla de seguimiento

| # | Prioridad | Tarea | Categoría | Estado |
|---|-----------|-------|-----------|--------|
| 1 | 🔴 Alta | Quitar `console.log` de API key y diagnóstico en `firebase.js` | Documentación | ✅ Completada |
| 2 | 🔴 Alta | Confirmar `.env` no versionado; rotar claves si se filtró | Documentación | ✅ Completada |
| 3 | 🔴 Alta | Arreglar/eliminar `App.test.js` obsoleto | Pruebas | ✅ Completada |
| 4 | 🔴 Alta | Eliminar `ProtectedRoute.js` duplicado y `initializeAuthAndGetUser` muertos | Estructura | ✅ Completada |
| 5 | 🔴 Alta | Añadir Error Boundary global | UX | ✅ Completada |
| 6 | 🟡 Media | Importar constantes desde `constants.js` (roles, ubicación, regex) | Estado | ✅ Completada |
| 7 | 🟡 Media | Extraer `<DashboardWelcome/>` y `useMediaQuery` a sus archivos | Estructura | ✅ Completada |
| 8 | 🟡 Media | Aplicar `React.lazy`/`Suspense` por ruta | Rendimiento | ✅ Completada |
| 9 | 🟡 Media | Cache de datos (React Query/SWR) para Firestore | Estado | ⬜ Pendiente |
| 10 | 🟡 Media | Tests de validadores y `getVisibleNavItems` | Pruebas | ✅ Completada |
| 11 | 🟢 Baja | Reorganizar `src/components/` en subcarpetas | Estructura | ✅ Completada ⁽¹⁾ |
| 12 | 🟢 Baja | Resolver límite `in` de Firestore con contadores agregados | Rendimiento | ⬜ Pendiente |
| 13 | 🟢 Baja | Página 404 con layout, `<Loader/>` unificado, limpiar estilos inline | UX | ✅ Completada ⁽²⁾ |
| 14 | 🟢 Baja | Mover scripts a `scripts/`; **limpiar comentarios dev**; migración CRA → Vite | Documentación | 🟦 Parcial ⁽³⁾ |

**Leyenda de estado:** ⬜ Pendiente · 🟦 En progreso/Parcial · ✅ Completada

---

## 📈 Progreso general

- **Total de tareas:** 14
- **Completadas:** 11 / 14 (+ 1 parcial)
- **Alta prioridad:** 5 / 5
- **Media prioridad:** 4 / 5
- **Baja prioridad:** 2 / 4 (+ #14 parcial)

---

## 🗒️ Notas de implementación

- **⁽¹⁾ #11 (reorganización):** mapeo con decisiones de criterio a revisar — `RegisterByActivist` → `dashboard/` (es la ruta `/dashboard/registrar`); `NotFound` y `ZonasElectorales` → `pages/`; `EmailStatus` → `ui/` y `EmailTest` → `admin/`; `ErrorBoundary` → `ui/`. Imports actualizados y verificados con `npm run build`. **Posible código muerto detectado** (no eliminado, fuera de alcance): `ZonasElectorales`, `MyRegistrations`, `EmailTest` no parecen importados desde ninguna ruta/componente.
- **⁽²⁾ #13:** entregables principales hechos (página 404 con layout + `<Loader/>` unificado en loaders de página/ruta). El subpunto "limpiar estilos inline" es trabajo más amplio que se solapa con *"Consolidar estilos inline dispersos"* (estructura, pendiente) y **no** se abordó. Loaders internos de componentes (`LoadingSpinner` de `ManageUsers`, `<p>` inline de `MyTeam`/`EditUserModal`) se dejaron sin migrar para evitar regresiones visuales.
- **⁽³⁾ #14 (parcial):** `fix_colors.js` y `setup-resend.bat` movidos a `scripts/` (14a) y comentarios de desarrollo limpiados (14b). **Migración CRA → Vite queda fuera de alcance** por indicación del usuario. La limpieza de comentarios se ciñó al chatter de proceso (emojis, "ELIMINAMOS/PASO/FIX/NUEVO/CORRECCIÓN/<---"); se conservaron comentarios explicativos y numeraciones genéricas sueltas. Nota: `RESEND_IMPLEMENTATION_SUMMARY.md` aún referencia la ruta vieja de `setup-resend.bat`.
- **#2:** marcada como completada en el checklist por el usuario; la verificación del historial de git (`.env` versionado / rotación de claves) **no** fue ejecutada por el asistente.
- **#6:** en `EmailTest.js` se dejaron `'coordinador'`/`'supervisor'` como literales (no tienen constante en `constants.js`).
- **#9 (cache de datos):** fuera de alcance por indicación del usuario (no implementar React Query/SWR).
