const API = "";              // mismo host:puerto, vacío = relativa a la misma IP

// =================== CARGA DE CATÁLOGOS ===================
async function cargarCatalogos() {
  const res = await fetch(`${API}/catalogos`);
  const data = await res.json();

  llenarSelect("JornadaID",  data.jornadas);
  llenarSelect("CampañaID",  data.campanias);
  llenarSelect("CargoID",    data.cargos);
  llenarSelect("ModalidadID",data.modalidades);
}

function llenarSelect(id, arr) {
  const sel = document.getElementById(id);
  sel.innerHTML = `<option value="">-- Elegir --</option>` +
    arr.map(o => `<option value="${o.id}">${o.nombre}</option>`).join("");
}

// ========== 1. GRUPOS BASE (32 opciones) ==========
// ========== 1. GRUPOS BASE (nombre + rango) ==========
async function cargarGruposBase() {
  const res   = await fetch(`${API}/grupos/horas`);
  const bases = await res.json();   // [{ NombreBase, HoraIni, HoraFin }]

  const sel = document.getElementById("grupoBase");
  sel.innerHTML = '<option value="">-- Elegir --</option>' +
    bases.map(b =>
      `<option value="${b.NombreBase}">
         ${b.NombreBase} · ${b.HoraIni} - ${b.HoraFin}
       </option>`
    ).join("");
}


// ========== 2. DESCANSOS (7 por base) ==========
// ========== 2. DESCANSOS (7 por base) ==========
document.getElementById("grupoBase").addEventListener("change", async e => {
  const base = e.target.value;
  const selDesc = document.getElementById("GrupoHorarioID");
  selDesc.innerHTML = '';

  if (!base) return;

  const res  = await fetch(`/grupos/${encodeURIComponent(base)}`);
  const desc = await res.json();                         // [{ GrupoID, NombreGrupo }, ...]

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
    orden
      .filter(d => map[d])                      // solo los que existan
      .map(d => `<option value="${map[d].id}">${map[d].texto}</option>`)
      .join("");
});



// =================== AUTOCOMPLETES ===================
async function cargarDatalist(cargoID, datalistId, search = "") {
  const res = await fetch(`${API}/empleados/lookup?cargo=${cargoID}&search=${search}`);
  const data = await res.json();

  const dl = document.getElementById(datalistId);
  dl.innerHTML = data
    .map(e => `<option value="${e.DNI}">${e.NOMBRECOMPLETO ?? e.NombreCompleto}</option>`)
    .join("");
}

// === AUTOCOMPLETES ===
["SupervisorDNI", "CoordinadorDNI", "JefeDNI"].forEach(id => {
  const cargoMap = {
    SupervisorDNI: "5",      // Supervisores
    CoordinadorDNI: "2,8",   // Coordinadores + Jefes
    JefeDNI:        "8"      // Solo Jefes
  };

  // NUEVO: nombre correcto de cada datalist
  const listMap = {
    SupervisorDNI: "listaSupervisores",
    CoordinadorDNI: "listaCoordinadores",
    JefeDNI:        "listaJefes"
  };

  document.getElementById(id).addEventListener("input", e => {
    cargarDatalist(
      cargoMap[id],
      listMap[id],         // ← usa el id exacto
      e.target.value
    );
  });
});


// =================== ENVÍO DEL FORMULARIO ===================
document.getElementById("formEmpleado").addEventListener("submit", async e => {
  e.preventDefault();

  // Construye payload
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
    GrupoHorarioID:    num("GrupoHorarioID"),      // ← ID del descanso elegido
    SupervisorDNI:     opc("SupervisorDNI"),
    CoordinadorDNI:    opc("CoordinadorDNI"),
    JefeDNI:           opc("JefeDNI")
  };

  // POST a la API
  const res = await fetch(`${API}/empleados`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  mostrarMsg(res.ok, await res.json());
  if (res.ok) e.target.reset();
});

function val(id)  { return document.getElementById(id).value.trim(); }
function num(id)  { return parseInt(val(id)); }
function opc(id)  { const v = val(id); return v === "" ? null : v; }

function mostrarMsg(ok, obj) {
  const div = document.getElementById("msg");
  div.className = `alert mt-4 alert-${ok ? "success" : "danger"}`;
  div.textContent = ok ? obj.mensaje : (obj.error || "Errores en el formulario");
  div.classList.remove("d-none");
}

// =================== INICIO ===================
cargarCatalogos();
cargarGruposBase();           // ← nuevo
