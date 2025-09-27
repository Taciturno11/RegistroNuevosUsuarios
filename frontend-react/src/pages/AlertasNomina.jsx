import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';

const AlertasNomina = () => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alertas, setAlertas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    empleadosConSueldoCero: 0
  });

  // Función para cargar alertas de empleados sin sueldo base
  const cargarAlertas = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obtener empleados sin sueldo base usando el endpoint específico
      const response = await api.get('/nomina/empleados-sin-sueldo-base');
      
      if (response.data.success && response.data.data) {
        const empleadosSinSueldoBase = response.data.data;
        
        setAlertas(empleadosSinSueldoBase);
        
        // Solo guardar la cantidad de empleados sin sueldo base
        setEstadisticas({
          empleadosConSueldoCero: empleadosSinSueldoBase.length
        });
        
        setSuccess(`Se encontraron ${empleadosSinSueldoBase.length} empleados activos sin registro en la tabla SueldoBase`);
      } else {
        setError('No se pudo obtener la lista de empleados sin sueldo base');
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
      setError('Error al cargar las alertas de nómina');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Cargar alertas al montar el componente
  useEffect(() => {
    cargarAlertas();
  }, [cargarAlertas]);

  // Función para refrescar alertas
  const refrescarAlertas = () => {
    cargarAlertas();
  };


  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => window.history.back()}
            sx={{ mr: 2, color: '#6b7280' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <WarningIcon sx={{ mr: 2, color: '#dc2626', fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827' }}>
            Alertas de Nómina
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Identificación de empleados activos que no tienen registro en la tabla SueldoBase
        </Typography>
      </Box>

      {/* Botón de refrescar */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={refrescarAlertas}
          disabled={loading}
          sx={{ 
            borderColor: '#dc2626', 
            color: '#dc2626',
            '&:hover': { 
              borderColor: '#b91c1c', 
              backgroundColor: '#fef2f2' 
            }
          }}
        >
          {loading ? 'Cargando...' : 'Refrescar Alertas'}
        </Button>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: '#dc2626', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#dc2626' }}>
                {estadisticas.empleadosConSueldoCero}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Empleados con Sueldo Base 0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de Alertas */}
      {alertas.length > 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#dc2626', fontWeight: 600 }}>
            🚨 Empleados Activos Sin Registro en SueldoBase
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#fef2f2' }}>
                  <TableCell sx={{ fontWeight: 700 }}>DNI</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Empleado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Campaña</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cargo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha Contratación</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Problema</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alertas.map((empleado, index) => {
                  // Función para obtener el estado del empleado
                  const obtenerEstadoEmpleado = (estado) => {
                    const estados = {
                      'Activo': { color: 'success', label: 'Activo' },
                      'Cese': { color: 'error', label: 'Cese' },
                      'Suspendido': { color: 'warning', label: 'Suspendido' },
                      'Vacaciones': { color: 'info', label: 'Vacaciones' }
                    };
                    return estados[estado] || { color: 'default', label: estado || 'N/A' };
                  };

                  const estado = obtenerEstadoEmpleado(empleado.EstadoEmpleado);
                  
                  // Formatear fecha de contratación
                  const formatearFecha = (fecha) => {
                    if (!fecha) return 'N/A';
                    try {
                      return new Date(fecha).toLocaleDateString('es-PE');
                    } catch {
                      return fecha;
                    }
                  };

                  return (
                    <TableRow key={index} hover>
                      <TableCell>{empleado.DNI || 'N/A'}</TableCell>
                      <TableCell>
                        {`${empleado.Nombres || ''} ${empleado.ApellidoPaterno || ''} ${empleado.ApellidoMaterno || ''}`.trim() || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={estado.label} 
                          color={estado.color} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{empleado.NombreCampaña || 'N/A'}</TableCell>
                      <TableCell>{empleado.NombreCargo || 'N/A'}</TableCell>
                      <TableCell>{formatearFecha(empleado.FechaContratacion)}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label="Sin Sueldo Base" 
                          color="error" 
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, color: '#10b981' }}>
            ¡Excelente!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No se encontraron empleados activos sin registro en la tabla SueldoBase
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AlertasNomina;
