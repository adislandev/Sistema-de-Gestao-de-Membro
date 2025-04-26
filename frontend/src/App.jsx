import {
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  Outlet
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import UserManagementPage from './pages/UserManagementPage';
import DepartmentManagementPage from './pages/DepartmentManagementPage';
import MemberCreatePage from './pages/MemberCreatePage';
import MemberManagementPage from './pages/MemberManagementPage';
import CellManagementPage from './pages/CellManagementPage';
import RegisterPage from './pages/RegisterPage';
import Navbar from './components/Navbar.jsx';
import AdminRegisterPage from './pages/AdminRegisterPage';

function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <ToastContainer autoClose={3000} hideProgressBar />
      <RenderNavbar />
      <Routes>
        <Route 
          path="/login" 
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />
        <Route 
          path="/admin-register"
          element={<PublicRoute><AdminRegisterPage /></PublicRoute>}
        />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/membros" element={<MemberManagementPage />} />
          <Route path="/membros/novo" element={<MemberCreatePage />} />
          <Route path="/departments" element={<DepartmentManagementPage />} />
          <Route path="/celulas" element={<CellManagementPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
        </Route>
        <Route 
          path="/" 
          element={<PrivateRoute><Navigate replace to="/dashboard" /></PrivateRoute>}
        />
        <Route 
          path="*" 
          element={<CatchAllRoute />}
        />
      </Routes>
      <ConditionalFooter />
    </AuthProvider>
  );
}

// Novo componente auxiliar para renderizar Navbar apenas se autenticado
function RenderNavbar() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navbar /> : null;
}

function CatchAllRoute() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function ConditionalFooter() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <footer className="mt-5 py-3 text-center text-muted border-top">
      <small>
        Versão 1.0 | Copyright © {new Date().getFullYear()} Adislan Fernandes. Todos os direitos reservados.
      </small>
    </footer>
  ) : null;
}

export default App;
