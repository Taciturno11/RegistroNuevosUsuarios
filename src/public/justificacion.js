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
  
  // Cargar justificaciones existentes
  await cargarJustificacionesExistentes();
  
  // Establecer fecha actual por defecto
  document.getElementById("fecha").value = new Date().toISOString().split('T')[0];
  
  // Auto-completar aprobador con el usuario actual
  const userInfo = auth.getUserInfo();
  if (userInfo.dni) {
    document.getElementById("aprobadorDNI").value = userInfo.dni;
  }
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
    
    const justificaciones = await res.json();
    mostrarJustificaciones(justificaciones);
    
  } catch (error) {
    console.error("Error cargando justificaciones:", error);
  }
}

function mostrarJustificaciones(justificaciones) {
  const tbody = document.getElementById("justificacionesTable");
  
  if (!justificaciones || justificaciones.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">
          <i class="fas fa-info-circle me-2"></i>
          No hay justificaciones registradas
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = justificaciones.map(justificacion => {
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
    
    // Recargar justificaciones
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
