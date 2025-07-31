const API = "";              // mismo host:puerto, vacío = relativa a la misma IP

/* ============ 0. Mapa JornadaID → prefijo ============ */
const prefijoJornada = { 1: "Full Time", 3: "Part Time", 2: "Semi Full" };
let gruposHorasCache = [];            // se llenará 1 sola vez

/* ============ 1. CARGA DE CATÁLOGOS ============ */
async function cargarCatalogos() {
  const res  = await auth.fetchWithAuth(`${API}/catalogos`);
  const data = await res.json();

  llenarSelect("JornadaID",  data.jornadas);
  llenarSelect("CampañaID",  data.campanias);
  llenarSelect("CargoID",    data.cargos);
  llenarSelect("ModalidadID",data.modalidades);
}
function llenarSelect(id, arr) {
  const sel = document.getElementById(id);
  sel.innerHTML =
    `<option value="" selected hidden>-- Elegir --</option>` +     // ahora oculto
    arr.map(o => `<option value="${o.id}">${o.nombre}</option>`).join("");
}


/* ============ 2. PRECARGAR GRUPOS + HORAS (una sola vez) ============ */
async function precargarGruposHoras() {
  const res  = await auth.fetchWithAuth(`${API}/grupos/horas`);
  gruposHorasCache = await res.json(); // [{ NombreBase, HoraIni, HoraFin }]
}

/* ============ 3. Al cambiar JORNADA -> filtrar grupos ============ */

/* ====== Jornada → Turno (Mañana/Tarde) y luego Horario ====== */
const selJornada = document.getElementById("JornadaID");
const selTurno   = document.getElementById("Turno");
const selBase    = document.getElementById("grupoBase");
const selDesc    = document.getElementById("GrupoHorarioID");

/* 1) Al cambiar Jornada */
selJornada.addEventListener("change", () => {
  const prefijo = prefijoJornada[selJornada.value] || "";

  // limpia Turno, Horario, Descanso
  selTurno.innerHTML = '<option value="">-- Elegir --</option>';
  selTurno.disabled   = !prefijo;
  selBase.innerHTML   = '<option value="">-- Elegir --</option>';
  selDesc.innerHTML   = '<option value="">-- Elegir descanso --</option>';

  if (!prefijo) return;

  // ¿existe Mañana? ¿existe Tarde?
  const hayManana = gruposHorasCache.some(g => g.NombreBase.startsWith(prefijo + " Mañana"));
  const hayTarde  = gruposHorasCache.some(g => g.NombreBase.startsWith(prefijo + " Tarde"));

  if (hayManana) selTurno.innerHTML += '<option value="Mañana">Mañana</option>';
  if (hayTarde ) selTurno.innerHTML += '<option value="Tarde">Tarde</option>';
});

/* 2) Al cambiar Turno → llena Horario */
selTurno.addEventListener("change", () => {
  const prefijo = prefijoJornada[selJornada.value] || "";
  const turno   = selTurno.value;           // Mañana / Tarde
  /* Ejemplo selBase, selDesc */
  selBase.innerHTML = '<option value="" selected hidden>-- Elegir --</option>';
  selDesc.innerHTML = '<option value="" selected hidden>-- Elegir descanso --</option>';


  if (!turno) return;

  const filtrados = gruposHorasCache.filter(g =>
    g.NombreBase.startsWith(`${prefijo} ${turno}`));

  selBase.innerHTML += filtrados.map(g =>
    `<option value="${g.NombreBase}">
       ${g.HoraIni} - ${g.HoraFin}
     </option>`
  ).join("");
});


/* ============ 4. GRUPOS BASE (se carga tras elegir Jornada) ============ */
async function cargarGruposBase() {
  /* mantengo tu función por si la llamas en otro lugar
     pero aquí ya no hace falta inicializarla al arranque */
}

