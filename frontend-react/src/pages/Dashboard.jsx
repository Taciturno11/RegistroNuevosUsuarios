import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Dialog, // <-- Corregido (sin duplicar)
  DialogTitle, // <-- Corregido (sin duplicar)
  DialogContent, // <-- Corregido (sin duplicar)
  DialogActions,
  FormControl,
  InputLabel,
  CircularProgress,
  // --- Imports del Modal ---
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar
} from '@mui/material';

import {
  // Money <--- ESTO ESTABA DANDO ERROR, LO QUITÉ
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
  Event as CalendarMonthIcon,
  MonetizationOn as MoneyBagIcon,
  // --- Imports del Modal ---
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  GroupWork as GroupWorkIcon
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

//-----------------------CONECTAMOS AL OTRO FRONT (pagina capacitadores)---------------------------------

  // Estados para el resumen de capacitadores
  const [statsCapa, setStatsCapa] = useState({ enCurso: 0, finalizadas: 0 });
  const [loadingCapa, setLoadingCapa] = useState(true);
  const [errorCapa, setErrorCapa] = useState('');

  // Para guardar las listas completas (¡NUEVO!)
  const [listasCapa, setListasCapa] = useState({ enCurso: [], finalizadas: [] });

  // Para manejar el modal (¡NUEVO!)
  const [modalState, setModalState] = useState({ open: false, title: '', capacitations: [] });
  
  // Para guardar los postulantes de la capa seleccionada (¡NUEVO!)
  const [detalleState, setDetalleState] = useState({
    loading: false,
    error: '',
    data: [],
    expandedKey: null // Para saber qué acordeón está abierto
  });


// --- 2. AÑADE ESTE useEffect PARA LLAMAR A LA API :3003 ---
  useEffect(() => {
    const cargarDatosCapa = async () => {
      try {
        setLoadingCapa(true);
        setErrorCapa('');
        
        // Esta es la URL de tu backend de capacitadores
        const urlBase = 'http://10.182.18.70:3003/api/capacitaciones/resumen-jefe';

        // 1. Petición para "En curso"
        // (Pedimos la data filtrada por estado en el backend)
        const enCursoPromise = axios.get(`${urlBase}?estado=En%20curso`);

        // 2. Petición para "Finalizado"
        const finalizadoPromise = axios.get(`${urlBase}?estado=Finalizado`);

        // Ejecutamos ambas peticiones al mismo tiempo
        const [enCursoRes, finalizadoRes] = await Promise.all([enCursoPromise, finalizadoPromise]);

        // El total de "En curso" es directo
        const totalEnCurso = enCursoRes.data.total || 0;
        const listaEnCurso = enCursoRes.data.data || [];

        // --- 3. Filtramos las "Finalizadas" por fecha ---
        const hoy = new Date();
        const limiteInferior = new Date();
        limiteInferior.setDate(hoy.getDate() - 5); // 5 días atrás
        limiteInferior.setHours(0, 0, 0, 0); // Para comparar desde el inicio del día

        const finalizadasRecientes = finalizadoRes.data.data.filter(capa => {
          // Parseamos la fecha 'YYYY-MM-DD' correctamente
          const [y, m, d] = capa.finOjt.split('-').map(Number);
          const fechaFin = new Date(y, m - 1, d); // Fecha en zona horaria local

          // Comparamos: (Fecha Fin >= 5 días atrás) Y (Fecha Fin <= Hoy)
          return fechaFin >= limiteInferior && fechaFin <= hoy;
        });
        
        setStatsCapa({
          enCurso: totalEnCurso,
          finalizadas: finalizadasRecientes.length
        });
        // --- AÑADE ESTA LÍNEA ---
        setListasCapa({
          enCurso: listaEnCurso, // <-- La lista completa de "enCursoRes"
          finalizadas: finalizadasRecientes // <-- La lista completa filtrada
        });
        // --- FIN DE LÍNEA AÑADIDA ---





      } catch (error) {
        console.error('Error al traer datos de capacitadores:', error);
        setErrorCapa('No se pudo cargar el resumen.');
      } finally {
        setLoadingCapa(false);
      }
    };

    cargarDatosCapa();
  }, []); // El array vacío [] hace que se ejecute solo una vez


// --- AÑADE ESTAS 3 FUNCIONES ---

  const handleOpenModal = (title, capacitations) => {
    // Abre el modal con la lista de capacitaciones (en curso o finalizadas)
    setModalState({ open: true, title, capacitations });
  };

  const handleCloseModal = () => {
    // Cierra el modal y limpia todo
    setModalState({ open: false, title: '', capacitations: [] });
    setDetalleState({ loading: false, error: '', data: [], expandedKey: null });
  };

  // Se dispara cuando abres un acordeón (una capacitación)
  const handleAccordionChange = (capa) => async (event, isExpanded) => {
    const key = capa.id;

    if (!isExpanded || detalleState.expandedKey === key) {
      if (!isExpanded) {
        setDetalleState(prev => ({ ...prev, expandedKey: null }));
      }
      return;
    }

    // Muestra "cargando" dentro del acordeón
    setDetalleState({ loading: true, error: '', data: [], expandedKey: key });
    
    try {
      // Prepara los parámetros para la API
      const params = new URLSearchParams({
        campaniaID: capa.campania.split(',')[0], // Limpiamos por si acaso
        fechaInicio: capa.inicioCapa,
        dniCapacitador: capa.formadorDNI // Usamos el DNI del formador
      });
      
      // ¡Llamamos al NUEVO endpoint del backend :3003!
      // (Asegúrate de que tu backend tenga esta ruta)
      const url = `http://10.182.18.70:3003/api/capacitacion/detalle?${params.toString()}`;
      const response = await axios.get(url);

      if (response.data.success) {
        setDetalleState(prev => ({
          ...prev,
          loading: false,
          data: response.data.data
        }));
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error al traer detalle de capa:', error);
      setDetalleState(prev => ({
        ...prev,
        loading: false,
        error: 'No se pudieron cargar los postulantes.'
      }));
    }
  };







//-.----------------------------------------------------------------------------------------------------

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
      case 'bonos':
        navigate('/bonos');
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
      title: 'Bonos',
      description: 'Gestionar bonos y compensaciones del empleado',
      icon: <MoneyBagIcon />,
      color: '#16a34a',
      action: 'bonos'
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



      {/* Sección dividida (Datos Capacitadores y Registrar Empleado) */}
      <Grid container spacing={4} sx={{ mb: 4 }}>

        {/* ==== CONTENEDOR 1 (IZQUIERDA) - Para Datos de Capacitadores ==== */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ 
            p: 4, 
            height: '100%', 
            border: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
   
             }}>
            <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <LaptopIcon sx={{ mr: 2, color: '#7c3aed' }} /> {/* Icono de Capacitación */}
              Resumen de Capacitadores
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.75, minHeight: 40 }}>
              Datos en vivo del sistema de capacitación.
            </Typography>
            
            {/* Aquí pondremos los datos (ahora mostramos "Cargando...") */}

