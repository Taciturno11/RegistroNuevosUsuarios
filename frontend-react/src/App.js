import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import RegistrarEmpleado from './pages/RegistrarEmpleado';
import ActualizarEmpleado from './pages/ActualizarEmpleado';
import Cese from './pages/Cese';
import Justificaciones from './pages/Justificaciones';
import OJT from './pages/OJT';
import Excepciones from './pages/Excepciones';
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
      default: '#f1f5f9', // Gris muy claro
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

// Componente de ruta protegida
const ProtectedRoute = ({ children }) => {
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
      <main style={{ flexGrow: 1, padding: '2rem 1rem', maxWidth: '1400px', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registrar-empleado" element={<RegistrarEmpleado />} />
          <Route path="/actualizar-empleado" element={<ActualizarEmpleado />} />
          <Route path="/cese" element={<Cese />} />
          <Route path="/justificaciones" element={<Justificaciones />} />
          <Route path="/ojt" element={<OJT />} />
          <Route path="/excepciones" element={<Excepciones />} />
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
