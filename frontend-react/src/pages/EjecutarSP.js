import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const EjecutarSP = () => {
  const { api } = useAuth();
  const [reportDates, setReportDates] = useState({
    fechaInicio: '',
    fechaFin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastExecution, setLastExecution] = useState(null);

  // Función para obtener fechas por defecto
  const getFechasPorDefecto = () => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    return {
      fechaInicio: primerDiaMes.toISOString().split('T')[0], // YYYY-MM-01
      fechaFin: hoy.toISOString().split('T')[0] // YYYY-MM-DD (hoy)
    };
  };

  // Establecer fechas por defecto al cargar la página
  React.useEffect(() => {
    const fechasPorDefecto = getFechasPorDefecto();
    setReportDates(fechasPorDefecto);
  }, []);

  const generateReport = async () => {
    if (!reportDates.fechaInicio || !reportDates.fechaFin) {
      setError('Por favor seleccione ambas fechas');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/reportes/asistencia', reportDates);
      if (response.data.success) {
        setSuccess('SP ejecutado exitosamente');
        setLastExecution({
          fechaInicio: reportDates.fechaInicio,
          fechaFin: reportDates.fechaFin,
          registrosGenerados: response.data.data.registrosGenerados,
          timestamp: new Date().toLocaleString()
        });
        setError('');
      } else {
        setError(response.data.message || 'Error ejecutando SP');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDates = () => {
    const fechasPorDefecto = getFechasPorDefecto();
    setReportDates(fechasPorDefecto);
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header simple y limpio */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 600, 
          color: '#1e293b',
          mb: 1
        }}>
          Ejecutar Stored Procedure
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Generar Reporte de Asistencia Maestro
        </Typography>
      </Box>

      {/* Información del SP - Diseño más simple */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: '#1e40af' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
            Información del SP
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>SP:</strong> usp_GenerarReporteAsistenciaMaestro
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Base de Datos:</strong> Partner
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Parámetros:</strong> @FechaInicio, @FechaFin
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Acceso:</strong> Solo Analistas y Creador
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Formulario principal */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CalendarIcon sx={{ mr: 1, color: '#059669' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Seleccionar Rango de Fechas
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                Fecha de Inicio *
              </Typography>
              <TextField
                type="date"
                value={reportDates.fechaInicio}
                onChange={(e) => setReportDates({ ...reportDates, fechaInicio: e.target.value })}
                fullWidth
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1e40af'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1e40af'
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                Fecha de Fin *
              </Typography>
              <TextField
                type="date"
                value={reportDates.fechaFin}
                onChange={(e) => setReportDates({ ...reportDates, fechaFin: e.target.value })}
                fullWidth
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1e40af'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1e40af'
                    }
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* Botón de reset centrado */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleResetDates}
              sx={{
                borderColor: '#6b7280',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#374151',
                  backgroundColor: '#f9fafb'
                }
              }}
            >
              Restablecer fechas por defecto
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Botón de ejecución principal */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Button
          onClick={generateReport}
          variant="contained"
          size="large"
          disabled={loading || !reportDates.fechaInicio || !reportDates.fechaFin}
          startIcon={loading ? null : <AssessmentIcon />}
          sx={{
            backgroundColor: '#1e40af',
            fontSize: '1rem',
            px: 4,
            py: 1.5,
            '&:hover': {
              backgroundColor: '#1e3a8a'
            },
            '&:disabled': {
              backgroundColor: '#9ca3af'
            }
          }}
        >
          {loading ? 'Ejecutando SP...' : 'Ejecutar Stored Procedure'}
        </Button>
      </Box>

      {/* Mensajes de estado */}
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

      {/* Información de última ejecución - Diseño más simple */}
      {lastExecution && (
        <Paper sx={{ p: 3, backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon sx={{ mr: 1, color: '#059669' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#065f46' }}>
              Última Ejecución Exitosa
            </Typography>
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" sx={{ mb: 0.5, color: '#64748b' }}>
                Fecha Inicio
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {lastExecution.fechaInicio}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" sx={{ mb: 0.5, color: '#64748b' }}>
                Fecha Fin
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {lastExecution.fechaFin}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" sx={{ mb: 0.5, color: '#64748b' }}>
                Registros Generados
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#059669' }}>
                {lastExecution.registrosGenerados}
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Ejecutado: {lastExecution.timestamp}
          </Typography>
        </Paper>
      )}

      {/* Nota informativa simple */}
      <Alert 
        severity="info" 
        sx={{ mt: 3 }}
      >
        Este SP es crítico y ejecuta operaciones importantes en la base de datos. 
        Asegúrese de seleccionar el rango de fechas correcto antes de ejecutarlo.
      </Alert>
    </Box>
  );
};

export default EjecutarSP;
