import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';

const Excepciones = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExcepcion, setEditingExcepcion] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedExcepcion, setSelectedExcepcion] = useState(null);
  
  // Estados para los catálogos
  const [catalogos, setCatalogos] = useState({
    gruposHorario: []
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    empleadoID: '',
    dni: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fecha: '',
    grupoHorarioID: '',
    horaEntrada: '',
    horaSalida: '',
    motivo: '',
    observaciones: ''
  });

  // Estado para la lista de excepciones
  const [excepciones, setExcepciones] = useState([]);

  // Verificar si se recibió un empleado
  useEffect(() => {
    if (!location.state?.employee) {
      setError('No se seleccionó ningún empleado para gestionar excepciones');
      return;
    }

    const employee = location.state.employee;
    setFormData(prev => ({
      ...prev,
      empleadoID: employee.id || employee.empleadoID || '',
      dni: employee.dni || '',
      nombres: employee.nombres || '',
      apellidoPaterno: employee.apellidoPaterno || '',
      apellidoMaterno: employee.apellidoMaterno || ''
    }));

    loadCatalogos();
    loadExcepciones(employee.dni);
  }, [location.state]);

  const loadCatalogos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/grupos/horas');
      setCatalogos({
        gruposHorario: response.data.success ? response.data.grupos : []
      });
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const loadExcepciones = async (dni) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/excepciones/empleado/${dni}`);
      if (response.data.success) {
        setExcepciones(response.data.excepciones || []);
      }
    } catch (error) {
      console.error('Error cargando excepciones:', error);
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

    if (!formData.grupoHorarioID) {
      setError('El grupo horario es obligatorio');
      setLoading(false);
      return;
    }

    if (!formData.horaEntrada || !formData.horaSalida) {
      setError('Las horas de entrada y salida son obligatorias');
      setLoading(false);
      return;
    }

    if (!formData.motivo) {
      setError('El motivo es obligatorio');
      setLoading(false);
      return;
    }

    // Validar que la hora de salida sea posterior a la de entrada
    if (formData.horaEntrada >= formData.horaSalida) {
      setError('La hora de salida debe ser posterior a la hora de entrada');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (editingExcepcion) {
        // Actualizar excepción existente
        response = await axios.put(`http://localhost:5000/api/excepciones/${editingExcepcion.id}`, formData);
      } else {
        // Crear nueva excepción
        response = await axios.post('http://localhost:5000/api/excepciones', formData);
      }
      
      if (response.data.success) {
        setSuccess(editingExcepcion ? 'Excepción actualizada exitosamente' : 'Excepción registrada exitosamente');
        
        // Recargar lista y limpiar formulario
        loadExcepciones(formData.dni);
        handleClear();
        setShowForm(false);
        setEditingExcepcion(null);
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(response.data.message || 'Error procesando excepción');
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
      const response = await axios.delete(`http://localhost:5000/api/excepciones/${id}`);
      if (response.data.success) {
        setSuccess('Excepción eliminada exitosamente');
        loadExcepciones(formData.dni);
      } else {
        setError(response.data.message || 'Error eliminando excepción');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    }
  };

  const handleClear = () => {
    setFormData({
      empleadoID: formData.empleadoID,
      dni: formData.dni,
      nombres: formData.nombres,
      apellidoPaterno: formData.apellidoPaterno,
      apellidoMaterno: formData.apellidoMaterno,
      fecha: '',
      grupoHorarioID: '',
      horaEntrada: '',
      horaSalida: '',
      motivo: '',
      observaciones: ''
    });
    setEditingExcepcion(null);
    setError('');
    setSuccess('');
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

  if (!location.state?.employee) {
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
                onClick={() => navigate('/')}
              >
                Volver al Dashboard
              </Button>
            }
          />
        </Card>
        
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            No se seleccionó ningún empleado para gestionar excepciones
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
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
              <ScheduleIcon sx={{ mr: 2, fontSize: '2rem' }} />
              <Typography variant="h4">Gestión de Excepciones</Typography>
            </Box>
          }
          subtitle={
            <Typography variant="body1" sx={{ mt: 1, color: '#64748b' }}>
              Empleado: {formData.nombres} {formData.apellidoPaterno} - DNI: {formData.dni}
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowForm(true)}
              >
                Nueva Excepción
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/')}
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
      {showForm && (
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
            {editingExcepcion ? 'Editar Excepción' : 'Nueva Excepción'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha *"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Grupo Horario</InputLabel>
                  <Select
                    value={formData.grupoHorarioID}
                    onChange={(e) => handleInputChange('grupoHorarioID', e.target.value)}
                    label="Grupo Horario"
                  >
                    {catalogos.gruposHorario.map((grupo) => (
                      <MenuItem key={grupo.id} value={grupo.id}>
                        {grupo.nombre} ({grupo.horaEntrada} - {grupo.horaSalida})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hora de Entrada *"
                  type="time"
                  value={formData.horaEntrada}
                  onChange={(e) => handleInputChange('horaEntrada', e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hora de Salida *"
                  type="time"
                  value={formData.horaSalida}
                  onChange={(e) => handleInputChange('horaSalida', e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motivo *"
                  value={formData.motivo}
                  onChange={(e) => handleInputChange('motivo', e.target.value)}
                  required
                  placeholder="Describa el motivo de la excepción..."
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales..."
                  multiline
                  rows={2}
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
                {loading ? 'Guardando...' : (editingExcepcion ? 'Actualizar' : 'Guardar')}
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
                  setEditingExcepcion(null);
                  handleClear();
                }}
                sx={{ px: 4, py: 1.5 }}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Lista de Excepciones */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
          Historial de Excepciones
        </Typography>

        {excepciones.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No hay excepciones registradas para este empleado
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Grupo Horario</TableCell>
                  <TableCell>Horario Excepcional</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {excepciones.map((excepcion) => (
                  <TableRow key={excepcion.id}>
                    <TableCell>
                      {new Date(excepcion.fecha).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{excepcion.grupoHorarioNombre || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        <strong>Entrada:</strong> {excepcion.horaEntrada}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Salida:</strong> {excepcion.horaSalida}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {excepcion.motivo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={excepcion.estado || 'Activa'}
                        color={getStatusColor(excepcion.estado)}
                        size="small"
                      />
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
                          onClick={() => handleDelete(excepcion.id)}
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
                <Typography variant="body1">{selectedExcepcion.dni}</Typography>
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
                  {new Date(selectedExcepcion.fecha).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Grupo Horario</Typography>
                <Typography variant="body1">{selectedExcepcion.grupoHorarioNombre || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Hora de Entrada</Typography>
                <Typography variant="body1">{selectedExcepcion.horaEntrada}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Hora de Salida</Typography>
                <Typography variant="body1">{selectedExcepcion.horaSalida}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                <Chip
                  label={selectedExcepcion.estado || 'Activa'}
                  color={getStatusColor(selectedExcepcion.estado)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Motivo</Typography>
                <Typography variant="body1">{selectedExcepcion.motivo}</Typography>
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
