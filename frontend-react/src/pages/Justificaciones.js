import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Container,
  Tooltip,
  Pagination,
  Collapse,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  ListAlt as ListAltIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Tag as TagIcon,
  Comment as CommentIcon,
  Info as InfoIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  AccountCircle as AccountCircleIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const Justificaciones = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados del empleado seleccionado
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: '',
    motivo: '',
    estado: '',
    aprobadorDNI: ''
  });
  
  // Estados para catálogos
  const [tiposJustificacion, setTiposJustificacion] = useState([]);
  
  // Estados para justificaciones existentes
  const [justificaciones, setJustificaciones] = useState([]);
  
  // Estados para filtros
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina] = useState(8);
  
  // Estados para vista
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Contexto empleado desde localStorage - memoizado para evitar re-renders
  const { dni, nombreEmpleado } = useMemo(() => {
    if (typeof window === 'undefined') return { dni: '', nombreEmpleado: '' };
    return {
      dni: localStorage.getItem('empleadoDNI') || '',
      nombreEmpleado: localStorage.getItem('empleadoNombre') || ''
    };
  }, []);

  // Filtrado optimizado con useMemo para evitar re-renders innecesarios
  const justificacionesFiltradas = useMemo(() => {
    if (!Array.isArray(justificaciones)) {
      return [];
    }
    
    let filtradas = [...justificaciones];

    if (filtroMes) {
      filtradas = filtradas.filter(j => {
        const fecha = new Date(j.Fecha || j.fecha);
        return fecha.getMonth() + 1 === parseInt(filtroMes);
      });
    }

    if (filtroAnio) {
      filtradas = filtradas.filter(j => {
        const fecha = new Date(j.Fecha || j.fecha);
        return fecha.getFullYear() === parseInt(filtroAnio);
      });
    }

    if (filtroEstado) {
      filtradas = filtradas.filter(j => (j.Estado || j.estado) === filtroEstado);
    }

    return filtradas;
  }, [justificaciones, filtroMes, filtroAnio, filtroEstado]);

  // Calcular estadísticas optimizado con useMemo
  const estadisticas = useMemo(() => {
    if (!Array.isArray(justificacionesFiltradas)) {
      return { total: 0, aprobadas: 0, desaprobadas: 0, pendientes: 0 };
    }

    const total = justificacionesFiltradas.length;
    const aprobadas = justificacionesFiltradas.filter(j => (j.Estado || j.estado) === 'Aprobado').length;
    const desaprobadas = justificacionesFiltradas.filter(j => (j.Estado || j.estado) === 'Desaprobado').length;
    const pendientes = 0; // No hay estado pendiente

    return { total, aprobadas, desaprobadas, pendientes };
  }, [justificacionesFiltradas]);

  const cargarDatosEmpleado = useCallback(async () => {
    try {
      const response = await api.get(`/empleados/${dni}`);
      if (response.data.success) {
        setEmpleadoSeleccionado(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando datos del empleado:', error);
    }
  }, [api, dni]);

  const cargarTiposJustificacion = useCallback(async () => {
    try {
      const response = await api.get('/justificaciones/tipos');
      if (response.data.success) {
        setTiposJustificacion(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando tipos de justificación:', error);
      setTiposJustificacion([]);
    }
  }, [api]);

  const cargarJustificaciones = useCallback(async () => {
    try {
      // Llamar sin parámetros de paginación para obtener TODOS los registros
      const response = await api.get(`/justificaciones/${dni}`);
      
      // Manejar respuesta directa (array) o envuelta (objeto con success)
      let data;
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.success) {
        data = response.data.data?.justificaciones || response.data.data || [];
      } else {
        data = [];
      }
      
      console.log(`📋 Justificaciones cargadas para DNI ${dni}:`, data.length, 'registros');
      console.log('📋 Datos:', data);
      setJustificaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando justificaciones:', error);
      setJustificaciones([]);
    }
  }, [api, dni]);

  const inicializarComponente = useCallback(async () => {
    if (!dni) {
      setError('No se ha seleccionado un empleado. Regrese al dashboard.');
      return;
    }

    setLoading(true);
    try {
      await Promise.all([
        cargarTiposJustificacion(),
        cargarJustificaciones(),
        cargarDatosEmpleado()
      ]);
    } catch (error) {
      console.error('Error en inicialización:', error);
      setError('Error cargando datos iniciales');
    } finally {
      setLoading(false);
    }
  }, [dni, cargarTiposJustificacion, cargarJustificaciones, cargarDatosEmpleado]);



  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
      setLoading(true);
      setError('');
    setSuccess('');

    try {
      const payload = {
        empleadoDNI: dni,
        fecha: formData.fecha,
        tipo: formData.tipo,
        motivo: formData.motivo,
        estado: formData.estado,
        aprobadorDNI: formData.aprobadorDNI || null
      };

      const response = await api.post('/justificaciones', payload);
      
      if (response.data.success) {
        setSuccess('Justificación registrada exitosamente');
        setFormData({
          fecha: new Date().toISOString().split('T')[0],
          tipo: '',
          motivo: '',
          estado: '',
          aprobadorDNI: ''
        });
        await cargarJustificaciones();
      } else {
        setError(response.data.message || 'Error registrando justificación');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [api, dni, formData, cargarJustificaciones]);

  const handleEliminar = useCallback(async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta justificación?')) return;

    try {
      const response = await api.delete(`/justificaciones/${id}`);
      if (response.data.success) {
        setSuccess('Justificación eliminada exitosamente');
        await cargarJustificaciones();
      } else {
        setError(response.data.message || 'Error eliminando justificación');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    }
  }, [api, cargarJustificaciones]);

  // Handlers optimizados para filtros
  const handleFiltroMes = useCallback((e) => {
    setFiltroMes(e.target.value);
    setPaginaActual(1); // Reset página al filtrar
  }, []);

  const handleFiltroAnio = useCallback((e) => {
    setFiltroAnio(e.target.value);
    setPaginaActual(1); // Reset página al filtrar
  }, []);

  const handleFiltroEstado = useCallback((e) => {
    setFiltroEstado(e.target.value);
    setPaginaActual(1); // Reset página al filtrar
  }, []);

  const handlePaginaChange = useCallback((e, page) => {
    setPaginaActual(page);
  }, []);

  const toggleFiltros = useCallback(() => {
    setMostrarFiltros(prev => !prev);
  }, []);

  // Handlers específicos para cada input del formulario (evita recreación)
  const handleFechaChange = useCallback((e) => {
    handleInputChange('fecha', e.target.value);
  }, [handleInputChange]);

  const handleTipoChange = useCallback((e) => {
    handleInputChange('tipo', e.target.value);
  }, [handleInputChange]);

  const handleMotivoChange = useCallback((e) => {
    handleInputChange('motivo', e.target.value);
  }, [handleInputChange]);

  const handleEstadoChange = useCallback((e) => {
    handleInputChange('estado', e.target.value);
  }, [handleInputChange]);

  const handleAprobadorChange = useCallback((e) => {
    handleInputChange('aprobadorDNI', e.target.value);
  }, [handleInputChange]);

  // Estilos memoizados para evitar recreación
  const estilos = useMemo(() => ({
    contenedorPrincipal: {
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      py: 3,
      // Prevent layout shift when scrollbars appear/disappear
      overflowY: 'auto',
      scrollbarGutter: 'stable',
      // Optimizaciones críticas para eliminar temblor
      willChange: 'auto',
      transform: 'translateZ(0)', // Forzar aceleración por hardware
      '& .MuiSelect-select': {
        transition: 'none !important',
        willChange: 'auto'
      },
      '& .MuiFormControl-root': {
        transition: 'none !important',
        willChange: 'auto'
      },
      '& .MuiInputBase-root': {
        transition: 'none !important',
        willChange: 'auto'
      },
      '& .MuiOutlinedInput-notchedOutline': {
        transition: 'none !important'
      },
      '& .MuiMenuItem-root': {
        transition: 'none !important'
      },
      '& .MuiPaper-root': {
        willChange: 'auto'
      },
      // CRÍTICO: Fijar el dropdown para que no afecte el layout
      '& .MuiPopover-root': {
        willChange: 'auto'
      },
      '& .MuiMenu-paper': {
        willChange: 'auto'
      }
    },
    headerPaper: {
      mb: 3,
      borderRadius: 4,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
    },
    formularioPaper: {
      mb: 3,
      borderRadius: 4,
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      border: '2px solid #667eea'
    },
    tablaPaper: {
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    }
  }), []);

  const getEstadoColor = useCallback((estado) => {
    switch (estado) {
      case 'Aprobado': return 'success';
      case 'Desaprobado': return 'error';
      default: return 'default';
    }
  }, []);

  const getEstadoIcon = useCallback((estado) => {
    switch (estado) {
      case 'Aprobado': return <CheckCircleIcon />;
      case 'Desaprobado': return <CancelIcon />;
      default: return <InfoIcon />;
    }
  }, []);

  const formatearFecha = useCallback((fecha) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  }, []);

  // Paginación optimizada con useMemo
  const { justificacionesPaginadas, totalPaginas } = useMemo(() => {
    const indiceInicio = (paginaActual - 1) * elementosPorPagina;
    const indiceFin = indiceInicio + elementosPorPagina;
    return {
      justificacionesPaginadas: justificacionesFiltradas.slice(indiceInicio, indiceFin),
      totalPaginas: Math.ceil(justificacionesFiltradas.length / elementosPorPagina)
    };
  }, [justificacionesFiltradas, paginaActual, elementosPorPagina]);

  // Inicialización - solo cuando cambie el DNI (después de declarar todas las funciones)
  useEffect(() => {
    if (dni) {
      inicializarComponente();
    }
  }, [dni, inicializarComponente]);

  // Si no hay empleado seleccionado
  if (!dni) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            No hay empleado seleccionado
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Debe seleccionar un empleado desde el dashboard para gestionar justificaciones.
          </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/admin')}
          startIcon={<ArrowBackIcon />}
        >
          Volver al Dashboard
        </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={estilos.contenedorPrincipal}>
      <Container maxWidth="xl">
        {/* Header Principal con KPIs integrados */}
        <Paper sx={estilos.headerPaper}>
          <Box sx={{ p: 3 }}>
            {/* Fila única: Título, Empleado y KPIs en una sola línea */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* Navegación y Título */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton 
            onClick={() => navigate('/admin')}
            sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <AssignmentIcon sx={{ fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Gestión de Justificaciones
          </Typography>
        </Box>

              {/* Información del empleado - más grande */}
          <Box sx={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                p: 2.5,
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                minWidth: 280
              }}>
                <AccountCircleIcon sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {nombreEmpleado || 'Empleado'}
              </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    DNI: {dni}
              </Typography>
              </Box>
              </Box>

              {/* KPIs compactos a la derecha - solo 3 */}
              <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  p: 1.5,
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  minWidth: 80
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {estadisticas.total}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Total
                  </Typography>
                </Box>

                <Box sx={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: 2,
                  p: 1.5,
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  minWidth: 80
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {estadisticas.aprobadas}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Aprobadas
                  </Typography>
                </Box>

                <Box sx={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  borderRadius: 2,
                  p: 1.5,
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  minWidth: 80
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {estadisticas.desaprobadas}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Desaprobadas
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Alertas - sin animaciones para evitar temblor */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError('')}
              sx={{ borderRadius: 3 }}
            >
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert 
              severity="success" 
              onClose={() => setSuccess('')}
              sx={{ borderRadius: 3 }}
            >
              {success}
            </Alert>
          )}
        </Stack>

        {/* Formulario de Nueva Justificación - Siempre visible */}
        <Paper sx={estilos.formularioPaper}>
          <Box sx={{
            backgroundColor: '#667eea',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <AddIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Registrar Nueva Justificación
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Primera fila: Fecha de Justificación y Tipo de Justificación */}
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                <TextField
                      label="Fecha de Justificación *"
                  type="date"
                  value={formData.fecha}
                                        onChange={handleFechaChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            borderWidth: 2
                          },
                        },
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                <FormControl fullWidth required>
                      <InputLabel 
                        shrink 
                        sx={{ 
                          fontSize: '1rem',
                          fontWeight: 500,
                          '&.Mui-focused': {
                            color: '#667eea'
                          }
                        }}
                      >
                        Tipo de Justificación *
                      </InputLabel>
                  <Select
                    value={formData.tipo}
                        onChange={handleTipoChange}
                        label="Tipo de Justificación *"
                        displayEmpty
                        MenuProps={{
                          disableScrollLock: true,
                          keepMounted: true,
                          // CRÍTICO: Evitar que el dropdown afecte el layout
                          disablePortal: false,
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                          PaperProps: {
                            style: {
                              transform: 'translateZ(0)',
                              willChange: 'auto',
                              minWidth: '400px', // Ancho mínimo más grande
                              width: '400px', // Ancho fijo
                              maxWidth: '400px' // Ancho máximo fijo
                            }
                          }
                        }}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: 'white',
                          height: 56, // Altura fija
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>Seleccione una opción</em>
                        </MenuItem>
                    {tiposJustificacion.map((tipo, index) => (
                      <MenuItem key={index} value={tipo.TipoJustificacion}>
                        {tipo.TipoJustificacion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                  </Box>
                </Box>
            
                {/* Segunda fila: Motivo (campo amplio) */}
                <Box>
              <TextField
                    label="Motivo *"
                value={formData.motivo}
                                    onChange={handleMotivoChange}
                    fullWidth
                required
                    multiline
                    rows={2}
                    placeholder="Escriba el motivo (máx. 200 caracteres)"
                inputProps={{ maxLength: 200 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#667eea',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea',
                          borderWidth: 2
                        },
                      },
                }}
              />
            </Box>
            
                {/* Tercera fila: Estado y Aprobador DNI */}
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth required>
                      <InputLabel 
                        shrink 
                        sx={{ 
                          fontSize: '1rem',
                          fontWeight: 500,
                          '&.Mui-focused': {
                            color: '#667eea'
                          }
                        }}
                      >
                        Estado *
                      </InputLabel>
                  <Select
                    value={formData.estado}
                        onChange={handleEstadoChange}
                        label="Estado *"
                        displayEmpty
                        MenuProps={{
                          disableScrollLock: true,
                          keepMounted: true,
                          // CRÍTICO: Evitar que el dropdown afecte el layout
                          disablePortal: false,
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                          PaperProps: {
                            style: {
                              transform: 'translateZ(0)',
                              willChange: 'auto',
                              minWidth: '250px', // Ancho mínimo más grande
                              width: '250px', // Ancho fijo
                              maxWidth: '250px' // Ancho máximo fijo
                            }
                          }
                        }}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: 'white',
                          height: 56, // Altura fija
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2
                          },
                        }}
                      >
                                              <MenuItem value="" disabled>
                        <em>Seleccione estado</em>
                      </MenuItem>
                    <MenuItem value="Aprobado">Aprobado</MenuItem>
                    <MenuItem value="Desaprobado">Desaprobado</MenuItem>
                  </Select>
                </FormControl>
                  </Box>
              
                  <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Aprobador DNI"
                    value={formData.aprobadorDNI}
                                          onChange={handleAprobadorChange}
                    fullWidth
                      placeholder="Ingrese DNI del aprobador"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            borderWidth: 2
                          },
                        },
                      }}
                    />
                          </Box>
                          </Box>

                {/* Cuarta fila: Botón */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                  sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: 2,
                    fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      minWidth: 140,
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                    },
                    '&:disabled': {
                        background: '#9ca3af',
                      transform: 'none',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {loading ? 'Registrando...' : 'Registrar'}
                </Button>
                </Box>
              </Box>
          </form>
          </Box>
        </Paper>

        {/* Tabla de Justificaciones */}
        <Paper sx={estilos.tablaPaper}>
          {/* Header de la tabla */}
          <Box sx={{ 
            backgroundColor: '#1f2937',
            color: 'white',
            p: 3
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ListAltIcon sx={{ fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Historial de Justificaciones
              </Typography>
                <Chip 
                  label={`${estadisticas.total} registros`}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
              
              <Button
                variant="outlined"
                startIcon={mostrarFiltros ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={toggleFiltros}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Filtros
              </Button>
            </Box>

            {/* Filtros colapsables */}
            <Collapse in={mostrarFiltros}>
              <Box sx={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                p: 2,
                backdropFilter: 'blur(10px)',
                // Fijar dimensiones del contenedor de filtros
                minHeight: 72,
                maxHeight: 72,
                height: 72,
                display: 'flex',
                alignItems: 'center'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'space-between' // Distribución fija
                }}>
                  {/* Contenedor de los 3 selectores con dimensiones fijas */}
                  <Box sx={{
                    display: 'flex',
                    gap: 3,
                    alignItems: 'center',
                    width: 540, // Ancho fijo total (180 + 140 + 160 + gaps)
                    flexShrink: 0
                  }}>
                    <Box sx={{ 
                      width: 180, // Dimensión fija
                      flexShrink: 0 // No reducir tamaño
                    }}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: 'white', fontWeight: 500 }}>Mes</InputLabel>
                      <Select
                        value={filtroMes}
                        onChange={handleFiltroMes}
                        label="Mes"
                        MenuProps={{
                          disableScrollLock: true,
                          keepMounted: true,
                          // CRÍTICO: Evitar que el dropdown afecte el layout
                          disablePortal: false,
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                          PaperProps: {
                            style: {
                              transform: 'translateZ(0)',
                              willChange: 'auto',
                              minWidth: '220px', // Ancho mínimo más grande
                              width: '220px', // Ancho fijo
                              maxWidth: '220px' // Ancho máximo fijo
                            }
                          }
                        }}
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          color: 'white',
                          borderRadius: 2,
                          width: '100%',
                          height: 40, // Altura fija
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.3)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.5)'
                          },
                          '& .MuiSvgIcon-root': {
                            color: 'white'
                          }
                        }}
                      >
                        <MenuItem value="">Todos los meses</MenuItem>
                        <MenuItem value="1">Enero</MenuItem>
                        <MenuItem value="2">Febrero</MenuItem>
                        <MenuItem value="3">Marzo</MenuItem>
                        <MenuItem value="4">Abril</MenuItem>
                        <MenuItem value="5">Mayo</MenuItem>
                        <MenuItem value="6">Junio</MenuItem>
                        <MenuItem value="7">Julio</MenuItem>
                        <MenuItem value="8">Agosto</MenuItem>
                        <MenuItem value="9">Septiembre</MenuItem>
                        <MenuItem value="10">Octubre</MenuItem>
                        <MenuItem value="11">Noviembre</MenuItem>
                        <MenuItem value="12">Diciembre</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                    <Box sx={{ 
                      width: 140, // Dimensión fija
                      flexShrink: 0 // No reducir tamaño
                    }}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: 'white', fontWeight: 500 }}>Año</InputLabel>
                      <Select
                        value={filtroAnio}
                        onChange={handleFiltroAnio}
                        label="Año"
                        MenuProps={{
                          disableScrollLock: true,
                          keepMounted: true,
                          // CRÍTICO: Evitar que el dropdown afecte el layout
                          disablePortal: false,
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                          PaperProps: {
                            style: {
                              transform: 'translateZ(0)',
                              willChange: 'auto',
                              minWidth: '180px', // Ancho mínimo más grande
                              width: '180px', // Ancho fijo
                              maxWidth: '180px' // Ancho máximo fijo
                            }
                          }
                        }}
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          color: 'white',
                          borderRadius: 2,
                          width: '100%',
                          height: 40, // Altura fija
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.3)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.5)'
                          },
                          '& .MuiSvgIcon-root': {
                            color: 'white'
                          }
                        }}
                      >
                        <MenuItem value="">Todos los años</MenuItem>
                        <MenuItem value="2024">2024</MenuItem>
                        <MenuItem value="2025">2025</MenuItem>
                        <MenuItem value="2026">2026</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                                      <Box sx={{ 
                      width: 160, // Dimensión fija
                      flexShrink: 0 // No reducir tamaño
                    }}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: 'white', fontWeight: 500 }}>Estado</InputLabel>
                      <Select
                        value={filtroEstado}
                        onChange={handleFiltroEstado}
                        label="Estado"
                        MenuProps={{
                          disableScrollLock: true,
                          keepMounted: true,
                          // CRÍTICO: Evitar que el dropdown afecte el layout
                          disablePortal: false,
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                          PaperProps: {
                            style: {
                              transform: 'translateZ(0)',
                              willChange: 'auto',
                              minWidth: '200px', // Ancho mínimo más grande
                              width: '200px', // Ancho fijo
                              maxWidth: '200px' // Ancho máximo fijo
                            }
                          }
                        }}
                      sx={{
                          backgroundColor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                          borderRadius: 2,
                          width: '100%',
                          height: 40, // Altura fija
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.3)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.5)'
                          },
                          '& .MuiSvgIcon-root': {
                          color: 'white'
                        }
                      }}
                    >
                        <MenuItem value="">Todos los estados</MenuItem>
                        <MenuItem value="Aprobado">Aprobado</MenuItem>
                        <MenuItem value="Desaprobado">Desaprobado</MenuItem>
                      </Select>
                    </FormControl>
              </Box>
            </Box>

                  {/* Contador de registros con posición fija */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    minWidth: 200, // Dimensión fija para evitar reorganización
                    justifyContent: 'flex-end',
                    flexShrink: 0
                  }}>
                    <FilterIcon sx={{ color: 'white', opacity: 0.7 }} />
                    <Typography variant="body2" sx={{ 
                      color: 'white', 
                      opacity: 0.9,
                      whiteSpace: 'nowrap' // Evitar salto de línea
                    }}>
                      {justificacionesFiltradas.length} de {justificaciones.length} registros
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Collapse>
          </Box>
          
          {/* Tabla */}
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
                <TableHead>
                <TableRow>
                    <TableCell sx={{ 
                    backgroundColor: '#f8fafc',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                    minWidth: 120
                  }}>
                      Fecha
                    </TableCell>
                    <TableCell sx={{ 
                    backgroundColor: '#f8fafc',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                    minWidth: 200
                  }}>
                    Tipo de Justificación
                    </TableCell>
                    <TableCell sx={{ 
                    backgroundColor: '#f8fafc',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                    minWidth: 250
                  }}>
                      Motivo
                    </TableCell>
                    <TableCell sx={{ 
                    backgroundColor: '#f8fafc',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                    textAlign: 'center',
                    minWidth: 130
                  }}>
                      Estado
                    </TableCell>
                    <TableCell sx={{ 
                    backgroundColor: '#f8fafc',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                    textAlign: 'center',
                    minWidth: 100
                  }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {loading ? (
                    <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        Cargando justificaciones...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : justificacionesPaginadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <AssignmentIcon sx={{ fontSize: 64, color: '#d1d5db' }} />
                        <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 600 }}>
                          No hay justificaciones registradas
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                          {filtroMes || filtroAnio || filtroEstado ? 
                            'Intente ajustar los filtros para ver más resultados' : 
                            'Use el formulario superior para registrar la primera justificación'
                          }
                        </Typography>
                      </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                  justificacionesPaginadas.map((justificacion, index) => (
                    <TableRow 
                      key={justificacion.JustificacionID || index}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f8fafc'
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 18, color: '#667eea' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatearFecha(justificacion.Fecha || justificacion.fecha)}
                          </Typography>
                        </Box>
                        </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TagIcon sx={{ fontSize: 18, color: '#10b981' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {justificacion.TipoJustificacion || justificacion.tipoDescripcion || justificacion.tipo}
                          </Typography>
                        </Box>
                        </TableCell>
                      
                      <TableCell>
                        <Tooltip title={justificacion.Motivo || justificacion.motivo} placement="top">
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: 250,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              cursor: 'help'
                            }}
                          >
                            {justificacion.Motivo || justificacion.motivo}
                          </Typography>
                        </Tooltip>
                        </TableCell>
                      
                      <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                          icon={getEstadoIcon(justificacion.Estado || justificacion.estado)}
                          label={justificacion.Estado || justificacion.estado}
                          color={getEstadoColor(justificacion.Estado || justificacion.estado)}
                          variant="filled"
                            sx={{
                              fontWeight: 600,
                            minWidth: 110,
                            '& .MuiChip-icon': {
                              fontSize: 16
                            }
                            }}
                          />
                        </TableCell>
                      
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Tooltip title="Eliminar justificación">
                          <IconButton
                            onClick={() => handleEliminar(justificacion.JustificacionID)}
                            sx={{
                              color: '#ef4444',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              '&:hover': {
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          
          {/* Paginación */}
          {totalPaginas > 1 && (
          <Box sx={{ 
            display: 'flex',
              justifyContent: 'center', 
              p: 3,
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e5e7eb'
            }}>
              <Pagination
                count={totalPaginas}
                page={paginaActual}
                onChange={handlePaginaChange}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 3,
                    fontWeight: 600,
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    }
                  }
                }}
              />
            </Box>
          )}
          </Paper>
      </Container>
    </Box>
  );
};

export default React.memo(Justificaciones);