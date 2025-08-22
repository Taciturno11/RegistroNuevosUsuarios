import React, { useState, useEffect, useCallback } from 'react';
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
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AttachMoney as AttachMoneyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
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
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    fechaBono: '',
    tipoBono: '',
    monto: ''
  });
  
  // Estados para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    bonoId: null,
    message: ''
  });
  
  // Opciones de tipos de bono
  const tiposBono = [
    'Bono de Movilidad',
    'Bono por Encargatura', 
    'Bono Variable',
    'Dinamica'
  ];
  
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
        cargarBonosEmpleado(dni);
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
  
  // Calcular estadísticas de bonos
  const calcularEstadisticas = useCallback(() => {
    if (!bonosEmpleado || bonosEmpleado.length === 0) {
      return {
        bonosEsteMes: 0,
        totalEsteMes: 0,
        bonosPorTipo: {},
        sueldoTotal: empleadoSeleccionado?.SueldoBase || 0
      };
    }
    
    const mesActual = new Date().getMonth() + 1;
    const añoActual = new Date().getFullYear();
    
    const bonosEsteMes = bonosEmpleado.filter(bono => {
      const fechaBono = new Date(bono.Fecha);
      return fechaBono.getMonth() + 1 === mesActual && fechaBono.getFullYear() === añoActual;
    });
    
    const totalEsteMes = bonosEsteMes.reduce((sum, bono) => sum + parseFloat(bono.Monto), 0);
    
    // Agrupar bonos por tipo para este mes
    const bonosPorTipo = {};
    bonosEsteMes.forEach(bono => {
      if (!bonosPorTipo[bono.TipoBono]) {
        bonosPorTipo[bono.TipoBono] = 0;
      }
      bonosPorTipo[bono.TipoBono] += parseFloat(bono.Monto);
    });
    
    // Calcular sueldo total (sueldo base + total bonos del mes)
    const sueldoBase = empleadoSeleccionado?.SueldoBase || 0;
    const sueldoTotal = sueldoBase + totalEsteMes;
    
    return {
      bonosEsteMes: bonosEsteMes.length,
      totalEsteMes,
      bonosPorTipo,
      sueldoTotal
    };
  }, [bonosEmpleado, empleadoSeleccionado]);
  
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
                  💰 Gestión de Bonos
                </Typography>
              </Box>
            </Box>
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

      {/* Información del Empleado */}
      {empleadoSeleccionado ? (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8fafc' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#f97316' }}>
            👤 Información del Empleado
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">DNI:</Typography>
              <Typography variant="h6" fontWeight="bold">{empleadoSeleccionado.DNI}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Nombre:</Typography>
              <Typography variant="h6" fontWeight="bold">
                {empleadoSeleccionado.Nombres} {empleadoSeleccionado.ApellidoPaterno} {empleadoSeleccionado.ApellidoMaterno}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">Cargo:</Typography>
              <Typography variant="h6" fontWeight="bold">{empleadoSeleccionado.NombreCargo}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Campaña:</Typography>
              <Typography variant="h6" fontWeight="bold">{empleadoSeleccionado.NombreCampaña}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Estado:</Typography>
              <Chip 
                label={empleadoSeleccionado.EstadoEmpleado} 
                color={empleadoSeleccionado.EstadoEmpleado === 'Activo' ? 'success' : 'error'}
                sx={{ fontWeight: 'bold' }}
              />
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ Debe seleccionar un empleado desde el Dashboard para gestionar sus bonos
        </Alert>
      )}

      {/* KPIs de Bonos */}
      {empleadoSeleccionado && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
            📊 Estadísticas de Bonos
          </Typography>
          
                     <Grid container spacing={3}>
             {/* Bonos Este Mes */}
             <Grid item xs={12} sm={6} md={2}>
               <Box sx={{ textAlign: 'center', p: 1.8, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                 <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
                   {estadisticas.bonosEsteMes}
                 </Typography>
                 <Typography variant="body2" color="text.secondary">
                   Bonos Este Mes
                 </Typography>
               </Box>
             </Grid>
             
             {/* Sueldo Base */}
             <Grid item xs={12} sm={6} md={2}>
               <Box sx={{ textAlign: 'center', p: 1.8, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                 <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
                   S/ {empleadoSeleccionado.SueldoBase?.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                 </Typography>
                 <Typography variant="body2" color="text.secondary">
                   Sueldo Base
                 </Typography>
               </Box>
             </Grid>
             
             {/* KPIs dinámicos por tipo de bono */}
             {Object.entries(estadisticas.bonosPorTipo).map(([tipoBono, monto], index) => (
               <Grid item xs={12} sm={6} md={2} key={tipoBono}>
                 <Box sx={{ textAlign: 'center', p: 1.8, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                   <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
                     S/ {monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </Typography>
                   <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                     {tipoBono}
                   </Typography>
                 </Box>
               </Grid>
             ))}
             
             {/* Sueldo Total - Posicionado al final */}
             <Grid item xs={12} sm={6} md={2} sx={{ ml: 'auto' }}>
               <Box sx={{ textAlign: 'center', p: 1.8, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                 <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
                   S/ {estadisticas.sueldoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </Typography>
                 <Typography variant="body2" color="text.secondary">
                   Sueldo Total
                 </Typography>
               </Box>
             </Grid>
           </Grid>
        </Paper>
      )}

      {/* Formulario de Registro de Bono */}
      {empleadoSeleccionado && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
            ➕ Registrar Nuevo Bono
          </Typography>
          
          <Grid container spacing={3} alignItems="end">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Fecha de Bono"
                type="date"
                value={formData.fechaBono}
                onChange={(e) => handleInputChange('fechaBono', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
                                      <Grid item xs={12} md={3}>
               <FormControl sx={{ width: '14rem' }}>
                 <InputLabel>Tipo de Bono</InputLabel>
                 <Select
                   value={formData.tipoBono}
                   onChange={(e) => handleInputChange('tipoBono', e.target.value)}
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
                 sx={{ width: '10rem' }}
                 label="Monto (S/)"
                 type="number"
                 value={formData.monto}
                 onChange={(e) => handleInputChange('monto', e.target.value)}
                 inputProps={{ min: 0, step: 0.01 }}
                 InputProps={{
                   startAdornment: <Typography sx={{ mr: 1 }}>S/</Typography>
                 }}
               />
             </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                onClick={registrarBono}
                disabled={loading}
                sx={{ 
                  backgroundColor: '#f97316', 
                  '&:hover': { backgroundColor: '#ea580c' },
                  height: 56
                }}
                fullWidth
              >
                {loading ? 'Registrando...' : 'Registrar Bono'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabla de Bonos Existentes */}
      {empleadoSeleccionado && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#f97316' }}>
            📋 Historial de Bonos
          </Typography>
          
          {bonosEmpleado.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tipo de Bono</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Monto</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bonosEmpleado.map((bono) => (
                    <TableRow key={bono.BonoID} hover>
                      <TableCell>{formatearFecha(bono.Fecha)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={bono.TipoBono} 
                          color={obtenerColorChip(bono.TipoBono)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          S/ {parseFloat(bono.Monto).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                📭 No hay bonos registrados
              </Typography>
              <Typography color="text.secondary">
                Registre el primer bono usando el formulario de arriba
              </Typography>
            </Box>
                     )}
         </Paper>
       )}
       
       {/* Diálogo de confirmación para eliminar bono */}
       <Dialog
         open={confirmDialog.open}
         onClose={cerrarConfirmacion}
         maxWidth="sm"
         fullWidth
       >
         <DialogTitle sx={{ color: '#f97316', fontWeight: 600 }}>
           🗑️ Confirmar Eliminación
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
             sx={{ 
               backgroundColor: '#ef4444',
               '&:hover': { backgroundColor: '#dc2626' }
             }}
           >
             Eliminar
           </Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 };

export default Bonos;
