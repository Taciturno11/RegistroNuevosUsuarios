import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EmployeeProfile from './pages/EmployeeProfile';
import Login from './pages/Login';
import RegistrarEmpleado from './pages/RegistrarEmpleado';
import ActualizarEmpleado from './pages/ActualizarEmpleado';
import Cese from './pages/Cese';
import Justificaciones from './pages/Justificaciones';
import OJT from './pages/OJT';
import Excepciones from './pages/Excepciones';
import ReporteAsistencias from './pages/ReporteAsistencias';
import ReporteTardanzas from './pages/ReporteTardanzas';
import ProtectedRoute from './components/ProtectedRoute';
import ControlMaestro from './pages/ControlMaestro';
import './App.css';

// Tema personalizado que mantiene la estética del proyecto original
const theme = createTheme({
  palette: {
    primary: {
      main: '#1e40af', // Azul corporativo
    },
    secondary: {
      main: '#475569', // Gris azulado
    },
    success: {
      main: '#059669', // Verde profesional
    },
    warning: {
      main: '#d97706', // Naranja
    },
    error: {
      main: '#dc2626', // Rojo
    },
    info: {
      main: '#0891b2', // Azul claro
    },
    background: {
      default: '#e2e8f0', // Gris más oscuro para contraste visible con el sidebar blanco
      paper: '#ffffff', // Blanco puro
    },
    text: {
      primary: '#1e293b', // Gris oscuro
      secondary: '#64748b', // Gris medio
    },
  },
  typography: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.375rem',
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

// Componente de ruta protegida básica (ya no se usa, reemplazado por el componente importado)
const BasicProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente principal de la aplicación
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ 
        flexGrow: 1, 
        padding: '2rem 1rem', 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: '#e2e8f0', // Fondo gris más oscuro para contraste visible
        minHeight: '100vh' // Asegura que ocupe toda la altura de la pantalla
      }}>
        <Routes>
          {/* Vista principal para todos los empleados */}
          <Route path="/" element={<EmployeeProfile />} />
          
          {/* Rutas administrativas (solo para roles administrativos) */}
          <Route path="/admin" element={
            <ProtectedRoute requireRole={['admin', 'analista', 'coordinador', 'supervisor', 'jefe', 'creador']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/registrar-empleado" element={
            <ProtectedRoute requireRole={['admin', 'analista', 'coordinador', 'supervisor', 'jefe', 'creador']}>
              <RegistrarEmpleado />
            </ProtectedRoute>
          } />
          <Route path="/actualizar-empleado" element={
            <ProtectedRoute requireRole={['admin', 'analista', 'coordinador', 'supervisor', 'jefe', 'creador']}>
              <ActualizarEmpleado />
            </ProtectedRoute>
          } />
          <Route path="/cese" element={
            <ProtectedRoute requireRole={['admin', 'analista', 'coordinador', 'supervisor', 'jefe', 'creador']}>
              <Cese />
            </ProtectedRoute>
          } />
          <Route path="/justificaciones" element={
            <ProtectedRoute requireRole={['admin', 'analista', 'coordinador', 'supervisor', 'jefe', 'creador']}>
              <Justificaciones />
            </ProtectedRoute>
          } />
          <Route path="/ojt" element={
            <ProtectedRoute requireRole={['admin', 'analista', 'coordinador', 'supervisor', 'jefe', 'creador']}>
              <OJT />
            </ProtectedRoute>
          } />
          <Route path="/excepciones" element={
            <ProtectedRoute requireRole={['admin', 'analista', 'coordinador', 'supervisor', 'jefe', 'creador']}>
              <Excepciones />
            </ProtectedRoute>
          } />
          
          {/* Reporte de Asistencias - Solo para analistas y creador */}
          <Route path="/reporte-asistencias" element={
            <ProtectedRoute requireRole={['analista', 'creador']}>
              <ReporteAsistencias />
            </ProtectedRoute>
          } />
          
          {/* Reporte de Tardanzas - Solo para analistas y creador */}
          <Route path="/reporte-tardanzas" element={
            <ProtectedRoute requireRole={['analista', 'creador']}>
              <ReporteTardanzas />
            </ProtectedRoute>
          } />
          
          <Route path="/control-maestro" element={<ControlMaestro />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