/* ============ 5. DESCANSOS (7 por base) ============ */
document.getElementById("grupoBase").addEventListener("change", async e => {
  const base    = e.target.value;
  const selDesc = document.getElementById("GrupoHorarioID");
  selDesc.innerHTML = '';

  if (!base) return;

  const res  = await auth.fetchWithAuth(`/grupos/${encodeURIComponent(base)}`);
  const desc = await res.json();                         // [{ GrupoID, NombreGrupo }]

  // 1. Mapa Día → objeto
  const map = desc.reduce((acc, d) => {
    const dia = d.NombreGrupo.match(/\(Desc\. ([^)]+)\)/i)?.[1] || d.NombreGrupo;
    acc[dia] = { id: d.GrupoID, texto: dia };
    return acc;
  }, {});

  // 2. Orden deseado
  const orden = ["Dom","Sab","Lun","Mar","Mie","Jue","Vie"];

  // 3. Genera las opciones en ese orden
  selDesc.innerHTML = '<option value="">-- Elegir descanso --</option>' +
    orden.filter(d => map[d])
         .map(d => `<option value="${map[d].id}">${map[d].texto}</option>`)
         .join("");
});

/* ============ 6. AUTOCOMPLETES ============ */
async function cargarDatalist(cargoID, datalistId, search = "") {
  const res  = await auth.fetchWithAuth(`${API}/empleados/lookup?cargo=${cargoID}&search=${search}`);
  const data = await res.json();

  const dl = document.getElementById(datalistId);
  dl.innerHTML = data
    .map(e => `<option value="${e.DNI}">${e.NOMBRECOMPLETO ?? e.NombreCompleto}</option>`)
    .join("");
}
["SupervisorDNI","CoordinadorDNI","JefeDNI"].forEach(id => {
  const cargoMap = { SupervisorDNI:"5", CoordinadorDNI:"2,8", JefeDNI:"8" };
  const listMap  = { SupervisorDNI:"listaSupervisores", CoordinadorDNI:"listaCoordinadores", JefeDNI:"listaJefes" };
  document.getElementById(id).addEventListener("input", e => {
    cargarDatalist(cargoMap[id], listMap[id], e.target.value);
  });
});

/* ============ 7. ENVÍO DEL FORMULARIO ============ */
document.getElementById("formEmpleado").addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
    DNI:               val("DNI"),
    Nombres:           val("Nombres"),
    ApellidoPaterno:   val("ApellidoPaterno"),
    ApellidoMaterno:   val("ApellidoMaterno"),
    FechaContratacion: val("FechaContratacion"),
    JornadaID:         num("JornadaID"),
    CampañaID:         num("CampañaID"),
    CargoID:           num("CargoID"),
    ModalidadID:       num("ModalidadID"),
    GrupoHorarioID:    num("GrupoHorarioID"),
    SupervisorDNI:     opc("SupervisorDNI"),
    CoordinadorDNI:    opc("CoordinadorDNI"),
    JefeDNI:           opc("JefeDNI")
  };

  const res = await auth.fetchWithAuth(`${API}/empleados`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  mostrarMsg(res.ok, await res.json());
  if (res.ok) e.target.reset();
});
function val(id){return document.getElementById(id).value.trim();}
function num(id){return parseInt(val(id));}
function opc(id){const v=val(id);return v===""?null:v;}
function mostrarMsg(ok,obj){
  const div=document.getElementById("msg");
  div.className=`alert mt-4 alert-${ok?"success":"danger"}`;
  div.textContent= ok?obj.mensaje : (obj.error||"Errores en el formulario");
  div.classList.remove("d-none");
}

/* ============ 8. INICIO ============ */
// Verificar autenticación antes de cargar datos
auth.checkAuth().then(() => {
  cargarCatalogos();
  precargarGruposHoras();        // ← carga cache una vez
      // auth.displayUserInfo();         // Mostrar info del usuario (REMOVED - Solo cerrar sesión desde dashboard)
}); 