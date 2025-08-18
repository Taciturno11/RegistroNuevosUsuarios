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
    if (isAuthenticated && !isLoading && capaSeleccionada) {
      const cargarDatosAsistencia = async () => {
        try {
          console.log('🔄 Cargando datos de asistencia para capa:', capaSeleccionada);
          
          // Cargar postulantes y asistencias (el endpoint /postulantes devuelve ambos)
          const postulantesData = await api(`/api/capacitaciones/postulantes?campaniaID=${capaSeleccionada.CampañaID || capaSeleccionada.campaniaId}&mes=${(capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio).substring(0, 7)}&fechaInicio=${capaSeleccionada.fechaInicio || capaSeleccionada.fecha_inicio}`);
          console.log('✅ Postulantes y asistencias cargados:', postulantesData);
          
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
                return asistenciaDia ? asistenciaDia.estado_asistencia : "";
              });
              
              return {
                ...postulante,
                asistencia,
                dni: postulante.dni,
                nombres: postulante.nombre ? postulante.nombre.split(' ')[0] : "",
                apellidos: postulante.nombre ? postulante.nombre.split(' ').slice(1).join(' ') : "",
                NombreJornada: postulante.NombreJornada || "N/A",
                resultadoFinal: postulante.EstadoPostulante || "",
                turno: "",
                horario: ""
              };
            });
          }
          
          // Actualizar estado local
          setTablaDatos(tablaCompleta);
          setDias(diasGenerados);
          setCapCount(capCount); // Actualizar el estado capCount
          
          console.log('✅ Tabla de asistencia generada:', tablaCompleta);
          console.log('✅ Días generados:', diasGenerados);
          
        } catch (error) {
          console.error('Error cargando datos de asistencia:', error);
        }
      };
      
      cargarDatosAsistencia();
    }
  }, [isAuthenticated, isLoading, capaSeleccionada]);

  // Función para manejar cambios en asistencia
  const handleAsistenciaChange = (rowIndex, colIndex, newValue) => {
    const newTablaDatos = [...tablaDatos];
    if (newTablaDatos[rowIndex] && newTablaDatos[rowIndex].asistencia) {
      newTablaDatos[rowIndex].asistencia[colIndex] = newValue;
      setTablaDatos(newTablaDatos);
      console.log(`Asistencia cambiada: Fila ${rowIndex}, Columna ${colIndex}, Valor: ${newValue}`);
    }
  };

  // Función para manejar deserción
  const handleDesercion = (rowIndex, colIndex, motivo) => {
    const newTablaDatos = [...tablaDatos];
    if (newTablaDatos[rowIndex] && newTablaDatos[rowIndex].asistencia) {
      newTablaDatos[rowIndex].asistencia[colIndex] = "Deserción";
      setTablaDatos(newTablaDatos);
      console.log(`Deserción registrada: Fila ${rowIndex}, Columna ${colIndex}, Motivo: ${motivo}`);
    }
  };

  // Función para renovar token manualmente
  const renovarTokenManual = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Renovando token manualmente...');
      
      const response = await fetch('http://localhost:3001/api/capacitaciones/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dni: '70907372' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
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

  // Si no hay usuario o está cargando, mostrar mensaje de carga
  if (!user || isLoading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#e5e7eb] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#297373] mx-auto mb-4"></div>
          <p className="text-[#297373] text-lg">Cargando información del capacitador...</p>
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <div className="flex items-center px-6 py-4 bg-white shadow-md rounded-b-3xl mb-4 relative" style={{ minHeight: 120 }}>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 bg-[#297373]/20 rounded-full p-2 flex items-center justify-center">
            <img src={partnerLogo} alt="Logo" className="w-8 h-8" />
          </div>
          <div>
            <span className="font-semibold text-[#297373] text-lg">
              Hola, bienvenido {user?.nombre || user?.nombres || 'Usuario'} 👋
            </span>
          </div>
        </div>

        {/* Toggle y KPIs */}
        <div className="flex items-center gap-6 ml-8">
          {/* Toggle Asistencias/Evaluaciones */}
          <div className="flex bg-[#297373]/10 rounded-lg p-1">
            <button
              onClick={() => setVista("asist")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                vista === "asist"
                  ? "bg-[#297373] text-white shadow-md"
                  : "text-[#297373] hover:bg-[#297373]/10"
              }`}
            >
              Asistencias
            </button>
            <button
              onClick={() => setVista("eval")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                vista === "eval"
                  ? "bg-[#297373] text-white shadow-md"
                  : "text-[#297373] hover:bg-[#297373]/10"
              }`}
            >
              Evaluaciones
            </button>
          </div>

          {/* Botón Ver Resumen */}
          <button
            onClick={() => setShowResumen(!showResumen)}
            className="px-4 py-2 bg-[#297373]/10 text-[#297373] font-medium rounded-lg hover:bg-[#297373]/20 transition-all border border-[#297373]/20"
          >
            Ver Resumen
          </button>

          {/* KPI Activos */}
          <div className="bg-green-500/80 px-4 py-2 rounded-lg text-white text-center min-w-[80px]">
            <div className="text-xl font-bold">
              {tablaDatos.filter(p => !p.asistencia?.some(a => a === "Deserción")).length}
            </div>
            <div className="text-xs opacity-90">
              {tablaDatos.length > 0
                ? Math.round((tablaDatos.filter(p => !p.asistencia?.some(a => a === "Deserción")).length / tablaDatos.length) * 100)
                : 0}%
            </div>
            <div className="text-xs opacity-90">Activos</div>
          </div>

          {/* KPI Bajas */}
          <div className="bg-red-500/80 px-4 py-2 rounded-lg text-white text-center min-w-[80px]">
            <div className="text-xl font-bold">
              {tablaDatos.filter(p => p.asistencia?.some(a => a === "Deserción")).length}
            </div>
            <div className="text-xs opacity-90">
              {tablaDatos.length > 0
                ? Math.round((tablaDatos.filter(p => p.asistencia?.some(a => a === "Deserción")).length / tablaDatos.length) * 100)
                : 0}%
            </div>
            <div className="text-xs opacity-90">Bajas</div>
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
        {capaSeleccionada && (
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
          {vista === "asist" && (
            <div className="w-full">
              <AsistenciasTable
                dniCap={capaSeleccionada?.dniCap || capaSeleccionada?.dni_capacitador}
                CampañaID={capaSeleccionada?.CampañaID || capaSeleccionada?.campaniaId}
                capaNum={capaSeleccionada?.capa || capaSeleccionada?.capaNum}
                tablaDatos={tablaDatos}
                dias={dias}
                horariosBase={horariosBase}
                onAsistenciaChange={handleAsistenciaChange}
                onDesercion={handleDesercion}
                capCount={capCount}
                jornadaFiltro={jornadaFiltro}
              />
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
    </div>
  );
};

export default CapacitacionesFullscreen;
