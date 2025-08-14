import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Paper, 
  Grid,
  Chip,
  Divider,
  Button
} from '@mui/material';
import {
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Laptop as LaptopIcon,
  Circle as CircleIcon,
  Event as EventIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const EmployeeProfile = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const [empleadoInfo, setEmpleadoInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lógica SIMPLE: cargar información cuando el usuario esté disponible
  useEffect(() => {
    if (user?.dni) {
      cargarInformacionEmpleado(user.dni);
    }
  }, [user]);

  const cargarInformacionEmpleado = async (dni) => {
    try {
      setLoading(true);
      
      // Lógica SIMPLE: obtener empleado y catálogos
      const [empleadoResponse, catalogosResponse] = await Promise.all([
        api.get(`/empleados/${dni}`),
        api.get('/catalogos')
      ]);
      
      if (empleadoResponse.data.success && catalogosResponse.data.success) {
        const empleado = empleadoResponse.data.data;
        const catalogos = catalogosResponse.data.catalogos;
        
        const empleadoCompleto = {
          ...empleado,
          cargo: catalogos.cargos?.find(c => c.id === empleado.CargoID)?.nombre || 'No especificado',
          campania: catalogos.campanias?.find(c => c.id === empleado.CampañaID)?.nombre || 'No especificado',
          jornada: catalogos.jornadas?.find(c => c.id === empleado.JornadaID)?.nombre || 'No especificado',
          modalidad: catalogos.modalidades?.find(c => c.id === empleado.ModalidadID)?.nombre || 'No especificado'
        };
        
        setEmpleadoInfo(empleadoCompleto);
      } else {
        setEmpleadoInfo(null);
      }
    } catch (error) {
      console.error('Error cargando información:', error);
      setEmpleadoInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'No especificada';
    
    try {
      // Si la fecha viene como string ISO, convertirla correctamente
      let fecha;
      if (typeof fechaString === 'string') {
        if (fechaString.includes('T')) {
          // Formato ISO con T - usar la fecha tal como viene sin conversión de zona horaria
          const [year, month, day] = fechaString.split('T')[0].split('-');
          fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (fechaString.includes('-')) {
          // Formato YYYY-MM-DD
          const [year, month, day] = fechaString.split('-');
          fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Otro formato, intentar parsear
          fecha = new Date(fechaString);
        }
      } else {
        fecha = new Date(fechaString);
      }
      
      // Verificar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }
      
      // Formatear como DD de MMMM de YYYY
      return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Activo':
        return 'success';
      case 'Cese':
        return 'error';
      case 'Inactivo':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
          🔄 Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  // Si no hay usuario autenticado, mostrar mensaje apropiado
  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
          🔐 No autenticado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Por favor, inicia sesión para continuar.
        </Typography>
      </Box>
    );
  }

  // Si no hay información del empleado, mostrar loading
  if (!empleadoInfo) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
          🔄 Cargando información del empleado...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 900, mx: 'auto' }}>
      {/* Header Principal */}
      <Paper sx={{ p: 2.5, mb: 2, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Avatar sx={{ width: 70, height: 70, mx: 'auto', mb: 2, bgcolor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}>
          <PersonIcon sx={{ fontSize: 35 }} />
        </Avatar>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Mi Perfil de Empleado
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          {empleadoInfo.Nombres} {empleadoInfo.ApellidoPaterno} {empleadoInfo.ApellidoMaterno}
        </Typography>
        <Chip 
          label={empleadoInfo.EstadoEmpleado} 
          color={getEstadoColor(empleadoInfo.EstadoEmpleado)}
          variant="filled"
          size="medium"
          sx={{ mt: 1.5, fontSize: '0.9rem', fontWeight: 600 }}
        />
      </Paper>

      {/* Información Personal */}
      <Card sx={{ mb: 2, boxShadow: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            Información Personal
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                <CreditCardIcon color="primary" sx={{ fontSize: 24 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    DNI
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {empleadoInfo.DNI}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                <CalendarIcon color="primary" sx={{ fontSize: 24 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    Fecha de Contratación
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatearFecha(empleadoInfo.FechaContratacion)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {empleadoInfo.FechaCese && (
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'error.50', borderRadius: 2, border: '1px solid #fecaca' }}>
                  <EventIcon color="error" sx={{ fontSize: 28 }} />
                  <Box>
                    <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                      Fecha de Cese
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="error">
                      {formatearFecha(empleadoInfo.FechaCese)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Información Laboral */}
      <Card sx={{ mb: 2, boxShadow: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkIcon />
            Información Laboral
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                <WorkIcon color="primary" sx={{ fontSize: 24 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    Cargo
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {empleadoInfo.cargo}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                <BusinessIcon color="primary" sx={{ fontSize: 24 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    Campaña
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {empleadoInfo.campania}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                <AccessTimeIcon color="primary" sx={{ fontSize: 24 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    Jornada
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {empleadoInfo.jornada}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                <LaptopIcon color="primary" sx={{ fontSize: 24 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    Modalidad
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {empleadoInfo.modalidad}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

             {/* Acceso Administrativo (solo si es admin) */}
       {user?.role === 'admin' && (
         <Card sx={{ boxShadow: 2 }}>
           <CardContent sx={{ p: 2, textAlign: 'center' }}>
             <Typography variant="h6" sx={{ mb: 1.5, color: 'primary.main', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
               <AdminPanelSettingsIcon />
               🛡️ Acceso Administrativo
             </Typography>
             <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
               Como administrador, también tienes acceso a funciones administrativas del sistema
             </Typography>
             <Button 
               variant="contained" 
               color="primary"
               size="medium"
               onClick={() => navigate('/')}
               startIcon={<AdminPanelSettingsIcon />}
               sx={{ px: 3, py: 1, fontSize: '1rem' }}
             >
               Ir al Dashboard Administrativo
             </Button>
           </CardContent>
         </Card>
       )}

       {/* Control Maestro - Solo para el creador */}
       {user?.dni === '73766815' && (
         <Card sx={{ boxShadow: 2, mt: 2 }}>
           <CardContent sx={{ p: 2, textAlign: 'center' }}>
             <Typography variant="h6" sx={{ mb: 1.5, color: 'error.main', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
               <SecurityIcon />
               🛡️ Control Maestro del Sistema
             </Typography>
             <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
               Como creador del sistema, tienes control total sobre roles y permisos de todos los empleados
             </Typography>
             <Button 
               variant="contained" 
               color="error"
               size="medium"
               onClick={() => navigate('/control-maestro')}
               startIcon={<SecurityIcon />}
               sx={{ px: 3, py: 1, fontSize: '1rem' }}
             >
               Acceder al Control Maestro
             </Button>
           </CardContent>
         </Card>
       )}
    </Box>
  );
};

export default EmployeeProfile;
