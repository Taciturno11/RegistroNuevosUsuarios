import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Today as TodayIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Info as InfoIcon,
  CalendarMonth as CalendarMonthIcon,
  AccessTime as AccessTimeIcon,
  ListAlt as ListAltIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Excepciones = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [editingExcepcion, setEditingExcepcion] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedExcepcion, setSelectedExcepcion] = useState(null);
  
  // Catálogo de horarios disponibles (Horarios_Base)
  const [horarios, setHorarios] = useState([]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    horarioID: '', // null ⇒ descanso
    motivo: ''
  });

  // Lista de excepciones
  const [excepciones, setExcepciones] = useState([]);
  const [horarioBase, setHorarioBase] = useState('');
  const [fechaActual, setFechaActual] = useState('');

  // Contexto empleado desde localStorage
  const dni = typeof window !== 'undefined' ? localStorage.getItem('empleadoDNI') : '';
  const nombreEmpleado = typeof window !== 'undefined' ? localStorage.getItem('empleadoNombre') : '';

  // Carga inicial
  useEffect(() => {
    const init = async () => {
      if (!dni) {
        setError('No se ha seleccionado un empleado. Regrese al dashboard.');
        return;
      }
      await cargarHorarios();
      await cargarExcepciones(dni);
      await cargarHorarioBase();
      setFechaActual(new Date().toLocaleDateString('es-PE'));
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarHorarios = async () => {
    try {
      const { data } = await api.get('/excepciones/horarios');
      const lista = data?.data || data || [];
      setHorarios(lista);
    } catch (err) {
      console.error('Error cargando horarios:', err);
      setHorarios([]);
    }
  };

  const cargarExcepciones = async (dniEmpleado) => {
    try {
      const { data } = await api.get(`/excepciones/${dniEmpleado}`);
      const lista = data?.data?.excepciones || data?.data || data || [];
      setExcepciones(lista);
    } catch (err) {
      console.error('Error cargando excepciones:', err);
      setExcepciones([]);
    }
  };

  const cargarHorarioBase = async () => {
    try {
      const { data } = await api.get(`/empleados/${dni}/horario`);
      const horarioData = data?.data || data;
      const nombre = horarioData?.NombreBase || horarioData?.NombreHorario || '';
      const entrada = horarioData?.HoraEntrada;
      const salida = horarioData?.HoraSalida;
      const rango = entrada && salida ? ` (${formatearHora(entrada)} - ${formatearHora(salida)})` : '';
      setHorarioBase(nombre ? `${nombre}${rango}` : '-');
    } catch (e) {
      setHorarioBase('-');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.fecha) {
      setError('La fecha es obligatoria');
      setLoading(false);
      return;
    }

    if (!formData.motivo) {
      setError('El motivo es obligatorio');
      setLoading(false);
      return;
    }

    // No más de 1 mes atrás
    const unMesAtras = new Date();
    unMesAtras.setMonth(unMesAtras.getMonth() - 1);
    if (new Date(formData.fecha) < unMesAtras) {
      setError('No se pueden crear excepciones para fechas anteriores a 1 mes');
      setLoading(false);
      return;
    }

    // No duplicar fecha
    const yaExiste = excepciones.some(ex => new Date(ex.Fecha || ex.fecha).toISOString().slice(0,10) === formData.fecha);
    if (yaExiste) {
      setError('Ya existe una excepción para esa fecha');
      setLoading(false);
      return;
    }

    try {
      // Crear (no implementamos editar en esta versión)
      const horarioIdValue = (value) => {
        if (value === '' || value === '__DESCANSO__' || value == null) return null;
        const n = parseInt(value, 10);
        return Number.isNaN(n) ? null : n;
      };

      const payload = {
        EmpleadoDNI: dni,
        Fecha: formData.fecha,
        HorarioID: horarioIdValue(formData.horarioID),
        Motivo: formData.motivo.trim()
      };

      const { data } = await api.post('/excepciones', payload);

      if (data.success) {
        const mensaje = editingExcepcion ? 'Excepción actualizada exitosamente' : 'Excepción registrada exitosamente';
        console.log('✅ Configurando mensaje de éxito:', mensaje);
        setSuccess(mensaje);
        
        // Recargar lista y limpiar formulario
        await cargarExcepciones(dni);
        handleClear();
        // Mantener el formulario visible para registrar más excepciones
        setEditingExcepcion(null);

        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          console.log('🧹 Limpiando mensaje de éxito después de 3 segundos');
          setSuccess('');
        }, 3000);
        
      } else {
        setError(data.message || 'Error procesando excepción');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (excepcion) => {
    setEditingExcepcion(excepcion);
    setFormData({
      empleadoID: excepcion.empleadoID || '',
      dni: excepcion.dni || '',
      nombres: excepcion.nombres || '',
      apellidoPaterno: excepcion.apellidoPaterno || '',
      apellidoMaterno: excepcion.apellidoMaterno || '',
      fecha: excepcion.fecha ? excepcion.fecha.split('T')[0] : '',
      grupoHorarioID: excepcion.grupoHorarioID || '',
      horaEntrada: excepcion.horaEntrada || '',
      horaSalida: excepcion.horaSalida || '',
      motivo: excepcion.motivo || '',
      observaciones: excepcion.observaciones || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta excepción?')) {
      return;
    }

    try {
      const { data } = await api.delete(`/excepciones/${id}`);
      if (data.success) {
        setSuccess('Excepción eliminada exitosamente');
        cargarExcepciones(dni);
      } else {
        setError(data.message || 'Error eliminando excepción');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    }
  };

  const handleClear = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      horarioID: '',
      motivo: ''
    });
    setEditingExcepcion(null);
    setError('');
    // No limpiar success aquí para que se vea el mensaje después del registro
  };

  const handleShowDetails = (excepcion) => {
    setSelectedExcepcion(excepcion);
    setShowDetails(true);
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Activa': return 'success';
      case 'Pendiente': return 'warning';
      case 'Vencida': return 'error';
      default: return 'default';
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    try {
      if (typeof fecha === 'string' && fecha.includes('T')) {
        const f = new Date(fecha);
        const d = String(f.getUTCDate()).padStart(2, '0');
        const m = String(f.getUTCMonth() + 1).padStart(2, '0');
        const y = f.getUTCFullYear();
        return `${d}/${m}/${y}`;
      }
      if (typeof fecha === 'string' && fecha.includes('-')) {
        const [y, m, d] = fecha.split('-');
        return `${d}/${m}/${y}`;
      }
      const f = new Date(fecha);
      return f.toLocaleDateString('es-ES');
    } catch {
      return String(fecha);
    }
  };

  const formatearHora = (h) => {
    if (!h) return '00:00';
    try {
      if (typeof h === 'string' && h.includes('T')) {
        const f = new Date(h);
        const hh = String(f.getUTCHours()).padStart(2, '0');
        const mm = String(f.getUTCMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      if (typeof h === 'string' && h.includes(':') && h.includes('.')) {
        const [hh, mm] = h.split(':');
        return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
      }
      if (typeof h === 'string' && h.includes(':')) return h.substring(0,5);
      return '00:00';
    } catch {
      return '00:00';
    }
  };

  if (!dni) {
    return (
      <Box>
        <Card sx={{ mb: 4 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ mr: 2, fontSize: '2rem' }} />
                <Typography variant="h4">Gestión de Excepciones</Typography>
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
        
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            No se ha seleccionado un empleado. Regrese al dashboard.
          </Alert>
            <Button
            variant="contained"
              onClick={() => navigate('/dashboard')}
          >
            Volver al Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Banner Empleado Seleccionado */}
      <Paper
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #223a4e, #2f4f68)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PersonIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Empleado Seleccionado</Typography>
        </Box>
        <Grid container spacing={2}>
          {/* Columna izquierda: DNI y Nombre */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BadgeIcon fontSize="small" />
              <Typography variant="body2">DNI: <strong>{dni}</strong></Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <PersonIcon fontSize="small" />
              <Typography variant="body2">Nombre: <strong>{nombreEmpleado || '-'}</strong></Typography>
            </Box>
          </Grid>
          {/* Columna derecha: Horario Base y Fecha Actual */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon fontSize="small" />
              <Typography variant="body2">Horario Base: <strong>{horarioBase || '-'}</strong></Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <TodayIcon fontSize="small" />
              <Typography variant="body2">Fecha Actual: <strong>{fechaActual}</strong></Typography>
            </Box>
          </Grid>
        </Grid>
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

      {/* Formulario - COMPACTO y optimizado */}
      {showForm && (
        <Box sx={{ 
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          {/* Header del formulario */}
          <Box sx={{
            background: 'linear-gradient(135deg, #2c3e50, #34495e)',
            color: 'white',
            borderRadius: '10px 10px 0 0',
            padding: '1rem',
            margin: '-1.5rem -1.5rem 1rem -1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AddCircleOutlineIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingExcepcion ? 'Editar Excepción' : 'Nueva Asignación Excepcional'}
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  background: '#ecf0f1',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    color: '#2c3e50',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <CalendarMonthIcon fontSize="small" />
                    Fecha de Excepción
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        border: '2px solid #e9ecef',
                        borderRadius: '6px',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'white',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3498db'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3498db',
                          boxShadow: '0 0 0 0.2rem rgba(52, 152, 219, 0.25)'
                        }
                      }
                    }}
                  />
                  <Box sx={{ 
                    marginTop: '0.25rem',
                    color: '#7f8c8d',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <InfoIcon fontSize="small" />
                    <Typography variant="caption">
                      Puede seleccionar fechas pasadas hasta 1 mes atrás
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  background: '#ecf0f1',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    color: '#2c3e50',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AccessTimeIcon fontSize="small" />
                    Horario Excepcional
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.horarioID}
                      onChange={(e) => handleInputChange('horarioID', e.target.value)}
                      displayEmpty
                      MenuProps={{ disableScrollLock: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          transition: 'all 0.3s ease',
                          backgroundColor: 'white',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3498db'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3498db',
                            boxShadow: '0 0 0 0.2rem rgba(52, 152, 219, 0.25)'
                          }
                        }
                      }}
                    >
                      <MenuItem value="">
                        -- Seleccionar Horario --
                      </MenuItem>
                      <MenuItem value="__DESCANSO__">Descanso</MenuItem>
                      {(() => {
                        const baseText = (horarioBase || '').split('(')[0]?.trim();
                        const baseTipo = baseText ? baseText.split(' ').slice(0,2).join(' ') : '';
                        
                        const lista = baseTipo
                          ? horarios.filter(h => ((h.NombreHorario || h.nombre || '').split(' ').slice(0,2).join(' ')) === baseTipo)
                          : horarios;
                        return lista;
                      })().map((h) => (
                        <MenuItem key={h.HorarioID || h.id} value={h.HorarioID || h.id}>
                          {formatearHora(h.HoraEntrada || h.horaEntrada)} - {formatearHora(h.HoraSalida || h.horaSalida)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ 
              background: '#ecf0f1',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                color: '#2c3e50',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <ChatBubbleOutlineIcon fontSize="small" />
                Motivo de la Excepción
              </Typography>
              <TextField
                fullWidth
                value={formData.motivo}
                onChange={(e) => handleInputChange('motivo', e.target.value)}
                required
                placeholder="Describa el motivo de la asignación excepcional..."
                multiline
                rows={2}
                size="small"
                                  sx={{
                    '& .MuiOutlinedInput-root': {
                      border: '2px solid #e9ecef',
                      borderRadius: '6px',
                      transition: 'all 0.3s ease',
                      backgroundColor: 'white',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3498db'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3498db',
                        boxShadow: '0 0 0 0.2rem rgba(52, 152, 219, 0.25)'
                      }
                    }
                  }}
              />
            </Box>
            
            <Box sx={{ 
              textAlign: 'center',
              marginTop: '1rem'
            }}>
              <Button
                type="submit"
                variant="contained"
                size="medium"
                startIcon={loading ? <CircularProgress size={18} /> : <SaveIcon />}
                disabled={loading}
                sx={{ 
                  background: 'linear-gradient(135deg, #3498db, #2980b9)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1.5rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  marginRight: 2,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 5px 15px rgba(52, 152, 219, 0.4)',
                    background: 'linear-gradient(135deg, #2980b9, #1f5f8b)'
                  },
                  '&:disabled': {
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}
              >
                {loading ? 'Guardando...' : (editingExcepcion ? 'Actualizar' : 'Guardar Excepción')}
              </Button>
              <Button
                type="button"
                variant="contained"
                size="medium"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/dashboard')}
                sx={{ 
                  background: 'linear-gradient(135deg, #34495e, #2c3e50)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1.5rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 5px 15px rgba(52, 73, 94, 0.4)',
                    background: 'linear-gradient(135deg, #2c3e50, #1a252f)'
                  }
                }}
              >
                Volver al Dashboard
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Lista de Excepciones */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #223a4e, #2f4f68)',
          color: 'white',
          px: 2.5,
          py: 1.5,
          borderRadius: 1,
          mb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ListAltIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Excepciones Registradas</Typography>
          </Box>
        </Box>

        {excepciones.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3, px: 2, color: '#64748b' }}>
            <InfoIcon fontSize="small" />
            <Typography variant="body2">No hay excepciones registradas</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#223a4e' }}>
                  <TableCell sx={{ color: 'white', border: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonthIcon fontSize="small" /> Fecha
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'white', border: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" /> Horario
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'white', border: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" /> Rango Horario
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'white', border: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChatBubbleOutlineIcon fontSize="small" /> Motivo
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'white', border: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SettingsIcon fontSize="small" /> Acciones
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {excepciones.map((excepcion) => (
                    <TableRow key={excepcion.AsignacionID || excepcion.id}>
                    <TableCell>
                      {formatearFecha(excepcion.Fecha || excepcion.fecha)}
                    </TableCell>
                    <TableCell>{excepcion.NombreHorario || excepcion.grupoHorarioNombre || (excepcion.HorarioID == null ? 'Descanso' : 'N/A')}</TableCell>
                    <TableCell>
                      {excepcion.HorarioID == null ? (
                        <Typography variant="body2">N/A</Typography>
                      ) : (
                        <>
                          <Typography variant="body2"><strong style={{ color: '#000000' }}>Entrada:&nbsp;&nbsp;</strong> {formatearHora(excepcion.HoraEntrada || excepcion.horaEntrada)}</Typography>
                          <Typography variant="body2"><strong style={{ color: '#000000' }}>Salida:&nbsp;&nbsp;</strong> {formatearHora(excepcion.HoraSalida || excepcion.horaSalida)}</Typography>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {excepcion.Motivo || excepcion.motivo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleShowDetails(excepcion)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(excepcion)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(excepcion.AsignacionID || excepcion.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Modal de Detalles */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles de la Excepción
        </DialogTitle>
        <DialogContent>
          {selectedExcepcion && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">DNI</Typography>
                <Typography variant="body1">{dni}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Empleado</Typography>
                <Typography variant="body1">
                  {selectedExcepcion.nombres} {selectedExcepcion.apellidoPaterno} {selectedExcepcion.apellidoMaterno}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Fecha</Typography>
                <Typography variant="body1">
                  {formatearFecha(selectedExcepcion.Fecha || selectedExcepcion.fecha)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Grupo Horario</Typography>
                <Typography variant="body1">{selectedExcepcion.NombreHorario || selectedExcepcion.grupoHorarioNombre || (selectedExcepcion.HorarioID == null ? 'Descanso' : 'N/A')}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Hora de Entrada</Typography>
                <Typography variant="body1">{formatearHora(selectedExcepcion.HoraEntrada || selectedExcepcion.horaEntrada)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Hora de Salida</Typography>
                <Typography variant="body1">{formatearHora(selectedExcepcion.HoraSalida || selectedExcepcion.horaSalida)}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Motivo</Typography>
                <Typography variant="body1">{selectedExcepcion.Motivo || selectedExcepcion.motivo}</Typography>
              </Grid>
              {selectedExcepcion.observaciones && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body1">{selectedExcepcion.observaciones}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Excepciones;
