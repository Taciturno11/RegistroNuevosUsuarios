const API = "";              // mismo host:puerto, vacío = relativa a la misma IP

/* ============ 0. Mapa JornadaID → prefijo ============ */
const prefijoJornada = { 1: "Full Time", 3: "Part Time", 2: "Semi Full" };
let gruposHorasCache = [];            // se llenará 1 sola vez
let catalogosCache = {};              // cache para los catálogos

// Obtener DNI del localStorage
const dni = localStorage.getItem('empleadoDNI');
const nombreEmpleado = localStorage.getItem('empleadoNombre');

/* ============ 1. INICIALIZACIÓN ============ */
document.addEventListener('DOMContentLoaded', async () => {
  if (!dni) {
    mostrarMsg(false, { error: "No se ha seleccionado un empleado. Regrese al dashboard." });
    return;
  }

  // Mostrar información del empleado
  document.getElementById("employeeName").textContent = nombreEmpleado || "Empleado";
  document.getElementById("employeeDNI").textContent = `DNI: ${dni}`;

  // Cargar datos iniciales
  await cargarCatalogos();
  await precargarGruposHoras();
  
  // Cargar información del empleado
  await cargarEmpleado();
  
  // Configurar eventos
  configurarEventos();
});

/* ============ 2. CARGA DE CATÁLOGOS ============ */
async function cargarCatalogos() {
  const res  = await auth.fetchWithAuth(`${API}/catalogos`);
  const data = await res.json();

  catalogosCache = data;

  llenarSelect("JornadaID",  data.jornadas);
  llenarSelect("CampañaID",  data.campanias);
  llenarSelect("CargoID",    data.cargos);
  llenarSelect("ModalidadID",data.modalidades);
}

function llenarSelect(id, arr) {
  const sel = document.getElementById(id);
  sel.innerHTML =
    `<option value="" selected hidden>-- Elegir --</option>` +
    arr.map(o => `<option value="${o.id}">${o.nombre}</option>`).join("");
}

/* ============ 3. PRECARGAR GRUPOS + HORAS (una sola vez) ============ */
async function precargarGruposHoras() {
  const res  = await auth.fetchWithAuth(`${API}/grupos/horas`);
  gruposHorasCache = await res.json();
}

/* ============ 4. CARGAR EMPLEADO ============ */
async function cargarEmpleado() {
  try {
    const res = await auth.fetchWithAuth(`${API}/empleados/${dni}`);
    
    if (!res.ok) {
      const error = await res.json();
      mostrarMsg(false, error);
      return;
    }

    const empleado = await res.json();
    mostrarDatosEmpleado(empleado);
    window.empleadoActual = empleado;
    
  } catch (error) {
    console.error("Error cargando empleado:", error);
    mostrarMsg(false, { error: "Error al cargar empleado" });
  }
}

