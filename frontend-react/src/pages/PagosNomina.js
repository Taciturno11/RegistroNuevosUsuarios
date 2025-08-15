import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Button,
  Grid,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const PagosNomina = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    anio: new Date().getFullYear().toString(),
    mes: ''
  });

  // Estados para datos
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [reporteNomina, setReporteNomina] = useState([]);
  const [meses] = useState([
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ]);

  // Cargar años disponibles
  const cargarAniosDisponibles = useCallback(async () => {
    try {
      const response = await api.get('/nomina/anios-disponibles');
      if (response.data.success) {
        setAniosDisponibles(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando años disponibles:', error);
      setError('Error cargando años disponibles. Intente recargar la página.');
    }
  }, [api]);

  // Cargar años disponibles al montar el componente
  useEffect(() => {
    cargarAniosDisponibles();
  }, [cargarAniosDisponibles]);

  // Generar reporte de nómina
  const generarReporte = async () => {
    if (!filtros.anio || !filtros.mes) {
      setError('Por favor complete año y mes');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.get(`/nomina/generar-reporte?anio=${filtros.anio}&mes=${filtros.mes}`);
      
      if (response.data.success) {
        console.log('📊 Datos recibidos del backend:', response.data.data.registros);
        
        // Mapear los datos para asegurar que se muestren correctamente
        const registrosMapeados = response.data.data.registros.map(registro => {
          // Log de cada registro para debug
          console.log('🔍 Registro individual:', registro);
          
          return {
            ...registro,
            // Mapear usando los nombres exactos que devuelve el stored procedure
            DNI: registro.DNI || 'N/A',
            Nombres: registro.Nombres || 'N/A',
            ApellidoPaterno: registro.ApellidoPaterno || 'N/A',
            ApellidoMaterno: registro.ApellidoMaterno || '',
            NombreCampaña: registro.Campaña || 'N/A',
            NombreCargo: registro.Cargo || 'N/A',
            SueldoBase: registro.SueldoBaseMensual || 0,
            DiasTrabajados: 31 - (registro.DiasNoLaborados || 0), // Calcular días trabajados
            DiasAsistidos: Object.values(registro).filter(val => val === 'A').length, // Contar 'A' (Asistencia)
            DiasFaltados: Object.values(registro).filter(val => val === 'FI').length, // Contar 'FI' (Falta Injustificada)
            TotalPagar: registro.NetoAPagar || 0
          };
        });
        
        setReporteNomina(registrosMapeados);
        setSuccess(`Reporte generado exitosamente - ${response.data.data.totalRegistros} registros encontrados`);
      } else {
        setError(response.data.message || 'Error generando reporte');
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      anio: new Date().getFullYear().toString(),
      mes: ''
    });
    setReporteNomina([]);
    setError('');
    setSuccess('');
  };

  // Exportar a Excel
  const exportarExcel = () => {
    if (reporteNomina.length === 0) {
      setError('No hay datos para exportar');
      return;
    }
    
    setSuccess('Exportando datos a Excel...');
    
    // Crear contenido CSV
    const headers = [
      'DNI',
      'Nombres',
      'Apellido Paterno',
      'Apellido Materno',
      'Campaña',
      'Cargo',
      'Estado',
      'Sueldo Base',
      'Bono Conexión',
      'Bono Dinámica',
      'Bono Movilidad',
      'Bono Variable',
      'Días Trabajados',
      'Días Asistidos',
      'Días Faltados',
      'Descuento Días No Pagados',
      'Total a Pagar'
    ];
    
    const csvContent = [
      headers.join(','),
      ...reporteNomina.map(registro => [
        registro.DNI || '',
        `"${registro.Nombres || ''}"`,
        `"${registro.ApellidoPaterno || ''}"`,
        `"${registro.ApellidoMaterno || ''}"`,
        `"${registro.NombreCampaña || ''}"`,
        `"${registro.NombreCargo || ''}"`,
        registro.EstadoEmpleado || 'ACTIVO',
        registro.SueldoBase || 0,
        registro.BonoConexion || 0,
        registro.BonoDinamica || 0,
        registro.BonoMovilidad || 0,
        registro.BonoVariable || 0,
        registro.DiasTrabajados || 0,
        registro.DiasAsistidos || 0,
        registro.DiasFaltados || 0,
        registro.DescuentoDiasNoPagados || 0,
        registro.TotalPagar || 0
      ].join(','))
    ].join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Nomina_${filtros.mes}_${filtros.anio}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setSuccess('Datos exportados exitosamente');
    }, 1000);
  };

  // Ver detalle del registro
  const verDetalle = (registro) => {
    setSuccess(`Viendo detalle de ${registro.Nombres} ${registro.ApellidoPaterno}`);
    // Aquí iría la lógica para mostrar el detalle
  };

  // Editar registro
  const editarRegistro = (registro) => {
    setSuccess(`Editando registro de ${registro.Nombres} ${registro.ApellidoPaterno}`);
    // Aquí iría la lógica para editar
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountBalanceIcon sx={{ mr: 2, fontSize: '2rem', color: '#16a34a' }} />
              <Typography variant="h4">Reporte de Nómina y Asistencia</Typography>
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

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#16a34a' }}>
          🔍 Parámetros del Reporte
        </Typography>
        
        <Grid container spacing={3} alignItems="end">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Año</InputLabel>
              <Select
                value={filtros.anio}
                onChange={(e) => setFiltros(prev => ({ ...prev, anio: e.target.value }))}
                label="Año"
              >
                {aniosDisponibles.map((anio) => (
                  <MenuItem key={anio} value={anio.toString()}>
                    {anio}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={{ width: '5rem' }}>
              <InputLabel>Mes</InputLabel>
              <Select
                value={filtros.mes}
                onChange={(e) => setFiltros(prev => ({ ...prev, mes: e.target.value }))}
                label="Mes"
              >
                <MenuItem value="" disabled>-- Elegir --</MenuItem>
                {meses.map((mes) => (
                  <MenuItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                onClick={generarReporte}
                disabled={loading}
                sx={{ backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' } }}
              >
                {loading ? 'Generando...' : 'Generar Reporte'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={limpiarFiltros}
                disabled={loading}
              >
                Limpiar
              </Button>
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

      {/* Estadísticas del Reporte */}
      {reporteNomina.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f0fdf4' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#16a34a' }}>
            📊 Resumen del Reporte
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {reporteNomina.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Empleados
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                  S/ {reporteNomina.reduce((sum, r) => sum + (r.TotalPagar || 0), 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total a Pagar
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {reporteNomina.filter(r => r.EstadoEmpleado === 'CESE').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Empleados en Cese
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                  {reporteNomina.filter(r => r.EstadoEmpleado !== 'CESE').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Empleados Activos
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Resultados */}
      {reporteNomina.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" color="primary">
              📊 Reporte de Nómina - {meses.find(m => m.value === filtros.mes)?.label} {filtros.anio}
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportarExcel}
              sx={{ backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' } }}
            >
              Descargar Excel
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell><strong>DNI</strong></TableCell>
                  <TableCell><strong>Empleado</strong></TableCell>
                  <TableCell><strong>Campaña</strong></TableCell>
                  <TableCell><strong>Cargo</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="right"><strong>Sueldo Base</strong></TableCell>
                  <TableCell align="right"><strong>Días Trabajados</strong></TableCell>
                  <TableCell align="right"><strong>Días Asistidos</strong></TableCell>
                  <TableCell align="right"><strong>Días Faltados</strong></TableCell>
                  <TableCell align="right"><strong>Total a Pagar</strong></TableCell>
                  <TableCell><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reporteNomina.map((registro, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{registro.DNI || 'N/A'}</TableCell>
                    <TableCell>
                      {`${registro.Nombres || ''} ${registro.ApellidoPaterno || ''} ${registro.ApellidoMaterno || ''}`.trim() || 'N/A'}
                    </TableCell>
                    <TableCell>{registro.NombreCampaña || 'N/A'}</TableCell>
                    <TableCell>{registro.NombreCargo || 'N/A'}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        backgroundColor: registro.EstadoEmpleado === 'CESE' ? '#fef2f2' : '#f0fdf4',
                        color: registro.EstadoEmpleado === 'CESE' ? '#dc2626' : '#16a34a',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {registro.EstadoEmpleado || 'ACTIVO'}
                      </Box>
                    </TableCell>
                    <TableCell align="right">S/ {parseFloat(registro.SueldoBase || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{registro.DiasTrabajados || 0}</TableCell>
                    <TableCell align="right">{registro.DiasAsistidos || 0}</TableCell>
                    <TableCell align="right">{registro.DiasFaltados || 0}</TableCell>
                    <TableCell align="right">
                      <strong>S/ {parseFloat(registro.TotalPagar || 0).toFixed(2)}</strong>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Ver detalle">
                          <IconButton
                            size="small"
                            onClick={() => verDetalle(registro)}
                            sx={{ color: '#16a34a' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => editarRegistro(registro)}
                            sx={{ color: '#16a34a' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Estado vacío */}
      {!loading && reporteNomina.length === 0 && filtros.anio && filtros.mes && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            📭 No se encontraron registros
          </Typography>
          <Typography color="text.secondary">
            No hay registros de nómina para {meses.find(m => m.value === filtros.mes)?.label} {filtros.anio}.
          </Typography>
        </Paper>
      )}

      {/* Instrucciones */}
      {!loading && reporteNomina.length === 0 && (!filtros.anio || !filtros.mes) && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            🚀 Generar Reporte de Nómina
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Selecciona el año y mes para generar el reporte de nómina y asistencia.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            El sistema ejecutará el stored procedure <code>GenerarReporteNominaYAsistencia</code> 
            con los parámetros seleccionados.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PagosNomina;
