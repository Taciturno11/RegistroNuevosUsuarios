import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardHeader,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Collapse
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Computer as ComputerIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const OJT = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOJT, setEditingOJT] = useState(null);
  
  // Estados para empleado seleccionado
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [historial, setHistorial] = useState([]);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    UsuarioCIC: '',
    FechaHoraInicio: '',
    FechaHoraFin: '',
    Observaciones: ''
  });

  // Cargar historial de OJT para el empleado
  const cargarHistorial = useCallback(async (dni) => {
    try {
      setLoading(true);
      console.log('📡 Cargando historial OJT para DNI:', dni);
      
      const response = await api.get(`/ojt/${dni}/historial`);
      
      console.log('📊 Respuesta historial OJT:', response.data);
      
      if (response.data.success) {
        setHistorial(response.data.data.historial || []);
      } else {
        setError('Error al cargar el historial de OJT');
      }
    } catch (error) {
      console.error('❌ Error cargando historial OJT:', error);
      setError('Error de conexión al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Cargar empleado seleccionado desde localStorage
  useEffect(() => {
    const empleadoDNI = localStorage.getItem('empleadoDNI');
    const empleadoNombre = localStorage.getItem('empleadoNombre');
    
    console.log('🔍 OJT - localStorage:', { empleadoDNI, empleadoNombre });
    
    if (!empleadoDNI || !empleadoNombre) {
      setError('No se seleccionó ningún empleado para gestionar OJT/CIC');
      return;
    }

    setSelectedEmployee({
      DNI: empleadoDNI,
      nombres: empleadoNombre
    });
    
    cargarHistorial(empleadoDNI);
  }, [cargarHistorial]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.UsuarioCIC) {
      setError('El Usuario CIC es obligatorio');
      setLoading(false);
      return;
    }

    if (!formData.FechaHoraInicio) {
      setError('La fecha y hora de inicio es obligatoria');
      setLoading(false);
      return;
    }

    // Validar formato de fechas
    try {
      const fechaInicio = new Date(formData.FechaHoraInicio);
      if (isNaN(fechaInicio.getTime())) {
        throw new Error('Fecha de inicio inválida');
      }

      if (formData.FechaHoraFin) {
        const fechaFin = new Date(formData.FechaHoraFin);
        if (isNaN(fechaFin.getTime())) {
          throw new Error('Fecha de fin inválida');
        }
        
        if (fechaFin <= fechaInicio) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }
    } catch (validationError) {
      setError(validationError.message);
      setLoading(false);
      return;
    }

    try {
      // Debug de fechas en el front antes de enviar
      try {
        const di = formData.FechaHoraInicio ? new Date(formData.FechaHoraInicio) : null;
        const df = formData.FechaHoraFin ? new Date(formData.FechaHoraFin) : null;
        console.log('🧪 Front OJT debug fechas:', {
          inputInicio: formData.FechaHoraInicio,
          inputFin: formData.FechaHoraFin,
          tzOffsetMinutes: new Date().getTimezoneOffset(),
          inicio: di ? {
            toString: di.toString(),
            toISOString: di.toISOString(),
            y: di.getFullYear(), m: di.getMonth()+1, d: di.getDate(), hh: di.getHours(), mm: di.getMinutes()
          } : null,
          fin: df ? {
            toString: df.toString(),
            toISOString: df.toISOString(),
            y: df.getFullYear(), m: df.getMonth()+1, d: df.getDate(), hh: df.getHours(), mm: df.getMinutes()
          } : null
        });
      } catch {}

      const payload = {
        ...formData,
        DNIEmpleado: selectedEmployee.DNI
      };
      
      console.log('📤 Enviando datos OJT:', payload);

      let response;
      if (editingOJT) {
        // Actualizar OJT existente
        response = await api.patch(`/ojt/${editingOJT.UsoCICID}`, payload);
      } else {
        // Crear nuevo OJT
        response = await api.post('/ojt', payload);
      }
      
      console.log('✅ Respuesta OJT:', response.data);
      
      if (response.data.success) {
        setSuccess(editingOJT ? 'OJT actualizado exitosamente' : 'OJT registrado exitosamente');
        
        // Recargar historial y limpiar formulario
        await cargarHistorial(selectedEmployee.DNI);
        handleClear();
        setShowForm(false);
        setEditingOJT(null);
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(response.data.message || 'Error procesando OJT');
      }
    } catch (error) {
      console.error('❌ Error en submit OJT:', error);
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ojt) => {
    setEditingOJT(ojt);
    setFormData({
      UsuarioCIC: ojt.NombreUsuarioCIC || '',
      FechaHoraInicio: ojt.FechaHoraInicio ? formatearParaInput(ojt.FechaHoraInicio) : '',
      FechaHoraFin: ojt.FechaHoraFin ? formatearParaInput(ojt.FechaHoraFin) : '',
      Observaciones: ojt.Observaciones || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este registro OJT?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/ojt/${id}`);
      
      if (response.data.success) {
        setSuccess('OJT eliminado exitosamente');
        await cargarHistorial(selectedEmployee.DNI);
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(response.data.message || 'Error eliminando OJT');
      }
    } catch (error) {
      console.error('❌ Error eliminando OJT:', error);
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      UsuarioCIC: '',
      FechaHoraInicio: '',
      FechaHoraFin: '',
      Observaciones: ''
    });
    setEditingOJT(null);
    setError('');
  };

  // Función para formatear fecha para input datetime-local
  const formatearParaInput = (fechaString) => {
    try {
      if (!fechaString) return '';
      // Convertir "2025-01-15 14:30:00" a "2025-01-15T14:30"
      const fecha = new Date(fechaString);
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const hours = String(fecha.getHours()).padStart(2, '0');
      const minutes = String(fecha.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '';
    }
  };

  // Función para formatear fecha para mostrar
  const formatearFecha = (fechaString) => {
    try {
      if (!fechaString) return 'No especificada';
      const fecha = new Date(fechaString);
      return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  if (!selectedEmployee) {
    return (
      <Box>
        <Card sx={{ mb: 4 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ComputerIcon sx={{ mr: 2, fontSize: '2rem' }} />
                <Typography variant="h4">Gestión OJT/CIC</Typography>
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
            {error || 'No se seleccionó ningún empleado para gestionar OJT/CIC'}
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
    <Box>
      {/* Header */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ComputerIcon sx={{ mr: 2, fontSize: '2rem' }} />
              <Box>
                <Typography variant="h4">Gestión OJT/CIC</Typography>
                <Typography variant="h6" sx={{ mt: 0.5, color: '#64748b', fontWeight: 'normal' }}>
                  {selectedEmployee.nombres} - DNI: {selectedEmployee.DNI}
                </Typography>
              </Box>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowForm(true)}
                disabled={loading}
              >
                Nuevo Registro OJT/CIC
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/dashboard')}
              >
                Volver al Dashboard
              </Button>
            </Box>
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

      {/* Formulario */}
      <Collapse in={showForm}>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
            {editingOJT ? 'Editar Registro OJT/CIC' : 'Nuevo Registro OJT/CIC'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Usuario CIC *"
                  value={formData.UsuarioCIC}
                  onChange={(e) => handleInputChange('UsuarioCIC', e.target.value)}
                  required
                  placeholder="Nombre del usuario CIC"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha y Hora de Inicio *"
                  type="datetime-local"
                  value={formData.FechaHoraInicio}
                  onChange={(e) => handleInputChange('FechaHoraInicio', e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha y Hora de Fin"
                  type="datetime-local"
                  value={formData.FechaHoraFin}
                  onChange={(e) => handleInputChange('FechaHoraFin', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                  helperText="Dejar vacío si el registro está activo"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  value={formData.Observaciones}
                  onChange={(e) => handleInputChange('Observaciones', e.target.value)}
                  placeholder="Observaciones adicionales..."
                  multiline
                  rows={3}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            {/* Botones de acción */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
                sx={{ px: 4, py: 1.5 }}
              >
                {loading ? 'Guardando...' : (editingOJT ? 'Actualizar' : 'Guardar')}
              </Button>
              
              <Button
                type="button"
                variant="outlined"
                size="large"
                startIcon={<ClearIcon />}
                onClick={handleClear}
                disabled={loading}
                sx={{ px: 4, py: 1.5 }}
              >
                Limpiar
              </Button>

              <Button
                type="button"
                variant="outlined"
                size="large"
                onClick={() => {
                  setShowForm(false);
                  setEditingOJT(null);
                  handleClear();
                }}
                disabled={loading}
                sx={{ px: 4, py: 1.5 }}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </Paper>
      </Collapse>

      {/* Historial de OJT */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
          Historial de OJT/CIC
        </Typography>

        {loading && historial.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Cargando historial...
            </Typography>
          </Box>
        ) : historial.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No hay registros OJT/CIC para este empleado
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxWidth: '900px', margin: '0 auto' }}>
            <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1e293b' }}>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 600, width: '80px' }}>ID</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 600, width: '200px' }}>Usuario CIC</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 600, width: '180px' }}>Fecha Inicio</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 600, width: '180px' }}>Fecha Fin</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 600, width: '150px' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historial.map((ojt) => (
                  <TableRow key={ojt.UsoCICID}>
                    <TableCell align="center">{ojt.UsoCICID}</TableCell>
                    <TableCell align="center">{ojt.NombreUsuarioCIC}</TableCell>
                    <TableCell align="center">{formatearFecha(ojt.FechaHoraInicio)}</TableCell>
                    <TableCell align="center">
                      {ojt.FechaHoraFin ? (
                        formatearFecha(ojt.FechaHoraFin)
                      ) : (
                        <Chip label="Activo" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(ojt)}
                          color="primary"
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(ojt.UsoCICID)}
                          color="error"
                          disabled={loading}
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
    </Box>
  );
};

export default OJT;