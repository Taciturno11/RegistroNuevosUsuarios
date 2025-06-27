/* public/ojt.js */
const $ = id => document.getElementById(id);

let DNI_ACTUAL   = "";      // DNI que se está trabajando
let REGISTRO_SEL = null;    // UsoCICID que se está editando (o null si es alta)

/* ---------- 0. UTILIDADES ---------- */
const fmt = iso => new Date(iso)
  .toLocaleString('es-PE', { hour12:false });

function toInputDate(txt){          // “27/6/2025, 13:00:00” → 2025-06-27T13:00
  const [d,m,y,h,mi] = txt.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+)/).slice(1);
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${h.padStart(2,'0')}:${mi}`;
}

/*   Normalizamos lo que sale del <datetime-local> para que *no* se desplace
     - 2025-06-27T20:00  →  "2025-06-27 20:00:00"    */
const normalizar = s => s ? s.replace('T',' ') + ':00' : null;

/* ---------- 1. VALIDAR DNI ---------- */
$('btnValidar').onclick = async () => {
  DNI_ACTUAL = $('dni').value.trim();
  if (!DNI_ACTUAL) { alert('Ingrese un DNI'); return; }

  const res = await fetch(`/ojt/${DNI_ACTUAL}/historial`);
  if (!res.ok) { alert('Error al consultar historial'); return; }

  const data = await res.json();
  pintarTabla(data);

  $('historialBox').classList.remove('d-none');
  $('accionesBox').classList.remove('d-none');
  $('btnEditar').classList.add('d-none');
};

/* ---------- 2. TABLA ---------- */
function pintarTabla(arr){
  const tbody = $('tablaHistorial');
  if (!arr.length){
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin registros</td></tr>';
    return;
  }
  tbody.innerHTML = arr.map(r=>`
    <tr>
      <td>${r.UsoCICID}</td>
      <td>${r.NombreUsuarioCIC}</td>
      <td>${fmt(r.FechaHoraInicio)}</td>
      <td>${r.FechaHoraFin ? fmt(r.FechaHoraFin) : '<em>Activo</em>'}</td>
      <td><button class="btn btn-sm btn-link" onclick="seleccionar(${r.UsoCICID})">Editar</button></td>
    </tr>`).join("");
}

/* ---------- 3. NUEVO REGISTRO ---------- */
$('btnNuevo').onclick = () => {
  REGISTRO_SEL = null;
  $('formOJT').reset();
  $('UsoCICID').value = "";
  $('FechaHoraFin').value = "";
  mostrarForm(true);
  $('btnEditar').classList.add('d-none');
};

/* ---------- 4. EDITAR ---------- */
window.seleccionar = (id) => {
  const fila = [...document.querySelectorAll('#tablaHistorial tr')]
              .find(tr => tr.firstElementChild.textContent == id);
  if (!fila) return;

  REGISTRO_SEL                 = id;
  $('UsoCICID').value          = id;
  $('UsuarioCIC').value        = fila.children[1].textContent;
  $('FechaHoraInicio').value   = toInputDate(fila.children[2].textContent);
  $('FechaHoraFin').value      = fila.children[3].textContent.startsWith('Activo')
                                 ? "" : toInputDate(fila.children[3].textContent);
  $('Observaciones').value     = "";
  mostrarForm(true);
  $('btnEditar').classList.remove('d-none');
};

function mostrarForm(show){
  $('formOJT').classList.toggle('d-none', !show);
}

/* ---------- 5. ENVIAR ---------- */
$('formOJT').onsubmit = async e => {
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

  const res = await fetch(url, {
    method,
    headers : { 'Content-Type':'application/json' },
    body    : JSON.stringify(payload)
  });
  const data = await res.json();

  mostrarMsg(res.ok, data.mensaje || data.error);
  if (res.ok){
    mostrarForm(false);
    $('btnValidar').click();       // refrescar historial
  }
};

/* ---------- 6. MENSAJES ---------- */
function mostrarMsg(ok,msg){
  const div = $('msg');
  div.textContent = msg;
  div.className   = `alert mt-3 alert-${ok?'success':'danger'}`;
  div.classList.remove('d-none');
}
