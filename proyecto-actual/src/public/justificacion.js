const API = "";

// Obtener DNI del localStorage
const dni = localStorage.getItem('empleadoDNI');
const nombreEmpleado = localStorage.getItem('empleadoNombre');

// Variables globales para autocompletado del aprobador
let sugerenciasAprobador = [];
let indiceSeleccionadoAprobador = -1;
let timeoutBusquedaAprobador = null;

// Variables globales para paginación y filtros
let todasLasJustificaciones = [];
let justificacionesFiltradas = [];
let paginaActual = 1;
let elementosPorPagina = 8;
let filtroMes = "";
let filtroAnio = "";

/* ============ 1. INICIALIZACIÓN ============ */
document.addEventListener('DOMContentLoaded', async () => {
  if (!dni) {
    mostrarMsg(false, { error: "No se ha seleccionado un empleado. Regrese al dashboard." });
    return;
  }

  // Mostrar información del empleado
  document.getElementById("employeeName").textContent = nombreEmpleado || "Empleado";
  document.getElementById("employeeDNI").textContent = `DNI: ${dni}`;

  // Cargar tipos de justificación
  await cargarTiposJustificacion();
  
  // Cargar justificaciones existentes
  await cargarJustificacionesExistentes();
  
  // Establecer fecha actual por defecto
  document.getElementById("fecha").value = new Date().toISOString().split('T')[0];
  
  // Auto-completar aprobador con el usuario actual
  const userInfo = auth.getUserInfo();
  if (userInfo.dni) {
    document.getElementById("aprobadorDNI").value = userInfo.dni;
  }

  // Inicializar autocompletado del aprobador
  inicializarAutocompletadoAprobador();

  // Inicializar filtros y paginación
  inicializarFiltrosYPaginacion();
});

/* ============ 2. CARGAR TIPOS DE JUSTIFICACIÓN ============ */
async function cargarTiposJustificacion() {
  try {
    const res = await auth.fetchWithAuth(`${API}/justificaciones/tipos`);
    if (res.ok) {
      const tipos = await res.json();
      const select = document.getElementById("tipo");
      
      select.innerHTML = '<option value="">Seleccione una opción</option>' +
        tipos.map(tipo => `<option value="${tipo.TipoJustificacion}">${tipo.TipoJustificacion}</option>`).join("");
    }
  } catch (error) {
    console.error("Error cargando tipos de justificación:", error);
  }
}

/* ============ 3. CARGAR JUSTIFICACIONES EXISTENTES ============ */
async function cargarJustificacionesExistentes() {
  try {
    const res = await auth.fetchWithAuth(`${API}/justificaciones/${dni}`);
    
    if (!res.ok) {
      console.error("Error cargando justificaciones");
      return;
    }
    
    todasLasJustificaciones = await res.json();
    
    // Aplicar filtros y paginación
    aplicarFiltrosYPaginacion();
    
  } catch (error) {
    console.error("Error cargando justificaciones:", error);
  }
}

