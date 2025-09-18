import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

const Dotacion = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dotacionData, setDotacionData] = useState([]);
  const [resumen, setResumen] = useState(null);
  
  // Estados para edición de metas
  const [editandoMeta, setEditandoMeta] = useState(null);
  const [nuevaMeta, setNuevaMeta] = useState('');
  const [showMetaDialog, setShowMetaDialog] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [dotacionResponse, resumenResponse] = await Promise.all([
        api.get('/dotacion'),
        api.get('/dotacion/resumen')
      ]);

      if (dotacionResponse.data.success) {
        setDotacionData(dotacionResponse.data.data.dotacion);
      }

      if (resumenResponse.data.success) {
        setResumen(resumenResponse.data.data);
      }

    } catch (error) {
      console.error('Error cargando datos de dotación:', error);
      setError('Error cargando datos de dotación');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarMeta = (campania) => {
    setEditandoMeta(campania);
    setNuevaMeta(campania.meta.toString());
    setShowMetaDialog(true);
  };

  const handleGuardarMeta = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/dotacion/meta', {
        campaniaId: editandoMeta.campania.id,
        meta: parseInt(nuevaMeta)
      });

      if (response.data.success) {
        setSuccess('Meta guardada exitosamente');
        
        // Actualizar datos locales
        setDotacionData(prevData => 
          prevData.map(item => 
            item.campania.id === editandoMeta.campania.id
              ? {
                  ...item,
                  meta: parseInt(nuevaMeta),
                  cumplimiento: parseInt(nuevaMeta) > 0 ? ((item.dotaActual / parseInt(nuevaMeta)) * 100).toFixed(2) : 0
                }
              : item
          )
        );
        
        setShowMetaDialog(false);
        setEditandoMeta(null);
        setNuevaMeta('');
      }
    } catch (error) {
      console.error('Error guardando meta:', error);
      setError('Error guardando meta');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarEdicion = () => {
    setShowMetaDialog(false);
    setEditandoMeta(null);
    setNuevaMeta('');
  };

  const getCumplimientoColor = (cumplimiento) => {
    const valor = parseFloat(cumplimiento);
    if (valor >= 100) return 'success';
    if (valor >= 80) return 'warning';
    return 'error';
  };

  const getCumplimientoIcon = (cumplimiento) => {
    const valor = parseFloat(cumplimiento);
    if (valor >= 100) return <CheckIcon color="success" />;
    if (valor >= 80) return <TrendingUpIcon color="warning" />;
    return <CloseIcon color="error" />;
  };

  if (loading && dotacionData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          📊 Dotación por Campaña
        </Typography>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Resumen */}
      {resumen && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{resumen.TotalEmpleados}</Typography>
                    <Typography variant="body2">Total Empleados</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckIcon sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{resumen.EmpleadosActivos}</Typography>
                    <Typography variant="body2">Activos</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{resumen.EmpleadosInactivos}</Typography>
                    <Typography variant="body2">Inactivos</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CloseIcon sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{resumen.EmpleadosCesados}</Typography>
                    <Typography variant="body2">Cesados</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabla de Dotación */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  Campaña
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Full Time
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Part Time
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Semi Full
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Dota Actual
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Meta
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                  Cumplimiento
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dotacionData.map((fila, index) => (
                <TableRow 
                  key={fila.campania.id}
                  sx={{ 
                    '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  {/* Campaña */}
                  <TableCell>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {fila.campania.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {fila.campania.id}
                    </Typography>
                  </TableCell>

                  {/* Full Time */}
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={fila.jornadas[1]?.cantidad || 0}
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Part Time */}
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={fila.jornadas[2]?.cantidad || 0}
                      color="secondary"
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Semi Full */}
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={fila.jornadas[3]?.cantidad || 0}
                      color="info"
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Dota Actual */}
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {fila.dotaActual}
                    </Typography>
                  </TableCell>

                  {/* Meta */}
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {fila.meta}
                      </Typography>
                      <Tooltip title="Editar meta">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditarMeta(fila)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>

                  {/* Cumplimiento */}
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      {getCumplimientoIcon(fila.cumplimiento)}
                      <Chip 
                        label={`${fila.cumplimiento}%`}
                        color={getCumplimientoColor(fila.cumplimiento)}
                        variant="filled"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog para editar meta */}
      <Dialog open={showMetaDialog} onClose={handleCancelarEdicion} maxWidth="sm" fullWidth>
        <DialogTitle>
          Editar Meta - {editandoMeta?.campania?.nombre}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nueva Meta"
              type="number"
              value={nuevaMeta}
              onChange={(e) => setNuevaMeta(e.target.value)}
              placeholder="Ingrese la nueva meta"
              helperText="La meta se calculará automáticamente el porcentaje de cumplimiento"
            />
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Dota Actual:</strong> {editandoMeta?.dotaActual} empleados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Cumplimiento actual:</strong> {editandoMeta?.cumplimiento}%
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelarEdicion} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardarMeta} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading || !nuevaMeta || isNaN(parseInt(nuevaMeta))}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dotacion;
