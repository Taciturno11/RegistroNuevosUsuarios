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
  
  // Estados para el nuevo sistema de roles
  const [catalogo, setCatalogo] = useState({ roles: [], vistas: [] });
  const [nuevoRol, setNuevoRol] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [vistasRolSeleccionado, setVistasRolSeleccionado] = useState([]);
  const [modalCrearRol, setModalCrearRol] = useState(false);
  const [modalEditarVistas, setModalEditarVistas] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Solo admin puede acceder
  const puedeAccederControlMaestro = user?.role === 'admin';

  // Estados para permisos especiales
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [permisosEmpleado, setPermisosEmpleado] = useState([]);
  const [modalPermisos, setModalPermisos] = useState({ open: false, empleado: null });
  const [nuevaVista, setNuevaVista] = useState('');

  useEffect(() => {
    if (puedeAccederControlMaestro) {
      cargarEmpleados();
      cargarCatalogo();
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

  const cargarCatalogo = async () => {
    try {
      const response = await api.get('/acceso/catalogo');
      if (response.data.success) {
        setCatalogo(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando catálogo:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar catálogo de roles y vistas',
        severity: 'error'
      });
    }
  };

  const crearRol = async () => {
    try {
      if (!nuevoRol.trim()) {
        setSnackbar({
          open: true,
          message: 'Nombre del rol es requerido',
          severity: 'warning'
        });
        return;
      }

      const response = await api.post('/acceso/roles', {
        nombreRol: nuevoRol.trim()
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Rol creado exitosamente',
          severity: 'success'
        });
        setNuevoRol('');
        setModalCrearRol(false);
        await cargarCatalogo();
      }
    } catch (error) {
      console.error('Error creando rol:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al crear rol',
        severity: 'error'
      });
    }
  };

  const cargarVistasRol = async (nombreRol) => {
    try {
      const response = await api.get(`/acceso/roles/${nombreRol}/vistas`);
      if (response.data.success) {
        setVistasRolSeleccionado(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando vistas del rol:', error);
      setVistasRolSeleccionado([]);
    }
  };

  const guardarVistasRol = async () => {
    try {
      const response = await api.put(`/acceso/roles/${rolSeleccionado}/vistas`, {
        vistas: vistasRolSeleccionado
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Vistas del rol actualizadas',
          severity: 'success'
        });
        setModalEditarVistas(false);
      }
    } catch (error) {
      console.error('Error guardando vistas del rol:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar vistas del rol',
        severity: 'error'
      });
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
      
      if (empleado.DNI === '73766815' && nuevoRol !== 'admin') {
        setSnackbar({
          open: true,
          message: 'No puedes cambiar tu propio rol de administrador',
          severity: 'warning'
        });
        return;
      }

      const response = await api.put(`/acceso/empleados/${empleado.DNI}/rol`, {
        nombreRol: nuevoRol
      });

      if (response.data.success) {
        setEmpleados(prev => prev.map(emp => 
          emp.DNI === empleado.DNI 
            ? { ...emp, role: nuevoRol }
            : emp
        ));
        
        setEditMode(prev => ({ ...prev, [empleado.DNI]: false }));
        
        setSnackbar({
          open: true,
          message: 'Rol asignado al empleado exitosamente',
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
    const rolEncontrado = catalogo.roles.find(r => r.NombreRol === role);
    return rolEncontrado ? rolEncontrado.NombreRol : role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'error',
      'agente': 'default',
      'analista': 'success',
      'supervisor': 'warning',
      'capacitador': 'secondary'
    };
    return colors[role] || 'primary';
  };

  const getRoleIcon = (role) => {
    const icons = {
      'admin': <SecurityIcon />,
      'agente': <PersonIcon />,
      'analista': <AdminIcon />,
      'supervisor': <SupervisorIcon />,
      'capacitador': <SchoolIcon />
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

  // Si no es admin, mostrar mensaje de acceso restringido
  if (!puedeAccederControlMaestro) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            🔐 Acceso Restringido
          </Typography>
          <Typography variant="body1">
            Solo administradores pueden acceder a esta vista de control maestro.
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
              Gestión de Roles y Permisos - Administrador
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Estadísticas Compactas */}
      <Grid container spacing={2} sx={{ mb: 2, justifyContent: 'center' }}>
        {catalogo.roles.map(role => {
          const count = empleados.filter(emp => emp.role === role.NombreRol).length;
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={role.RoleID}>
              <Card sx={{ textAlign: 'center', p: 1.5, height: '100%', minWidth: 120 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {getRoleIcon(role.NombreRol)}
                </Box>
                <Typography variant="h5" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {role.NombreRol}
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
                label="Gestión de Empleados" 
                iconPosition="start"
              />
              <Tab 
                icon={<SecurityIcon />} 
                label="Crear Roles" 
                iconPosition="start"
              />
              <Tab 
                icon={<HistoryIcon />} 
                label="Configurar Vistas por Rol" 
                iconPosition="start"
              />
            </Tabs>
          </Box>

        {/* Tab 1: Gestión de Empleados */}
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
                      {catalogo.roles.map(rol => (
                        <MenuItem key={rol.RoleID} value={rol.NombreRol}>
                          {rol.NombreRol}
                        </MenuItem>
                      ))}
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
                                  {catalogo.roles.map(rol => (
                                    <MenuItem key={rol.RoleID} value={rol.NombreRol}>
                                      {rol.NombreRol}
                                    </MenuItem>
                                  ))}
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

        {/* Tab 2: Crear Roles */}
        {tabValue === 1 && (
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Gestión de Roles del Sistema
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setModalCrearRol(true)}
                variant="contained"
                size="small"
              >
                Crear Nuevo Rol
              </Button>
            </Box>

            <Grid container spacing={2}>
              {catalogo.roles.map(rol => (
                <Grid item xs={12} sm={6} md={4} key={rol.RoleID}>
                  <Card sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight={600}>
                        {rol.NombreRol}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Rol: {rol.NombreRol}
                    </Typography>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setRolSeleccionado(rol.NombreRol);
                        cargarVistasRol(rol.NombreRol);
                        setModalEditarVistas(true);
                      }}
                    >
                      Configurar Vistas
                    </Button>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {catalogo.roles.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No hay roles creados. Haz clic en "Crear Nuevo Rol" para comenzar.
              </Alert>
            )}
          </CardContent>
        )}

        {/* Tab 3: Configurar Vistas por Rol */}
        {tabValue === 2 && (
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Configurar Vistas por Rol
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Selecciona un rol para configurar qué vistas del sistema puede acceder.
            </Typography>

            <Grid container spacing={3}>
              {catalogo.roles.map(rol => (
                <Grid item xs={12} md={6} key={rol.RoleID}>
                  <Card sx={{ p: 2, border: '2px solid #e0e0e0', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight={600}>
                        {rol.NombreRol}
                      </Typography>
                    </Box>
                    
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => {
                        setRolSeleccionado(rol.NombreRol);
                        cargarVistasRol(rol.NombreRol);
                        setModalEditarVistas(true);
                      }}
                      sx={{ mb: 2 }}
                    >
                      Configurar Vistas de este Rol
                    </Button>
                    
                    <Typography variant="body2" color="text.secondary">
                      Código: {rol.CodigoRol}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {catalogo.roles.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No hay roles disponibles. Crea primero un rol en la pestaña "Crear Roles".
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modal para Crear Rol */}
      <Dialog open={modalCrearRol} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
            Crear Nuevo Rol
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre del Rol"
              placeholder="ej: analista, supervisor, capacitador"
              value={nuevoRol}
              onChange={(e) => setNuevoRol(e.target.value)}
              helperText="Nombre único del rol (ej: analista1, jefe, supervisor)"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => {
            setModalCrearRol(false);
            setNuevoRol('');
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={crearRol} 
            variant="contained"
            disabled={!nuevoRol.trim()}
          >
            Crear Rol
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para Configurar Vistas del Rol */}
      <Dialog open={modalEditarVistas} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 1, color: 'primary.main' }} />
            Configurar Vistas - {catalogo.roles.find(r => r.NombreRol === rolSeleccionado)?.NombreRol}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Selecciona las vistas a las que este rol tendrá acceso en el sistema.
          </Typography>
          
          {/* Organizar vistas por categorías verticalmente */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              {
                titulo: 'Gestión de Empleados',
                vistas: ['Registrar Empleado', 'Actualizar Empleado', 'Cese de Empleado', 'Justificaciones', 'OJT / CIC', 'Asignación Excepciones', 'Bonos', 'Ejecutar SP']
              },
              {
                titulo: 'Reporte de Asistencias',
                vistas: ['Reporte de Asistencias']
              },
              {
                titulo: 'Reporte de Tardanzas', 
                vistas: ['Reporte de Tardanzas']
              },
              {
                titulo: 'Capacitaciones',
                vistas: ['Capacitaciones']
              },
              {
                titulo: 'Pagos de Nómina',
                vistas: ['Pagos de Nómina']
              },
              {
                titulo: 'Seguridad',
                vistas: ['Control Maestro']
              }
            ].map((categoria, index) => {
              const vistasDisponibles = categoria.vistas.filter(nombreVista => 
                catalogo.vistas.some(v => v.NombreVista === nombreVista)
              );
              
              if (vistasDisponibles.length === 0) return null;
              
              const todasSeleccionadas = vistasDisponibles.every(v => vistasRolSeleccionado.includes(v));
              const algunaSeleccionada = vistasDisponibles.some(v => vistasRolSeleccionado.includes(v));
              
              return (
                <Box key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
                  {/* Título con checkbox */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2, 
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                    onClick={() => {
                      if (todasSeleccionadas) {
                        // Deseleccionar todas de la categoría
                        setVistasRolSeleccionado(prev => prev.filter(v => !vistasDisponibles.includes(v)));
                      } else {
                        // Seleccionar todas de la categoría
                        setVistasRolSeleccionado(prev => [...new Set([...prev, ...vistasDisponibles])]);
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        border: '2px solid #1976d2',
                        borderRadius: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: todasSeleccionadas ? '#1976d2' : (algunaSeleccionada ? '#1976d2' : 'transparent')
                      }}
                    >
                      {todasSeleccionadas ? (
                        <CheckIcon sx={{ fontSize: 16, color: 'white' }} />
                      ) : algunaSeleccionada ? (
                        <Box sx={{ width: 8, height: 8, bgcolor: 'white', borderRadius: 0.5 }} />
                      ) : null}
                    </Box>
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      📁 {categoria.titulo} ({vistasDisponibles.length} vistas)
                    </Typography>
                  </Box>
                  
                  {/* Lista vertical de vistas */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 4 }}>
                    {vistasDisponibles.map(nombreVista => {
                      const vista = catalogo.vistas.find(v => v.NombreVista === nombreVista);
                      const seleccionada = vistasRolSeleccionado.includes(vista.NombreVista);
                      
                      return (
                        <Box
                          key={vista.VistaID}
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            p: 1.5,
                            cursor: 'pointer',
                            borderRadius: 1,
                            border: '1px solid #e0e0e0',
                            bgcolor: seleccionada ? '#f3f8ff' : 'white',
                            '&:hover': { bgcolor: seleccionada ? '#e3f2fd' : '#f9f9f9' }
                          }}
                          onClick={() => {
                            if (seleccionada) {
                              setVistasRolSeleccionado(prev => prev.filter(v => v !== vista.NombreVista));
                            } else {
                              setVistasRolSeleccionado(prev => [...prev, vista.NombreVista]);
                            }
                          }}
                        >
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              border: '2px solid #1976d2',
                              borderRadius: 1,
                              mr: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: seleccionada ? '#1976d2' : 'transparent'
                            }}
                          >
                            {seleccionada && <CheckIcon sx={{ fontSize: 14, color: 'white' }} />}
                          </Box>
                          <Typography variant="body1" fontWeight={500}>
                            {vista.NombreVista}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {catalogo.vistas.length === 0 && (
            <Alert severity="info">
              No hay vistas disponibles en el sistema.
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setModalEditarVistas(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={guardarVistasRol} 
            variant="contained"
          >
            Guardar Configuración
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
