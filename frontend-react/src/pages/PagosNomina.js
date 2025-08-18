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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Close as CloseIcon
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
  const [modalBonos, setModalBonos] = useState({ open: false, empleado: null });
  
  // Estados para la nueva sección "Pagos por Área"
  const [areasExpandidas, setAreasExpandidas] = useState({});
  const [campañasExpandidas, setCampañasExpandidas] = useState({});
  
  // Estructura de áreas y campañas
  const [areasCampañas] = useState({
    'OUTBOUND': [
      'MIGRACION',
      'PORTABILIDAD PREPAGO', 
      'RENOVACION',
      'HOGAR',
      'REGULARIZACION',
      'PORTABILIDAD POSPAGO',
      'PREPAGO DIGITAL'
    ],
    'INBOUND': [
      'UNIFICADO',
      'AUDITORIA',
      'CROSSELLING',
      'BACK SEGUIMIENTO',
      'REDES SOCIALES'
    ],
    'STAFF': [
      'ESTRUCTURA',
      'CALIDAD',
      'CAPACITACION',
      'ANALISTAS'
    ]
  });
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

  // Función para calcular días correctamente
  const calcularDias = (registro) => {
    // Calcular días reales del mes
    const fecha = new Date(parseInt(filtros.anio), parseInt(filtros.mes) - 1, 1);
    const diasDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
    
    // Identificar solo columnas que representen días del mes
    const columnasDias = Object.keys(registro).filter(col => 
      col.startsWith('Dia') && /^Dia\d+$/.test(col)
    );
    
    // Contar diferentes tipos de asistencia y faltas
    const diasAsistidos = columnasDias.filter(dia => 
      ['A', 'T', 'ST', 'P'].includes(registro[dia])
    ).length;
    
    const faltasInjustificadas = columnasDias.filter(dia => 
      registro[dia] === 'FI'
    ).length;
    
    const faltasJustificadas = columnasDias.filter(dia => 
      registro[dia] === 'FJ'
    ).length;
    
    const totalFaltas = faltasInjustificadas + faltasJustificadas;
    const diasTrabajados = diasDelMes - totalFaltas;
    
    return {
      diasDelMes,
      diasAsistidos,
      diasFaltados: totalFaltas,
      diasTrabajados,
      faltasInjustificadas,
      faltasJustificadas
    };
  };

  // Función para calcular pagos por áreas y campañas
  const calcularPagosPorAreas = useCallback(() => {
    if (!reporteNomina || reporteNomina.length === 0) return {};
    
    // Función para obtener área por campaña (definida dentro del callback)
    const obtenerAreaPorCampaña = (campaña) => {
      for (const [area, campañas] of Object.entries(areasCampañas)) {
        if (campañas.includes(campaña)) {
          return area;
        }
      }
      return 'OTROS';
    };
    
    const areas = {};
    let totalGeneral = 0;
    
    // Agrupar por área y campaña
    reporteNomina.forEach(registro => {
      const area = obtenerAreaPorCampaña(registro.NombreCampaña);
      if (!areas[area]) {
        areas[area] = {
          total: 0,
          empleados: 0,
          campañas: {}
        };
      }
      
      areas[area].total += parseFloat(registro.TotalPagar || 0);
      areas[area].empleados += 1;
      totalGeneral += parseFloat(registro.TotalPagar || 0);
      
      // Agrupar por campaña
      if (!areas[area].campañas[registro.NombreCampaña]) {
        areas[area].campañas[registro.NombreCampaña] = {
          total: 0,
          empleados: 0,
          registros: []
        };
      }
      areas[area].campañas[registro.NombreCampaña].total += parseFloat(registro.TotalPagar || 0);
      areas[area].campañas[registro.NombreCampaña].empleados += 1;
      areas[area].campañas[registro.NombreCampaña].registros.push(registro);
    });
    
    // Calcular porcentajes
    Object.keys(areas).forEach(area => {
      areas[area].porcentaje = totalGeneral > 0 ? (areas[area].total / totalGeneral) * 100 : 0;
      Object.keys(areas[area].campañas).forEach(campaña => {
        areas[area].campañas[campaña].porcentaje = areas[area].total > 0 ? 
          (areas[area].campañas[campaña].total / areas[area].total) * 100 : 0;
      });
    });
    
    return { areas, totalGeneral };
  }, [reporteNomina, areasCampañas]);

  // Función para alternar expansión de área
  const toggleArea = (area) => {
    setAreasExpandidas(prev => ({
      ...prev,
      [area]: !prev[area]
    }));
  };

  // Función para alternar expansión de campaña
  const toggleCampaña = (area, campaña) => {
    const key = `${area}-${campaña}`;
    setCampañasExpandidas(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
          
          // Calcular días usando la nueva lógica
          const calculoDias = calcularDias(registro);
          
          // Log detallado del cálculo para debug
          console.log(`🔍 Cálculo de días para ${registro.Nombres || 'Empleado'}:`, {
            diasDelMes: calculoDias.diasDelMes,
            diasAsistidos: calculoDias.diasAsistidos,
            diasFaltados: calculoDias.diasFaltados,
            diasTrabajados: calculoDias.diasTrabajados,
            faltasInjustificadas: calculoDias.faltasInjustificadas,
            faltasJustificadas: calculoDias.faltasJustificadas
          });
          
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
            // Usar la nueva lógica de cálculo
            DiasTrabajados: calculoDias.diasTrabajados,
            DiasAsistidos: calculoDias.diasAsistidos,
            DiasFaltados: calculoDias.diasFaltados,
            // Información adicional para debug
            DiasDelMes: calculoDias.diasDelMes,
            FaltasInjustificadas: calculoDias.faltasInjustificadas,
            FaltasJustificadas: calculoDias.faltasJustificadas,
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
      
      // Obtener SOLO las columnas originales del SP (excluir columnas calculadas del frontend)
      const primerRegistro = reporteNomina[0];
      
      // Lista de columnas que NO son del SP (se agregan en el frontend)
      const columnasCalculadas = [
        'DiasTrabajados',
        'DiasAsistidos', 
        'DiasFaltados',
        'DiasDelMes',
        'FaltasInjustificadas',
        'FaltasJustificadas',
        'NombreCampaña',
        'NombreCargo',
        'SueldoBase',
        'TotalPagar'
      ];
      
      // Filtrar solo las columnas originales del SP
      const columnasOriginales = Object.keys(primerRegistro).filter(col => 
        !columnasCalculadas.includes(col)
      );
      
      console.log('🔍 Columnas originales del SP:', columnasOriginales);
      console.log('🔍 Columnas calculadas del frontend:', columnasCalculadas);
      console.log('🔍 Primer registro completo:', primerRegistro);
      
      // Usar SOLO las columnas originales del SP
      const todasLasColumnas = columnasOriginales;
      
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
           } else if (typeof valor === 'string' && valor.includes('T') && valor.includes('Z')) {
             // Es una fecha ISO, convertir a formato YYYY-MM-DD
             try {
               const fecha = new Date(valor);
               if (!isNaN(fecha.getTime())) {
                 return fecha.toISOString().split('T')[0]; // Retorna YYYY-MM-DD
               }
             } catch (e) {
               // Si falla la conversión, retornar el valor original
             }
             return valor.toString();
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
    abrirModalBonos(registro);
  };

  // Abrir modal de bonos
  const abrirModalBonos = (empleado) => {
    setModalBonos({ open: true, empleado });
  };

  // Cerrar modal de bonos
  const cerrarModalBonos = () => {
    setModalBonos({ open: false, empleado: null });
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
              
              {reporteNomina.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={exportarExcel}
                  sx={{ 
                    backgroundColor: '#059669', 
                    '&:hover': { backgroundColor: '#047857' },
                    px: 3,
                    py: 1.5
                  }}
                >
                  📊 Descargar Excel
                </Button>
              )}
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
          
          {/* KPIs Principales */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
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
                   S/ {reporteNomina.reduce((sum, r) => sum + (r.TotalPagar || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

                     {/* KPIs de Bonos - Detectados automáticamente */}
           {(() => {
             // Detectar automáticamente todas las columnas de bonos
             if (reporteNomina.length === 0) return null;
             
             const primerRegistro = reporteNomina[0];
             const columnasBonos = Object.keys(primerRegistro).filter(columna => 
               columna.toLowerCase().includes('bono') && 
               typeof primerRegistro[columna] === 'number'
             );
             
             if (columnasBonos.length === 0) return null;
             
             const totalAPagar = reporteNomina.reduce((sum, r) => sum + (r.TotalPagar || 0), 0);
             
             // Calcular totales de bonos y ordenarlos de mayor a menor
             const bonosConTotales = columnasBonos.map(columnaBono => {
               const totalBono = reporteNomina.reduce((sum, r) => sum + (r[columnaBono] || 0), 0);
               return {
                 columna: columnaBono,
                 total: totalBono,
                 porcentaje: totalAPagar > 0 ? ((totalBono / totalAPagar) * 100) : 0
               };
             });
             
             // Ordenar de mayor a menor por total
             bonosConTotales.sort((a, b) => b.total - a.total);
             
             return (
               <>
                 <Typography variant="h6" sx={{ mb: 2, color: '#16a34a', mt: 3 }}>
                   💰 Análisis de Bonos (Ordenados por Valor)
                 </Typography>
                 <Grid container spacing={2}>
                   {bonosConTotales.map((bono, index) => {
                     // Mapear nombres de columnas a nombres legibles
                     const nombreLegible = bono.columna
                       .replace(/([A-Z])/g, ' $1') // Agregar espacio antes de mayúsculas
                       .replace(/^./, str => str.toUpperCase()) // Primera letra mayúscula
                       .trim();
                     
                     return (
                       <Grid item xs={12} sm={6} md={4} lg={3} key={bono.columna}>
                         <Box sx={{ 
                           textAlign: 'center', 
                           p: 2, 
                           backgroundColor: 'white', 
                           borderRadius: 2,
                           border: '1px solid #e0e0e0',
                           height: '100%',
                           display: 'flex',
                           flexDirection: 'column',
                           justifyContent: 'center'
                         }}>
                           <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                             S/ {bono.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </Typography>
                           <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                             {nombreLegible}
                           </Typography>
                           <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                             {bono.porcentaje.toFixed(1)}% del total
                           </Typography>
                         </Box>
                       </Grid>
                     );
                   })}
                 </Grid>
               </>
             );
           })()}
        </Paper>
      )}

      {/* Pagos por Área */}
      {reporteNomina.length > 0 && (() => {
        const pagosPorAreas = calcularPagosPorAreas();
        if (!pagosPorAreas.areas || Object.keys(pagosPorAreas.areas).length === 0) return null;
        
        return (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#16a34a' }}>
              🏢 Pagos por Área
            </Typography>
            
            {/* Menú fijo de áreas */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {Object.keys(pagosPorAreas.areas).map((area) => {
                const datosArea = pagosPorAreas.areas[area];
                const isAreaSelected = areasExpandidas[area];
                const porcentaje = datosArea.porcentaje;
                
                // Definir colores únicos para cada área
                const coloresArea = {
                  'OUTBOUND': '#3b82f6', // Azul
                  'INBOUND': '#8b5cf6',  // Violeta
                  'STAFF': '#f59e0b'     // Naranja
                };
                
                const colorArea = coloresArea[area] || '#16a34a';
                
                return (
                  <Grid item xs={12} md={4} key={area}>
                    <Box sx={{ 
                      backgroundColor: isAreaSelected ? '#f0fdf4' : 'white', 
                      borderRadius: 2,
                      border: `2px solid ${isAreaSelected ? colorArea : '#e0e0e0'}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        transform: 'translateY(-2px)', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        borderColor: colorArea
                      }
                    }}
                    onClick={() => toggleArea(area)}
                    >
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: colorArea }}>
                          {area}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: '#16a34a' }}>
                          S/ {datosArea.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {porcentaje.toFixed(1)}% del total | {datosArea.empleados} empleados
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Sección de campañas (aparece debajo del menú fijo) */}
            {Object.keys(pagosPorAreas.areas).map((area) => {
              if (!areasExpandidas[area]) return null;
              
              const datosArea = pagosPorAreas.areas[area];
              const coloresArea = {
                'OUTBOUND': '#3b82f6',
                'INBOUND': '#8b5cf6',
                'STAFF': '#f59e0b'
              };
              const colorArea = coloresArea[area] || '#16a34a';
              
              return (
                <Box key={area} sx={{ mt: 3, p: 3, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'center', color: colorArea }}>
                    📋 Campañas de {area}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {Object.keys(datosArea.campañas).map((campaña) => {
                      const datosCampaña = datosArea.campañas[campaña];
                      const isCampañaExpanded = campañasExpandidas[`${area}-${campaña}`];
                      
                      return (
                        <Grid item xs={12} key={campaña}>
                          <Box sx={{ 
                            p: 2, 
                            backgroundColor: 'white',
                            borderRadius: 2,
                            border: '1px solid #e0e0e0',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              borderColor: colorArea
                            }
                          }}
                          onClick={() => toggleCampaña(area, campaña)}
                          >
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colorArea, mb: 2 }}>
                                {campaña}
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669', mb: 2 }}>
                                S/ {datosCampaña.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {datosCampaña.empleados} empleados | {datosCampaña.porcentaje.toFixed(1)}% del área
                              </Typography>
                            </Box>

                            {/* Empleados expandidos */}
                            {isCampañaExpanded && (
                              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e5e7eb' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textAlign: 'center', color: colorArea }}>
                                  👥 Empleados de {campaña}
                                </Typography>
                                
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>DNI</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Empleado</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Cargo</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Sueldo Base</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Días Trabajados</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Días Asistidos</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Días Faltados</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Total a Pagar</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {datosCampaña.registros.map((empleado, index) => (
                                        <TableRow key={index} hover>
                                          <TableCell>{empleado.DNI || 'N/A'}</TableCell>
                                          <TableCell>
                                            {`${empleado.Nombres || ''} ${empleado.ApellidoPaterno || ''} ${empleado.ApellidoMaterno || ''}`.trim() || 'N/A'}
                                          </TableCell>
                                          <TableCell>{empleado.NombreCargo || 'N/A'}</TableCell>
                                          <TableCell>
                                            <Box sx={{ 
                                              px: 1, 
                                              py: 0.5, 
                                              borderRadius: 1, 
                                              backgroundColor: empleado.FechaCesePorBaja ? '#fef2f2' : '#f0fdf4',
                                              color: empleado.FechaCesePorBaja ? '#dc2626' : '#16a34a',
                                              fontSize: '0.75rem',
                                              fontWeight: 600,
                                              textAlign: 'center'
                                            }}>
                                              {empleado.FechaCesePorBaja ? 'CESE' : 'ACTIVO'}
                                            </Box>
                                          </TableCell>
                                          <TableCell align="right">
                                            S/ {(empleado.SueldoBase || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </TableCell>
                                          <TableCell align="right">{empleado.DiasTrabajados || 0}</TableCell>
                                          <TableCell align="right">{empleado.DiasAsistidos || 0}</TableCell>
                                          <TableCell align="right">{empleado.DiasFaltados || 0}</TableCell>
                                          <TableCell align="right">
                                            S/ {(empleado.TotalPagar || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </TableCell>
                                          <TableCell>
                                            <Tooltip title="Ver bonos del empleado">
                                              <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setModalBonos({ open: true, empleado });
                                                }}
                                                sx={{ color: colorArea }}
                                              >
                                                <VisibilityIcon />
                                              </IconButton>
                                            </Tooltip>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              );
            })}
          </Paper>
        );
      })()}

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

       {/* Modal de Bonos del Empleado */}
       <Dialog 
         open={modalBonos.open} 
         onClose={cerrarModalBonos}
         maxWidth="md"
         fullWidth
       >
         <DialogTitle sx={{ 
           backgroundColor: '#16a34a', 
           color: 'white',
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center'
         }}>
           <Box sx={{ display: 'flex', alignItems: 'center' }}>
             <Typography variant="h6">
               💰 Detalle de Bonos - {modalBonos.empleado?.Nombres} {modalBonos.empleado?.ApellidoPaterno}
             </Typography>
           </Box>
           <IconButton onClick={cerrarModalBonos} sx={{ color: 'white' }}>
             <CloseIcon />
           </IconButton>
         </DialogTitle>
         
         <DialogContent sx={{ pt: 3 }}>
           {modalBonos.empleado && (() => {
             // Obtener todas las columnas de bonos del empleado
             const columnasBonos = Object.keys(modalBonos.empleado).filter(columna => 
               columna.toLowerCase().includes('bono') && 
               typeof modalBonos.empleado[columna] === 'number' &&
               modalBonos.empleado[columna] > 0
             );
             
             if (columnasBonos.length === 0) {
               return (
                 <Box sx={{ textAlign: 'center', py: 4 }}>
                   <Typography variant="h6" color="text.secondary">
                     Este empleado no tiene bonos asignados
                   </Typography>
                 </Box>
               );
             }
             
             return (
               <Box>
                 {/* Información del empleado */}
                 <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f8fafc' }}>
                   <Grid container spacing={2}>
                     <Grid item xs={12} md={6}>
                       <Typography variant="body2" color="text.secondary">DNI:</Typography>
                       <Typography variant="body1" fontWeight="bold">{modalBonos.empleado.DNI}</Typography>
                     </Grid>
                     <Grid item xs={12} md={6}>
                       <Typography variant="body2" color="text.secondary">Cargo:</Typography>
                       <Typography variant="body1" fontWeight="bold">{modalBonos.empleado.NombreCargo}</Typography>
                     </Grid>
                     <Grid item xs={12} md={6}>
                       <Typography variant="body2" color="text.secondary">Campaña:</Typography>
                       <Typography variant="body1" fontWeight="bold">{modalBonos.empleado.NombreCampaña}</Typography>
                     </Grid>
                     <Grid item xs={12} md={6}>
                       <Typography variant="body2" color="text.secondary">Total a Pagar:</Typography>
                       <Typography variant="h6" color="success.main" fontWeight="bold">
                         S/ {parseFloat(modalBonos.empleado.TotalPagar || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </Typography>
                     </Grid>
                   </Grid>
                 </Paper>

                 {/* Lista de bonos */}
                 <Typography variant="h6" sx={{ mb: 2, color: '#16a34a' }}>
                   📊 Desglose de Bonos
                 </Typography>
                 
                 <Grid container spacing={2}>
                   {columnasBonos.map((columnaBono) => {
                     const valorBono = modalBonos.empleado[columnaBono];
                     const totalAPagar = modalBonos.empleado.TotalPagar || 0;
                     const porcentajeBono = totalAPagar > 0 ? ((valorBono / totalAPagar) * 100) : 0;
                     
                     // Mapear nombres de columnas a nombres legibles
                     const nombreLegible = columnaBono
                       .replace(/([A-Z])/g, ' $1')
                       .replace(/^./, str => str.toUpperCase())
                       .trim();
                     
                     return (
                       <Grid item xs={12} sm={6} md={4} key={columnaBono}>
                         <Paper sx={{ 
                           p: 2, 
                           textAlign: 'center',
                           border: '1px solid #e0e0e0',
                           backgroundColor: 'white'
                         }}>
                           <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                             S/ {valorBono.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </Typography>
                           <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                             {nombreLegible}
                           </Typography>
                           <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                             {porcentajeBono.toFixed(1)}% del total
                           </Typography>
                         </Paper>
                       </Grid>
                     );
                   })}
                 </Grid>

                 {/* Resumen */}
                 <Paper sx={{ p: 2, mt: 3, backgroundColor: '#f0fdf4' }}>
                   <Typography variant="h6" sx={{ mb: 2, color: '#16a34a' }}>
                     📋 Resumen
                   </Typography>
                   <Grid container spacing={2}>
                     <Grid item xs={12} md={4}>
                       <Typography variant="body2" color="text.secondary">Total Bonos:</Typography>
                       <Typography variant="h6" color="primary" fontWeight="bold">
                         S/ {columnasBonos.reduce((sum, col) => sum + (modalBonos.empleado[col] || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </Typography>
                     </Grid>
                     <Grid item xs={12} md={4}>
                       <Typography variant="body2" color="text.secondary">Sueldo Base:</Typography>
                       <Typography variant="h6" color="info.main" fontWeight="bold">
                         S/ {parseFloat(modalBonos.empleado.SueldoBase || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </Typography>
                     </Grid>
                     <Grid item xs={12} md={4}>
                       <Typography variant="body2" color="text.secondary">Cantidad de Bonos:</Typography>
                       <Typography variant="h6" color="warning.main" fontWeight="bold">
                         {columnasBonos.length}
                       </Typography>
                     </Grid>
                   </Grid>
                 </Paper>
               </Box>
             );
           })()}
         </DialogContent>
         
         <DialogActions sx={{ p: 2 }}>
           <Button onClick={cerrarModalBonos} variant="outlined">
             Cerrar
           </Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 };

export default PagosNomina;
