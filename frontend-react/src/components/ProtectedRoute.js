import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate, Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireRole }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Verificar si requireRole es un array o un string
  if (requireRole) {
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    const hasAccess = allowedRoles.includes(user.role);
    
    if (!hasAccess) {
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

  return children;
};

export default ProtectedRoute;
