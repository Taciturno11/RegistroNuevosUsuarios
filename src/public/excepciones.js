const API = "";              // mismo host:puerto, vacío = relativa a la misma IP

// Variables globales
let empleadoActual = null;
let horariosDisponibles = [];
let excepcionesExistentes = [];

// Obtener DNI del localStorage
const dni = localStorage.getItem('empleadoDNI');
const nombreEmpleado = localStorage.getItem('empleadoNombre');

/* ============ 1. INICIALIZACIÓN ============ */
document.addEventListener('DOMContentLoaded', async () => {
  console.log("Inicializando página de excepciones...");
  console.log("DNI del localStorage:", dni);
  
  if (!dni) {
    mostrarMsg(false, { error: "No se ha seleccionado un empleado. Regrese al dashboard." });
    return;
  }

  try {
    // Verificar autenticación
    await auth.checkAuth();

    // Cargar información del empleado
    await cargarEmpleado();
    
    // Cargar horarios disponibles (después de cargar el empleado para poder filtrar)
    await cargarHorariosDisponibles();
    
    // Cargar excepciones existentes
    await cargarExcepcionesExistentes();
    
    // Configurar eventos
    configurarEventos();
    
    // Mostrar fecha actual
    mostrarFechaActual();
    
    console.log("Inicialización completada");
  } catch (error) {
    console.error("Error durante la inicialización:", error);
    mostrarMsg(false, { error: "Error durante la inicialización" });
  }
});

/* ============ 2. CARGAR INFORMACIÓN DEL EMPLEADO ============ */
async function cargarEmpleado() {
  try {
    const res = await auth.fetchWithAuth(`${API}/empleados/${dni}`);
    
    if (!res.ok) {
      const error = await res.json();
      mostrarMsg(false, error);
      return;
    }

    const empleado = await res.json();
    empleadoActual = empleado;
    
    // Mostrar información del empleado
    document.getElementById("employeeDNI").textContent = empleado.DNI;
    document.getElementById("employeeName").textContent = `${empleado.Nombres} ${empleado.ApellidoPaterno}`;
    
    // Obtener y mostrar horario base
    await mostrarHorarioBase(empleado.DNI);
    
    // Mostrar sección de información
    document.getElementById("employeeInfo").style.display = "block";
    console.log("Sección de información del empleado mostrada");
    
  } catch (error) {
    console.error("Error cargando empleado:", error);
    mostrarMsg(false, { error: "Error al cargar empleado" });
  }
}

/* ============ 3. MOSTRAR HORARIO BASE ============ */
async function mostrarHorarioBase(dni) {
  try {
    const res = await auth.fetchWithAuth(`${API}/empleados/${dni}/horario`);
    
    if (res.ok) {
      const horario = await res.json();
      document.getElementById("employeeHorario").textContent = horario.NombreBase || "No especificado";
      console.log("Horario base cargado:", horario.NombreBase);
    } else {
      document.getElementById("employeeHorario").textContent = "No especificado";
      console.log("No se pudo cargar el horario base");
    }
  } catch (error) {
    console.error("Error obteniendo horario base:", error);
    document.getElementById("employeeHorario").textContent = "Error al cargar";
  }
}

