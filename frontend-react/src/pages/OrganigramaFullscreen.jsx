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
  Refresh as RefreshIcon
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
  const [isInteracting, setIsInteracting] = useState(false); // Para optimizar durante interacciones
  const [isInitialized, setIsInitialized] = useState(false); // Para controlar centrado inicial

  // Cargar organigrama inicial
  useEffect(() => {
    cargarOrganigrama();
  }, []);

  // Centrar organigrama cuando se carga por primera vez
  useEffect(() => {
    if (organigramaData && !isInitialized) {
      console.log('🎯 Centrando organigrama en pantalla...');
      
      // Calcular el centro de la pantalla
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Posición inicial del nodo raíz (está en -140, 0)
      const rootNodeX = -100; // Offset que usamos en renderNode inicial
      const rootNodeY = 230;
      
      // Calcular el offset necesario para centrar
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;
      
      // El nodo raíz debería estar en el centro, así que calculamos el pan necesario
      const initialPan = {
        x: centerX - rootNodeX - 140, // 140 es la mitad del ancho de la tarjeta (280/2)
        y: centerY - rootNodeY - 140  // 140 es aproximadamente la mitad de la altura de la tarjeta
      };
      
      console.log('📍 Posición inicial calculada:', initialPan);
      setPan(initialPan);
      setIsInitialized(true);
    }
  }, [organigramaData, isInitialized]);

  const cargarOrganigrama = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsInitialized(false); // Reset para permitir recentrado
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
    console.log('🔍 Debug - Estado del nodo:', {
      dni: node.dni,
      expandible: node.expandible,
      hasChildren: node.children && node.children.length > 0,
      isExpanded: expandedNodes.has(node.dni),
      childrenCount: node.children ? node.children.length : 0
    });
    
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
      console.log('✅ Condiciones cumplidas: no expandido y es expandible');
      
      // NUEVA LÓGICA: Colapsar hermanos antes de expandir
      const findAndCollapseHermanos = (data, targetDni) => {
        if (!data) return data;
        
        // Si este nodo tiene hijos, revisar si alguno es nuestro target
        if (data.children && data.children.length > 0) {
          const hasTargetChild = data.children.some(child => child.dni === targetDni);
          
          if (hasTargetChild) {
            // Este es el padre del nodo target, colapsar otros hijos expandidos
            console.log('👨‍👩‍👧‍👦 Encontrado padre de', node.name, ':', data.name);
            
            const updatedChildren = data.children.map(child => {
              if (child.dni === targetDni) {
                // Este es el nodo que queremos expandir, lo dejamos como está
                return child;
              } else if (expandedNodes.has(child.dni) && child.children && child.children.length > 0) {
                // Este es un hermano expandido, lo colapsamos
                console.log('🔄 Colapsando hermano:', child.name, 'DNI:', child.dni);
                setExpandedNodes(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(child.dni);
                  return newSet;
                });
                return { ...child, children: [] };
              }
              return child;
            });
            
            return { ...data, children: updatedChildren };
          }
        }
        
        // Recursivamente buscar en los hijos
        if (data.children) {
          return {
            ...data,
            children: data.children.map(child => findAndCollapseHermanos(child, targetDni))
          };
        }
        
        return data;
      };
      
      // Colapsar hermanos antes de expandir
      setOrganigramaData(prev => findAndCollapseHermanos(prev, node.dni));
      
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
    } else {
      console.log('❌ No se puede expandir el nodo:', {
        name: node.name,
        dni: node.dni,
        expandible: node.expandible,
        isExpanded: expandedNodes.has(node.dni),
        reason: !node.expandible ? 'No es expandible' : 'Ya está expandido'
      });
    }
  };

  const handleNodeDoubleClick = (node) => {
    setSelectedEmployee(node);
    setModalOpen(true);
  };

  // Funciones de zoom y pan
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setIsInteracting(true);
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
    
    // Resetear interacción después de un delay más corto
    setTimeout(() => setIsInteracting(false), 50);
  }, []);

  const handleMouseDown = useCallback((e) => {
    // Solo activar si no es un click en un nodo (evitar interferencia con expansión)
    if (e.target.closest('[data-node-clickable]')) {
      return;
    }
    
    setIsDragging(true);
    setIsInteracting(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  // Throttle para optimizar el movimiento del mouse
  const throttledMouseMove = useCallback((e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      // Usar requestAnimationFrame para suavizar el movimiento
      requestAnimationFrame(() => throttledMouseMove(e));
    }
  }, [isDragging, throttledMouseMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setTimeout(() => setIsInteracting(false), 30);
  }, []);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Funciones de utilidad
  const getAreaColor = (area) => {
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
      'CAPACITACION': '#9C27B0',
      'MONITOREO': '#3F51B5',
      'OPERACIONES': '#2196F3'
    };
    return colors[area] || '#757575';
  };

  const getIniciales = (nombre) => {
    if (!nombre || typeof nombre !== 'string') {
      return '??';
    }
    return nombre
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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
          height: 280, // Aumentado de 250 a 280 para mostrar toda la información
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        {/* Nodo del empleado */}
        <Paper
          data-node-clickable="true"
          elevation={isInteracting ? 1 : 3} // Reducir elevation durante interacciones
          sx={{
            p: 2,
            borderRadius: isInteracting ? 2 : 3, // Reducir borderRadius durante interacciones
            width: 260,
            height: 240,
            backgroundColor: areaColor,
            color: 'white',
            cursor: 'pointer',
            position: 'relative',
            border: '2px solid rgba(255,255,255,0.2)',
          }}
          onClick={() => handleNodeClick(node)}
          onDoubleClick={() => handleNodeDoubleClick(node)}
        >
          {/* Avatar simplificado */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Avatar
              sx={{
                width: 52, // Aumentado de 44 a 52
                height: 52, // Aumentado de 44 a 52
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '1.2rem', // Aumentado de 1rem a 1.2rem
                fontWeight: 'bold'
              }}
            >
              {getIniciales(node.name)}
            </Avatar>
          </Box>
          
          {/* Nombre */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: '600',
              textAlign: 'center',
              mb: 0.5,
              fontSize: '1.1rem', // Aumentado de 0.95rem a 1.1rem
              lineHeight: 1.2
            }}
          >
            {node.name && node.name.length > 14 ? node.name.substring(0, 14) + '...' : (node.name || 'Sin nombre')}
          </Typography>
          
          {/* Cargo */}
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mb: 1,
              opacity: 0.9,
              fontSize: '0.95rem', // Aumentado de 0.8rem a 0.95rem
              fontWeight: '500' // Aumentado de 400 a 500
            }}
          >
            {node.cargo && node.cargo.length > 16 ? node.cargo.substring(0, 16) + '...' : (node.cargo || 'Sin cargo')}
          </Typography>
          
          {/* Información adicional simplificada */}
          <Box sx={{ 
            textAlign: 'center', 
            width: '100%', 
            px: 1,
            py: 0.5,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 1
          }}>            
            {/* Fecha de Contratación */}
            {node.fechaContratacion && (
              <Typography
                variant="body2"
                sx={{
                  display: 'block',
                  fontSize: '0.9rem', // Aumentado de 0.8rem a 0.9rem
                  opacity: 0.95,
                  mb: 0.5, // Aumentado de 0.4 a 0.5
                  fontWeight: '600'
                }}
              >
                📅 {new Date(node.fechaContratacion).toLocaleDateString('es-ES', { 
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </Typography>
            )}
            
            {/* Nombre de Campaña */}
            {(node.campaniaNombre || node.campaniaId) && (
              <Typography
                variant="body2"
                sx={{
                  display: 'block',
                  fontSize: '0.9rem', // Aumentado de 0.8rem a 0.9rem
                  opacity: 0.95,
                  mb: 0.5, // Aumentado de 0.4 a 0.5
                  fontWeight: '600'
                }}
              >
                🏢 {node.campaniaNombre || `ID: ${node.campaniaId}`}
              </Typography>
            )}
            
            {/* Nombre de Cargo */}
            {(node.cargoNombre || node.cargo) && (
              <Typography
                variant="body2"
                sx={{
                  display: 'block',
                  fontSize: '0.9rem', // Aumentado de 0.8rem a 0.9rem
                  opacity: 0.95,
                  fontWeight: '600'
                }}
              >
                💼 {node.cargoNombre || node.cargo}
              </Typography>
            )}
          </Box>
          
          {/* Indicador de expansión/colapso */}
          {(canExpand || hasChildren) && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'white',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: areaColor,
                cursor: 'pointer'
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
                top: '240px', // Ajustado para la nueva altura de tarjeta (240px)
                left: '50%',
                transform: 'translateX(-50%)',
                width: '2px',
                height: '80px',
                bgcolor: areaColor,
                opacity: 0.7
              }}
            />
            
            {/* Línea horizontal */}
            <Box
              sx={{
                position: 'absolute',
                top: '320px', // Ajustado para la nueva altura (240 + 80 = 320)
                left: '50%',
                transform: 'translateX(-50%)',
                width: `${(node.children.length - 1) * 320}px`,
                height: '2px',
                bgcolor: areaColor,
                opacity: 0.7
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
                    width: '2px',
                    height: '80px',
                    bgcolor: areaColor,
                    opacity: 0.7
                  }}
                />
              );
            })}
          </Box>
        )}
        
        {/* Nodos hijos con posicionamiento clásico */}
        {hasChildren && node.children.map((child, index) => {
          const childX = (index - (node.children.length - 1) / 2) * 320 - 140; // Centrar la tarjeta (280/2 = 140)
          const childY = 400; // Aumentado de 370 a 400 para acomodar tarjetas más altas
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
            className="px-6 py-3 bg-red-500 text-white rounded-lg"
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
      <div className="flex items-center px-6 py-2 bg-white shadow-md rounded-b-3xl mb-4 relative" style={{ minHeight: 80 }}>
        {/* Logo y Saludo - Izquierda */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-[#297373]/20 rounded-full p-2 flex items-center justify-center">
            <img src={partnerLogo} alt="Logo" className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">
                Hola, bienvenido
              </span>
              <span className="font-semibold text-black text-lg flex items-center gap-2">
                {user?.nombres || user?.nombre || 'Usuario'} {user?.apellidoPaterno || ''} {user?.apellidoMaterno || ''}
                <span className="text-xl">👋</span>
              </span>
            </div>
          </div>
        </div>

        {/* Título - Centro */}
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-[#297373] flex items-center gap-2">
            <BusinessIcon sx={{ fontSize: 32 }} />
            Organigrama Empresarial
          </h1>
        </div>

        {/* Controles - Derecha */}
        <div className="flex items-center gap-2">
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

        {/* Contenedor del organigrama con zoom y pan optimizado */}
        <div
          className="w-full h-full overflow-hidden cursor-grab select-none"
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
            willChange: 'transform', // Optimización GPU
            backfaceVisibility: 'hidden', // Prevenir flickering
            userSelect: 'none', // Deshabilitar selección de texto
            WebkitUserSelect: 'none', // Safari
            MozUserSelect: 'none', // Firefox
            msUserSelect: 'none' // Internet Explorer/Edge
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Contenedor del árbol optimizado */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 select-none"
            style={{
              transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              width: '100%',
              height: '100%',
              position: 'relative',
              willChange: 'transform', // Optimización GPU
              backfaceVisibility: 'hidden' // Prevenir flickering
              // Removido pointerEvents para permitir clicks
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