{/* Aquí mostramos los datos cargados */}
{/* Aquí mostramos los datos cargados */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: 100, 
              flexGrow: 1
              }}>
              {loadingCapa ? (
                <CircularProgress />
              ) : errorCapa ? (
                <Alert severity="error">{errorCapa}</Alert>
              ) : (
                <Grid container spacing={2} sx={{ textAlign: 'center', width: '100%' }}>
                  
                  {/* --- "En Curso" AHORA ES CLICABLE --- */}
                  <Grid item xs={6}>  
                    <Box 
                      onClick={() => handleOpenModal('Capacitaciones En Curso', listasCapa.enCurso)}
                      sx={{ cursor: 'pointer', p: 2, '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.05)', borderRadius: 2 } }}
                    >
                      <Typography variant='h3' sx={{color: '#7c3aed', fontWeight: 600 }}>
                        {statsCapa.enCurso}
                      </Typography>
                      <Typography variant='body1' sx={{ color: 'text.secondary' }}>
                        En Curso
                      </Typography>
                    </Box>
                  </Grid>

                  {/* --- "Finalizadas" AHORA ES CLICABLE --- */}
                  <Grid item xs={6}>  
                    <Box 
                      onClick={() => handleOpenModal('Capacitaciones Finalizadas (Últ. 5 días)', listasCapa.finalizadas)}
                      sx={{ cursor: 'pointer', p: 2, '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.05)', borderRadius: 2 } }}
                    >
                      <Typography variant='h3' sx={{ color: '#7c3aed', fontWeight: 600 }}>
                        {statsCapa.finalizadas}
                      </Typography>
                      <Typography variant='body1' sx={{ color: 'text.secondary' }}>
                        Finalizadas (Últ. 5 días)
                      </Typography>
                    </Box>
                  </Grid>

                </Grid>
              )}
            </Box>

          </Paper>
        </Grid>

        {/* ==== CONTENEDOR 2 (DERECHA) - Tu tarjeta existente ==== */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 4, textAlign: 'center', height: '100%', border: '1px solid #e0e0e0' }}>
            <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PersonAddIcon sx={{ mr: 2 }} />
              ¿Necesitas registrar un nuevo empleado?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.75, minHeight: 40 }}>
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
        </Grid>

      </Grid>

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

