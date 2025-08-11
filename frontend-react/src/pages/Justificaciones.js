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
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';

const Justificaciones = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingJustificacion, setEditingJustificacion] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedJustificacion, setSelectedJustificacion] = useState(null);
  
  // Estados para los catálogos
  const [catalogos, setCatalogos] = useState({
    tiposJustificacion: []
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    empleadoID: '',
    dni: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaInicio: '',
    fechaFin: '',
    tipoJustificacion: '',
    motivo: '',
    documentos: '',
    observaciones: ''
  });

  // Estado para la lista de justificaciones
  const [justificaciones, setJustificaciones] = useState([]);

  // Verificar si se recibió un empleado
  useEffect(() => {
    if (!location.state?.employee) {
      setError('No se seleccionó ningún empleado para gestionar justificaciones');
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
    loadJustificaciones(employee.dni);
  }, [location.state]);

  const loadCatalogos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/catalogos/tipos-justificacion');
      setCatalogos({
        tiposJustificacion: response.data.success ? response.data.tipos : []
      });
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const loadJustificaciones = async (dni) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/justificaciones/empleado/${dni}`);
      if (response.data.success) {
        setJustificaciones(response.data.justificaciones || []);
      }
    } catch (error) {
      console.error('Error cargando justificaciones:', error);
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
    if (!formData.fechaInicio || !formData.fechaFin) {
      setError('Las fechas de inicio y fin son obligatorias');
      setLoading(false);
      return;
    }

    if (!formData.tipoJustificacion) {
      setError('El tipo de justificación es obligatorio');
      setLoading(false);
      return;
    }

    if (!formData.motivo) {
      setError('El motivo es obligatorio');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (editingJustificacion) {
        // Actualizar justificación existente
        response = await axios.put(`http://localhost:5000/api/justificaciones/${editingJustificacion.id}`, formData);
      } else {
        // Crear nueva justificación
        response = await axios.post('http://localhost:5000/api/justificaciones', formData);
      }
      
      if (response.data.success) {
        setSuccess(editingJustificacion ? 'Justificación actualizada exitosamente' : 'Justificación registrada exitosamente');
        
        // Recargar lista y limpiar formulario
        loadJustificaciones(formData.dni);
        handleClear();
        setShowForm(false);
        setEditingJustificacion(null);
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(response.data.message || 'Error procesando justificación');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (justificacion) => {
    setEditingJustificacion(justificacion);
    setFormData({
      empleadoID: justificacion.empleadoID || '',
      dni: justificacion.dni || '',
      nombres: justificacion.nombres || '',
      apellidoPaterno: justificacion.apellidoPaterno || '',
      apellidoMaterno: justificacion.apellidoMaterno || '',
      fechaInicio: justificacion.fechaInicio ? justificacion.fechaInicio.split('T')[0] : '',
      fechaFin: justificacion.fechaFin ? justificacion.fechaFin.split('T')[0] : '',
      tipoJustificacion: justificacion.tipoJustificacion || '',
      motivo: justificacion.motivo || '',
      documentos: justificacion.documentos || '',
      observaciones: justificacion.observaciones || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta justificación?')) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:5000/api/justificaciones/${id}`);
      if (response.data.success) {
        setSuccess('Justificación eliminada exitosamente');
        loadJustificaciones(formData.dni);
      } else {
        setError(response.data.message || 'Error eliminando justificación');
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
      fechaInicio: '',
      fechaFin: '',
      tipoJustificacion: '',
      motivo: '',
      documentos: '',
      observaciones: ''
    });
    setEditingJustificacion(null);
    setError('');
    setSuccess('');
  };

  const handleShowDetails = (justificacion) => {
    setSelectedJustificacion(justificacion);
    setShowDetails(true);
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Aprobada': return 'success';
      case 'Pendiente': return 'warning';
      case 'Rechazada': return 'error';
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
                <CheckCircleIcon sx={{ mr: 2, fontSize: '2rem' }} />
                <Typography variant="h4">Gestión de Justificaciones</Typography>
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
            No se seleccionó ningún empleado para gestionar justificaciones
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
              <CheckCircleIcon sx={{ mr: 2, fontSize: '2rem' }} />
              <Typography variant="h4">Gestión de Justificaciones</Typography>
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
                Nueva Justificación
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
            {editingJustificacion ? 'Editar Justificación' : 'Nueva Justificación'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Inicio *"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Fin *"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Justificación</InputLabel>
                  <Select
                    value={formData.tipoJustificacion}
                    onChange={(e) => handleInputChange('tipoJustificacion', e.target.value)}
                    label="Tipo de Justificación"
                  >
                    {catalogos.tiposJustificacion.map((tipo) => (
                      <MenuItem key={tipo.id} value={tipo.nombre}>
                        {tipo.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motivo *"
                  value={formData.motivo}
                  onChange={(e) => handleInputChange('motivo', e.target.value)}
                  required
                  placeholder="Describa el motivo de la justificación..."
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Documentos de Respaldo"
                  value={formData.documentos}
                  onChange={(e) => handleInputChange('documentos', e.target.value)}
                  placeholder="Especifique los documentos presentados..."
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
                {loading ? 'Guardando...' : (editingJustificacion ? 'Actualizar' : 'Guardar')}
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
                  setEditingJustificacion(null);
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

      {/* Lista de Justificaciones */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
          Historial de Justificaciones
        </Typography>

        {justificaciones.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No hay justificaciones registradas para este empleado
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fechas</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {justificaciones.map((justificacion) => (
                  <TableRow key={justificacion.id}>
                    <TableCell>
                      <Typography variant="body2">
                        <strong>Inicio:</strong> {new Date(justificacion.fechaInicio).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Fin:</strong> {new Date(justificacion.fechaFin).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{justificacion.tipoJustificacion}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {justificacion.motivo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={justificacion.estado || 'Pendiente'}
                        color={getStatusColor(justificacion.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleShowDetails(justificacion)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(justificacion)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(justificacion.id)}
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
          Detalles de la Justificación
        </DialogTitle>
        <DialogContent>
          {selectedJustificacion && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">DNI</Typography>
                <Typography variant="body1">{selectedJustificacion.dni}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Empleado</Typography>
                <Typography variant="body1">
                  {selectedJustificacion.nombres} {selectedJustificacion.apellidoPaterno} {selectedJustificacion.apellidoMaterno}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Fecha de Inicio</Typography>
                <Typography variant="body1">
                  {new Date(selectedJustificacion.fechaInicio).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Fecha de Fin</Typography>
                <Typography variant="body1">
                  {new Date(selectedJustificacion.fechaFin).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Tipo</Typography>
                <Typography variant="body1">{selectedJustificacion.tipoJustificacion}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                <Chip
                  label={selectedJustificacion.estado || 'Pendiente'}
                  color={getStatusColor(selectedJustificacion.estado)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Motivo</Typography>
                <Typography variant="body1">{selectedJustificacion.motivo}</Typography>
              </Grid>
              {selectedJustificacion.documentos && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Documentos</Typography>
                  <Typography variant="body1">{selectedJustificacion.documentos}</Typography>
                </Grid>
              )}
              {selectedJustificacion.observaciones && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body1">{selectedJustificacion.observaciones}</Typography>
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

export default Justificaciones;
