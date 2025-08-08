const API = "";              // mismo host:puerto, vacío = relativa a la misma IP

// Variables globales
let empleadoActual = null;
let sugerencias = [];
let indiceSeleccionado = -1;
let timeoutBusqueda = null;

/* ============ 1. BÚSQUEDA EN TIEMPO REAL ============ */
document.getElementById("dniBuscar").addEventListener("input", (e) => {
  const valor = e.target.value.trim();
  
  // Limpiar timeout anterior
  if (timeoutBusqueda) {
    clearTimeout(timeoutBusqueda);
  }
  
  // Ocultar sugerencias si el campo está vacío
  if (!valor || valor.length < 2) {
    ocultarSugerencias();
    
    // Si el campo está completamente vacío, limpiar localStorage y ocultar información
    if (!valor) {
      localStorage.removeItem('empleadoDNI');
      localStorage.removeItem('empleadoNombre');
      ocultarInformacionEmpleado();
    }
    return;
  }
  
  // Buscar después de 300ms de inactividad
  timeoutBusqueda = setTimeout(() => {
    buscarSugerencias(valor);
  }, 300);
});

// Eventos de teclado para navegar sugerencias
document.getElementById("dniBuscar").addEventListener("keydown", (e) => {
  const dropdown = document.getElementById("suggestionsDropdown");
  
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      navegarSugerencias(1);
      break;
    case "ArrowUp":
      e.preventDefault();
      navegarSugerencias(-1);
      break;
    case "Enter":
      e.preventDefault();
      if (indiceSeleccionado >= 0 && sugerencias[indiceSeleccionado]) {
        seleccionarSugerencia(sugerencias[indiceSeleccionado]);
      } else {
        buscarEmpleado();
      }
      break;
    case "Escape":
      ocultarSugerencias();
      break;
  }
});

// Cerrar sugerencias al hacer clic fuera
document.addEventListener("click", (e) => {
  const container = document.querySelector(".suggestions-container");
  if (!container.contains(e.target)) {
    ocultarSugerencias();
  }
});

/* ============ 2. FUNCIONES DE SUGERENCIAS ============ */
async function buscarSugerencias(search) {
  try {
    const res = await auth.fetchWithAuth(`${API}/empleados/buscar?search=${encodeURIComponent(search)}`);
    
    if (!res.ok) {
      console.error("Error buscando sugerencias");
      return;
    }
    
    sugerencias = await res.json();
    mostrarSugerencias();
    
  } catch (error) {
    console.error("Error buscando sugerencias:", error);
  }
}

function mostrarSugerencias() {
  const dropdown = document.getElementById("suggestionsDropdown");
  
  if (sugerencias.length === 0) {
    dropdown.style.display = "none";
    return;
  }
  
  dropdown.innerHTML = sugerencias.map((emp, index) => `
    <div class="suggestion-item ${index === indiceSeleccionado ? 'selected' : ''}" 
         onclick="seleccionarSugerencia(${JSON.stringify(emp).replace(/"/g, '&quot;')})">
      <div class="suggestion-dni">${emp.DNI}</div>
      <div class="suggestion-name">${emp.NombreCompleto}</div>
    </div>
  `).join("");
  
  dropdown.style.display = "block";
  indiceSeleccionado = -1;
}

function ocultarSugerencias() {
  const dropdown = document.getElementById("suggestionsDropdown");
  dropdown.style.display = "none";
  indiceSeleccionado = -1;
}

function navegarSugerencias(direccion) {
  const nuevoIndice = indiceSeleccionado + direccion;
  
  if (nuevoIndice >= -1 && nuevoIndice < sugerencias.length) {
    indiceSeleccionado = nuevoIndice;
    mostrarSugerencias();
  }
}

function seleccionarSugerencia(empleado) {
  document.getElementById("dniBuscar").value = empleado.DNI;
  ocultarSugerencias();
  buscarEmpleado();
}

/* ============ 3. BÚSQUEDA DE EMPLEADO ============ */
document.getElementById("btnBuscar").addEventListener("click", buscarEmpleado);

