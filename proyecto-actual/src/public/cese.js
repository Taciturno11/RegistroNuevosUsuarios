// src/public/cese.js
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

  // Cargar información del empleado
  await cargarEmpleado();

  // Event listener para anular cese
  document.getElementById("btnAnularCese").addEventListener("click", anularCese);
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
    
    // Verificar si el empleado ya está cesado
    if (empleado.EstadoEmpleado === 'Cesado') {
      // No mostrar error, solo cambiar la interfaz
      document.getElementById("formCese").style.display = "none";
      document.getElementById("anularCeseSection").style.display = "block";
      document.getElementById("employeeDNI").textContent = `DNI: ${dni} | Estado: Cesado`;
      return;
    }

    // Si tiene fecha de cese, mostrarla
    if (empleado.FechaCese) {
      document.getElementById("fechaCese").value = empleado.FechaCese.split('T')[0];
    }
    
  } catch (error) {
    console.error("Error cargando empleado:", error);
    mostrarMsg(false, { error: "Error al cargar información del empleado" });
  }
}

/* ============ 3. ENVÍO DEL FORMULARIO ============ */
document.getElementById("formCese").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fechaCese = document.getElementById("fechaCese").value;
  
  if (!fechaCese) {
    mostrarMsg(false, { error: "Por favor seleccione una fecha de cese" });
    return;
  }

  try {
    const res = await auth.fetchWithAuth(`${API}/cese/${dni}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fechaCese })
    });

    const result = await res.json();
    mostrarMsg(res.ok, result);
    
    if (res.ok) {
      // Limpiar formulario
      document.getElementById("fechaCese").value = "";
      
      // Actualizar estado visual
      document.getElementById("employeeDNI").textContent = `DNI: ${dni} | Estado: Cesado`;
      
      // Ocultar formulario y mostrar botón de anular
      document.getElementById("formCese").style.display = "none";
      document.getElementById("anularCeseSection").style.display = "block";
      
      // Ocultar formulario después de un tiempo (REMOVED)
      // setTimeout(() => {
      //   window.location.href = "/";
      // }, 2000);
    }
    
  } catch (error) {
    console.error("Error registrando cese:", error);
    mostrarMsg(false, { error: "Error al registrar cese" });
  }
});

/* ============ 4. ANULAR CESE ============ */
async function anularCese() {
  if (!confirm("¿Está seguro que desea anular el cese de este empleado?")) {
    return;
  }

  try {
    const res = await auth.fetchWithAuth(`${API}/cese/${dni}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    const result = await res.json();
    mostrarMsg(res.ok, result);
    
    if (res.ok) {
      // Actualizar estado visual
      document.getElementById("employeeDNI").textContent = `DNI: ${dni} | Estado: Activo`;
      
      // Mostrar formulario de cese y ocultar botón de anular
      document.getElementById("formCese").style.display = "flex";
      document.getElementById("anularCeseSection").style.display = "none";
      
      // Limpiar fecha de cese
      document.getElementById("fechaCese").value = "";
    }
    
  } catch (error) {
    console.error("Error anulando cese:", error);
    mostrarMsg(false, { error: "Error al anular cese" });
  }
}

/* ============ 4. FUNCIONES UTILITARIAS ============ */
function mostrarMsg(ok, obj) {
  const div = document.getElementById("msg");
  div.className = `alert mt-3 alert-${ok ? "success" : "danger"}`;
  div.textContent = ok ? obj.mensaje : (obj.error || "Error desconocido");
  div.classList.remove("d-none");
  
  // El mensaje permanecerá visible hasta que se recargue la página o se muestre otro mensaje
}
