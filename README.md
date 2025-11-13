# 🗳️ Plataforma Digital de Campaña Política | AppCampañaRD

**AppCampañaRD** es una Plataforma Digital para Candidatura Política, implementada como una **Progressive Web App (PWA) con React y Firebase**, diseñada para maximizar la eficiencia, la organizacion y la medición en una campaña electoral en la República Dominicana.

## 🎯 Objetivos del Proyecto

Esta plataforma resuelve la necesidad de una gestión de campaña moderna y basada en datos, cumpliendo con los siguientes objetivos funcionales y no funcionales:

- **Inscripción y Base de Datos:** Capturar y gestionar la información de simpatizantes de manera pública y privada.
- **Medición de Cobertura:** Cuantificar el **Porcentaje de Cobertura del Padrón** (votantes convertidos en simpatizantes) a nivel de distrito y total.
- **Motivación por Roles:** Proporcionar paneles de control personalizados para **Multiplicadores**, **Encargados de Distrito** y **Administradores**, mostrando progreso y metas personales.
- **Seguridad y Escalabilidad:** Asegurar soporte para miles de registros y garantizar el **Control de Acceso Basado en Roles (RBAC)** mediante reglas de Firestore.

## 💻 Stack Tecnológico

El proyecto está construido con un stack moderno, priorizando la **rapidez de implementación** y el **bajo estrés en el desarrollo**.

| Componente         | Tecnología                                                       | Propósito Principal                                                                                    |
| :----------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Frontend (PWA)** | **React.js** (Create React App)          | Interfaz de usuario intuitiva, móvil-first y con capacidad **offline básica**. |
| **Backend/DB**     | **Firebase** (Firestore, Auth, Hosting) | Backend sin servidor para autenticación, **DB en tiempo real** y hosting.                              |
| **Estilos/UI**     | **Material-UI o Tailwind**               | Componentes UI y diseño responsivo.                                                                    |
| **Navegación**     | **React Router**                         | Gestión de rutas para páginas públicas y paneles privados.                                             |
| **Gráficos**       | **Chart.js** o Recharts           | Visualización de métricas y progreso.                                                                  |

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos

- Node.js (LTS)
- Una cuenta de Firebase con un proyecto configurado.
- Archivos de configuración de Firebase (`.env` o variables de entorno con tus claves).

### Pasos para el Desarrollador

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://docs.github.com/es/repositories/creating-and-managing-repositories/quickstart-for-repositories](https://docs.github.com/es/repositories/creating-and-managing-repositories/quickstart-for-repositories)
    cd App-Campana-RD
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    # o si usas Yarn: yarn install
    ```
3.  **Configurar Firebase:**
    Asegúrate de tener un archivo `.env` o variables de entorno configuradas con tus credenciales de Firebase. 

4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm start
    ```
    La aplicación se iniciará en `http://localhost:3000`.

## 🔒 Estructura de Datos (Esquema de Firestore)

La base de datos se organiza en colecciones para soportar las funcionalidades de la aplicación:

| Colección                               | Propósito                                                                 | Campos Clave                                                    |
| :-------------------------------------- | :------------------------------------------------------------------------ | :-------------------------------------------------------------- |
| `users`       | Perfiles de Multiplicadores/Administradores.                              | `uid`, `role`, `district`, `goals`, `registeredCount`.          |
| `sympathizers` | Datos de los simpatizantes registrados.                                   | `id` (cédula), `name`, `district`, `registeredBy`, `timestamp`. |
| `padron`        | [cite_start]Datos del padrón electoral (importado desde CSV). | `id` (cédula), `name`, `district`, `isSympathizer` (boolean).   |

## 🤝 Contribuciones

Si deseas contribuir al proyecto, por favor, sigue el ciclo de desarrollo Ágil descrito en la especificación: MVP, Iteración 1 (Multiplicadores), e Iteración 2 (Administración/Padrón).
