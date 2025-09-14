import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate, Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireRole, requireVista }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log('🛡️ ProtectedRoute ejecutándose:', { 
    user: user ? `${user.dni} (${user.role})` : 'null', 
    loading, 
    requireRole,
    requireVista,
    userVistas: user?.vistas || [],
    hasRequiredVista: requireVista ? (user?.vistas || []).includes(requireVista) : 'N/A',
    currentPath: window.location.pathname,
    childrenType: children?.type?.name || 'Unknown',
    childrenProps: children?.props || 'No props'
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

  // Verificar acceso por rol o vista
  let hasAccess = false;
  
  // Admin siempre tiene acceso
  if (user.role === 'admin') {
    hasAccess = true;
  } else {
    // Verificar por rol específico
    if (requireRole) {
      const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
      hasAccess = allowedRoles.includes(user.role);
    }
    
    // Verificar por vista específica (si no tiene acceso por rol)
    if (!hasAccess && requireVista && user.vistas) {
      hasAccess = user.vistas.includes(requireVista);
    }
  }
  
  if ((requireRole || requireVista) && !hasAccess) {
    console.log('🚫 ProtectedRoute: Sin permisos', {
      requireRole,
      requireVista,
      userRole: user.role,
      userVistas: user.vistas
    });
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

  console.log('✅ ProtectedRoute: Acceso permitido, renderizando children');
  return children;
};

export default ProtectedRoute;
