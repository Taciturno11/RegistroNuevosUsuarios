const API = "";

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

  // Cargar tipos de justificación
  await cargarTiposJustificacion();
  
  // Establecer fecha actual por defecto
  document.getElementById("fecha").value = new Date().toISOString().split('T')[0];
});

/* ============ 2. CARGAR TIPOS DE JUSTIFICACIÓN ============ */
async function cargarTiposJustificacion() {
  try {
    const res = await auth.fetchWithAuth(`${API}/justificaciones/tipos`);
    if (res.ok) {
      const tipos = await res.json();
      const select = document.getElementById("tipo");
      
      select.innerHTML = '<option value="">Seleccione una opción</option>' +
        tipos.map(tipo => `<option value="${tipo.TipoID}">${tipo.NombreTipo}</option>`).join("");
    }
  } catch (error) {
    console.error("Error cargando tipos de justificación:", error);
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

  if (!fecha || !tipo || !estado || !aprobadorDNI) {
    mostrarMsg(false, { error: "Por favor complete todos los campos obligatorios" });
    return;
  }

  try {
    const payload = {
      DNI: dni,
      Fecha: fecha,
      TipoJustificacionID: parseInt(tipo),
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
      
      // Redirigir al dashboard después de un tiempo
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
    
  } catch (error) {
    console.error("Error registrando justificación:", error);
    mostrarMsg(false, { error: "Error al registrar justificación" });
  }
});

/* ============ 4. FUNCIONES UTILITARIAS ============ */
function mostrarMsg(ok, obj) {
  const div = document.createElement("div");
  div.className = `alert alert-${ok ? "success" : "danger"} mt-3`;
  div.textContent = ok ? obj.mensaje : (obj.error || "Error desconocido");
  
  // Insertar después del formulario
  const form = document.getElementById("formRegistrar");
  form.parentNode.insertBefore(div, form.nextSibling);
  
  // Auto-ocultar mensaje después de 5 segundos
  setTimeout(() => {
    div.remove();
  }, 5000);
}
