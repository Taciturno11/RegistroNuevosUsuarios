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
  Tooltip as MuiTooltip
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
  
  const nombreCompleto = `${user?.nombres || ''} ${user?.apellidoPaterno || ''} ${user?.apellidoMaterno || ''}`.trim();

  // Cargar campañas y meses disponibles
  useEffect(() => {
    if (user?.dni) {
      cargarCampanias();
      cargarMeses();
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

  // Actualizar datos de gráficos cuando cambian los filtros
  useEffect(() => {
    if (!data) return;
    
    obtenerDatosGraficos().then(datos => {
      setDatosGraficos(datos);
    });
  }, [filtroGraficosCampania, filtroGraficosCapa, data]);

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
        py: 3, 
        bgcolor: 'white', 
        boxShadow: 2, 
        borderRadius: '0 0 24px 24px', 
        mb: 4 
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box component="img" 
              src="/partner.svg" 
              alt="logo" 
              sx={{ 
                width: 40, 
                height: 40
              }} 
            />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#22314a' }}>
              Panel de Jefa de Capacitaciones
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ ml: 12, color: '#22314a', fontWeight: 'bold' }}>
            {nombreCompleto} 👋
          </Typography>
        </Box>
        
        {/* Botón para regresar al sidebar */}
        <Button
          variant="outlined"
          color="primary"
          onClick={() => window.history.back()}
          startIcon={<RefreshIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontWeight: 'bold',
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              transform: 'translateY(-2px)',
              boxShadow: 3
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Regresar al Sidebar
        </Button>
      </Box>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 4, px: 8, mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Campaña</InputLabel>
          <Select
            value={campania}
            onChange={(e) => setCampania(e.target.value)}
            label="Campaña"
          >
            <MenuItem value="">Todas las campañas</MenuItem>
            {Array.isArray(campanias) && campanias.length > 0 ? campanias.map(c => (
              <MenuItem key={`camp-${c.id}`} value={c.id}>
                {c.nombre}
              </MenuItem>
            )) : (
              <MenuItem disabled>No hay campañas disponibles</MenuItem>
            )}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Mes</InputLabel>
          <Select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            label="Mes"
          >
            <MenuItem value="">Todos los meses</MenuItem>
            {Array.isArray(meses) && meses.length > 0 ? meses.map(m => (
              <MenuItem key={`mes-${m.mes}`} value={m.mes}>
                {m.nombre}
              </MenuItem>
            )) : (
              <MenuItem disabled>No hay meses disponibles</MenuItem>
            )}
          </Select>
        </FormControl>
      </Box>

      {/* KPIs */}
      <Grid container spacing={4} sx={{ px: 8, mb: 8 }}>
        {Array.isArray(kpi) && kpi.length > 0 ? kpi.map((k, i) => (
          <Grid item key={`kpi-${i}`} sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
            <Card sx={{ 
              textAlign: 'center', 
              p: 3, 
              boxShadow: 3,
              border: `2px solid ${k.color}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Box sx={{ color: k.color, mb: 2 }}>
                  {k.icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: k.color }}>
                  {k.value}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {k.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )) : (
          <Grid item sx={{ width: '100%' }}>
            <Card sx={{ textAlign: 'center', p: 4, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary">
                  No hay datos para mostrar en los KPIs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

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
