import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Error as ErrorIcon } from '@mui/icons-material/Error';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Button,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip as MuiTooltip,
  TextField
} from '@mui/material';
import {
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, ChartDataLabels);

export default function DashboardJefa() {
  const { user, api } = useAuth();
  console.log('🔑 DashboardJefa renderizado con:', { user: user?.dni, userCompleto: user, api: !!api });
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campania, setCampania] = useState("");
  const [mes, setMes] = useState("");
  const [campanias, setCampanias] = useState([]);
  const [meses, setMeses] = useState([]);
  
  // Estados para filtros de gráficos
  const [filtroGraficosCampania, setFiltroGraficosCampania] = useState("");
  const [filtroGraficosCapa, setFiltroGraficosCapa] = useState("");
  const [capas, setCapas] = useState([]);
  
  // Estados para filtros y paginación
  const [filtroCampania, setFiltroCampania] = useState('');
  const [filtroFormador, setFiltroFormador] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [resumenCapacitaciones, setResumenCapacitaciones] = useState([]);
  
  // Estados para edición de Q ENTRE
  const [editIdx, setEditIdx] = useState(null);
  const [editValue, setEditValue] = useState(null);
  
  const nombreCompleto = `${user?.nombres || ''} ${user?.apellidoPaterno || ''} ${user?.apellidoMaterno || ''}`.trim();

  // Cargar campañas y meses disponibles
  useEffect(() => {
    console.log('🔄 useEffect campañas/meses ejecutado:', { user: user?.dni, userCompleto: user });
    if (user?.dni) {
      cargarCampanias();
      cargarMeses();
    } else {
      console.log('❌ Usuario no disponible para campañas/meses');
    }
  }, [user]);

  // Cargar capas cuando cambia la campaña en filtros de gráficos
  useEffect(() => {
    if (!filtroGraficosCampania) {
      setCapas([]);
      setFiltroGraficosCapa("");
      return;
    }
    
    if (user?.dni) {
      cargarCapas(filtroGraficosCampania);
    }
  }, [filtroGraficosCampania, user]);

  // Cargar datos principales del dashboard
  useEffect(() => {
    if (user?.dni) {
      cargarDatosDashboard();
    }
  }, [campania, mes, user]);

  // Cargar resumen de capacitaciones cuando cambien los filtros o la página
  useEffect(() => {
    console.log('🔄 useEffect resumen ejecutado:', { user: user?.dni, filtroCampania, filtroFormador, filtroEstado, paginaActual });
    if (user?.dni) {
      cargarResumenCapacitaciones();
    } else {
      console.log('❌ Usuario no disponible aún');
    }
  }, [filtroCampania, filtroFormador, filtroEstado, paginaActual, user]);

  const cargarCampanias = async () => {
    try {
      const response = await api.get('/capacitaciones/dashboard-jefa/campanias');
      setCampanias(response.data);
    } catch (error) {
      console.error('Error cargando campañas:', error);
      setCampanias([]);
    }
  };

  const cargarMeses = async () => {
    try {
      const response = await api.get('/capacitaciones/dashboard-jefa/meses');
      setMeses(response.data);
    } catch (error) {
      console.error('Error cargando meses:', error);
      setMeses([]);
    }
  };

  const cargarCapas = async (campaniaId) => {
    try {
      const response = await api.get(`/capacitaciones/dashboard-jefa/capas?campania=${campaniaId}`);
      setCapas(response.data);
      setFiltroGraficosCapa("");
    } catch (error) {
      console.error('Error cargando capas:', error);
      setCapas([]);
    }
  };

  const cargarDatosDashboard = async () => {
    try {
      setLoading(true);
      let url = `/capacitaciones/dashboard-jefa/${user.dni}`;
      const params = [];
      
      if (campania) params.push(`campania=${campania}`);
      if (mes) params.push(`mes=${mes}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await api.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener datos filtrados para gráficos
  const obtenerDatosGraficos = async () => {
    if (!filtroGraficosCampania && !filtroGraficosCapa) {
      return data; // Usar datos principales si no hay filtros
    }
    
    let url = `/capacitaciones/dashboard-jefa/${user.dni}`;
    const params = [];
    
    if (filtroGraficosCampania) {
      params.push(`campania=${filtroGraficosCampania}`);
    }
    if (filtroGraficosCapa) {
      params.push(`capa=${filtroGraficosCapa}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo datos filtrados:', error);
      return data; // Fallback a datos principales
    }
  };

  // Estado para datos de gráficos
  const [datosGraficos, setDatosGraficos] = useState(null);

  // Actualizar datos de gráficos cuando cambien los filtros
  useEffect(() => {
    if (!data) return;
    
    obtenerDatosGraficos().then(datos => {
      setDatosGraficos(datos);
    });
  }, [filtroGraficosCampania, filtroGraficosCapa, data]);

  // Función para cargar resumen de capacitaciones
  const cargarResumenCapacitaciones = async () => {
    try {
      console.log('🔄 Cargando resumen de capacitaciones...');
      console.log('🔍 Estado actual:', { paginaActual, filtroCampania, filtroFormador, filtroEstado });
      
      const params = new URLSearchParams({
        page: paginaActual.toString(),
        pageSize: '10'
      });
      
      if (filtroCampania) params.append('campania', filtroCampania);
      if (filtroFormador) params.append('formador', filtroFormador);
      if (filtroEstado) params.append('estado', filtroEstado);
      
      const url = `/capacitaciones/resumen-jefe?${params.toString()}`;
      console.log('📡 URL completa:', url);
      console.log('🔑 Token disponible:', !!api.defaults.headers.common['Authorization']);
      
      const response = await api.get(url);
      console.log('✅ Respuesta del backend:', response);
      console.log('📊 Datos recibidos:', response.data);
      console.log('📈 Total recibido:', response.data?.total);
      console.log('🔍 Tipo de datos:', typeof response.data?.data, Array.isArray(response.data?.data));
      
      // Los datos están directamente en response.data
      const datos = response.data?.data || [];
      const total = response.data?.total || 0;
      
      console.log('🔍 Datos extraídos:', { datos, total, esArray: Array.isArray(datos) });
      
      setResumenCapacitaciones(datos);
      setTotalPaginas(Math.ceil(total / 10));
      
      console.log('✅ Estado actualizado:', { 
        resumenCapacitaciones: datos.length, 
        totalPaginas: Math.ceil(total / 10) 
      });
    } catch (error) {
      console.error('❌ Error cargando resumen de capacitaciones:', error);
      console.error('❌ Detalles del error:', error.response?.data, error.response?.status);
      setResumenCapacitaciones([]);
    }
  };

  // Función para guardar Q ENTRE
  const saveQEntre = async (rowIdx, row, value) => {
    try {
      // Extraer CampañaID y DNI_Capacitador del id del row
      const [campaniaId, fechaInicio, dniCapacitador] = row.id.split('_');
      
      await api.post('/capacitaciones/qentre-jefe', {
        CampañaID: parseInt(campaniaId),
        FechaInicio: fechaInicio,
        DNI_Capacitador: dniCapacitador,
        qEntre: value
      });
      
      // Actualizar en frontend
      const newResumen = [...resumenCapacitaciones];
      newResumen[rowIdx].qEntre = value;
      setResumenCapacitaciones(newResumen);
      
      // Mostrar mensaje de éxito
      alert('Q ENTRE guardado correctamente');
    } catch (error) {
      console.error('Error al guardar Q ENTRE:', error);
      alert('Error al guardar Q ENTRE');
    }
    setEditIdx(null);
    setEditValue(null);
  };

  if (loading || !data) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #297373 0%, #FE7F2D 100%)'
      }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          Cargando dashboard de jefa...
        </Typography>
      </Box>
    );
  }

  const datosParaGraficos = datosGraficos || data;
  const { totales = {}, capacitadores = [] } = datosParaGraficos || {};
  
  // Verificar que totales y capacitadores sean válidos
  const totalesValidos = totales && typeof totales === 'object' ? totales : {};
  const capacitadoresValidos = Array.isArray(capacitadores) ? capacitadores : [];
  
  const kpi = [
    { 
      label: "Capacitadores activos", 
      value: capacitadoresValidos.length || 0, 
      color: "primary.main",
      icon: <PeopleIcon />
    },
    { 
      label: "Postulantes totales", 
      value: totalesValidos.postulantes || 0, 
      color: "success.main",
      icon: <SchoolIcon />
    },
    { 
      label: "Deserciones", 
      value: totalesValidos.deserciones || 0, 
      color: "error.main",
      icon: <WarningIcon />
    },
    { 
      label: "Deserciones ATH1", 
      value: `${totalesValidos.desercionesATH1 || 0} (${totalesValidos.porcentajeDesercionesATH1 || 0}%)`, 
      color: "warning.main",
      icon: <TrendingUpIcon />
    },
    { 
      label: "Deserciones ATH2", 
      value: `${totalesValidos.desercionesATH2 || 0} (${totalesValidos.porcentajeDesercionesATH2 || 0}%)`, 
      color: "error.dark",
      icon: <WarningIcon />
    },
    { 
      label: "Deserciones Formación", 
      value: `${totalesValidos.desercionesATHFormacion || 0} (${totalesValidos.porcentajeDesercionesATHFormacion || 0}%)`, 
      color: "secondary.main",
      icon: <AssessmentIcon />
    },
    { 
      label: "% Éxito", 
      value: `${totalesValidos.porcentajeExito || 0}%`, 
      color: "success.dark",
      icon: <TrendingUpIcon />
    }
  ];

  // Datos para gráficos
  const barData = {
    labels: capacitadoresValidos?.map(c => {
      const partes = c.nombreCompleto?.trim().split(/\s+/) || [];
      const nombre = partes[0] || '';
      const apellido = partes[1] || '';
      return `${nombre} ${apellido}`.trim();
    }) || [],
    datasets: [
      {
        label: "Postulantes",
        data: capacitadoresValidos?.map(c => c.postulantes) || [],
        backgroundColor: "#60a5fa",
      },
      {
        label: "Deserciones ATH1",
        data: capacitadoresValidos?.map(c => c.desercionesATH1 || 0) || [],
        backgroundColor: "#f97316",
      },
      {
        label: "Deserciones ATH2",
        data: capacitadoresValidos?.map(c => c.desercionesATH2 || 0) || [],
        backgroundColor: "#ef4444",
      },
      {
        label: "Deserciones Formación",
        data: capacitadoresValidos?.map(c => c.desercionesATHFormacion || 0) || [],
        backgroundColor: "#a855f7",
      },
      {
        label: "Contratados",
        data: capacitadoresValidos?.map(c => c.contratados) || [],
        backgroundColor: "#6ee7b7",
      },
    ],
  };

  const pieData = {
    labels: ["Contratados", "Deserciones ATH1", "Deserciones ATH2", "Deserciones Formación", "Otros"],
    datasets: [
      {
        data: [
          totalesValidos?.contratados || 0,
          totalesValidos?.desercionesATH1 || 0,
          totalesValidos?.desercionesATH2 || 0,
          totalesValidos?.desercionesATHFormacion || 0,
          (totalesValidos?.postulantes || 0) - (totalesValidos?.contratados || 0) - (totalesValidos?.desercionesATH1 || 0) - (totalesValidos?.desercionesATH2 || 0) - (totalesValidos?.desercionesATHFormacion || 0),
        ],
        backgroundColor: ["#6ee7b7", "#f97316", "#ef4444", "#a855f7", "#fcd34d"],
      },
    ],
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f7f9fd' }}>
             {/* Header */}
       <Box sx={{ 
         display: 'flex', 
         alignItems: 'center', 
         justifyContent: 'space-between', 
         px: 8, 
         py: 2, 
         bgcolor: 'white', 
         boxShadow: 2, 
         borderRadius: '0 0 24px 24px', 
         mb: 4 
       }}>
         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
             <Box component="img" 
               src="/partner.svg" 
               alt="logo" 
               sx={{ 
                 width: 32, 
                 height: 32
               }} 
             />
             <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#22314a' }}>
               Panel de Jefa de Capacitaciones
             </Typography>
           </Box>
           <Typography variant="body1" sx={{ ml: 10, color: '#22314a', fontWeight: 'bold' }}>
             {nombreCompleto} 👋
           </Typography>
         </Box>
         
         {/* Botón para regresar al sidebar - Estilo similar al de capacitadores */}
         <Button
           variant="contained"
           onClick={() => window.history.back()}
           sx={{
             backgroundColor: '#297373',
             color: 'white',
             borderRadius: '50px',
             px: 4,
             py: 1.5,
             fontWeight: 'bold',
             boxShadow: 2,
             border: '1px solid #297373',
             '&:hover': {
               backgroundColor: 'rgba(41, 115, 115, 0.8)',
               transform: 'translateY(-1px)',
               boxShadow: 3
             },
             transition: 'all 0.2s ease-in-out'
           }}
         >
           ← Volver al Dashboard
         </Button>
       </Box>

                           {/* Filtros - Estilo exacto del proyecto anterior */}
        <div className="flex gap-4 px-8 mb-4">
          <select
            className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={campania}
            onChange={e => setCampania(e.target.value)}
          >
            <option value="">Todas las campañas</option>
            {Array.isArray(campanias) && campanias.length > 0 ? campanias.map(c => (
              <option key={`camp-${c.id}`} value={c.id}>
                {c.nombre}
              </option>
            )) : (
              <option disabled>No hay campañas disponibles</option>
            )}
          </select>
          
          <select
            className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={mes}
            onChange={e => setMes(e.target.value)}
          >
            <option value="">Todos los meses</option>
            {Array.isArray(meses) && meses.length > 0 ? meses.map(m => (
              <option key={`mes-${m.mes}`} value={m.mes}>
                {m.nombre}
              </option>
            )) : (
              <option disabled>No hay meses disponibles</option>
            )}
          </select>
        </div>

        {/* KPIs - Estilo exacto del proyecto anterior */}
        <div className="grid grid-cols-7 gap-4 px-8 mb-8">
          {Array.isArray(kpi) && kpi.length > 0 ? kpi.map((k, i) => {
            // Colores exactos del proyecto anterior
            const kpiColors = [
              "bg-blue-100 text-blue-800",      // Capacitadores activos
              "bg-emerald-100 text-emerald-800", // Postulantes totales
              "bg-rose-100 text-rose-800",      // Deserciones
              "bg-orange-100 text-orange-800",  // Deserciones ATH1
              "bg-red-100 text-red-800",        // Deserciones ATH2
              "bg-purple-100 text-purple-800",  // Deserciones Formación
              "bg-yellow-100 text-yellow-800"   // % Éxito
            ];
            
            const colorClass = kpiColors[i] || "bg-gray-100 text-gray-800";
            
            return (
              <div key={`kpi-${i}`} className={`rounded-2xl p-4 shadow-lg flex flex-col items-center ${colorClass}`}>
                <span className="text-2xl font-bold mb-1">{k.value}</span>
                <span className="text-sm font-semibold text-center">{k.label}</span>
              </div>
            );
          }) : (
            <div className="col-span-7 text-center py-8 text-gray-500">
              No hay datos para mostrar en los KPIs
            </div>
          )}
        </div>

      {/* Resumen de Capacitaciones */}
      <div className="px-8 mb-8">
        <div className="rounded-xl shadow bg-white p-4 mt-6">
          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro Campaña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaña</label>
              <select
                value={filtroCampania}
                onChange={(e) => {
                  setFiltroCampania(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las campañas</option>
                {Array.isArray(campanias) && campanias.map(campania => (
                  <option key={`camp-${campania.id}`} value={campania.nombre}>{campania.nombre}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro Formador */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Formador</label>
              <select
                value={filtroFormador}
                onChange={(e) => {
                  setFiltroFormador(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los formadores</option>
                {Array.isArray(resumenCapacitaciones) && [...new Set(resumenCapacitaciones.map(row => row.formador))].sort().map(formador => (
                  <option key={`form-${formador}`} value={formador}>{formador}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="En curso">En curso</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
          </div>
          
          <table className="min-w-full text-xs border border-gray-200">
            <thead>
              <tr className="bg-blue-100 text-blue-900">
                <th rowSpan={2} className="px-2 py-1">CAMPAÑA</th>
                <th rowSpan={2} className="px-2 py-1">MODALIDAD</th>
                <th rowSpan={2} className="px-2 py-1">FORMADOR</th>
                <th rowSpan={2} className="px-2 py-1">INICIO CAPA</th>
                <th rowSpan={2} className="px-2 py-1">FECHA FIN OJT</th>
                <th rowSpan={2} className="px-2 py-1">STATUS</th>
                <th rowSpan={2} className="px-2 py-1">Q ENTRE</th>
                <th rowSpan={2} className="px-2 py-1">ESPERADO</th>
                <th rowSpan={2} className="px-2 py-1">LISTA</th>
                <th rowSpan={2} className="px-2 py-1">1er DÍA</th>
                <th rowSpan={2} className="px-2 py-1">% EFEC ATH</th>
                <th rowSpan={2} className="px-2 py-1">RIESGO ATH</th>
                <th colSpan={7} className="px-1 py-1 text-center">Días</th>
                <th rowSpan={2} className="px-2 py-1">ACTIVOS</th>
                <th rowSpan={2} className="px-2 py-1">Q BAJAS</th>
                <th rowSpan={2} className="px-2 py-1">% DESER</th>
                <th rowSpan={2} className="px-2 py-1">RIESGO FORM</th>
              </tr>
              <tr className="bg-blue-100 text-blue-900">
                {Array.from({length: 7}, (_, i) => (
                  <th key={i} className={`px-1 py-1 text-center bg-gray-300 ${i === 0 ? 'border-l-2 border-gray-300' : ''}`}>{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {console.log('📊 Renderizando tabla con datos:', { 
                resumenCapacitaciones, 
                esArray: Array.isArray(resumenCapacitaciones), 
                longitud: resumenCapacitaciones?.length,
                tipo: typeof resumenCapacitaciones 
              })}
              {Array.isArray(resumenCapacitaciones) && resumenCapacitaciones.length > 0 ? resumenCapacitaciones.map((row, idx) => {
                const esperado = row.qEntre * 2;
                let porcentajeEfec = 0;
                let riesgoAth = '---';
                let riesgoAthClass = 'text-gray-500';
                let porcentajeEfecClass = 'bg-gray-50';
                
                // Solo calcular si hay Q ENTRE
                if (row.qEntre && row.qEntre > 0) {
                  porcentajeEfec = esperado > 0 ? Math.round((row.primerDia / esperado) * 100) : 0;
                  
                  if (porcentajeEfec < 60) {
                    riesgoAth = 'Riesgo alto';
                    riesgoAthClass = 'text-red-700';
                    porcentajeEfecClass = 'bg-red-100';
                  } else if (porcentajeEfec < 85) {
                    riesgoAth = 'Riesgo medio';
                    riesgoAthClass = 'text-yellow-700';
                    porcentajeEfecClass = 'bg-yellow-100';
                  } else {
                    riesgoAth = 'Sin riesgo';
                    riesgoAthClass = 'text-green-700';
                    porcentajeEfecClass = 'bg-green-100';
                  }
                }
                
                const status = row.finalizado ? 'Finalizado' : 'En curso';
                return (
                  <tr key={`row-${idx}`} className={idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                    <td className="border px-2 py-1">{row.campania}</td>
                    <td className="border px-2 py-1">{row.modalidad}</td>
                    <td className="border px-2 py-1">{row.formador}</td>
                    <td className="border px-2 py-1">{row.inicioCapa}</td>
                    <td className="border px-2 py-1">{row.finOjt}</td>
                    <td className="border px-2 py-1">{status}</td>
                    <td className="border px-2 py-1 font-bold text-blue-900 cursor-pointer text-center" onClick={() => { setEditIdx(idx); setEditValue(row.qEntre); }}>
                      {editIdx === idx ? (
                        <input
                          type="number"
                          className="w-16 text-center border rounded px-1 py-0.5 outline-none"
                          value={editValue}
                          autoFocus
                          min={1}
                          onChange={e => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                          onBlur={() => saveQEntre(idx, row, Number(editValue))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.target.blur();
                            } else if (e.key === 'Escape') {
                              setEditIdx(null); setEditValue(null);
                            }
                          }}
                        />
                      ) : row.qEntre}
                    </td>
                    <td className="border px-2 py-1 text-center">{esperado}</td>
                    <td className="border px-2 py-1 text-center">{row.lista}</td>
                    <td className="border px-2 py-1 text-center">{row.primerDia}</td>
                    <td className={`border px-2 py-1 text-center ${porcentajeEfecClass}`}>
                      {row.qEntre && row.qEntre > 0 ? `${porcentajeEfec}%` : '---'}
                    </td>
                    <td className={`border px-2 py-1 ${riesgoAthClass}`}>{riesgoAth}</td>
                    {/* Días visibles */}
                    {Array.from({length: 7}, (_, i) => (
                      <td key={`dia-${i}`} className={`border px-1 py-1 text-center ${idx % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200'} ${i === 0 ? 'border-l-2 border-gray-200' : ''}`}>
                        <span className="text-xs font-medium text-gray-600">
                          {row.asistencias && row.asistencias[i] ? row.asistencias[i] : ''}
                        </span>
                      </td>
                    ))}
                    <td className="border px-2 py-1 text-center">{row.activos}</td>
                    <td className="border px-2 py-1 text-center">{row.qBajas}</td>
                    <td className="border px-2 py-1 text-center">{row.porcentajeDeser}%</td>
                    <td className="border px-2 py-1">{row.riesgoForm}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={25} className="border px-4 py-8 text-center text-gray-500">
                    No hay datos para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Controles de paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs disabled:opacity-40"
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
              >
                Anterior
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => (
                <button
                  key={`page-${i}`}
                  className={`px-2 py-1 rounded text-xs ${paginaActual === i + 1 ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'}`}
                  onClick={() => setPaginaActual(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs disabled:opacity-40"
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de capacitadores */}
      <Box sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: 3, mx: 8, p: 6, mb: 8 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#297373', mb: 4 }}>
          Capacitadores activos
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.100' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>DNI</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre completo</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Postulantes</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Deserciones</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Contratados</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>% Éxito</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(capacitadoresValidos) && capacitadoresValidos.length > 0 ? capacitadoresValidos.map(c => {
                const tasaDesercion = c.postulantes > 0 ? Math.round((c.deserciones / c.postulantes) * 100) : 0;
                const alertaRoja = tasaDesercion > 40;
                
                return (
                  <TableRow 
                    key={c.dni} 
                    sx={{ 
                      '&:hover': { bgcolor: 'primary.50' },
                      ...(alertaRoja && { bgcolor: 'error.100', color: 'error.800', fontWeight: 'bold' })
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace' }}>{c.dni}</TableCell>
                    <TableCell>{c.nombreCompleto}</TableCell>
                    <TableCell align="center">{c.postulantes}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        {c.deserciones}
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ({tasaDesercion}%)
                        </Typography>
                        {alertaRoja && (
                          <MuiTooltip title="¡Alerta! Tasa de deserción mayor a 40%">
                            <WarningIcon sx={{ color: 'error.main', fontSize: 16 }} />
                          </MuiTooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{c.contratados}</TableCell>
                    <TableCell align="center">{c.porcentajeExito}%</TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No hay capacitadores para mostrar
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Gráficos */}
      <Box sx={{ px: 8, mb: 8 }}>
        {/* Filtros para gráficos */}
        <Paper sx={{ p: 4, mb: 4, bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#297373' }}>
              Filtros para gráficos:
            </Typography>
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Campaña</InputLabel>
              <Select
                value={filtroGraficosCampania}
                onChange={(e) => setFiltroGraficosCampania(e.target.value)}
                label="Campaña"
              >
                <MenuItem value="">Todas las campañas</MenuItem>
                {campanias.map(c => (
                  <MenuItem key={`camp-${c.id}`} value={c.id}>
                    {c.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Capa</InputLabel>
              <Select
                value={filtroGraficosCapa}
                onChange={(e) => setFiltroGraficosCapa(e.target.value)}
                label="Capa"
                disabled={!filtroGraficosCampania}
              >
                <MenuItem value="">Todas las capas</MenuItem>
                {Array.isArray(capas) && capas.length > 0 ? capas.map(c => (
                  <MenuItem key={`capa-${c.capa}`} value={c.capa}>
                    Capa {c.capa} — {c.fechaInicio}
                  </MenuItem>
                )) : (
                  <MenuItem disabled>No hay capas disponibles</MenuItem>
                )}
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setFiltroGraficosCampania("");
                setFiltroGraficosCapa("");
              }}
              startIcon={<ClearIcon />}
            >
              Limpiar filtros
            </Button>
          </Box>
        </Paper>
        
        <Grid container spacing={8}>
          <Grid item sx={{ width: { xs: '100%', md: '50%' } }}>
            <Paper sx={{ p: 6, bgcolor: 'white', textAlign: 'center', minHeight: 400 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#297373', mb: 2 }}>
                Postulantes, Deserciones por Tipo y Contratados por Capacitador
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                {capacitadoresValidos.length > 0 ? (
                  <Box sx={{ maxWidth: 500, maxHeight: 350, width: '100%' }}>
                    <Bar 
                      data={barData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { 
                          legend: { position: 'top' },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y;
                              }
                            }
                          },
                          datalabels: {
                            anchor: 'end',
                            align: 'top',
                            offset: 4,
                            color: '#333',
                            font: {
                              weight: 'bold',
                              size: 11
                            },
                            formatter: function(value) {
                              return value > 0 ? value : '';
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 5
                            }
                          }
                        }
                      }} 
                      height={350} 
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
                    <Typography variant="body1" color="text.secondary">
                      No hay datos para mostrar en el gráfico
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item sx={{ width: { xs: '100%', md: '50%' } }}>
            <Paper sx={{ p: 6, bgcolor: 'white', textAlign: 'center', minHeight: 400 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#297373', mb: 2 }}>
                Distribución de Estados Finales y Deserciones por Tipo
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                {capacitadoresValidos.length > 0 ? (
                  <Box sx={{ maxWidth: 350, maxHeight: 350, width: '100%' }}>
                    <Pie 
                      data={pieData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { 
                          legend: { position: 'bottom' },
                          datalabels: {
                            color: '#000000',
                            font: {
                              weight: 'bold',
                              size: 14
                            },
                            formatter: function(value) {
                              return value > 0 ? value : '';
                            },
                            textAlign: 'center',
                            textBaseline: 'middle'
                          }
                        } 
                      }} 
                      height={350} 
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
                    <Typography variant="body1" color="text.secondary">
                      No hay datos para mostrar en el gráfico
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
