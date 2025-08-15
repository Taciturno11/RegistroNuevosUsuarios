import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Card,
  CardHeader,
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
  Autocomplete
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const RegistrarEmpleado = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para los catálogos
  const [catalogos, setCatalogos] = useState({
    jornadas: [],
    campanias: [],
    cargos: [],
    modalidades: []
  });

  // Cache de grupos y horas
  const [gruposHorasCache, setGruposHorasCache] = useState([]);

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

  // Cargar catálogos al montar el componente
  useEffect(() => {
    cargarCatalogos();
    precargarGruposHoras();
  }, []);

  // Cargar catálogos principales
  const cargarCatalogos = async () => {
    try {
      const response = await api.get('/catalogos');
      if (response.data.success) {
        setCatalogos(response.data.catalogos);
      }
    } catch (error) {
      console.error('Error cargando catálogos:', error);
      setError('Error cargando catálogos. Intente recargar la página.');
    }
  };

  // Precargar grupos y horas (una sola vez)
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
      GrupoHorarioID: '',
      // Resetear campos relacionados
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        dni: formData.DNI.trim(),
        nombres: formData.Nombres.trim(),
        apellidoPaterno: formData.ApellidoPaterno.trim(),
        apellidoMaterno: formData.ApellidoMaterno.trim() || null,
        fechaContratacion: formData.FechaContratacion,
        jornadaID: parseInt(formData.JornadaID),
        campañaID: parseInt(formData.CampañaID),
        cargoID: parseInt(formData.CargoID),
        modalidadID: parseInt(formData.ModalidadID),
        grupoHorarioID: parseInt(formData.GrupoHorarioID),
        supervisorDNI: formData.SupervisorDNI.trim() || null,
        coordinadorDNI: formData.CoordinadorDNI.trim() || null,
        jefeDNI: formData.JefeDNI.trim() || null
      };

      console.log('📤 Enviando datos al backend:', payload);
      const response = await api.post('/empleados', payload);
      
      if (response.data.success) {
        setSuccess('Empleado registrado exitosamente');
        // Limpiar formulario
        setFormData({
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
        
        // Limpiar estados de horarios
        setTurnos([]);
        setHorarios([]);
        setDescansos([]);
        
        // No redirigir, solo mostrar mensaje de éxito
      } else {
        setError(response.data.message || 'Error registrando empleado');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
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
    setTurnos([]);
    setHorarios([]);
    setDescansos([]);
    setError('');
    setSuccess('');
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonAddIcon sx={{ mr: 2, fontSize: '2rem' }} />
              <Typography variant="h4">Registrar Nuevo Empleado</Typography>
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

      {/* Formulario */}
      <Paper sx={{ p: 4 }}>
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

        <Box component="form" onSubmit={handleSubmit}>
          {/* Información Personal */}
          <Box sx={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '0.5rem', 
            p: 2, 
            mb: 2 
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1e40af', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: '#1e40af', 
                borderRadius: '0.375rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontSize: '0.75rem',
                mr: 1
              }}>
                👤
              </Box>
              Información Personal
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="DNI *"
                  value={formData.DNI}
                  onChange={(e) => handleInputChange('DNI', e.target.value)}
                  required
                  inputProps={{ maxLength: 12 }}
                  placeholder="12345678"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Nombres *"
                  value={formData.Nombres}
                  onChange={(e) => handleInputChange('Nombres', e.target.value)}
                  required
                  placeholder="Juan Carlos"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Apellido Paterno *"
                  value={formData.ApellidoPaterno}
                  onChange={(e) => handleInputChange('ApellidoPaterno', e.target.value)}
                  required
                  placeholder="García"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Apellido Materno"
                  value={formData.ApellidoMaterno}
                  onChange={(e) => handleInputChange('ApellidoMaterno', e.target.value)}
                  placeholder="López"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Registro del Empleado */}
          <Box sx={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '0.5rem', 
            p: 2, 
            mb: 2 
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1e40af', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: '#1e40af', 
                borderRadius: '0.375rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontSize: '0.75rem',
                mr: 1
              }}>
                📅
              </Box>
              Registro del Empleado
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
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
              <Grid item xs={12} md={4}>
              <FormControl sx={{ width: '8rem' }} required>
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
              <FormControl sx={{ width: '8rem' }} required>
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
            </Grid>
          </Box>

          {/* Registro Horario */}
          <Box sx={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '0.5rem', 
            p: 2, 
            mb: 2 
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1e40af', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: '#1e40af', 
                borderRadius: '0.375rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontSize: '0.75rem',
                mr: 1
              }}>
                🕐
              </Box>
              Registro Horario
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
              <FormControl sx={{ width: '8rem' }} required>
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
              <Grid item xs={12} md={2}>
              <FormControl sx={{ width: '7rem' }} required>
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
              <Grid item xs={12} md={2}>
              <FormControl sx={{ width: '8rem' }} required>
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
          </Box>

          {/* DNIs de Referencia */}
          <Box sx={{ 
            backgroundColor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '0.5rem', 
            p: 2, 
            mb: 2 
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1e40af', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: '#1e40af', 
                borderRadius: '0.375rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontSize: '0.75rem',
                mr: 1
              }}>
                👥
              </Box>
              DNIs de Referencia
            </Typography>
            
            <Grid container spacing={2}>
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
                   <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
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
                   <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
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
                   <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
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
          </Box>

                     {/* Botones de acción */}
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
             <Button
               variant="outlined"
               startIcon={<ArrowBackIcon />}
               onClick={() => navigate('/')}
             >
               Volver al Dashboard
             </Button>
             
             <Box sx={{ display: 'flex', gap: 2 }}>
               <Button
                 variant="outlined"
                 color="secondary"
                 onClick={handleClear}
                 disabled={loading}
               >
                 Limpiar Formulario
               </Button>
               
               <Button
                 type="submit"
                 variant="contained"
                 size="large"
                 startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                 disabled={loading}
                 sx={{ px: 4, py: 1.5 }}
               >
                 {loading ? 'Guardando...' : 'Guardar Empleado'}
               </Button>
             </Box>
           </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegistrarEmpleado;