/* ============ 3. ENVÍO DEL FORMULARIO ============ */
document.getElementById("formRegistrar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fecha = document.getElementById("fecha").value;
  const tipo = document.getElementById("tipo").value;
  const motivo = document.getElementById("motivo").value;
  const estado = document.getElementById("estado").value;
  const aprobadorDNI = document.getElementById("aprobadorDNI").value;

  // Validaciones mejoradas
  if (!fecha) {
    mostrarMsg(false, { error: "Por favor seleccione una fecha" });
    return;
  }

  if (!tipo) {
    mostrarMsg(false, { error: "Por favor seleccione un tipo de justificación" });
    return;
  }

  if (!estado) {
    mostrarMsg(false, { error: "Por favor seleccione un estado" });
    return;
  }

  if (!aprobadorDNI) {
    mostrarMsg(false, { error: "Por favor ingrese el DNI del aprobador" });
    return;
  }

  // Guardar la posición actual del scroll
  const scrollPosition = window.scrollY;

  try {
    const payload = {
      EmpleadoDNI: dni,
      Fecha: fecha,
      TipoJustificacion: tipo,
      Motivo: motivo,
      Estado: estado,
      AprobadorDNI: aprobadorDNI
    };

    const res = await auth.fetchWithAuth(`${API}/justificaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    mostrarMsg(res.ok, result);
    
    if (res.ok) {
      // Limpiar formulario
      document.getElementById("fecha").value = new Date().toISOString().split('T')[0];
      document.getElementById("tipo").value = "";
      document.getElementById("motivo").value = "";
      document.getElementById("estado").value = "";
      document.getElementById("aprobadorDNI").value = "";
      
      // Auto-completar aprobador con el usuario actual
      const userInfo = auth.getUserInfo();
      if (userInfo.dni) {
        document.getElementById("aprobadorDNI").value = userInfo.dni;
      }
      
      // Recargar histórico de justificaciones
      await cargarJustificacionesExistentes();
      
      // Restaurar la posición del scroll después de un breve delay
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    }
    
  } catch (error) {
    console.error("Error registrando justificación:", error);
    mostrarMsg(false, { error: "Error al registrar justificación. Verifique su conexión." });
  }
});

/* ============ 4. FUNCIONES UTILITARIAS ============ */
function mostrarMsg(ok, obj) {
  // Remover mensajes anteriores
  const mensajesAnteriores = document.querySelectorAll('.alert');
  mensajesAnteriores.forEach(msg => msg.remove());

  const div = document.createElement("div");
  div.className = `alert alert-${ok ? "success" : "danger"} mt-3`;
  div.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas fa-${ok ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
      <span>${ok ? obj.mensaje : (obj.error || "Error desconocido")}</span>
    </div>
  `;
  
  // Insertar después del formulario
  const form = document.getElementById("formRegistrar");
  form.parentNode.insertBefore(div, form.nextSibling);
  
  // El mensaje permanecerá visible hasta que se recargue la página o se muestre otro mensaje
}

/* ============ 5. ELIMINAR JUSTIFICACIÓN ============ */
async function eliminarJustificacion(justificacionID) {
  if (!confirm("¿Está seguro de que desea eliminar esta justificación?")) {
    return;
  }
  
  // Guardar la posición actual del scroll
  const scrollPosition = window.scrollY;
  
  try {
    const res = await auth.fetchWithAuth(`${API}/justificaciones/${justificacionID}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) {
      const error = await res.json();
      mostrarMsg(false, error);
      return;
    }
    
    mostrarMsg(true, { mensaje: "Justificación eliminada exitosamente" });
    
    // Recargar justificaciones y aplicar filtros/paginación
    await cargarJustificacionesExistentes();
    
    // Restaurar la posición del scroll después de un breve delay
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 100);
    
  } catch (error) {
    console.error("Error eliminando justificación:", error);
    mostrarMsg(false, { error: "Error al eliminar la justificación" });
  }
}

/* ============ 6. FUNCIONES DE FORMATEO ============ */
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

/* ============ 7. CALCULAR ESTADÍSTICAS DE JUSTIFICACIONES ============ */
function calcularEstadisticasJustificaciones(justificaciones) {
  if (!justificaciones || !Array.isArray(justificaciones)) {
    // Si no hay justificaciones, mostrar ceros
    document.getElementById("totalJustificaciones").textContent = "0";
    document.getElementById("justificacionesAprobadas").textContent = "0";
    document.getElementById("justificacionesDesaprobadas").textContent = "0";
    return;
  }

  // Calcular estadísticas
  const total = justificaciones.length;
  const aprobadas = justificaciones.filter(j => j.Estado === 'Aprobado').length;
  const desaprobadas = justificaciones.filter(j => j.Estado === 'Desaprobado').length;

  // Actualizar indicadores
  document.getElementById("totalJustificaciones").textContent = total.toString();
  document.getElementById("justificacionesAprobadas").textContent = aprobadas.toString();
  document.getElementById("justificacionesDesaprobadas").textContent = desaprobadas.toString();
}

/* ============ 8. AUTOCOMPLETADO DEL APROBADOR ============ */
function inicializarAutocompletadoAprobador() {
  const inputAprobador = document.getElementById("aprobadorDNI");
  
  // Evento de input para búsqueda en tiempo real
  inputAprobador.addEventListener("input", (e) => {
    const valor = e.target.value.trim();
    
    // Limpiar timeout anterior
    if (timeoutBusquedaAprobador) {
      clearTimeout(timeoutBusquedaAprobador);
    }
    
    // Ocultar sugerencias si el campo está vacío
    if (!valor || valor.length < 2) {
      ocultarSugerenciasAprobador();
      return;
    }
    
    // Buscar después de 300ms de inactividad
    timeoutBusquedaAprobador = setTimeout(() => {
      buscarSugerenciasAprobador(valor);
    }, 300);
  });

  // Eventos de teclado para navegar sugerencias
  inputAprobador.addEventListener("keydown", (e) => {
    const dropdown = document.getElementById("aprobadorSuggestionsDropdown");
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        navegarSugerenciasAprobador(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        navegarSugerenciasAprobador(-1);
        break;
      case "Enter":
        e.preventDefault();
        if (indiceSeleccionadoAprobador >= 0 && sugerenciasAprobador[indiceSeleccionadoAprobador]) {
          seleccionarSugerenciaAprobador(sugerenciasAprobador[indiceSeleccionadoAprobador]);
        }
        break;
      case "Escape":
        ocultarSugerenciasAprobador();
        break;
    }
  });

  // Cerrar sugerencias al hacer clic fuera
  document.addEventListener("click", (e) => {
    const container = document.querySelector(".suggestions-container");
    const dropdown = document.getElementById("aprobadorSuggestionsDropdown");
    
    if (container && dropdown && !container.contains(e.target)) {
      ocultarSugerenciasAprobador();
    }
  });
}

async function buscarSugerenciasAprobador(search) {
  try {
    const res = await auth.fetchWithAuth(`${API}/empleados/buscar?search=${encodeURIComponent(search)}`);
    
    if (!res.ok) {
      console.error("Error buscando sugerencias de aprobador");
      return;
    }
    
    sugerenciasAprobador = await res.json();
    mostrarSugerenciasAprobador();
    
  } catch (error) {
    console.error("Error buscando sugerencias de aprobador:", error);
  }
}

function mostrarSugerenciasAprobador() {
  const dropdown = document.getElementById("aprobadorSuggestionsDropdown");
  
  if (sugerenciasAprobador.length === 0) {
    dropdown.style.display = "none";
    return;
  }
  
  dropdown.innerHTML = sugerenciasAprobador.map((emp, index) => `
    <div class="suggestion-item ${index === indiceSeleccionadoAprobador ? 'selected' : ''}" 
         onclick="seleccionarSugerenciaAprobador(${JSON.stringify(emp).replace(/"/g, '&quot;')})">
      <div>
        <div class="suggestion-dni">${emp.DNI}</div>
        <div class="suggestion-name">${emp.NombreCompleto}</div>
      </div>
    </div>
  `).join("");
  
  dropdown.style.display = "block";
}

function ocultarSugerenciasAprobador() {
  const dropdown = document.getElementById("aprobadorSuggestionsDropdown");
  dropdown.style.display = "none";
  indiceSeleccionadoAprobador = -1;
}

function navegarSugerenciasAprobador(direccion) {
  const dropdown = document.getElementById("aprobadorSuggestionsDropdown");
  const items = dropdown.querySelectorAll(".suggestion-item");
  
  if (items.length === 0) return;
  
  // Remover selección anterior
  if (indiceSeleccionadoAprobador >= 0 && items[indiceSeleccionadoAprobador]) {
    items[indiceSeleccionadoAprobador].classList.remove("selected");
  }
  
  // Calcular nuevo índice
  indiceSeleccionadoAprobador += direccion;
  
  if (indiceSeleccionadoAprobador >= items.length) {
    indiceSeleccionadoAprobador = 0;
  } else if (indiceSeleccionadoAprobador < 0) {
    indiceSeleccionadoAprobador = items.length - 1;
  }
  
  // Aplicar nueva selección
  if (items[indiceSeleccionadoAprobador]) {
    items[indiceSeleccionadoAprobador].classList.add("selected");
    items[indiceSeleccionadoAprobador].scrollIntoView({ block: "nearest" });
  }
}

function seleccionarSugerenciaAprobador(empleado) {
  document.getElementById("aprobadorDNI").value = empleado.DNI;
  ocultarSugerenciasAprobador();
}

/* ============ 9. FILTROS Y PAGINACIÓN ============ */
function inicializarFiltrosYPaginacion() {
  // Cargar años disponibles
  cargarAniosDisponibles();
  
  // Eventos para filtros
  document.getElementById("filtroMes").addEventListener("change", aplicarFiltrosYPaginacion);
  document.getElementById("filtroAnio").addEventListener("change", aplicarFiltrosYPaginacion);
  document.getElementById("btnLimpiarFiltros").addEventListener("click", limpiarFiltros);
  
  // Eventos para paginación
  document.getElementById("btnAnterior").addEventListener("click", () => cambiarPagina(-1));
  document.getElementById("btnSiguiente").addEventListener("click", () => cambiarPagina(1));
}

function cargarAniosDisponibles() {
  const selectAnio = document.getElementById("filtroAnio");
  const anioActual = new Date().getFullYear();
  
  // Limpiar opciones existentes (mantener "Todos los años")
  selectAnio.innerHTML = '<option value="">Todos los años</option>';
  
  // Agregar años desde 2020 hasta el año actual + 1
  for (let anio = anioActual + 1; anio >= 2020; anio--) {
    const option = document.createElement("option");
    option.value = anio;
    option.textContent = anio;
    selectAnio.appendChild(option);
  }
}

function aplicarFiltrosYPaginacion() {
  // Obtener valores de filtros
  filtroMes = document.getElementById("filtroMes").value;
  filtroAnio = document.getElementById("filtroAnio").value;
  
  // Filtrar justificaciones
  justificacionesFiltradas = todasLasJustificaciones.filter(justificacion => {
    let fecha;
    
    // Manejar diferentes formatos de fecha de manera más robusta
    if (typeof justificacion.Fecha === 'string') {
      // Si es una fecha ISO (ej: "2025-08-02T00:00:00.000Z")
      if (justificacion.Fecha.includes('T')) {
        fecha = new Date(justificacion.Fecha);
      } else if (justificacion.Fecha.includes('-')) {
        // Si es formato YYYY-MM-DD, crear fecha en UTC
        const [year, month, day] = justificacion.Fecha.split('-').map(Number);
        fecha = new Date(Date.UTC(year, month - 1, day));
      } else {
        // Otros formatos
        fecha = new Date(justificacion.Fecha);
      }
    } else {
      fecha = new Date(justificacion.Fecha);
    }
    
    // Verificar si la fecha es válida
    if (isNaN(fecha.getTime())) {
      return false;
    }
    
    // Usar UTC para evitar problemas de zona horaria
    const mes = fecha.getUTCMonth() + 1; // getUTCMonth() devuelve 0-11, convertimos a 1-12
    const anio = fecha.getUTCFullYear();
    
    // Aplicar filtro de mes (solo si hay filtro activo)
    if (filtroMes && filtroMes !== '') {
      const mesFiltro = parseInt(filtroMes);
      if (mes !== mesFiltro) {
        return false;
      }
    }
    
    // Aplicar filtro de año (solo si hay filtro activo)
    if (filtroAnio && filtroAnio !== '') {
      const anioFiltro = parseInt(filtroAnio);
      if (anio !== anioFiltro) {
        return false;
      }
    }
    
    return true;
  });
  
  // Ordenar justificaciones por fecha en orden descendente (más recientes primero)
  justificacionesFiltradas.sort((a, b) => {
    let fechaA, fechaB;
    
    // Procesar fecha A
    if (typeof a.Fecha === 'string') {
      if (a.Fecha.includes('T')) {
        fechaA = new Date(a.Fecha);
      } else if (a.Fecha.includes('-')) {
        const [yearA, monthA, dayA] = a.Fecha.split('-').map(Number);
        fechaA = new Date(Date.UTC(yearA, monthA - 1, dayA));
      } else {
        fechaA = new Date(a.Fecha);
      }
    } else {
      fechaA = new Date(a.Fecha);
    }
    
    // Procesar fecha B
    if (typeof b.Fecha === 'string') {
      if (b.Fecha.includes('T')) {
        fechaB = new Date(b.Fecha);
      } else if (b.Fecha.includes('-')) {
        const [yearB, monthB, dayB] = b.Fecha.split('-').map(Number);
        fechaB = new Date(Date.UTC(yearB, monthB - 1, dayB));
      } else {
        fechaB = new Date(b.Fecha);
      }
    } else {
      fechaB = new Date(b.Fecha);
    }
    
    // Ordenar descendente (más reciente primero)
    return fechaB - fechaA;
  });
  
  // Resetear a la primera página
  paginaActual = 1;
  
  // Mostrar justificaciones paginadas
  mostrarJustificacionesPaginadas();
  
  // Actualizar estadísticas con las justificaciones filtradas
  calcularEstadisticasJustificaciones(justificacionesFiltradas);
  
  // Actualizar controles de paginación
  actualizarControlesPaginacion();
}

function mostrarJustificacionesPaginadas() {
  const tbody = document.getElementById("justificacionesTable");
  
  if (!justificacionesFiltradas || justificacionesFiltradas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">
          <i class="fas fa-info-circle me-2"></i>
          ${todasLasJustificaciones.length === 0 ? 'No hay justificaciones registradas' : 'No hay justificaciones que coincidan con los filtros aplicados'}
        </td>
      </tr>
    `;
    return;
  }
  
  // Calcular índices para la página actual
  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const justificacionesPagina = justificacionesFiltradas.slice(inicio, fin);
  
  tbody.innerHTML = justificacionesPagina.map(justificacion => {
    const fechaFormateada = formatearFecha(justificacion.Fecha);
    const estadoClass = justificacion.Estado === 'Aprobado' ? 'estado-aprobado' : 'estado-desaprobado';
    
    return `
      <tr>
        <td>
          <i class="fas fa-calendar me-2"></i>
          ${fechaFormateada}
        </td>
        <td>
          <i class="fas fa-tag me-2"></i>
          ${justificacion.TipoJustificacion || "No especificado"}
        </td>
        <td>
          <i class="fas fa-comment me-2"></i>
          ${justificacion.Motivo || "Sin motivo especificado"}
        </td>
        <td>
          <i class="fas fa-check-circle me-2"></i>
          <span class="${estadoClass}">${justificacion.Estado}</span>
        </td>
        <td>
          <i class="fas fa-user me-2"></i>
          ${justificacion.AprobadorDNI || "No especificado"}
        </td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="eliminarJustificacion(${justificacion.JustificacionID})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function actualizarControlesPaginacion() {
  const totalJustificaciones = justificacionesFiltradas.length;
  const totalPaginas = Math.ceil(totalJustificaciones / elementosPorPagina);
  
  // Actualizar información de paginación
  const inicio = (paginaActual - 1) * elementosPorPagina + 1;
  const fin = Math.min(paginaActual * elementosPorPagina, totalJustificaciones);
  
  document.getElementById("infoPaginacion").textContent = 
    `Mostrando ${inicio} a ${fin} de ${totalJustificaciones} justificaciones`;
  
  document.getElementById("paginaActual").textContent = paginaActual;
  document.getElementById("totalPaginas").textContent = totalPaginas;
  
  // Actualizar estado de botones
  document.getElementById("btnAnterior").disabled = paginaActual <= 1;
  document.getElementById("btnSiguiente").disabled = paginaActual >= totalPaginas;
}

function cambiarPagina(direccion) {
  const nuevaPagina = paginaActual + direccion;
  const totalPaginas = Math.ceil(justificacionesFiltradas.length / elementosPorPagina);
  
  if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
    paginaActual = nuevaPagina;
    mostrarJustificacionesPaginadas();
    actualizarControlesPaginacion();
  }
}

function limpiarFiltros() {
  document.getElementById("filtroMes").value = "";
  document.getElementById("filtroAnio").value = "";
  aplicarFiltrosYPaginacion();
}
