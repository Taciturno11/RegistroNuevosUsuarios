import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const Dotacion = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dotacionData, setDotacionData] = useState([]);
  const [resumen, setResumen] = useState(null);
  
  // Estados para edición de metas
  const [editandoMeta, setEditandoMeta] = useState(null);
  const [nuevaMeta, setNuevaMeta] = useState('');

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [dotacionResponse, resumenResponse] = await Promise.all([
        api.get('/dotacion'),
        api.get('/dotacion/resumen')
      ]);

      if (dotacionResponse.data.success) {
        setDotacionData(dotacionResponse.data.data.dotacion);
      }

      if (resumenResponse.data.success) {
        setResumen(resumenResponse.data.data);
      }

    } catch (error) {
      console.error('Error cargando datos de dotación:', error);
      setError('Error cargando datos de dotación');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarEdicion = (campania) => {
    setEditandoMeta(campania);
    setNuevaMeta(campania.meta.toString());
  };

  const handleGuardarMeta = async (campania) => {
    if (!nuevaMeta || isNaN(parseInt(nuevaMeta))) {
      setError('Por favor ingrese una meta válida');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/dotacion/meta', {
        campaniaId: campania.campania.id,
        meta: parseInt(nuevaMeta)
      });

      if (response.data.success) {
        setSuccess('Meta guardada exitosamente');
        
        // Actualizar datos locales
        setDotacionData(prevData => 
          prevData.map(item => 
            item.campania.id === campania.campania.id
              ? {
                  ...item,
                  meta: parseInt(nuevaMeta),
                  cumplimiento: parseInt(nuevaMeta) > 0 ? ((item.dotaActual / parseInt(nuevaMeta)) * 100).toFixed(2) : 0
                }
              : item
          )
        );
        
        setEditandoMeta(null);
        setNuevaMeta('');
      }
    } catch (error) {
      console.error('Error guardando meta:', error);
      setError('Error guardando meta');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarEdicion = () => {
    setEditandoMeta(null);
    setNuevaMeta('');
  };

  const getCumplimientoColor = (cumplimiento) => {
    const valor = parseFloat(cumplimiento);
    if (valor >= 100) return '#4caf50'; // Verde
    if (valor >= 75) return '#ffc107'; // Amarillo
    return '#f44336'; // Rojo
  };

  const getCumplimientoStatus = (cumplimiento) => {
    const valor = parseFloat(cumplimiento);
    if (valor >= 100) return { text: 'Excelente', color: '#4caf50' };
    if (valor >= 90) return { text: 'Muy Bueno', color: '#8bc34a' };
    if (valor >= 80) return { text: 'Bueno', color: '#ff9800' };
    if (valor >= 70) return { text: 'Regular', color: '#ff5722' };
    return { text: 'Bajo', color: '#f44336' };
  };

  const getCumplimientoIcon = (cumplimiento) => {
    const valor = parseFloat(cumplimiento);
    if (valor >= 100) return <CheckIcon sx={{ color: '#4caf50' }} />;
    if (valor >= 75) return <TrendingUpIcon sx={{ color: '#ffc107' }} />;
    return <CloseIcon sx={{ color: '#f44336' }} />;
  };

  if (loading && dotacionData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
          Dotación por Campaña
        </Typography>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Resumen */}
      {resumen && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: '#2c3e50', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{resumen.TotalEmpleados}</Typography>
                    <Typography variant="body2">Total Empleados</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: '#27ae60', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckIcon sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{resumen.EmpleadosActivos}</Typography>
                    <Typography variant="body2">Activos</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: '#f39c12', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{resumen.EmpleadosInactivos}</Typography>
                    <Typography variant="body2">Inactivos</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: '#e74c3c', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CloseIcon sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{resumen.EmpleadosCesados}</Typography>
                    <Typography variant="body2">Cesados</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabla de Dotación */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Paper sx={{ overflow: 'hidden', maxWidth: '1100px', width: '100%' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#2c3e50' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', minWidth: '180px' }}>
                    Campaña
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', minWidth: '100px' }}>
                    Full Time
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', minWidth: '100px' }}>
                    Semi Full
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', minWidth: '100px' }}>
                    Part Time
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    minWidth: '120px',
                    backgroundColor: 'rgba(52, 152, 219, 0.15)'
                  }}>
                    Dota Actual
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    minWidth: '120px',
                    backgroundColor: 'rgba(230, 126, 34, 0.15)'
                  }}>
                    Meta
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    minWidth: '140px',
                    backgroundColor: 'rgba(46, 204, 113, 0.15)'
                  }}>
                    Cumplimiento
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dotacionData.map((fila, index) => (
                  <TableRow 
                    key={fila.campania.id}
                    sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    {/* Campaña */}
                    <TableCell sx={{ minWidth: '180px' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                        {fila.campania.nombre}
                      </Typography>
                    </TableCell>

                    {/* Full Time */}
                    <TableCell sx={{ textAlign: 'center', minWidth: '100px' }}>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main',
                        fontSize: '1rem'
                      }}>
                        {fila.jornadas[1]?.cantidad || 0}
                      </Typography>
                    </TableCell>

                    {/* Semi Full */}
                    <TableCell sx={{ textAlign: 'center', minWidth: '100px' }}>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold', 
                        color: 'secondary.main',
                        fontSize: '1rem'
                      }}>
                        {fila.jornadas[2]?.cantidad || 0}
                      </Typography>
                    </TableCell>

                    {/* Part Time */}
                    <TableCell sx={{ textAlign: 'center', minWidth: '100px' }}>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold', 
                        color: 'info.main',
                        fontSize: '1rem'
                      }}>
                        {fila.jornadas[3]?.cantidad || 0}
                      </Typography>
                    </TableCell>

                    {/* Dota Actual */}
                    <TableCell sx={{ 
                      textAlign: 'center', 
                      minWidth: '120px',
                      backgroundColor: 'rgba(52, 152, 219, 0.03)'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold', 
                        color: '#3498db',
                        fontSize: '1.2rem'
                      }}>
                        {fila.dotaActual}
                      </Typography>
                    </TableCell>

                    {/* Meta */}
                    <TableCell sx={{ 
                      textAlign: 'center', 
                      minWidth: '120px',
                      backgroundColor: 'rgba(230, 126, 34, 0.03)'
                    }}>
                      {editandoMeta && editandoMeta.campania.id === fila.campania.id ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <TextField
                            type="number"
                            value={nuevaMeta}
                            onChange={(e) => setNuevaMeta(e.target.value)}
                            size="small"
                            sx={{ width: '80px' }}
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleGuardarMeta(fila);
                              } else if (e.key === 'Escape') {
                                handleCancelarEdicion();
                              }
                            }}
                          />
                          <Tooltip title="Guardar">
                            <IconButton 
                              size="small" 
                              onClick={() => handleGuardarMeta(fila)}
                              color="primary"
                            >
                              <SaveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancelar">
                            <IconButton 
                              size="small" 
                              onClick={handleCancelarEdicion}
                              color="inherit"
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 'bold',
                            color: '#e67e22',
                            fontSize: '1.2rem'
                          }}>
                            {fila.meta}
                          </Typography>
                          <Tooltip title="Editar meta">
                            <IconButton 
                              size="small" 
                              onClick={() => handleIniciarEdicion(fila)}
                              color="primary"
                              sx={{ p: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>

                    {/* Cumplimiento */}
                    <TableCell sx={{ 
                      textAlign: 'center', 
                      minWidth: '140px',
                      backgroundColor: 'rgba(46, 204, 113, 0.03)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        {getCumplimientoIcon(fila.cumplimiento)}
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold',
                          color: getCumplimientoColor(fila.cumplimiento),
                          fontSize: '1.2rem'
                        }}>
                          {Math.round(parseFloat(fila.cumplimiento))}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

    </Box>
  );
};

export default Dotacion;
