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
  Star as StarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';

const OJT = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOJT, setEditingOJT] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOJT, setSelectedOJT] = useState(null);
  
  // Estados para los catálogos
  const [catalogos, setCatalogos] = useState({
    tiposOJT: []
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    empleadoID: '',
    dni: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    tipoOJT: '',
    fechaInicio: '',
    fechaFin: '',
    instructor: '',
    area: '',
    descripcion: '',
    observaciones: ''
  });

  // Estado para la lista de OJT
  const [ojtList, setOjtList] = useState([]);

  // Verificar si se recibió un empleado
  useEffect(() => {
    if (!location.state?.employee) {
      setError('No se seleccionó ningún empleado para gestionar OJT/CIC');
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
    loadOJT(employee.dni);
  }, [location.state]);

  const loadCatalogos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/catalogos/tipos-ojt');
      setCatalogos({
        tiposOJT: response.data.success ? response.data.tipos : []
      });
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const loadOJT = async (dni) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/ojt/empleado/${dni}`);
      if (response.data.success) {
        setOjtList(response.data.ojt || []);
      }
    } catch (error) {
      console.error('Error cargando OJT:', error);
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
    if (!formData.tipoOJT) {
      setError('El tipo de OJT es obligatorio');
      setLoading(false);
      return;
    }

    if (!formData.fechaInicio || !formData.fechaFin) {
      setError('Las fechas de inicio y fin son obligatorias');
      setLoading(false);
      return;
    }

    if (!formData.instructor) {
      setError('El instructor es obligatorio');
      setLoading(false);
      return;
    }

    if (!formData.area) {
      setError('El área es obligatoria');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (editingOJT) {
        // Actualizar OJT existente
        response = await axios.put(`http://localhost:5000/api/ojt/${editingOJT.id}`, formData);
      } else {
        // Crear nuevo OJT
        response = await axios.post('http://localhost:5000/api/ojt', formData);
      }
      
      if (response.data.success) {
        setSuccess(editingOJT ? 'OJT actualizado exitosamente' : 'OJT registrado exitosamente');
        
        // Recargar lista y limpiar formulario
        loadOJT(formData.dni);
        handleClear();
        setShowForm(false);
        setEditingOJT(null);
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(response.data.message || 'Error procesando OJT');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ojt) => {
    setEditingOJT(ojt);
    setFormData({
      empleadoID: ojt.empleadoID || '',
      dni: ojt.dni || '',
      nombres: ojt.nombres || '',
      apellidoPaterno: ojt.apellidoPaterno || '',
      apellidoMaterno: ojt.apellidoMaterno || '',
      tipoOJT: ojt.tipoOJT || '',
      fechaInicio: ojt.fechaInicio ? ojt.fechaInicio.split('T')[0] : '',
      fechaFin: ojt.fechaFin ? ojt.fechaFin.split('T')[0] : '',
      instructor: ojt.instructor || '',
      area: ojt.area || '',
      descripcion: ojt.descripcion || '',
      observaciones: ojt.observaciones || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este registro OJT?')) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:5000/api/ojt/${id}`);
      if (response.data.success) {
        setSuccess('OJT eliminado exitosamente');
        loadOJT(formData.dni);
      } else {
        setError(response.data.message || 'Error eliminando OJT');
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
      tipoOJT: '',
      fechaInicio: '',
      fechaFin: '',
      instructor: '',
      area: '',
      descripcion: '',
      observaciones: ''
    });
    setEditingOJT(null);
    setError('');
    setSuccess('');
  };

  const handleShowDetails = (ojt) => {
    setSelectedOJT(ojt);
    setShowDetails(true);
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Completado': return 'success';
      case 'En Progreso': return 'warning';
      case 'Pendiente': return 'info';
      case 'Cancelado': return 'error';
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
                <StarIcon sx={{ mr: 2, fontSize: '2rem' }} />
                <Typography variant="h4">Gestión OJT/CIC</Typography>
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
            No se seleccionó ningún empleado para gestionar OJT/CIC
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
              <StarIcon sx={{ mr: 2, fontSize: '2rem' }} />
              <Typography variant="h4">Gestión OJT/CIC</Typography>
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
                Nuevo OJT/CIC
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
            {editingOJT ? 'Editar OJT/CIC' : 'Nuevo OJT/CIC'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de OJT/CIC</InputLabel>
                  <Select
                    value={formData.tipoOJT}
                    onChange={(e) => handleInputChange('tipoOJT', e.target.value)}
                    label="Tipo de OJT/CIC"
                  >
                    {catalogos.tiposOJT.map((tipo) => (
                      <MenuItem key={tipo.id} value={tipo.nombre}>
                        {tipo.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Instructor *"
                  value={formData.instructor}
                  onChange={(e) => handleInputChange('instructor', e.target.value)}
                  required
                  placeholder="Nombre del instructor"
                />
              </Grid>
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
                <TextField
                  fullWidth
                  label="Área *"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  required
                  placeholder="Área de entrenamiento"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción del Entrenamiento"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Describa las actividades y objetivos del entrenamiento..."
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
                sx={{ px: 4, py: 1.5 }}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Lista de OJT */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
          Historial de OJT/CIC
        </Typography>

        {ojtList.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No hay registros OJT/CIC para este empleado
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Instructor</TableCell>
                  <TableCell>Fechas</TableCell>
                  <TableCell>Área</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ojtList.map((ojt) => (
                  <TableRow key={ojt.id}>
                    <TableCell>{ojt.tipoOJT}</TableCell>
                    <TableCell>{ojt.instructor}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        <strong>Inicio:</strong> {new Date(ojt.fechaInicio).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Fin:</strong> {new Date(ojt.fechaFin).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{ojt.area}</TableCell>
                    <TableCell>
                      <Chip
                        label={ojt.estado || 'En Progreso'}
                        color={getStatusColor(ojt.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleShowDetails(ojt)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(ojt)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(ojt.id)}
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
          Detalles del OJT/CIC
        </DialogTitle>
        <DialogContent>
          {selectedOJT && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">DNI</Typography>
                <Typography variant="body1">{selectedOJT.dni}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Empleado</Typography>
                <Typography variant="body1">
                  {selectedOJT.nombres} {selectedOJT.apellidoPaterno} {selectedOJT.apellidoMaterno}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Tipo</Typography>
                <Typography variant="body1">{selectedOJT.tipoOJT}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Instructor</Typography>
                <Typography variant="body1">{selectedOJT.instructor}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Fecha de Inicio</Typography>
                <Typography variant="body1">
                  {new Date(selectedOJT.fechaInicio).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Fecha de Fin</Typography>
                <Typography variant="body1">
                  {new Date(selectedOJT.fechaFin).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Área</Typography>
                <Typography variant="body1">{selectedOJT.area}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                <Chip
                  label={selectedOJT.estado || 'En Progreso'}
                  color={getStatusColor(selectedOJT.estado)}
                  size="small"
                />
              </Grid>
              {selectedOJT.descripcion && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
                  <Typography variant="body1">{selectedOJT.descripcion}</Typography>
                </Grid>
              )}
              {selectedOJT.observaciones && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body1">{selectedOJT.observaciones}</Typography>
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

export default OJT;
