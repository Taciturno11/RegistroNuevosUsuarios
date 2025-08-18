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
  TextField
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
  const [success, setSuccess] = useState('');
  const [reporteData, setReporteData] = useState(null);
  
  // Estados para la funcionalidad expandible
  const [empleadoExpandido, setEmpleadoExpandido] = useState(null);
  const [detallesTardanzas, setDetallesTardanzas] = useState({});
  
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
  const [cargo, setCargo] = useState('todos');
  
  // Estados para opciones de filtros
  const [campaniasDisponibles, setCampaniasDisponibles] = useState([]);
  const [cargosDisponibles, setCargosDisponibles] = useState([]);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina, setElementosPorPagina] = useState(10);
  const [totalElementos, setTotalElementos] = useState(0);

  // Verificar permisos al montar
  useEffect(() => {
    console.log('🔍 ReporteTardanzas: useEffect ejecutándose, user:', user);
    
    // Solo analistas y el creador pueden acceder
    if (user?.role !== 'analista' && user?.dni !== '73766815') {
      console.log('❌ ReporteTardanzas: Sin permisos, redirigiendo');
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
        setCargo(filtrosRestaurados.cargo);
      }

      // Restaurar datos del reporte
      const reporteGuardado = localStorage.getItem('reporteTardanzas_datos');
      if (reporteGuardado) {
        const reporteRestaurado = JSON.parse(reporteGuardado);
        setReporteData(reporteRestaurado);
        setSuccess('🔄 Datos del reporte restaurados desde la sesión anterior');
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
        cargo
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
  }, [fechaInicio, fechaFin, campania, cargo, reporteData, paginaActual, elementosPorPagina, totalElementos, empleadoExpandido, detallesTardanzas]);

  const cargarOpcionesFiltros = async () => {
    try {
      // Usar los mismos endpoints que el reporte de asistencias
      const [campaniasRes, cargosRes] = await Promise.all([
        api.get('/reportes/campanias-disponibles'),
        api.get('/reportes/cargos-disponibles')
      ]);

      if (campaniasRes.data.success) {
        setCampaniasDisponibles(campaniasRes.data.data);
      }
      
      if (cargosRes.data.success) {
        setCargosDisponibles(cargosRes.data.data);
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
      
      if (cargo && cargo !== 'todos') {
        url += `&cargo=${cargo}`;
      }
      
      const response = await api.get(url);
      
      if (response.data.success) {
        console.log('🔍 Datos del reporte RESUMIDO:', response.data.data);
        console.log('📊 Total empleados recibidos:', response.data.data.empleados.length);
        console.log('👥 Total tardanzas:', response.data.data.metadata.totalTardanzas);
        
        // Debug: mostrar todos los empleados recibidos
        if (response.data.data.empleados && response.data.data.empleados.length > 0) {
          console.log('📋 Lista de empleados resumidos:');
          response.data.data.empleados.forEach((emp, index) => {
            console.log(`  ${index + 1}. ${emp.NombreCompleto} - ${emp.Campaña} - ${emp.Cargo} - ${emp.TotalTardanzas} tardanzas`);
          });
        }
        
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
    setCargo('todos');
    setPaginaActual(1);
    setReporteData(null);
    setError('');
    setSuccess('');
    // Limpiar también el localStorage
    limpiarEstadoPersistente();
  };

  // Cambiar elementos por página
  const cambiarElementosPorPagina = useCallback((nuevosElementos) => {
    setElementosPorPagina(nuevosElementos);
    setPaginaActual(1); // Resetear a la primera página
  }, []);

  // Función para obtener detalles de tardanzas de un empleado específico
  const obtenerDetallesEmpleado = async (dni) => {
    try {
      let url = `/tardanzas/reporte?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      
      if (campania && campania !== 'todas') {
        url += `&campania=${campania}`;
      }
      
      if (cargo && cargo !== 'todos') {
        url += `&cargo=${cargo}`;
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
            {reporteData && (
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  backgroundColor: '#10b981',
                  mr: 1,
                  animation: 'pulse 2s infinite'
                }} />
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                  Datos persistentes
                </Typography>
              </Box>
            )}
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
            <Grid item xs={2}>
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
            
            <Grid item xs={2}>
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

            <Grid item xs={2}>
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
              <FormControl fullWidth size="small">
                <InputLabel>Cargo</InputLabel>
                <Select
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  label="Cargo"
                >
                  <MenuItem value="todos">Todos los Cargos</MenuItem>
                  {cargosDisponibles.map((c) => (
                    <MenuItem key={c.CargoID} value={c.CargoID}>
                      {c.NombreCargo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={2.5}>
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
            
            <Grid item xs={1}>
              <Button
                variant="outlined"
                onClick={limpiarFiltros}
                disabled={loading}
                fullWidth
                title="Limpiar solo los filtros, mantiene los datos del reporte"
                sx={{
                  borderColor: '#6b7280',
                  color: '#6b7280',
                  '&:hover': {
                    borderColor: '#374151',
                    backgroundColor: '#f9fafb'
                  }
                }}
              >
                Limpiar
              </Button>
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
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
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
                    minWidth: 80
                  }}>
                    DNI
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 200
                  }}>
                    Empleado
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 120
                  }}>
                    Campaña
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 100
                  }}>
                    Cargo
                  </TableCell>
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
                    Total Minutos
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#7f1d1d',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 100,
                    textAlign: 'center'
                  }}>
                    Promedio
                  </TableCell>
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
                {datosPaginados.map((empleado, index) => {
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
                          {empleado.TotalMinutosTardanza}
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
                                          {detalle.TiempoTardanza}
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
                })}
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
