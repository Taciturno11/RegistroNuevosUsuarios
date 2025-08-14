import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate, Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireRole }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log('🛡️ ProtectedRoute ejecutándose:', { 
    user: user ? `${user.dni} (${user.role})` : 'null', 
    loading, 
    requireRole,
    currentPath: window.location.pathname 
  });

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    console.log('⏳ ProtectedRoute: Mostrando loading...');
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute: No hay usuario, redirigiendo a login');
    return <Navigate to="/login" />;
  }

  // Verificar si requireRole es un array o un string
  if (requireRole) {
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    const hasAccess = allowedRoles.includes(user.role);
    
    if (!hasAccess) {
      console.log('🚫 ProtectedRoute: Sin permisos, redirigiendo a Dashboard');
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>
            🚫 Acceso Restringido
          </Typography>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            No tienes permisos para acceder a esta página.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Volver al Inicio
          </Button>
        </Box>
      );
    }
  }

  console.log('✅ ProtectedRoute: Acceso permitido, renderizando children');
  return children;
};

export default ProtectedRoute;
