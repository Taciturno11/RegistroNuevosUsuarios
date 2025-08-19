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
  console.log('🏗️ Dashboard - Estado inicial:', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash
  });
  
  const { api } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [stats, setStats] = useState({
    empleadosActivos: '-',
    empleadosCesados: '-',
    totalEmpleados: '-',
    cesesMesActual: '-'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDates, setReportDates] = useState({
    fechaInicio: '',
    fechaFin: ''
  });

  // Función para obtener fechas por defecto
  const getFechasPorDefecto = () => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    return {
      fechaInicio: primerDiaMes.toISOString().split('T')[0], // YYYY-MM-01
      fechaFin: hoy.toISOString().split('T')[0] // YYYY-MM-DD (hoy)
    };
  };

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    console.log('🔍 Dashboard useEffect ejecutándose. Ruta actual:', location.pathname);
    console.log('🔍 Dashboard useEffect - Estado completo:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      fullPath: window.location.href
    });
    
    // Solo ejecutar si estamos realmente en la ruta del Dashboard
    if (location.pathname !== '/dashboard') {
      console.log('🚫 Dashboard montado pero no en ruta /dashboard, saltando inicialización');
      console.log('🚫 Ruta esperada: /dashboard, Ruta actual:', location.pathname);
      return;
    }
    
    console.log('✅ Dashboard montado en ruta correcta, inicializando...');
    loadStats();
    
    // Restaurar empleado seleccionado desde localStorage si existe
    const dniGuardado = localStorage.getItem('empleadoDNI');
    const nombreGuardado = localStorage.getItem('empleadoNombre');
    
    if (dniGuardado && nombreGuardado) {
      console.log('🔄 Restaurando empleado desde localStorage:', { dniGuardado, nombreGuardado });
      
      // Cargar información completa del empleado desde la API
      const cargarEmpleadoCompleto = async () => {
        try {
          console.log('📡 Cargando información completa del empleado...');
          const [empleadoResponse, infoAdicionalResponse] = await Promise.all([
            api.get(`/empleados/${dniGuardado}`),
            api.get('/catalogos')
          ]);
          
          if (empleadoResponse.data.success && infoAdicionalResponse.data.success) {
            const empleado = empleadoResponse.data.data;
            const infoAdicional = infoAdicionalResponse.data.catalogos;
            
            // Crear objeto con información completa
            const empleadoCompleto = {
              ...empleado,
              cargo: infoAdicional.cargos?.find(c => c.id === empleado.CargoID)?.nombre || `ID: ${empleado.CargoID}` || 'No especificado',
              campania: infoAdicional.campanias?.find(c => c.id === empleado.CampañaID)?.nombre || `ID: ${empleado.CampañaID}` || 'No especificado',
              jornada: infoAdicional.jornadas?.find(c => c.id === empleado.JornadaID)?.nombre || `ID: ${empleado.JornadaID}` || 'No especificado',
              modalidad: infoAdicional.modalidades?.find(c => c.id === empleado.ModalidadID)?.nombre || `ID: ${empleado.ModalidadID}` || 'No especificado'
            };
            
            console.log('✅ Empleado restaurado completamente:', empleadoCompleto);
            setSelectedEmployee(empleadoCompleto);
            setShowActions(true);
            setSearchTerm(empleadoCompleto.DNI); // Restaurar también el término de búsqueda
          } else {
            console.log('❌ Error restaurando empleado, limpiando localStorage');
            localStorage.removeItem('empleadoDNI');
            localStorage.removeItem('empleadoNombre');
          }
        } catch (error) {
          console.error('❌ Error restaurando empleado:', error);
          localStorage.removeItem('empleadoDNI');
          localStorage.removeItem('empleadoNombre');
        }
      };
      
      cargarEmpleadoCompleto();
    }
  }, [location.pathname]);

  // Inyectar estilos CSS para el dropdown de sugerencias
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .search-container {
        z-index: 99999 !important;
        position: relative !important;
      }
      .search-container .MuiPaper-root {
        z-index: 99999 !important;
        position: absolute !important;
        isolation: isolate !important;
      }
      .search-container .MuiPaper-root * {
        z-index: 99999 !important;
      }
      .MuiPaper-root[data-testid="suggestions-dropdown"] {
        z-index: 99999 !important;
        position: absolute !important;
        isolation: isolate !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    console.log('🧹 Limpiando empleado seleccionado...');
    setSelectedEmployee(null);
    setShowActions(false);
    setSearchTerm('');
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    // Limpiar localStorage
    localStorage.removeItem('empleadoDNI');
    localStorage.removeItem('empleadoNombre');
    console.log('💾 localStorage limpiado');
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
      // Establecer fechas por defecto al abrir el modal
      const fechasPorDefecto = getFechasPorDefecto();
      setReportDates(fechasPorDefecto);
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

  console.log('🎨 Dashboard - Antes del return, renderizando JSX...');
  console.log('🎨 Dashboard - Estado actual:', {
    searchTerm,
    suggestions: suggestions.length,
    selectedEmployee: selectedEmployee ? 'Seleccionado' : 'No seleccionado',
    showActions,
    stats,
    loading,
    error
  });

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
            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* KPI Activos */}
              <Box sx={{ 
                backgroundColor: '#10b981', 
                color: 'white', 
                p: 2, 
                borderRadius: 2, 
                textAlign: 'center',
                minWidth: 120,
                boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                  {stats.empleadosActivos}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  Activos
                </Typography>
              </Box>
              
                             {/* KPI Cese */}
               <Box sx={{ 
                 backgroundColor: '#ef4444', 
                 color: 'white', 
                 p: 2, 
                 borderRadius: 2, 
                 textAlign: 'center',
                 minWidth: 120,
                 boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)'
               }}>
                 <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                   {stats.cesesMesActual}
                 </Typography>
                 <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                   Cese {new Date().toLocaleDateString('es-ES', { month: 'long' }).charAt(0).toUpperCase() + new Date().toLocaleDateString('es-ES', { month: 'long' }).slice(1)}
                 </Typography>
               </Box>
              
              {/* KPI Total */}
              <Box sx={{ 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                p: 2, 
                borderRadius: 2, 
                textAlign: 'center',
                minWidth: 120,
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                  {stats.totalEmpleados}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  Total
                </Typography>
              </Box>
            </Box>
          }
        />
      </Card>

      {/* Sección de búsqueda */}
      <Paper sx={{ 
        p: 4, 
        mb: 4, 
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SearchIcon sx={{ mr: 2 }} />
          Buscar Empleado
        </Typography>
        
        <Box sx={{ 
          maxWidth: 600, 
          mx: 'auto', 
          position: 'relative',
          zIndex: 99999,
          isolation: 'isolate'
        }} className="search-container">
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
              data-testid="suggestions-dropdown"
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 99999,
                maxHeight: 200,
                overflow: 'auto',
                mt: 1,
                backgroundColor: 'white',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                borderRadius: 1
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
                     '&:last-child': { borderBottom: 'none' },
                     position: 'relative'
                   }}
                 >
                   <Box sx={{ textAlign: 'center' }}>
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
                   <Box sx={{
                     position: 'absolute',
                     right: 16,
                     top: '50%',
                     transform: 'translateY(-50%)',
                     display: 'inline-block',
                     backgroundColor: index === selectedSuggestionIndex ? 'white' :
                       emp.EstadoEmpleado === 'Activo' ? '#22c55e' :
                       emp.EstadoEmpleado === 'Cese' ? '#6b7280' : '#e5e7eb',
                     color: index === selectedSuggestionIndex ? '#1f2937' :
                       emp.EstadoEmpleado === 'Activo' ? 'white' :
                       emp.EstadoEmpleado === 'Cese' ? 'white' : '#6b7280',
                     px: 1,
                     py: 0.5,
                     borderRadius: 2,
                     fontSize: '0.75rem',
                     fontWeight: 'bold',
                     minWidth: 'fit-content'
                   }}>
                     {emp.EstadoEmpleado || 'Estado desconocido'}
                   </Box>
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
              <Grid container spacing={8}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <IdCardIcon sx={{ color: '#1e40af', mr: 1, fontSize: 16 }} />
                      <strong style={{ color: '#000000' }}>DNI:&nbsp;&nbsp;</strong> {selectedEmployee.DNI}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CalendarIcon sx={{ color: '#059669', mr: 1, fontSize: 16 }} />
                      <strong style={{ color: '#000000' }}>Fecha Contratación:&nbsp;&nbsp;</strong> {formatearFecha(selectedEmployee.FechaContratacion)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <WorkIcon sx={{ color: '#0891b2', mr: 1, fontSize: 16 }} />
                      <strong style={{ color: '#000000' }}>Cargo:&nbsp;&nbsp;</strong> {selectedEmployee.cargo}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <BusinessIcon sx={{ color: '#d97706', mr: 1, fontSize: 16 }} />
                      <strong style={{ color: '#000000' }}>Campaña:&nbsp;&nbsp;</strong> {selectedEmployee.campania}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6} sx={{ pl: 8 }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CircleIcon sx={{ 
                        color: selectedEmployee.EstadoEmpleado === 'Activo' ? '#059669' : '#dc2626', 
                        mr: 1, 
                        fontSize: 16 
                      }} />
                      <strong style={{ color: '#000000' }}>Estado:&nbsp;&nbsp;</strong> {selectedEmployee.EstadoEmpleado || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <ClockIcon sx={{ color: '#475569', mr: 1, fontSize: 16 }} />
                      <strong style={{ color: '#000000' }}>Jornada:&nbsp;&nbsp;</strong> {selectedEmployee.jornada}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <LaptopIcon sx={{ color: '#0891b2', mr: 1, fontSize: 16 }} />
                      <strong style={{ color: '#000000' }}>Modalidad:&nbsp;&nbsp;</strong> {selectedEmployee.modalidad}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CalendarMonthIcon sx={{ color: '#dc2626', mr: 1, fontSize: 16 }} />
                      <strong style={{ color: '#000000' }}>Fecha Cese:&nbsp;&nbsp;</strong> {formatearFecha(selectedEmployee.FechaCese)}
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
        <DialogTitle sx={{ 
          backgroundColor: '#f8f9fa', 
          borderBottom: '2px solid #e9ecef',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 2, color: '#1976d2' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
              Generar Reporte de Asistencia
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                Fecha de Inicio *
              </Typography>
              <TextField
                type="date"
                value={reportDates.fechaInicio}
                onChange={(e) => setReportDates({ ...reportDates, fechaInicio: e.target.value })}
                fullWidth
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                      borderWidth: 2
                    }
                  }
                }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                Fecha de Fin *
              </Typography>
              <TextField
                type="date"
                value={reportDates.fechaFin}
                onChange={(e) => setReportDates({ ...reportDates, fechaFin: e.target.value })}
                fullWidth
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                      borderWidth: 2
                    }
                  }
                }}
              />
            </Box>
            
            {/* Botón para resetear fechas */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  const fechasPorDefecto = getFechasPorDefecto();
                  setReportDates(fechasPorDefecto);
                }}
                sx={{
                  color: '#6c757d',
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                    color: '#495057'
                  }
                }}
              >
                Restablecer fechas por defecto
              </Button>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Alert 
              severity="info" 
              icon={<InfoIcon />}
              sx={{
                mt: 2,
                '& .MuiAlert-icon': {
                  color: '#1976d2'
                }
              }}
            >
              <Typography variant="body2">
                <strong>Nota:</strong> El reporte incluirá todas las campañas por defecto.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          backgroundColor: '#f8f9fa', 
          borderTop: '1px solid #e9ecef' 
        }}>
          <Button 
            onClick={() => setShowReportModal(false)}
            variant="outlined"
            sx={{
              borderColor: '#6c757d',
              color: '#6c757d',
              '&:hover': {
                borderColor: '#5a6268',
                backgroundColor: '#f8f9fa'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={generateReport}
            variant="contained"
            disabled={loading || !reportDates.fechaInicio || !reportDates.fechaFin}
            sx={{
              backgroundColor: '#28a745',
              '&:hover': {
                backgroundColor: '#218838'
              },
              '&:disabled': {
                backgroundColor: '#6c757d'
              }
            }}
          >
            {loading ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
