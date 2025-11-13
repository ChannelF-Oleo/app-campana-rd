# 🗳️ Plataforma Digital de Campaña Política | AppCampañaRD

**AppCampañaRD** es una Plataforma Digital para Candidatura Política, implementada como una **Progressive Web App (PWA) con React y Firebase**, diseñada para maximizar la eficiencia y la medición en una campaña electoral en la República Dominicana.

## 🎯 Objetivos del Proyecto

Esta plataforma resuelve la necesidad de una gestión de campaña moderna y basada en datos, cumpliendo con los siguientes objetivos funcionales y no funcionales:

- [cite_start]**Inscripción y Base de Datos:** Capturar y gestionar la información de simpatizantes de manera pública y privada[cite: 1354, 1348].
- [cite_start]**Medición de Cobertura:** Cuantificar el **Porcentaje de Cobertura del Padrón** (votantes convertidos en simpatizantes) a nivel de distrito y total[cite: 1355, 1392].
- [cite_start]**Motivación por Roles:** Proporcionar paneles de control personalizados para **Multiplicadores**, **Encargados de Distrito** y **Administradores**, mostrando progreso y metas personales[cite: 1356, 1357, 1349].
- [cite_start]**Seguridad y Escalabilidad:** Asegurar soporte para miles de registros y garantizar el **Control de Acceso Basado en Roles (RBAC)** mediante reglas de Firestore[cite: 1361, 1362, 1408].

## 💻 Stack Tecnológico

[cite_start]El proyecto está construido con un stack moderno, priorizando la **rapidez de implementación** y el **bajo estrés en el desarrollo**[cite: 1359, 1360].

| Componente         | Tecnología                                                       | Propósito Principal                                                                                    |
| :----------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Frontend (PWA)** | [cite_start]**React.js** (Create React App) [cite: 1400]         | [cite_start]Interfaz de usuario intuitiva, móvil-first y con capacidad **offline básica**[cite: 1363]. |
| **Backend/DB**     | [cite_start]**Firebase** (Firestore, Auth, Hosting) [cite: 1402] | Backend sin servidor para autenticación, **DB en tiempo real** y hosting.                              |
| **Estilos/UI**     | [cite_start]**Material-UI o Tailwind** [cite: 1401]              | Componentes UI y diseño responsivo.                                                                    |
| **Navegación**     | [cite_start]**React Router** [cite: 1401]                        | Gestión de rutas para páginas públicas y paneles privados.                                             |
| **Gráficos**       | [cite_start]**Chart.js** o Recharts [cite: 1389, 1401]           | Visualización de métricas y progreso.                                                                  |

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
    Asegúrate de tener un archivo `.env` o variables de entorno configuradas con tus credenciales de Firebase. [cite_start]**El archivo `politicard-cfd-firebase-adminsdk...json` debe estar presente para funciones de administración, pero nunca en el repositorio Git** (por ello se incluyó en el `.gitignore`)[cite: 1402].

4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm start
    ```
    La aplicación se iniciará en `http://localhost:3000`.

## 🔒 Estructura de Datos (Esquema de Firestore)

[cite_start]La base de datos se organiza en colecciones para soportar las funcionalidades de la aplicación[cite: 1404]:

| Colección                               | Propósito                                                                 | Campos Clave                                                    |
| :-------------------------------------- | :------------------------------------------------------------------------ | :-------------------------------------------------------------- |
| [cite_start]`users` [cite: 1405]        | Perfiles de Multiplicadores/Administradores.                              | `uid`, `role`, `district`, `goals`, `registeredCount`.          |
| [cite_start]`sympathizers` [cite: 1406] | Datos de los simpatizantes registrados.                                   | `id` (cédula), `name`, `district`, `registeredBy`, `timestamp`. |
| [cite_start]`padron` [cite: 1407]       | [cite_start]Datos del padrón electoral (importado desde CSV)[cite: 1396]. | `id` (cédula), `name`, `district`, `isSympathizer` (boolean).   |

## 🤝 Contribuciones

[cite_start]Si deseas contribuir al proyecto, por favor, sigue el ciclo de desarrollo Ágil descrito en la especificación: MVP, Iteración 1 (Multiplicadores), e Iteración 2 (Administración/Padrón)[cite: 1411, 1412, 1413, 1414].
