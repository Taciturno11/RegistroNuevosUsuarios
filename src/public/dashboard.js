const API = "";              // mismo host:puerto, vacío = relativa a la misma IP

// Variable global para almacenar el empleado actual
let empleadoActual = null;

/* ============ 1. BÚSQUEDA DE EMPLEADO ============ */
document.getElementById("btnBuscar").addEventListener("click", buscarEmpleado);
document.getElementById("dniBuscar").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    buscarEmpleado();
  }
});

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
      return;
    }

    const empleado = await res.json();
    mostrarInformacionEmpleado(empleado);
    empleadoActual = empleado;
    
  } catch (error) {
    console.error("Error buscando empleado:", error);
    mostrarMsg(false, { error: "Error al buscar empleado" });
    ocultarInformacionEmpleado();
  }
}

/* ============ 2. MOSTRAR INFORMACIÓN DEL EMPLEADO ============ */
function mostrarInformacionEmpleado(empleado) {
  // Mostrar información del empleado
  const nombreCompleto = `${empleado.Nombres} ${empleado.ApellidoPaterno} ${empleado.ApellidoMaterno || ''}`.trim();
  const detalles = `DNI: ${empleado.DNI} | Estado: ${empleado.EstadoEmpleado || 'No especificado'}`;
  
  document.getElementById("employeeName").textContent = nombreCompleto;
  document.getElementById("employeeDetails").textContent = detalles;
  
  // Mostrar secciones
  document.getElementById("employeeInfo").style.display = "block";
  document.getElementById("employeeInfo").classList.add("fade-in");
  
  document.getElementById("actionsSection").classList.remove("d-none");
  document.getElementById("actionsSection").classList.add("fade-in");
  
  // Ocultar mensajes de error previos
  document.getElementById("msg").classList.add("d-none");
}

/* ============ 3. OCULTAR INFORMACIÓN DEL EMPLEADO ============ */
function ocultarInformacionEmpleado() {
  document.getElementById("employeeInfo").style.display = "none";
  document.getElementById("actionsSection").classList.add("d-none");
  empleadoActual = null;
}

/* ============ 4. EJECUTAR ACCIONES ============ */
function ejecutarAccion(accion) {
  if (!empleadoActual) {
    mostrarMsg(false, { error: "No hay empleado seleccionado" });
    return;
  }

  // Guardar el DNI en localStorage para que las otras páginas lo puedan usar
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
    default:
      mostrarMsg(false, { error: "Acción no válida" });
  }
}

/* ============ 5. FUNCIONES UTILITARIAS ============ */
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

/* ============ 6. INICIO ============ */
// Verificar autenticación antes de cargar datos
auth.checkAuth().then(() => {
  auth.displayUserInfo();
  
  // Limpiar localStorage al cargar el dashboard
  localStorage.removeItem('empleadoDNI');
  localStorage.removeItem('empleadoNombre');
}); 