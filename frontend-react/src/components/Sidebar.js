import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  IconButton,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  PersonOff as PersonOffIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Security as SecurityIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  {
    title: 'Mi Perfil',
    path: '/profile',
    icon: <AccountCircleIcon />,
    adminOnly: false
  },
  {
    title: 'Registrar Empleado',
    path: '/registrar-empleado',
    icon: <PersonAddIcon />,
    adminOnly: true
  },
  {
    title: 'Actualizar Empleado',
    path: '/actualizar-empleado',
    icon: <EditIcon />,
    adminOnly: true
  },
  {
    title: 'Cese de Empleado',
    path: '/cese',
    icon: <PersonOffIcon />,
    adminOnly: true
  },
  {
    title: 'Justificaciones',
    path: '/justificaciones',
    icon: <CheckCircleIcon />,
    adminOnly: true
  },
  {
    title: 'OJT / CIC',
    path: '/ojt',
    icon: <StarIcon />,
    adminOnly: true
  },
  {
    title: 'Asignación Excepciones',
    path: '/excepciones',
    icon: <ScheduleIcon />,
    adminOnly: true
  }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [adminMenuOpen, setAdminMenuOpen] = useState(true);

  // Verificar si el usuario es administrador
  const isAdmin = user?.role === 'admin' || 
                  user?.role === 'analista' || 
                  user?.role === 'coordinador' || 
                  user?.role === 'supervisor' || 
                  user?.role === 'jefe' || 
                  user?.role === 'creador';

  // Verificar si el usuario es analista (para reporte de asistencias)
  const isAnalista = user?.role === 'analista';

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const toggleAdminMenu = () => {
    // Navegar al Dashboard (sistema de gestión de empleados) y abrir/cerrar submenú
    handleNavigation('/');
    setAdminMenuOpen(!adminMenuOpen);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 70,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 70,
          boxSizing: 'border-box',
          backgroundColor: '#ffffff', // Fondo blanco puro
          color: '#374151', // Texto gris oscuro
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          borderRight: '2px solid #cbd5e1', // Borde más grueso y oscuro
          boxShadow: '4px 0 12px rgba(0, 0, 0, 0.15)' // Sombra más pronunciada
        },
      }}
    >
      {/* Header del sidebar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          p: 2,
          minHeight: 64,
          borderBottom: '1px solid #f3f4f6',
          backgroundColor: '#f8fafc' // Fondo gris más claro para contraste con el contenido
        }}
      >
        {open && (
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
            Sistema de Gestión
          </Typography>
        )}
        <IconButton
          onClick={toggleDrawer}
          sx={{ color: '#6b7280' }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Información del usuario */}
      {open && (
        <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', backgroundColor: '#f1f5f9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccountCircleIcon sx={{ mr: 1, color: '#6b7280' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 500, color: '#111827' }}>
              {user?.nombres && user?.apellidoPaterno && user?.apellidoMaterno
                ? `${user.nombres.split(' ')[0]} ${user.apellidoPaterno} ${user.apellidoMaterno}` 
                : user?.nombres && user?.apellidoPaterno
                  ? `${user.nombres} ${user.apellidoPaterno}`
                  : 'Usuario'}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#6b7280' }}>
            {isAdmin ? 'Administrador' : 'Usuario'}
          </Typography>
        </Box>
      )}

      {/* Navegación principal */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {/* Dashboard siempre visible */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/')}
            selected={location.pathname === '/'}
            sx={{
              mx: 1,
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: '#f3f4f6',
                '&:hover': {
                  backgroundColor: '#e5e7eb',
                },
              },
              '&:hover': {
                backgroundColor: '#f9fafb',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#6b7280', minWidth: open ? 40 : 'auto' }}>
              <DashboardIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Dashboard" />}
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 1, borderColor: '#f3f4f6' }} />

        {/* Sección de administración - Incluye Dashboard y todas las funciones administrativas */}
        {isAdmin && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={toggleAdminMenu}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#6b7280', minWidth: open ? 40 : 'auto' }}>
                  <AssessmentIcon />
                </ListItemIcon>
                {open && (
                  <>
                    <ListItemText primary="Administración" />
                    {adminMenuOpen ? <ExpandLess /> : <ExpandMore />}
                  </>
                )}
              </ListItemButton>
            </ListItem>

            <Collapse in={adminMenuOpen && open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {menuItems.slice(1).map((item) => (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      selected={location.pathname === item.path}
                      sx={{
                        pl: 4,
                        mx: 1,
                        borderRadius: 1,
                        '&.Mui-selected': {
                          backgroundColor: '#f3f4f6',
                          '&:hover': {
                            backgroundColor: '#e5e7eb',
                          },
                        },
                        '&:hover': {
                          backgroundColor: '#f9fafb',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: '#6b7280', minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.title} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Reporte de Asistencias - Solo para analistas y creador */}
        {(isAnalista || user?.dni === '73766815') && (
          <>
            <Divider sx={{ my: 1, borderColor: '#f3f4f6' }} />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation('/reporte-asistencias')}
                selected={location.pathname === '/reporte-asistencias'}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  backgroundColor: '#f0f9ff', // Fondo azul muy claro
                  border: '1px solid #bae6fd', // Borde azul claro
                  '&:hover': {
                    backgroundColor: '#e0f2fe',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#bae6fd',
                    '&:hover': {
                      backgroundColor: '#7dd3fc',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#0369a1', minWidth: open ? 40 : 'auto' }}>
                  <TableChartIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Reporte de Asistencias" sx={{ color: '#0369a1', fontWeight: 600 }} />}
              </ListItemButton>
            </ListItem>
            
            {/* Reporte de Tardanzas */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation('/reporte-tardanzas')}
                selected={location.pathname === '/reporte-tardanzas'}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  backgroundColor: '#fef2f2', // Fondo rojo muy claro
                  border: '1px solid #fecaca', // Borde rojo claro
                  '&:hover': {
                    backgroundColor: '#fee2e2',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#fecaca',
                    '&:hover': {
                      backgroundColor: '#fca5a5',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#dc2626', minWidth: open ? 40 : 'auto' }}>
                  <ScheduleIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Reporte de Tardanzas" sx={{ color: '#dc2626', fontWeight: 600 }} />}
              </ListItemButton>
            </ListItem>
          </>
        )}

        {/* Control Maestro - Solo para el creador y analistas - AL FINAL */}
        {(user?.dni === '73766815' || user?.role === 'analista') && (
          <>
            <Divider sx={{ my: 1, borderColor: '#f3f4f6' }} />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation('/control-maestro')}
                selected={location.pathname === '/control-maestro'}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  backgroundColor: '#fef2f2', // Fondo rojo muy claro
                  border: '1px solid #fecaca', // Borde rojo claro
                  '&:hover': {
                    backgroundColor: '#fee2e2',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#fecaca',
                    '&:hover': {
                      backgroundColor: '#fca5a5',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#dc2626', minWidth: open ? 40 : 'auto' }}>
                  <SecurityIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Control Maestro" sx={{ color: '#dc2626', fontWeight: 600 }} />}
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>

      {/* Botón de cerrar sesión */}
      <Box sx={{ p: 2, borderTop: '1px solid #f3f4f6', backgroundColor: '#f8fafc' }}>
        <Tooltip title={open ? '' : 'Cerrar Sesión'} placement="right">
          <IconButton
            onClick={handleLogout}
            sx={{
              color: '#6b7280',
              width: open ? '100%' : 'auto',
              justifyContent: open ? 'flex-start' : 'center',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
            }}
          >
            <LogoutIcon sx={{ mr: open ? 2 : 0 }} />
            {open && <Typography sx={{ color: '#374151' }}>Cerrar Sesión</Typography>}
          </IconButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