{/* ===============================================================
          AQUÍ PEGA EL NUEVO MODAL DE CAPACITADORES
      ===============================================================
      */}
      <Dialog 
        open={modalState.open} 
        onClose={handleCloseModal} 
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
          <LaptopIcon sx={{ mr: 2, color: '#7c3aed' }} />
          {modalState.title}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f9fafb', p: 2 }}>
          {modalState.capacitations.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center' }}>
              No hay capacitaciones para mostrar en esta categoría.
            </Typography>
          ) : (
            <List sx={{ p: 0 }}>
              {modalState.capacitations.map((capa) => (
                <Accordion 
                  key={capa.id}
                  expanded={detalleState.expandedKey === capa.id} 
                  onChange={handleAccordionChange(capa)}
                  sx={{ mb: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ '&.Mui-expanded': { borderBottom: '1px solid #e0e0e0' } }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <GroupWorkIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {capa.campania}
                        </Typography>
                      }
                      secondary={`${capa.formador} | Inicio: ${capa.inicioCapa} | Fin: ${capa.finOjt}`}
                    />
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: 'white', p: 2 }}>
                    {/* Aquí mostramos el detalle (loading, error, o la lista) */}
                    {detalleState.loading && detalleState.expandedKey === capa.id && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                      </Box>
                    )}
                    {detalleState.error && detalleState.expandedKey === capa.id && (
                      <Alert severity="error">{detalleState.error}</Alert>
                    )}
                    {!detalleState.loading && detalleState.expandedKey === capa.id && (
                      <>
                        <Typography variant="h6" sx={{ mb: 1, borderBottom: '1px solid #eee', pb: 1 }}>
                          Contratados ({detalleState.data.filter(p => p.estado === 'Contratado').length})
                        </Typography>
                        <List dense>
                          {detalleState.data.filter(p => p.estado === 'Contratado').map(p => (
                            <ListItem key={p.dni}>
                              <ListItemIcon>
                                <CheckIcon sx={{ color: 'green' }} />
                              </ListItemIcon>
                              <ListItemText primary={`${p.apellidoPaterno} ${p.nombres}`} />
                            </ListItem>
                          ))}
                        </List>

                        <Typography variant="h6" sx={{ mt: 3, mb: 1, borderBottom: '1px solid #eee', pb: 1 }}>
                          Otros Estados ({detalleState.data.filter(p => p.estado !== 'Contratado').length})
                        </Typography>
                        <List dense>
                          {detalleState.data.filter(p => p.estado !== 'Contratado').map(p => (
                            <ListItem key={p.dni}>
                              <ListItemIcon>
                                <CloseIcon sx={{ color: 'red' }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary={`${p.apellidoPaterno} ${p.nombres}`} 
                                secondary={`Estado: ${p.estado} ${p.fechaCese ? `(Cese: ${formatearFecha(p.fechaCese)})` : ''}`} 
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleCloseModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      {/* --- FIN DEL CÓDIGO PEGADO --- */}





    </Box>
  );
};

export default Dashboard;