/* ============ 5. MOSTRAR DATOS DEL EMPLEADO (SOLO LECTURA) ============ */
async function mostrarDatosEmpleado(empleado) {
  // Obtener información adicional
  const horarioInfo = await obtenerHorarioEmpleado(empleado.DNI);
  
  // Llenar campos de visualización
  document.getElementById("displayDNI").textContent = empleado.DNI || "No especificado";
  document.getElementById("displayNombres").textContent = empleado.Nombres || "No especificado";
  document.getElementById("displayApellidoPaterno").textContent = empleado.ApellidoPaterno || "No especificado";
  document.getElementById("displayApellidoMaterno").textContent = empleado.ApellidoMaterno || "No especificado";
  
  // Formatear fechas
  const fechaContratacion = empleado.FechaContratacion ? 
    (empleado.FechaContratacion.includes('T') ? 
      new Date(empleado.FechaContratacion).toLocaleDateString('es-ES') : 
      empleado.FechaContratacion.split('-').reverse().join('/')
    ) : "No especificada";
  const fechaCese = empleado.FechaCese ? 
    (empleado.FechaCese.includes('T') ? 
      new Date(empleado.FechaCese).toLocaleDateString('es-ES') : 
      empleado.FechaCese.split('-').reverse().join('/')
    ) : "No especificada";
  
  document.getElementById("displayFechaContratacion").textContent = fechaContratacion;
  document.getElementById("displayFechaCese").textContent = fechaCese;
  
  // Estado con badge
  const estadoElement = document.getElementById("displayEstado");
  if (empleado.EstadoEmpleado === 'Activo') {
    estadoElement.innerHTML = '<span class="status-badge status-activo">Activo</span>';
  } else if (empleado.EstadoEmpleado === 'Cesado') {
    estadoElement.innerHTML = '<span class="status-badge status-cesado">Cesado</span>';
  } else {
    estadoElement.textContent = empleado.EstadoEmpleado || "No especificado";
  }
  
  // Información de catálogos
  const jornada = catalogosCache.jornadas?.find(j => j.id === empleado.JornadaID);
  const campania = catalogosCache.campanias?.find(c => c.id === empleado.CampañaID);
  const cargo = catalogosCache.cargos?.find(c => c.id === empleado.CargoID);
  const modalidad = catalogosCache.modalidades?.find(m => m.id === empleado.ModalidadID);
  
  document.getElementById("displayJornada").textContent = jornada?.nombre || "No especificado";
  document.getElementById("displayCampania").textContent = campania?.nombre || "No especificado";
  document.getElementById("displayCargo").textContent = cargo?.nombre || "No especificado";
  document.getElementById("displayModalidad").textContent = modalidad?.nombre || "No especificado";
  
  // Horario
  document.getElementById("displayHorario").textContent = horarioInfo?.NombreGrupo || "No especificado";
  
  // DNIs de referencia
  document.getElementById("displaySupervisorDNI").textContent = empleado.SupervisorDNI || "No especificado";
  document.getElementById("displayCoordinadorDNI").textContent = empleado.CoordinadorDNI || "No especificado";
  document.getElementById("displayJefeDNI").textContent = empleado.JefeDNI || "No especificado";
  
  // Mostrar sección de datos
  const dataDisplay = document.getElementById("dataDisplay");
  dataDisplay.style.display = "block";
  dataDisplay.classList.add("fade-in");
  
  // Ocultar formulario de edición si está visible
  document.getElementById("editForm").style.display = "none";
}

/* ============ 6. OBTENER HORARIO DEL EMPLEADO ============ */
async function obtenerHorarioEmpleado(dni) {
  try {
    const res = await auth.fetchWithAuth(`${API}/empleados/${dni}/horario`);
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Error obteniendo horario:", error);
  }
  return null;
}

/* ============ 7. CONFIGURAR EVENTOS ============ */
function configurarEventos() {
  // Botón editar
  document.getElementById("btnEditar").addEventListener("click", () => {
    if (!window.empleadoActual) {
      mostrarMsg(false, { error: "No hay empleado seleccionado" });
      return;
    }
    
    llenarFormulario(window.empleadoActual);
    
    // Ocultar visualización y mostrar formulario
    document.getElementById("dataDisplay").style.display = "none";
    document.getElementById("editForm").style.display = "block";
    document.getElementById("editForm").classList.add("fade-in");
  });

  // Botón cancelar edición
  document.getElementById("btnCancelarEdicion").addEventListener("click", () => {
    // Ocultar formulario y mostrar datos
    document.getElementById("editForm").style.display = "none";
    document.getElementById("dataDisplay").style.display = "block";
  });

  // Envío del formulario
  document.getElementById("formEmpleado").addEventListener("submit", async (e) => {
    e.preventDefault();
    await actualizarEmpleado();
  });
}

/* ============ 8. LLENAR FORMULARIO CON DATOS EXISTENTES ============ */
function llenarFormulario(empleado) {
  // Información personal
  document.getElementById("DNI").value = empleado.DNI;
  document.getElementById("Nombres").value = empleado.Nombres;
  document.getElementById("ApellidoPaterno").value = empleado.ApellidoPaterno;
  document.getElementById("ApellidoMaterno").value = empleado.ApellidoMaterno || "";
  
  // Registro del empleado
  document.getElementById("FechaContratacion").value = empleado.FechaContratacion;
  document.getElementById("CampañaID").value = empleado.CampañaID;
  document.getElementById("CargoID").value = empleado.CargoID;
  
  // Registro horario
  document.getElementById("JornadaID").value = empleado.JornadaID;
  document.getElementById("ModalidadID").value = empleado.ModalidadID;
  document.getElementById("GrupoHorarioID").value = empleado.GrupoHorarioID;
  
  // DNIs de referencia
  document.getElementById("SupervisorDNI").value = empleado.SupervisorDNI || "";
  document.getElementById("CoordinadorDNI").value = empleado.CoordinadorDNI || "";
  document.getElementById("JefeDNI").value = empleado.JefeDNI || "";
  
  // Configurar horarios dinámicamente
  configurarHorarios(empleado.JornadaID, empleado.GrupoHorarioID);
}

