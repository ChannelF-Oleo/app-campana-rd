import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
// IMPORTANT: You must ensure 'db' is correctly exported from this file
import { db } from "./firebase";

// --- 1. IMPORTACIONES DE COMPONENTES ---
import HomePage from "./components/Home";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import CreateUser from "./components/CreateUser";
import ManageUsers from "./components/ManageUsers";
import ManageTeams from "./components/ManageTeams";
import DashboardSidebar from "./components/DashboardSidebar";
import Navbar from "./components/Navbar";
import PublicRegister from "./components/PublicRegister";
import ProposalsPage from "./components/Propuestas";
import RegisterByActivist from "./components/RegisterByActivist";
import SetGoalModal from "./components/SetGoalModal";
import Comandos from "./components/Comandos";
import { ThemeProvider, useTheme } from "./ThemeContext";
import Footer from "./components/Footer";

// --- 2. CONTEXTO DE AUTENTICACIÓN ---
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Contexto para pasar funciones específicas del layout del dashboard.
const LayoutContext = createContext(null);
const useLayoutContext = () => useContext(LayoutContext);

// --- 3. LAYOUTS ---

// Layout para las páginas públicas (con la barra de navegación principal)
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

// Layout para el panel de control (con la barra lateral)
function DashboardLayout() {
  const { user, logout } = useAuth();
  const { handleOpenGoalModal } = useLayoutContext();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar
        user={user}
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onSetGoalClick={handleOpenGoalModal}
      />
      <main
        style={{
          flexGrow: 1,
          backgroundColor: "var(--page-bg)",
          color: "var(--primary-text)",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

// --- 4. COMPONENTES DE RUTAS LÓGICAS ---

// RUTA PROTEGIDA: Si el usuario NO está logueado, lo envía a /login.
function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div>Verificando sesión...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// RUTA SOLO PÚBLICA: Si el usuario SÍ está logueado, lo envía al dashboard.
function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div>Verificando sesión...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  // RENDERIZA EL OUTLET, que será la ruta hija (Login o PublicRegister)
  return <Outlet />;
}

// --- 5. LÓGICA PRINCIPAL DE LA APLICACIÓN ---
function AppLogic() {
  const { isDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const handleOpenGoalModal = () => setGoalModalOpen(true);
  const handleCloseGoalModal = () => setGoalModalOpen(false);

  useEffect(() => {
    document.body.className = isDarkMode ? "dark-mode" : "";
  }, [isDarkMode]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Asumiendo que 'db' es el objeto Firestore importado
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() });
        } else {
          await signOut(auth);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      <LayoutContext.Provider value={{ handleOpenGoalModal }}>
        {isGoalModalOpen && user && (
          <SetGoalModal user={user} onClose={handleCloseGoalModal} />
        )}

        <Routes>
          {/* --- BLOQUE UNIFICADO DE RUTAS PÚBLICAS ---
            Todas las rutas anidadas aquí usarán el PublicLayout (Navbar y Footer).
          */}
          <Route element={<PublicLayout />}>
            {/* Rutas 100% públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/propuestas" element={<ProposalsPage />} />

            {/* Rutas de Autenticación:
              1. Usan PublicLayout para Navbar/Footer.
              2. Usan PublicOnlyRoute para redirigir si el usuario está logueado. 
            */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<PublicRegister />} />
            </Route>
          </Route>

          {/* --- RUTAS PROTEGIDAS (Dashboard) --- */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route
                path="/dashboard/registrar"
                element={<RegisterByActivist user={user} />}
              />

              {/* Rutas de Administrador */}
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

          {/* 404 Catch-all */}
          <Route path="*" element={<h2>404: Página no encontrada</h2>} />
        </Routes>
      </LayoutContext.Provider>
    </AuthContext.Provider>
  );
}

// --- 6. COMPONENTE RAÍZ ---
function App() {
  return (
    <Router>
      <ThemeProvider>
        <AppLogic />
      </ThemeProvider>
    </Router>
  );
}

export default App;
