// src/public/cese.js
document.addEventListener('DOMContentLoaded', () => {
  const datalist     = document.getElementById('datalistDNI');
  const inputBuscar  = document.getElementById('dniBuscar');
  const formBuscar   = document.getElementById('formBuscar');
  const formCese     = document.getElementById('formCese');
  const msg          = document.getElementById('msg');

  // Campos del formulario cese
  const dniField     = document.getElementById('dni');
  const nombresField = document.getElementById('nombres');
  const apellidoField= document.getElementById('apellido');
  const fechaCeseInp = document.getElementById('fechaCese');

  let empleadoActual = null;

  // 1) Cargar DNIs activos para el datalist
  fetch('/cese/dnis')
    .then(res => res.json())
    .then(arr => {
      datalist.innerHTML = arr.map(o => `<option value="${o.DNI}">`).join('');
    })
    .catch(() => { /* ignore */ });

  // 2) Buscar empleado al enviar
  formBuscar.addEventListener('submit', async e => {
    e.preventDefault();
    const dni = inputBuscar.value.trim();
    if (!dni) return;

    try {
      const res = await fetch(`/cese/${dni}`);
      if (!res.ok) throw new Error();

      empleadoActual = await res.json();
      formCese.classList.remove('d-none');
      msg.classList.add('d-none');

      // Rellenar campos
      dniField.value      = empleadoActual.DNI;
      nombresField.value  = empleadoActual.Nombres;
      apellidoField.value = empleadoActual.ApellidoPaterno;
      fechaCeseInp.value  = empleadoActual.FechaCese
        ? empleadoActual.FechaCese.split('T')[0]
        : '';
    } catch {
      empleadoActual = null;
      formCese.classList.add('d-none');
      msg.className = 'alert alert-danger mt-3';
      msg.textContent = 'Empleado no encontrado o ya cesado.';
      msg.classList.remove('d-none');
    }
  });

  // 3) Registrar fecha de cese
  formCese.addEventListener('submit', async e => {
    e.preventDefault();
    if (!empleadoActual) return;

    const fecha = fechaCeseInp.value;
    if (!fecha) return;

    try {
      const res = await fetch(`/cese/${empleadoActual.DNI}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaCese: fecha })
      });
      if (!res.ok) throw new Error();

      msg.className = 'alert alert-success mt-3';
      msg.textContent = 'Cese registrado correctamente.';
      msg.classList.remove('d-none');
      formCese.classList.add('d-none');
      inputBuscar.value = '';
    } catch {
      msg.className = 'alert alert-danger mt-3';
      msg.textContent = 'Error al registrar cese.';
      msg.classList.remove('d-none');
    }
  });
});
