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
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <DashboardIcon />,
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

  // Por ahora, asumimos que todos los usuarios son administradores
  // Esto se puede cambiar más adelante cuando implementemos el control de acceso
  const isAdmin = true; // user?.role === 'admin' || user?.isAdmin

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
          backgroundColor: '#1e293b', // Gris muy oscuro para headers
          color: 'white',
          transition: 'width 0.3s ease',
          overflowX: 'hidden'
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {open && (
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Sistema de Gestión
          </Typography>
        )}
        <IconButton
          onClick={toggleDrawer}
          sx={{ color: 'white' }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Información del usuario */}
      {open && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccountCircleIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              {user?.nombre || 'Usuario'}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
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
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: open ? 40 : 'auto' }}>
              <DashboardIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Dashboard" />}
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Sección de administración */}
        {isAdmin && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={toggleAdminMenu}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: open ? 40 : 'auto' }}>
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
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          },
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
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
      </List>

      {/* Botón de cerrar sesión */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Tooltip title={open ? '' : 'Cerrar Sesión'} placement="right">
          <IconButton
            onClick={handleLogout}
            sx={{
              color: 'white',
              width: open ? '100%' : 'auto',
              justifyContent: open ? 'flex-start' : 'center',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <LogoutIcon sx={{ mr: open ? 2 : 0 }} />
            {open && <Typography>Cerrar Sesión</Typography>}
          </IconButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
