import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Paper, 
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  Stack,
  Container
} from '@mui/material';
import {
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  SupervisorAccount as SupervisorIcon,
  Visibility as AuditorIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  ExitToApp as ExitIcon,
  Description as DescriptionIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const ControlMaestro = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [empleadosPaginados, setEmpleadosPaginados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState({});
  const [tempRoles, setTempRoles] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [historial, setHistorial] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Verificar si es el creador del sistema o analista
  const isCreador = user?.dni === '73766815';
  const isAnalista = user?.role === 'analista';
  const puedeAccederControlMaestro = isCreador || isAnalista;

  // Estados para permisos especiales
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [permisosEmpleado, setPermisosEmpleado] = useState([]);
  const [modalPermisos, setModalPermisos] = useState({ open: false, empleado: null });
  const [nuevaVista, setNuevaVista] = useState('');

  useEffect(() => {
    if (puedeAccederControlMaestro) {
      cargarEmpleados();
      cargarHistorial();
    }
  }, [puedeAccederControlMaestro]);

  useEffect(() => {
    // Filtrar empleados basado en el término de búsqueda y filtro de rol
    let filtrados = empleados;
    
    if (searchTerm.trim() !== '') {
      filtrados = filtrados.filter(emp => 
        emp.DNI?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.Nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.ApellidoPaterno?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== 'todos') {
      filtrados = filtrados.filter(emp => emp.role === roleFilter);
    }
    
    setEmpleadosFiltrados(filtrados);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, empleados]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginados = empleadosFiltrados.slice(startIndex, endIndex);
    setEmpleadosPaginados(paginados);
  }, [empleadosFiltrados, currentPage, itemsPerPage]);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const response = await api.get('/empleados/control-maestro');
      if (response.data.success) {
        setEmpleados(response.data.data);
        setEmpleadosFiltrados(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando empleados:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar empleados',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      const response = await api.get('/empleados/historial-roles');
      if (response.data.success) {
        setHistorial(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const iniciarEdicion = (empleado) => {
    setEditMode(prev => ({ ...prev, [empleado.DNI]: true }));
    setTempRoles(prev => ({ ...prev, [empleado.DNI]: empleado.role }));
  };

  const cancelarEdicion = (dni) => {
    setEditMode(prev => ({ ...prev, [dni]: false }));
    setTempRoles(prev => ({ ...prev, [dni]: empleados.find(emp => emp.DNI === dni)?.role }));
  };

  const guardarRol = async (empleado) => {
    try {
      const nuevoRol = tempRoles[empleado.DNI];
      
      if (empleado.DNI === '73766815' && nuevoRol !== 'creador') {
        setSnackbar({
          open: true,
          message: 'No puedes cambiar tu propio rol de creador',
          severity: 'warning'
        });
        return;
      }

      const response = await api.put(`/empleados/${empleado.DNI}/rol`, {
        role: nuevoRol
      });

      if (response.data.success) {
        setEmpleados(prev => prev.map(emp => 
          emp.DNI === empleado.DNI 
            ? { ...emp, role: nuevoRol }
            : emp
        ));
        
        setEditMode(prev => ({ ...prev, [empleado.DNI]: false }));
        await cargarHistorial();
        
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error actualizando rol:', error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar rol',
        severity: 'error'
      });
    }
  };

  const getRoleDisplayName = (role) => {
    const roles = {
      'agente': 'Agente',
      'coordinador': 'Coordinador',
      'analista': 'Analista',
      'supervisor': 'Supervisor',
      'jefe': 'Jefe',
      'capacitador': 'Capacitador',
      'back office': 'Back Office',
      'monitor': 'Monitor',
      'controller': 'Controller',
      'creador': 'Creador del Sistema'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'agente': 'default',
      'coordinador': 'primary',
      'analista': 'success',
      'supervisor': 'warning',
      'jefe': 'error',
      'capacitador': 'secondary',
      'back office': 'info',
      'monitor': 'default',
      'controller': 'default',
      'creador': 'error'
    };
    return colors[role] || 'default';
  };

  const getRoleIcon = (role) => {
    const icons = {
      'agente': <PersonIcon />,
      'coordinador': <SupervisorIcon />,
      'analista': <SecurityIcon />,
      'supervisor': <SupervisorIcon />,
      'jefe': <AdminIcon />,
      'capacitador': <SchoolIcon />,
      'back office': <AdminIcon />,
      'monitor': <PersonIcon />,
      'controller': <SecurityIcon />,
      'creador': <SecurityIcon />
    };
    return icons[role] || <PersonIcon />;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    
    try {
      // Si la fecha viene como string ISO, convertirla correctamente
      let fechaObj;
      if (typeof fecha === 'string') {
        if (fecha.includes('T')) {
          // Formato ISO con T - usar la fecha tal como viene sin conversión de zona horaria
          const [year, month, day] = fecha.split('T')[0].split('-');
          fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (fecha.includes('-')) {
          // Formato YYYY-MM-DD
          const [year, month, day] = fecha.split('-');
          fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Otro formato, intentar parsear
          fechaObj = new Date(fecha);
        }
      } else {
        fechaObj = new Date(fecha);
      }
      
      // Verificar que la fecha sea válida
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
      }
      
      // Formatear como DD/MM/YYYY
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  };

  // Funciones para permisos especiales
  const abrirModalPermisos = (empleado) => {
    setModalPermisos({ open: true, empleado });
    cargarPermisosEmpleado(empleado.DNI);
  };

  const cargarPermisosEmpleado = async (dni) => {
    try {
      const response = await api.get(`/permisos/empleado/${dni}`);
      if (response.data.success) {
        setPermisosEmpleado(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando permisos:', error);
      setPermisosEmpleado([]);
    }
  };

  const habilitarPermiso = async () => {
    if (!nuevaVista || !modalPermisos.empleado) return;
    
    try {
      const response = await api.post('/permisos', {
        dniEmpleado: modalPermisos.empleado.DNI,
        vista: nuevaVista
      });

      if (response.data.success) {
        await cargarPermisosEmpleado(modalPermisos.empleado.DNI);
        setNuevaVista('');
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error habilitando permiso:', error);
      setSnackbar({
        open: true,
        message: 'Error al habilitar permiso',
        severity: 'error'
      });
    }
  };

  const eliminarPermiso = async (permisoId) => {
    try {
      const response = await api.delete(`/permisos/${permisoId}`);
      if (response.data.success) {
        await cargarPermisosEmpleado(modalPermisos.empleado.DNI);
        setSnackbar({
          open: true,
          message: 'Permiso eliminado exitosamente',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error eliminando permiso:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar permiso',
        severity: 'error'
      });
    }
  };

  // Si no es el creador o analista, mostrar mensaje de acceso restringido
  if (!puedeAccederControlMaestro) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            🔐 Acceso Restringido
          </Typography>
          <Typography variant="body1">
            Solo el creador del sistema o analistas pueden acceder a esta vista de control maestro.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Volver al Inicio
          </Button>
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
          🔄 Cargando Control Maestro...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header Compacto */}
      <Paper sx={{ p: 2, mb: 2, textAlign: 'center', background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Avatar sx={{ width: 50, height: 50, bgcolor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}>
            <SecurityIcon sx={{ fontSize: 25 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              🛡️ Control Maestro del Sistema
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Gestión de Roles y Permisos - {isCreador ? 'Creador del Sistema' : 'Analista'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Estadísticas Compactas */}
      <Grid container spacing={2} sx={{ mb: 2, justifyContent: 'center' }}>
        {['agente', 'coordinador', 'analista', 'supervisor', 'jefe', 'back office', 'capacitador', 'monitor', 'controller'].map(role => {
          const count = empleados.filter(emp => emp.role === role).length;
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={role}>
              <Card sx={{ textAlign: 'center', p: 1.5, height: '100%', minWidth: 120 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {getRoleIcon(role)}
                </Box>
                <Typography variant="h5" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getRoleDisplayName(role)}
                </Typography>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Tabs Compactos */}
      <Card sx={{ boxShadow: 2, mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto">
            <Tab 
              icon={<AssignmentIcon />} 
              label="Gestión de Roles" 
              iconPosition="start"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Historial" 
              iconPosition="start"
            />
            <Tab 
              icon={<SecurityIcon />} 
              label="Permisos Especiales" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab 1: Gestión de Roles */}
        {tabValue === 0 && (
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="🔍 Buscar empleado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filtrar por Rol</InputLabel>
                    <Select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      label="Filtrar por Rol"
                    >
                      <MenuItem value="todos">Todos los Roles</MenuItem>
                      <MenuItem value="agente">Agente</MenuItem>
                      <MenuItem value="coordinador">Coordinador</MenuItem>
                      <MenuItem value="analista">Analista</MenuItem>
                      <MenuItem value="supervisor">Supervisor</MenuItem>
                      <MenuItem value="jefe">Jefe</MenuItem>
                      <MenuItem value="back office">Back Office</MenuItem>
                      <MenuItem value="capacitador">Capacitador</MenuItem>
                      <MenuItem value="monitor">Monitor</MenuItem>
                      <MenuItem value="controller">Controller</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={cargarEmpleados}
                      variant="outlined"
                    >
                      Actualizar
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setSearchTerm('');
                        setRoleFilter('todos');
                        setCurrentPage(1);
                      }}
                      variant="outlined"
                      color="secondary"
                    >
                      Limpiar
                    </Button>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {empleadosFiltrados.length} de {empleados.length} empleados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Página {currentPage} de {Math.ceil(empleadosFiltrados.length / itemsPerPage)}
                </Typography>
              </Box>
            </Box>

            {/* Tabla Compacta */}
            {empleadosFiltrados.length === 0 ? (
              <Alert severity="info" sx={{ textAlign: 'center' }}>
                No se encontraron empleados con los filtros aplicados.
              </Alert>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell><strong>Empleado</strong></TableCell>
                        <TableCell><strong>DNI</strong></TableCell>
                        <TableCell><strong>Cargo</strong></TableCell>
                        <TableCell><strong>Rol</strong></TableCell>
                        <TableCell><strong>Acciones</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {empleadosPaginados.map((empleado) => (
                        <TableRow key={empleado.DNI} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                                {empleado.Nombres?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {empleado.Nombres} {empleado.ApellidoPaterno}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontSize="0.875rem">
                              {empleado.DNI}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                              {empleado.NombreCargo || `ID: ${empleado.CargoID}`}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            {editMode[empleado.DNI] ? (
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value={tempRoles[empleado.DNI] || empleado.role}
                                  onChange={(e) => setTempRoles(prev => ({ 
                                    ...prev, 
                                    [empleado.DNI]: e.target.value 
                                  }))}
                                  size="small"
                                >
                                  <MenuItem value="agente">Agente</MenuItem>
                                  <MenuItem value="coordinador">Coordinador</MenuItem>
                                  <MenuItem value="analista">Analista</MenuItem>
                                  <MenuItem value="supervisor">Supervisor</MenuItem>
                                  <MenuItem value="jefe">Jefe</MenuItem>
                                  <MenuItem value="back office">Back Office</MenuItem>
                                  <MenuItem value="capacitador">Capacitador</MenuItem>
                                  <MenuItem value="monitor">Monitor</MenuItem>
                                  <MenuItem value="controller">Controller</MenuItem>
                                  {empleado.DNI === '73766815' && (
                                    <MenuItem value="creador" disabled>Creador</MenuItem>
                                  )}
                                </Select>
                              </FormControl>
                            ) : (
                              <Chip
                                icon={getRoleIcon(empleado.role)}
                                label={getRoleDisplayName(empleado.role)}
                                color={getRoleColor(empleado.role)}
                                size="small"
                              />
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editMode[empleado.DNI] ? (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Guardar">
                                  <IconButton 
                                    color="primary" 
                                    onClick={() => guardarRol(empleado)}
                                    size="small"
                                  >
                                    <SaveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancelar">
                                  <IconButton 
                                    color="default" 
                                    onClick={() => cancelarEdicion(empleado.DNI)}
                                    size="small"
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Tooltip title="Editar rol">
                                <IconButton 
                                  color="primary" 
                                  onClick={() => iniciarEdicion(empleado)}
                                  size="small"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Paginación Compacta */}
                {empleadosFiltrados.length > itemsPerPage && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      count={Math.ceil(empleadosFiltrados.length / itemsPerPage)}
                      page={currentPage}
                      onChange={(event, value) => setCurrentPage(value)}
                      color="primary"
                      size="small"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        )}

        {/* Tab 2: Historial Compacto */}
        {tabValue === 1 && (
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Historial de Cambios de Roles
              </Typography>
              <Button
                startIcon={<RefreshIcon />}
                onClick={cargarHistorial}
                variant="outlined"
                size="small"
              >
                Actualizar
              </Button>
            </Box>

            {historial.length === 0 ? (
              <Alert severity="info">
                No hay registros de cambios de roles en el historial.
              </Alert>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Empleado</strong></TableCell>
                      <TableCell><strong>Rol Anterior</strong></TableCell>
                      <TableCell><strong>Rol Nuevo</strong></TableCell>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Responsable</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historial.slice(0, 20).map((registro, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                              {registro.Nombres?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
                                {registro.Nombres} {registro.ApellidoPaterno}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                {registro.DNIEmpleado}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={registro.RolAnterior || 'Sin asignar'} 
                            size="small" 
                            variant="outlined"
                            color="default"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getRoleDisplayName(registro.RolNuevo)} 
                            size="small" 
                            color={getRoleColor(registro.RolNuevo)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                            {formatearFecha(registro.FechaCambio)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                            {registro.DNIResponsable}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        )}

        {/* Tab 3: Permisos Especiales Compacto */}
        {tabValue === 2 && (
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Gestión de Permisos Especiales
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Habilita acceso a vistas específicas para empleados individuales.
            </Typography>

            {/* Buscar Empleado */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="🔍 Buscar empleado por DNI o nombre..."
                value={empleadoSeleccionado}
                onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                sx={{ mb: 1 }}
              />
              
              {/* Lista de empleados filtrados */}
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {empleados
                  .filter(emp => 
                    !empleadoSeleccionado || 
                    emp.DNI?.toLowerCase().includes(empleadoSeleccionado.toLowerCase()) ||
                    emp.Nombres?.toLowerCase().includes(empleadoSeleccionado.toLowerCase()) ||
                    emp.ApellidoPaterno?.toLowerCase().includes(empleadoSeleccionado.toLowerCase())
                  )
                  .slice(0, 8)
                  .map(emp => (
                    <Card key={emp.DNI} sx={{ mb: 1, p: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {emp.Nombres} {emp.ApellidoPaterno}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            DNI: {emp.DNI} • Cargo: {emp.NombreCargo || `ID: ${emp.CargoID}`}
                          </Typography>
                        </Box>
                        
                        <Button
                          variant="outlined"
                          onClick={() => abrirModalPermisos(emp)}
                          startIcon={<AddIcon />}
                          size="small"
                        >
                          Gestionar
                        </Button>
                      </Box>
                    </Card>
                  ))}
              </Box>
            </Box>
          </CardContent>
        )}
      </Card>

      {/* Modal para Gestionar Permisos */}
      <Dialog open={modalPermisos.open} maxWidth="md" fullWidth>
        <DialogTitle>
          🔓 Permisos Especiales - {modalPermisos.empleado?.Nombres} {modalPermisos.empleado?.ApellidoPaterno}
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Cargo actual: <strong>{modalPermisos.empleado?.NombreCargo || `ID: ${modalPermisos.empleado?.CargoID}`}</strong>
          </Typography>
          
          {/* Permisos actuales */}
          <Typography variant="h6" sx={{ mb: 1 }}>Permisos Actuales:</Typography>
          <Box sx={{ mb: 3 }}>
            {permisosEmpleado.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No tiene permisos especiales habilitados
              </Alert>
            ) : (
              permisosEmpleado.map(permiso => (
                <Chip
                  key={permiso.ID}
                  label={permiso.VistaHabilitada}
                  color="success"
                  onDelete={() => eliminarPermiso(permiso.ID)}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))
            )}
          </Box>
          
          {/* Habilitar nuevo permiso */}
          <Typography variant="h6" sx={{ mb: 1 }}>Habilitar Nuevo Permiso:</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <FormControl fullWidth>
                <InputLabel>Vista a habilitar</InputLabel>
                <Select
                  value={nuevaVista}
                  onChange={(e) => setNuevaVista(e.target.value)}
                  label="Vista a habilitar"
                >
                  <MenuItem value="/admin">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DashboardIcon /> Dashboard Administrativo
                    </Box>
                  </MenuItem>
                  <MenuItem value="/empleados">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon /> Gestión de Empleados
                    </Box>
                  </MenuItem>
                  <MenuItem value="/reportes">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssessmentIcon /> Reportes y Estadísticas
                    </Box>
                  </MenuItem>
                  <MenuItem value="/cese">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ExitIcon /> Registro de Cese
                    </Box>
                  </MenuItem>
                  <MenuItem value="/justificaciones">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon /> Justificaciones
                    </Box>
                  </MenuItem>
                  <MenuItem value="/ojt">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon /> OJT/CIC
                    </Box>
                  </MenuItem>
                  <MenuItem value="/asignaciones">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon /> Asignaciones Excepciones
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                onClick={habilitarPermiso}
                disabled={!nuevaVista}
                startIcon={<CheckIcon />}
              >
                Habilitar
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setModalPermisos({ open: false, empleado: null })}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ControlMaestro;
