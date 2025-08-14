import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  PersonOff as PersonOffIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  Group as UsersIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as UserTimesIcon,
  Info as InfoIcon,
  PersonAdd as PersonAddIcon,
  AccessTime as ClockIcon,
  BarChart as ChartBarIcon,
  CreditCard as IdCardIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Circle as CircleIcon,
  Laptop as LaptopIcon,
  Event as CalendarMonthIcon
} from '@mui/icons-material';
import '../App.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('🏗️ Dashboard component montándose. Ruta actual:', location.pathname);
  const { api } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [stats, setStats] = useState({
    empleadosActivos: '-',
    empleadosCesados: '-',
    totalEmpleados: '-'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDates, setReportDates] = useState({
    fechaInicio: '',
    fechaFin: ''
  });

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    console.log('🔍 Dashboard useEffect ejecutándose. Ruta actual:', location.pathname);
    
    // Solo ejecutar si estamos realmente en la ruta del Dashboard
    if (location.pathname !== '/') {
      console.log('🚫 Dashboard montado pero no en ruta /, saltando inicialización');
      return;
    }
    
    console.log('✅ Dashboard montado en ruta correcta, inicializando...');
    loadStats();
    
    // Restaurar empleado seleccionado desde localStorage si existe
    const dniGuardado = localStorage.getItem('empleadoDNI');
    const nombreGuardado = localStorage.getItem('empleadoNombre');
    
    console.log('🔍 Dashboard montado, verificando localStorage:', { dniGuardado, nombreGuardado });
    
    if (dniGuardado && nombreGuardado) {
      console.log('✅ Empleado encontrado en localStorage, restaurando...');
      // Restaurar el DNI en la barra de búsqueda
      setSearchTerm(dniGuardado);
      
      // Limpiar sugerencias inmediatamente para evitar que aparezcan
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      
      // Buscar y cargar el empleado guardado
      buscarEmpleado(dniGuardado);
    } else {
      console.log('❌ No hay empleado guardado en localStorage');
    }
  }, [location.pathname]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target)) {
        ocultarSugerencias();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Buscar sugerencias cuando cambie el término de búsqueda
  useEffect(() => {
    // No buscar sugerencias si ya hay un empleado seleccionado
    if (selectedEmployee && searchTerm === selectedEmployee.DNI) {
      setSuggestions([]);
      return;
    }
    
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchSuggestions();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      if (!searchTerm) {
        setSelectedEmployee(null);
        setShowActions(false);
      }
    }
  }, [searchTerm, selectedEmployee]);

  const loadStats = async () => {
    try {
      const response = await api.get('/empleados/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const searchSuggestions = async () => {
    // No buscar sugerencias si ya hay un empleado seleccionado
    if (selectedEmployee && searchTerm === selectedEmployee.DNI) {
      setSuggestions([]);
      return;
    }
    
    try {
      const response = await api.get(`/empleados/buscar?search=${encodeURIComponent(searchTerm)}`);
      if (response.data.success) {
        setSuggestions(response.data.empleados || []);
      }
    } catch (error) {
      console.error('Error buscando sugerencias:', error);
    }
  };

  const selectEmployee = (employee) => {
    setSearchTerm(employee.DNI || employee.dni);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    // Guardar en localStorage como en el proyecto original
    localStorage.setItem('empleadoDNI', employee.DNI || employee.dni);
    localStorage.setItem('empleadoNombre', `${employee.Nombres || employee.nombre} ${employee.ApellidoPaterno || employee.apellido}`);
    
    // Llamar a buscarEmpleado como en el proyecto original
    buscarEmpleado(employee.DNI || employee.dni);
  };

  const clearSelectedEmployee = () => {
    setSelectedEmployee(null);
    setShowActions(false);
    setSearchTerm('');
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    // Limpiar localStorage como en el proyecto original
    localStorage.removeItem('empleadoDNI');
    localStorage.removeItem('empleadoNombre');
  };

  // Funciones de navegación por teclado como en el proyecto original
  const navegarSugerencias = (direccion) => {
    const nuevoIndice = selectedSuggestionIndex + direccion;
    
    if (nuevoIndice >= -1 && nuevoIndice < suggestions.length) {
      setSelectedSuggestionIndex(nuevoIndice);
    }
  };

  const ocultarSugerencias = () => {
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          navegarSugerencias(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          navegarSugerencias(-1);
          break;
        case "Enter":
          e.preventDefault();
          if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
            selectEmployee(suggestions[selectedSuggestionIndex]);
          } else {
            buscarEmpleado(searchTerm.trim());
          }
          break;
        case "Escape":
          ocultarSugerencias();
          break;
        default:
          break;
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      buscarEmpleado(searchTerm.trim());
    }
  };

  // Función para formatear fechas correctamente
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
      
      // Formatear como DD/MM/YYYY
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  };

  // Función separada para buscar empleado (como en el proyecto original)
  const buscarEmpleado = async (dni) => {
    const dniToSearch = dni || searchTerm.trim();
    
    console.log('🔍 buscarEmpleado llamado con:', { dni, dniToSearch, searchTerm });
    
    if (!dniToSearch) {
      console.log('❌ No hay DNI para buscar');
      alert('Por favor ingrese un DNI');
      return;
    }

    try {
      const response = await api.get(`/empleados/${dniToSearch}`);
      if (response.data.success) {
        // El backend devuelve: { success: true, data: { empleado } }
        const empleado = response.data.data;
        
        // Obtener información adicional de catálogos
        let infoAdicional = {};
        try {
          const resCatalogos = await api.get('/catalogos');
          if (resCatalogos.data.success) {
            const catalogos = resCatalogos.data.catalogos;
            
            // Buscar información específica en la estructura correcta
            const cargo = catalogos.cargos?.find(c => c.id === empleado.CargoID);
            const campania = catalogos.campanias?.find(c => c.id === empleado.CampañaID);
            const jornada = catalogos.jornadas?.find(c => c.id === empleado.JornadaID);
            const modalidad = catalogos.modalidades?.find(c => c.id === empleado.ModalidadID);
            
            infoAdicional = {
              cargo: cargo ? cargo.nombre : null,
              campania: campania ? campania.nombre : null,
              jornada: jornada ? jornada.nombre : null,
              modalidad: modalidad ? modalidad.nombre : null
            };
          }
        } catch (error) {
          console.error('Error obteniendo catálogos:', error);
        }

        // Crear objeto con información completa
        const empleadoCompleto = {
          ...empleado,
          cargo: infoAdicional.cargo || `ID: ${empleado.CargoID}` || 'No especificado',
          campania: infoAdicional.campania || `ID: ${empleado.CampañaID}` || 'No especificado',
          jornada: infoAdicional.jornada || `ID: ${empleado.JornadaID}` || 'No especificado',
          modalidad: infoAdicional.modalidad || `ID: ${empleado.ModalidadID}` || 'No especificado'
        };

        console.log('✅ Empleado encontrado y configurado:', empleadoCompleto);
        setSelectedEmployee(empleadoCompleto);
        setShowActions(true);
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
        
        // Guardar en localStorage como en el proyecto original
        localStorage.setItem('empleadoDNI', empleadoCompleto.DNI);
        localStorage.setItem('empleadoNombre', `${empleadoCompleto.Nombres} ${empleadoCompleto.ApellidoPaterno}`);
        console.log('💾 Empleado guardado en localStorage');
      } else {
        alert(response.data.message || 'Empleado no encontrado');
        setSelectedEmployee(null);
        setShowActions(false);
        
        // Limpiar localStorage si no se encuentra el empleado
        localStorage.removeItem('empleadoDNI');
        localStorage.removeItem('empleadoNombre');
      }
    } catch (error) {
      console.error('Error buscando empleado:', error);
      alert('Error al buscar empleado');
      setSelectedEmployee(null);
      setShowActions(false);
      
      // Limpiar localStorage si hay error
      localStorage.removeItem('empleadoDNI');
      localStorage.removeItem('empleadoNombre');
    }
  };

  const executeAction = (action) => {
    // Special case for reporte-asistencia which doesn't need employee
    if (action === 'reporte-asistencia') {
      setShowReportModal(true);
      return;
    }

    // Check if employee is selected for other actions
    if (!selectedEmployee) {
      // Show error message to user
      alert('Por favor seleccione un empleado primero');
      return;
    }

    // Guardar en localStorage como en el proyecto original
    localStorage.setItem('empleadoDNI', selectedEmployee.DNI);
    localStorage.setItem('empleadoNombre', `${selectedEmployee.Nombres} ${selectedEmployee.ApellidoPaterno}`);

    switch (action) {
      case 'actualizar':
        navigate('/actualizar-empleado');
        break;
      case 'cese':
        navigate('/cese');
        break;
      case 'justificaciones':
        navigate('/justificaciones');
        break;
      case 'ojt':
        navigate('/ojt');
        break;
      case 'excepciones':
        navigate('/excepciones');
        break;
      default:
        break;
    }
  };

  const generateReport = async () => {
    if (!reportDates.fechaInicio || !reportDates.fechaFin) {
      setError('Por favor seleccione ambas fechas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/reportes/asistencia', reportDates);
      if (response.data.success) {
        setError('');
        setShowReportModal(false);
        // Aquí podrías mostrar un mensaje de éxito o descargar el reporte
        alert('Reporte generado exitosamente');
      } else {
        setError(response.data.message || 'Error generando reporte');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const actionCards = [
    {
      title: 'Actualizar Datos',
      description: 'Modificar información personal y laboral del empleado',
      icon: <EditIcon />,
      color: '#1e40af',
      action: 'actualizar'
    },
    {
      title: 'Registrar Cese',
      description: 'Registrar terminación laboral del empleado',
      icon: <PersonOffIcon />,
      color: '#dc2626',
      action: 'cese'
    },
    {
      title: 'Justificaciones',
      description: 'Gestionar justificaciones de ausencia',
      icon: <CheckCircleIcon />,
      color: '#059669',
      action: 'justificaciones'
    },
    {
      title: 'OJT / CIC',
      description: 'Gestión de usuarios CIC y OJT',
      icon: <StarIcon />,
      color: '#0891b2',
      action: 'ojt'
    },
    {
      title: 'Asignación Excepciones',
      description: 'Gestionar horarios especiales por día',
      icon: <ClockIcon />,
      color: '#d97706',
      action: 'excepciones'
    },
    {
      title: 'Generar Reporte Asistencia',
      description: 'Generar reporte maestro de asistencia por fechas',
      icon: <ChartBarIcon />,
      color: '#7c3aed',
      action: 'reporte-asistencia'
    }
  ];

  return (
    <Box>
      {/* Header con información del usuario */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          sx={{
            background: '#1e293b',
            color: 'white',
            '& .MuiCardHeader-content': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }
          }}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <UsersIcon sx={{ mr: 2, fontSize: '2rem' }} />
              <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
                Sistema de Gestión de Empleados
              </Typography>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={`Activos: ${stats.empleadosActivos}`}
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              />
              <Chip
                icon={<UserTimesIcon />}
                label={`Cese: ${stats.empleadosCesados}`}
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              />
              <Chip
                icon={<UsersIcon />}
                label={`Total: ${stats.totalEmpleados}`}
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              />
            </Box>
          }
        />
      </Card>

      {/* Sección de búsqueda */}
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SearchIcon sx={{ mr: 2 }} />
          Buscar Empleado
        </Typography>
        
        <Box sx={{ maxWidth: 600, mx: 'auto', position: 'relative' }} className="search-container">
          <Box sx={{ display: 'flex' }}>
            <TextField
              fullWidth
              placeholder="Ingrese DNI o nombre del empleado"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value === '') {
                  clearSelectedEmployee();
                }
              }}
              onKeyDown={handleKeyDown}
              sx={{ mr: 1 }}
              InputProps={{
                endAdornment: selectedEmployee && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={clearSelectedEmployee}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => buscarEmpleado(searchTerm.trim())}
              sx={{ px: 3 }}
            >
              Buscar
            </Button>
          </Box>

          {/* Dropdown de sugerencias */}
          {suggestions.length > 0 && (
            <Paper
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                maxHeight: 200,
                overflow: 'auto',
                mt: 1
              }}
            >
              {suggestions.map((emp, index) => (
                <Box
                  key={emp.DNI || emp.dni}
                  onClick={() => selectEmployee(emp)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: index === selectedSuggestionIndex ? '#1e40af' : 'transparent',
                    color: index === selectedSuggestionIndex ? 'white' : 'inherit',
                    '&:hover': { 
                      backgroundColor: index === selectedSuggestionIndex ? '#1e40af' : '#f8fafc' 
                    },
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 600, 
                    color: index === selectedSuggestionIndex ? 'white' : '#1e40af' 
                  }}>
                    {emp.DNI || emp.dni}
                  </Typography>
                  <Typography variant="body2" color={index === selectedSuggestionIndex ? 'white' : 'text.secondary'}>
                    {emp.Nombres || emp.nombre} {emp.ApellidoPaterno || emp.apellido}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      </Paper>

      {/* Información del empleado */}
      {selectedEmployee && (
        <Paper sx={{ p: 3, mb: 4, backgroundColor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#1e40af', fontWeight: 600 }}>
                {selectedEmployee.Nombres} {selectedEmployee.ApellidoPaterno} {selectedEmployee.ApellidoMaterno || ''}
              </Typography>
              
              {/* Información detallada en grid como en el proyecto original */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <IdCardIcon sx={{ color: '#1e40af', mr: 1, fontSize: 16 }} />
                      <strong>DNI:</strong> {selectedEmployee.DNI}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CalendarIcon sx={{ color: '#059669', mr: 1, fontSize: 16 }} />
                      <strong>Fecha Contratación:</strong> {formatearFecha(selectedEmployee.FechaContratacion)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <WorkIcon sx={{ color: '#0891b2', mr: 1, fontSize: 16 }} />
                      <strong>Cargo:</strong> {selectedEmployee.cargo}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <BusinessIcon sx={{ color: '#d97706', mr: 1, fontSize: 16 }} />
                      <strong>Campaña:</strong> {selectedEmployee.campania}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CircleIcon sx={{ 
                        color: selectedEmployee.EstadoEmpleado === 'Activo' ? '#059669' : '#dc2626', 
                        mr: 1, 
                        fontSize: 16 
                      }} />
                      <strong>Estado:</strong> {selectedEmployee.EstadoEmpleado || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <ClockIcon sx={{ color: '#475569', mr: 1, fontSize: 16 }} />
                      <strong>Jornada:</strong> {selectedEmployee.jornada}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <LaptopIcon sx={{ color: '#0891b2', mr: 1, fontSize: 16 }} />
                      <strong>Modalidad:</strong> {selectedEmployee.modalidad}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CalendarMonthIcon sx={{ color: '#dc2626', mr: 1, fontSize: 16 }} />
                      <strong>Fecha Cese:</strong> {formatearFecha(selectedEmployee.FechaCese)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearSelectedEmployee}
              sx={{ ml: 2 }}
            >
              Cambiar Empleado
            </Button>
          </Box>
        </Paper>
      )}

      {/* Opciones de acción */}
      {showActions && (
        <Card sx={{ mb: 4 }}>
          <CardHeader
            title={
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 2 }} />
                Acciones Disponibles
              </Typography>
            }
          />
          {!selectedEmployee && (
            <Box sx={{ px: 3, pb: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Nota:</strong> Para usar las acciones de empleado, primero debe seleccionar un empleado en la búsqueda de arriba.
                </Typography>
              </Alert>
            </Box>
          )}
          <CardContent>
            <Grid container spacing={3}>
              {actionCards.map((card, index) => {
                const isDisabled = card.action !== 'reporte-asistencia' && !selectedEmployee;
                return (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      onClick={() => !isDisabled && executeAction(card.action)}
                      sx={{
                        p: 3,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isDisabled ? 0.6 : 1,
                        '&:hover': {
                          transform: isDisabled ? 'none' : 'translateY(-2px)',
                          boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.12)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          backgroundColor: isDisabled ? '#9ca3af' : card.color,
                          color: 'white'
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: isDisabled ? 'text.disabled' : 'text.primary' }}>
                        {card.title}
                      </Typography>
                      <Typography variant="body2" color={isDisabled ? 'text.disabled' : 'text.secondary'}>
                        {card.description}
                      </Typography>
                      {isDisabled && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          Seleccione un empleado primero
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Sección para registrar nuevo empleado */}
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PersonAddIcon sx={{ mr: 2 }} />
          ¿Necesitas registrar un nuevo empleado?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.75 }}>
          Accede al formulario de registro para agregar nuevos empleados al sistema
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/registrar-empleado')}
          sx={{
            backgroundColor: '#059669',
            '&:hover': { backgroundColor: '#047857' }
          }}
        >
          Registrar Nuevo Empleado
        </Button>
      </Paper>

      {/* Modal para Generar Reporte Asistencia */}
      <Dialog open={showReportModal} onClose={() => setShowReportModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 2 }} />
            Generar Reporte de Asistencia
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Fecha de Inicio</InputLabel>
              <TextField
                type="date"
                value={reportDates.fechaInicio}
                onChange={(e) => setReportDates({ ...reportDates, fechaInicio: e.target.value })}
                fullWidth
              />
            </FormControl>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Fecha de Fin</InputLabel>
              <TextField
                type="date"
                value={reportDates.fechaFin}
                onChange={(e) => setReportDates({ ...reportDates, fechaFin: e.target.value })}
                fullWidth
              />
            </FormControl>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Alert severity="info" icon={<InfoIcon />}>
              <strong>Nota:</strong> El reporte incluirá todas las campañas por defecto.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportModal(false)}>
            Cancelar
          </Button>
          <Button
            onClick={generateReport}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
