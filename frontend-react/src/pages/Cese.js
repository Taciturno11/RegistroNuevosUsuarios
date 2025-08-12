import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowBack as ArrowBackIcon,
  PersonOff as PersonOffIcon,
  CheckCircle as PersonCheckIcon
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Paper
} from '@mui/material';
import '../App.css';

const Cese = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { api } = useAuth();
  
  const [empleado, setEmpleado] = useState(null);
  const [fechaCese, setFechaCese] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [empleadoCesado, setEmpleadoCesado] = useState(false);

  // Función para formatear fechas correctamente
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'No especificada';
    
    try {
      // Si la fecha viene como string ISO, convertirla correctamente
      let fecha;
      if (typeof fechaString === 'string') {
        if (fechaString.includes('T')) {
          // Formato ISO con T - usar la fecha tal como viene sin conversión de zona horaria
          const [year, month, day] = fechaString.split('T')[0].split('-');
          fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (fechaString.includes('-')) {
          // Formato YYYY-MM-DD
          const [year, month, day] = fechaString.split('-');
          fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Otro formato, intentar parsear
          fecha = new Date(fechaString);
        }
      } else {
        fecha = new Date(fechaString);
      }
      
      // Verificar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }
      
      // Formatear como DD/MM/YYYY
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  };

  useEffect(() => {
    // Obtener datos del empleado desde localStorage como en el proyecto original
    const dni = localStorage.getItem('empleadoDNI');
    const nombreEmpleado = localStorage.getItem('empleadoNombre');
    
    if (!dni) {
      setError('No se ha seleccionado un empleado. Regrese al dashboard.');
      return;
    }

    // Crear objeto empleado básico con los datos disponibles
    const empleadoData = {
      DNI: dni,
      Nombres: nombreEmpleado ? nombreEmpleado.split(' ')[0] : '',
      ApellidoPaterno: nombreEmpleado ? nombreEmpleado.split(' ')[1] : '',
      ApellidoMaterno: nombreEmpleado ? nombreEmpleado.split(' ').slice(2).join(' ') : ''
    };

    setEmpleado(empleadoData);
    setLoading(false);

    // Cargar información completa del empleado
    cargarEmpleado(dni);
  }, []);

  // Función para cargar información completa del empleado
  const cargarEmpleado = async (dni) => {
    try {
      const response = await api.get(`/empleados/${dni}`);
      
      if (response.data.success) {
        const empleadoCompleto = response.data.data;
        
        // Verificar si el empleado ya está cesado o tiene fecha de cese
        if (empleadoCompleto.EstadoEmpleado === 'Cese' || empleadoCompleto.FechaCese) {
          setEmpleadoCesado(true);
          setEmpleado(prev => ({
            ...prev,
            EstadoEmpleado: empleadoCompleto.EstadoEmpleado || 'Cese',
            FechaCese: empleadoCompleto.FechaCese
          }));
          
          // Si tiene fecha de cese, mostrarla en el campo
          if (empleadoCompleto.FechaCese) {
            setFechaCese(empleadoCompleto.FechaCese.split('T')[0]);
          }
        } else {
          // Empleado activo, limpiar fecha de cese
          setFechaCese('');
        }
      } else {
        setError('Error al cargar información del empleado');
      }
    } catch (error) {
      console.error('Error cargando empleado:', error);
      setError('Error al cargar información del empleado');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fechaCese) {
      setError('Por favor seleccione una fecha de cese');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.put(`/cese/${empleado.DNI}`, {
        fechaCese
      });

      if (response.data.success) {
        setSuccess('Cese registrado exitosamente');
        setEmpleadoCesado(true);
        setFechaCese('');
        
        // Actualizar estado del empleado
        setEmpleado(prev => ({
          ...prev,
          EstadoEmpleado: 'Cese',
          FechaCese: fechaCese
        }));
      } else {
        setError(response.data.message || 'Error al registrar cese');
      }
    } catch (error) {
      console.error('Error registrando cese:', error);
      setError(error.response?.data?.message || 'Error al registrar cese');
    } finally {
      setLoading(false);
    }
  };

  const handleAnularCese = async () => {
    if (!window.confirm('¿Está seguro que desea anular el cese de este empleado?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.delete(`/cese/${empleado.DNI}`);
      
      if (response.data.success) {
        setSuccess('Cese anulado exitosamente');
        setEmpleadoCesado(false);
        setFechaCese('');
        
        // Actualizar estado del empleado
        setEmpleado(prev => ({
          ...prev,
          EstadoEmpleado: 'Activo',
          FechaCese: null
        }));
      } else {
        setError(response.data.message || 'Error al anular cese');
      }
    } catch (error) {
      console.error('Error anulando cese:', error);
      setError(error.response?.data?.message || 'Error al anular cese');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  if (!empleado) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No se ha seleccionado un empleado</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Volver al Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}
        >
          Volver al Dashboard
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Registrar Cese de Empleado
        </Typography>
        <Box sx={{ width: 100 }}></Box> {/* Espaciador para centrar */}
      </Box>

      {/* Información del empleado */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <Typography variant="h6" sx={{ mb: 1, color: '#1e40af', fontWeight: 600 }}>
          {empleado.Nombres} {empleado.ApellidoPaterno} {empleado.ApellidoMaterno || ''}
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
          DNI: {empleado.DNI}
        </Typography>
        
        {/* Mostrar información del cese si existe */}
        {empleadoCesado && empleado.FechaCese && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 600, mb: 1 }}>
              📅 Registro de Cese Existente
            </Typography>
            <Typography variant="body2" sx={{ color: '#92400e' }}>
              <strong>Fecha de Cese:</strong> {formatearFecha(empleado.FechaCese)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#92400e' }}>
              <strong>Estado:</strong> {empleado.EstadoEmpleado || 'Cesado'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Formulario de cese */}
      {!empleadoCesado && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, alignItems: 'end' }}>
              <TextField
                label="Nueva Fecha de Cese"
                type="date"
                value={fechaCese}
                onChange={(e) => setFechaCese(e.target.value)}
                required
                sx={{ flexGrow: 1 }}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                type="submit"
                variant="contained"
                color="error"
                startIcon={<PersonOffIcon />}
                disabled={loading}
                sx={{ px: 4, py: 1.5 }}
              >
                Registrar Cese
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Botón anular cese */}
      {empleadoCesado && (
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<PersonCheckIcon />}
            onClick={handleAnularCese}
            disabled={loading}
            sx={{ px: 4, py: 1.5 }}
          >
            Anular Cese
          </Button>
        </Box>
      )}

      {/* Mensajes */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default Cese;
