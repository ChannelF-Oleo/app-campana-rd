import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// --- CONTEXTOS ---
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider, useTheme } from "./ThemeContext";

// --- COMPONENTES GLOBALES ---
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./index.css"; // IMPORTANTE: Asegúrate de importar index.css aquí o en index.js
import "./App.css"; // Estilos de layout específicos

// --- COMPONENTES DEL DASHBOARD ---
import DashboardSidebar from "./components/DashboardSidebar";
import BottomNavBar from "./components/BottomNavBar";

// --- PÁGINAS ---
import HomePage from "./components/Home";
import Login from "./components/Login";
import PublicRegister from "./components/PublicRegister";
import ProposalsPage from "./components/Propuestas";

// --- PÁGINAS PROTEGIDAS ---
import Dashboard from "./components/Dashboard";
import RegisterByActivist from "./components/RegisterByActivist";
import ManageUsers from "./components/ManageUsers";
import ManageTeams from "./components/ManageTeams";
import CreateUser from "./components/CreateUser";
import Comandos from "./components/Comandos";
import SetGoalModal from "./components/SetGoalModal";

// Contexto para UI del Layout
const LayoutContext = createContext(null);
const useLayoutContext = () => useContext(LayoutContext);

// --- HOOK: DETECCIÓN DE DISPOSITIVO ---
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

// --- LAYOUTS ---
function PublicLayout() {
  return (
    <>
      <Navbar />
      <div className="public-content-wrapper">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}

function DashboardLayout() {
  const { user, logout } = useAuth();
  const { handleOpenGoalModal } = useLayoutContext();

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (!user) return null;

  return (
    <div
      className={`dashboard-layout ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {/* Navegación Inteligente */}
      {!isMobile ? (
        <DashboardSidebar
          user={user}
          onLogout={logout}
          isCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onSetGoalClick={handleOpenGoalModal}
        />
      ) : (
        <BottomNavBar
          user={user}
          onSetGoalClick={handleOpenGoalModal}
          onLogout={logout}
        />
      )}

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

// --- RUTAS PROTEGIDAS ---
function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="loading-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="loading-screen">Verificando...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// --- DEFINICIÓN DE RUTAS ---
function AppRoutes() {
  const { user } = useAuth();
  // Nota: Ya no necesitamos lógica de tema aquí, ThemeContext se encarga.

  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const handleOpenGoalModal = () => setGoalModalOpen(true);
  const handleCloseGoalModal = () => setGoalModalOpen(false);

  return (
    <LayoutContext.Provider value={{ handleOpenGoalModal }}>
      {isGoalModalOpen && user && (
        <SetGoalModal user={user} onClose={handleCloseGoalModal} />
      )}

      <Routes>
        {/* ZONA PÚBLICA */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/propuestas" element={<ProposalsPage />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<PublicRegister />} />
          </Route>
        </Route>

        {/* ZONA PRIVADA (DASHBOARD) - RUTAS PLANAS */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route
              path="/dashboard/registrar"
              element={<RegisterByActivist user={user} />}
            />

            {/* Admin */}
            {user?.rol === "admin" && (
              <>
                <Route path="/admin/usuarios" element={<ManageUsers />} />
                <Route path="/admin/crear-usuario" element={<CreateUser />} />
                <Route path="/admin/equipos" element={<ManageTeams />} />
                <Route path="/admin/comandos" element={<Comandos />} />
              </>
            )}
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <h2 style={{ textAlign: "center", marginTop: "50px" }}>
              404: Página no encontrada
            </h2>
          }
        />
      </Routes>
    </LayoutContext.Provider>
  );
}

// --- ROOT ---
function App() {
  return (
    <Router>
      <AuthProvider>
        {/* ThemeProvider debe envolver a los componentes que usen useTheme */}
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
