import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  Fade,
  Zoom,
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountTree as AccountTreeIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Work as WorkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const Organigrama = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [organigramaData, setOrganigramaData] = useState(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  // Estados para zoom y pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Cargar organigrama inicial
  useEffect(() => {
    cargarOrganigrama();
  }, []);

  const cargarOrganigrama = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🚀 Cargando organigrama...');
      const response = await api.get('/organigrama?estado=Activo');
      console.log('📊 Respuesta completa:', response.data);
      
      if (response.data.success && response.data.data && response.data.data.organigrama) {
        console.log('✅ Datos del organigrama encontrados:', response.data.data.organigrama);
        setOrganigramaData(response.data.data.organigrama);
      } else {
        console.error('❌ Estructura de datos incorrecta:', response.data);
        setError('Estructura de datos incorrecta del servidor');
      }
    } catch (error) {
      console.error('❌ Error cargando organigrama:', error);
      setError('Error de conexión al cargar organigrama');
    } finally {
      setLoading(false);
    }
  };

  const expandirNodo = useCallback(async (dni) => {
    try {
      const response = await api.get(`/organigrama/expandir?dni=${dni}&estado=Activo`);
      
      if (response.data.success && response.data.data && response.data.data.subordinados) {
        return response.data.data.subordinados;
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ Error expandiendo nodo:', error);
      return [];
    }
  }, [api]);

  const handleNodeClick = async (node) => {
    console.log('🖱️ Click en nodo:', node.name, 'DNI:', node.dni);
    
    // Si el nodo ya está expandido y tiene hijos, colapsarlo
    if (expandedNodes.has(node.dni) && node.children && node.children.length > 0) {
      console.log('🔄 Colapsando nodo:', node.name);
      
      const actualizarNodo = (nodos) => {
        return nodos.map(nodo => {
          if (nodo.dni === node.dni) {
            return {
              ...nodo,
              children: [],
              expandible: true
            };
          }
          if (nodo.children) {
            return {
              ...nodo,
              children: actualizarNodo(nodo.children)
            };
          }
          return nodo;
        });
      };
      
      setOrganigramaData(prevData => ({
        ...prevData,
        children: actualizarNodo(prevData.children)
      }));
      
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(node.dni);
        return newSet;
      });
      
      return;
    }
    
    // Si el nodo ya está expandido pero no tiene hijos, intentar expandir de nuevo
    if (expandedNodes.has(node.dni) && (!node.children || node.children.length === 0)) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(node.dni);
        return newSet;
      });
    }
    
    if (node.expandible && (!node.children || node.children.length === 0) && !expandedNodes.has(node.dni)) {
      console.log('🔄 Expandiendo nodo:', node.name);
      
      try {
        const subordinados = await expandirNodo(node.dni);
        
        if (subordinados && subordinados.length > 0) {
          const actualizarNodo = (nodos) => {
            return nodos.map(nodo => {
              if (nodo.dni === node.dni) {
                return {
                  ...nodo,
                  children: subordinados,
                  expandible: false
                };
              }
              if (nodo.children) {
                return {
                  ...nodo,
                  children: actualizarNodo(nodo.children)
                };
              }
              return nodo;
            });
          };
          
          setOrganigramaData(prevData => ({
            ...prevData,
            children: actualizarNodo(prevData.children)
          }));
          
          setExpandedNodes(prev => new Set([...prev, node.dni]));
        }
      } catch (error) {
        console.error('❌ Error expandiendo nodo:', error);
      }
    }
  };

  const handleNodeDoubleClick = (node) => {
    setEmpleadoSeleccionado(node);
    setModalOpen(true);
  };

  // Funciones para zoom y pan
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 0.1), 3);
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) { // Solo botón izquierdo
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getAreaColor = useCallback((area) => {
    const colors = {
      'Call Center': '#2196F3',
      'Ventas': '#4CAF50',
      'Soporte': '#FF9800',
      'Administración': '#9C27B0',
      'Recursos Humanos': '#F44336',
      'Tecnología': '#607D8B',
      'Marketing': '#E91E63',
      'Finanzas': '#795548',
      'ATC': '#E91E63',
      'OUTBOUND': '#4CAF50',
      'CALIDAD': '#FF9800',
      'OPERACIONES': '#2196F3'
    };
    return colors[area] || '#757575';
  }, []);

  const getNivelIcon = useCallback((nivel) => {
    switch (nivel) {
      case 0: return <BusinessIcon />;
      case 1: return <SupervisorAccountIcon />;
      case 2: return <PersonIcon />;
      case 3: return <WorkIcon />;
      default: return <PersonIcon />;
    }
  }, []);

  const getNivelSize = useCallback((nivel) => {
    switch (nivel) {
      case 0: return 80;
      case 1: return 70;
      case 2: return 60;
      case 3: return 50;
      default: return 50;
    }
  }, []);

  const getIniciales = useCallback((nombre) => {
    if (!nombre || typeof nombre !== 'string') {
      return '??';
    }
    return nombre
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  // Función para calcular posiciones de nodos en forma de árbol
  const calculateTreePositions = (node, level = 0, x = 0, y = 0) => {
    const nodeWidth = 220; // Ancho de cada nodo (reducido)
    const nodeHeight = 160; // Altura de cada nodo (reducida)
    const levelHeight = 250; // Espacio vertical entre niveles (reducido)
    const siblingGap = 280; // Espacio horizontal entre hermanos (reducido)
    
    const positions = {
      ...node,
      x: x,
      y: y,
      width: nodeWidth,
      height: nodeHeight
    };
    
    if (node.children && node.children.length > 0) {
      const childrenCount = node.children.length;
      const totalWidth = (childrenCount - 1) * siblingGap;
      const startX = x - totalWidth / 2;
      
      positions.children = node.children.map((child, index) => {
        const childX = startX + index * siblingGap;
        const childY = y + levelHeight;
        return calculateTreePositions(child, level + 1, childX, childY);
      });
    }
    
    return positions;
  };

  const renderNode = useCallback((node, level = 0, x = 0, y = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = node.expandible && !hasChildren;
    const areaColor = getAreaColor(node.area);
    
    return (
      <Box
        key={node.dni}
        sx={{
          position: 'absolute',
          left: x,
          top: y,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 220,
          height: 160
        }}
      >
        {/* Nodo del empleado - VERSIÓN SIMPLIFICADA */}
        <Paper
          elevation={8}
          sx={{
            p: 2,
            borderRadius: 4,
            width: 220,
            background: `linear-gradient(135deg, ${areaColor} 0%, ${areaColor}CC 100%)`,
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
          onClick={() => handleNodeClick(node)}
          onDoubleClick={() => handleNodeDoubleClick(node)}
        >
          {/* Avatar simple */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: 'rgba(255,255,255,0.25)',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              {getIniciales(node.name)}
            </Avatar>
          </Box>
          
          {/* Nombre */}
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 1,
              fontSize: '0.9rem'
            }}
          >
            {node.name && node.name.length > 15 ? node.name.substring(0, 15) + '...' : (node.name || 'Sin nombre')}
          </Typography>
          
          {/* Cargo */}
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mb: 1,
              fontSize: '0.8rem',
              opacity: 0.9
            }}
          >
            {node.cargo && node.cargo.length > 20 ? node.cargo.substring(0, 20) + '...' : (node.cargo || 'Sin cargo')}
          </Typography>
          
          {/* Área */}
          <Chip
            label={node.area || 'Sin área'}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.25)',
              color: 'white',
              fontSize: '0.7rem'
            }}
          />
          
          {/* Indicador simple */}
          {(canExpand || hasChildren) && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: areaColor,
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}
            >
              {hasChildren ? node.children.length : '+'}
            </Box>
          )}
          </Paper>
        
        {/* Líneas conectoras simplificadas */}
        {hasChildren && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            {/* Línea vertical */}
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '2px',
                height: '90px',
                bgcolor: areaColor,
                opacity: 0.7
              }}
            />
            
            {/* Línea horizontal */}
            <Box
              sx={{
                position: 'absolute',
                top: '160px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: `${(node.children.length - 1) * 280}px`,
                height: '2px',
                bgcolor: areaColor,
                opacity: 0.7
              }}
            />
            
            {/* Líneas verticales a hijos */}
            {node.children.map((child, index) => {
              const childX = (index - (node.children.length - 1) / 2) * 280;
              return (
                <Box
                  key={`line-${child.dni}`}
                  sx={{
                    position: 'absolute',
                    top: '160px',
                    left: `calc(50% + ${childX}px)`,
                    transform: 'translateX(-50%)',
                    width: '2px',
                    height: '90px',
                    bgcolor: areaColor,
                    opacity: 0.7
                  }}
                />
              );
            })}
          </Box>
        )}
        
        {/* Nodos hijos */}
        {hasChildren && node.children.map((child, index) => {
          const childX = (index - (node.children.length - 1) / 2) * 280;
          const childY = 250;
          return (
            <Box key={child.dni} sx={{ position: 'absolute', zIndex: 2 }}>
              {renderNode(child, level + 1, childX, childY)}
            </Box>
          );
        })}
      </Box>
    );
  }, [getAreaColor, getIniciales, getNivelSize, handleNodeClick, handleNodeDoubleClick]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: '#f8f9fa'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={80} sx={{ color: '#2196F3', mb: 3 }} />
          <Typography variant="h5" color="text.secondary" fontWeight="500">
            Cargando organigrama...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: '#f8f9fa'
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600, fontSize: '1.1rem' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        width: 'calc(100vw - 240px)', // Ancho real disponible (100vw - sidebar)
        marginLeft: '240px', // Espacio del sidebar
        bgcolor: '#f8f9fa',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Header mejorado */}
      <Paper
        elevation={4}
        sx={{
          p: 3,
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{ 
                bgcolor: '#f5f5f5', 
                '&:hover': { bgcolor: '#e0e0e0' } 
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <AccountTreeIcon sx={{ color: '#2196F3', fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              Organigrama de la Empresa
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => {
              setExpandedNodes(new Set());
              resetView();
              cargarOrganigrama();
            }}
            sx={{ 
              px: 3, 
              py: 1.5,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Recargar
          </Button>
        </Box>
      </Paper>

      {/* Contenido del organigrama con zoom y pan */}
      <Box
        sx={{
          height: 'calc(100vh - 100px)',
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Controles de zoom */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Button
            variant="contained"
            onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}
            sx={{ minWidth: 40, height: 40, borderRadius: '50%' }}
          >
            +
          </Button>
          <Button
            variant="contained"
            onClick={() => setZoom(prev => Math.max(prev * 0.8, 0.1))}
            sx={{ minWidth: 40, height: 40, borderRadius: '50%' }}
          >
            -
          </Button>
          <Button
            variant="outlined"
            onClick={resetView}
            sx={{ minWidth: 40, height: 40, borderRadius: '50%', fontSize: '0.8rem' }}
          >
            ⌂
          </Button>
        </Box>

        {/* Indicador de zoom */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 1000,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 2,
            fontSize: '0.9rem'
          }}
        >
          Zoom: {Math.round(zoom * 100)}%
        </Box>

        {/* Contenedor del organigrama con transformaciones */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            width: '100%',
            height: '100%'
          }}
        >
          {organigramaData && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%'
              }}
            >
              {renderNode(organigramaData, 0, 0, 0)}
            </Box>
          )}
        </Box>
      </Box>

      {/* Modal de detalles del empleado */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold">Detalles del Empleado</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {empleadoSeleccionado && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 140,
                      height: 140,
                      bgcolor: getAreaColor(empleadoSeleccionado.area),
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                    }}
                  >
                    {getIniciales(empleadoSeleccionado.name)}
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {empleadoSeleccionado.name || 'Sin nombre'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Card elevation={8} sx={{ borderRadius: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
                      Información del Empleado
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          DNI:
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {empleadoSeleccionado.dni || 'Sin DNI'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Cargo:
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {empleadoSeleccionado.cargo || 'Sin cargo'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Área:
                        </Typography>
                        <Chip
                          label={empleadoSeleccionado.area || 'Sin área'}
                          sx={{
                            bgcolor: getAreaColor(empleadoSeleccionado.area || 'Sin área'),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            px: 2,
                            py: 1
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Nivel:
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {empleadoSeleccionado.nivel || 'Sin nivel'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setModalOpen(false)}
            variant="contained"
            sx={{ px: 4, py: 1.5, borderRadius: 3 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Estilos CSS para animaciones */}
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </Box>
  );
};

export default Organigrama;