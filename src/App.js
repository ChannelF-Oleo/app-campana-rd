import React, { useState, createContext, useContext, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// --- CONTEXTOS ---
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";
import { ROL_ADMIN } from "./constants";

// --- HOOKS ---
import usePageTracking from "./hooks/usePageTracking";
import useMediaQuery from "./hooks/useMediaQuery";

// --- COMPONENTES GLOBALES ---
import Navbar from "./components/ui/Navbar";
import Footer from "./components/ui/Footer";

// --- COMPONENTES DEL DASHBOARD ---
import DashboardSidebar from "./components/dashboard/DashboardSidebar";
import BottomNavBar from "./components/dashboard/BottomNavBar";

// --- PÁGINAS (carga estática) ---
import HomePage from "./components/pages/Home"; // landing / primera pintura
import SetGoalModal from "./components/dashboard/SetGoalModal"; // modal, no es una ruta
import NotFound from "./components/pages/NotFound";
import Loader from "./components/ui/Loader";

// --- PÁGINAS (carga diferida con React.lazy / code-splitting) ---
// Se prioriza separar las rutas más pesadas: mapas (RegisterByActivist),
// gráficos (Dashboard) y panel de administración.
const Login = lazy(() => import("./components/pages/Login"));
const PublicRegister = lazy(() => import("./components/pages/PublicRegister"));
const RegisterAppUser = lazy(() => import("./components/pages/RegisterAppUser"));
const ProposalsPage = lazy(() => import("./components/pages/Propuestas"));
const Dashboard = lazy(() => import("./components/dashboard/Dashboard")); // gráficos (Chart.js)
const RegisterByActivist = lazy(() => import("./components/dashboard/RegisterByActivist")); // Google Maps
const UserProfile = lazy(() => import("./components/pages/UserProfile"));
const ManageUsers = lazy(() => import("./components/admin/ManageUsers"));
const ManageTeams = lazy(() => import("./components/admin/ManageTeams"));
const CreateUser = lazy(() => import("./components/admin/CreateUser"));
const Comandos = lazy(() => import("./components/admin/Comandos"));

// Contexto para UI del Layout
const LayoutContext = createContext(null);
const useLayoutContext = () => useContext(LayoutContext);

// --- LAYOUTS ---
function PublicLayout() {
  return (
    <>
      <Navbar />
      <div className="public-content-wrapper">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
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
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

// --- RUTAS PROTEGIDAS ---
function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader message="Verificando..." />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// --- DEFINICIÓN DE RUTAS ---
function AppRoutes() {
  const { user } = useAuth();
  // Rastreo automático de páginas con Google Analytics
  usePageTracking();
  
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
            <Route path="/registro-app" element={<RegisterAppUser />} />
          </Route>
          {/* 404 dentro del layout público: hereda Navbar y Footer */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ZONA PRIVADA (DASHBOARD) - RUTAS PLANAS */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route
              path="/dashboard/registrar"
              element={<RegisterByActivist user={user} />}
            />
            <Route path="/dashboard/perfil" element={<UserProfile />} />

            {/* Admin */}
            {user?.rol === ROL_ADMIN && (
              <>
                <Route path="/admin/usuarios" element={<ManageUsers />} />
                <Route path="/admin/crear-usuario" element={<CreateUser />} />
                <Route path="/admin/equipos" element={<ManageTeams />} />
                <Route path="/admin/comandos" element={<Comandos />} />
              </>
            )}
          </Route>
        </Route>
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
