import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const ActualizarEmpleado = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para los catálogos
  const [catalogos, setCatalogos] = useState({
    jornadas: [],
    campanias: [],
    cargos: [],
    modalidades: []
  });

  // Cache de grupos y horas
  const [gruposHorasCache, setGruposHorasCache] = useState([]);

  // Estado del empleado actual
  const [empleadoActual, setEmpleadoActual] = useState(null);
  const [horarioInfo, setHorarioInfo] = useState(null);

  // Estado del formulario
  const [formData, setFormData] = useState({
    DNI: '',
    Nombres: '',
    ApellidoPaterno: '',
    ApellidoMaterno: '',
    FechaContratacion: '',
    JornadaID: '',
    CampañaID: '',
    CargoID: '',
    ModalidadID: '',
    GrupoHorarioID: '',
    SupervisorDNI: '',
    CoordinadorDNI: '',
    JefeDNI: ''
  });

  // Estados para la lógica de horarios
  const [turnos, setTurnos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [descansos, setDescansos] = useState([]);

  // Estados para autocompletado
  const [supervisores, setSupervisores] = useState([]);
  const [coordinadores, setCoordinadores] = useState([]);
  const [jefes, setJefes] = useState([]);

  // Mapa de prefijos de jornada
  const prefijoJornada = { 1: "Full Time", 3: "Part Time", 2: "Semi Full" };

  // Obtener DNI del localStorage
  const dni = localStorage.getItem('empleadoDNI');
  const nombreEmpleado = localStorage.getItem('empleadoNombre');

  // Cargar datos al montar el componente
  useEffect(() => {
    if (!dni) {
      setError('No se ha seleccionado un empleado. Regrese al dashboard.');
      return;
    }

    cargarDatosIniciales();
  }, [dni]);

  // Cargar datos iniciales
  const cargarDatosIniciales = async () => {
    try {
      await Promise.all([
        cargarCatalogos(),
        precargarGruposHoras(),
        cargarEmpleado()
      ]);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      setError('Error al cargar datos iniciales');
    }
  };

  // Cargar catálogos
  const cargarCatalogos = async () => {
    try {
      const response = await api.get('/catalogos');
      if (response.data.success) {
        setCatalogos(response.data.catalogos);
      }
    } catch (error) {
      console.error('Error cargando catálogos:', error);
      setError('Error cargando catálogos');
    }
  };

  // Precargar grupos y horas
  const precargarGruposHoras = async () => {
    try {
      const response = await api.get('/grupos/horas');
      if (response.data.success) {
        setGruposHorasCache(response.data.data);
      }
    } catch (error) {
      console.error('Error precargando grupos y horas:', error);
    }
  };

  // Cargar empleado
  const cargarEmpleado = async () => {
    try {
      const response = await api.get(`/empleados/${dni}`);
      if (response.data.success) {
        const empleado = response.data.data;
        setEmpleadoActual(empleado);
        
        // Cargar información de horario
        await cargarHorarioEmpleado(dni);
        
        // Llenar formulario con datos actuales
    setFormData({
          DNI: empleado.DNI || '',
          Nombres: empleado.Nombres || '',
          ApellidoPaterno: empleado.ApellidoPaterno || '',
          ApellidoMaterno: empleado.ApellidoMaterno || '',
          FechaContratacion: empleado.FechaContratacion ? empleado.FechaContratacion.split('T')[0] : '',
          JornadaID: empleado.JornadaID || '',
          CampañaID: empleado.CampañaID || '',
          CargoID: empleado.CargoID || '',
          ModalidadID: empleado.ModalidadID || '',
          GrupoHorarioID: empleado.GrupoHorarioID || '',
          SupervisorDNI: empleado.SupervisorDNI || '',
          CoordinadorDNI: empleado.CoordinadorDNI || '',
          JefeDNI: empleado.JefeDNI || ''
        });
      } else {
        setError('Error al cargar empleado');
      }
    } catch (error) {
      console.error('Error cargando empleado:', error);
      setError('Error al cargar empleado');
    }
  };

  // Cargar horario del empleado
  const cargarHorarioEmpleado = async (dni) => {
    try {
      const response = await api.get(`/empleados/${dni}/horario`);
      if (response.data.success) {
        setHorarioInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error obteniendo horario:', error);
    }
  };

  // Al cambiar jornada -> filtrar turnos y horarios
  const handleJornadaChange = (jornadaID) => {
    setFormData(prev => ({ ...prev, JornadaID: jornadaID }));
    
    const prefijo = prefijoJornada[jornadaID] || "";
    
    // Limpiar turnos, horarios y descansos
    setTurnos([]);
    setHorarios([]);
    setDescansos([]);
    setFormData(prev => ({ 
      ...prev, 
      GrupoHorarioID: ''
    }));

    if (!prefijo) return;

    // ¿existe Mañana? ¿existe Tarde?
    const hayManana = gruposHorasCache.some(g => g.NombreBase.startsWith(prefijo + " Mañana"));
    const hayTarde = gruposHorasCache.some(g => g.NombreBase.startsWith(prefijo + " Tarde"));

    const nuevosTurnos = [];
    if (hayManana) nuevosTurnos.push("Mañana");
    if (hayTarde) nuevosTurnos.push("Tarde");
    
    setTurnos(nuevosTurnos);
  };

  // Al cambiar turno -> llenar horarios
  const handleTurnoChange = (turno) => {
    const prefijo = prefijoJornada[formData.JornadaID] || "";
    
    if (!turno) {
      setHorarios([]);
      setDescansos([]);
      return;
    }

    const filtrados = gruposHorasCache.filter(g =>
      g.NombreBase.startsWith(`${prefijo} ${turno}`)
    );

    const nuevosHorarios = filtrados.map(g => ({
      nombre: g.NombreBase,
      horaIni: g.HoraIni,
      horaFin: g.HoraFin
    }));

    setHorarios(nuevosHorarios);
    setDescansos([]);
  };

  // Al cambiar horario -> cargar descansos
  const handleHorarioChange = async (horarioNombre) => {
    if (!horarioNombre) {
      setDescansos([]);
      return;
    }

    try {
      const response = await api.get(`/grupos/${encodeURIComponent(horarioNombre)}`);
      if (response.data.success) {
        const desc = response.data.data.variantes;
        
        // 1. Mapa Día → objeto
        const map = desc.reduce((acc, d) => {
          const dia = d.NombreGrupo.match(/\(Desc\. ([^)]+)\)/i)?.[1] || d.NombreGrupo;
          acc[dia] = { id: d.GrupoID, texto: dia };
          return acc;
        }, {});

        // 2. Orden deseado
        const orden = ["Dom", "Sab", "Lun", "Mar", "Mie", "Jue", "Vie"];

        // 3. Genera las opciones en ese orden
        const nuevosDescansos = orden
          .filter(d => map[d])
          .map(d => ({ id: map[d].id, texto: map[d].texto }));

        setDescansos(nuevosDescansos);
      }
    } catch (error) {
      console.error('Error cargando descansos:', error);
      setError('Error cargando opciones de descanso');
    }
  };

  // Cargar datalist para autocompletado
  const cargarDatalist = useCallback(async (cargoID, search = "") => {
    try {
      const response = await api.get(`/empleados/lookup?cargo=${cargoID}&search=${search}`);
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error cargando datalist:', error);
      return [];
    }
  }, [api]);

  // Cargar supervisores
  const cargarSupervisores = useCallback(async (search) => {
    if (search.length >= 2) {
      const data = await cargarDatalist("5", search);
      setSupervisores(data);
    }
  }, [cargarDatalist]);

  // Cargar coordinadores
  const cargarCoordinadores = useCallback(async (search) => {
    if (search.length >= 2) {
      const data = await cargarDatalist("2,8", search);
      setCoordinadores(data);
    }
  }, [cargarDatalist]);

  // Cargar jefes
  const cargarJefes = useCallback(async (search) => {
    if (search.length >= 2) {
      const data = await cargarDatalist("8", search);
      setJefes(data);
    }
  }, [cargarDatalist]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Lógica específica para cambios de jornada y turno
    if (field === 'JornadaID') {
      handleJornadaChange(value);
    } else if (field === 'turno') {
      handleTurnoChange(value);
    } else if (field === 'horario') {
      handleHorarioChange(value);
    }
  };

  // Configurar horarios iniciales al editar
  const configurarHorariosIniciales = async () => {
    if (!formData.JornadaID || !formData.GrupoHorarioID) return;

    const prefijo = prefijoJornada[formData.JornadaID] || "";
    
    // Configurar turnos según jornada
    const hayManana = gruposHorasCache.some(g => g.NombreBase.startsWith(prefijo + " Mañana"));
    const hayTarde = gruposHorasCache.some(g => g.NombreBase.startsWith(prefijo + " Tarde"));
    
    const nuevosTurnos = [];
    if (hayManana) nuevosTurnos.push("Mañana");
    if (hayTarde) nuevosTurnos.push("Tarde");
    setTurnos(nuevosTurnos);

    // Buscar el horario base actual
    if (horarioInfo?.NombreBase) {
      // Determinar turno
      let turnoActual = '';
      if (horarioInfo.NombreBase.includes("Mañana")) {
        turnoActual = "Mañana";
      } else if (horarioInfo.NombreBase.includes("Tarde")) {
        turnoActual = "Tarde";
      }

      if (turnoActual) {
        // Configurar horario base
        const filtrados = gruposHorasCache.filter(g =>
          g.NombreBase.startsWith(`${prefijo} ${turnoActual}`)
        );

        const nuevosHorarios = filtrados.map(g => ({
          nombre: g.NombreBase,
          horaIni: g.HoraIni,
          horaFin: g.HoraFin
        }));

        setHorarios(nuevosHorarios);

        // Cargar descansos
        if (horarioInfo.NombreBase) {
          try {
            const response = await api.get(`/grupos/${encodeURIComponent(horarioInfo.NombreBase)}`);
            if (response.data.success) {
              const desc = response.data.data.variantes;
              
              const map = desc.reduce((acc, d) => {
                const dia = d.NombreGrupo.match(/\(Desc\. ([^)]+)\)/i)?.[1] || d.NombreGrupo;
                acc[dia] = { id: d.GrupoID, texto: dia };
                return acc;
              }, {});
              
              const orden = ["Dom","Sab","Lun","Mar","Mie","Jue","Vie"];
              
              const nuevosDescansos = orden
                .filter(d => map[d])
                .map(d => ({ 
                  id: map[d].id, 
                  texto: map[d].texto 
                }));

              setDescansos(nuevosDescansos);
            }
          } catch (error) {
            console.error('Error cargando descansos iniciales:', error);
          }
        }
      }
    }
  };

  // Iniciar edición
  const iniciarEdicion = async () => {
    setIsEditing(true);
    await configurarHorariosIniciales();
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setIsEditing(false);
    // Restaurar datos originales
    if (empleadoActual) {
      setFormData({
        DNI: empleadoActual.DNI || '',
        Nombres: empleadoActual.Nombres || '',
        ApellidoPaterno: empleadoActual.ApellidoPaterno || '',
        ApellidoMaterno: empleadoActual.ApellidoMaterno || '',
        FechaContratacion: empleadoActual.FechaContratacion ? empleadoActual.FechaContratacion.split('T')[0] : '',
        JornadaID: empleadoActual.JornadaID || '',
        CampañaID: empleadoActual.CampañaID || '',
        CargoID: empleadoActual.CargoID || '',
        ModalidadID: empleadoActual.ModalidadID || '',
        GrupoHorarioID: empleadoActual.GrupoHorarioID || '',
        SupervisorDNI: empleadoActual.SupervisorDNI || '',
        CoordinadorDNI: empleadoActual.CoordinadorDNI || '',
        JefeDNI: empleadoActual.JefeDNI || ''
      });
    }
    setError('');
    setSuccess('');
  };

  // Actualizar empleado
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        Nombres: formData.Nombres.trim(),
        ApellidoPaterno: formData.ApellidoPaterno.trim(),
        ApellidoMaterno: formData.ApellidoMaterno.trim() || null,
        FechaContratacion: formData.FechaContratacion,
        JornadaID: parseInt(formData.JornadaID),
        CampañaID: parseInt(formData.CampañaID),
        CargoID: parseInt(formData.CargoID),
        ModalidadID: parseInt(formData.ModalidadID),
        GrupoHorarioID: parseInt(formData.GrupoHorarioID),
        SupervisorDNI: formData.SupervisorDNI.trim() || null,
        CoordinadorDNI: formData.CoordinadorDNI.trim() || null,
        JefeDNI: formData.JefeDNI.trim() || null
      };

      console.log('📤 Enviando datos de actualización:', payload);
      const response = await api.put(`/empleados/${formData.DNI}`, payload);
      
      if (response.data.success) {
        setSuccess('Empleado actualizado exitosamente');
        
        // Recargar datos del empleado
        await cargarEmpleado();
        
        // Volver a vista de solo lectura
        setIsEditing(false);
      } else {
        setError(response.data.message || 'Error actualizando empleado');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Si no hay empleado seleccionado
  if (!dni) {
    return (
      <Box>
        <Card sx={{ mb: 4 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EditIcon sx={{ mr: 2, fontSize: '2rem' }} />
                <Typography variant="h4">Actualizar Empleado</Typography>
              </Box>
            }
            action={
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/')}
              >
                Volver al Dashboard
              </Button>
            }
          />
        </Card>
        
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            No se ha seleccionado un empleado. Regrese al dashboard.
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
          >
            Volver al Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  // Si está cargando
  if (!empleadoActual) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EditIcon sx={{ mr: 2, fontSize: '2rem' }} />
              <Typography variant="h4">Actualizar Empleado</Typography>
            </Box>
          }
          subtitle={
            <Typography variant="body1" sx={{ mt: 1, color: '#64748b' }}>
              {nombreEmpleado} - DNI: {dni}
            </Typography>
          }
          action={
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
            >
              Volver al Dashboard
            </Button>
          }
        />
      </Card>

      {/* Mensajes */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

      {/* Vista de solo lectura */}
      {!isEditing && (
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#1e40af' }}>
              Información del Empleado
            </Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={iniciarEdicion}
            >
              Editar Empleado
            </Button>
          </Box>

          {/* Grid de datos en tarjetas individuales */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 2, 
            mb: 3 
          }}>
            {/* Información Personal */}
            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                DNI
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {empleadoActual.DNI}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Nombres
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {empleadoActual.Nombres}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Apellido Paterno
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {empleadoActual.ApellidoPaterno}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Apellido Materno
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {empleadoActual.ApellidoMaterno || 'No especificado'}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Fecha de Contratación
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {empleadoActual.FechaContratacion ? new Date(empleadoActual.FechaContratacion).toLocaleDateString('es-ES') : 'No especificada'}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Estado
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {empleadoActual.EstadoEmpleado || 'Activo'}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Jornada
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {catalogos.jornadas?.find(j => j.id === empleadoActual.JornadaID)?.nombre || 'No especificada'}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Campaña
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {catalogos.campanias?.find(c => c.id === empleadoActual.CampañaID)?.nombre || 'No especificada'}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Cargo
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {catalogos.cargos?.find(c => c.id === empleadoActual.CargoID)?.nombre || 'No especificada'}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Modalidad
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {catalogos.modalidades?.find(m => m.id === empleadoActual.ModalidadID)?.nombre || 'No especificada'}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Horario
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {horarioInfo?.NombreGrupo || 'No especificado'}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Supervisor DNI
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {empleadoActual.SupervisorDNI || 'No especificado'}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Coordinador DNI
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {empleadoActual.CoordinadorDNI || 'No especificado'}
              </Typography>
            </Box>

            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 1,
              minHeight: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#64748b', 
                fontSize: '0.875rem', 
                mb: 0.5 
              }}>
                Jefe DNI
              </Typography>
              <Typography sx={{ color: '#1e293b', fontSize: '1rem' }}>
                {empleadoActual.JefeDNI || 'No especificado'}
              </Typography>
            </Box>
          </Box>

          {/* Botones de acción */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 2, 
            mt: 3 
          }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={iniciarEdicion}
              sx={{ 
                px: 4, 
                py: 1.5,
                backgroundColor: '#1e40af',
                '&:hover': { backgroundColor: '#1e3a8a' }
              }}
            >
              Editar Empleado
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{ 
                px: 4, 
                py: 1.5,
                borderColor: '#64748b',
                color: '#64748b',
                '&:hover': { 
                  borderColor: '#475569',
                  backgroundColor: '#f8fafc'
                }
              }}
            >
              Volver al Dashboard
            </Button>
          </Box>
        </Paper>
      )}

      {/* Formulario de edición */}
      {isEditing && (
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#1e40af' }}>
              Editar Empleado
            </Typography>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={cancelarEdicion}
            >
              Cancelar Edición
            </Button>
          </Box>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Información Personal */}
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
            Información Personal
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="DNI *"
                  value={formData.DNI}
                disabled
                sx={{ backgroundColor: '#f8fafc' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombres *"
                  value={formData.Nombres}
                  onChange={(e) => handleInputChange('Nombres', e.target.value)}
                required
                placeholder="Juan Carlos"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido Paterno *"
                  value={formData.ApellidoPaterno}
                  onChange={(e) => handleInputChange('ApellidoPaterno', e.target.value)}
                required
                placeholder="García"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido Materno"
                  value={formData.ApellidoMaterno}
                  onChange={(e) => handleInputChange('ApellidoMaterno', e.target.value)}
                placeholder="López"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                  label="Fecha de Contratación *"
                type="date"
                  value={formData.FechaContratacion}
                  onChange={(e) => handleInputChange('FechaContratacion', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

            {/* Registro del Empleado */}
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
              Registro del Empleado
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Campaña</InputLabel>
                <Select
                    value={formData.CampañaID}
                    onChange={(e) => handleInputChange('CampañaID', e.target.value)}
                  label="Campaña"
                >
                    <MenuItem value="" disabled>-- Elegir --</MenuItem>
                    {catalogos.campanias?.map((campania) => (
                    <MenuItem key={campania.id} value={campania.id}>
                      {campania.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
              <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Cargo</InputLabel>
                <Select
                    value={formData.CargoID}
                    onChange={(e) => handleInputChange('CargoID', e.target.value)}
                  label="Cargo"
                >
                    <MenuItem value="" disabled>-- Elegir --</MenuItem>
                    {catalogos.cargos?.map((cargo) => (
                    <MenuItem key={cargo.id} value={cargo.id}>
                      {cargo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
              <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                  <InputLabel>Modalidad</InputLabel>
                <Select
                    value={formData.ModalidadID}
                    onChange={(e) => handleInputChange('ModalidadID', e.target.value)}
                    label="Modalidad"
                  >
                    <MenuItem value="" disabled>-- Elegir --</MenuItem>
                    {catalogos.modalidades?.map((modalidad) => (
                    <MenuItem key={modalidad.id} value={modalidad.id}>
                      {modalidad.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Registro Horario */}
            <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
              Registro Horario
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
              <FormControl fullWidth required>
                  <InputLabel>Jornada</InputLabel>
                <Select
                    value={formData.JornadaID}
                    onChange={(e) => handleInputChange('JornadaID', e.target.value)}
                    label="Jornada"
                  >
                    <MenuItem value="" disabled>-- Elegir --</MenuItem>
                    {catalogos.jornadas?.map((jornada) => (
                      <MenuItem key={jornada.id} value={jornada.id}>
                        {jornada.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
              <Grid item xs={12} md={3}>
              <FormControl sx={{ width: '8rem' }} required>
                  <InputLabel>Turno</InputLabel>
                  <Select
                    value={formData.turno || ''}
                    onChange={(e) => handleInputChange('turno', e.target.value)}
                    label="Turno"
                    disabled={!formData.JornadaID}
                  >
                    <MenuItem value="" disabled>-- Elegir --</MenuItem>
                    {turnos.map((turno) => (
                      <MenuItem key={turno} value={turno}>
                        {turno}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
              <FormControl sx={{ width: '8rem' }} required>
                  <InputLabel>Horario</InputLabel>
                  <Select
                    value={formData.horario || ''}
                    onChange={(e) => handleInputChange('horario', e.target.value)}
                    label="Horario"
                    disabled={!formData.turno}
                  >
                    <MenuItem value="" disabled>-- Elegir --</MenuItem>
                    {horarios.map((horario) => (
                      <MenuItem key={horario.nombre} value={horario.nombre}>
                        {horario.horaIni} - {horario.horaFin}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
              <FormControl sx={{ width: '8rem' }} required>
                  <InputLabel>Descanso</InputLabel>
                  <Select
                    value={formData.GrupoHorarioID}
                    onChange={(e) => handleInputChange('GrupoHorarioID', e.target.value)}
                    label="Descanso"
                    disabled={!formData.horario}
                  >
                    <MenuItem value="" disabled>-- Elegir descanso --</MenuItem>
                    {descansos.map((descanso) => (
                      <MenuItem key={descanso.id} value={descanso.id}>
                        {descanso.texto}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

            {/* DNIs de Referencia */}
          <Typography variant="h6" sx={{ mb: 3, color: '#1e40af' }}>
              DNIs de Referencia
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                  label="Supervisor DNI"
                  value={formData.SupervisorDNI}
                  onChange={(e) => {
                    handleInputChange('SupervisorDNI', e.target.value);
                    cargarSupervisores(e.target.value);
                  }}
                  placeholder="Buscar supervisor..."
                />
                {/* Lista de sugerencias */}
                {supervisores.length > 0 && (
                  <Box sx={{ 
                    mt: 1, 
                    maxHeight: 200, 
                    overflow: 'auto', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 1,
                    backgroundColor: 'white',
                    position: 'relative',
                    zIndex: 9999,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}>
                    {supervisores.map((supervisor, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#f1f5f9' },
                          borderBottom: index < supervisores.length - 1 ? '1px solid #e2e8f0' : 'none'
                        }}
                        onClick={() => {
                          handleInputChange('SupervisorDNI', supervisor.DNI);
                          setSupervisores([]);
                        }}
                      >
                        {supervisor.DNI} - {supervisor.NOMBRECOMPLETO || supervisor.NombreCompleto || 'Sin nombre'}
                      </Box>
                    ))}
                  </Box>
                )}
            </Grid>
              <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                  label="Coordinador DNI"
                  value={formData.CoordinadorDNI}
                  onChange={(e) => {
                    handleInputChange('CoordinadorDNI', e.target.value);
                    cargarCoordinadores(e.target.value);
                  }}
                  placeholder="Buscar coordinador..."
                />
                {/* Lista de sugerencias */}
                {coordinadores.length > 0 && (
                  <Box sx={{ 
                    mt: 1, 
                    maxHeight: 200, 
                    overflow: 'auto', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 1,
                    backgroundColor: 'white',
                    position: 'relative',
                    zIndex: 9999,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}>
                    {coordinadores.map((coordinador, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#f1f5f9' },
                          borderBottom: index < coordinadores.length - 1 ? '1px solid #e2e8f0' : 'none'
                        }}
                        onClick={() => {
                          handleInputChange('CoordinadorDNI', coordinador.DNI);
                          setCoordinadores([]);
                        }}
                      >
                        {coordinador.DNI} - {coordinador.NOMBRECOMPLETO || coordinador.NombreCompleto || 'Sin nombre'}
                      </Box>
                    ))}
                  </Box>
                )}
            </Grid>
              <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                  label="Jefe DNI"
                  value={formData.JefeDNI}
                  onChange={(e) => {
                    handleInputChange('JefeDNI', e.target.value);
                    cargarJefes(e.target.value);
                  }}
                  placeholder="Buscar jefe..."
                />
                {/* Lista de sugerencias */}
                {jefes.length > 0 && (
                  <Box sx={{ 
                    mt: 1, 
                    maxHeight: 200, 
                    overflow: 'auto', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 1,
                    backgroundColor: 'white',
                    position: 'relative',
                    zIndex: 9999,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}>
                    {jefes.map((jefe, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#f1f5f9' },
                          borderBottom: index < jefes.length - 1 ? '1px solid #e2e8f0' : 'none'
                        }}
                        onClick={() => {
                          handleInputChange('JefeDNI', jefe.DNI);
                          setJefes([]);
                        }}
                      >
                        {jefe.DNI} - {jefe.NOMBRECOMPLETO || jefe.NombreCompleto || 'Sin nombre'}
                      </Box>
                    ))}
                  </Box>
                )}
            </Grid>
          </Grid>

          {/* Botones de acción */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
              sx={{ px: 4, py: 1.5 }}
            >
              {loading ? 'Actualizando...' : 'Actualizar Empleado'}
            </Button>
          </Box>
        </Box>
      </Paper>
      )}
    </Box>
  );
};

export default ActualizarEmpleado;