/* ============ 4. CARGAR HORARIOS DISPONIBLES ============ */
async function cargarHorariosDisponibles() {
  try {
    console.log("Cargando horarios disponibles...");
    
    // Verificar autenticación antes de hacer la petición
    if (!auth.isAuthenticated()) {
      console.error("Usuario no autenticado");
      mostrarMsg(false, { error: "Usuario no autenticado. Redirigiendo al login..." });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    const res = await auth.fetchWithAuth(`${API}/api/excepciones/horarios`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error cargando horarios:", res.status, res.statusText, errorText);
      mostrarMsg(false, { error: `Error cargando horarios: ${res.status} ${res.statusText}` });
      return;
    }
    
         horariosDisponibles = await res.json();
     console.log("Horarios cargados:", horariosDisponibles.length);
     console.log("Datos completos de horarios:", horariosDisponibles);
     llenarSelectHorarios();
    
  } catch (error) {
    console.error("Error cargando horarios:", error);
    mostrarMsg(false, { error: `Error de conexión: ${error.message}` });
  }
}

function llenarSelectHorarios() {
  const select = document.getElementById("horarioID");
  
  if (!select) {
    console.error("No se encontró el select de horarios");
    return;
  }
  
  // Limpiar opciones existentes excepto la primera
  while (select.children.length > 1) {
    select.removeChild(select.lastChild);
  }
  
  if (horariosDisponibles && horariosDisponibles.length > 0) {
    // Obtener el horario base del empleado
    const horarioBaseElement = document.getElementById("employeeHorario");
    const horarioBaseTexto = horarioBaseElement ? horarioBaseElement.textContent : "";
    
    console.log("Horario base del empleado:", horarioBaseTexto);
    
    // Filtrar horarios basándose en el tipo (Full Time, Part Time, etc.)
    let horariosFiltrados = horariosDisponibles;
    
    if (horarioBaseTexto && horarioBaseTexto !== "No especificado" && horarioBaseTexto !== "Error al cargar") {
      // Extraer el tipo del horario base (ej: "Full Time" de "Full Time Mañana3")
      const tipoHorarioBase = horarioBaseTexto.split(' ')[0] + ' ' + horarioBaseTexto.split(' ')[1];
      console.log("Tipo de horario base:", tipoHorarioBase);
      
             // Filtrar horarios que coincidan con el tipo
       console.log("Horarios disponibles antes del filtro:", horariosDisponibles.map(h => ({ id: h.HorarioID, nombre: h.NombreHorario, entrada: h.HoraEntrada, salida: h.HoraSalida })));
       
       horariosFiltrados = horariosDisponibles.filter(horario => {
         const tipoHorario = horario.NombreHorario.split(' ')[0] + ' ' + horario.NombreHorario.split(' ')[1];
         console.log(`Comparando: "${tipoHorario}" con "${tipoHorarioBase}"`);
         return tipoHorario === tipoHorarioBase;
       });
      
      console.log(`Filtrando horarios de tipo "${tipoHorarioBase}": ${horariosFiltrados.length} encontrados`);
    } else {
      console.log("No se pudo determinar el tipo de horario base, mostrando todos los horarios");
    }
    
    if (horariosFiltrados.length > 0) {
      console.log(`Agregando ${horariosFiltrados.length} horarios filtrados al select`);
      
             // Agregar opción de descanso al inicio
       const optionDescanso = document.createElement("option");
       optionDescanso.value = "";
       optionDescanso.textContent = "Descanso";
       select.appendChild(optionDescanso);
       
       horariosFiltrados.forEach((horario) => {
         const option = document.createElement("option");
         option.value = horario.HorarioID;
         
         // Formatear las horas de manera limpia
         const horaEntrada = formatearHora(horario.HoraEntrada);
         const horaSalida = formatearHora(horario.HoraSalida);
         
         option.textContent = `${horaEntrada} - ${horaSalida}`;
         select.appendChild(option);
       });
      
      console.log("Select de horarios filtrados llenado correctamente");
    } else {
      console.warn("No se encontraron horarios del mismo tipo");
      
      // Agregar opción de error
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No hay horarios del mismo tipo disponibles";
      option.disabled = true;
      select.appendChild(option);
    }
  } else {
    console.warn("No se encontraron horarios disponibles");
    
    // Agregar opción de error
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No hay horarios disponibles";
    option.disabled = true;
    select.appendChild(option);
  }
}

/* ============ 5. CARGAR EXCEPCIONES EXISTENTES ============ */
async function cargarExcepcionesExistentes() {
  try {
    const res = await auth.fetchWithAuth(`${API}/api/excepciones/${dni}`);
    
    if (!res.ok) {
      console.error("Error cargando excepciones");
      return;
    }
    
    excepcionesExistentes = await res.json();
    mostrarExcepciones();
    
  } catch (error) {
    console.error("Error cargando excepciones:", error);
  }
}

function mostrarExcepciones() {
  const tbody = document.getElementById("excepcionesTable");
  
     if (excepcionesExistentes.length === 0) {
     tbody.innerHTML = `
       <tr>
         <td colspan="5" class="text-center text-muted">
           <i class="fas fa-info-circle me-2"></i>
           No hay excepciones registradas
         </td>
       </tr>
     `;
     return;
   }
  
           tbody.innerHTML = excepcionesExistentes.map(excepcion => {
        const horario = horariosDisponibles.find(h => h.HorarioID === excepcion.HorarioID);
        const fechaFormateada = formatearFecha(excepcion.Fecha);
        
        // Determinar qué mostrar en la columna de horario
        let horarioTexto = "";
        if (excepcion.HorarioID === null || excepcion.HorarioID === undefined) {
          horarioTexto = "Descanso";
        } else if (horario) {
          horarioTexto = horario.NombreHorario;
        } else {
          horarioTexto = `ID: ${excepcion.HorarioID}`;
        }
        
        // Determinar el rango horario
        let rangoHorario = "";
        if (excepcion.HorarioID === null || excepcion.HorarioID === undefined) {
          rangoHorario = "N/A";
        } else if (excepcion.HoraEntrada && excepcion.HoraSalida) {
          const horaEntrada = formatearHora(excepcion.HoraEntrada);
          const horaSalida = formatearHora(excepcion.HoraSalida);
          rangoHorario = `${horaEntrada} - ${horaSalida}`;
        } else if (horario) {
          const horaEntrada = formatearHora(horario.HoraEntrada);
          const horaSalida = formatearHora(horario.HoraSalida);
          rangoHorario = `${horaEntrada} - ${horaSalida}`;
        } else {
          rangoHorario = "No disponible";
        }
        
        return `
          <tr>
            <td>
              <i class="fas fa-calendar me-2"></i>
              ${fechaFormateada}
            </td>
            <td>
              <i class="fas fa-clock me-2"></i>
              ${horarioTexto}
            </td>
            <td>
              <i class="fas fa-time me-2"></i>
              ${rangoHorario}
            </td>
            <td>
              <i class="fas fa-comment me-2"></i>
              ${excepcion.Motivo || "Sin motivo especificado"}
            </td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="eliminarExcepcion(${excepcion.AsignacionID})">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join("");
}

/* ============ 6. CONFIGURAR EVENTOS ============ */
function configurarEventos() {
  console.log("Configurando eventos...");
  
  // Formulario de nueva excepción
  document.getElementById("excepcionForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await guardarExcepcion();
  });
  
  // Configurar campo de fecha
  const fechaInput = document.getElementById("fecha");
  console.log("Campo de fecha encontrado:", fechaInput);
  
  if (fechaInput) {
    // Configurar fecha mínima (hoy)
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    fechaInput.setAttribute("min", fechaHoy);
    console.log("Fecha mínima configurada:", fechaHoy);
    
    // Configurar fecha por defecto (mañana)
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toISOString().split('T')[0];
    fechaInput.value = fechaManana;
    console.log("Fecha por defecto configurada:", fechaManana);
    
    // Forzar la actualización del campo
    fechaInput.dispatchEvent(new Event('change'));
  } else {
    console.error("No se encontró el campo de fecha");
  }
  
  // Eventos para validación
  if (fechaInput) {
    fechaInput.addEventListener("change", (e) => {
      console.log("Fecha cambiada:", e.target.value);
      validarFecha();
    });
    
    fechaInput.addEventListener("input", (e) => {
      console.log("Fecha ingresada:", e.target.value);
      validarFecha();
    });
    
    // Evento para cuando se hace clic en el campo
    fechaInput.addEventListener("click", () => {
      console.log("Campo de fecha clickeado");
    });
  }
  
  console.log("Eventos configurados correctamente");
}

function validarFecha() {
  const fechaInput = document.getElementById("fecha");
  
  if (!fechaInput || !fechaInput.value) {
    console.log("Campo de fecha vacío o no encontrado");
    return false;
  }
  
  const fechaSeleccionada = new Date(fechaInput.value);
  const fechaActual = new Date();
  fechaActual.setHours(0, 0, 0, 0);
  
  console.log("Validando fecha:", fechaInput.value, "Fecha seleccionada:", fechaSeleccionada, "Fecha actual:", fechaActual);
  
  if (fechaSeleccionada < fechaActual) {
    mostrarMsg(false, { error: "No se pueden crear excepciones para fechas pasadas" });
    fechaInput.value = "";
    return false;
  }
  
  console.log("Fecha válida:", fechaInput.value);
  return true;
}

/* ============ 7. GUARDAR EXCEPCIÓN ============ */
async function guardarExcepcion() {
  const fecha = document.getElementById("fecha").value;
  const horarioID = document.getElementById("horarioID").value;
  const motivo = document.getElementById("motivo").value;
  
     if (!fecha || !motivo) {
     mostrarMsg(false, { error: "Por favor complete la fecha y el motivo" });
     return;
   }
   
   // Para descanso, horarioID puede estar vacío
   if (horarioID === "" && motivo.trim() === "") {
     mostrarMsg(false, { error: "Por favor complete el motivo para el descanso" });
     return;
   }
  
  if (!validarFecha()) {
    return;
  }
  
  // Verificar si ya existe una excepción para esa fecha
  const existeExcepcion = excepcionesExistentes.some(ex => ex.Fecha === fecha);
  if (existeExcepcion) {
    mostrarMsg(false, { error: "Ya existe una excepción registrada para esta fecha" });
    return;
  }
  
     try {
     const res = await auth.fetchWithAuth(`${API}/api/excepciones`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         EmpleadoDNI: dni,
         Fecha: fecha,
         HorarioID: horarioID === "" ? null : parseInt(horarioID),
         Motivo: motivo
       })
     });
    
    if (!res.ok) {
      const error = await res.json();
      mostrarMsg(false, error);
      return;
    }
    
    const nuevaExcepcion = await res.json();
    mostrarMsg(true, { mensaje: "Excepción guardada exitosamente" });
    
    // Limpiar formulario
    document.getElementById("excepcionForm").reset();
    
    // Recargar excepciones
    await cargarExcepcionesExistentes();
    
  } catch (error) {
    console.error("Error guardando excepción:", error);
    mostrarMsg(false, { error: "Error al guardar la excepción" });
  }
}

/* ============ 8. ELIMINAR EXCEPCIÓN ============ */
async function eliminarExcepcion(asignacionID) {
  if (!confirm("¿Está seguro de que desea eliminar esta excepción?")) {
    return;
  }
  
  try {
    const res = await auth.fetchWithAuth(`${API}/api/excepciones/${asignacionID}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) {
      const error = await res.json();
      mostrarMsg(false, error);
      return;
    }
    
    mostrarMsg(true, { mensaje: "Excepción eliminada exitosamente" });
    
    // Recargar excepciones
    await cargarExcepcionesExistentes();
    
  } catch (error) {
    console.error("Error eliminando excepción:", error);
    mostrarMsg(false, { error: "Error al eliminar la excepción" });
  }
}

/* ============ 9. FUNCIONES UTILITARIAS ============ */
function mostrarFechaActual() {
  const fechaActual = new Date().toLocaleDateString('es-ES');
  document.getElementById("currentDate").textContent = fechaActual;
}

function formatearHora(fechaHora) {
  if (!fechaHora) return "00:00";
  
  try {
    // Si es una fecha ISO (ej: "1970-01-01T07:00:00.000Z")
    if (fechaHora.includes('T')) {
      const fecha = new Date(fechaHora);
      // Extraer solo la hora y minutos, ignorando la zona horaria
      const hora = fecha.getUTCHours().toString().padStart(2, '0');
      const minuto = fecha.getUTCMinutes().toString().padStart(2, '0');
      return `${hora}:${minuto}`;
    }
    
    // Si es formato HH:MM:SS.0000000 (de la base de datos)
    if (fechaHora.includes(':') && fechaHora.includes('.')) {
      // Extraer solo HH:MM de "07:00:00.0000000"
      const partes = fechaHora.split(':');
      const hora = partes[0].padStart(2, '0');
      const minuto = partes[1].padStart(2, '0');
      return `${hora}:${minuto}`;
    }
    
    // Si ya es solo hora (ej: "07:00")
    if (fechaHora.includes(':') && !fechaHora.includes('.')) {
      return fechaHora;
    }
    
    return "00:00";
  } catch (error) {
    console.error("Error formateando hora:", error);
    return "00:00";
  }
}

function formatearFecha(fecha) {
  if (!fecha) return "No especificada";
  
  try {
    // Si es una fecha ISO (ej: "2025-08-02T00:00:00.000Z")
    if (fecha.includes('T')) {
      const fechaObj = new Date(fecha);
      // Usar UTC para evitar problemas de zona horaria
      const dia = fechaObj.getUTCDate().toString().padStart(2, '0');
      const mes = (fechaObj.getUTCMonth() + 1).toString().padStart(2, '0');
      const año = fechaObj.getUTCFullYear();
      return `${dia}/${mes}/${año}`;
    }
    
    // Si es formato YYYY-MM-DD
    if (fecha.includes('-') && !fecha.includes('T')) {
      const partes = fecha.split('-');
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    
    return fecha;
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return fecha;
  }
}

function mostrarMsg(ok, obj) {
  const div = document.getElementById("msg");
  div.className = `alert alert-${ok ? "success" : "danger"} fade-in`;
  div.textContent = ok ? obj.mensaje : (obj.error || "Error desconocido");
  div.classList.remove("d-none");
  
  // Auto-ocultar mensaje después de 5 segundos
  setTimeout(() => {
    div.classList.add("d-none");
  }, 5000);
} 