document.addEventListener('DOMContentLoaded', () => {
  const datalist = document.getElementById('datalistDNI');
  const btnBuscar = document.getElementById('btnBuscar');
  const dniInput = document.getElementById('dniBuscar');
  const divDatos = document.getElementById('formRegistrar');
  const nombres = document.getElementById('nombres');
  const apellido = document.getElementById('apellido');
  const tipoSelect = document.getElementById('tipo');
  const aprobadorInput = document.getElementById('aprobadorDNI');

  // Cargar DNIs en el datalist
  fetch('/justificaciones/dnis')
    .then(res => res.json())
    .then(data => {
      datalist.innerHTML = data.map(d => `<option value="${d.DNI}">`).join('');
    })
    .catch(err => console.error('Error cargando DNIs:', err));

  // Cargar tipos de justificación
  fetch('/justificaciones/tipos')
    .then(res => res.json())
    .then(data => {
      data.forEach(t => {
        const option = document.createElement('option');
        option.value = t.TipoJustificacion;
        option.textContent = t.TipoJustificacion;
        tipoSelect.appendChild(option);
      });
    })
    .catch(err => console.error('Error cargando tipos de justificación:', err));

  // Buscar empleado y su jefe
  btnBuscar.addEventListener('click', async () => {
    const dni = dniInput.value.trim();

    try {
      const res = await fetch(`/justificaciones/${dni}`);
      if (!res.ok) throw new Error('Empleado no encontrado');
      const data = await res.json();

      nombres.value = data.Nombres;
      apellido.value = data.ApellidoPaterno;
      divDatos.classList.remove('d-none');

      const jefeRes = await fetch(`/justificaciones/${dni}/jefe`);
      if (!jefeRes.ok) throw new Error('No se pudo obtener jefe');
      const jefeData = await jefeRes.json();
      aprobadorInput.value = jefeData.jefeDNI;

    } catch (err) {
      divDatos.classList.add('d-none');
      alert(err.message);
    }
  });

  // Registrar justificación
  const form = document.getElementById('formRegistrar');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      EmpleadoDNI: dniInput.value.trim(),
      Fecha: document.getElementById('fecha').value,
      TipoJustificacion: tipoSelect.value,
      Motivo: document.getElementById('motivo').value,
      Estado: document.getElementById('estado').value,
      AprobadorDNI: aprobadorInput.value.trim()
    };

    try {
      const res = await fetch('/justificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar');

      alert('✅ Justificación registrada correctamente');
      form.reset();
      divDatos.classList.add('d-none');

    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  });
});
