const API = "";

// Obtener DNI del localStorage
const dni = localStorage.getItem('empleadoDNI');
const nombreEmpleado = localStorage.getItem('empleadoNombre');

// Variables globales
let historial = [];
let registroEditando = null;

/* ============ 1. INICIALIZACIÓN ============ */
document.addEventListener('DOMContentLoaded', async () => {
  if (!dni) {
    mostrarMsg(false, { error: "No se ha seleccionado un empleado. Regrese al dashboard." });
    return;
  }

  // Mostrar información del empleado
  document.getElementById("employeeName").textContent = nombreEmpleado || "Empleado";
  document.getElementById("employeeDNI").textContent = `DNI: ${dni}`;

  // Cargar historial
  await cargarHistorial();
  
  // Configurar eventos
  configurarEventos();
});

/* ============ 2. CARGAR HISTORIAL ============ */
async function cargarHistorial() {
  try {
    const res = await auth.fetchWithAuth(`${API}/ojt/${dni}/historial`);
    if (res.ok) {
      historial = await res.json();
      mostrarHistorial();
    }
  } catch (error) {
    console.error("Error cargando historial:", error);
  }
}

/* ============ 3. MOSTRAR HISTORIAL ============ */
function mostrarHistorial() {
  const tbody = document.getElementById("tablaHistorial");
  
  if (historial.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay registros</td></tr>';
    return;
  }
  
  tbody.innerHTML = historial.map(reg => `
    <tr>
      <td>${reg.UsoCICID}</td>
      <td>${reg.NombreUsuarioCIC || reg.UsuarioCIC}</td>
      <td>${formatearFecha(reg.FechaHoraInicio)}</td>
      <td>${reg.FechaHoraFin ? formatearFecha(reg.FechaHoraFin) : '<em>Activo</em>'}</td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editarRegistro(${reg.UsoCICID})" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarRegistro(${reg.UsoCICID})" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

/* ============ 4. CONFIGURAR EVENTOS ============ */
function configurarEventos() {
  // Botón nuevo registro
  document.getElementById("btnNuevo").addEventListener("click", () => {
    registroEditando = null;
    mostrarFormulario();
    limpiarFormulario();
  });
  
  // Botón editar
  document.getElementById("btnEditar").addEventListener("click", () => {
    if (registroEditando) {
      mostrarFormulario();
    }
  });
  
  // Envío del formulario
  document.getElementById("formOJT").addEventListener("submit", async (e) => {
    e.preventDefault();
    await guardarRegistro();
  });
}

/* ============ 5. EDITAR REGISTRO ============ */
function editarRegistro(id) {
  const registro = historial.find(r => r.UsoCICID === id);
  if (!registro) return;
  
  registroEditando = registro;
  mostrarFormulario();
  llenarFormulario(registro);
  document.getElementById("btnEditar").classList.remove("d-none");
}

/* ============ 6. MOSTRAR/OCULTAR FORMULARIO ============ */
function mostrarFormulario() {
  document.getElementById("formOJT").classList.remove("d-none");
  document.getElementById("btnEditar").classList.remove("d-none");
}

function ocultarFormulario() {
  document.getElementById("formOJT").classList.add("d-none");
  document.getElementById("btnEditar").classList.add("d-none");
  registroEditando = null;
}

/* ============ 7. LLENAR FORMULARIO ============ */
function llenarFormulario(registro) {
  document.getElementById("UsoCICID").value = registro.UsoCICID;
  document.getElementById("UsuarioCIC").value = registro.NombreUsuarioCIC || registro.UsuarioCIC;
  document.getElementById("FechaHoraInicio").value = toInputDate(registro.FechaHoraInicio);
  document.getElementById("FechaHoraFin").value = registro.FechaHoraFin ? toInputDate(registro.FechaHoraFin) : '';
  document.getElementById("Observaciones").value = registro.Observaciones || '';
}

/* ============ 8. LIMPIAR FORMULARIO ============ */
function limpiarFormulario() {
  document.getElementById("UsoCICID").value = '';
  document.getElementById("UsuarioCIC").value = '';
  document.getElementById("FechaHoraInicio").value = '';
  document.getElementById("FechaHoraFin").value = '';
  document.getElementById("Observaciones").value = '';
}

/* ============ 9. GUARDAR REGISTRO ============ */
async function guardarRegistro() {
  const payload = {
    DNIEmpleado: dni,
    UsuarioCIC: document.getElementById("UsuarioCIC").value,
    FechaHoraInicio: normalizar(document.getElementById("FechaHoraInicio").value),
    FechaHoraFin: normalizar(document.getElementById("FechaHoraFin").value),
    Observaciones: document.getElementById("Observaciones").value
  };

  try {
    const url = registroEditando 
      ? `${API}/ojt/${registroEditando.UsoCICID}`
      : `${API}/ojt`;
    
    const method = registroEditando ? "PATCH" : "POST";
    
    const res = await auth.fetchWithAuth(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    mostrarMsg(res.ok, result);
    
    if (res.ok) {
      // Recargar historial
      await cargarHistorial();
      
      // Ocultar formulario
      ocultarFormulario();
      
      // Limpiar formulario
      limpiarFormulario();
    }
    
  } catch (error) {
    console.error("Error guardando registro:", error);
    mostrarMsg(false, { error: "Error al guardar registro" });
  }
}

/* ============ 10. FUNCIONES UTILITARIAS ============ */
function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-ES', { hour12: false });
}

function toInputDate(txt) {
  // Convertir fecha para input datetime-local
  const date = new Date(txt);
  return date.toISOString().slice(0, 16);
}

function normalizar(s) {
  // Normaliza "2025-06-27T20:00" → "2025-06-27 20:00:00"
  return s ? s.replace('T', ' ') + ':00' : null;
}

function mostrarMsg(ok, obj) {
  const div = document.getElementById("msg");
  div.className = `alert alert-${ok ? "success" : "danger"} mt-3`;
  div.textContent = ok ? (obj.mensaje || "Operación exitosa") : (obj.error || "Error desconocido");
  div.classList.remove("d-none");
  
  // El mensaje permanecerá visible hasta que se recargue la página o se muestre otro mensaje
}

/* ============ 11. ELIMINAR REGISTRO ============ */
async function eliminarRegistro(id) {
  if (!confirm("¿Está seguro que desea eliminar este registro?")) {
    return;
  }

  try {
    const res = await auth.fetchWithAuth(`${API}/ojt/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    const result = await res.json();
    mostrarMsg(res.ok, result);
    
    if (res.ok) {
      // Recargar historial
      await cargarHistorial();
    }
    
  } catch (error) {
    console.error("Error eliminando registro:", error);
    mostrarMsg(false, { error: "Error al eliminar registro" });
  }
}