async function buscarEmpleado() {
  const dni = document.getElementById("dniBuscar").value.trim();
  
  if (!dni) {
    mostrarMsg(false, { error: "Por favor ingrese un DNI" });
    return;
  }

  try {
    const res = await auth.fetchWithAuth(`${API}/empleados/${dni}`);
    
    if (!res.ok) {
      const error = await res.json();
      mostrarMsg(false, error);
      ocultarInformacionEmpleado();
      // Limpiar localStorage si no se encuentra el empleado
      localStorage.removeItem('empleadoDNI');
      localStorage.removeItem('empleadoNombre');
      return;
    }

    const empleado = await res.json();
    mostrarInformacionEmpleado(empleado);
    empleadoActual = empleado;
    
    // Actualizar localStorage con el nuevo empleado encontrado
    localStorage.setItem('empleadoDNI', empleado.DNI);
    localStorage.setItem('empleadoNombre', `${empleado.Nombres} ${empleado.ApellidoPaterno}`);
    
  } catch (error) {
    console.error("Error buscando empleado:", error);
    mostrarMsg(false, { error: "Error al buscar empleado" });
    ocultarInformacionEmpleado();
    // Limpiar localStorage si hay error
    localStorage.removeItem('empleadoDNI');
    localStorage.removeItem('empleadoNombre');
  }
}

