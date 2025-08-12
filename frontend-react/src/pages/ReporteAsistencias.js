import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TableChart as TableChartIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const ReporteAsistencias = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reporteData, setReporteData] = useState(null);
  
  // Estados para filtros
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  // Verificar permisos al montar
  useEffect(() => {
    if (user?.role !== 'analista') {
      navigate('/');
      return;
    }
    
    cargarAniosDisponibles();
    // Cargar reporte del mes actual por defecto
    generarReporte();
  }, [user, navigate]);

  const cargarAniosDisponibles = async () => {
    try {
      const response = await api.get('/reportes/anios-disponibles');
      if (response.data.success) {
        setAniosDisponibles(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando años disponibles:', error);
      // Si no se pueden cargar, usar años por defecto
      const anioActual = new Date().getFullYear();
      setAniosDisponibles([
        { anio: anioActual },
        { anio: anioActual - 1 },
        { anio: anioActual - 2 }
      ]);
    }
  };

  const generarReporte = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/reportes/asistencias?mes=${mes}&anio=${anio}`);
      
      if (response.data.success) {
        setReporteData(response.data.data);
      } else {
        setError(response.data.message || 'Error generando reporte');
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      setError(error.response?.data?.message || 'Error de conexión al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = () => {
    generarReporte();
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'P': return 'success'; // Presente
      case 'F': return 'error';   // Falta
      case 'T': return 'warning'; // Tardanza
      case 'J': return 'info';    // Justificado
      case 'V': return 'default'; // Vacaciones
      default: return 'default';
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'P': return 'P';
      case 'F': return 'F';
      case 'T': return 'T';
      case 'J': return 'J';
      case 'V': return 'V';
      default: return '-';
    }
  };

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  return (
    <Box sx={{ 
      backgroundColor: '#f7fafc',
      minHeight: '100vh',
      py: 4
    }}>
      {/* Contenedor principal */}
      <Box sx={{ 
        maxWidth: '100%', 
        mx: 'auto',
        px: 2
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4 
        }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/')}
            startIcon={<ArrowBackIcon />}
            sx={{
              fontSize: '0.9rem',
              padding: '0.5rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontWeight: 500,
              color: '#334155',
              backgroundColor: 'white',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#cbd5e1',
                backgroundColor: '#f8fafc'
              }
            }}
          >
            ← Volver al Dashboard
          </Button>
          
          <Typography variant="h3" component="h1" sx={{ 
            fontWeight: 600,
            color: '#0f172a',
            fontSize: '2rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <TableChartIcon sx={{ fontSize: '2rem' }} />
            Reporte de Asistencias
          </Typography>
          
          <Box sx={{ width: 120 }} /> {/* Espaciador */}
        </Box>

        {/* Filtros */}
        <Paper sx={{ 
          mb: 4, 
          borderRadius: '16px',
          backgroundColor: 'white',
          boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <Box sx={{
            backgroundColor: '#0f172a',
            color: 'white',
            p: '1rem 1.25rem',
            borderRadius: '16px 16px 0 0'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, m: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon />
              Filtros de Búsqueda
            </Typography>
          </Box>

          <Box sx={{ p: '1.25rem' }}>
            <Grid container spacing={3} alignItems="end">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Mes</InputLabel>
                  <Select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    label="Mes"
                  >
                    {meses.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Año</InputLabel>
                  <Select
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    label="Año"
                  >
                    {aniosDisponibles.map((a) => (
                      <MenuItem key={a.anio} value={a.anio}>
                        {a.anio}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  onClick={handleFiltroChange}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                  size="large"
                  fullWidth
                  sx={{
                    height: 56,
                    background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 35px rgba(59, 130, 246, 0.4)'
                    },
                    '&:disabled': {
                      background: '#cbd5e0',
                      transform: 'none',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {loading ? 'Generando...' : 'Generar Reporte'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Estadísticas del reporte */}
        {reporteData && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: '16px' }}>
                <CardContent>
                  <PeopleIcon sx={{ fontSize: 40, color: '#3b82f6', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {reporteData.metadata.totalEmpleados}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Empleados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: '16px' }}>
                <CardContent>
                  <CalendarIcon sx={{ fontSize: 40, color: '#059669', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {reporteData.metadata.diasDelMes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Días del Mes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: '16px' }}>
                <CardContent>
                  <ScheduleIcon sx={{ fontSize: 40, color: '#d97706', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {meses.find(m => m.value === reporteData.metadata.mes)?.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mes Reportado
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: '16px' }}>
                <CardContent>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#7c3aed', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {reporteData.metadata.anio}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Año Reportado
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Leyenda de estados */}
        {reporteData && (
          <Paper sx={{ 
            mb: 4, 
            p: 3,
            borderRadius: '16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e5e7eb'
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#0f172a' }}>
              Leyenda de Estados
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label="P - Presente" color="success" size="small" />
              <Chip label="F - Falta" color="error" size="small" />
              <Chip label="T - Tardanza" color="warning" size="small" />
              <Chip label="J - Justificado" color="info" size="small" />
              <Chip label="V - Vacaciones" color="default" size="small" />
              <Chip label="- - Sin Datos" variant="outlined" size="small" />
            </Box>
          </Paper>
        )}

        {/* Tabla de reporte */}
        {reporteData && (
          <Paper sx={{ 
            borderRadius: '16px',
            backgroundColor: 'white',
            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              backgroundColor: '#0f172a',
              color: 'white',
              p: '1rem 1.25rem',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                fontSize: '1.1rem',
                mb: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <TableChartIcon />
                Reporte de Asistencias - {meses.find(m => m.value === mes)?.label} {anio}
              </Typography>
              
              <Tooltip title="Descargar Reporte">
                <IconButton sx={{ color: 'white' }}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <TableContainer sx={{ maxHeight: '70vh' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      backgroundColor: '#2c3e50',
                      color: 'white',
                      fontWeight: 600,
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      minWidth: 80
                    }}>
                      DNI
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#2c3e50',
                      color: 'white',
                      fontWeight: 600,
                      position: 'sticky',
                      left: 80,
                      zIndex: 3,
                      minWidth: 200
                    }}>
                      Empleado
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#2c3e50',
                      color: 'white',
                      fontWeight: 600,
                      minWidth: 120
                    }}>
                      Campaña
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#2c3e50',
                      color: 'white',
                      fontWeight: 600,
                      minWidth: 100
                    }}>
                      Cargo
                    </TableCell>
                    <TableCell sx={{ 
                      backgroundColor: '#2c3e50',
                      color: 'white',
                      fontWeight: 600,
                      minWidth: 80
                    }}>
                      Estado
                    </TableCell>
                    {reporteData.metadata.fechasColumnas.map((fecha) => (
                      <TableCell 
                        key={fecha}
                        sx={{ 
                          backgroundColor: '#2c3e50',
                          color: 'white',
                          fontWeight: 600,
                          minWidth: 50,
                          textAlign: 'center',
                          fontSize: '0.75rem'
                        }}
                      >
                        {fecha.split('-')[2]}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reporteData.empleados.map((empleado, index) => (
                    <TableRow key={empleado.DNI} hover>
                      <TableCell sx={{ 
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'white',
                        zIndex: 2,
                        borderRight: '1px solid #e5e7eb'
                      }}>
                        {empleado.DNI}
                      </TableCell>
                      <TableCell sx={{ 
                        position: 'sticky',
                        left: 80,
                        backgroundColor: 'white',
                        zIndex: 2,
                        borderRight: '1px solid #e5e7eb'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {empleado.ApellidoPaterno} {empleado.ApellidoMaterno}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {empleado.Nombres}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {empleado.Campaña}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {empleado.Cargo}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={empleado.EstadoEmpleado} 
                          color={empleado.EstadoEmpleado === 'ACTIVO' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      {reporteData.metadata.fechasColumnas.map((fecha) => {
                        const estado = empleado[fecha];
                        return (
                          <TableCell 
                            key={fecha}
                            sx={{ 
                              textAlign: 'center',
                              padding: '4px',
                              minWidth: 50
                            }}
                          >
                            {estado ? (
                              <Chip
                                label={getEstadoLabel(estado)}
                                color={getEstadoColor(estado)}
                                size="small"
                                sx={{ 
                                  minWidth: '30px',
                                  fontSize: '0.7rem',
                                  height: '20px'
                                }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                -
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Mensaje de error */}
        {error && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {/* Mensaje cuando no hay datos */}
        {!loading && !reporteData && !error && (
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: '16px',
            backgroundColor: '#f8fafc'
          }}>
            <TableChartIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No hay datos de reporte
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Seleccione un mes y año, luego haga clic en "Generar Reporte"
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ReporteAsistencias;