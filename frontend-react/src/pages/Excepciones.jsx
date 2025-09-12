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
    fechaFin: '',
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

    // No más de 1 mes atrás (comparación por fecha local, sin afectar por horas)
    const ahora = new Date();
    const unMesAtras = new Date(ahora.getFullYear(), ahora.getMonth() - 1, ahora.getDate(), 0, 0, 0, 0);
    const parseYmdToLocalDate = (ymd) => {
      const [yy, mm, dd] = String(ymd).split('T')[0].split('-');
      const y = parseInt(yy, 10); const m = parseInt(mm, 10); const d = parseInt(dd, 10);
      if ([y, m, d].some(Number.isNaN)) return null;
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    };
    if (parseYmdToLocalDate(formData.fecha) < unMesAtras) {
      setError('No se pueden crear excepciones para fechas anteriores a 1 mes');
      setLoading(false);
      return;
    }

    // Helpers local time
    const toYmd = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    const start = parseYmdToLocalDate(formData.fecha);
    const end = formData.fechaFin ? parseYmdToLocalDate(formData.fechaFin) : null;
    if (end && end < start) {
      setError('La fecha fin no puede ser menor que la fecha inicio');
      setLoading(false);
      return;
    }
    const buildDates = () => {
      if (!end) return [toYmd(start)];
      const dates = [];
      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0, 0);
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12, 0, 0, 0);
      while (cur <= last) { dates.push(toYmd(cur)); cur.setDate(cur.getDate() + 1); }
      return dates;
    };
    const dates = buildDates();
    const existsDate = (ymd) => excepciones.some(ex => String(ex.Fecha || ex.fecha).slice(0,10) === ymd);

    try {
      // Crear (no implementamos editar en esta versión)
      const horarioIdValue = (value) => {
        if (value === '' || value === '__DESCANSO__' || value == null) return null;
        const n = parseInt(value, 10);
        return Number.isNaN(n) ? null : n;
      };

      const results = await Promise.allSettled(
        dates.map(async (ymd) => {
          if (existsDate(ymd)) return { skipped: true, fecha: ymd };
          const payload = {
            EmpleadoDNI: dni,
            Fecha: ymd,
            HorarioID: horarioIdValue(formData.horarioID),
            Motivo: formData.motivo.trim()
          };
          const { data } = await api.post('/excepciones', payload);
          if (data.success) return { ok: true, fecha: ymd };
          throw new Error(data.message || 'Error procesando excepción');
        })
      );

      const created = results.filter(r => r.status === 'fulfilled' && r.value?.ok).length;
      const skipped = results.filter(r => r.status === 'fulfilled' && r.value?.skipped).length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (created || skipped) {
        const parts = [];
        if (created) parts.push(`${created} creadas`);
        if (skipped) parts.push(`${skipped} omitidas (duplicadas)`);
        if (failed) parts.push(`${failed} con error`);
        setSuccess(`Excepciones: ${parts.join(', ')}`);
        const mensaje = editingExcepcion ? 'Excepción actualizada exitosamente' : 'Excepción registrada exitosamente';
        console.log('✅ Configurando mensaje de éxito:', mensaje);
        // mantener el mensaje resumido construido
        
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
        setError('No se pudo crear ninguna excepción');
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
      fechaFin: '',
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
          borderRadius: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
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
        <Paper sx={{
          mb: 3,
          borderRadius: 4,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'visible',
          border: '2px solid #667eea',
          p: 0
        }}>
          {/* Header del formulario */}
          <Box sx={{
            backgroundColor: '#667eea',
            color: 'white',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <AddCircleOutlineIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingExcepcion ? 'Editar Excepción' : 'Nueva Asignación Excepcional'}
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ px: 2, pt: 2, pb: 1 }}>
            <Grid container spacing={2}>
              {/* Fecha inicio */}
              <Grid item xs={12} md={3}>
                <TextField
                  label="Fecha de Excepción *"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                  fullWidth
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'white',
                      '&:hover fieldset': { borderColor: '#667eea' },
                      '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                    },
                  }}
                />
              </Grid>
              {/* Fecha fin */}
              <Grid item xs={12} md={3}>
                <TextField
                  label="Fecha fin (opcional)"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'white',
                      '&:hover fieldset': { borderColor: '#667eea' },
                      '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                    },
                  }}
                />
              </Grid>
              {/* Horario */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required size="small">
                  <InputLabel shrink sx={{ fontSize: '0.95rem', fontWeight: 500, '&.Mui-focused': { color: '#667eea' } }}>
                    Horario Excepcional *
                  </InputLabel>
                  <Select
                    value={formData.horarioID}
                    onChange={(e) => handleInputChange('horarioID', e.target.value)}
                    label="Horario Excepcional *"
                    displayEmpty
                    MenuProps={{ disableScrollLock: true }}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: 'white',
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea', borderWidth: 2 },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccione una opción</em>
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
              </Grid>

              {/* Motivo */}
              <Grid item xs={12}>
                <TextField
                  label="Motivo *"
                  value={formData.motivo}
                  onChange={(e) => handleInputChange('motivo', e.target.value)}
                  fullWidth
                  required
                  size="small"
                  multiline
                  rows={2}
                  placeholder="Escriba el motivo (máx. 200 caracteres)"
                  inputProps={{ maxLength: 200 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'white',
                      '&:hover fieldset': { borderColor: '#667eea' },
                      '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                    },
                  }}
                />
              </Grid>

              {/* Botón */}
              <Grid item xs={12} sx={{ pb: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} /> : <SaveIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: 2,
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      minWidth: 120,
                      boxShadow: '0 3px 12px rgba(16, 185, 129, 0.28)',
                      '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', transform: 'translateY(-2px)', boxShadow: '0 5px 16px rgba(16, 185, 129, 0.34)' },
                      '&:disabled': { background: '#9ca3af', transform: 'none', boxShadow: 'none' },
                    }}
                  >
                    {loading ? 'Guardando...' : (editingExcepcion ? 'Actualizar' : 'Guardar Excepción')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* Lista de Excepciones */}
      <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <Box sx={{
          backgroundColor: '#1f2937',
          color: 'white',
          p: 3,
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
                <TableRow>
                  <TableCell sx={{ 
                    backgroundColor: '#e2e8f0',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonthIcon fontSize="small" /> Fecha
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#e2e8f0',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" /> Horario
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#e2e8f0',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" /> Rango Horario
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#e2e8f0',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChatBubbleOutlineIcon fontSize="small" /> Motivo
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#e2e8f0',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
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