/* ============ 4. MOSTRAR INFORMACIÓN DEL EMPLEADO ============ */
async function mostrarInformacionEmpleado(empleado) {
  // Mostrar información del empleado
  const nombreCompleto = `${empleado.Nombres} ${empleado.ApellidoPaterno} ${empleado.ApellidoMaterno || ''}`.trim();
  
  // Obtener información adicional de los catálogos
  let infoAdicional = {};
  try {
    const resCatalogos = await auth.fetchWithAuth(`${API}/catalogos`);
    if (resCatalogos.ok) {
      const catalogos = await resCatalogos.json();
      
      // Buscar información específica en la estructura correcta
      const cargo = catalogos.cargos?.find(c => c.id === empleado.CargoID);
      const campania = catalogos.campanias?.find(c => c.id === empleado.CampañaID);
      const jornada = catalogos.jornadas?.find(c => c.id === empleado.JornadaID);
      const modalidad = catalogos.modalidades?.find(c => c.id === empleado.ModalidadID);
      
      infoAdicional = {
        cargo: cargo ? cargo.nombre : null,
        campania: campania ? campania.nombre : null,
        jornada: jornada ? jornada.nombre : null,
        modalidad: modalidad ? modalidad.nombre : null
      };
    }
  } catch (error) {
    console.error("Error obteniendo catálogos:", error);
  }
  
  // Crear información detallada
  const detalles = `
    <div class="row">
      <div class="col-md-6">
        <div class="info-item">
          <i class="fas fa-id-card text-primary"></i>
          <strong>DNI:</strong> ${empleado.DNI}
        </div>
        <div class="info-item">
          <i class="fas fa-calendar text-success"></i>
          <strong>Fecha Contratación:</strong> ${empleado.FechaContratacion ? 
            (empleado.FechaContratacion.includes('T') ? 
              new Date(empleado.FechaContratacion).toLocaleDateString('es-ES') : 
              empleado.FechaContratacion.split('-').reverse().join('/')
            ) : 'No especificada'}
        </div>
        <div class="info-item">
          <i class="fas fa-user-tie text-info"></i>
          <strong>Cargo:</strong> ${infoAdicional.cargo || `ID: ${empleado.CargoID}` || 'No especificado'}
        </div>
        <div class="info-item">
          <i class="fas fa-building text-warning"></i>
          <strong>Campaña:</strong> ${infoAdicional.campania || `ID: ${empleado.CampañaID}` || 'No especificado'}
        </div>
      </div>
      <div class="col-md-6">
        <div class="info-item">
          <i class="fas fa-circle ${empleado.EstadoEmpleado === 'Activo' ? 'text-success' : 'text-danger'}"></i>
          <strong>Estado:</strong> ${empleado.EstadoEmpleado || 'No especificado'}
        </div>
        <div class="info-item">
          <i class="fas fa-clock text-secondary"></i>
          <strong>Jornada:</strong> ${infoAdicional.jornada || `ID: ${empleado.JornadaID}` || 'No especificado'}
        </div>
        <div class="info-item">
          <i class="fas fa-laptop text-info"></i>
          <strong>Modalidad:</strong> ${infoAdicional.modalidad || `ID: ${empleado.ModalidadID}` || 'No especificado'}
        </div>
        <div class="info-item">
          <i class="fas fa-calendar-times text-danger"></i>
          <strong>Fecha Cese:</strong> ${empleado.FechaCese ? 
            (empleado.FechaCese.includes('T') ? 
              new Date(empleado.FechaCese).toLocaleDateString('es-ES') : 
              empleado.FechaCese.split('-').reverse().join('/')
            ) : 'No aplica'}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById("employeeName").textContent = nombreCompleto;
  document.getElementById("employeeDetails").innerHTML = detalles;
  
  // Mostrar secciones
  document.getElementById("employeeInfo").style.display = "block";
  document.getElementById("employeeInfo").classList.add("fade-in");
  
  document.getElementById("actionsSection").classList.remove("d-none");
  document.getElementById("actionsSection").classList.add("fade-in");
  
  // Ocultar mensajes de error previos
  document.getElementById("msg").classList.add("d-none");
}

/* ============ 5. OCULTAR INFORMACIÓN DEL EMPLEADO ============ */
function ocultarInformacionEmpleado() {
  document.getElementById("employeeInfo").style.display = "none";
  document.getElementById("actionsSection").classList.add("d-none");
  empleadoActual = null;
}

/* ============ 6. EJECUTAR ACCIONES ============ */
function ejecutarAccion(accion) {
  if (!empleadoActual) {
    mostrarMsg(false, { error: "No hay empleado seleccionado" });
    return;
  }

  // Guardar el DNI en localStorage para que las otras páginas lo puedan usar
  // Y también para mantenerlo al regresar al dashboard
  localStorage.setItem('empleadoDNI', empleadoActual.DNI);
  localStorage.setItem('empleadoNombre', `${empleadoActual.Nombres} ${empleadoActual.ApellidoPaterno}`);

  // Navegar a la página correspondiente
  switch (accion) {
    case 'actualizar':
      window.location.href = '/actualizar-empleado';
      break;
    case 'cese':
      window.location.href = '/cese';
      break;
    case 'justificaciones':
      window.location.href = '/justificaciones';
      break;
    case 'ojt':
      window.location.href = '/ojt';
      break;
    case 'excepciones':
      window.location.href = '/excepciones';
      break;
    default:
      mostrarMsg(false, { error: "Acción no válida" });
  }
}

/* ============ 7. FUNCIONES UTILITARIAS ============ */
function mostrarMsg(ok, obj) {
  const div = document.getElementById("msg");
  div.className = `alert mt-4 alert-${ok ? "success" : "danger"} fade-in`;
  div.textContent = ok ? obj.mensaje : (obj.error || "Error desconocido");
  div.classList.remove("d-none");
  
  // Auto-ocultar mensaje después de 5 segundos
  setTimeout(() => {
    div.classList.add("d-none");
  }, 5000);
}

/* ============ 8. INICIO ============ */
// Verificar autenticación antes de cargar datos
auth.checkAuth().then(() => {
  auth.displayUserInfo();
  
  // Cargar estadísticas del header
  cargarEstadisticas();
  
  // Verificar si hay un DNI guardado al regresar de otra página
  const dniGuardado = localStorage.getItem('empleadoDNI');
  const nombreGuardado = localStorage.getItem('empleadoNombre');
  
  if (dniGuardado && nombreGuardado) {
    // Restaurar el DNI en el campo de búsqueda
    document.getElementById("dniBuscar").value = dniGuardado;
    
    // Buscar automáticamente el empleado
    buscarEmpleado();
  } else {
    // Limpiar localStorage solo si no hay datos guardados
    localStorage.removeItem('empleadoDNI');
    localStorage.removeItem('empleadoNombre');
  }
});

/* ============ 9. CARGAR ESTADÍSTICAS ============ */
async function cargarEstadisticas() {
  try {
    const res = await auth.fetchWithAuth(`${API}/empleados/estadisticas`);
    
    if (!res.ok) {
      console.error("Error cargando estadísticas");
      return;
    }
    
    const estadisticas = await res.json();
    
    // Actualizar los indicadores en el header
    document.getElementById("empleadosActivos").textContent = estadisticas.empleadosActivos || 0;
    document.getElementById("empleadosCesados").textContent = estadisticas.empleadosCesados || 0;
    document.getElementById("totalEmpleados").textContent = estadisticas.totalEmpleados || 0;
    
    console.log("Estadísticas cargadas:", estadisticas);
    
  } catch (error) {
    console.error("Error cargando estadísticas:", error);
  }
} 