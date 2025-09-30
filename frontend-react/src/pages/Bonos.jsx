import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Button,
  Grid,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AttachMoney as AttachMoneyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AccountBalance as AccountBalanceIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const Bonos = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para el empleado seleccionado
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [bonosEmpleado, setBonosEmpleado] = useState([]);
  
  // Estados para sueldos base
  const [sueldoBase, setSueldoBase] = useState(null);
  const [historialSueldos, setHistorialSueldos] = useState([]);
  const [estadisticasSueldos, setEstadisticasSueldos] = useState(null);
  
  // Estados para el formulario de bonos
  const [formData, setFormData] = useState({
    fechaBono: '',
    tipoBono: '',
    monto: ''
  });
  
  // Estados para el formulario de sueldo base
  const [formSueldoData, setFormSueldoData] = useState({
    montoMensual: '',
    fechaVigencia: ''
  });
  
  // Estados para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    bonoId: null,
    message: ''
  });
  
  // Estados para el diálogo de confirmación de sueldo
  const [confirmSueldoDialog, setConfirmSueldoDialog] = useState({
    open: false,
    sueldoId: null,
    message: ''
  });
  
  // Estados para tabs
  const [tabValue, setTabValue] = useState(0);
  
  // Estados para filtro de mes
  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth() + 1);
  const [añoFiltro, setAñoFiltro] = useState(new Date().getFullYear());
  
  // Opciones de tipos de bono
  const tiposBono = [
    'Bono de Movilidad',
    'Bono por Encargatura', 
    'Bono Variable',
    'Dinamica'
  ];
  
  // Opciones de meses
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
  
  // Generar opciones de años (últimos 5 años y próximos 2)
  const años = [];
  const añoActual = new Date().getFullYear();
  for (let i = añoActual - 5; i <= añoActual + 2; i++) {
    años.push(i);
  }
  
  // Cargar empleado seleccionado desde localStorage
  useEffect(() => {
    const dni = localStorage.getItem('empleadoDNI');
    const nombreEmpleado = localStorage.getItem('empleadoNombre');
    
    if (dni) {
      cargarEmpleadoCompleto(dni);
    }
  }, []);
  
  // Cargar datos completos del empleado
  const cargarEmpleadoCompleto = async (dni) => {
    try {
      const response = await api.get(`/empleados/${dni}`);
      if (response.data.success) {
        const empleado = response.data.data;
        setEmpleadoSeleccionado(empleado);
        await Promise.all([
          cargarBonosEmpleado(dni),
          cargarSueldoBase(dni),
          cargarHistorialSueldos(dni),
          cargarEstadisticasSueldos(dni)
        ]);
      } else {
        setError('Error al cargar datos del empleado');
      }
    } catch (error) {
      console.error('Error cargando empleado:', error);
      setError('Error al cargar datos del empleado');
    }
  };
  
  // Establecer fecha por defecto (28 del mes actual)
  useEffect(() => {
    const fechaActual = new Date();
    const dia28 = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 28);
    const fechaFormateada = dia28.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, fechaBono: fechaFormateada }));
  }, []);
  
  // Cargar bonos del empleado
  const cargarBonosEmpleado = useCallback(async (dni) => {
    if (!dni) return;
    
    try {
      const response = await api.get(`/bonos/empleado/${dni}`);
      if (response.data.success) {
        setBonosEmpleado(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando bonos:', error);
    }
  }, [api]);
  
  // Cargar sueldo base actual del empleado
  const cargarSueldoBase = useCallback(async (dni) => {
    if (!dni) return;
    
    try {
      const response = await api.get(`/sueldos/empleado/${dni}`);
      if (response.data.success) {
        setSueldoBase(response.data.data);
        if (response.data.data) {
          setFormSueldoData({
            montoMensual: response.data.data.MontoMensual || '',
            fechaVigencia: response.data.data.FechaVigencia ? 
              new Date(response.data.data.FechaVigencia).toISOString().split('T')[0] : ''
          });
        }
      }
    } catch (error) {
      console.error('Error cargando sueldo base:', error);
    }
  }, [api]);
  
  // Cargar historial de sueldos del empleado
  const cargarHistorialSueldos = useCallback(async (dni) => {
    if (!dni) return;
    
    try {
      const response = await api.get(`/sueldos/historial/${dni}`);
      if (response.data.success) {
        setHistorialSueldos(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando historial de sueldos:', error);
    }
  }, [api]);
  
  // Cargar estadísticas de sueldos del empleado
  const cargarEstadisticasSueldos = useCallback(async (dni) => {
    if (!dni) return;
    
    try {
      const response = await api.get(`/sueldos/estadisticas/${dni}`);
      if (response.data.success) {
        setEstadisticasSueldos(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas de sueldos:', error);
    }
  }, [api]);
  
  // Calcular estadísticas de bonos
  const calcularEstadisticas = useCallback(() => {
    if (!bonosEmpleado || bonosEmpleado.length === 0) {
      return {
        bonosEsteMes: 0,
        totalEsteMes: 0,
        bonosPorTipo: {},
        sueldoTotal: sueldoBase?.MontoMensual || 0
      };
    }
    
    const bonosFiltrados = bonosEmpleado.filter(bono => {
      const fechaBono = new Date(bono.Fecha);
      return fechaBono.getMonth() + 1 === mesFiltro && fechaBono.getFullYear() === añoFiltro;
    });
    
    const totalEsteMes = bonosFiltrados.reduce((sum, bono) => sum + parseFloat(bono.Monto), 0);
    
    // Agrupar bonos por tipo para el mes seleccionado
    const bonosPorTipo = {};
    bonosFiltrados.forEach(bono => {
      if (!bonosPorTipo[bono.TipoBono]) {
        bonosPorTipo[bono.TipoBono] = 0;
      }
      bonosPorTipo[bono.TipoBono] += parseFloat(bono.Monto);
    });
    
    // Calcular sueldo total (sueldo base + total bonos del mes seleccionado)
    const sueldoBaseActual = sueldoBase?.MontoMensual || 0;
    const sueldoTotal = sueldoBaseActual + totalEsteMes;
    
    return {
      bonosEsteMes: bonosFiltrados.length,
      totalEsteMes,
      bonosPorTipo,
      sueldoTotal
    };
  }, [bonosEmpleado, sueldoBase, mesFiltro, añoFiltro]);
  
  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Registrar nuevo bono
  const registrarBono = async () => {
    if (!empleadoSeleccionado) {
      setError('Debe seleccionar un empleado primero');
      return;
    }
    
    if (!formData.fechaBono || !formData.tipoBono || !formData.monto) {
      setError('Por favor complete todos los campos');
      return;
    }
    
    if (parseFloat(formData.monto) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const bonoData = {
        EmpleadoDNI: empleadoSeleccionado.DNI,
        Monto: parseFloat(formData.monto),
        Fecha: formData.fechaBono,
        TipoBono: formData.tipoBono
      };
      
      const response = await api.post('/bonos/registrar', bonoData);
      
      if (response.data.success) {
        setSuccess('Bono registrado exitosamente');
        // Limpiar formulario
        setFormData({
          fechaBono: new Date(new Date().getFullYear(), new Date().getMonth(), 28).toISOString().split('T')[0],
          tipoBono: '',
          monto: ''
        });
        // Recargar bonos
        cargarBonosEmpleado(empleadoSeleccionado.DNI);
      } else {
        setError(response.data.message || 'Error registrando bono');
      }
    } catch (error) {
      console.error('Error registrando bono:', error);
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };
  
  // Actualizar sueldo base
  const actualizarSueldoBase = async () => {
    if (!empleadoSeleccionado) {
      setError('Debe seleccionar un empleado primero');
      return;
    }
    
    if (!formSueldoData.montoMensual || !formSueldoData.fechaVigencia) {
      setError('Por favor complete todos los campos del sueldo base');
      return;
    }
    
    if (parseFloat(formSueldoData.montoMensual) <= 0) {
      setError('El monto del sueldo debe ser mayor a 0');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const sueldoData = {
        EmpleadoDNI: empleadoSeleccionado.DNI,
        MontoMensual: parseFloat(formSueldoData.montoMensual),
        FechaVigencia: formSueldoData.fechaVigencia
      };
      
      const response = await api.post('/sueldos/actualizar', sueldoData);
      
      if (response.data.success) {
        setSuccess('Sueldo base actualizado exitosamente');
        // Recargar datos de sueldos
        await Promise.all([
          cargarSueldoBase(empleadoSeleccionado.DNI),
          cargarHistorialSueldos(empleadoSeleccionado.DNI),
          cargarEstadisticasSueldos(empleadoSeleccionado.DNI)
        ]);
      } else {
        setError(response.data.message || 'Error actualizando sueldo base');
      }
    } catch (error) {
      console.error('Error actualizando sueldo base:', error);
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };
  
  // Abrir diálogo de confirmación para eliminar bono
  const abrirConfirmacionEliminar = (bonoId) => {
    setConfirmDialog({
      open: true,
      bonoId,
      message: '¿Está seguro de que desea eliminar este bono?'
    });
  };
  
  // Cerrar diálogo de confirmación
  const cerrarConfirmacion = () => {
    setConfirmDialog({
      open: false,
      bonoId: null,
      message: ''
    });
  };
  
  // Eliminar bono confirmado
  const eliminarBono = async () => {
    const { bonoId } = confirmDialog;
    
    try {
      const response = await api.delete(`/bonos/${bonoId}`);
      if (response.data.success) {
        setSuccess('Bono eliminado exitosamente');
        cargarBonosEmpleado(empleadoSeleccionado.DNI);
      } else {
        setError(response.data.message || 'Error eliminando bono');
      }
    } catch (error) {
      console.error('Error eliminando bono:', error);
      setError('Error eliminando bono');
    } finally {
      cerrarConfirmacion();
    }
  };
  
  // Abrir diálogo de confirmación para eliminar sueldo base
  const abrirConfirmacionEliminarSueldo = (sueldoId) => {
    setConfirmSueldoDialog({
      open: true,
      sueldoId,
      message: '¿Está seguro de que desea eliminar este sueldo base?'
    });
  };
  
  // Cerrar diálogo de confirmación de sueldo
  const cerrarConfirmacionSueldo = () => {
    setConfirmSueldoDialog({
      open: false,
      sueldoId: null,
      message: ''
    });
  };
  
  // Eliminar sueldo base confirmado
  const eliminarSueldoBase = async () => {
    const { sueldoId } = confirmSueldoDialog;
    
    setLoading(true);
    
    try {
      const response = await api.delete(`/sueldos/eliminar/${sueldoId}`);
      if (response.data.success) {
        setSuccess('Sueldo base eliminado exitosamente');
        // Recargar datos de sueldos
        await Promise.all([
          cargarSueldoBase(empleadoSeleccionado.DNI),
          cargarHistorialSueldos(empleadoSeleccionado.DNI),
          cargarEstadisticasSueldos(empleadoSeleccionado.DNI)
        ]);
      } else {
        setError(response.data.message || 'Error eliminando sueldo base');
      }
    } catch (error) {
      console.error('Error eliminando sueldo base:', error);
      setError('Error eliminando sueldo base');
    } finally {
      setLoading(false);
      cerrarConfirmacionSueldo();
    }
  };
  
  // Formatear fecha siguiendo el patrón de justificaciones
  const formatearFecha = (fecha) => {
    try {
      if (!fecha) return '';
      if (typeof fecha === 'string') {
        const solo = fecha.split('T')[0];
        const [y, m, d] = solo.split('-');
        const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 12, 0, 0, 0);
        if (!Number.isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }
      const dateObj = new Date(fecha);
      return Number.isNaN(dateObj.getTime())
        ? String(fecha)
        : dateObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return String(fecha);
    }
  };
  
  // Obtener color del chip según tipo de bono
  const obtenerColorChip = (tipoBono) => {
    const colores = {
      'Bono de Movilidad': 'primary',
      'Bono por Encargatura': 'secondary',
      'Bono Variable': 'success',
      'Dinamica': 'warning'
    };
    return colores[tipoBono] || 'default';
  };
  
  // Filtrar bonos por mes y año seleccionados
  const bonosFiltrados = useMemo(() => {
    if (!bonosEmpleado || bonosEmpleado.length === 0) {
      return [];
    }
    
    return bonosEmpleado.filter(bono => {
      const fechaBono = new Date(bono.Fecha);
      return fechaBono.getMonth() + 1 === mesFiltro && fechaBono.getFullYear() === añoFiltro;
    });
  }, [bonosEmpleado, mesFiltro, añoFiltro]);
  
  const estadisticas = calcularEstadisticas();
  
  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2 
              }}>
                <AttachMoneyIcon sx={{ fontSize: 28, color: '#f97316' }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#f97316' }}>
                  💰 Gestión de Bonos y Sueldos
                </Typography>
              </Box>
            </Box>
          }
          subtitle={
            empleadoSeleccionado && (
              <Typography variant="body1" sx={{ mt: 1, color: '#64748b' }}>
                {empleadoSeleccionado.Nombres} {empleadoSeleccionado.ApellidoPaterno} - DNI: {empleadoSeleccionado.DNI}
              </Typography>
            )
          }
          action={
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
            >
              Volver al Dashboard
            </Button>
          }
        />
      </Card>

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

      {/* Tabs para Bonos y Sueldos */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab 
              icon={<AttachMoneyIcon />} 
              label="Gestión de Bonos" 
              iconPosition="start"
            />
            <Tab 
              icon={<AccountBalanceIcon />} 
              label="Sueldo Base" 
              iconPosition="start"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Historial de Sueldos" 
              iconPosition="start"
            />
          </Tabs>
        </Box>
      </Card>

      {/* Contenido de los Tabs */}
      {empleadoSeleccionado ? (
        <>
          {/* Tab 0: Gestión de Bonos */}
          {tabValue === 0 && (
            <Box>
              {/* KPIs de Bonos */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
                  📊 Estadísticas de Bonos - {meses.find(m => m.value === mesFiltro)?.label} {añoFiltro}
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Bonos Este Mes */}
                  <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ textAlign: 'center', p: 1.8, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
                        {estadisticas.bonosEsteMes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bonos del Mes
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {/* Total Este Mes */}
                  <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ textAlign: 'center', p: 1.8, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
                        S/ {estadisticas.totalEsteMes.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total del Mes
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {/* Sueldo Base */}
                  <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ textAlign: 'center', p: 1.8, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
                        S/ {sueldoBase?.MontoMensual?.toFixed(2) || '0.00'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sueldo Base
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {/* Sueldo Total */}
                  <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ textAlign: 'center', p: 1.8, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
                        S/ {estadisticas.sueldoTotal.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sueldo Total
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Formulario de Bonos */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
                  💰 Registrar Nuevo Bono
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Fecha del Bono"
                      type="date"
                      value={formData.fechaBono}
                      onChange={(e) => setFormData({ ...formData, fechaBono: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Bono</InputLabel>
                      <Select
                        value={formData.tipoBono}
                        onChange={(e) => setFormData({ ...formData, tipoBono: e.target.value })}
                        label="Tipo de Bono"
                      >
                        {tiposBono.map((tipo) => (
                          <MenuItem key={tipo} value={tipo}>
                            {tipo}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Monto (S/)"
                      type="number"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={registrarBono}
                      disabled={loading}
                      sx={{ height: '56px', backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}
                    >
                      {loading ? 'Registrando...' : 'Registrar Bono'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Filtro de Mes y Año */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
                  🔍 Filtrar por Mes y Año
                </Typography>
                
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Mes</InputLabel>
                      <Select
                        value={mesFiltro}
                        onChange={(e) => setMesFiltro(e.target.value)}
                        label="Mes"
                      >
                        {meses.map((mes) => (
                          <MenuItem key={mes.value} value={mes.value}>
                            {mes.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Año</InputLabel>
                      <Select
                        value={añoFiltro}
                        onChange={(e) => setAñoFiltro(e.target.value)}
                        label="Año"
                      >
                        {años.map((año) => (
                          <MenuItem key={año} value={año}>
                            {año}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        {bonosFiltrados.length} bonos
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        encontrados
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Tabla de Bonos */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
                  📋 Historial de Bonos - {meses.find(m => m.value === mesFiltro)?.label} {añoFiltro}
                </Typography>
                
                {bonosFiltrados.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                          <TableCell><strong>Fecha</strong></TableCell>
                          <TableCell><strong>Tipo de Bono</strong></TableCell>
                          <TableCell><strong>Monto</strong></TableCell>
                          <TableCell><strong>Acciones</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bonosFiltrados.map((bono) => (
                          <TableRow key={bono.BonoID} hover>
                            <TableCell>
                              {new Date(bono.Fecha).toLocaleDateString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={bono.TipoBono}
                                color={obtenerColorChip(bono.TipoBono)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                                S/ {parseFloat(bono.Monto).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Eliminar bono">
                                <IconButton
                                  size="small"
                                  onClick={() => abrirConfirmacionEliminar(bono.BonoID)}
                                  sx={{ color: '#ef4444' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      📭 No hay bonos registrados para {meses.find(m => m.value === mesFiltro)?.label} {añoFiltro}
                    </Typography>
                    <Typography color="text.secondary">
                      Cambie el filtro de mes/año o registre un nuevo bono usando el formulario de arriba
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          )}

          {/* Tab 1: Sueldo Base */}
          {tabValue === 1 && (
            <Box>
              {/* Información del Sueldo Base Actual */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
                  💰 Sueldo Base Actual
                </Typography>
                
                {sueldoBase ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                          S/ {sueldoBase.MontoMensual?.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Monto Mensual
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 'bold' }}>
                          {sueldoBase.FechaVigencia ? new Date(sueldoBase.FechaVigencia).toLocaleDateString('es-ES') : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fecha de Vigencia
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                          {estadisticasSueldos?.totalCambios || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cambios Realizados
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Alert severity="info">
                    No hay sueldo base registrado para este empleado.
                  </Alert>
                )}
              </Paper>

              {/* Formulario para Actualizar Sueldo Base */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
                  ✏️ Actualizar Sueldo Base
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Monto Mensual (S/)"
                      type="number"
                      value={formSueldoData.montoMensual}
                      onChange={(e) => setFormSueldoData({ ...formSueldoData, montoMensual: e.target.value })}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Fecha de Vigencia"
                      type="date"
                      value={formSueldoData.fechaVigencia}
                      onChange={(e) => setFormSueldoData({ ...formSueldoData, fechaVigencia: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={actualizarSueldoBase}
                      disabled={loading}
                      sx={{ height: '56px', backgroundColor: '#f97316', '&:hover': { backgroundColor: '#ea580c' } }}
                    >
                      {loading ? 'Actualizando...' : 'Actualizar Sueldo'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Estadísticas de Sueldos */}
              {estadisticasSueldos && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
                    📊 Estadísticas de Sueldos
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                          S/ {estadisticasSueldos.promedioSueldo?.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Promedio
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                          S/ {estadisticasSueldos.sueldoMaximo?.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Máximo
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>
                          S/ {estadisticasSueldos.sueldoMinimo?.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mínimo
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h5" color="info.main" sx={{ fontWeight: 'bold' }}>
                          {estadisticasSueldos.totalCambios}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Cambios
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          )}

          {/* Tab 2: Historial de Sueldos */}
          {tabValue === 2 && (
            <Box>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
                  📋 Historial de Sueldos Base
                </Typography>
                
                {historialSueldos.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                          <TableCell><strong>Fecha de Vigencia</strong></TableCell>
                          <TableCell><strong>Monto Mensual</strong></TableCell>
                          <TableCell><strong>Estado</strong></TableCell>
                          <TableCell><strong>Acciones</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historialSueldos.map((sueldo, index) => (
                          <TableRow key={sueldo.SueldoID || index} hover>
                            <TableCell>
                              {sueldo.FechaVigencia ? new Date(sueldo.FechaVigencia).toLocaleDateString('es-ES') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                S/ {parseFloat(sueldo.MontoMensual).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={index === 0 ? 'Actual' : 'Anterior'}
                                color={index === 0 ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Eliminar sueldo base">
                                <IconButton
                                  size="small"
                                  onClick={() => abrirConfirmacionEliminarSueldo(sueldo.SueldoID)}
                                  sx={{ color: '#ef4444' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      📭 No hay historial de sueldos
                    </Typography>
                    <Typography color="text.secondary">
                      Registre el primer sueldo base en la pestaña "Sueldo Base"
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </>
      ) : (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ Debe seleccionar un empleado desde el Dashboard para gestionar sus bonos y sueldos
        </Alert>
      )}

      {/* Diálogo de confirmación para eliminar bono */}
      <Dialog
        open={confirmDialog.open}
        onClose={cerrarConfirmacion}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#f97316', fontWeight: 600 }}>
          🗑️ Confirmar Eliminación de Bono
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.message}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={cerrarConfirmacion}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={eliminarBono}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar sueldo base */}
      <Dialog
        open={confirmSueldoDialog.open}
        onClose={cerrarConfirmacionSueldo}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#f97316', fontWeight: 600 }}>
          🗑️ Confirmar Eliminación de Sueldo Base
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmSueldoDialog.message}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer y afectará las estadísticas del empleado.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={cerrarConfirmacionSueldo}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={eliminarSueldoBase}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bonos;