import React, { useEffect, useState } from "react";
import { api } from "../../utils/capacitaciones/api";
import { Bar, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Chip, Card, CardContent, Grid } from '@mui/material';
import { useAuth } from "../../contexts/AuthContext";

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, ChartDataLabels);

export default function DashboardCoordinadora() {
  const { user } = useAuth();
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
  
  const nombreCompleto = user?.nombre || user?.nombres || 'Usuario';

  useEffect(() => {
    if (user?.dni) {
      api(`/api/capacitaciones/dashboard-coordinadora/${user.dni}/campanias`).then(setCampanias);
      api(`/api/capacitaciones/dashboard-coordinadora/${user.dni}/meses`).then(setMeses);
    }
  }, [user?.dni]);

  // Cargar capas cuando cambia la campaña en filtros de gráficos
  useEffect(() => {
    if (!filtroGraficosCampania || !user?.dni) {
      setCapas([]);
      setFiltroGraficosCapa("");
      return;
    }
    
    api(`/api/capacitaciones/dashboard-coordinadora/${user.dni}/capas?campania=${encodeURIComponent(filtroGraficosCampania)}`)
      .then(data => {
        setCapas(data);
        setFiltroGraficosCapa("");
      })
      .catch(error => {
        console.error('❌ Error cargando capas:', error);
        setCapas([]);
      });
  }, [filtroGraficosCampania, user?.dni]);

  useEffect(() => {
    if (user?.dni) {
      setLoading(true);
      api(`/api/capacitaciones/dashboard-coordinadora/${user.dni}?campania=${campania}&mes=${mes}`).then(res => {
        setData(res);
        setLoading(false);
      });
    }
  }, [campania, mes, user?.dni]);

  // Función para obtener datos filtrados para gráficos
  const obtenerDatosGraficos = async () => {
    if (!filtroGraficosCampania && !filtroGraficosCapa) {
      return data; // Usar datos principales si no hay filtros
    }
    
    let url = `/api/capacitaciones/dashboard-coordinadora/${user.dni}`;
    const params = [];
    
    if (filtroGraficosCampania) {
      params.push(`campania=${encodeURIComponent(filtroGraficosCampania)}`);
    }
    if (filtroGraficosCapa) {
      params.push(`capa=${encodeURIComponent(filtroGraficosCapa)}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    try {
      const response = await api(url);
      return response;
    } catch (error) {
      console.error('Error obteniendo datos para gráficos:', error);
      return data;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Cargando dashboard...</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">Error: No se pudieron cargar los datos</Typography>
      </Box>
    );
  }

  // Preparar datos para gráficos
  const datosGraficos = data.capacitadores || [];
  
  // Gráfico de barras - Postulantes por capacitador
  const chartDataPostulantes = {
    labels: datosGraficos.map(cap => cap.nombreCompleto),
    datasets: [
      {
        label: 'Postulantes',
        data: datosGraficos.map(cap => cap.postulantes),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Contratados',
        data: datosGraficos.map(cap => cap.contratados),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  // Gráfico de pie - Distribución de deserciones
  const chartDataDeserciones = {
    labels: ['ATH1 (Día 1)', 'ATH2 (Día 2)', 'Formación (Día 3+)'],
    datasets: [{
      data: [
        data.totales.desercionesATH1 || 0,
        data.totales.desercionesATH2 || 0,
        data.totales.desercionesATHFormacion || 0
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(153, 102, 255, 0.8)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(153, 102, 255, 1)'
      ],
      borderWidth: 1
    }]
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#e5e7eb', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: 'white', 
        p: 3, 
        borderRadius: 2, 
        mb: 3,
        boxShadow: 1
      }}>
        <Typography variant="h4" sx={{ mb: 2, color: '#1f2937' }}>
          Dashboard de Coordinadora
        </Typography>
        <Typography variant="h6" sx={{ color: '#6b7280' }}>
          Hola, bienvenida {nombreCompleto} 👋
        </Typography>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3, boxShadow: 1 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Filtros</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Campaña</InputLabel>
                <Select
                  value={campania}
                  onChange={(e) => setCampania(e.target.value)}
                  label="Campaña"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {campanias.map((camp) => (
                    <MenuItem key={camp} value={camp}>{camp}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  label="Mes"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {meses.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* KPIs Principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', boxShadow: 1 }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                {data.totales.postulantes || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Postulantes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', boxShadow: 1 }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                {data.totales.deserciones || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Deserciones
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', boxShadow: 1 }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                {data.totales.contratados || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Contratados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', boxShadow: 1 }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                {data.totales.porcentajeExito || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                % Éxito
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Postulantes por Capacitador</Typography>
              <Box sx={{ height: 400 }}>
                <Bar 
                  data={chartDataPostulantes}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      datalabels: { color: '#000', anchor: 'end', align: 'top' }
                    },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Distribución de Deserciones</Typography>
              <Box sx={{ height: 400 }}>
                <Pie 
                  data={chartDataDeserciones}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                      datalabels: { 
                        color: '#fff', 
                        font: { weight: 'bold' },
                        formatter: (value) => value > 0 ? value : ''
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de Capacitadores */}
      <Card sx={{ boxShadow: 1 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Resumen por Capacitador</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Capacitador
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Postulantes
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Deserciones
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Contratados
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    % Éxito
                  </th>
                </tr>
              </thead>
              <tbody>
                {datosGraficos.map((cap, index) => (
                  <tr key={cap.dni} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {cap.nombreCompleto}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      <Chip label={cap.postulantes} size="small" color="primary" />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      <Chip label={cap.deserciones} size="small" color="error" />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      <Chip label={cap.contratados} size="small" color="success" />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      <Chip 
                        label={`${cap.porcentajeExito}%`} 
                        size="small" 
                        color={cap.porcentajeExito >= 80 ? 'success' : cap.porcentajeExito >= 60 ? 'warning' : 'error'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
