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
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';

const ActualizarEmpleado = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para los catálogos
  const [catalogos, setCatalogos] = useState({
    jornadas: [],
    campanias: [],
    cargos: [],
    modalidades: [],
    grupos: []
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    genero: '',
    direccion: '',
    telefono: '',
    email: '',
    fechaIngreso: '',
    jornadaID: '',
    campaniaID: '',
    cargoID: '',
    modalidadTrabajoID: '',
    grupoHorarioID: '',
    salario: '',
    estadoCivil: '',
    numeroHijos: '',
    tipoSangre: '',
    alergias: '',
    observaciones: ''
  });

  // Verificar si se recibió un empleado
  useEffect(() => {
    if (!location.state?.employee) {
      setError('No se seleccionó ningún empleado para actualizar');
      return;
    }

    const employee = location.state.employee;
    setFormData({
      dni: employee.dni || '',
      nombres: employee.nombres || '',
      apellidoPaterno: employee.apellidoPaterno || '',
      apellidoMaterno: employee.apellidoMaterno || '',
      fechaNacimiento: employee.fechaNacimiento ? employee.fechaNacimiento.split('T')[0] : '',
      genero: employee.genero || '',
      direccion: employee.direccion || '',
      telefono: employee.telefono || '',
      email: employee.email || '',
      fechaIngreso: employee.fechaIngreso ? employee.fechaIngreso.split('T')[0] : '',
      jornadaID: employee.jornadaID || '',
      campaniaID: employee.campaniaID || '',
      cargoID: employee.cargoID || '',
      modalidadTrabajoID: employee.modalidadTrabajoID || '',
      grupoHorarioID: employee.grupoHorarioID || '',
      salario: employee.salario || '',
      estadoCivil: employee.estadoCivil || '',
      numeroHijos: employee.numeroHijos || '',
      tipoSangre: employee.tipoSangre || '',
      alergias: employee.alergias || '',
      observaciones: employee.observaciones || ''
    });

    loadCatalogos();
  }, [location.state]);

  const loadCatalogos = async () => {
    try {
      const [
        jornadasRes,
        campaniasRes,
        cargosRes,
        modalidadesRes,
        gruposRes
      ] = await Promise.all([
        axios.get('http://localhost:5000/api/catalogos/jornadas'),
        axios.get('http://localhost:5000/api/catalogos/campanias'),
        axios.get('http://localhost:5000/api/catalogos/cargos'),
        axios.get('http://localhost:5000/api/catalogos/modalidades'),
        axios.get('http://localhost:5000/api/catalogos/grupos')
      ]);

      setCatalogos({
        jornadas: jornadasRes.data.success ? jornadasRes.data.jornadas : [],
        campanias: campaniasRes.data.success ? campaniasRes.data.campanias : [],
        cargos: cargosRes.data.success ? cargosRes.data.cargos : [],
        modalidades: modalidadesRes.data.success ? modalidadesRes.data.modalidades : [],
        grupos: gruposRes.data.success ? gruposRes.data.grupos : []
      });
    } catch (error) {
      console.error('Error cargando catálogos:', error);
      setError('Error cargando catálogos. Intente recargar la página.');
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

    try {
      const response = await axios.put(`http://localhost:5000/api/empleados/${formData.dni}`, formData);
      
      if (response.data.success) {
        setSuccess('Empleado actualizado exitosamente');
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(response.data.message || 'Error actualizando empleado');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (location.state?.employee) {
      const employee = location.state.employee;
      setFormData({
        dni: employee.dni || '',
        nombres: employee.nombres || '',
        apellidoPaterno: employee.apellidoPaterno || '',
        apellidoMaterno: employee.apellidoMaterno || '',
        fechaNacimiento: employee.fechaNacimiento ? employee.fechaNacimiento.split('T')[0] : '',
        genero: employee.genero || '',
        direccion: employee.direccion || '',
        telefono: employee.telefono || '',
        email: employee.email || '',
        fechaIngreso: employee.fechaIngreso ? employee.fechaIngreso.split('T')[0] : '',
        jornadaID: employee.jornadaID || '',
        campaniaID: employee.campaniaID || '',
        cargoID: employee.cargoID || '',
        modalidadTrabajoID: employee.modalidadTrabajoID || '',
        grupoHorarioID: employee.grupoHorarioID || '',
        salario: employee.salario || '',
        estadoCivil: employee.estadoCivil || '',
        numeroHijos: employee.numeroHijos || '',
        tipoSangre: employee.tipoSangre || '',
        alergias: employee.alergias || '',
        observaciones: employee.observaciones || ''
      });
    }
    setError('');
    setSuccess('');
  };

  if (!location.state?.employee) {
    return (
      <Box>
        <Card sx={{ mb: 4 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EditIcon sx={{ mr: 2, fontSize: '2rem' }} />
                <Typography variant="h4">Actualizar Empleado</Typography>
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
            No se seleccionó ningún empleado para actualizar
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
              <EditIcon sx={{ mr: 2, fontSize: '2rem' }} />
              <Typography variant="h4">Actualizar Empleado</Typography>
            </Box>
          }
          subtitle={
            <Typography variant="body1" sx={{ mt: 1, color: '#64748b' }}>
              Actualizando datos de: {formData.nombres} {formData.apellidoPaterno} - DNI: {formData.dni}
            </Typography>
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

      {/* Formulario */}
      <Paper sx={{ p: 4 }}>
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

        <Box component="form" onSubmit={handleSubmit}>
          {/* Información Personal */}
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
            Información Personal
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="DNI *"
                value={formData.dni}
                onChange={(e) => handleInputChange('dni', e.target.value)}
                required
                placeholder="12345678"
                disabled
                sx={{ backgroundColor: '#f8fafc' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombres *"
                value={formData.nombres}
                onChange={(e) => handleInputChange('nombres', e.target.value)}
                required
                placeholder="Juan Carlos"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido Paterno *"
                value={formData.apellidoPaterno}
                onChange={(e) => handleInputChange('apellidoPaterno', e.target.value)}
                required
                placeholder="García"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido Materno"
                value={formData.apellidoMaterno}
                onChange={(e) => handleInputChange('apellidoMaterno', e.target.value)}
                placeholder="López"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento *"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Género</InputLabel>
                <Select
                  value={formData.genero}
                  onChange={(e) => handleInputChange('genero', e.target.value)}
                  label="Género"
                >
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Femenino</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                placeholder="Av. Principal 123, Distrito"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="999888777"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="juan.garcia@email.com"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Información Laboral */}
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
            Información Laboral
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Ingreso *"
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => handleInputChange('fechaIngreso', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Jornada</InputLabel>
                <Select
                  value={formData.jornadaID}
                  onChange={(e) => handleInputChange('jornadaID', e.target.value)}
                  label="Jornada"
                >
                  {catalogos.jornadas.map((jornada) => (
                    <MenuItem key={jornada.id} value={jornada.id}>
                      {jornada.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Campaña</InputLabel>
                <Select
                  value={formData.campaniaID}
                  onChange={(e) => handleInputChange('campaniaID', e.target.value)}
                  label="Campaña"
                >
                  {catalogos.campanias.map((campania) => (
                    <MenuItem key={campania.id} value={campania.id}>
                      {campania.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Cargo</InputLabel>
                <Select
                  value={formData.cargoID}
                  onChange={(e) => handleInputChange('cargoID', e.target.value)}
                  label="Cargo"
                >
                  {catalogos.cargos.map((cargo) => (
                    <MenuItem key={cargo.id} value={cargo.id}>
                      {cargo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Modalidad de Trabajo</InputLabel>
                <Select
                  value={formData.modalidadTrabajoID}
                  onChange={(e) => handleInputChange('modalidadTrabajoID', e.target.value)}
                  label="Modalidad de Trabajo"
                >
                  {catalogos.modalidades.map((modalidad) => (
                    <MenuItem key={modalidad.id} value={modalidad.id}>
                      {modalidad.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Grupo Horario</InputLabel>
                <Select
                  value={formData.grupoHorarioID}
                  onChange={(e) => handleInputChange('grupoHorarioID', e.target.value)}
                  label="Grupo Horario"
                >
                  {catalogos.grupos.map((grupo) => (
                    <MenuItem key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Salario"
                type="number"
                value={formData.salario}
                onChange={(e) => handleInputChange('salario', e.target.value)}
                placeholder="2500.00"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>S/</Typography>
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Información Adicional */}
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
            Información Adicional
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado Civil</InputLabel>
                <Select
                  value={formData.estadoCivil}
                  onChange={(e) => handleInputChange('estadoCivil', e.target.value)}
                  label="Estado Civil"
                >
                  <MenuItem value="Soltero">Soltero</MenuItem>
                  <MenuItem value="Casado">Casado</MenuItem>
                  <MenuItem value="Divorciado">Divorciado</MenuItem>
                  <MenuItem value="Viudo">Viudo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número de Hijos"
                type="number"
                value={formData.numeroHijos}
                onChange={(e) => handleInputChange('numeroHijos', e.target.value)}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tipo de Sangre"
                value={formData.tipoSangre}
                onChange={(e) => handleInputChange('tipoSangre', e.target.value)}
                placeholder="O+"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Alergias"
                value={formData.alergias}
                onChange={(e) => handleInputChange('alergias', e.target.value)}
                placeholder="Ninguna"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                placeholder="Información adicional relevante..."
                multiline
                rows={3}
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
              {loading ? 'Actualizando...' : 'Actualizar Empleado'}
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
              Restaurar Datos
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ActualizarEmpleado;
