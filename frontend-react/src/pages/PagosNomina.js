import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ExcelJS from 'exceljs';
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
  const exportarExcel = async () => {
    if (reporteNomina.length === 0) {
      setError('No hay datos para exportar');
      return;
    }
    
    setSuccess('Exportando datos a Excel...');
    
    try {
      // Crear nuevo workbook y worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte Nómina');
      
      // Obtener TODAS las columnas del primer registro para incluir todo en Excel
      const primerRegistro = reporteNomina[0];
      const todasLasColumnas = Object.keys(primerRegistro);
      
      console.log('🔍 Todas las columnas disponibles para Excel:', todasLasColumnas);
      
      // Definir encabezados - incluir TODAS las columnas del SP
      const headers = todasLasColumnas.map(columna => {
        // Mapear nombres de columnas a nombres más legibles
        const mapeoNombres = {
          'DNI': 'DNI',
          'Nombres': 'Nombres',
          'ApellidoPaterno': 'Apellido Paterno',
          'ApellidoMaterno': 'Apellido Materno',
          'Campaña': 'Campaña',
          'Cargo': 'Cargo',
          'EstadoEmpleado': 'Estado',
          'SueldoBaseMensual': 'Sueldo Base Mensual',
          'NetoAPagar': 'Neto a Pagar',
          'DiasNoLaborados': 'Días No Laborados',
          // Agregar aquí más mapeos según las columnas que devuelva tu SP
        };
        
        return mapeoNombres[columna] || columna;
      });
      
      // Agregar encabezados con estilos
      const headerRow = worksheet.addRow(headers);
      
      // Estilos para encabezados
      headerRow.eachCell((cell, colNumber) => {
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 12
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2E7D32' } // Verde oscuro
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF1B5E20' } },
          bottom: { style: 'thin', color: { argb: 'FF1B5E20' } },
          left: { style: 'thin', color: { argb: 'FF1B5E20' } },
          right: { style: 'thin', color: { argb: 'FF1B5E20' } }
        };
      });
      
      // Agregar datos - incluir TODAS las columnas del SP
      reporteNomina.forEach((registro, index) => {
        // Crear array con TODAS las columnas del registro
        const rowData = todasLasColumnas.map(columna => {
          const valor = registro[columna];
          
          // Formatear valores según el tipo de dato
          if (typeof valor === 'number') {
            // Si es un número, verificar si es entero o decimal
            if (Number.isInteger(valor)) {
              return valor; // Entero
            } else {
              return parseFloat(valor).toFixed(2); // Decimal con 2 decimales
            }
          } else if (valor === null || valor === undefined) {
            return ''; // Valor vacío
          } else {
            return valor.toString(); // Convertir a string
          }
        });
        
        const row = worksheet.addRow(rowData);
        
        // Aplicar estilos a cada celda de la fila
        row.eachCell((cell, colNumber) => {
          // Estilo base para todas las celdas
          cell.font = {
            size: 11,
            color: { argb: 'FF212121' }
          };
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
          
          // Estilos especiales por columna
          const nombreColumna = todasLasColumnas[colNumber - 1]; // colNumber empieza en 1
          
          if (nombreColumna === 'DNI') {
            cell.font.bold = true;
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF3E5F5' } // Violeta claro
            };
          }
          
          if (nombreColumna === 'EstadoEmpleado' || nombreColumna === 'Estado') {
            cell.font.bold = true;
            if (cell.value === 'CESE') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFEBEE' } // Rojo claro
              };
              cell.font.color = { argb: 'FFC62828' }; // Rojo oscuro
            } else {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE8F5E8' } // Verde claro
              };
              cell.font.color = { argb: 'FF2E7D32' }; // Verde oscuro
            }
          }
          
          // Columnas de montos (sueldos, bonos, totales)
          if (nombreColumna.includes('Sueldo') || nombreColumna.includes('Bono') || 
              nombreColumna.includes('Total') || nombreColumna.includes('Neto') ||
              nombreColumna.includes('Descuento')) {
            cell.alignment.horizontal = 'right';
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF1F8E9' } // Verde muy claro
            };
            cell.font.color = { argb: 'FF1B5E20' }; // Verde oscuro
          }
          
          // Columnas de días
          if (nombreColumna.includes('Dia') || nombreColumna.includes('Dias')) {
            cell.alignment.horizontal = 'center';
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE3F2FD' } // Azul claro
            };
            cell.font.color = { argb: 'FF1565C0' }; // Azul oscuro
          }
          
          // Filas alternadas para mejor legibilidad
          if (index % 2 === 1) {
            if (!cell.fill || cell.fill.type !== 'pattern') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFAFAFA' } // Gris muy claro
              };
            }
          }
        });
      });
      
      // Configurar ancho de columnas automáticamente según el contenido
      worksheet.columns.forEach((column, index) => {
        // Anchos base según el tipo de columna
        const columna = todasLasColumnas[index];
        let ancho = 15; // Ancho por defecto
        
        // Ajustar ancho según el tipo de contenido
        if (columna === 'DNI') ancho = 12;
        else if (columna.includes('Nombre') || columna.includes('Apellido')) ancho = 20;
        else if (columna.includes('Campaña') || columna.includes('Cargo')) ancho = 25;
        else if (columna.includes('Sueldo') || columna.includes('Bono') || columna.includes('Total') || columna.includes('Neto')) ancho = 18;
        else if (columna.includes('Día') || columna.includes('Dias')) ancho = 15;
        else if (columna.includes('Estado')) ancho = 12;
        else ancho = 15;
        
        column.width = ancho;
      });
      
      // Generar nombre del archivo
      const mesNombre = meses.find(m => m.value === filtros.mes)?.label || filtros.mes;
      const fileName = `Reporte_Nomina_${mesNombre}_${filtros.anio}.xlsx`;
      
      // Generar y descargar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      
      setTimeout(() => {
        setSuccess('Archivo Excel con estilos generado y descargado exitosamente');
      }, 1000);
      
    } catch (error) {
      console.error('Error generando Excel:', error);
      setError('Error generando archivo Excel. Intente nuevamente.');
    }
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
            <FormControl fullWidth sx={{ width: '8rem' }}>
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
              sx={{ 
                backgroundColor: '#16a34a', 
                '&:hover': { backgroundColor: '#15803d' },
                px: 3,
                py: 1.5
              }}
            >
              📊 Descargar Excel
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
