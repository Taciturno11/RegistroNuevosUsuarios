/* public/ojt.js */
const $ = id => document.getElementById(id);

let DNI_ACTUAL   = "";      // DNI que se está trabajando
let REGISTRO_SEL = null;    // UsoCICID que se está editando (o null si es alta)

/* ===== 0. UTILIDADES ===== */
const fmt = iso =>
  new Date(iso).toLocaleString('es-PE', { hour12: false });

function toInputDate(txt) {
  // “27/6/2025, 13:00:00” → “2025-06-27T13:00”
  const [d, m, y, h, mi] = txt.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+)/).slice(1);
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2,'0')}:${mi}`;
}

// Normaliza “2025-06-27T20:00” → “2025-06-27 20:00:00”
const normalizar = s => s ? s.replace('T', ' ') + ':00' : null;

/* ==== 0. CARGAR DNIs para autocomplete ==== */
async function cargarDNIs() {
  try {
    const res  = await fetch('/ojt/dnis');
    const data = await res.json();               // [{ DNI: "00123456" }, …]
    $('listaDNI').innerHTML =
      data.map(d => `<option value="${d.DNI}">`).join('');
  } catch (err) {
    console.error('Error cargando DNIs OJT:', err);
  }
}

/* ==== 1. VALIDAR DNI ==== */
function validarDNI() {
  DNI_ACTUAL = $('dni').value.trim();
  if (!DNI_ACTUAL) {
    alert('Ingrese un DNI');
    return;
  }

  fetch(`/ojt/${DNI_ACTUAL}/historial`)
    .then(res => {
      if (!res.ok) throw new Error('Error al consultar historial');
      return res.json();
    })
    .then(data => {
      pintarTabla(data);
      $('historialBox').classList.remove('d-none');
      $('accionesBox').classList.remove('d-none');
      $('btnEditar').classList.add('d-none');
    })
    .catch(err => alert(err.message));
}

/* ==== 2. PINTAR TABLA ==== */
function pintarTabla(arr) {
  const tbody = $('tablaHistorial');
  if (!arr.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin registros</td></tr>';
    return;
  }
  tbody.innerHTML = arr.map(r => `
    <tr>
      <td>${r.UsoCICID}</td>
      <td>${r.NombreUsuarioCIC}</td>
      <td>${fmt(r.FechaHoraInicio)}</td>
      <td>${r.FechaHoraFin ? fmt(r.FechaHoraFin) : '<em>Activo</em>'}</td>
      <td>
        <button class="btn btn-sm btn-link" onclick="seleccionar(${r.UsoCICID})">Editar</button>
      </td>
    </tr>
  `).join('');
}

/* ==== 3. NUEVO REGISTRO ==== */
function nuevoRegistro() {
  REGISTRO_SEL = null;
  $('formOJT').reset();
  $('UsoCICID').value      = "";
  $('FechaHoraFin').value   = "";
  mostrarForm(true);
  $('btnEditar').classList.add('d-none');
}

/* ==== 4. EDITAR ==== */
window.seleccionar = id => {
  const fila = [...document.querySelectorAll('#tablaHistorial tr')]
    .find(tr => tr.firstElementChild.textContent == id);
  if (!fila) return;

  REGISTRO_SEL               = id;
  $('UsoCICID').value        = id;
  $('UsuarioCIC').value      = fila.children[1].textContent;
  $('FechaHoraInicio').value = toInputDate(fila.children[2].textContent);
  $('FechaHoraFin').value    = fila.children[3].textContent.startsWith('Activo')
    ? "" : toInputDate(fila.children[3].textContent);
  $('Observaciones').value   = "";
  mostrarForm(true);
  $('btnEditar').classList.remove('d-none');
};

function mostrarForm(show) {
  $('formOJT').classList.toggle('d-none', !show);
}

/* ==== 5. ENVIAR FORMULARIO ==== */
function enviarForm(e) {
  e.preventDefault();

  const payload = {
    UsuarioCIC      : $('UsuarioCIC').value.trim(),
    DNIEmpleado     : DNI_ACTUAL,
    FechaHoraInicio : normalizar($('FechaHoraInicio').value),
    FechaHoraFin    : normalizar($('FechaHoraFin').value),
    Observaciones   : $('Observaciones').value.trim() || null
  };

  const url    = REGISTRO_SEL ? `/ojt/${REGISTRO_SEL}` : '/ojt';
  const method = REGISTRO_SEL ? 'PATCH' : 'POST';

  fetch(url, {
    method,
    headers: { 'Content-Type':'application/json' },
    body   : JSON.stringify(payload)
  })
    .then(res => res.json().then(json => ({ ok: res.ok, json })))
    .then(({ok, json}) => {
      mostrarMsg(ok, json.mensaje || json.error);
      if (ok) {
        mostrarForm(false);
        $('btnValidar').click(); // refresca historial
      }
    })
    .catch(err => mostrarMsg(false, err.message));
}

/* ==== 6. MENSAJES ==== */
function mostrarMsg(ok, msg) {
  const div = $('msg');
  div.textContent = msg;
  div.className   = `alert mt-3 alert-${ok ? 'success' : 'danger'}`;
  div.classList.remove('d-none');
}

/* ==== INICIALIZACIÓN ==== */
document.addEventListener('DOMContentLoaded', () => {
  cargarDNIs();
  $('btnValidar').onclick = validarDNI;
  $('btnNuevo').onclick   = nuevoRegistro;
  $('formOJT').onsubmit   = enviarForm;
});
