import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Zoom
} from '@mui/material';
import {
  Business as BusinessIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { api } from '../utils/capacitaciones/api';
import partnerLogo from '../assets/partner.svg';

const OrganigramaFullscreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Estados principales
  const [organigramaData, setOrganigramaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
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
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Cargando organigrama...');
      
      const response = await api('/organigrama?estado=Activo');
      console.log('📂 Respuesta del organigrama:', response);
      
      if (response.success && response.data && response.data.organigrama) {
        setOrganigramaData(response.data.organigrama);
        console.log('✅ Organigrama cargado:', response.data.organigrama);
      } else {
        throw new Error('Estructura de datos incorrecta');
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
      const response = await api(`/organigrama/expandir?dni=${dni}&estado=Activo`);
      
      if (response.success && response.data && response.data.subordinados) {
        return response.data.subordinados;
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ Error expandiendo nodo:', error);
      return [];
    }
  }, []);

  const handleNodeClick = async (node) => {
    console.log('🖱️ Click en nodo:', node.name, 'DNI:', node.dni);
    
    // Si el nodo ya está expandido y tiene hijos, colapsarlo
    if (expandedNodes.has(node.dni) && node.children && node.children.length > 0) {
      console.log('🔄 Colapsando nodo:', node.name);
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(node.dni);
        return newSet;
      });
      
      // Remover hijos del nodo
      setOrganigramaData(prev => {
        const removeChildren = (data) => {
          if (data.dni === node.dni) {
            return { ...data, children: [] };
          }
          if (data.children) {
            return { ...data, children: data.children.map(removeChildren) };
          }
          return data;
        };
        return removeChildren(prev);
      });
      return;
    }
    
    // Si el nodo no está expandido y es expandible, expandirlo
    if (!expandedNodes.has(node.dni) && node.expandible) {
      console.log('🔄 Expandiendo nodo:', node.name);
      
      // Marcar como expandido
      setExpandedNodes(prev => new Set([...prev, node.dni]));
      
      // Cargar subordinados
      const subordinados = await expandirNodo(node.dni);
      console.log('📂 Subordinados recibidos:', subordinados);
      
      if (subordinados && subordinados.length > 0) {
        // Agregar hijos al nodo
        setOrganigramaData(prev => {
          const addChildren = (data) => {
            if (data.dni === node.dni) {
              return { ...data, children: subordinados };
            }
            if (data.children) {
              return { ...data, children: data.children.map(addChildren) };
            }
            return data;
          };
          return addChildren(prev);
        });
      } else {
        // Si no hay subordinados, remover de expandedNodes
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(node.dni);
          return newSet;
        });
      }
    }
  };

  const handleNodeDoubleClick = (node) => {
    setSelectedEmployee(node);
    setModalOpen(true);
  };

  // Funciones de zoom y pan
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
  }, []);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Funciones de utilidad
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

  // Simplificado: sin cálculo de layout complejo

  // Función para renderizar nodos con posicionamiento clásico
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
          width: 280,
          height: 280, // Aumentado de 200 a 280
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        {/* Nodo del empleado */}
        <Paper
          elevation={12}
          sx={{
            p: 2.5,
            borderRadius: 5,
            width: 260,
            height: 240, // Aumentado de 160 a 240
            background: `linear-gradient(135deg, ${areaColor} 0%, ${areaColor}E6 100%)`,
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'scale(1)',
            position: 'relative',
            overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.15)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)`,
            backdropFilter: 'blur(10px)',
            '&:hover': {
              transform: 'scale(1.05) translateY(-2px)',
              boxShadow: `0 16px 48px rgba(0,0,0,0.25), 0 0 0 2px rgba(255,255,255,0.2)`,
              border: '3px solid rgba(255,255,255,0.3)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            }
          }}
          onClick={() => handleNodeClick(node)}
          onDoubleClick={() => handleNodeDoubleClick(node)}
        >
          {/* Avatar con icono de nivel */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5, position: 'relative' }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                border: '2px solid rgba(255,255,255,0.4)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(5px)'
              }}
            >
              {getIniciales(node.name)}
            </Avatar>
            
            {/* Icono de nivel */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -6,
                right: -6,
                bgcolor: 'white',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: areaColor,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              {level === 0 ? <BusinessIcon sx={{ fontSize: 14 }} /> :
               level === 1 ? <SupervisorAccountIcon sx={{ fontSize: 14 }} /> :
               level === 2 ? <PersonIcon sx={{ fontSize: 14 }} /> :
               <WorkIcon sx={{ fontSize: 14 }} />}
            </Box>
          </Box>
          
          {/* Nombre */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: '700',
              textAlign: 'center',
              mb: 0.5,
              fontSize: level === 0 ? '1.1rem' : '1rem',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              lineHeight: 1.2,
              letterSpacing: '0.02em'
            }}
          >
            {node.name && node.name.length > 16 ? node.name.substring(0, 16) + '...' : (node.name || 'Sin nombre')}
          </Typography>
          
          {/* Cargo */}
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mb: 1,
              opacity: 0.9,
              fontSize: '0.85rem',
              fontWeight: '400',
              letterSpacing: '0.01em'
            }}
          >
            {node.cargo && node.cargo.length > 18 ? node.cargo.substring(0, 18) + '...' : (node.cargo || 'Sin cargo')}
          </Typography>
          
          {/* Área */}
          <Chip
            label={node.area || 'Sin área'}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.75rem',
              height: '24px',
              border: '1px solid rgba(255,255,255,0.25)',
              mb: 1.5,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          />
          
          {/* Información adicional */}
          <Box sx={{ textAlign: 'center', width: '100%', px: 1 }}>
            {/* Fecha de Contratación */}
            {node.fechaContratacion && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontSize: '0.7rem',
                  opacity: 0.85,
                  mb: 0.5,
                  fontWeight: '500'
                }}
              >
                📅 Ingreso: {new Date(node.fechaContratacion).toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Typography>
            )}
            
            {/* ID de Campaña */}
            {node.campaniaId && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontSize: '0.7rem',
                  opacity: 0.85,
                  mb: 0.5,
                  fontWeight: '500'
                }}
              >
                🏢 Campaña: {node.campaniaId}
              </Typography>
            )}
            
            {/* ID de Cargo */}
            {node.cargoId && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontSize: '0.7rem',
                  opacity: 0.85,
                  fontWeight: '500'
                }}
              >
                💼 Cargo ID: {node.cargoId}
              </Typography>
            )}
          </Box>
          
          {/* Indicador de expansión/colapso */}
          {(canExpand || hasChildren) && (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: 'white',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: areaColor,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#f8f9fa',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }
              }}
              title={hasChildren ? "Click para colapsar" : "Click para expandir"}
            >
              {hasChildren ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
            </Box>
          )}
          
          {/* Contador de subordinados */}
          {hasChildren && (
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                bgcolor: 'white',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: areaColor,
                fontWeight: 'bold',
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0,0,0,0.05)'
              }}
            >
              {node.children.length}
            </Box>
          )}
        </Paper>
        
        {/* Líneas conectoras simples */}
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
            {/* Línea vertical desde el nodo padre */}
            <Box
              sx={{
                position: 'absolute',
                top: '240px', // Desde el final de la tarjeta padre
                left: '50%',
                transform: 'translateX(-50%)',
                width: '3px',
                height: '80px', // Hasta la línea horizontal
                bgcolor: areaColor,
                opacity: 0.8,
                borderRadius: '2px'
              }}
            />
            
            {/* Línea horizontal */}
            <Box
              sx={{
                position: 'absolute',
                top: '320px', // Línea horizontal intermedia
                left: '50%',
                transform: 'translateX(-50%)',
                width: `${(node.children.length - 1) * 320}px`,
                height: '3px',
                bgcolor: areaColor,
                opacity: 0.8,
                borderRadius: '2px'
              }}
            />
            
            {/* Líneas verticales a hijos */}
            {node.children.map((child, index) => {
              const childX = (index - (node.children.length - 1) / 2) * 320;
              return (
                <Box
                  key={`line-${child.dni}`}
                  sx={{
                    position: 'absolute',
                    top: '320px', // Desde la línea horizontal
                    left: `calc(50% + ${childX}px)`,
                    transform: 'translateX(-50%)',
                    width: '3px',
                    height: '80px', // Hasta el inicio de las tarjetas hijas
                    bgcolor: areaColor,
                    opacity: 0.8,
                    borderRadius: '2px'
                  }}
                />
              );
            })}
          </Box>
        )}
        
        {/* Nodos hijos con posicionamiento clásico */}
        {hasChildren && node.children.map((child, index) => {
          const childX = (index - (node.children.length - 1) / 2) * 320 - 140; // Centrar la tarjeta (280/2 = 140)
          const childY = 400; // Aumentado de 320 a 400 para acomodar tarjetas más altas
          return (
            <Box key={child.dni} sx={{ position: 'absolute', zIndex: 2 }}>
              {renderNode(child, level + 1, childX, childY)}
            </Box>
          );
        })}
      </Box>
    );
  }, [getAreaColor, getIniciales, handleNodeClick, handleNodeDoubleClick, expandedNodes]);

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#e5e7eb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#297373] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#297373] text-lg">Cargando organigrama...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#e5e7eb] flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-2xl font-bold text-red-800 mb-4">❌ Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={cargarOrganigrama}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#e5e7eb] flex flex-col p-0 m-0 z-50">
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      {/* Header */}
      <div className="flex items-center px-6 py-4 bg-white shadow-md rounded-b-3xl mb-4 relative" style={{ minHeight: 120 }}>
        {/* Logo y Saludo - Izquierda */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 bg-[#297373]/20 rounded-full p-2 flex items-center justify-center">
            <img src={partnerLogo} alt="Logo" className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-col">
              <span className="text-base text-gray-600">
                Hola, bienvenido
              </span>
              <span className="font-semibold text-black text-xl flex items-center gap-2">
                {user?.nombres || user?.nombre || 'Usuario'} {user?.apellidoPaterno || ''} {user?.apellidoMaterno || ''}
                <span className="text-2xl">👋</span>
              </span>
            </div>
          </div>
        </div>

        {/* Título - Centro */}
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-3xl font-bold text-[#297373] flex items-center gap-3">
            <BusinessIcon sx={{ fontSize: 40 }} />
            Organigrama Empresarial
          </h1>
        </div>

        {/* Controles - Derecha */}
        <div className="flex items-center gap-3">
          <Button
            variant="contained"
            onClick={resetView}
            startIcon={<RefreshIcon />}
            sx={{
              bgcolor: '#297373',
              '&:hover': { bgcolor: '#297373' },
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Recargar
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: '#297373',
              '&:hover': { bgcolor: '#297373' },
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            ← Volver al Dashboard
          </Button>
        </div>
      </div>

      {/* Contenido del organigrama */}
      <div className="flex-1 w-full overflow-hidden bg-[#e5e7eb] relative">
        {/* Controles de zoom y navegación */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
          {/* Botón Volver al Perfil */}
          <Button
            variant="contained"
            onClick={() => navigate('/employee-profile')}
            startIcon={<AccountCircleIcon />}
            sx={{
              bgcolor: '#9C27B0',
              '&:hover': { bgcolor: '#7B1FA2' },
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              px: 2,
              py: 1,
              minWidth: 'auto'
            }}
          >
            Perfil
          </Button>
          
          {/* Controles de zoom */}
          <Button
            variant="contained"
            onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}
            sx={{ minWidth: 40, height: 40, borderRadius: '50%' }}
          >
            <ZoomInIcon />
          </Button>
          <Button
            variant="contained"
            onClick={() => setZoom(prev => Math.max(prev * 0.8, 0.1))}
            sx={{ minWidth: 40, height: 40, borderRadius: '50%' }}
          >
            <ZoomOutIcon />
          </Button>
          <div className="bg-white px-2 py-1 rounded text-sm text-center">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Contenedor del organigrama con zoom y pan */}
        <div
          className="w-full h-full overflow-hidden cursor-grab"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Contenedor del árbol */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              width: '100%',
              height: '100%',
              position: 'relative'
            }}
          >
            {organigramaData && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
                {renderNode(organigramaData, 0, -140, 0)}
              </div>
            )}
          </div>
        </div>
      </div>

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
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            Detalles del Empleado
          </Typography>
          <IconButton onClick={() => setModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: getAreaColor(selectedEmployee.area),
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    mr: 3
                  }}
                >
                  {getIniciales(selectedEmployee.name)}
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {selectedEmployee.name || 'Sin nombre'}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {selectedEmployee.cargo || 'Sin cargo'}
                  </Typography>
                  <Chip
                    label={selectedEmployee.area || 'Sin área'}
                    sx={{
                      bgcolor: getAreaColor(selectedEmployee.area),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    DNI:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedEmployee.dni || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nivel:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedEmployee.nivel || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OrganigramaFullscreen;
