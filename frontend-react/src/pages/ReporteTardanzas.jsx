import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextField,
  Checkbox
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

const ReporteTardanzas = () => {
  console.log('🚀 ReporteTardanzas: Componente montándose');
  
  // Estilos CSS para animaciones
  React.useEffect(() => {
    // Agregar estilos CSS para la animación de pulso
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const navigate = useNavigate();
  const { user, api } = useAuth();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reporteData, setReporteData] = useState(null);
  
  // Estados para la funcionalidad expandible
  const [empleadoExpandido, setEmpleadoExpandido] = useState(null);
  const [detallesTardanzas, setDetallesTardanzas] = useState({});
  
  // Estados para agrupación por campañas
  const [areasExpandidas, setAreasExpandidas] = useState({});
  const [campañasExpandidas, setCampañasExpandidas] = useState({});
  const [vistaAgrupada, setVistaAgrupada] = useState(false);
  
  // Estados para filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(1); // Primer día del mes actual
    return fecha.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const fecha = new Date();
    return fecha.toISOString().split('T')[0];
  });
  const [campania, setCampania] = useState('todas');
  const [cargo, setCargo] = useState([]);
  const [supervisor, setSupervisor] = useState('todos');
  
  // Estados para opciones de filtros
  const [campaniasDisponibles, setCampaniasDisponibles] = useState([]);
  const [cargosDisponibles, setCargosDisponibles] = useState([]);
  const [supervisoresDisponibles, setSupervisoresDisponibles] = useState([]);
  
  // Estructura de áreas y campañas
  const [areasCampañas] = useState({
    'OUTBOUND': [
      'MIGRACION',
      'PORTABILIDAD PREPAGO', 
      'RENOVACION',
      'HOGAR',
      'REGULARIZACION',
      'PORTABILIDAD POSPAGO',
      'PREPAGO DIGITAL',
      'BACKOFFICE'
    ],
    'INBOUND': [
      'UNIFICADO',
      'AUDITORIA',
      'CROSSELLING',
      'BACK SEGUIMIENTO',
      'REDES SOCIALES',
      'BACK TRANSFERENCIAS',
      'CLIENTES ESPECIALES',
      'LIVE CHAT',
      'RELLAMADO',
      'BACK OFRECIMENTO',
      'NPS FCR',
      'RETENCIONES'
    ],
    'STAFF': [
      'ESTRUCTURA',
      'CALIDAD',
      'CAPACITACION',
      'ANALISTAS'
    ]
  });

  // Función para convertir minutos a tiempo con formato
  const minutosAHoras = (minutos) => {
    if (!minutos || minutos === 0) return '0m';
    
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    
    // Si es menor a 1 hora, mostrar solo minutos
    if (horas === 0) {
      return `${minutos}m`;
    }
    
    // Si es 1 hora o más, mostrar horas y minutos
    if (minutosRestantes === 0) {
      return `${horas}h`;
    }
    return `${horas}h ${minutosRestantes}m`;
  };

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina, setElementosPorPagina] = useState(10);
  const [totalElementos, setTotalElementos] = useState(0);

  // Verificar permisos al montar
  useEffect(() => {
    console.log('🔍 ReporteTardanzas: useEffect ejecutándose, user:', user);
    
    // Admin o usuarios con vista de Reporte de Tardanzas pueden acceder
    if (user?.role !== 'admin' && (!user?.vistas || !user.vistas.includes('Reporte de Tardanzas'))) {
      console.log('❌ ReporteTardanzas: Sin permisos, redirigiendo. Role:', user?.role, 'Vistas:', user?.vistas);
      navigate('/');
      return;
    }
    
    console.log('✅ ReporteTardanzas: Permisos OK, cargando datos');
    cargarOpcionesFiltros();
    restaurarEstadoPersistente();
    // Solo generar reporte si no hay datos restaurados
    if (!localStorage.getItem('reporteTardanzas_datos')) {
      generarReporte();
    }
  }, [user, navigate]);

  // Función para restaurar estado persistente desde localStorage
  const restaurarEstadoPersistente = () => {
    try {
      // Restaurar filtros
      const filtrosGuardados = localStorage.getItem('reporteTardanzas_filtros');
      if (filtrosGuardados) {
        const filtrosRestaurados = JSON.parse(filtrosGuardados);
        setFechaInicio(filtrosRestaurados.fechaInicio);
        setFechaFin(filtrosRestaurados.fechaFin);
        setCampania(filtrosRestaurados.campania);
        setCargo(filtrosRestaurados.cargo || []);
        setSupervisor(filtrosRestaurados.supervisor || 'todos');
      }

      // Restaurar datos del reporte
      const reporteGuardado = localStorage.getItem('reporteTardanzas_datos');
      if (reporteGuardado) {
        const reporteRestaurado = JSON.parse(reporteGuardado);
        setReporteData(reporteRestaurado);
      }

      // Restaurar paginación
      const paginacionGuardada = localStorage.getItem('reporteTardanzas_paginacion');
      if (paginacionGuardada) {
        const paginacionRestaurada = JSON.parse(paginacionGuardada);
        setPaginaActual(paginacionRestaurada.paginaActual);
        setElementosPorPagina(paginacionRestaurada.elementosPorPagina);
        setTotalElementos(paginacionRestaurada.totalElementos);
      }

      // Restaurar estado de expansión
      const expansionGuardada = localStorage.getItem('reporteTardanzas_expansion');
      if (expansionGuardada) {
        const expansionRestaurada = JSON.parse(expansionGuardada);
        setEmpleadoExpandido(expansionRestaurada.empleadoExpandido);
        setDetallesTardanzas(expansionRestaurada.detallesTardanzas);
      }
    } catch (error) {
      console.error('Error restaurando estado persistente:', error);
      // Si hay error, limpiar localStorage corrupto
      limpiarEstadoPersistente();
    }
  };

  // Función para guardar estado en localStorage
  const guardarEstadoPersistente = () => {
    try {
      // Guardar filtros
      localStorage.setItem('reporteTardanzas_filtros', JSON.stringify({
        fechaInicio,
        fechaFin,
        campania,
        cargo,
        supervisor
      }));
      
      // Guardar datos del reporte
      if (reporteData) {
        localStorage.setItem('reporteTardanzas_datos', JSON.stringify(reporteData));
      }
      
      // Guardar paginación
      localStorage.setItem('reporteTardanzas_paginacion', JSON.stringify({
        paginaActual,
        elementosPorPagina,
        totalElementos
      }));

      // Guardar estado de expansión
      localStorage.setItem('reporteTardanzas_expansion', JSON.stringify({
        empleadoExpandido,
        detallesTardanzas
      }));
    } catch (error) {
      console.error('Error guardando estado persistente:', error);
    }
  };

  // Función para limpiar estado persistente
  const limpiarEstadoPersistente = () => {
    localStorage.removeItem('reporteTardanzas_filtros');
    localStorage.removeItem('reporteTardanzas_datos');
    localStorage.removeItem('reporteTardanzas_paginacion');
    localStorage.removeItem('reporteTardanzas_expansion');
  };

  // Guardar estado cada vez que cambien los datos importantes
  useEffect(() => {
    guardarEstadoPersistente();
  }, [fechaInicio, fechaFin, campania, cargo, supervisor, reporteData, paginaActual, elementosPorPagina, totalElementos, empleadoExpandido, detallesTardanzas]);

  const cargarOpcionesFiltros = async () => {
    try {
      // Usar los mismos endpoints que el reporte de asistencias
      const [campaniasRes, cargosRes, supervisoresRes] = await Promise.all([
        api.get('/reportes/campanias-disponibles'),
        api.get('/reportes/cargos-disponibles'),
        api.get('/reportes/supervisores-disponibles')
      ]);

      if (campaniasRes.data.success) {
        setCampaniasDisponibles(campaniasRes.data.data);
      }
      
      if (cargosRes.data.success) {
        setCargosDisponibles(cargosRes.data.data);
      }
      
      if (supervisoresRes.data.success) {
        setSupervisoresDisponibles(supervisoresRes.data.data);
      }
    } catch (error) {
      console.error('Error cargando opciones de filtros:', error);
    }
  };

  const generarReporte = async () => {
    setLoading(true);
    setError('');
    
    try {
      let url = `/tardanzas/resumido?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      
      if (campania && campania !== 'todas') {
        url += `&campania=${campania}`;
      }
      


      if (cargo.length > 0) {
        const cargosQuery = cargo.map(cargoId => `cargo=${encodeURIComponent(cargoId)}`).join('&');
        url += `&${cargosQuery}`;
      }




      
      if (supervisor && supervisor !== 'todos') {
        url += `&supervisor=${supervisor}`;
      }
      
      const response = await api.get(url);
      
      if (response.data.success) {
        console.log('🔍 Datos del reporte RESUMIDO:', response.data.data);
        console.log('📊 Total empleados recibidos:', response.data.data.empleados.length);
        console.log('👥 Total tardanzas:', response.data.data.metadata.totalTardanzas);
        
        // LIMPIAR datos anteriores antes de establecer nuevos
        setReporteData(null);
        setEmpleadoExpandido(null);
        setDetallesTardanzas({});
        setTimeout(() => {
          setReporteData(response.data.data);
          setTotalElementos(response.data.data.empleados.length);
          setPaginaActual(1); // Resetear a la primera página
        }, 100);
      } else {
        setError(response.data.message || 'Error generando reporte de tardanzas');
      }
    } catch (error) {
      console.error('Error generando reporte de tardanzas:', error);
      setError(error.response?.data?.message || 'Error de conexión al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = () => {
    setPaginaActual(1); // Resetear a la primera página
    generarReporte();
  };

  // Calcular datos paginados
  const datosPaginados = useMemo(() => {
    if (!reporteData?.empleados) return [];
    
    const inicio = (paginaActual - 1) * elementosPorPagina;
    const fin = inicio + elementosPorPagina;
    return reporteData.empleados.slice(inicio, fin);
  }, [reporteData, paginaActual, elementosPorPagina]);

  // Calcular total de páginas
  const totalPaginas = useMemo(() => {
    return Math.ceil(totalElementos / elementosPorPagina);
  }, [totalElementos, elementosPorPagina]);

  // Cambiar página
  const cambiarPagina = useCallback((nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  }, []);

  // Cambiar elementos por página
  const cambiarElementosPorPagina = useCallback((nuevosElementos) => {
    setElementosPorPagina(nuevosElementos);
    setPaginaActual(1); // Resetear a la primera página
  }, []);

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFechaInicio(() => {
      const fecha = new Date();
      fecha.setDate(1);
      return fecha.toISOString().split('T')[0];
    });
    setFechaFin(() => {
      const fecha = new Date();
      return fecha.toISOString().split('T')[0];
    });
    setCampania('todas');
    setCargo([]);
    setPaginaActual(1);
    setReporteData(null);
    setError('');
    // Limpiar también el localStorage
    limpiarEstadoPersistente();
  };

  // Función para calcular tardanzas por áreas y campañas
  const calcularTardanzasPorAreas = useCallback(() => {
    if (!reporteData?.empleados || reporteData.empleados.length === 0) return {};
    
    // Función para obtener área por campaña (más flexible)
    const obtenerAreaPorCampaña = (campaña) => {
      // Primero intentar coincidencia exacta
      for (const [area, campañas] of Object.entries(areasCampañas)) {
        if (campañas.includes(campaña)) {
          return area;
        }
      }
      
      // Si no hay coincidencia exacta, intentar coincidencia parcial (ignorar mayúsculas/minúsculas)
      const campañaNormalizada = campaña.toLowerCase().trim();
      for (const [area, campañas] of Object.entries(areasCampañas)) {
        const coincidencia = campañas.find(c => c.toLowerCase().trim() === campañaNormalizada);
        if (coincidencia) {
          return area;
        }
      }
      
      // Si aún no hay coincidencia, intentar coincidencia parcial por palabras clave
      for (const [area, campañas] of Object.entries(areasCampañas)) {
        const coincidencia = campañas.find(c => {
          const palabrasCampaña = c.toLowerCase().split(' ');
          const palabrasDato = campañaNormalizada.split(' ');
          return palabrasCampaña.some(palabra => palabrasDato.includes(palabra)) || 
                 palabrasDato.some(palabra => palabrasCampaña.includes(palabra));
        });
        if (coincidencia) {
          return area;
        }
      }
      
      return 'OTROS';
    };
    
    const areas = {};
    let totalGeneralTardanzas = 0;
    let totalGeneralMinutos = 0;
    let totalGeneralEmpleados = 0;
    
    // Agrupar por área y campaña
    reporteData.empleados.forEach(empleado => {
      const area = obtenerAreaPorCampaña(empleado.Campaña);
      
      if (!areas[area]) {
        areas[area] = {
          totalTardanzas: 0,
          totalMinutos: 0,
          totalEmpleados: 0,
          promedioTardanzas: 0,
          promedioMinutos: 0,
          nivelProblema: 'Bajo',
          campañas: {}
        };
      }
      
      areas[area].totalTardanzas += empleado.TotalTardanzas;
      areas[area].totalMinutos += empleado.TotalMinutosTardanza;
      areas[area].totalEmpleados += 1;
      totalGeneralTardanzas += empleado.TotalTardanzas;
      totalGeneralMinutos += empleado.TotalMinutosTardanza;
      totalGeneralEmpleados += 1;
      
      // Agrupar por campaña
      if (!areas[area].campañas[empleado.Campaña]) {
        areas[area].campañas[empleado.Campaña] = {
          totalTardanzas: 0,
          totalMinutos: 0,
          totalEmpleados: 0,
          promedioTardanzas: 0,
          promedioMinutos: 0,
          nivelProblema: 'Bajo'
        };
      }
      areas[area].campañas[empleado.Campaña].totalTardanzas += empleado.TotalTardanzas;
      areas[area].campañas[empleado.Campaña].totalMinutos += empleado.TotalMinutosTardanza;
      areas[area].campañas[empleado.Campaña].totalEmpleados += 1;
    });
    
    // Calcular promedios y niveles de problema
    Object.keys(areas).forEach(area => {
      if (areas[area].totalEmpleados > 0) {
        areas[area].promedioTardanzas = (areas[area].totalTardanzas / areas[area].totalEmpleados).toFixed(1);
        areas[area].promedioMinutos = (areas[area].totalMinutos / areas[area].totalEmpleados).toFixed(1);
      }
      
      // Clasificar nivel de problema del área
      if (areas[area].totalTardanzas >= 50 || areas[area].totalMinutos >= 1200) {
        areas[area].nivelProblema = 'Crítico';
      } else if (areas[area].totalTardanzas >= 25 || areas[area].totalMinutos >= 600) {
        areas[area].nivelProblema = 'Alto';
      } else if (areas[area].totalTardanzas >= 15 || areas[area].totalMinutos >= 300) {
        areas[area].nivelProblema = 'Moderado';
      } else {
        areas[area].nivelProblema = 'Bajo';
      }
      
      // Calcular promedios y niveles para cada campaña
      Object.keys(areas[area].campañas).forEach(campaña => {
        const datosCampaña = areas[area].campañas[campaña];
        if (datosCampaña.totalEmpleados > 0) {
          datosCampaña.promedioTardanzas = (datosCampaña.totalTardanzas / datosCampaña.totalEmpleados).toFixed(1);
          datosCampaña.promedioMinutos = (datosCampaña.totalMinutos / datosCampaña.totalEmpleados).toFixed(1);
        }
        
        // Clasificar nivel de problema de la campaña
        if (datosCampaña.totalTardanzas >= 20 || datosCampaña.totalMinutos >= 480) {
          datosCampaña.nivelProblema = 'Crítico';
        } else if (datosCampaña.totalTardanzas >= 10 || datosCampaña.totalMinutos >= 240) {
          datosCampaña.nivelProblema = 'Alto';
        } else if (datosCampaña.totalTardanzas >= 5 || datosCampaña.totalMinutos >= 120) {
          datosCampaña.nivelProblema = 'Moderado';
        } else {
          datosCampaña.nivelProblema = 'Bajo';
        }
      });
    });
    
    console.log('🔍 DEBUG: Áreas generadas:', Object.keys(areas));
    console.log('🔍 DEBUG: Detalles de áreas:', areas);
    
    return { areas, totalGeneralTardanzas, totalGeneralMinutos, totalGeneralEmpleados };
  }, [reporteData, areasCampañas]);

  // Función para alternar expansión de área
  const toggleArea = (area) => {
    setAreasExpandidas(prev => ({
      ...prev,
      [area]: !prev[area]
    }));
  };

  // Función para alternar expansión de campaña
  const toggleCampaña = (area, campaña) => {
    const key = `${area}-${campaña}`;
    setCampañasExpandidas(prev => {
      // Si la campaña ya está expandida, la cerramos
      if (prev[key]) {
        return { [key]: false };
      }
      // Si no está expandida, cerramos todas las campañas del mismo área y expandimos solo esta
      const newState = {};
      Object.keys(prev).forEach(existingKey => {
        if (existingKey.startsWith(`${area}-`)) {
          newState[existingKey] = false; // Cerrar todas las campañas del área
        }
      });
      newState[key] = true; // Expandir solo la campaña seleccionada
      return newState;
    });
  };

  // Función para obtener detalles de tardanzas de un empleado específico
  const obtenerDetallesEmpleado = async (dni) => {
    try {
      let url = `/tardanzas/reporte?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      
      if (campania && campania !== 'todas') {
        url += `&campania=${campania}`;
      }
      
      if (cargo.length > 0) {
        const cargosQuery = cargo.map(cargoId => `cargo=${encodeURIComponent(cargoId)}`).join('&');
        url += `&${cargosQuery}`;
      }
      
      if (supervisor && supervisor !== 'todos') {
        url += `&supervisor=${supervisor}`;
      }
      
      const response = await api.get(url);
      
      if (response.data.success) {
        // Filtrar solo las tardanzas del empleado específico
        const tardanzasEmpleado = response.data.data.tardanzas.filter(t => t.DNI === dni);
        return tardanzasEmpleado;
      }
      return [];
    } catch (error) {
      console.error('Error obteniendo detalles del empleado:', error);
      return [];
    }
  };

  // Función para manejar la expansión/contracción de empleados
  const handleToggleEmpleado = async (dni) => {
    if (empleadoExpandido === dni) {
      // Si ya está expandido, contraer
      setEmpleadoExpandido(null);
    } else {
      // Si no está expandido, expandir y cargar detalles
      setEmpleadoExpandido(dni);
      
      // Si no tenemos los detalles cacheados, cargarlos
      if (!detallesTardanzas[dni]) {
        const detalles = await obtenerDetallesEmpleado(dni);
        setDetallesTardanzas(prev => ({
          ...prev,
          [dni]: detalles
        }));
      }
    }
  };

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'Leve': return 'warning';
      case 'Moderada': return 'error';
      case 'Grave': return 'error';
      case 'Muy Grave': return 'error';
      default: return 'default';
    }
  };

  const formatearFecha = (fecha) => {
    try {
      console.log('🔍 Formateando fecha:', fecha, 'Tipo:', typeof fecha);
      
      // Si la fecha es null o undefined
      if (!fecha) return 'Sin fecha';
      
      // Si la fecha viene como string YYYY-MM-DD
      if (typeof fecha === 'string') {
        // Extraer solo la parte de la fecha (antes de la T si existe)
        const fechaSolo = fecha.split('T')[0];
        const [year, month, day] = fechaSolo.split('-');
        
        // Crear fecha con valores numéricos
        const fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        console.log('📅 Fecha creada:', fechaObj);
        
        // Verificar si la fecha es válida
        if (isNaN(fechaObj.getTime())) {
          console.error('❌ Fecha inválida:', fecha);
          return fechaSolo; // Devolver la fecha original como string
        }
        
        return fechaObj.toLocaleDateString('es-ES', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      // Si la fecha viene como objeto Date
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        console.error('❌ Fecha inválida como objeto:', fecha);
        return String(fecha); // Convertir a string
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
    } catch (error) {
      console.error('❌ Error formateando fecha:', fecha, error);
      return String(fecha); // Devolver como string en caso de error
    }
  };

  // Función para formatear fechas SIN día de la semana (para KPIs)
  const formatearFechaSinDia = (fecha) => {
    try {
      // Si la fecha es null o undefined
      if (!fecha) return 'Sin fecha';
      
      // Si la fecha viene como string YYYY-MM-DD
      if (typeof fecha === 'string') {
        // Extraer solo la parte de la fecha (antes de la T si existe)
        const fechaSolo = fecha.split('T')[0];
        const [year, month, day] = fechaSolo.split('-');
        
        // Crear fecha con valores numéricos
        const fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Verificar si la fecha es válida
        if (isNaN(fechaObj.getTime())) {
          return fechaSolo; // Devolver la fecha original como string
        }
        
        return fechaObj.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      // Si la fecha viene como objeto Date
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        return String(fecha); // Convertir a string
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
    } catch (error) {
      console.error('❌ Error formateando fecha sin día:', fecha, error);
      return String(fecha); // Devolver como string en caso de error
    }
  };

  return (
    <Box sx={{ 
      backgroundColor: '#f7fafc',
      minHeight: '100vh',
      p: 2
    }}>
      {/* Header Principal */}
      <Paper sx={{ 
        mb: 3, 
        borderRadius: '16px',
        backgroundColor: 'white',
        boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {/* Barra de Título */}
        <Box sx={{
          backgroundColor: '#dc2626', // Rojo para diferenciarlo del reporte de asistencias
          color: 'white',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Button 
            variant="text" 
            onClick={() => navigate('/')}
            startIcon={<ArrowBackIcon />}
            sx={{
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Volver
          </Button>
          
          <Typography variant="h5" sx={{ 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <ScheduleIcon />
            Reporte de Tardanzas
          </Typography>
          
          <Box sx={{ width: 80 }} />
        </Box>

        {/* KPIs */}
        {reporteData && (
          <Box sx={{ 
            backgroundColor: '#fef2f2', 
            p: 2,
            borderBottom: '1px solid #e5e7eb'
          }}>
            <Grid container spacing={2}>
              <Grid item xs={2.4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <WarningIcon sx={{ fontSize: 20, color: '#dc2626' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#dc2626' }}>
                      {reporteData.metadata.totalTardanzas}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Tardanzas
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={2.4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 20, color: '#ea580c' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ea580c' }}>
                      {reporteData.metadata.totalEmpleados}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Empleados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={2.4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 20, color: '#c2410c' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#c2410c' }}>
                      {reporteData.metadata.promedioTardanzasPorEmpleado}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Promedio/Empleado
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={2.4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 20, color: '#059669' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#059669' }}>
                      {formatearFechaSinDia(reporteData.metadata.fechaInicio)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Fecha Inicio
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={2.4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 20, color: '#7c3aed' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#7c3aed' }}>
                      {formatearFechaSinDia(reporteData.metadata.fechaFin)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Fecha Fin
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Filtros */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={1.5}>
              <TextField
                label="Fecha Inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={1.5}>
              <TextField
                label="Fecha Fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Campaña</InputLabel>
                <Select
                  value={campania}
                  onChange={(e) => setCampania(e.target.value)}
                  label="Campaña"
                >
                  <MenuItem value="todas">Todas las Campañas</MenuItem>
                  {campaniasDisponibles.map((c) => (
                    <MenuItem key={c.CampañaID} value={c.CampañaID}>
                      {c.NombreCampaña}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={2.5}>
              <FormControl 
              fullWidth 
              size="small"
              sx={{minWidth: 180}}  
                >
                <InputLabel>Cargo</InputLabel>
                <Select
                  multiple
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  label="Cargo"
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return <em>Todos los Cargos</em>;
                    }
                    const selectedNames = cargosDisponibles
                      .filter(c => selected.includes(c.CargoID))
                      .map(c => c.NombreCargo);
                    return selectedNames.join(', ');
                  }}
                >

                  
                  {cargosDisponibles.map((c) => (
                    <MenuItem key={c.CargoID} value={c.CargoID}>
                      <Checkbox checked={cargo.indexOf(c.CargoID) > -1} />
                      {c.NombreCargo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Supervisor</InputLabel>
                <Select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  label="Supervisor"
                >
                  <MenuItem value="todos">Todos los Supervisores</MenuItem>
                  {supervisoresDisponibles.map((s) => (
                    <MenuItem key={s.SupervisorDNI} value={s.SupervisorDNI}>
                      {s.NombreCompleto} ({s.CantidadAgentes})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={1.5}>
              <Button
                variant="contained"
                onClick={handleFiltroChange}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #b91c1c, #991b1b)',
                  }
                }}
              >
                {loading ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </Grid>
            
            <Grid item xs={1.5}>
              {reporteData && reporteData.empleados.length > 0 && (
                <Button
                  variant={vistaAgrupada ? "contained" : "outlined"}
                  onClick={() => {
                    setVistaAgrupada(!vistaAgrupada);
                    if (!vistaAgrupada) {
                      // Limpiar expansiones cuando se activa la vista agrupada
                      setEmpleadoExpandido(null);
                      setDetallesTardanzas({});
                    }
                  }}
                  startIcon={<TrendingUpIcon />}
                  fullWidth
                  sx={{
                    borderColor: '#059669',
                    color: vistaAgrupada ? 'white' : '#059669',
                    backgroundColor: vistaAgrupada ? '#059669' : 'transparent',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#047857',
                      backgroundColor: vistaAgrupada ? '#047857' : '#ecfdf5'
                    }
                  }}
                >
                  {vistaAgrupada ? '👥 Por Empleados' : '🏢 Por Áreas'}
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Indicador de carga */}
      {loading && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: '16px',
          backgroundColor: '#f8fafc'
        }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Generando reporte de tardanzas...
          </Typography>
        </Paper>
      )}

      {/* Tabla de empleados resumida */}
      {!loading && reporteData && reporteData.empleados.length > 0 && (
        <Paper sx={{ 
          borderRadius: '16px',
          backgroundColor: 'white',
          boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    width: 50,
                    textAlign: 'center'
                  }}>
                    
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: vistaAgrupada ? 150 : 80
                  }}>
                    {vistaAgrupada ? 'Área/Campaña' : 'DNI'}
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 200
                  }}>
                    {vistaAgrupada ? 'Descripción' : 'Empleado'}
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 120,
                    textAlign: 'center'
                  }}>
                    {vistaAgrupada ? 'Empleados' : 'Campaña'}
                  </TableCell>
                  {!vistaAgrupada && (
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 100
                  }}>
                    Cargo
                  </TableCell>
                  )}
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 120,
                    textAlign: 'center'
                  }}>
                    Total Tardanzas
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 120,
                    textAlign: 'center'
                  }}>
             Total Tiempo
                  </TableCell>
                  {!vistaAgrupada && (
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 100,
                    textAlign: 'center'
                  }}>
                    Promedio
                  </TableCell>
                  )}
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 100,
                    textAlign: 'center'
                  }}>
                    Nivel
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vistaAgrupada ? (
                  // Vista agrupada por áreas
                  (() => {
                    const tardanzasPorAreas = calcularTardanzasPorAreas();
                    if (!tardanzasPorAreas.areas || Object.keys(tardanzasPorAreas.areas).length === 0) return null;
                    
                    return Object.keys(tardanzasPorAreas.areas).map((area) => {
                      const datosArea = tardanzasPorAreas.areas[area];
                      const isAreaExpanded = areasExpandidas[area];
                      
                      // Colores por área
                      const colorArea = area === 'OUTBOUND' ? '#dc2626' : 
                                       area === 'INBOUND' ? '#059669' : 
                                       area === 'STAFF' ? '#7c3aed' : '#6b7280';
                      
                      return (
                        <React.Fragment key={area}>
                          {/* Fila principal del área */}
                          <TableRow 
                            hover
                            sx={{ 
                              cursor: 'pointer',
                              backgroundColor: isAreaExpanded ? '#fef2f2' : 'transparent',
                              '&:hover': { 
                                backgroundColor: isAreaExpanded ? '#fee2e2' : '#f8fafc' 
                              },
                              '& td': {
                                borderBottom: '2px solid #e5e7eb',
                                py: 2
                              }
                            }}
                            onClick={() => toggleArea(area)}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isAreaExpanded ? (
                                  <ExpandLessIcon sx={{ color: colorArea, fontSize: 24 }} />
                                ) : (
                                  <ExpandMoreIcon sx={{ color: '#6b7280', fontSize: 24 }} />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: colorArea, fontSize: '1.1rem' }}>
                                {area}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#374151' }}>
                                 {area === 'OUTBOUND' ? 'Ventas ' : area === 'INBOUND' ? 'Atención al Cliente' : 'Personal Interno'}
                              </Typography>
                            </TableCell>
                     <TableCell>
                       <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669', textAlign: 'center' }}>
                         {datosArea.totalEmpleados}
                       </Typography>
                     </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Chip
                                label={datosArea.totalTardanzas}
                                color="error"
                                size="medium"
                                sx={{ fontWeight: 700, fontSize: '1rem' }}
                              />
                            </TableCell>
                     <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#dc2626', fontSize: '1.1rem' }}>
                       {minutosAHoras(datosArea.totalMinutos)}
                     </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Chip 
                                label={datosArea.nivelProblema} 
                                color={datosArea.nivelProblema === 'Crítico' ? 'error' : 
                                       datosArea.nivelProblema === 'Alto' ? 'warning' : 
                                       datosArea.nivelProblema === 'Moderado' ? 'info' : 'success'}
                                size="medium"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                          </TableRow>

                          {/* Filas expandidas con campañas */}
                          {isAreaExpanded && Object.keys(datosArea.campañas).map((campaña) => {
                            const datosCampaña = datosArea.campañas[campaña];
                            const isCampañaExpanded = campañasExpandidas[`${area}-${campaña}`];
                            
                            return (
                              <React.Fragment key={`${area}-${campaña}`}>
                                {/* Fila de campaña */}
                                <TableRow 
                                  hover
                                  sx={{ 
                                    cursor: 'pointer',
                                    backgroundColor: isCampañaExpanded ? '#fef2f2' : '#f9fafb',
                                    '&:hover': { 
                                      backgroundColor: isCampañaExpanded ? '#fee2e2' : '#f3f4f6' 
                                    },
                                    '& td': {
                                      borderBottom: '1px solid #e5e7eb',
                                      py: 1.5,
                                      pl: 4
                                    }
                                  }}
                                  onClick={() => toggleCampaña(area, campaña)}
                                >
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {isCampañaExpanded ? (
                                        <ExpandLessIcon sx={{ color: colorArea, fontSize: 20 }} />
                                      ) : (
                                        <ExpandMoreIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colorArea, fontSize: '1rem' }}>
                                      {campaña}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#6b7280' }}>
                                      Campaña de {area}
                                    </Typography>
                                  </TableCell>
                           <TableCell>
                             <Typography variant="h6" sx={{ fontWeight: 600, color: '#059669', textAlign: 'center' }}>
                               {datosCampaña.totalEmpleados}
                             </Typography>
                           </TableCell>
                                  <TableCell sx={{ textAlign: 'center' }}>
                                    <Chip
                                      label={datosCampaña.totalTardanzas}
                                      color="error"
                                      size="small"
                                      sx={{ fontWeight: 600 }}
                                    />
                                  </TableCell>
                           <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>
                             {minutosAHoras(datosCampaña.totalMinutos)}
                           </TableCell>
                                  <TableCell sx={{ textAlign: 'center' }}>
                                    <Chip 
                                      label={datosCampaña.nivelProblema} 
                                      color={datosCampaña.nivelProblema === 'Crítico' ? 'error' : 
                                             datosCampaña.nivelProblema === 'Alto' ? 'warning' : 
                                             datosCampaña.nivelProblema === 'Moderado' ? 'info' : 'success'}
                                      size="small"
                                      sx={{ fontWeight: 500 }}
                                    />
                                  </TableCell>
                                </TableRow>

                                {/* Filas expandidas con empleados de la campaña */}
                                {isCampañaExpanded && reporteData.empleados
                                  .filter(emp => emp.Campaña === campaña)
                                  .map((empleado) => (
                                    <React.Fragment key={`${area}-${campaña}-${empleado.DNI}`}>
                                    <TableRow
                                      hover
                                      sx={{ 
                                        backgroundColor: '#fafafa',
                                        cursor: empleado.TotalTardanzas > 0 ? 'pointer' : 'default',
                                        '&:hover': { 
                                          backgroundColor: empleado.TotalTardanzas > 0 ? '#f5f5f5' : '#fafafa'
                                        },
                                        '& td': {
                                          borderBottom: '1px solid #e5e7eb',
                                          py: 1,
                                          pl: 6,
                                          fontSize: '0.875rem'
                                        }
                                      }}
                                      onClick={() => empleado.TotalTardanzas > 0 && handleToggleEmpleado(empleado.DNI)}
                                    >
                                      <TableCell>
                                        {empleado.TotalTardanzas > 0 && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {empleadoExpandido === empleado.DNI ? (
                                              <ExpandLessIcon sx={{ color: '#dc2626', fontSize: 16 }} />
                                            ) : (
                                              <ExpandMoreIcon sx={{ color: '#6b7280', fontSize: 16 }} />
                                            )}
                                          </Box>
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                        {empleado.DNI}
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {empleado.NombreCompleto}
                                        </Typography>
                                      </TableCell>
                                      <TableCell sx={{ textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                          {empleado.Cargo}
                                        </Typography>
                                      </TableCell>
                                      <TableCell sx={{ textAlign: 'center' }}>
                                        <Chip
                                          label={empleado.TotalTardanzas}
                                          color="error"
                                          size="small"
                                          sx={{ fontWeight: 600 }}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>
                                        {minutosAHoras(empleado.TotalMinutosTardanza)}
                                      </TableCell>
                                      <TableCell sx={{ textAlign: 'center' }}>
                                        <Chip 
                                          label={empleado.NivelProblema} 
                                          color={empleado.NivelProblema === 'Crítico' ? 'error' : 
                                                 empleado.NivelProblema === 'Alto' ? 'warning' : 
                                                 empleado.NivelProblema === 'Moderado' ? 'info' : 'success'}
                                          size="small"
                                          sx={{ fontWeight: 500 }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                    
                                    {/* Fila expandida con detalles de tardanzas para empleados con tardanzas */}
                                    {empleado.TotalTardanzas > 0 && empleadoExpandido === empleado.DNI && (
                                      <TableRow>
                                        <TableCell colSpan={vistaAgrupada ? 7 : 8} sx={{ backgroundColor: '#fef2f2', p: 0, border: 'none' }}>
                                          <Box sx={{ p: 2, pl: 8 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#7f1d1d', fontWeight: 600 }}>
                                              📋 Historial detallado de tardanzas para {empleado.NombreCompleto}:
                                            </Typography>
                                            
                                            {detallesTardanzas[empleado.DNI] && detallesTardanzas[empleado.DNI].length > 0 ? (
                                              <Table size="small" sx={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                                                <TableHead>
                                                  <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Fecha</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Horario</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Marcación</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Minutos</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Tiempo</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Nivel</TableCell>
                                                  </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                  {detallesTardanzas[empleado.DNI].map((detalle, detIndex) => (
                                                    <TableRow key={`${detalle.DNI}-${detalle.Fecha}-${detIndex}`}>
                                                      <TableCell sx={{ fontSize: '0.875rem' }}>{formatearFecha(detalle.Fecha)}</TableCell>
                                                      <TableCell sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{detalle.HorarioEntrada}</TableCell>
                                                      <TableCell sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{detalle.MarcacionReal}</TableCell>
                                                      <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#dc2626' }}>
                                                        {detalle.MinutosTardanza}
                                                      </TableCell>
                                                      <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#dc2626' }}>
                                                        {minutosAHoras(detalle.MinutosTardanza)}
                                                      </TableCell>
                                                      <TableCell>
                                                        <Chip 
                                                          label={detalle.NivelTardanza} 
                                                          color={getNivelColor(detalle.NivelTardanza)}
                                                          size="small"
                                                          sx={{ fontSize: '0.75rem' }}
                                                        />
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            ) : (
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CircularProgress size={20} />
                                                <Typography variant="body2" color="text.secondary">
                                                  Cargando detalles...
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                    </React.Fragment>
                                  ))
                                }
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    });
                  })()
                ) : (
                  // Vista normal por empleados
                  datosPaginados.map((empleado, index) => {
                  const isExpanded = empleadoExpandido === empleado.DNI;
                  const detalles = detallesTardanzas[empleado.DNI] || [];
                  
                  return (
                    <React.Fragment key={empleado.DNI}>
                      {/* Fila principal del empleado (resumen) */}
                      <TableRow 
                        hover
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? '#fef2f2' : 'transparent',
                          '&:hover': { 
                            backgroundColor: isExpanded ? '#fee2e2' : '#f8fafc' 
                          } 
                        }}
                        onClick={() => handleToggleEmpleado(empleado.DNI)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isExpanded ? (
                              <ExpandLessIcon sx={{ color: '#dc2626' }} />
                            ) : (
                              <ExpandMoreIcon sx={{ color: '#6b7280' }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {empleado.DNI}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {empleado.NombreCompleto}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>
                          {empleado.Campaña}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>
                          {empleado.Cargo}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            label={empleado.TotalTardanzas}
                            color="error"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>
                          {minutosAHoras(empleado.TotalMinutosTardanza)}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
                          {empleado.PromedioMinutosTardanza.toFixed(1)} min
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip 
                            label={empleado.NivelProblema} 
                            color={empleado.NivelProblema === 'Crítico' ? 'error' : 
                                   empleado.NivelProblema === 'Alto' ? 'warning' : 
                                   empleado.NivelProblema === 'Moderado' ? 'info' : 'success'}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                      </TableRow>

                      {/* Filas expandidas con el detalle */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={9} sx={{ backgroundColor: '#fef2f2', p: 0, border: 'none' }}>
                            <Box sx={{ p: 3 }}>
                              <Typography variant="subtitle2" sx={{ mb: 2, color: '#7f1d1d', fontWeight: 600 }}>
                                📋 Historial detallado de tardanzas para {empleado.NombreCompleto}:
                              </Typography>
                              
                              {detalles.length > 0 ? (
                                <Table size="small" sx={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Fecha</TableCell>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Horario</TableCell>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Marcación</TableCell>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Minutos</TableCell>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Tiempo</TableCell>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', backgroundColor: '#fee2e2' }}>Nivel</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {detalles.map((detalle, detIndex) => (
                                      <TableRow key={`${detalle.DNI}-${detalle.Fecha}-${detIndex}`}>
                                        <TableCell sx={{ fontSize: '0.875rem' }}>{formatearFecha(detalle.Fecha)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{detalle.HorarioEntrada}</TableCell>
                                        <TableCell sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{detalle.MarcacionReal}</TableCell>
                                        <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#dc2626' }}>
                                          {detalle.MinutosTardanza}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#dc2626' }}>
                                          {minutosAHoras(detalle.MinutosTardanza)}
                                        </TableCell>
                                        <TableCell>
                                          <Chip 
                                            label={detalle.NivelTardanza} 
                                            color={getNivelColor(detalle.NivelTardanza)}
                                            size="small"
                                            sx={{ fontSize: '0.75rem' }}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CircularProgress size={20} />
                                  <Typography variant="body2" color="text.secondary">
                                    Cargando detalles...
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Controles de Paginación */}
      {reporteData && (
        <Paper sx={{ 
          mt: 2,
          borderRadius: '16px',
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          p: 2
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            {/* Información de paginación */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {((paginaActual - 1) * elementosPorPagina) + 1} - {Math.min(paginaActual * elementosPorPagina, totalElementos)} de {totalElementos} empleados
              </Typography>
            </Box>

            {/* Selector de elementos por página */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Mostrar:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={elementosPorPagina}
                  onChange={(e) => cambiarElementosPorPagina(e.target.value)}
                  size="small"
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                por página
              </Typography>
            </Box>

            {/* Navegación de páginas */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => cambiarPagina(1)}
                disabled={paginaActual === 1}
                sx={{ minWidth: 40, p: 1 }}
              >
                {'<<'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                sx={{ minWidth: 40, p: 1 }}
              >
                {'<'}
              </Button>
              
              {/* Páginas visibles */}
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let pagina;
                if (totalPaginas <= 5) {
                  pagina = i + 1;
                } else if (paginaActual <= 3) {
                  pagina = i + 1;
                } else if (paginaActual >= totalPaginas - 2) {
                  pagina = totalPaginas - 4 + i;
                } else {
                  pagina = paginaActual - 2 + i;
                }
                
                return (
                  <Button
                    key={pagina}
                    variant={pagina === paginaActual ? "contained" : "outlined"}
                    size="small"
                    onClick={() => cambiarPagina(pagina)}
                    sx={{ 
                      minWidth: 40, 
                      p: 1,
                      backgroundColor: pagina === paginaActual ? '#dc2626' : 'transparent',
                      color: pagina === paginaActual ? 'white' : 'inherit',
                      '&:hover': {
                        backgroundColor: pagina === paginaActual ? '#b91c1c' : '#f3f4f6'
                      }
                    }}
                  >
                    {pagina}
                  </Button>
                );
              })}
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                sx={{ minWidth: 40, p: 1 }}
              >
                {'>'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => cambiarPagina(totalPaginas)}
                disabled={paginaActual === totalPaginas}
                sx={{ minWidth: 40, p: 1 }}
              >
                {'>>'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}


      {/* Mensaje cuando no hay datos */}
      {!loading && reporteData && reporteData.empleados.length === 0 && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: '16px',
          backgroundColor: '#f8fafc'
        }}>
          <ScheduleIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No se encontraron tardanzas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No hay registros de tardanzas para los filtros seleccionados
          </Typography>
        </Paper>
      )}

      {/* Mensaje inicial */}
      {!loading && !reporteData && !error && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: '16px',
          backgroundColor: '#f8fafc'
        }}>
          <ScheduleIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Reporte de Tardanzas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seleccione las fechas y filtros, luego haga clic en "Generar Reporte"
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ReporteTardanzas;
