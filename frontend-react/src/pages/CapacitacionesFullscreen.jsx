import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AsistenciasTable from '../components/capacitaciones/AsistenciasTable';
import EvaluacionesTable from '../components/capacitaciones/EvaluacionesTable';
import DesercionesTable from '../components/capacitaciones/DesercionesTable';
import ResumenCard from '../components/capacitaciones/ResumenCard';
import { api } from '../utils/capacitaciones/api';
import partnerLogo from '../assets/partner.svg';
import { useAuth } from '../contexts/AuthContext';
import ToggleTabs from '../components/capacitaciones/ToggleTabs';
import SelectorBar from '../components/capacitaciones/SelectorBar';

const CapacitacionesFullscreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Obtener usuario actual del contexto
  
  console.log('🔍 CapacitacionesFullscreen - Usuario actual:', user);
  console.log('🔍 CapacitacionesFullscreen - DNI del usuario:', user?.dni);
  console.log('🔍 CapacitacionesFullscreen - Nombre del usuario:', user?.nombre || user?.nombres);
  
  // Estados principales
  const [vista, setVista] = useState("asist");
  const [capaSeleccionada, setCapaSeleccionada] = useState(null);
  const [campaniaSeleccionada, setCampaniaSeleccionada] = useState("");
  const [capas, setCapas] = useState([]);
  const [horariosBase, setHorariosBase] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tablaDatos, setTablaDatos] = useState([]);
  const [dias, setDias] = useState([]);
  const [capCount, setCapCount] = useState(5);
  const [jornadaFiltro, setJornadaFiltro] = useState("Todos");
  const [showResumen, setShowResumen] = useState(false);
  
  // Estados para deserciones
  const [deserciones, setDeserciones] = useState([]);
  const [popover, setPopover] = useState({ open: false, row: null, col: null });
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  const [guardandoCambios, setGuardandoCambios] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '', visible: false });

  // Estado para el popover del resumen
  const [showResumenPopover, setShowResumenPopover] = useState(false);

  // Cerrar popover del resumen cuando se haga click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showResumenPopover && !event.target.closest('.resumen-popover')) {
        setShowResumenPopover(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResumenPopover]);

  // Función simple para verificar si hay token
  const verificarToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Verificar token al montar el componente
  useEffect(() => {
    verificarToken();
  }, []);

  // Cargar horarios base al montar la app
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const cargarHorariosBase = async () => {
        try {
          const data = await api('/api/capacitaciones/horarios-base');
          setHorariosBase(data);
          console.log('✅ Horarios base cargados:', data);
        } catch (error) {
          console.error('Error cargando horarios base:', error);
        }
      };
      cargarHorariosBase();
    }
  }, [isAuthenticated, isLoading]);

  // Cargar campañas al montar la app
  useEffect(() => {
    if (isAuthenticated && !isLoading && user?.dni) {
      console.log('🚀 Iniciando carga de campañas para capacitador:', user.dni);
      const cargarCampanias = async () => {
        try {
          const data = await api(`/api/capacitaciones/capas?dniCap=${user.dni}`);
          setCapas(data);
          console.log('✅ Campañas cargadas para capacitador:', user.dni, data);
          
          // Seleccionar automáticamente la última campaña y capa
          if (data.length > 0) {
            // Ordenar por fecha de inicio (más reciente primero)
            const campañasOrdenadas = data.sort((a, b) => {
              const fechaA = new Date(a.fechaInicio || a.fecha_inicio || '1900-01-01');
              const fechaB = new Date(b.fechaInicio || b.fecha_inicio || '1900-01-01');
              return fechaB - fechaA;
            });
            
            const ultimaCampaña = campañasOrdenadas[0];
            console.log('✅ Última campaña seleccionada:', ultimaCampaña);
            
            // Seleccionar automáticamente la capa
            setCapaSeleccionada(ultimaCampaña);
            setCampaniaSeleccionada(ultimaCampaña.CampañaID || ultimaCampaña.campaniaId);
            
            console.log('✅ Capa seleccionada automáticamente:', ultimaCampaña);
          }
        } catch (error) {
          console.error('❌ Error cargando campañas para capacitador:', user.dni, error);
        }
      };
      cargarCampanias();
    } else {
      console.log('⏳ No se pueden cargar campañas:', { 
        isAuthenticated, 
        isLoading, 
        userDNI: user?.dni,
        user: user 
      });
    }
  }, [isAuthenticated, isLoading, user?.dni]);

  // Cargar datos de asistencia cuando se selecciona una capa
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose:', { 
      isAuthenticated, 
      isLoading, 
      capaSeleccionada: !!capaSeleccionada,
      userDni: !!user?.dni,
      capaSeleccionadaData: capaSeleccionada
    });
    
    if (isAuthenticated && !isLoading && capaSeleccionada && user?.dni) {
      // Validar que capaSeleccionada sea un objeto válido
      if (typeof capaSeleccionada !== 'object' || capaSeleccionada === null) {
        console.log('⚠️ capaSeleccionada no es un objeto válido:', capaSeleccionada);
        return;
      }
      
      // Validar que capaSeleccionada tenga una fecha válida
      const fechaInicio = capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio;
      if (!fechaInicio || typeof fechaInicio !== 'string') {
        console.log('⚠️ capaSeleccionada no tiene fecha válida:', capaSeleccionada);
        return;
      }
      
      console.log('🔄 Usuario autenticado:', user.dni, 'Token presente:', !!localStorage.getItem('token'));
      
      const cargarDatosAsistencia = async () => {
        try {
          console.log('🔄 Cargando datos de asistencia para capa:', capaSeleccionada);
          
          // Cargar postulantes y asistencias (el endpoint /postulantes devuelve ambos)
          const postulantesData = await api(`/api/capacitaciones/postulantes?campaniaID=${capaSeleccionada.CampañaID || capaSeleccionada.campaniaId}&mes=${(capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio || '').substring(0, 7)}&fechaInicio=${capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio || ''}`);
          console.log('✅ Postulantes y asistencias cargados:', postulantesData);
          console.log('✅ Estructura de postulantesData:', {
            postulantes: postulantesData?.postulantes?.length || 0,
            asistencias: postulantesData?.asistencias?.length || 0,
            duracion: postulantesData?.duracion
          });
          
          // Cargar deserciones existentes
          console.log('🔄 Llamando a API de deserciones con token:', !!localStorage.getItem('token'));
          let desercionesData = [];
          try {
            desercionesData = await api(`/api/capacitaciones/deserciones?campaniaID=${capaSeleccionada.CampañaID || capaSeleccionada.campaniaId}&mes=${(capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio || '').substring(0, 7)}&capa=${capaSeleccionada.capa || capaSeleccionada.capaNum}`);
            console.log('✅ Deserciones existentes cargadas:', desercionesData);
          } catch (error) {
            console.log('⚠️ Error cargando deserciones (continuando sin ellas):', error);
            desercionesData = [];
          }
          
          // Generar días del mes según la duración de la campaña (excluyendo domingos)
          const generarDias = () => {
            const dias = [];
            const fechaInicio = new Date(capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio || '2025-01-01');
            
            // Función para obtener siguiente fecha excluyendo domingos
            const nextDate = (iso) => {
              const [y, m, d] = iso.split("-").map(Number);
              const dt = new Date(y, m - 1, d);
              do { 
                dt.setDate(dt.getDate() + 1); 
              } while (dt.getDay() === 0); // Excluir domingos
              return dt.toISOString().split('T')[0];
            };
            
            // Obtener duración de la campaña desde el backend
            const duracion = postulantesData.duracion || { cap: 5, ojt: 5 };
            const totalDias = duracion.cap + duracion.ojt;
            
            // Generar días excluyendo domingos
            let fechaActual = new Date(fechaInicio);
            for (let i = 0; i < totalDias; i++) {
              dias.push(fechaActual.toISOString().split('T')[0]);
              if (i < totalDias - 1) { // No avanzar en el último día
                fechaActual = new Date(nextDate(fechaActual.toISOString().split('T')[0]));
              }
            }
            
            return { dias, capCount: duracion.cap };
          };
          
          const { dias: diasGenerados, capCount } = generarDias();
          
          // Procesar los datos según la estructura que devuelve el backend
          let tablaCompleta = [];
          
          if (postulantesData && postulantesData.postulantes && postulantesData.postulantes.length > 0) {
            // El backend devuelve { postulantes: [...], asistencias: [...], duracion: {...} }
            const postulantes = postulantesData.postulantes;
            const asistencias = postulantesData.asistencias || [];
            
            tablaCompleta = postulantes.map(postulante => {
              // Crear array de asistencia para cada día
              const asistencia = diasGenerados.map(dia => {
                // Buscar asistencia para este día y postulante
                const asistenciaDia = asistencias.find(a => 
                  a.postulante_dni === postulante.dni && 
                  a.fecha === dia
                );
                
                if (asistenciaDia) {
                  // Convertir "D" de la BD a "Deserción" en el frontend (como en el proyecto original)
                  return asistenciaDia.estado_asistencia === "D" ? "Deserción" : asistenciaDia.estado_asistencia;
                }
                return "";
              });
              
              // Buscar si este postulante tiene deserción
              const desercion = desercionesData.find(d => d.postulante_dni === postulante.dni);
              if (desercion) {
                // Marcar el día de deserción
                const idxDesercion = diasGenerados.findIndex(dia => dia === desercion.fecha_desercion);
                if (idxDesercion !== -1) {
                  asistencia[idxDesercion] = "Deserción";
                }
              }
              
              return {
                ...postulante,
                asistencia,
                dni: postulante.dni,
                nombres: postulante.nombre ? postulante.nombre.split(' ')[0] : "",
                apellidos: postulante.nombre ? postulante.nombre.split(' ').slice(1).join(' ') : "",
                NombreJornada: postulante.NombreJornada || "N/A",
                resultadoFinal: postulante.EstadoPostulante || "",
                turno: postulante.turno || "",
                horario: postulante.horario || "",
                motivoDesercion: desercion ? desercion.motivo : "",
                fechaDesercion: desercion ? desercion.fecha_desercion : null
              };
            });
          }
          
          // Actualizar estado local
          const tablaConDirty = tablaCompleta.map(fila => ({
            ...fila,
            dirty: false
          }));
          
          console.log('🔍 Tabla inicializada con dirty:', {
            totalFilas: tablaConDirty.length,
            filasConDirty: tablaConDirty.filter(f => f.dirty === false).length,
            muestraFila: tablaConDirty[0]
          });
          
          setTablaDatos(tablaConDirty);
          setDias(diasGenerados);
          setCapCount(capCount); // Actualizar el estado capCount
          
          // Actualizar deserciones existentes
          if (desercionesData && desercionesData.length > 0) {
            const desercionesFormateadas = desercionesData.map(d => ({
              postulante_dni: d.postulante_dni,
              nombre: d.nombre,
              numero: d.numero || '',
              fecha_desercion: d.fecha_desercion,
              motivo: d.motivo,
              capa_numero: capaSeleccionada?.capa || capaSeleccionada?.capaNum || 1,
              campania: capaSeleccionada?.NombreCampaña || 'N/A',
              fecha_inicio: capaSeleccionada?.fechaInicio || capaSeleccionada?.fecha_inicio
            }));
            setDeserciones(desercionesFormateadas);
            console.log('✅ Deserciones formateadas y guardadas:', desercionesFormateadas);
          } else {
            console.log('ℹ️ No hay deserciones existentes para esta capa');
            setDeserciones([]);
          }
          
          console.log('✅ Tabla de asistencia generada:', tablaCompleta);
          console.log('✅ Días generados:', diasGenerados);
          console.log('✅ Deserciones cargadas:', desercionesData);
          
        } catch (error) {
          console.error('Error cargando datos de asistencia:', error);
        }
      };
      
      cargarDatosAsistencia();
    }
  }, [isAuthenticated, isLoading, capaSeleccionada, user?.dni]);

  // Función para manejar cambios en asistencia
  const handleAsistenciaChange = (rowIndex, colIndex, newValue) => {
    console.log('🔄 handleAsistenciaChange llamado:', {
      rowIndex,
      colIndex,
      newValue,
      valorAnterior: tablaDatos[rowIndex]?.asistencia?.[colIndex],
      tablaDatosLength: tablaDatos.length,
      filaExiste: !!tablaDatos[rowIndex]
    });
    
    setTablaDatos(prev => {
      console.log('🔄 setTablaDatos ejecutándose con prev:', {
        prevLength: prev.length,
        filaActual: prev[rowIndex],
        asistenciaActual: prev[rowIndex]?.asistencia
      });
      
      const newData = [...prev];
      newData[rowIndex] = { ...newData[rowIndex] };
      newData[rowIndex].asistencia = [...newData[rowIndex].asistencia];
      newData[rowIndex].asistencia[colIndex] = newValue;
      newData[rowIndex].dirty = true; // Marcar como modificado
      
      console.log('✅ Fila marcada como dirty:', {
        rowIndex,
        dni: newData[rowIndex].dni,
        dirty: newData[rowIndex].dirty,
        asistencia: newData[rowIndex].asistencia
      });
      
      return newData;
    });
    setCambiosPendientes(true);
  };

  // Función para manejar deserción
  const handleDesercion = (rowIndex, colIndex, motivo) => {
    console.log('🔄 handleDesercion llamado:', {
      rowIndex,
      colIndex,
      motivo,
      dni: tablaDatos[rowIndex]?.dni
    });

    const newTablaDatos = [...tablaDatos];
    if (newTablaDatos[rowIndex] && newTablaDatos[rowIndex].asistencia) {
      // Marcar la deserción en la tabla
      newTablaDatos[rowIndex].asistencia[colIndex] = "Deserción";
      newTablaDatos[rowIndex].motivoDesercion = motivo;
      newTablaDatos[rowIndex].fechaDesercion = dias[colIndex];
      newTablaDatos[rowIndex].dirty = true; // ¡IMPORTANTE! Marcar como modificado
      
      setTablaDatos(newTablaDatos);
      
      // Agregar a la lista de deserciones
      const nuevaDesercion = {
        postulante_dni: newTablaDatos[rowIndex].dni,
        nombre: `${newTablaDatos[rowIndex].nombres} ${newTablaDatos[rowIndex].apellidos}`,
        numero: newTablaDatos[rowIndex].numero || '',
        fecha_desercion: dias[colIndex],
        motivo: motivo,
        capa_numero: capaSeleccionada?.capa || capaSeleccionada?.capaNum || 1,
        campania: capaSeleccionada?.NombreCampaña || 'N/A',
        fecha_inicio: capaSeleccionada?.fechaInicio || capaSeleccionada?.fecha_inicio
      };
      
      setDeserciones(prev => {
        const newDeserciones = [...prev, nuevaDesercion];
        console.log('✅ Estado deserciones actualizado:', {
          anterior: prev.length,
          nueva: nuevaDesercion,
          total: newDeserciones.length
        });
        return newDeserciones;
      });
      setCambiosPendientes(true); // ¡IMPORTANTE! Activar cambios pendientes
      
      console.log('✅ Deserción registrada y fila marcada como dirty:', {
        rowIndex,
        colIndex,
        motivo,
        dni: newTablaDatos[rowIndex].dni,
        dirty: newTablaDatos[rowIndex].dirty,
        cambiosPendientes: true
      });
    } else {
      console.log('❌ Error: No se pudo procesar la deserción - fila o asistencia no encontrada');
    }
  };

  // Función para abrir popover de deserción
  const abrirPopoverDesercion = (rowIndex, colIndex) => {
    setPopover({ open: true, row: rowIndex, col: colIndex });
    setMotivo("");
  };

  // Función para cerrar popover de deserción
  const cerrarPopoverDesercion = () => {
    setPopover({ open: false, row: null, col: null });
    setMotivo("");
  };

  // Función para guardar deserción desde popover
  const guardarDesercion = async () => {
    console.log('🔄 guardarDesercion llamado:', {
      popoverRow: popover.row,
      popoverCol: popover.col,
      motivo: motivo,
      motivoTrimmed: motivo.trim(),
      tieneMotivo: !!motivo.trim()
    });

    if (popover.row !== null && popover.col !== null && motivo.trim()) {
      setGuardando(true);
      try {
        console.log('✅ Validación pasó, procesando deserción...');
        
        // Llamar a la función de deserción para actualizar estado local
        handleDesercion(popover.row, popover.col, motivo);
        
        console.log('✅ Estado local actualizado, guardando en base de datos...');
        console.log('🔍 Estado después de handleDesercion:', {
          filaDirty: tablaDatos[popover.row]?.dirty,
          cambiosPendientes,
          totalDeserciones: deserciones.length + 1
        });
        
        // Preparar payload para guardar inmediatamente
        const desercionPayload = [{
          postulante_dni: tablaDatos[popover.row].dni,
          fecha_desercion: dias[popover.col],
          motivo: motivo,
          capa_numero: parseInt(capaSeleccionada?.capa || capaSeleccionada?.capaNum || 1, 10),
          CampañaID: parseInt(capaSeleccionada?.CampañaID || capaSeleccionada?.campaniaId, 10),
          fecha_inicio: capaSeleccionada?.fechaInicio || capaSeleccionada?.fecha_inicio
        }];
        
        console.log('📤 Enviando deserción al backend:', desercionPayload);
        
        // Guardar inmediatamente en la base de datos
        await api('/api/capacitaciones/deserciones/bulk', {
          method: 'POST',
          body: JSON.stringify(desercionPayload)
        });
        
        console.log('✅ Deserción guardada en base de datos exitosamente');
        
        // Limpiar el estado dirty de la fila ya que se guardó automáticamente
        setTablaDatos(prev => {
          const newData = [...prev];
          if (newData[popover.row]) {
            newData[popover.row] = { ...newData[popover.row], dirty: false };
            console.log('✅ Fila marcada como no dirty después del guardado automático');
          }
          return newData;
        });
        
        // Verificar si hay más cambios pendientes
        const filasRestantesDirty = tablaDatos.filter((fila, index) => 
          index !== popover.row && fila.dirty
        );
        
        if (filasRestantesDirty.length === 0) {
          setCambiosPendientes(false);
          console.log('✅ No hay más cambios pendientes, desactivando indicador');
        } else {
          console.log('⚠️ Aún hay cambios pendientes en otras filas:', filasRestantesDirty.length);
        }
        
        // Cerrar popover
        cerrarPopoverDesercion();
        
        // Mostrar mensaje de éxito
        mostrarMensaje('success', '✅ Deserción guardada automáticamente');
        
        console.log('✅ Deserción procesada y guardada completamente');
      } catch (error) {
        console.error("❌ Error guardando deserción:", error);
        mostrarMensaje('error', '❌ Error guardando deserción: ' + error.message);
      } finally {
        setGuardando(false);
      }
    } else {
      console.log('❌ Validación falló en guardarDesercion:', {
        popoverRow: popover.row,
        popoverCol: popover.col,
        motivo: motivo,
        motivoTrimmed: motivo.trim()
      });
    }
  };

  // Función para guardar cambios
  const guardarCambios = async () => {
    if (!capaSeleccionada || !cambiosPendientes) return;
    
    // Validar que capaSeleccionada sea un objeto válido
    if (typeof capaSeleccionada !== 'object' || capaSeleccionada === null) {
      mostrarMensaje('error', '❌ Error: La capa seleccionada no es válida');
      return;
    }
    
    // Validar que capaSeleccionada tenga una fecha válida
    const fechaInicio = capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio;
    if (!fechaInicio || typeof fechaInicio !== 'string') {
      mostrarMensaje('error', '❌ Error: No se pudo obtener la fecha de inicio de la capa');
      return;
    }
    
    setGuardandoCambios(true);
    try {
      // Preparar payload de asistencias
      const asistenciasPayload = [];
      
      console.log('🔍 Revisando filas dirty:', {
        totalFilas: tablaDatos.length,
        filasDirty: tablaDatos.filter(p => p.dirty).length,
        filasConAsistencia: tablaDatos.filter(p => p.asistencia).length
      });
      
      // Verificar si hay filas dirty
      const filasDirty = tablaDatos.filter(p => p.dirty);
      if (filasDirty.length === 0) {
        console.log('⚠️ NO HAY FILAS MARCADAS COMO DIRTY - Esto explica por qué el payload está vacío');
        console.log('🔍 Estado de tablaDatos:', tablaDatos.map((fila, index) => ({
          index,
          dni: fila.dni,
          nombres: fila.nombres,
          dirty: fila.dirty,
          tieneAsistencia: !!fila.asistencia
        })));
      } else {
        console.log('✅ Filas marcadas como dirty encontradas:', filasDirty.length);
      }
      
      // Log detallado de todas las filas
      tablaDatos.forEach((postulante, rowIndex) => {
        console.log(`🔍 Fila ${rowIndex}:`, {
          dni: postulante.dni,
          nombres: postulante.nombres,
          dirty: postulante.dirty,
          tieneAsistencia: !!postulante.asistencia,
          asistenciaLength: postulante.asistencia ? postulante.asistencia.length : 0
        });
      });
      
      // Construir payload de asistencias como en el proyecto anterior
      tablaDatos.forEach((postulante, rowIndex) => {
        if (postulante.dirty && postulante.asistencia) {
          console.log(`🔍 Fila ${rowIndex} marcada como dirty:`, {
            dni: postulante.dni,
            nombres: postulante.nombres,
            dirty: postulante.dirty,
            asistencia: postulante.asistencia
          });
          
          // Iterar sobre cada día de asistencia
          postulante.asistencia.forEach((estado, colIndex) => {
            if (estado && estado !== "") {
              // Crear objeto de asistencia individual por día
              const asistenciaData = {
                postulante_dni: postulante.dni,
                fecha: dias[colIndex],
                etapa: colIndex < capCount ? "Capacitacion" : "OJT",
                estado_asistencia: estado === "Deserción" ? "D" : estado,
                capa_numero: parseInt(capaSeleccionada.capa || capaSeleccionada.capaNum || 1, 10),
                CampañaID: parseInt(capaSeleccionada.CampañaID || capaSeleccionada.campaniaId, 10),
                fecha_inicio: fechaInicio
              };
              
              console.log(`📝 Asistencia ${colIndex} para ${postulante.dni}:`, asistenciaData);
              
              // Verificar que todos los campos requeridos estén presentes
              if (asistenciaData.postulante_dni && asistenciaData.fecha && asistenciaData.estado_asistencia) {
                // Validar tipos de datos
                if (typeof asistenciaData.postulante_dni === 'string' && 
                    typeof asistenciaData.fecha === 'string' && 
                    typeof asistenciaData.estado_asistencia === 'string' &&
                    typeof asistenciaData.capa_numero === 'number' &&
                    typeof asistenciaData.CampañaID === 'number' &&
                    !isNaN(asistenciaData.capa_numero) &&
                    !isNaN(asistenciaData.CampañaID) &&
                    asistenciaData.capa_numero > 0 &&
                    asistenciaData.CampañaID > 0 &&
                    Number.isInteger(asistenciaData.capa_numero) &&
                    Number.isInteger(asistenciaData.CampañaID)) {
                  asistenciasPayload.push(asistenciaData);
                  console.log(`✅ Asistencia agregada al payload:`, asistenciaData);
                } else {
                  console.log('⚠️ Tipos de datos incorrectos en asistencia:', {
                    postulante_dni: typeof asistenciaData.postulante_dni,
                    fecha: typeof asistenciaData.fecha,
                    estado_asistencia: typeof asistenciaData.estado_asistencia,
                    capa_numero: typeof asistenciaData.capa_numero,
                    CampañaID: typeof asistenciaData.CampañaID,
                    capa_numero_isNaN: isNaN(asistenciaData.capa_numero),
                    CampañaID_isNaN: isNaN(asistenciaData.CampañaID),
                    capa_numero_value: asistenciaData.capa_numero,
                    CampañaID_value: asistenciaData.CampañaID,
                    capa_numero_isInteger: Number.isInteger(asistenciaData.capa_numero),
                    CampañaID_isInteger: Number.isInteger(asistenciaData.CampañaID)
                  });
                }
              } else {
                console.log('⚠️ Campos faltantes en asistencia:', asistenciaData);
              }
            }
          });
        }
      });
      
      console.log('📊 Payload de asistencias construido:', {
        totalAsistencias: asistenciasPayload.length,
        muestra: asistenciasPayload.slice(0, 2)
      });

      // Preparar payload de deserciones
      const desercionesPayload = deserciones
        .filter(d => d.motivo && d.motivo.trim() !== "")
        .map(d => {
          // Validar que todos los campos requeridos estén presentes
          const desercionData = {
            postulante_dni: d.postulante_dni,
            fecha_desercion: d.fecha_desercion,
            motivo: d.motivo,
            capa_numero: parseInt(d.capa_numero || capaSeleccionada.capa || capaSeleccionada.capaNum || 1, 10),
            CampañaID: parseInt(d.CampañaID || capaSeleccionada.CampañaID || capaSeleccionada.campaniaId, 10),
            fecha_inicio: d.fecha_inicio || fechaInicio
          };
          
          // Verificar que todos los campos requeridos estén presentes
          if (desercionData.postulante_dni && desercionData.fecha_desercion && desercionData.motivo) {
            // Validar tipos de datos
            if (typeof desercionData.postulante_dni === 'string' && 
                typeof desercionData.fecha_desercion === 'string' && 
                typeof desercionData.motivo === 'string' &&
                typeof desercionData.capa_numero === 'number' &&
                typeof desercionData.CampañaID === 'number' &&
                !isNaN(desercionData.capa_numero) &&
                !isNaN(desercionData.CampañaID) &&
                desercionData.capa_numero > 0 &&
                desercionData.CampañaID > 0 &&
                Number.isInteger(desercionData.capa_numero) &&
                Number.isInteger(desercionData.CampañaID)) {
              return desercionData;
            } else {
              console.log('⚠️ Tipos de datos incorrectos en deserción:', {
                postulante_dni: typeof desercionData.postulante_dni,
                fecha_desercion: typeof desercionData.fecha_desercion,
                motivo: typeof desercionData.motivo,
                capa_numero: typeof desercionData.capa_numero,
                CampañaID: typeof desercionData.CampañaID,
                capa_numero_isNaN: isNaN(desercionData.capa_numero),
                CampañaID_isNaN: isNaN(desercionData.CampañaID),
                capa_numero_value: desercionData.capa_numero,
                CampañaID_value: desercionesPayload[0].CampañaID,
                capa_numero_isInteger: Number.isInteger(desercionData.capa_numero),
                CampañaID_isInteger: Number.isInteger(desercionData.CampañaID)
              });
              return null;
            }
          } else {
            console.log('⚠️ Campos faltantes en deserción:', desercionData);
            return null;
          }
        })
        .filter(d => d !== null); // Filtrar los null

      console.log('🔄 Deserciones después de validación:', {
        original: deserciones.length,
        conMotivo: deserciones.filter(d => d.motivo && d.motivo.trim() !== "").length,
        validadas: desercionesPayload.length
      });

      console.log('🔄 Guardando cambios:', {
        asistencias: asistenciasPayload.length,
        deserciones: desercionesPayload.length
      });
      
      console.log('🔍 Estado general:', {
        cambiosPendientes,
        totalFilas: tablaDatos.length,
        filasDirty: tablaDatos.filter(p => p.dirty).length,
        filasConAsistencia: tablaDatos.filter(p => p.asistencia).length
      });

      // Log detallado del payload de asistencias
      if (asistenciasPayload.length > 0) {
        console.log('📤 Payload de asistencias a enviar:', JSON.stringify(asistenciasPayload, null, 2));
        console.log('📤 Primer elemento de asistencias:', asistenciasPayload[0]);
        console.log('📤 Tipos de datos:', {
          postulante_dni: typeof asistenciasPayload[0].postulante_dni,
          fecha: typeof asistenciasPayload[0].fecha,
          estado_asistencia: typeof asistenciasPayload[0].estado_asistencia,
          capa_numero: typeof asistenciasPayload[0].capa_numero,
          CampañaID: typeof asistenciasPayload[0].CampañaID,
          fecha_inicio: typeof asistenciasPayload[0].fecha_inicio
        });
        console.log('📤 Valores convertidos:', {
          capa_numero: asistenciasPayload[0].capa_numero,
          CampañaID: asistenciasPayload[0].CampañaID
        });
      }

      // Log detallado del payload de deserciones
      if (desercionesPayload.length > 0) {
        console.log('📤 Payload de deserciones a enviar:', JSON.stringify(desercionesPayload, null, 2));
        console.log('📤 Primer elemento de deserciones:', desercionesPayload[0]);
        console.log('📤 Tipos de datos deserciones:', {
          postulante_dni: typeof desercionesPayload[0].postulante_dni,
          fecha_desercion: typeof desercionesPayload[0].fecha_desercion,
          motivo: typeof desercionesPayload[0].motivo,
          capa_numero: typeof desercionesPayload[0].capa_numero,
          CampañaID: typeof desercionesPayload[0].CampañaID,
          fecha_inicio: typeof desercionesPayload[0].fecha_inicio
        });
        console.log('📤 Valores convertidos deserciones:', {
          capa_numero: desercionesPayload[0].capa_numero,
          CampañaID: desercionesPayload[0].CampañaID
        });
      }

      // Guardar asistencias
      if (asistenciasPayload.length > 0) {
        console.log('🔄 Enviando asistencias al backend...');
        console.log('📤 URL:', '/api/capacitaciones/asistencia/bulk');
        console.log('📤 Method:', 'POST');
        console.log('📤 Body:', JSON.stringify(asistenciasPayload));
        console.log('📤 Body length:', asistenciasPayload.length);
        console.log('📤 Body type:', typeof JSON.stringify(asistenciasPayload));
        console.log('📤 Body parsed:', JSON.parse(JSON.stringify(asistenciasPayload)));
        
        await api('/api/capacitaciones/asistencia/bulk', {
          method: 'POST',
          body: JSON.stringify(asistenciasPayload)
        });
        console.log('✅ Asistencias guardadas');
      } else {
        console.log('⚠️ No hay asistencias para enviar - asistenciasPayload está vacío');
        console.log('🔍 Debug asistenciasPayload:', {
          length: asistenciasPayload.length,
          content: asistenciasPayload,
          isArray: Array.isArray(asistenciasPayload)
        });
      }

      // Guardar deserciones
      if (desercionesPayload.length > 0) {
        console.log('🔄 Enviando deserciones al backend...');
        console.log('📤 URL:', '/api/capacitaciones/deserciones/bulk');
        console.log('📤 Method:', 'POST');
        console.log('📤 Body:', JSON.stringify(desercionesPayload));
        console.log('📤 Body length:', desercionesPayload.length);
        
        await api('/api/capacitaciones/deserciones/bulk', {
          method: 'POST',
          body: JSON.stringify(desercionesPayload)
        });
        console.log('✅ Deserciones guardadas');
      } else {
        console.log('ℹ️ No hay deserciones para guardar');
      }

      // Limpiar estado de cambios
      setTablaDatos(prev => prev.map(p => ({ ...p, dirty: false })));
      setCambiosPendientes(false);
      
      // Mostrar mensaje de éxito
      mostrarMensaje('success', '✅ Cambios guardados correctamente');
      
    } catch (error) {
      console.error('❌ Error guardando cambios:', error);
      mostrarMensaje('error', '❌ Error al guardar cambios: ' + error.message);
    } finally {
      setGuardandoCambios(false);
    }
  };

  // Función para renovar token manualmente
  const renovarTokenManual = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Renovando token manualmente...');
      const response = await api('/api/capacitaciones/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: '70907372' })
      });
      
      const data = response;
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        console.log('✅ Token renovado manualmente');
        setIsAuthenticated(true);
        setIsLoading(false);
        
        // Recargar datos después de renovar token
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error('No se pudo obtener el token');
      }
    } catch (error) {
      console.error('❌ Error renovando token manualmente:', error);
      setIsLoading(false);
      alert('Error renovando token: ' + error.message);
    }
  };

  // Función para descargar Excel
  const descargarExcel = () => {
    if (!tablaDatos || tablaDatos.length === 0) {
      alert('No hay datos para descargar');
      return;
    }
    
    try {
      // Importar dinámicamente la función de Excel
      import('../utils/capacitaciones/excel.js').then(({ descargarExcel: descargarExcelFn }) => {
        descargarExcelFn({ tablaDatos, dias, capCount });
      });
    } catch (error) {
      console.error('Error descargando Excel:', error);
      alert('Error al descargar Excel');
    }
  };

  // Función para mostrar mensajes
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto, visible: true });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '', visible: false });
    }, 3000);
  };

  // Si no hay usuario o está cargando, mostrar mensaje de carga
  if (!user || isLoading) {
    console.log('🔄 Estado de carga:', { user, isLoading });
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#e5e7eb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#297373] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#297373] text-lg">Cargando sistema de capacitaciones...</p>
        </div>
      </div>
    );
  }

  // Log del estado actual
  console.log('🔄 Estado actual del componente:', {
    user,
    capaSeleccionada,
    capaSeleccionadaType: typeof capaSeleccionada,
    capaSeleccionadaIsNull: capaSeleccionada === null,
    fechaInicio: capaSeleccionada?.fechaInicio,
    fecha_inicio: capaSeleccionada?.fecha_inicio,
    isAuthenticated,
    isLoading
  });

  // Si no hay token, mostrar mensaje simple
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-2xl font-bold text-red-800 mb-4">🔐 Acceso Requerido</h2>
          <p className="text-red-700 mb-4">
            Necesitas iniciar sesión para acceder al sistema de capacitaciones.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={renovarTokenManual}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              🔄 Renovar Token Manualmente
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#e5e7eb] flex flex-col p-0 m-0 z-50">
      {/* Mensaje de confirmación */}
      {mensaje.visible && (
        <div className={`fixed top-4 right-4 z-[60] px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          mensaje.tipo === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {mensaje.texto}
        </div>
      )}
      
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
            {cambiosPendientes && (
              <span className="text-sm bg-red-500 text-white px-2 py-1 rounded-full animate-pulse mt-2">
                Cambios pendientes
              </span>
            )}
          </div>
        </div>

        {/* Toggle y KPIs - Centro */}
        <div className="flex-1 flex items-center justify-center gap-6">
          {/* Toggle Asistencias/Evaluaciones */}
          <div className="flex bg-gray-100 rounded-lg p-1 shadow-inner">
            <button
              onClick={() => setVista("asist")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                vista === "asist"
                  ? "bg-blue-600 text-white shadow-md transform scale-105"
                  : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              Asistencias
            </button>
            <button
              onClick={() => setVista("eval")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                vista === "eval"
                  ? "bg-blue-600 text-white shadow-md transform scale-105"
                  : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              Evaluaciones
            </button>
          </div>

          {/* Botón Ver Resumen */}
          <button
            onClick={() => setShowResumenPopover(!showResumenPopover)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Ver Resumen
            {cambiosPendientes && (
              <span className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Popover del Resumen */}
          {showResumenPopover && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 resumen-popover">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 min-w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Resumen General</h3>
                  <button
                    onClick={() => setShowResumenPopover(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-start py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Capacitador:</span>
                    <div className="text-right">
                      <div className="text-gray-800">{user?.nombres || user?.nombre || 'Usuario'}</div>
                      <div className="text-gray-800">{user?.apellidoPaterno || ''} {user?.apellidoMaterno || ''}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Campaña:</span>
                    <span className="text-gray-800">{capaSeleccionada?.NombreCampaña || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Total Postulantes:</span>
                    <span className="text-gray-800 font-semibold">{tablaDatos.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Deserciones/Bajas:</span>
                    <span className="text-red-600 font-semibold">{tablaDatos.filter(p => p.asistencia?.some(a => a === "Deserción")).length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-gray-600">Activos:</span>
                    <span className="text-green-600 font-semibold">{tablaDatos.filter(p => !p.asistencia?.some(a => a === "Deserción")).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KPI Activos */}
          <div className="bg-gradient-to-br from-green-400 to-green-600 px-6 py-2 rounded-xl text-white text-center min-w-[90px] shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-green-300">
            <div className="text-2xl font-bold mb-1">
              {tablaDatos.filter(p => !p.asistencia?.some(a => a === "Deserción")).length}
            </div>
            <div className="text-sm opacity-95 font-medium">
              {tablaDatos.length > 0
                ? Math.round((tablaDatos.filter(p => !p.asistencia?.some(a => a === "Deserción")).length / tablaDatos.length) * 100)
                : 0}%
            </div>
            <div className="text-xs opacity-90 font-medium">Activos</div>
          </div>

          {/* KPI Bajas */}
          <div className="bg-gradient-to-br from-red-400 to-red-600 px-6 py-2 rounded-xl text-white text-center min-w-[90px] shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-red-300">
            <div className="text-2xl font-bold mb-1">
              {tablaDatos.filter(p => p.asistencia?.some(a => a === "Deserción")).length}
            </div>
            <div className="text-sm opacity-95 font-medium">
              {tablaDatos.length > 0
                ? Math.round((tablaDatos.filter(p => p.asistencia?.some(a => a === "Deserción")).length / tablaDatos.length) * 100)
                : 0}%
            </div>
            <div className="text-xs opacity-90 font-medium">Bajas</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-full bg-[#297373] text-white font-semibold shadow hover:bg-[#297373]/80 transition-all border border-[#297373] focus:outline-none"
          >
            ← Volver al Dashboard
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col px-6 pb-6 overflow-hidden bg-[#e5e7eb]">
        
        {/* Selectores simplificados */}
        {capaSeleccionada && typeof capaSeleccionada === 'object' && capaSeleccionada !== null && (capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio) && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-6 shadow-lg w-fit">
            <div className="flex items-center gap-6">
              <div className="text-[#297373]">
                <label className="block text-sm opacity-80 mb-1">Campaña</label>
                <select
                  value={campaniaSeleccionada}
                  onChange={(e) => setCampaniaSeleccionada(e.target.value)}
                  className="px-3 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#297373] bg-white text-sm min-w-[120px]"
                >
                  <option value="">Selecciona</option>
                  {Array.from(new Set(capas.map(c => c.CampañaID || c.campaniaId))).map((campaniaId, index) => {
                    const primeraCapa = capas.find(c => (c.CampañaID || c.campaniaId) === campaniaId);
                    return (
                      <option key={`campania-${campaniaId}-${index}`} value={campaniaId}>
                        {primeraCapa?.NombreCampaña || `Campaña ${campaniaId}`}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="text-[#297373]">
                <label className="block text-sm opacity-80 mb-1">Capa</label>
                <select
                  value={capaSeleccionada ? (capaSeleccionada.capa || capaSeleccionada.capaNum) : ''}
                  onChange={(e) => {
                    const capa = capas.find(c =>
                      (c.capa === e.target.value || c.capaNum === e.target.value) &&
                      (c.CampañaID === campaniaSeleccionada || c.campaniaId === campaniaSeleccionada)
                    );
                    setCapaSeleccionada(capa);
                  }}
                  className="px-3 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#297373] bg-white text-sm min-w-[120px]"
                >
                  <option value="">Selecciona</option>
                  {capas
                    .filter(c => !campaniaSeleccionada || c.CampañaID === campaniaSeleccionada || c.campaniaId === campaniaSeleccionada)
                    .map((c, index) => (
                      <option key={`${c.CampañaID || c.campaniaId}-${c.capa || c.capaNum}-${index}`} value={c.capa || c.capaNum}>
                        Capa {c.capa || c.capaNum}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="text-[#297373]">
                <label className="block text-sm opacity-80 mb-1">Jornada</label>
                <select
                  value={jornadaFiltro}
                  onChange={(e) => setJornadaFiltro(e.target.value)}
                  className="px-3 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#297373] bg-white text-sm min-w-[120px]"
                >
                  <option value="Todos">Todos</option>
                  <option value="FullTime">Full Time</option>
                  <option value="PartTime">Part Time</option>
                  <option value="SemiFull">Semi Full</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Contenido de las tablas */}
        <div className="flex-1 w-full overflow-auto">
          {vista === "asist" && capaSeleccionada && typeof capaSeleccionada === 'object' && capaSeleccionada !== null && (capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio) && (
            <div className="w-full">
              <AsistenciasTable
                compact={false}
                dniCap={user?.dni}
                CampañaID={capaSeleccionada?.CampañaID || capaSeleccionada?.campaniaId}
                mes={(capaSeleccionada?.fechaInicio || capaSeleccionada?.fecha_inicio || '').substring(0, 7)}
                fechaInicio={capaSeleccionada?.fechaInicio || capaSeleccionada?.fecha_inicio || ''}
                capaNum={capaSeleccionada?.capa || capaSeleccionada?.capaNum}
                horariosBase={horariosBase}
                jornadaFiltro={jornadaFiltro}
                tablaDatos={tablaDatos}
                dias={dias}
                onAsistenciaChange={handleAsistenciaChange}
                onDesercion={handleDesercion}
                onAbrirPopoverDesercion={abrirPopoverDesercion}
                capCount={capCount}
              />
                      
                      {/* Botones de Guardar y Descargar Excel */}
                      <div className="flex items-center gap-3 mt-4 mb-2">
                        <button
                          onClick={guardarCambios}
                          disabled={!cambiosPendientes || guardandoCambios}
                          className={`px-6 py-2 rounded-xl text-base font-semibold transition-all duration-200 shadow-md focus:outline-none focus:ring-2 border disabled:cursor-not-allowed ${
                            cambiosPendientes 
                              ? 'bg-[#ffb347] hover:bg-[#ffa500] focus:ring-[#ffe5b4] border-[#e0d7ce] text-white' 
                              : 'bg-gray-400 border-gray-300 text-gray-600'
                          }`}
                        >
                          {guardandoCambios ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Guardando...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              {cambiosPendientes && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                  {tablaDatos.filter(p => p.dirty).length}
                                </span>
                              )}
                              Guardar
                            </span>
                          )}
                        </button>
                        <button
                          onClick={descargarExcel}
                          disabled={!tablaDatos || tablaDatos.length === 0}
                          className="bg-blue-400 hover:bg-blue-500 disabled:bg-gray-400 text-white px-6 py-2 rounded-xl text-base font-semibold transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 border border-blue-200 disabled:cursor-not-allowed"
                        >
                          Descargar Excel
                        </button>
                        
                        {/* Mensaje informativo */}
                        {!cambiosPendientes && tablaDatos.length > 0 && (
                          <span className="text-sm text-gray-500 italic">
                            No hay cambios pendientes para guardar
                          </span>
                        )}
                      </div>
                
                      {/* Tabla de deserciones siempre debajo de la tabla de asistencias */}
                      {deserciones.length > 0 && (
                        <div className="mt-6">
                          <DesercionesTable
                            deserciones={deserciones}
                            campania={capaSeleccionada?.NombreCampaña || 'N/A'}
                            capaNum={capaSeleccionada?.capa || capaSeleccionada?.capaNum || 'N/A'}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Mensaje cuando no hay capa seleccionada o fecha válida */}
                  {vista === "asist" && (!capaSeleccionada || typeof capaSeleccionada !== 'object' || capaSeleccionada === null || !(capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio)) && (
                    <div className="text-center py-8">
                      <div className="text-gray-500 text-lg mb-4">
                        📊 Selecciona una capa válida para ver los datos de asistencia
                      </div>
                      <div className="text-gray-400 text-sm">
                        {!capaSeleccionada 
                          ? 'No hay capa seleccionada' 
                          : typeof capaSeleccionada !== 'object' || capaSeleccionada === null
                          ? 'La capa seleccionada no es válida'
                          : 'La capa seleccionada no tiene fecha de inicio válida'
                        }
                      </div>
                    </div>
                  )}

          {vista === "eval" && (
            <div className="w-full">
              <EvaluacionesTable />
            </div>
          )}

          {vista === "deser" && (
            <div className="w-full">
              <DesercionesTable
                campania={capaSeleccionada?.CampañaID || capaSeleccionada?.campaniaId}
                capaNum={capaSeleccionada?.capa || capaSeleccionada?.capaNum}
              />
            </div>
          )}
        </div>
      </div>

      {/* Popover para motivo de deserción */}
      {popover.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Motivo de la Deserción
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo:
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#297373] focus:border-[#297373]"
                rows={4}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Describe el motivo de la deserción..."
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cerrarPopoverDesercion}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarDesercion}
                disabled={!motivo.trim() || guardando}
                className="px-4 py-2 bg-[#297373] text-white rounded-md hover:bg-[#297373]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  "Guardar Deserción"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapacitacionesFullscreen;
