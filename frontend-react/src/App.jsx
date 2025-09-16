import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EmployeeProfile from './pages/EmployeeProfile';
import Login from './pages/Login';
import RegistrarEmpleado from './pages/RegistrarEmpleado';
import ActualizarEmpleado from './pages/ActualizarEmpleado';
import Bonos from './pages/Bonos';
import Cese from './pages/Cese';
import Justificaciones from './pages/Justificaciones';
import OJT from './pages/OJT';
import Excepciones from './pages/Excepciones';
import ReporteAsistencias from './pages/ReporteAsistencias';
import ReporteTardanzas from './pages/ReporteTardanzas';
import EjecutarSP from './pages/EjecutarSP';
import ProtectedRoute from './components/ProtectedRoute';
import ControlMaestro from './pages/ControlMaestro';
import PagosNomina from './pages/PagosNomina';
import CapacitacionesFullscreen from './pages/CapacitacionesFullscreen';
import DashboardJefa from './pages/DashboardJefa';
import VerificarTablas from './components/VerificarTablas';
import Organigrama from './pages/Organigrama';
import OrganigramaFullscreen from './pages/OrganigramaFullscreen';
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
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  
  console.log('🏠 AppContent renderizándose:', { 
    isAuthenticated, 
    loading, 
    currentPath: window.location.pathname,
    userRole: user?.role,
    userDNI: user?.dni
  });

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    console.log('⏳ AppContent: Mostrando loading global...');
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#e2e8f0'
      }}>
        <Typography variant="h6">Cargando aplicación...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ AppContent: No autenticado, mostrando rutas públicas');
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  console.log('✅ AppContent: Usuario autenticado, mostrando aplicación principal');
  
  // Capacitaciones: restringir a admin (por simplificación actual)
  if (location.pathname === '/capacitaciones') {
    return (
      <Routes>
        <Route path="/capacitaciones" element={
          <ProtectedRoute requireRole={['admin']}>
            <CapacitacionesFullscreen />
          </ProtectedRoute>
        } />
      </Routes>
    );
  }

  // Organigrama Fullscreen: vista completa sin sidebar
  if (location.pathname === '/organigrama-fullscreen') {
    return (
      <Routes>
        <Route path="/organigrama-fullscreen" element={
          <ProtectedRoute requireVista="Organigrama">
            <OrganigramaFullscreen />
          </ProtectedRoute>
        } />
      </Routes>
    );
  }
  
  // Layout normal para todas las demás rutas
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
          {/* Perfil del usuario como ruta principal */}
          <Route path="/" element={<EmployeeProfile />} />
          
          {/* Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute requireVista="Dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Vista de perfil de empleado (mantener para compatibilidad) */}
          <Route path="/profile" element={<EmployeeProfile />} />
          
          {/* Rutas de gestión de empleados */}
          <Route path="/registrar-empleado" element={
            <ProtectedRoute requireVista="Registrar Empleado">
              <RegistrarEmpleado />
            </ProtectedRoute>
          } />
          <Route path="/actualizar-empleado" element={
            <ProtectedRoute requireVista="Actualizar Empleado">
              <ActualizarEmpleado />
            </ProtectedRoute>
          } />
          <Route path="/cese" element={
            <ProtectedRoute requireVista="Cese de Empleado">
              <Cese />
            </ProtectedRoute>
          } />
          <Route path="/justificaciones" element={
            <ProtectedRoute requireVista="JUSTIFICACIONES">
              <Justificaciones />
            </ProtectedRoute>
          } />
          <Route path="/ojt" element={
            <ProtectedRoute requireVista="OJT / CIC">
              <OJT />
            </ProtectedRoute>
          } />
          <Route path="/excepciones" element={
            <ProtectedRoute requireVista="Asignación Excepciones">
              <Excepciones />
            </ProtectedRoute>
          } />
          <Route path="/bonos" element={
            <ProtectedRoute requireVista="BONOS">
              <Bonos />
            </ProtectedRoute>
          } />
          
          {/* Reportes */}
          <Route path="/reporte-asistencias" element={
            <ProtectedRoute requireVista="Reporte de Asistencias">
              <ReporteAsistencias />
            </ProtectedRoute>
          } />
          
          <Route path="/reporte-tardanzas" element={
            <ProtectedRoute requireVista="Reporte de Tardanzas">
              <ReporteTardanzas />
            </ProtectedRoute>
          } />
          
          {/* Otros módulos */}
          <Route path="/ejecutar-sp" element={
            <ProtectedRoute requireVista="Ejecutar SP">
              <EjecutarSP />
            </ProtectedRoute>
          } />
          
          <Route path="/control-maestro" element={
            <ProtectedRoute requireVista="Control Maestro">
              <ControlMaestro />
            </ProtectedRoute>
          } />
          
          <Route path="/capacitaciones" element={
            <ProtectedRoute requireVista="CAPACITACIONES">
              <CapacitacionesFullscreen />
            </ProtectedRoute>
          } />
          
          <Route path="/pagos-nomina" element={
            <ProtectedRoute requireVista="Pagos de Nómina">
              <PagosNomina />
            </ProtectedRoute>
          } />
          
          <Route path="/organigrama" element={
            <ProtectedRoute requireVista="Organigrama">
              <Organigrama />
            </ProtectedRoute>
          } />
          
          
          {/* Ruta temporal para verificar tablas */}
          <Route path="/verificar-tablas" element={<VerificarTablas />} />
          
          {/* Rutas no encontradas van al perfil del usuario */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
