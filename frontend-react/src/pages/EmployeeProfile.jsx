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

  console.log('🏠 EmployeeProfile renderizándose:', {
    user: user ? `${user.dni} (${user.role})` : 'null',
    loading,
    empleadoInfo: empleadoInfo ? 'Disponible' : 'No disponible',
    currentPath: window.location.pathname
  });

  // Lógica SIMPLE: cargar información cuando el usuario esté disponible
  useEffect(() => {
    console.log('🔄 EmployeeProfile useEffect ejecutándose:', {
      user: user ? `${user.dni} (${user.role})` : 'null',
      userDni: user?.dni
    });
    
    if (user?.dni) {
      console.log('✅ Usuario disponible, cargando información...');
      cargarInformacionEmpleado(user.dni);
    } else {
      console.log('⚠️ Usuario no disponible aún');
    }
  }, [user]);

  const cargarInformacionEmpleado = async (dni) => {
    console.log('🔄 cargarInformacionEmpleado llamado con DNI:', dni);
    
    try {
      setLoading(true);
      
      console.log('📡 Haciendo llamadas API...');
      
      // Lógica SIMPLE: obtener empleado y catálogos
      const [empleadoResponse, catalogosResponse] = await Promise.all([
        api.get(`/empleados/${dni}`),
        api.get('/catalogos')
      ]);
      
      console.log('📡 Respuestas recibidas:', {
        empleado: empleadoResponse.data,
        catalogos: catalogosResponse.data
      });
      
      if (empleadoResponse.data.success && catalogosResponse.data.success) {
        const empleado = empleadoResponse.data.data;
        const catalogos = catalogosResponse.data.catalogos;
        
        console.log('✅ Datos recibidos correctamente:', {
          empleado,
          catalogos
        });
        
        console.log('📅 Campos de fecha disponibles:', {
          FechaContratacion: empleado.FechaContratacion,
          FechaCese: empleado.FechaCese,
          FechaIngreso: empleado.FechaIngreso,
          FechaInicio: empleado.FechaInicio
        });
        
        const empleadoCompleto = {
          ...empleado,
          cargo: catalogos.cargos?.find(c => c.id === empleado.CargoID)?.nombre || 'No especificado',
          campania: catalogos.campanias?.find(c => c.id === empleado.CampañaID)?.nombre || 'No especificado',
          jornada: catalogos.jornadas?.find(c => c.id === empleado.JornadaID)?.nombre || 'No especificado',
          modalidad: catalogos.modalidades?.find(c => c.id === empleado.ModalidadID)?.nombre || 'No especificado'
        };
        
        console.log('✅ Empleado completo procesado:', empleadoCompleto);
        
        setEmpleadoInfo(empleadoCompleto);
      } else {
        console.log('❌ Error en respuestas API:', {
          empleadoSuccess: empleadoResponse.data.success,
          catalogosSuccess: catalogosResponse.data.success
        });
        setEmpleadoInfo(null);
      }
    } catch (error) {
      console.error('❌ Error cargando información:', error);
      console.error('❌ Error completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setEmpleadoInfo(null);
    } finally {
      setLoading(false);
      console.log('✅ Loading terminado');
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
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Header Principal */}
      <Paper sx={{ p: 4, mb: 3, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 3, bgcolor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.3)' }}>
          <PersonIcon sx={{ fontSize: 50 }} />
        </Avatar>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2, fontSize: '2.5rem' }}>
          {empleadoInfo.Nombres} {empleadoInfo.ApellidoPaterno} {empleadoInfo.ApellidoMaterno}
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.9, fontWeight: 400, mb: 2, fontSize: '1.5rem' }}>
          {empleadoInfo.cargo}
        </Typography>
        <Chip 
          label={empleadoInfo.EstadoEmpleado} 
          color={getEstadoColor(empleadoInfo.EstadoEmpleado)}
          variant="filled"
          size="large"
          sx={{ mt: 2, fontSize: '1.1rem', fontWeight: 600, py: 1, px: 2 }}
        />
      </Paper>

      {/* Información Personal */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, color: 'primary.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.5rem' }}>
            <PersonIcon sx={{ fontSize: 28 }} />
            Información Personal
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <CreditCardIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                    DNI
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {empleadoInfo.DNI}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <CalendarIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                    Fecha de Contratación
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
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
                    <Typography variant="body1" color="error" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                      Fecha de Cese
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="error">
                      {formatearFecha(empleadoInfo.FechaCese)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <WorkIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                    Cargo
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {empleadoInfo.cargo}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <BusinessIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                    Campaña
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {empleadoInfo.campania}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <AccessTimeIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                    Jornada
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {empleadoInfo.jornada}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <LaptopIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                    Modalidad
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {empleadoInfo.modalidad}
                  </Typography>
                </Box>
              </Box>
            </Grid>
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
         <Card sx={{ boxShadow: 3, mb: 3 }}>
           <CardContent sx={{ p: 3, textAlign: 'center' }}>
             <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: '1.5rem' }}>
               <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />
               🛡️ Acceso Administrativo
             </Typography>
             <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, fontSize: '1.1rem' }}>
               Como administrador, también tienes acceso a funciones administrativas del sistema
             </Typography>
             <Button 
               variant="contained" 
               color="primary"
               size="large"
               onClick={() => navigate('/')}
               startIcon={<AdminPanelSettingsIcon />}
               sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
             >
               Ir al Dashboard Administrativo
             </Button>
           </CardContent>
         </Card>
       )}

       {/* Control Maestro - Solo para admin */}
       {user?.role === 'admin' && (
         <Card sx={{ boxShadow: 3, mt: 3 }}>
           <CardContent sx={{ p: 3, textAlign: 'center' }}>
             <Typography variant="h5" sx={{ mb: 2, color: 'error.main', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: '1.5rem' }}>
               <SecurityIcon sx={{ fontSize: 28 }} />
               🛡️ Control Maestro del Sistema
             </Typography>
             <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, fontSize: '1.1rem' }}>
               Como administrador del sistema, tienes control total sobre roles y permisos de todos los empleados
             </Typography>
             <Button 
               variant="contained" 
               color="error"
               size="large"
               onClick={() => navigate('/control-maestro')}
               startIcon={<SecurityIcon />}
               sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
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
