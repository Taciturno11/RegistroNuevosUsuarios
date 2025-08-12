import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  ListAlt as ListAltIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Tag as TagIcon,
  Comment as CommentIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Error as ErrorIcon,
  Close as CloseIcon
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
  const [justificacionesFiltradas, setJustificacionesFiltradas] = useState([]);
  
  // Estados para filtros
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  
  // Estados para autocompletado del aprobador
  const [sugerenciasAprobador, setSugerenciasAprobador] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1);
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    aprobadas: 0,
    desaprobadas: 0
  });

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina] = useState(10);

  // Inicialización
  useEffect(() => {
    inicializarComponente();
  }, []);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const aprobadorField = document.querySelector('[data-field="aprobadorDNI"]');
      if (aprobadorField && !aprobadorField.contains(event.target)) {
        setMostrarSugerencias(false);
        setIndiceSeleccionado(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reaplicar filtros cuando cambie mes/año
  useEffect(() => {
    aplicarFiltrosYPaginacion(justificaciones);
  }, [filtroMes, filtroAnio, justificaciones]);

  const inicializarComponente = async () => {
    try {
      // Obtener empleado del localStorage (como en el proyecto original)
      const dni = localStorage.getItem('empleadoDNI');
      const nombre = localStorage.getItem('empleadoNombre');
      
      if (!dni) {
        setError('No se ha seleccionado un empleado. Regrese al dashboard.');
        return;
      }

      setEmpleadoSeleccionado({ dni, nombre });
      
      // Auto-completar aprobador con el usuario actual
      setFormData(prev => ({
        ...prev,
        aprobadorDNI: user?.dni || ''
      }));

      // Cargar tipos de justificación
      await cargarTiposJustificacion();
      
      // Cargar justificaciones existentes
      await cargarJustificacionesExistentes(dni);
      
      // Inicializar filtros
      inicializarFiltros();
      
    } catch (error) {
      console.error('Error inicializando componente:', error);
      setError('Error al inicializar el componente');
    }
  };

  const cargarTiposJustificacion = async () => {
    try {
      const response = await api.get('/justificaciones/tipos');
      if (response.data.success) {
        setTiposJustificacion(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando tipos de justificación:', error);
    }
  };

  const cargarJustificacionesExistentes = async (dni) => {
    try {
      // La API espera /justificaciones/empleado/:dni
      const response = await api.get(`/justificaciones/empleado/${dni}`);
      if (response.data.success) {
        const lista = response.data.data?.justificaciones || response.data.data || [];
        setJustificaciones(lista);
        aplicarFiltrosYPaginacion(lista);
        calcularEstadisticas(lista);
      }
    } catch (error) {
      console.error('Error cargando justificaciones:', error);
    }
  };

  const inicializarFiltros = () => {
    const anioActual = new Date().getFullYear();
    const anios = [];
    for (let i = anioActual; i >= anioActual - 5; i--) {
      anios.push(i);
    }
  };

  const aplicarFiltrosYPaginacion = (justificacionesData = justificaciones) => {
    let filtradas = [...justificacionesData];

    // Aplicar filtro de mes
    if (filtroMes) {
      filtradas = filtradas.filter(j => {
        const fecha = new Date(j.Fecha);
        return fecha.getMonth() + 1 === parseInt(filtroMes);
      });
    }

    // Aplicar filtro de año
    if (filtroAnio) {
      filtradas = filtradas.filter(j => {
        const fecha = new Date(j.Fecha);
        return fecha.getFullYear() === parseInt(filtroAnio);
      });
    }

    setJustificacionesFiltradas(filtradas);
    setPaginaActual(1); // Resetear a primera página
  };

  const calcularEstadisticas = (justificacionesData) => {
    const total = justificacionesData.length;
    const aprobadas = justificacionesData.filter(j => j.Estado === 'Aprobado').length;
    const desaprobadas = justificacionesData.filter(j => j.Estado === 'Desaprobado').length;
    
    setEstadisticas({ total, aprobadas, desaprobadas });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Si es el campo aprobador, buscar sugerencias
    if (field === 'aprobadorDNI' && value.length >= 2) {
      buscarSugerenciasAprobador(value);
    } else {
      setMostrarSugerencias(false);
    }
  };

  // Manejar navegación con teclado en sugerencias
  const handleKeyDown = (e) => {
    if (!mostrarSugerencias || sugerenciasAprobador.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIndiceSeleccionado(prev => 
          prev < sugerenciasAprobador.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndiceSeleccionado(prev => 
          prev > 0 ? prev - 1 : sugerenciasAprobador.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (indiceSeleccionado >= 0) {
          seleccionarSugerencia(sugerenciasAprobador[indiceSeleccionado]);
        }
        break;
      case 'Escape':
        setMostrarSugerencias(false);
        setIndiceSeleccionado(-1);
        break;
    }
  };

  const buscarSugerenciasAprobador = async (search) => {
    try {
      const response = await api.get(`/empleados/buscar?q=${search}`);
      if (response.data.success) {
        setSugerenciasAprobador(response.data.data.slice(0, 5));
        setMostrarSugerencias(true);
        setIndiceSeleccionado(-1);
      }
    } catch (error) {
      console.error('Error buscando sugerencias:', error);
    }
  };

  const seleccionarSugerencia = (empleado) => {
    setFormData(prev => ({
      ...prev,
      aprobadorDNI: empleado.DNI
    }));
    setMostrarSugerencias(false);
    setIndiceSeleccionado(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!empleadoSeleccionado) {
      setError('No hay empleado seleccionado');
      return;
    }

    // Validaciones
    if (!formData.fecha || !formData.tipo || !formData.motivo || !formData.estado || !formData.aprobadorDNI) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // El backend espera estas claves en minúscula: empleadoDNI, fecha, tipoJustificacion, motivo, estado
      const justificacionData = {
        empleadoDNI: empleadoSeleccionado.dni,
        fecha: formData.fecha,
        tipoJustificacion: formData.tipo,
        motivo: formData.motivo,
        estado: formData.estado
        // AprobadorDNI se asigna al aprobar; no se registra en la creación
      };

      const response = await api.post('/justificaciones', justificacionData);
      
      if (response.data.success) {
        setSuccess('Justificación registrada exitosamente');
        
        // Limpiar formulario
        setFormData({
          fecha: new Date().toISOString().split('T')[0],
          tipo: '',
          motivo: '',
          estado: '',
          aprobadorDNI: user?.dni || ''
        });
        
        // Recargar justificaciones
        await cargarJustificacionesExistentes(empleadoSeleccionado.dni);
        
        // Ocultar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error registrando justificación:', error);
      setError(error.response?.data?.message || 'Error al registrar justificación');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta justificación?')) {
      return;
    }

    try {
      const response = await api.delete(`/justificaciones/${id}`);
      if (response.data.success) {
        setSuccess('Justificación eliminada exitosamente');
        await cargarJustificacionesExistentes(empleadoSeleccionado.dni);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error eliminando justificación:', error);
      setError('Error al eliminar justificación');
    }
  };

  const limpiarFiltros = () => {
    setFiltroMes('');
    setFiltroAnio('');
    aplicarFiltrosYPaginacion();
    setMostrarSugerencias(false);
    setIndiceSeleccionado(-1);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return 'Fecha inválida';
      
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Error en fecha';
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Aprobado':
        return 'success';
      case 'Desaprobado':
        return 'error';
      default:
        return 'default';
    }
  };

  // Cálculos para paginación
  const totalPaginas = Math.ceil(justificacionesFiltradas.length / elementosPorPagina);
  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const justificacionesPaginadas = justificacionesFiltradas.slice(inicio, fin);

  if (!empleadoSeleccionado) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        bgcolor: '#ecf0f1',
        minHeight: '100vh'
      }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No se ha seleccionado un empleado para gestionar justificaciones
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/admin')}
          startIcon={<ArrowBackIcon />}
        >
          Volver al Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      backgroundColor: '#f7fafc',
      minHeight: '100vh',
      py: 4
    }}>
      {/* Contenedor principal */}
      <Box sx={{ 
        maxWidth: 1400, 
        mx: 'auto',
        px: 4
      }}>
        {/* Header minimalista */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4 
        }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/admin')}
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
            textAlign: 'center'
          }}>
            Gestión de Justificaciones
          </Typography>
          <Box sx={{ width: 120 }} /> {/* Espaciador */}
        </Box>

        {/* Información del empleado - estética unificada */}
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
            p: '0.75rem 1rem',
            borderRadius: '16px 16px 0 0'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, m: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: '1.25rem' }} />
                {empleadoSeleccionado.nombre}
              </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, mt: 0.25 }}>
                DNI: {empleadoSeleccionado.dni}
              </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box sx={{ 
                  display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  px: 1, py: 0.5, borderRadius: '10px', color: 'white' }}>
                  <ListAltIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                  <Typography variant="caption" sx={{ opacity: 0.9, mr: 0.5 }}>Total</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{estadisticas.total}</Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #48bb78, #38a169)',
                  px: 1, py: 0.5, borderRadius: '10px', color: 'white' }}>
                  <CheckCircleOutlineIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                  <Typography variant="caption" sx={{ opacity: 0.9, mr: 0.5 }}>Aprobadas</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{estadisticas.aprobadas}</Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                  px: 1, py: 0.5, borderRadius: '10px', color: 'white' }}>
                  <CancelIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                  <Typography variant="caption" sx={{ opacity: 0.9, mr: 0.5 }}>Desaprobadas</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{estadisticas.desaprobadas}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          
        </Paper>

        {/* Formulario de registro - LAYOUT EXACTO como en el HTML original */}
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
            <Typography variant="h5" sx={{ fontWeight: 600, m: 0 }}>
              Nueva Justificación
            </Typography>
          </Box>

          <Box sx={{ p: '1.25rem' }}>
            <form onSubmit={handleSubmit}>
            {/* Primera fila: Fecha y Tipo - Layout simétrico */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={5}>
                <TextField
                  label="Fecha de Justificación"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                      padding: '1rem',
                      fontSize: '1rem',
                      height: '56px',
                      transition: 'all 0.3s ease',
                      '&:focus': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
                        transform: 'translateY(-1px)'
                      },
                      '&:hover': {
                        borderColor: '#3b82f6'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#64748b',
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={7}>
                <FormControl fullWidth required>
                  <InputLabel shrink sx={{ whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'unset' }}>Tipo de Justificación</InputLabel>
                  <Select
                    value={formData.tipo}
                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                    label="Tipo de Justificación"
                    displayEmpty
                    renderValue={(selected) => selected || (<Box component="span" sx={{ color: '#94a3b8' }}>Seleccione una opción</Box>)}
                    MenuProps={{ disableScrollLock: true }}
                    sx={{
                      borderRadius: '12px',
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        minHeight: 56,
                        '& fieldset': { borderWidth: 2, borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#3b82f6' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6', boxShadow: '0 0 0 4px rgba(59,130,246,0.1)' }
                      },
                      '& .MuiSelect-select, & .MuiOutlinedInput-input': {
                        paddingTop: '14px',
                        paddingBottom: '14px'
                      }
                    }}
                  >
                    <MenuItem value="">Seleccione una opción</MenuItem>
                    {tiposJustificacion.map((tipo, index) => (
                      <MenuItem key={index} value={tipo.TipoJustificacion}>
                        {tipo.TipoJustificacion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {/* Segunda fila: Motivo - Ancho completo centrado */}
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Motivo"
                multiline
                rows={2}
                value={formData.motivo}
                onChange={(e) => handleInputChange('motivo', e.target.value)}
                required
                inputProps={{ maxLength: 200 }}
                placeholder="Escriba el motivo de la justificación..."
                helperText={`${formData.motivo.length}/200 caracteres`}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    padding: '1rem',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    '&:focus': {
                      borderColor: '#3b82f6',
                      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
                      transform: 'translateY(-1px)'
                    },
                    '&:hover': {
                      borderColor: '#3b82f6'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#64748b',
                    fontWeight: 500,
                    fontSize: '0.95rem'
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#64748b',
                    fontSize: '0.875rem',
                    marginLeft: '0.5rem',
                    marginTop: '0.5rem'
                  }
                }}
              />
            </Box>
            
            {/* Tercera fila: Estado, Aprobador y Botón - Layout equilibrado */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth required sx={{ minWidth: { xs: '100%', md: 240 } }}>
                  <InputLabel shrink sx={{ whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'unset' }}>Estado</InputLabel>
                  <Select
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    label="Estado"
                    displayEmpty
                    renderValue={(selected) => selected || (<Box component="span" sx={{ color: '#94a3b8' }}>Seleccione una opción</Box>)}
                    MenuProps={{ disableScrollLock: true }}
                    sx={{
                      borderRadius: '12px',
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        minHeight: 56,
                        '& fieldset': { borderWidth: 2, borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#3b82f6' },
                        '&.Mui-focused fieldset': { borderColor: '#3b82f6', boxShadow: '0 0 0 4px rgba(59,130,246,0.1)' }
                      },
                      '& .MuiSelect-select, & .MuiOutlinedInput-input': {
                        paddingTop: '14px',
                        paddingBottom: '14px'
                      }
                    }}
                  >
                    <MenuItem value="">Seleccione estado</MenuItem>
                    <MenuItem value="Aprobado">Aprobado</MenuItem>
                    <MenuItem value="Desaprobado">Desaprobado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ position: 'relative' }} data-field="aprobadorDNI">
                  <TextField
                    label="Aprobador DNI"
                    value={formData.aprobadorDNI}
                    onChange={(e) => handleInputChange('aprobadorDNI', e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                    placeholder="Ingrese DNI o nombre del aprobador"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        border: '2px solid #e2e8f0',
                        padding: '1rem',
                        fontSize: '1rem',
                        height: '56px',
                        transition: 'all 0.3s ease',
                        '&:focus': {
                          borderColor: '#3b82f6',
                          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
                          transform: 'translateY(-1px)'
                        },
                        '&:hover': {
                          borderColor: '#3b82f6'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: '#64748b',
                        fontWeight: 500,
                        fontSize: '0.95rem'
                      }
                    }}
                  />
                  
                  {/* Dropdown de sugerencias mejorado */}
                  {mostrarSugerencias && sugerenciasAprobador.length > 0 && (
                    <Box sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 20px 40px rgba(59, 130, 246, 0.15)',
                      mt: 1
                    }}>
                      {sugerenciasAprobador.map((empleado, index) => (
                        <Box
                          key={empleado.DNI}
                          onClick={() => seleccionarSugerencia(empleado)}
                          sx={{
                            padding: '1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'all 0.2s ease',
                            backgroundColor: index === indiceSeleccionado ? '#3b82f6' : 'transparent',
                            color: index === indiceSeleccionado ? 'white' : '#1e293b',
                            '&:hover': {
                              backgroundColor: index === indiceSeleccionado ? '#3b82f6' : '#f8fafc',
                              transform: 'translateX(4px)'
                            },
                            '&:last-child': {
                              borderBottom: 'none'
                            }
                          }}
                        >
                          <Box sx={{ fontWeight: 600, color: index === indiceSeleccionado ? 'white' : '#3b82f6', fontSize: '1rem' }}>
                            {empleado.DNI}
                          </Box>
                                                     <Box sx={{ fontSize: '0.9rem', color: index === indiceSeleccionado ? 'rgba(255,255,255,0.9)' : '#64748b' }}>
                            {empleado.Nombres} {empleado.ApellidoPaterno}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                  size="large"
                  fullWidth
                  sx={{
                    height: 52,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 35px rgba(16, 185, 129, 0.4)'
                    },
                    '&:disabled': {
                      background: '#cbd5e0',
                      transform: 'none',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {loading ? 'Registrando...' : 'Registrar'}
                </Button>
              </Grid>
            </Grid>
          </form>
          </Box>
        </Paper>

        {/* Tabla de Justificaciones Existentes - contenedor con esquinas intactas */}
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
            p: '0.5rem 0.75rem',
            borderRadius: '16px 16px 0 0'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                fontSize: '1rem',
                mb: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <ListAltIcon />
                Justificaciones Registradas
              </Typography>
              
              {/* Filtros integrados - EXACTOS al HTML original */}
              <Box sx={{ 
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 500, mb: 0 }}>
                      Mes
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mt: 0.25 }}>
                      <Select
                        value={filtroMes}
                        onChange={(e) => setFiltroMes(e.target.value)}
                        sx={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: '#2c3e50',
                          fontSize: '0.75rem',
                          '& .MuiOutlinedInput-root': { padding: '0.25rem 0.5rem' },
                          '&:focus': {
                            background: 'white',
                            borderColor: '#3498db',
                            boxShadow: '0 0 0 0.2rem rgba(52, 152, 219, 0.25)'
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
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 500, mb: 0 }}>
                      Año
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mt: 0.25 }}>
                      <Select
                        value={filtroAnio}
                        onChange={(e) => setFiltroAnio(e.target.value)}
                        sx={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: '#2c3e50',
                          fontSize: '0.75rem',
                          '& .MuiOutlinedInput-root': { padding: '0.25rem 0.5rem' },
                          '&:focus': {
                            background: 'white',
                            borderColor: '#3498db',
                            boxShadow: '0 0 0 0.2rem rgba(52, 152, 219, 0.25)'
                          }
                        }}
                      >
                        <MenuItem value="">Todos los años</MenuItem>
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(anio => (
                          <MenuItem key={anio} value={anio}>{anio}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={limpiarFiltros}
                      startIcon={<ClearIcon />}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        color: 'white',
                        background: 'transparent',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.2)',
                          borderColor: 'rgba(255, 255, 255, 0.8)',
                          color: 'white'
                        }
                      }}
                    >
                      Limpiar
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ p: 0 }}>
            <TableContainer>
              <Table sx={{ marginBottom: 0 }} size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#2c3e50' }}>
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 600, 
                      padding: '1rem', 
                      border: 'none',
                      fontSize: '0.875rem'
                    }}>
                      <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.1rem' }} />
                      Fecha
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 600, 
                      padding: '1rem', 
                      border: 'none',
                      fontSize: '0.875rem'
                    }}>
                      <TagIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.1rem' }} />
                      Tipo
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 600, 
                      padding: '1rem', 
                      border: 'none',
                      fontSize: '0.875rem'
                    }}>
                      <CommentIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.1rem' }} />
                      Motivo
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 600, 
                      padding: '1rem', 
                      border: 'none',
                      fontSize: '0.875rem'
                    }}>
                      <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.1rem' }} />
                      Estado
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 600, 
                      padding: '1rem', 
                      border: 'none',
                      fontSize: '0.875rem'
                    }}>
                      <PersonIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.1rem' }} />
                      Aprobador
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 600, 
                      padding: '1rem', 
                      border: 'none',
                      fontSize: '0.875rem'
                    }}>
                      <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.1rem' }} />
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {justificacionesPaginadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <InfoIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                          No hay justificaciones registradas
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    justificacionesPaginadas.map((justificacion) => (
                      <TableRow key={justificacion.JustificacionID || justificacion.ID} hover sx={{ '&:hover': { bgcolor: '#ecf0f1' } }}>
                        <TableCell sx={{ 
                          padding: '1rem', 
                          borderBottom: '1px solid #e9ecef', 
                          verticalAlign: 'middle',
                          fontSize: '0.875rem',
                          fontFamily: 'monospace'
                        }}>
                          {formatearFecha(justificacion.Fecha)}
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '1rem', 
                          borderBottom: '1px solid #e9ecef', 
                          verticalAlign: 'middle',
                          fontSize: '0.875rem'
                        }}>
                          {justificacion.TipoJustificacion}
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '1rem', 
                          borderBottom: '1px solid #e9ecef', 
                          verticalAlign: 'middle',
                          fontSize: '0.875rem',
                          maxWidth: 250
                        }}>
                          {justificacion.Motivo}
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '1rem', 
                          borderBottom: '1px solid #e9ecef', 
                          verticalAlign: 'middle'
                        }}>
                          <Chip
                            label={justificacion.Estado}
                            color={getStatusColor(justificacion.Estado)}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '1rem', 
                          borderBottom: '1px solid #e9ecef', 
                          verticalAlign: 'middle',
                          fontSize: '0.875rem',
                          fontFamily: 'monospace'
                        }}>
                          {justificacion.AprobadorDNI}
                        </TableCell>
                        <TableCell sx={{ 
                          padding: '1rem', 
                          borderBottom: '1px solid #e9ecef', 
                          verticalAlign: 'middle'
                        }}>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(justificacion.JustificacionID || justificacion.ID)}
                            title="Eliminar"
                            sx={{
                              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                              color: 'white',
                              borderRadius: '8px',
                              padding: '0.5rem 1rem',
                              fontWeight: 600,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #c0392b, #a93226)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          {/* Paginación */}
          <Box sx={{ 
            background: 'white',
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '0 0 16px 16px'
          }}>
            <Typography variant="body2" sx={{ 
              color: '#2c3e50',
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              Mostrando {inicio + 1}-{Math.min(fin, justificacionesFiltradas.length)} de {justificacionesFiltradas.length} justificaciones
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
                startIcon={<ChevronLeftIcon />}
                sx={{
                  borderRadius: '0.375rem',
                  fontWeight: 500,
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                Anterior
              </Button>
              
              <Typography variant="body2" sx={{ mx: 2, fontWeight: 600, color: '#2c3e50', fontSize: '0.85rem' }}>
                {paginaActual} de {totalPaginas}
              </Typography>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPaginaActual(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                endIcon={<ChevronRightIcon />}
                sx={{
                  borderRadius: '0.375rem',
                  fontWeight: 500,
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                Siguiente
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Mensajes de alerta - Diseño moderno */}
        {error && (
          <Paper sx={{ 
            mt: 3, 
            p: 2, 
            background: 'linear-gradient(135deg, #f56565, #e53e3e)',
            color: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 25px rgba(245, 101, 101, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon sx={{ fontSize: '1.5rem' }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {error}
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setError('')} 
              sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
            >
              <CloseIcon />
            </IconButton>
          </Paper>
        )}
        
        {success && (
          <Paper sx={{ 
            mt: 3, 
            p: 2, 
            background: 'linear-gradient(135deg, #48bb78, #38a169)',
            color: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 25px rgba(72, 187, 120, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ fontSize: '1.5rem' }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {success}
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setSuccess('')} 
              sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
            >
              <CloseIcon />
            </IconButton>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default Justificaciones;