/* ============ 9. CONFIGURAR HORARIOS DINÁMICAMENTE ============ */
async function configurarHorarios(jornadaID, grupoHorarioID) {
  const selJornada = document.getElementById("JornadaID");
  const selTurno = document.getElementById("Turno");
  const selBase = document.getElementById("grupoBase");
  const selDesc = document.getElementById("GrupoHorarioID");
  
  // Configurar turnos
  const prefijo = prefijoJornada[jornadaID] || "";
  selTurno.innerHTML = '<option value="">-- Elegir --</option>';
  selTurno.disabled = !prefijo;
  
  if (prefijo) {
    const hayManana = gruposHorasCache.some(g => g.NombreBase.startsWith(prefijo + " Mañana"));
    const hayTarde = gruposHorasCache.some(g => g.NombreBase.startsWith(prefijo + " Tarde"));
    
    if (hayManana) selTurno.innerHTML += '<option value="Mañana">Mañana</option>';
    if (hayTarde) selTurno.innerHTML += '<option value="Tarde">Tarde</option>';
  }
  
  // Buscar el horario base actual
  if (grupoHorarioID) {
    try {
      const res = await auth.fetchWithAuth(`${API}/empleados/${document.getElementById("DNI").value}/horario`);
      if (res.ok) {
        const horario = await res.json();
        if (horario.NombreBase) {
          // Determinar turno
          if (horario.NombreBase.includes("Mañana")) {
            selTurno.value = "Mañana";
          } else if (horario.NombreBase.includes("Tarde")) {
            selTurno.value = "Tarde";
          }
          
          // Configurar horario base
          configurarHorarioBase(horario.NombreBase);
        }
      }
    } catch (error) {
      console.error("Error obteniendo horario:", error);
    }
  }
}

/* ============ 10. CONFIGURAR HORARIO BASE ============ */
function configurarHorarioBase(nombreBase) {
  const selBase = document.getElementById("grupoBase");
  const selDesc = document.getElementById("GrupoHorarioID");
  
  selBase.innerHTML = '<option value="" selected hidden>-- Elegir --</option>';
  selDesc.innerHTML = '<option value="" selected hidden>-- Elegir descanso --</option>';
  
  if (!nombreBase) return;
  
  const filtrados = gruposHorasCache.filter(g => g.NombreBase === nombreBase);
  
  selBase.innerHTML += filtrados.map(g =>
    `<option value="${g.NombreBase}" selected>
       ${g.HoraIni} - ${g.HoraFin}
     </option>`
  ).join("");
  
  // Cargar descansos
  cargarDescansos(nombreBase);
}

/* ============ 11. CARGAR DESCANSO ACTUAL ============ */
async function cargarDescansos(base) {
  const selDesc = document.getElementById("GrupoHorarioID");
  selDesc.innerHTML = '';
  
  if (!base) return;
  
  try {
    const res = await auth.fetchWithAuth(`/grupos/${encodeURIComponent(base)}`);
    const desc = await res.json();
    
    // Mapa Día → objeto
    const map = desc.reduce((acc, d) => {
      const dia = d.NombreGrupo.match(/\(Desc\. ([^)]+)\)/i)?.[1] || d.NombreGrupo;
      acc[dia] = { id: d.GrupoID, texto: dia };
      return acc;
    }, {});
    
    // Orden deseado
    const orden = ["Dom","Sab","Lun","Mar","Mie","Jue","Vie"];
    
    // Genera las opciones en ese orden
    selDesc.innerHTML = '<option value="">-- Elegir descanso --</option>' +
      orden.filter(d => map[d])
           .map(d => `<option value="${map[d].id}">${map[d].texto}</option>`)
           .join("");
    
    // Seleccionar el descanso actual si existe
    const empleadoActual = await obtenerEmpleadoActual();
    if (empleadoActual && empleadoActual.GrupoHorarioID) {
      selDesc.value = empleadoActual.GrupoHorarioID;
    }
  } catch (error) {
    console.error("Error cargando descansos:", error);
  }
}

