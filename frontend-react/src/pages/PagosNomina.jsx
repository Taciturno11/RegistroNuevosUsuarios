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
  DialogActions,
  Popover
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
  ChartDataLabels
);

const PagosNomina = () => {
  // Estilos CSS para animaciones
  React.useEffect(() => {
    // Agregar estilos CSS para la animación de pulso
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
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
  const [diagnostico, setDiagnostico] = useState(null);
  
  // Estados para la nueva sección "Pagos por Área"
  const [areasExpandidas, setAreasExpandidas] = useState({});
  const [campañasExpandidas, setCampañasExpandidas] = useState({});
  
  // Estado para el popover de fórmula de descuento
  const [popoverDescuento, setPopoverDescuento] = useState({ open: false, anchorEl: null });
  
  // Estructura de áreas y campañas
  const [areasCampañas] = useState({
    'OUTBOUND': [
      'MIGRACION',
      'PORTABILIDAD PREPAGO', 
      'RENOVACION',
      'HOGAR',
      'REGULARIZACION',
      'PORTABILIDAD POSPAGO',
      'PREPAGO DIGITAL',
      'BACKOFFICE'
    ],
    'INBOUND': [
      'UNIFICADO',
      'AUDITORIA',
      'CROSSELLING',
      'BACK SEGUIMIENTO',
      'REDES SOCIALES',
      'BACK TRANSFERENCIAS',
      'CLIENTES ESPECIALES',
      'LIVE CHAT',
      'RELLAMADO',
      'BACK OFRECIMENTO',
      'NPS FCR',
      'RETENCIONES'
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

  // Función para ejecutar diagnóstico del sistema
  const ejecutarDiagnostico = async () => {
    try {
      setLoading(true);
      const response = await api.get('/nomina/diagnostico');
      
      if (response.data.success) {
        setDiagnostico(response.data.data);
        setSuccess('Diagnóstico completado exitosamente');
      } else {
        setError('Error ejecutando diagnóstico');
      }
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      setError('Error ejecutando diagnóstico del sistema');
    } finally {
      setLoading(false);
    }
  };

  // Función para restaurar estado persistente desde localStorage
  const restaurarEstadoPersistente = useCallback(() => {
    try {
      // Restaurar filtros
      const filtrosGuardados = localStorage.getItem('pagosNomina_filtros');
      if (filtrosGuardados) {
        const filtrosRestaurados = JSON.parse(filtrosGuardados);
        setFiltros(filtrosRestaurados);
      }

      // Restaurar datos del reporte
      const reporteGuardado = localStorage.getItem('pagosNomina_datos');
      if (reporteGuardado) {
        const reporteRestaurado = JSON.parse(reporteGuardado);
        setReporteNomina(reporteRestaurado);
      }

      // Restaurar estado de expansión de áreas
      const areasGuardadas = localStorage.getItem('pagosNomina_areasExpandidas');
      if (areasGuardadas) {
        setAreasExpandidas(JSON.parse(areasGuardadas));
      }

      // Restaurar estado de expansión de campañas
      const campañasGuardadas = localStorage.getItem('pagosNomina_campañasExpandidas');
      if (campañasGuardadas) {
        setCampañasExpandidas(JSON.parse(campañasGuardadas));
      }
    } catch (error) {
      console.error('Error restaurando estado persistente:', error);
      // Si hay error, limpiar localStorage corrupto
      limpiarEstadoPersistente();
    }
  }, []);

  // Cargar años disponibles al montar el componente
  useEffect(() => {
    cargarAniosDisponibles();
    restaurarEstadoPersistente();
  }, [cargarAniosDisponibles, restaurarEstadoPersistente]);

  // Función para guardar estado en localStorage
  const guardarEstadoPersistente = useCallback(() => {
    try {
      // Guardar filtros
      localStorage.setItem('pagosNomina_filtros', JSON.stringify(filtros));
      
      // Guardar datos del reporte
      if (reporteNomina.length > 0) {
        localStorage.setItem('pagosNomina_datos', JSON.stringify(reporteNomina));
      }
      
      // Guardar estado de expansión de áreas
      localStorage.setItem('pagosNomina_areasExpandidas', JSON.stringify(areasExpandidas));
      
      // Guardar estado de expansión de campañas
      localStorage.setItem('pagosNomina_campañasExpandidas', JSON.stringify(campañasExpandidas));
    } catch (error) {
      console.error('Error guardando estado persistente:', error);
    }
  }, [filtros, reporteNomina, areasExpandidas, campañasExpandidas]);

  // Función para limpiar estado persistente
  const limpiarEstadoPersistente = () => {
    localStorage.removeItem('pagosNomina_filtros');
    localStorage.removeItem('pagosNomina_datos');
    localStorage.removeItem('pagosNomina_areasExpandidas');
    localStorage.removeItem('pagosNomina_campañasExpandidas');
  };

  // Guardar estado cada vez que cambien los datos importantes
  useEffect(() => {
    guardarEstadoPersistente();
  }, [filtros, reporteNomina, areasExpandidas, campañasExpandidas, guardarEstadoPersistente]);

  // Función para calcular días correctamente
  const calcularDias = (registro) => {
    // Calcular días reales del mes (INCLUYENDO del día 1 al 30, EXCLUYENDO solo el día 31)
    const fecha = new Date(parseInt(filtros.anio), parseInt(filtros.mes) - 1, 1);
    const diasDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
    
    // Log detallado de todas las columnas del registro
    console.log('🔍 TODAS las columnas del registro:', Object.keys(registro));
    console.log('🔍 Valores de las primeras 10 columnas:', Object.entries(registro).slice(0, 10));
    
    // Identificar columnas que representen días del mes (formato YYYY-MM-DD)
    // IMPORTANTE: INCLUIR del día 1 al 30, EXCLUIR solo el día 31
    const columnasDias = Object.keys(registro).filter(col => {
      // Buscar columnas con formato de fecha YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(col)) {
        // Parsear la fecha de manera más robusta para evitar problemas de zona horaria
        const [anioStr, mesStr, diaStr] = col.split('-');
        const anioColumna = parseInt(anioStr);
        const mesColumna = parseInt(mesStr);
        const diaColumna = parseInt(diaStr);
        
        // Log de debug para cada columna de fecha
        console.log(`🔍 Debug columna ${col}:`, {
          col,
          anioColumna,
          mesColumna,
          diaColumna,
          filtrosMes: parseInt(filtros.mes),
          filtrosAnio: parseInt(filtros.anio),
          condicion1: mesColumna === parseInt(filtros.mes),
          condicion2: anioColumna === parseInt(filtros.anio),
          condicion3: diaColumna >= 1 && diaColumna <= 30,
          resultado: mesColumna === parseInt(filtros.mes) && 
                     anioColumna === parseInt(filtros.anio) &&
                     diaColumna >= 1 && diaColumna <= 30
        });
        
        // Verificar que la fecha corresponda al mes y año seleccionados
        // Y EXCLUIR SOLO el día 31 (incluir del 1 al 30)
        return mesColumna === parseInt(filtros.mes) && 
               anioColumna === parseInt(filtros.anio) &&
               diaColumna >= 1 && diaColumna <= 30; // INCLUIR del 1 al 30, NO el 31
      }
      return false;
    });
    
    console.log('🔍 Columnas de días encontradas (del 1 al 30):', columnasDias);
    console.log('🔍 Registro completo:', registro);
    
    // Contar diferentes tipos de asistencia y faltas
    // IMPORTANTE: Las tardanzas (T) NO cuentan como asistencia completa
    const diasAsistidos = columnasDias.filter(dia => 
      registro[dia] === 'A'  // Solo asistencias completas
    ).length;
    
    const tardanzas = columnasDias.filter(dia => 
      registro[dia] === 'T'
    ).length;
    
    const faltasInjustificadas = columnasDias.filter(dia => 
      registro[dia] === 'FI'
    ).length;
    
    const faltasJustificadas = columnasDias.filter(dia => 
      registro[dia] === 'FJ'
    ).length;
    
    const diasDescanso = columnasDias.filter(dia => 
      registro[dia] === 'D'
    ).length;
    
    const totalFaltas = faltasInjustificadas + faltasJustificadas;
    
    // Los días trabajados son 30 (mes laboral del 1 al 30) menos las faltas
    const diasTrabajados = 30 - totalFaltas;
    
    // Log detallado del cálculo
    console.log('🔍 Cálculo de días (del 1 al 30):', {
      diasDelMes: diasDelMes,
      diasDelMesSin31: 30,
      columnasDias,
      diasAsistidos,
      tardanzas,
      faltasInjustificadas,
      faltasJustificadas,
      diasDescanso,
      totalFaltas,
      diasTrabajados: `30 - ${totalFaltas} = ${diasTrabajados}`
    });
    
    // Log de cada día para debug
    console.log('🔍 Detalle día por día (del 1 al 30):');
    columnasDias.forEach(dia => {
      console.log(`  ${dia}: ${registro[dia]}`);
    });
    
    return {
      diasDelMes: 30, // Retornar 30 días laborales (del 1 al 30)
      diasAsistidos,
      diasFaltados: totalFaltas,
      diasTrabajados,
      tardanzas,
      faltasInjustificadas,
      faltasJustificadas,
      diasDescanso
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
          campañas: {},
          registros: [] // Agregar registros del área
        };
      }
      
      areas[area].total += parseFloat(registro.TotalPagar || 0);
      areas[area].empleados += 1;
      areas[area].registros.push(registro); // Agregar registro al área
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

  // Función para calcular bonos por área específica
  const calcularBonosPorArea = useCallback((area) => {
    if (!reporteNomina || reporteNomina.length === 0) return null;
    
    const pagosPorAreas = calcularPagosPorAreas();
    if (!pagosPorAreas.areas[area] || !pagosPorAreas.areas[area].registros) return null;
    
    const registrosArea = pagosPorAreas.areas[area].registros;
    if (registrosArea.length === 0) return null;
    
    const primerRegistro = registrosArea[0];
    const columnasBonos = Object.keys(primerRegistro).filter(columna => 
      columna.toLowerCase().includes('bono') && 
      typeof primerRegistro[columna] === 'number'
    );
    
    if (columnasBonos.length === 0) return null;
    
    const totalArea = registrosArea.reduce((sum, r) => sum + (r.TotalPagar || 0), 0);
    
    // Calcular totales de bonos para esta área y ordenarlos de mayor a menor
    const bonosConTotales = columnasBonos.map(columnaBono => {
      const totalBono = registrosArea.reduce((sum, r) => sum + (r[columnaBono] || 0), 0);
      return {
        columna: columnaBono,
        total: totalBono,
        porcentaje: totalArea > 0 ? ((totalBono / totalArea) * 100) : 0
      };
    });
    
    // Calcular total de sueldo base para esta área
    const totalSueldoBase = registrosArea.reduce((sum, r) => sum + (r.SueldoBase || 0), 0);
    
    // Agregar sueldo base como primer elemento
    const sueldoBaseKPI = {
      columna: 'SueldoBase',
      total: totalSueldoBase,
      porcentaje: totalArea > 0 ? ((totalSueldoBase / totalArea) * 100) : 0
    };
    
    // Combinar sueldo base con bonos y ordenar de mayor a menor por total
    const todosLosKPIs = [sueldoBaseKPI, ...bonosConTotales];
    todosLosKPIs.sort((a, b) => b.total - a.total);
    
    return todosLosKPIs;
  }, [reporteNomina, calcularPagosPorAreas]);

  // Función para calcular bonos por campaña específica
  const calcularBonosPorCampaña = useCallback((area, campaña) => {
    if (!reporteNomina || reporteNomina.length === 0) return null;
    
    const pagosPorAreas = calcularPagosPorAreas();
    if (!pagosPorAreas.areas[area] || 
        !pagosPorAreas.areas[area].campañas[campaña] || 
        !pagosPorAreas.areas[area].campañas[campaña].registros) return null;
    
    const registrosCampaña = pagosPorAreas.areas[area].campañas[campaña].registros;
    if (registrosCampaña.length === 0) return null;
    
    const primerRegistro = registrosCampaña[0];
    const columnasBonos = Object.keys(primerRegistro).filter(columna => 
      columna.toLowerCase().includes('bono') && 
      typeof primerRegistro[columna] === 'number'
    );
    
    if (columnasBonos.length === 0) return null;
    
    const totalCampaña = registrosCampaña.reduce((sum, r) => sum + (r.TotalPagar || 0), 0);
    
    // Calcular totales de bonos para esta campaña y ordenarlos de mayor a menor
    const bonosConTotales = columnasBonos.map(columnaBono => {
      const totalBono = registrosCampaña.reduce((sum, r) => sum + (r[columnaBono] || 0), 0);
      return {
        columna: columnaBono,
        total: totalBono,
        porcentaje: totalCampaña > 0 ? ((totalBono / totalCampaña) * 100) : 0
      };
    });
    
    // Calcular total de sueldo base para esta campaña
    const totalSueldoBase = registrosCampaña.reduce((sum, r) => sum + (r.SueldoBase || 0), 0);
    
    // Agregar sueldo base como primer elemento
    const sueldoBaseKPI = {
      columna: 'SueldoBase',
      total: totalSueldoBase,
      porcentaje: totalCampaña > 0 ? ((totalSueldoBase / totalCampaña) * 100) : 0
    };
    
    // Combinar sueldo base con bonos y ordenar de mayor a menor por total
    const todosLosKPIs = [sueldoBaseKPI, ...bonosConTotales];
    todosLosKPIs.sort((a, b) => b.total - a.total);
    
    return todosLosKPIs;
  }, [reporteNomina, calcularPagosPorAreas]);

  // Función para alternar expansión de área (funciona como acordeón)
  const toggleArea = (area) => {
    setAreasExpandidas(prev => {
      // Si la área ya está expandida, la cerramos
      if (prev[area]) {
        return { [area]: false };
      }
      // Si no está expandida, cerramos todas las demás y expandimos solo esta
      return { [area]: true };
    });
  };

  // Función para alternar expansión de campaña (funciona como acordeón por área)
  const toggleCampaña = (area, campaña) => {
    const key = `${area}-${campaña}`;
    setCampañasExpandidas(prev => {
      // Si la campaña ya está expandida, la cerramos
      if (prev[key]) {
        return { [key]: false };
      }
      // Si no está expandida, cerramos todas las campañas del mismo área y expandimos solo esta
      const newState = {};
      Object.keys(prev).forEach(existingKey => {
        if (existingKey.startsWith(`${area}-`)) {
          newState[existingKey] = false; // Cerrar todas las campañas del área
        }
      });
      newState[key] = true; // Expandir solo la campaña seleccionada
      return newState;
    });
  };

  // Generar reporte de nómina
  const generarReporte = async () => {
    if (!filtros.anio || !filtros.mes) {
      setError('Por favor complete año y mes');
      return;
    }

    // Verificar si ya tenemos datos para estos filtros
    const filtrosGuardados = localStorage.getItem('pagosNomina_filtros');
    const reporteGuardado = localStorage.getItem('pagosNomina_datos');
    
    if (filtrosGuardados && reporteGuardado) {
      const filtrosAnteriores = JSON.parse(filtrosGuardados);
      if (filtrosAnteriores.anio === filtros.anio && filtrosAnteriores.mes === filtros.mes) {
        // Los filtros son los mismos, restaurar datos existentes
        const reporteExistente = JSON.parse(reporteGuardado);
        setReporteNomina(reporteExistente);
        setSuccess('Reporte restaurado desde la sesión anterior');
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    const startTime = Date.now();
    console.log(`🚀 Iniciando generación de reporte - ${filtros.anio}/${filtros.mes}`);
    
    try {
      // Crear una instancia de axios con timeout específico para nómina
      const response = await api.get(`/nomina/generar-reporte?anio=${filtros.anio}&mes=${filtros.mes}`, {
        timeout: 120000 // 2 minutos para reportes de nómina
      });
      
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      
      if (response.data.success) {
        console.log('📊 Datos recibidos del backend:', response.data.data.registros);
        console.log(`⏱️ Tiempo total de procesamiento: ${totalTime.toFixed(2)} segundos`);
        
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
            tardanzas: calculoDias.tardanzas,
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
            Tardanzas: calculoDias.tardanzas,
            // Información adicional para debug
            DiasDelMes: calculoDias.diasDelMes,
            FaltasInjustificadas: calculoDias.faltasInjustificadas,
            FaltasJustificadas: calculoDias.faltasJustificadas,
            TotalPagar: registro.NetoAPagar || 0
          };
        });
        
        setReporteNomina(registrosMapeados);
        setSuccess(`Reporte generado exitosamente - ${response.data.data.totalRegistros} registros encontrados en ${totalTime.toFixed(2)} segundos`);
      } else {
        setError(response.data.message || 'Error generando reporte');
      }
    } catch (error) {
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      
      console.error('❌ Error generando reporte:', error);
      console.error(`⏱️ Tiempo transcurrido antes del error: ${totalTime.toFixed(2)} segundos`);
      
      // Manejar diferentes tipos de errores
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setError(`El reporte está tardando más de lo esperado (${totalTime.toFixed(2)}s). Esto puede deberse a la cantidad de datos. Por favor, intente nuevamente o contacte al administrador.`);
      } else if (error.response?.status === 408) {
        setError('El servidor está tardando en procesar la solicitud. Por favor, intente nuevamente.');
      } else if (error.response?.status === 503) {
        setError('Error de conexión con la base de datos. Verifique la conectividad del servidor.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Error de conexión. Verifique su conexión a internet y que el servidor esté funcionando.');
      }
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
    // Limpiar también el localStorage
    limpiarEstadoPersistente();
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
        'Tardanzas',
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



  // Función para generar datos del gráfico de distribución por áreas
  const generarDatosGraficoAreas = useCallback(() => {
    if (!reporteNomina || reporteNomina.length === 0) return null;
    
    const pagosPorAreas = calcularPagosPorAreas();
    if (!pagosPorAreas.areas) return null;
    
    const areas = Object.keys(pagosPorAreas.areas).filter(area => area !== 'OTROS');
    const totales = areas.map(area => pagosPorAreas.areas[area].total);
    
    return {
      labels: areas,
      datasets: [
        {
          data: totales,
          backgroundColor: [
            '#3b82f6', // OUTBOUND - Azul
            '#8b5cf6', // INBOUND - Morado
            '#f59e0b'  // STAFF - Anaranjado
          ],
          borderColor: [
            '#1d4ed8',
            '#7c3aed',
            '#d97706'
          ],
          borderWidth: 2,
          hoverBackgroundColor: [
            '#2563eb',
            '#9333ea',
            '#ea580c'
          ]
        }
      ]
    };
  }, [reporteNomina, calcularPagosPorAreas]);

  // Función para generar datos del gráfico de bonos
  const generarDatosGraficoBonos = useCallback(() => {
    if (!reporteNomina || reporteNomina.length === 0) return null;
    
    const primerRegistro = reporteNomina[0];
    const columnasBonos = Object.keys(primerRegistro).filter(columna => 
      columna.toLowerCase().includes('bono') && 
      typeof primerRegistro[columna] === 'number'
    );
    
    if (columnasBonos.length === 0) return null;
    
    const totalesBonos = columnasBonos.map(columna => 
      reporteNomina.reduce((sum, r) => sum + (r[columna] || 0), 0)
    );
    
    const nombresLegibles = columnasBonos.map(columna => 
      columna
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim()
    );
    
    return {
      labels: nombresLegibles,
      datasets: [
        {
          label: 'Total de Bonos (S/)',
          data: totalesBonos,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false
        }
      ]
    };
  }, [reporteNomina]);

  // Función para calcular estadísticas generales
  const calcularEstadisticasGenerales = useCallback(() => {
    if (!reporteNomina || reporteNomina.length === 0) return {};
    
    const totalEmpleados = reporteNomina.length;
    const totalAPagar = reporteNomina.reduce((sum, r) => sum + (r.TotalPagar || 0), 0);
    const empleadosActivos = reporteNomina.filter(r => !r.FechaCesePorBaja).length;
    const empleadosCese = reporteNomina.filter(r => r.FechaCesePorBaja).length;
    
    // Calcular promedios
    const promedioSueldo = totalEmpleados > 0 ? totalAPagar / totalEmpleados : 0;
    const promedioAsistencia = totalEmpleados > 0 ? 
      reporteNomina.reduce((sum, r) => sum + (r.DiasAsistidos || 0), 0) / totalEmpleados : 0;
    
    // Calcular porcentajes
    const porcentajeActivos = totalEmpleados > 0 ? (empleadosActivos / totalEmpleados) * 100 : 0;
    const porcentajeCese = totalEmpleados > 0 ? (empleadosCese / totalEmpleados) * 100 : 0;
    
    return {
      totalEmpleados,
      totalAPagar,
      empleadosActivos,
      empleadosCese,
      promedioSueldo,
      promedioAsistencia,
      porcentajeActivos,
      porcentajeCese
    };
  }, [reporteNomina]);

  // Cerrar modal de bonos
  const cerrarModalBonos = () => {
    setModalBonos({ open: false, empleado: null });
  };

  // Funciones para el popover de descuento
  const abrirPopoverDescuento = (event) => {
    setPopoverDescuento({ open: true, anchorEl: event.currentTarget });
  };

  const cerrarPopoverDescuento = () => {
    setPopoverDescuento({ open: false, anchorEl: null });
  };


  return (
    <Box>
             {/* Header */}
       <Card sx={{ mb: 4 }}>
         <CardHeader
           title={
             <Box sx={{ display: 'flex', alignItems: 'center' }}>
               <Box sx={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: 2 
               }}>
                 <AccountBalanceIcon sx={{ fontSize: 28, color: '#16a34a' }} />
                 <Typography variant="h5" sx={{ fontWeight: 600, color: '#16a34a' }}>
                   💰 Pagos Nómina
                 </Typography>
               </Box>
             </Box>
           }
           action={
             <Button
               variant="outlined"
               startIcon={<ArrowBackIcon />}
               onClick={() => navigate('/dashboard')}
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
                sx={{ 
                  backgroundColor: '#16a34a', 
                  '&:hover': { backgroundColor: '#15803d' },
                  minWidth: '180px'
                }}
              >
                {loading ? 'Generando Reporte...' : 'Generar Reporte'}
              </Button>
              
                             <Button
                 variant="outlined"
                 onClick={limpiarFiltros}
                 disabled={loading}
                 title="Limpiar solo los filtros, mantiene los datos del reporte"
               >
                 Limpiar Filtros
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
              
              <Button
                variant="outlined"
                startIcon={<InfoIcon />}
                onClick={ejecutarDiagnostico}
                disabled={loading}
                sx={{ 
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  '&:hover': { 
                    borderColor: '#2563eb',
                    backgroundColor: '#eff6ff'
                  }
                }}
              >
                🔍 Diagnóstico
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

      {/* Indicador de progreso para reportes largos */}
      {loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Generando reporte de nómina...
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Este proceso puede tardar varios segundos dependiendo de la cantidad de datos. 
                Por favor, espere mientras se procesa la información.
              </Typography>
            </Box>
          </Box>
        </Alert>
      )}

      {/* Diagnóstico del Sistema */}
      {diagnostico && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#0369a1' }}>
            🔍 Diagnóstico del Sistema de Nómina
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" color={diagnostico.conexionBD === 'OK' ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold' }}>
                  {diagnostico.conexionBD}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conexión BD
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" color={diagnostico.storedProcedureExiste ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold' }}>
                  {diagnostico.storedProcedureExiste ? 'OK' : 'ERROR'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stored Procedure
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                  {diagnostico.empleadosActivos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Empleados Activos
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" color="info.main" sx={{ fontWeight: 'bold' }}>
                  {diagnostico.registrosAsistenciaUltimoMes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registros Asistencia
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Tiempo de ejecución:</strong> {diagnostico.tiempoEjecucion.toFixed(2)} segundos | 
              <strong> Timestamp:</strong> {new Date(diagnostico.timestamp).toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Estadísticas del Reporte */}
      {reporteNomina.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#16a34a' }}>
            📊 Resumen del Reporte
          </Typography>
          
          {/* KPIs Principales */}
          <Grid container spacing={3} sx={{ mb: 3, justifyContent: 'center' }}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {reporteNomina.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Empleados
                </Typography>
              </Box>
            </Grid>
                         <Grid item xs={12} md={3}>
               <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                 <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                   S/ {reporteNomina.reduce((sum, r) => sum + (r.TotalPagar || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </Typography>
                 <Typography variant="body2" color="text.secondary">
                   Total a Pagar
                 </Typography>
               </Box>
             </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {reporteNomina.filter(r => r.EstadoEmpleado === 'CESE').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Empleados en Cese
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
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
             
             // Calcular total de sueldo base
             const totalSueldoBase = reporteNomina.reduce((sum, r) => sum + (r.SueldoBase || 0), 0);
             
             // Agregar sueldo base como primer elemento
             const sueldoBaseKPI = {
               columna: 'SueldoBase',
               total: totalSueldoBase,
               porcentaje: totalAPagar > 0 ? ((totalSueldoBase / totalAPagar) * 100) : 0
             };
             
             // Combinar sueldo base con bonos y ordenar de mayor a menor por total
             const todosLosKPIs = [sueldoBaseKPI, ...bonosConTotales];
             todosLosKPIs.sort((a, b) => b.total - a.total);
             
             return (
               <>
                 <Typography variant="h6" sx={{ mb: 2, color: '#16a34a', mt: 3 }}>
                   💰 Análisis de Sueldo Base y Bonos (Ordenados por Valor)
                 </Typography>
                 <Grid container spacing={2}>
                   {todosLosKPIs.map((kpi, index) => {
                     // Mapear nombres de columnas a nombres legibles
                     const nombreLegible = kpi.columna === 'SueldoBase' 
                       ? 'Sueldo Base'
                       : kpi.columna.toLowerCase().includes('movilidad') && kpi.columna.toLowerCase().includes('manual')
                         ? 'Bono Movilidad\nManual' // Mostrar en dos líneas
                         : kpi.columna
                           .replace(/([A-Z])/g, ' $1') // Agregar espacio antes de mayúsculas
                           .replace(/^./, str => str.toUpperCase()) // Primera letra mayúscula
                           .trim();
                     
                     // Configuración optimizada para que todos los KPIs quepan en una línea
                     const isMovilidadManual = kpi.columna.toLowerCase().includes('movilidad') && kpi.columna.toLowerCase().includes('manual');
                     const gridSize = isMovilidadManual 
                       ? { xs: 12, sm: 2, md: 1.5, lg: 1.5, xl: 1.5 }  // Ultra estrecho para movilidad manual
                       : { xs: 12, sm: 4, md: 2.3, lg: 2.3, xl: 2.3 }; // Más espacio para los demás KPIs
                     
                     return (
                       <Grid item {...gridSize} key={kpi.columna}>
                         <Box sx={{ 
                           textAlign: 'center', 
                           p: isMovilidadManual ? 0.8 : 1.5, // Padding ultra reducido para movilidad manual
                           backgroundColor: 'white', 
                           borderRadius: 2,
                           border: '1px solid #e0e0e0',
                           height: '100%',
                           display: 'flex',
                           flexDirection: 'column',
                           justifyContent: 'center'
                         }}>
                           <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                             S/ {kpi.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </Typography>
                           <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                             {nombreLegible}
                           </Typography>
                           <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                             {kpi.porcentaje.toFixed(1)}% del total
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
                  {/* Análisis de Bonos por Área */}
                  {(() => {
                    const bonosArea = calcularBonosPorArea(area);
                    if (!bonosArea || bonosArea.length === 0) return null;
                    
                    return (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'center', color: colorArea }}>
                          💰 Análisis de Sueldo Base y Bonos - {area}
                        </Typography>
                        <Grid container spacing={2}>
                          {bonosArea.map((kpi, index) => {
                            // Mapear nombres de columnas a nombres legibles
                            const nombreLegible = kpi.columna === 'SueldoBase' 
                              ? 'Sueldo Base'
                              : kpi.columna.toLowerCase().includes('movilidad') && kpi.columna.toLowerCase().includes('manual')
                                ? 'Bono Movilidad\nManual' // Mostrar en dos líneas
                                : kpi.columna
                                  .replace(/([A-Z])/g, ' $1') // Agregar espacio antes de mayúsculas
                                  .replace(/^./, str => str.toUpperCase()) // Primera letra mayúscula
                                  .trim();
                            
                            // Configuración optimizada para que todos los KPIs quepan en una línea
                            const isMovilidadManual = kpi.columna.toLowerCase().includes('movilidad') && kpi.columna.toLowerCase().includes('manual');
                            const gridSize = isMovilidadManual 
                              ? { xs: 12, sm: 2, md: 1.5, lg: 1.5, xl: 1.5 }  // Ultra estrecho para movilidad manual
                              : { xs: 12, sm: 4, md: 2.3, lg: 2.3, xl: 2.3 }; // Más espacio para los demás KPIs
                            
                            return (
                              <Grid item {...gridSize} key={kpi.columna}>
                                <Box sx={{ 
                                  textAlign: 'center', 
                                  p: isMovilidadManual ? 0.8 : 1.5, // Padding ultra reducido para movilidad manual
                                  backgroundColor: 'white', 
                                  borderRadius: 2,
                                  border: '1px solid #e0e0e0',
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    S/ {kpi.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {nombreLegible}
                                  </Typography>
                                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                                    {kpi.porcentaje.toFixed(1)}% del área
                                  </Typography>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    );
                  })()}

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'center', color: colorArea }}>
                    📋 Campañas de {area}
                  </Typography>
                  
                  {/* Menú fijo de campañas */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {Object.keys(datosArea.campañas).map((campaña) => {
                      const datosCampaña = datosArea.campañas[campaña];
                      const isCampañaExpanded = campañasExpandidas[`${area}-${campaña}`];
                      
                      return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={campaña}>
                          <Box sx={{ 
                            p: 2, 
                            backgroundColor: isCampañaExpanded ? '#f0fdf4' : 'white',
                            borderRadius: 2,
                            border: `2px solid ${isCampañaExpanded ? colorArea : '#e0e0e0'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              borderColor: colorArea,
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
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
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* Registros de empleados (aparecen debajo de todas las campañas) */}
                  {Object.keys(datosArea.campañas).map((campaña) => {
                    const isCampañaExpanded = campañasExpandidas[`${area}-${campaña}`];
                    if (!isCampañaExpanded) return null;
                    
                    const datosCampaña = datosArea.campañas[campaña];
                    
                    return (
                      <Box key={`${area}-${campaña}`} sx={{ mt: 3, pt: 3, borderTop: '2px solid #e5e7eb' }}>
                        {/* Análisis de Bonos por Campaña */}
                        {(() => {
                          const bonosCampaña = calcularBonosPorCampaña(area, campaña);
                          if (!bonosCampaña || bonosCampaña.length === 0) return null;
                          
                          return (
                            <Box sx={{ mb: 4 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'center', color: colorArea }}>
                                💰 Análisis de Sueldo Base y Bonos - {campaña}
                              </Typography>
                              <Grid container spacing={2}>
                                {bonosCampaña.map((kpi, index) => {
                                  // Mapear nombres de columnas a nombres legibles
                                  const nombreLegible = kpi.columna === 'SueldoBase' 
                                    ? 'Sueldo Base'
                                    : kpi.columna.toLowerCase().includes('movilidad') && kpi.columna.toLowerCase().includes('manual')
                                      ? 'Bono Movilidad\nManual' // Mostrar en dos líneas
                                      : kpi.columna
                                        .replace(/([A-Z])/g, ' $1') // Agregar espacio antes de mayúsculas
                                        .replace(/^./, str => str.toUpperCase()) // Primera letra mayúscula
                                        .trim();
                                  
                                  // Configuración optimizada para que todos los KPIs quepan en una línea
                                  const isMovilidadManual = kpi.columna.toLowerCase().includes('movilidad') && kpi.columna.toLowerCase().includes('manual');
                                  const gridSize = isMovilidadManual 
                                    ? { xs: 12, sm: 2, md: 1.5, lg: 1.5, xl: 1.5 }  // Ultra estrecho para movilidad manual
                                    : { xs: 12, sm: 4, md: 2.3, lg: 2.3, xl: 2.3 }; // Más espacio para los demás KPIs
                                  
                                  return (
                                    <Grid item {...gridSize} key={kpi.columna}>
                                      <Box sx={{ 
                                        textAlign: 'center', 
                                        p: isMovilidadManual ? 0.8 : 1.5, // Padding ultra reducido para movilidad manual
                                        backgroundColor: 'white', 
                                        borderRadius: 2,
                                        border: '1px solid #e0e0e0',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                      }}>
                                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                                          S/ {kpi.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                          {nombreLegible}
                                        </Typography>
                                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                                          {kpi.porcentaje.toFixed(1)}% de la campaña
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            </Box>
                          );
                        })()}

                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'center', color: colorArea }}>
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
                                <TableCell sx={{ fontWeight: 700 }} align="right">Días Asistidos</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Días Faltados</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Tardanzas</TableCell>
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
                                  <TableCell align="right">{empleado.DiasAsistidos || 0}</TableCell>
                                  <TableCell align="right">{empleado.DiasFaltados || 0}</TableCell>
                                  <TableCell align="right">{empleado.Tardanzas || 0}</TableCell>
                                  <TableCell align="right">
                                    S/ {(empleado.TotalPagar || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell>
                                                                         <Tooltip title="Ver detalle de nómina del empleado">
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
                    );
                  })}
                </Box>
              );
            })}
          </Paper>
        );
      })()}

      {/* Estadísticas y Gráficos */}
      {reporteNomina.length > 0 && (() => {
        const datosGraficoAreas = generarDatosGraficoAreas();
        const datosGraficoBonos = generarDatosGraficoBonos();
        const estadisticas = calcularEstadisticasGenerales();
        
        return (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8fafc' }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#16a34a', textAlign: 'center' }}>
              📊 Estadísticas y Análisis Visual
            </Typography>
            
            <Grid container spacing={3}>
              {/* Gráfico de Distribución por Áreas */}
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'white', 
                  borderRadius: 2, 
                  border: '1px solid #e0e0e0',
                  textAlign: 'center',
                  height: '400px'
                }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#16a34a' }}>
                    🏢 Distribución de Pagos por Áreas
                  </Typography>
                  {datosGraficoAreas ? (
                    <Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Doughnut 
                        data={datosGraficoAreas}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 20,
                                usePointStyle: true
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const label = context.label || '';
                                  const value = context.parsed;
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `${label}: S/ ${value.toLocaleString('es-PE')} (${percentage}%)`;
                                }
                              }
                            },
                            datalabels: {
                              display: true,
                              color: '#ffffff',
                              anchor: 'center',
                              align: 'center',
                              font: {
                                weight: 'bold',
                                size: 14
                              },
                              formatter: function(value, context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${percentage}%`;
                              }
                            }
                          }
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay datos para mostrar el gráfico
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Gráfico de Análisis de Bonos */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'white', 
                  borderRadius: 2, 
                  border: '1px solid #e0e0e0',
                  textAlign: 'center',
                  height: '400px',
                  width: '100%'
                }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#16a34a' }}>
                    💰 Análisis de Bonos
                  </Typography>
                  {datosGraficoBonos ? (
                    <Box sx={{ 
                      height: '300px', 
                      width: '100%',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Bar 
                        data={datosGraficoBonos}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const value = context.parsed.y;
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `S/ ${value.toLocaleString('es-PE')} (${percentage}%)`;
                                }
                              }
                            },
                            datalabels: {
                              display: true,
                              color: '#1e40af',
                              anchor: 'end',
                              align: 'top',
                              offset: 4,
                              font: {
                                weight: 'bold',
                                size: 12
                              },
                              formatter: function(value) {
                                return 'S/ ' + value.toLocaleString('es-PE');
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function(value) {
                                  return 'S/ ' + value.toLocaleString('es-PE');
                                }
                              }
                            }
                          }
                        }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay datos de bonos para mostrar
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Estadísticas Generales */}
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: 'white', 
                  borderRadius: 2, 
                  border: '1px solid #e0e0e0',
                  height: '300px'
                }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#16a34a', textAlign: 'center' }}>
                    📈 Estadísticas Generales
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                          {estadisticas.totalEmpleados || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Empleados
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                          S/ {(estadisticas.totalAPagar || 0).toLocaleString('es-PE')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total a Pagar
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h5" color="info.main" sx={{ fontWeight: 'bold' }}>
                          {estadisticas.empleadosActivos || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Empleados Activos
                        </Typography>
                        <Typography variant="caption" color="success.main">
                          ({estadisticas.porcentajeActivos?.toFixed(1) || 0}%)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>
                          {estadisticas.empleadosCese || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Empleados en Cese
                        </Typography>
                        <Typography variant="caption" color="warning.main">
                          ({estadisticas.porcentajeCese?.toFixed(1) || 0}%)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                          S/ {(estadisticas.promedioSueldo || 0).toLocaleString('es-PE')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Promedio Sueldo
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
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
                💰 Detalle de Nómina - {modalBonos.empleado?.Nombres} {modalBonos.empleado?.ApellidoPaterno}
              </Typography>
            </Box>
           <IconButton onClick={cerrarModalBonos} sx={{ color: 'white' }}>
             <CloseIcon />
           </IconButton>
         </DialogTitle>
         
                   <DialogContent sx={{ pt: 3 }}>
            {modalBonos.empleado && (() => {
              // Obtener todas las columnas de bonos del empleado (incluyendo los que valen 0)
              const columnasBonos = Object.keys(modalBonos.empleado).filter(columna => 
                columna.toLowerCase().includes('bono') && 
                typeof modalBonos.empleado[columna] === 'number'
              );
              
              // Filtrar solo los bonos que tienen valor mayor a 0 para mostrar
              const bonosConValor = columnasBonos.filter(columna => 
                modalBonos.empleado[columna] > 0
              );
             
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
                         <Typography variant="body2" color="text.secondary">Sueldo Base:</Typography>
                         <Typography variant="h6" color="info.main" fontWeight="bold">
                           S/ {parseFloat(modalBonos.empleado.SueldoBase || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </Typography>
                       </Grid>
                       <Grid item xs={12} md={6}>
                         <Typography variant="body2" color="text.secondary">Total a Pagar:</Typography>
                         <Typography variant="h6" color="success.main" fontWeight="bold">
                           S/ {parseFloat(modalBonos.empleado.TotalPagar || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </Typography>
                       </Grid>
                     </Grid>
                   </Paper>

                  {/* Información de Asistencia y Descuentos en la misma línea */}
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Información de Asistencia */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2, backgroundColor: '#f0f9ff', height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#0369a1' }}>
                          📅 Información de Asistencia
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">Días Asistidos:</Typography>
                            <Typography variant="h6" color="info.main" fontWeight="bold">
                              {modalBonos.empleado.DiasAsistidos || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">Días Faltados:</Typography>
                            <Typography variant="h6" color="error.main" fontWeight="bold">
                              {modalBonos.empleado.DiasFaltados || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">Tardanzas:</Typography>
                            <Typography variant="h6" color="warning.main" fontWeight="bold">
                              {modalBonos.empleado.Tardanzas || 0}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                                         {/* Información de Descuentos */}
                     <Grid item xs={12} md={6}>
                       <Paper sx={{ p: 2, backgroundColor: '#fef2f2', height: '100%' }}>
                         <Typography variant="h6" sx={{ mb: 2, color: '#dc2626' }}>
                           💸 Información de Descuentos
                         </Typography>
                         <Grid container spacing={2}>
                           <Grid item xs={12} sm={6}>
                             <Typography variant="body2" color="text.secondary">Días Faltados:</Typography>
                             <Typography variant="h6" color="error.main" fontWeight="bold">
                               {modalBonos.empleado.DiasFaltados || 0}
                             </Typography>
                           </Grid>
                                                       <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="body2" color="text.secondary">Descuento Total:</Typography>
                                  <Typography variant="h6" color="error.main" fontWeight="bold">
                                    S/ {((parseFloat(modalBonos.empleado.SueldoBase || 0) / 30) * (modalBonos.empleado.DiasFaltados || 0)).toFixed(2)}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={abrirPopoverDescuento}
                                  sx={{ 
                                    color: '#dc2626',
                                    '&:hover': { backgroundColor: 'rgba(220, 38, 38, 0.1)' },
                                    mt: 0.5
                                  }}
                                >
                                  <InfoIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Grid>
                         </Grid>
                       </Paper>
                     </Grid>
                  </Grid>

                  

                                   {/* Lista de bonos */}
                  <Typography variant="h6" sx={{ mb: 2, color: '#16a34a' }}>
                    📊 Desglose de Bonos
                  </Typography>
                  
                  {bonosConValor.length > 0 ? (
                    <Grid container spacing={2}>
                      {bonosConValor.map((columnaBono) => {
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
                  ) : (
                    <Paper sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#f8fafc'
                    }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        💡 Sin Bonos Asignados
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Este empleado no tiene bonos asignados para este período.
                      </Typography>
                    </Paper>
                  )}

                                   {/* Resumen Detallado */}
                  <Paper sx={{ p: 3, mt: 3, backgroundColor: '#f0fdf4' }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#16a34a', textAlign: 'center' }}>
                      📋 Resumen del Cálculo de Nómina
                    </Typography>
                    
                    
                    
                    {/* Desglose detallado */}
                    <Grid container spacing={3}>
                      {/* Sueldo Base */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            💰 Sueldo Base
                          </Typography>
                          <Typography variant="h6" color="info.main" fontWeight="bold">
                            S/ {parseFloat(modalBonos.empleado.SueldoBase || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </Grid>
                      
                                             {/* Total Bonos */}
                       <Grid item xs={12} sm={6} md={3}>
                         <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                           <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                             🎁 Total Bonos
                           </Typography>
                           <Typography variant="h6" color="primary" fontWeight="bold">
                             + S/ {bonosConValor.reduce((sum, col) => sum + (modalBonos.empleado[col] || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                           </Typography>
                         </Box>
                       </Grid>
                      
                                             {/* Descuentos */}
                       <Grid item xs={12} sm={6} md={3}>
                         <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                           <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                             💸 Descuentos
                           </Typography>
                           <Typography variant="h6" color="error.main" fontWeight="bold">
                             - S/ {((parseFloat(modalBonos.empleado.SueldoBase || 0) / 30) * (modalBonos.empleado.DiasFaltados || 0)).toFixed(2)}
                           </Typography>
                         </Box>
                       </Grid>
                      
                      {/* Total a Pagar */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f0fdf4', borderRadius: 2, border: '2px solid #16a34a' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                            🎯 Total a Pagar
                          </Typography>
                          <Typography variant="h5" color="success.main" fontWeight="bold">
                            S/ {parseFloat(modalBonos.empleado.TotalPagar || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Box>
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

        {/* Popover para la fórmula de descuento */}
        <Popover
          open={popoverDescuento.open}
          anchorEl={popoverDescuento.anchorEl}
          onClose={cerrarPopoverDescuento}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              maxWidth: 400,
              p: 2,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca'
            }
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: '#dc2626', fontWeight: 600 }}>
              📐 Fórmula del Descuento
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'monospace', fontWeight: 600 }}>
              Descuento = (Sueldo Base ÷ 30) × Días Faltados
            </Typography>
            
            <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'monospace' }}>
                <strong>Paso 1:</strong> Calcular valor por día
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 2 }}>
                = S/ {parseFloat(modalBonos.empleado?.SueldoBase || 0).toLocaleString('es-PE')} ÷ 30
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 2 }}>
                = S/ {((parseFloat(modalBonos.empleado?.SueldoBase || 0) / 30)).toFixed(2)} por día
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontFamily: 'monospace' }}>
                <strong>Paso 2:</strong> Multiplicar por días faltados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 2 }}>
                = S/ {((parseFloat(modalBonos.empleado?.SueldoBase || 0) / 30)).toFixed(2)} × {modalBonos.empleado?.DiasFaltados || 0} días
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#dc2626' }}>
                <strong>Resultado:</strong> S/ {((parseFloat(modalBonos.empleado?.SueldoBase || 0) / 30) * (modalBonos.empleado?.DiasFaltados || 0)).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Popover>
     </Box>
   );
 };

export default PagosNomina;
