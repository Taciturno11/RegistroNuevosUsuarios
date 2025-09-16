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
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const ReporteAsistencias = () => {
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
  
  // Estados para filtros
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [campania, setCampania] = useState('todas');
  const [cargo, setCargo] = useState('todos');
  const [supervisor, setSupervisor] = useState('todos');
  
  // Estados para opciones de filtros
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [campaniasDisponibles, setCampaniasDisponibles] = useState([]);
  const [cargosDisponibles, setCargosDisponibles] = useState([]);
  const [supervisoresDisponibles, setSupervisoresDisponibles] = useState([]);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina, setElementosPorPagina] = useState(10);
  const [totalElementos, setTotalElementos] = useState(0);

  // Verificar permisos al montar
  useEffect(() => {
    // Admin o usuarios con vista de Reporte de Asistencias pueden acceder
    if (user?.role !== 'admin' && (!user?.vistas || !user.vistas.includes('Reporte de Asistencias'))) {
      console.log('❌ ReporteAsistencias: Sin permisos, redirigiendo. Role:', user?.role, 'Vistas:', user?.vistas);
      navigate('/');
      return;
    }
    console.log('✅ ReporteAsistencias: Permisos OK, cargando datos');
    
    cargarOpcionesFiltros();
    restaurarEstadoPersistente();
    // Solo generar reporte si no hay datos restaurados
    if (!localStorage.getItem('reporteAsistencias_datos')) {
      generarReporte();
    }
  }, [user, navigate]);

  // Función para restaurar estado persistente desde localStorage
  const restaurarEstadoPersistente = () => {
    try {
      // Restaurar filtros
      const filtrosGuardados = localStorage.getItem('reporteAsistencias_filtros');
      if (filtrosGuardados) {
        const filtrosRestaurados = JSON.parse(filtrosGuardados);
        setMes(filtrosRestaurados.mes);
        setAnio(filtrosRestaurados.anio);
        setCampania(filtrosRestaurados.campania);
        setCargo(filtrosRestaurados.cargo);
        setSupervisor(filtrosRestaurados.supervisor || 'todos');
      }

      // Restaurar datos del reporte
      const reporteGuardado = localStorage.getItem('reporteAsistencias_datos');
      if (reporteGuardado) {
        const reporteRestaurado = JSON.parse(reporteGuardado);
        setReporteData(reporteRestaurado);
      }

      // Restaurar paginación
      const paginacionGuardada = localStorage.getItem('reporteAsistencias_paginacion');
      if (paginacionGuardada) {
        const paginacionRestaurada = JSON.parse(paginacionGuardada);
        setPaginaActual(paginacionRestaurada.paginaActual);
        setElementosPorPagina(paginacionRestaurada.elementosPorPagina);
        setTotalElementos(paginacionRestaurada.totalElementos);
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
      localStorage.setItem('reporteAsistencias_filtros', JSON.stringify({
        mes,
        anio,
        campania,
        cargo,
        supervisor
      }));
      
      // Guardar datos del reporte
      if (reporteData) {
        localStorage.setItem('reporteAsistencias_datos', JSON.stringify(reporteData));
      }
      
      // Guardar paginación
      localStorage.setItem('reporteAsistencias_paginacion', JSON.stringify({
        paginaActual,
        elementosPorPagina,
        totalElementos
      }));
    } catch (error) {
      console.error('Error guardando estado persistente:', error);
    }
  };

  // Función para limpiar estado persistente
  const limpiarEstadoPersistente = () => {
    localStorage.removeItem('reporteAsistencias_filtros');
    localStorage.removeItem('reporteAsistencias_datos');
    localStorage.removeItem('reporteAsistencias_paginacion');
  };

  // Guardar estado cada vez que cambien los datos importantes
  useEffect(() => {
    guardarEstadoPersistente();
  }, [mes, anio, campania, cargo, supervisor, reporteData, paginaActual, elementosPorPagina, totalElementos]);

  const cargarOpcionesFiltros = async () => {
    try {
      // Cargar años, campañas, cargos y supervisores en paralelo
      const [aniosRes, campaniasRes, cargosRes, supervisoresRes] = await Promise.all([
        api.get('/reportes/anios-disponibles'),
        api.get('/reportes/campanias-disponibles'),
        api.get('/reportes/cargos-disponibles'),
        api.get('/reportes/supervisores-disponibles')
      ]);

      if (aniosRes.data.success) {
        setAniosDisponibles(aniosRes.data.data);
      }
      
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
      // Si no se pueden cargar, usar valores por defecto
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
      let url = `/reportes/asistencias?mes=${mes}&anio=${anio}`;
      
      if (campania && campania !== 'todas') {
        url += `&campania=${campania}`;
      }
      
      if (cargo && cargo !== 'todos') {
        url += `&cargo=${cargo}`;
      }
      
      if (supervisor && supervisor !== 'todos') {
        url += `&supervisor=${supervisor}`;
      }
      
      const response = await api.get(url);
      
      if (response.data.success) {
        console.log('🔍 Datos del reporte recibidos:', response.data.data);
        setReporteData(response.data.data);
        setTotalElementos(response.data.data.empleados.length);
        setPaginaActual(1); // Resetear a la primera página
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

  const handleFiltroChange = useCallback(() => {
    setPaginaActual(1); // Resetear a la primera página
    generarReporte();
  }, [mes, anio, campania, cargo, supervisor]);

  const handleCampaniaChange = useCallback((e) => {
    setCampania(e.target.value);
  }, []);

  const handleCargoChange = useCallback((e) => {
    setCargo(e.target.value);
  }, []);

  const handleSupervisorChange = useCallback((e) => {
    setSupervisor(e.target.value);
  }, []);

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

  const getEstadoColor = (estado) => {
    if (!estado) return 'default';
    
    switch (estado.toString().toUpperCase()) {
      // Estados de asistencia positivos
      case 'A': return 'success';      // Asistió/Presente
      case 'P': return 'success';      // Presente
      
      // Estados de tardanza
      case 'T': return 'warning';      // Tardanza
      
      // Estados de falta
      case 'F': return 'error';        // Falta
      case 'FI': return 'error';       // Falta Injustificada
      case 'FJ': return 'info';        // Falta Justificada
      
      // Estados de descanso/vacaciones
      case 'D': return 'secondary';    // Descanso
      case 'V': return 'secondary';    // Vacaciones
      case 'DC': return 'secondary';   // Día de Compensación
      
      // Estados especiales
      case 'J': return 'info';         // Justificado
      case 'B': return 'primary';      // Otros (podría ser Break, Baja, etc.)
      case 'L': return 'info';         // Licencia
      case 'M': return 'info';         // Médico
      case 'S': return 'warning';      // Suspensión
      
      // Por defecto
      default: return 'default';
    }
  };

  const getEstadoLabel = (estado) => {
    if (!estado) return '-';
    return estado.toString();
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
      p: 2
    }}>
      {/* Header Principal con Título, KPIs y Filtros */}
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
          backgroundColor: '#0f172a',
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
            <TableChartIcon />
            Reporte de Asistencias
          </Typography>
          
          <Box sx={{ width: 80 }} />
        </Box>

        {/* Barra de KPIs */}
        {reporteData && (
          <Box sx={{ 
            backgroundColor: '#f8fafc', 
            p: 2,
            borderBottom: '1px solid #e5e7eb'
          }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <PeopleIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                      {reporteData.metadata.totalEmpleados}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Empleados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 20, color: '#059669' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                      {reporteData.metadata.diasDelMes}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Días del Mes
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 20, color: '#d97706' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                      {meses.find(m => m.value === reporteData.metadata.mes)?.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Mes Reportado
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 20, color: '#7c3aed' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                      {reporteData.metadata.anio}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Año Reportado
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Barra de Filtros */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={1.5}>
              <FormControl fullWidth size="small">
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
            
            <Grid item xs={1.5}>
              <FormControl fullWidth size="small">
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

            <Grid item xs={2}>
              <FormControl fullWidth size="small" className="reporte-asistencias-selector">
                <InputLabel>Campaña</InputLabel>
                <Select
                  value={campania}
                  onChange={handleCampaniaChange}
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

            <Grid item xs={2}>
              <FormControl fullWidth size="small" className="reporte-asistencias-selector">
                <InputLabel>Cargo</InputLabel>
                <Select
                  value={cargo}
                  onChange={handleCargoChange}
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
              <FormControl fullWidth size="small" className="reporte-asistencias-selector">
                <InputLabel>Supervisor</InputLabel>
                <Select
                  value={supervisor}
                  onChange={handleSupervisorChange}
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
            
            <Grid item xs={2.5}>
              <Button
                variant="contained"
                onClick={handleFiltroChange}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
                  }
                }}
              >
                {loading ? 'Generando...' : 'Generar Reporte'}
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

      {/* Tabla de reporte - Inmediatamente después del header */}
      {reporteData && (
        <Paper sx={{ 
          borderRadius: '16px',
          backgroundColor: 'white',
          boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
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
                {datosPaginados.map((empleado, index) => (
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
                        
                        // Debug: log del estado para el primer empleado
                        if (empleado.DNI === reporteData.empleados[0]?.DNI) {
                          console.log(`📅 ${fecha}: "${estado}" (tipo: ${typeof estado})`);
                        }
                        
                        return (
                          <TableCell 
                            key={fecha}
                            sx={{ 
                              textAlign: 'center',
                              padding: '4px',
                              minWidth: 50
                            }}
                          >
                            {estado && estado !== null && estado !== '' ? (
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
                      backgroundColor: pagina === paginaActual ? '#3b82f6' : 'transparent',
                      color: pagina === paginaActual ? 'white' : 'inherit',
                      '&:hover': {
                        backgroundColor: pagina === paginaActual ? '#2563eb' : '#f3f4f6'
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

      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>
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
            Seleccione los filtros y haga clic en "Generar Reporte"
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ReporteAsistencias;