/* ============ 12. OBTENER EMPLEADO ACTUAL ============ */
async function obtenerEmpleadoActual() {
  const dni = document.getElementById("DNI").value;
  if (!dni) return null;
  
  try {
    const res = await auth.fetchWithAuth(`${API}/empleados/${dni}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Error obteniendo empleado actual:", error);
  }
  return null;
}

/* ============ 13. AUTOCOMPLETES ============ */
async function cargarDatalist(cargoID, datalistId, search = "") {
  const res  = await auth.fetchWithAuth(`${API}/empleados/lookup?cargo=${cargoID}&search=${search}`);
  const data = await res.json();

  const dl = document.getElementById(datalistId);
  dl.innerHTML = data
    .map(e => `<option value="${e.DNI}">${e.NOMBRECOMPLETO ?? e.NombreCompleto}</option>`)
    .join("");
}

["SupervisorDNI","CoordinadorDNI","JefeDNI"].forEach(id => {
  const cargoMap = { SupervisorDNI:"5", CoordinadorDNI:"2,8", JefeDNI:"8" };
  const listMap  = { SupervisorDNI:"listaSupervisores", CoordinadorDNI:"listaCoordinadores", JefeDNI:"listaJefes" };
  document.getElementById(id).addEventListener("input", e => {
    cargarDatalist(cargoMap[id], listMap[id], e.target.value);
  });
});

/* ============ 14. ACTUALIZAR EMPLEADO ============ */
async function actualizarEmpleado() {
  const payload = {
    DNI:               val("DNI"),
    Nombres:           val("Nombres"),
    ApellidoPaterno:   val("ApellidoPaterno"),
    ApellidoMaterno:   val("ApellidoMaterno"),
    FechaContratacion: val("FechaContratacion"),
    JornadaID:         num("JornadaID"),
    CampañaID:         num("CampañaID"),
    CargoID:           num("CargoID"),
    ModalidadID:       num("ModalidadID"),
    GrupoHorarioID:    num("GrupoHorarioID"),
    SupervisorDNI:     opc("SupervisorDNI"),
    CoordinadorDNI:    opc("CoordinadorDNI"),
    JefeDNI:           opc("JefeDNI")
  };

  try {
    const res = await auth.fetchWithAuth(`${API}/empleados/${payload.DNI}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    mostrarMsg(res.ok, result);
    
    if (res.ok) {
      // Actualizar los datos mostrados
      const empleadoActualizado = await auth.fetchWithAuth(`${API}/empleados/${payload.DNI}`);
      if (empleadoActualizado.ok) {
        const empleado = await empleadoActualizado.json();
        window.empleadoActual = empleado;
        mostrarDatosEmpleado(empleado);
        
        // Ocultar formulario y mostrar datos actualizados
        document.getElementById("editForm").style.display = "none";
        document.getElementById("dataDisplay").style.display = "block";
      }
    }
  } catch (error) {
    console.error("Error actualizando empleado:", error);
    mostrarMsg(false, { error: "Error al actualizar empleado" });
  }
}

function val(id){return document.getElementById(id).value.trim();}
function num(id){return parseInt(val(id));}
function opc(id){const v=val(id);return v===""?null:v;}

function mostrarMsg(ok,obj){
  const div=document.getElementById("msg");
  div.className=`alert mt-4 alert-${ok?"success":"danger"} fade-in`;
  div.textContent= ok?obj.mensaje : (obj.error||"Errores en el formulario");
  div.classList.remove("d-none");
  
  // Auto-ocultar mensaje después de 5 segundos
  setTimeout(() => {
    div.classList.add("d-none");
  }, 5000);
} 