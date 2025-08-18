import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

function PopoverPortal({ anchorRef, children, open }) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const popoverRef = useRef(null);

  // Calcular posición cuando se abre
  React.useLayoutEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4, // 4px de margen
        left: rect.left + window.scrollX + rect.width / 2,
        width: rect.width
      });
    }
  }, [open, anchorRef]);

  if (!open) return null;
  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        transform: "translateX(-50%)",
        zIndex: 9999,
        minWidth: 260,
        maxWidth: 320
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export default function AsistenciasTable({ compact, dniCap, CampañaID, mes, fechaInicio, capaNum, horariosBase, jornadaFiltro = "Todos", tablaDatos, dias, onAsistenciaChange, onDesercion, capCount = 5 }) {
  // Estado local para popover
  const [popover, setPopover] = useState({ open: false, row: null, col: null });
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const popoverAnchorRefs = useRef({}); // {row_col: ref}

  // Si no hay datos, mostrar mensaje
  if (!tablaDatos || !tablaDatos.length) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg mb-4">
          📊 No hay datos de asistencia disponibles
        </div>
        <div className="text-gray-400 text-sm">
          Selecciona una campaña y capa para cargar los datos
        </div>
      </div>
    );
  }

  // Filtro de jornada SOLO para visualización de filas
  const jornadaMap = {
    'FullTime': [1, 'FullTime'],
    'PartTime': [3, 'PartTime'],
    'SemiFull': [2, 'SemiFull']
  };
  let postulantesFiltrados = tablaDatos;
  const jornadaKey = jornadaFiltro.replace(/\s/g, '');
  if (jornadaFiltro && jornadaFiltro !== "Todos" && jornadaMap[jornadaKey]) {
    const valores = jornadaMap[jornadaKey];
    postulantesFiltrados = tablaDatos.filter(
      p => valores.includes(p.JornadaID) || valores.includes(p.NombreJornada)
    );
  }

  // Mapeo de Jornada para coincidir con los nombres de grupo (para los selectores)
  const jornadaLabelMap = {
    'FullTime': 'Full Time',
    'PartTime': 'Part Time',
    'SemiFull': 'Semi Full'
  };

  // Ahora la función está dentro del componente y accede a la prop
  function getHorariosFiltrados(modalidad, jornada, turno) {
    const jornadaGrupo = jornadaLabelMap[jornada] || jornada;
    return (horariosBase || [])
      .filter(h => h.jornada === jornadaGrupo && h.turno === turno && h.descanso === 'Dom');
  }

  const estados = ["", "A", "J", "T", "F", "Deserción"];
  const manyColumns = dias.length > 15;
  const thBase = manyColumns ? "px-1 py-1 min-w-0 text-xs" : compact ? "px-2 py-1 min-w-0" : "px-4 py-2";
  const tdBase = manyColumns ? "border px-1 py-1 min-w-0 text-xs" : compact ? "border px-2 py-1 min-w-0" : "border px-4 py-2";
  const selectBase = manyColumns ? "w-full h-full px-0.5 py-0.5 min-w-0 focus:outline-none bg-transparent text-xs" : compact ? "w-full h-full px-1 py-0.5 min-w-0 focus:outline-none bg-transparent text-xs" : "w-full h-full px-1 focus:outline-none bg-transparent";

  // Guardar motivo y deserción
  const handleGuardarMotivo = async () => {
    if (popover.row !== null && popover.col !== null && onDesercion) {
      setGuardando(true);
      try {
        // Llamar a la función del componente padre
        onDesercion(popover.row, popover.col, motivo);
        
        setPopover({ open: false, row: null, col: null });
        setMotivo("");
        alert("Deserción guardada exitosamente");
      } catch (error) {
        console.error("Error guardando deserción:", error);
        alert("Error guardando deserción");
      } finally {
        setGuardando(false);
      }
    }
  };

  // Función para cambiar asistencia
  const handleAsistenciaChange = (rowIndex, colIndex, newValue) => {
    if (newValue === "Deserción") {
      // Abrir popover para motivo
      setPopover({ open: true, row: rowIndex, col: colIndex });
      setMotivo("");
    } else if (onAsistenciaChange) {
      // Llamar a la función del componente padre
      onAsistenciaChange(rowIndex, colIndex, newValue);
    }
  };

  return (
    <div className="rounded-xl w-full p-2 bg-transparent shadow-md relative">
      <div className="w-full overflow-x-auto">
        <table
          className="w-full text-sm rounded-xl overflow-hidden bg-white/80"
          style={{ tableLayout: 'fixed' }}
        >
          <thead>
            <tr>
              {/* Nombre y DNI con fondo beige claro y texto centrado */}
              <th rowSpan={2} className={`${thBase} bg-[#f5ede6] text-[#3d3d3d] text-center font-semibold border-b border-[#e0d7ce] min-w-0 rounded-tl-xl`}>
                Nombre
              </th>
              <th rowSpan={2} className={`${thBase} bg-[#f5ede6] text-[#3d3d3d] text-center font-semibold border-b border-[#e0d7ce] min-w-0`}>
                DNI
              </th>
              <th rowSpan={2} className={`${thBase} bg-[#f5ede6] text-[#3d3d3d] text-center font-semibold border-b border-[#e0d7ce] w-[180px] min-w-[180px]`}>
                Horario
              </th>
              {/* Capacitación y OJT */}
              <th colSpan={capCount}
                  className={`${thBase} bg-[#ffe5b4] text-[#3d3d3d] text-center font-semibold border-b border-[#e0d7ce]`}>
                – Capacitación +
              </th>
              {dias.length > capCount && (
                <th colSpan={dias.length - capCount}
                    className={`${thBase} bg-[#c8ecd9] text-[#3d3d3d] text-center font-semibold border-b border-[#e0d7ce] rounded-tr-xl`}>
                  – OJT +
                </th>
              )}
              <th rowSpan={2} className={`${thBase} bg-[#a6d4f2] text-[#1e3a5c] text-center font-semibold border-b border-[#e0d7ce] min-w-0`}>
                Resultado Final
              </th>
            </tr>
            <tr>
              {/* Días de capacitación con fondo amarillo, OJT con verde */}
              {dias.map((f, i) => (
                <th
                  key={f}
                  className={
                    `${compact ? "px-2 py-1 min-w-[105px]" : "px-2 py-1 min-w-[105px]"} text-[#3d3d3d] border-b border-[#e0d7ce] text-center ` +
                    (i < capCount ? "bg-[#ffe5b4]" : "bg-[#c8ecd9]")
                  }
                >
                  Día {i + 1}<br />{f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {postulantesFiltrados.map((postulante, r) => {
              // Verificar si tiene deserción
              const idxDesercion = postulante.asistencia?.findIndex(est => est === "Deserción");
              const tieneDesercion = idxDesercion !== -1;
              
              return (
                <tr key={postulante.dni}
                  className={
                    (tieneDesercion
                      ? "bg-red-100"
                      : "bg-[#f9f6f2]/80")
                  }
                >
                  <td className={`${tdBase} text-left min-w-0 truncate`} title={`${postulante.nombres} ${postulante.apellidos}`}>
                    {postulante.nombres} {postulante.apellidos}
                  </td>
                  <td className={`${tdBase} text-center min-w-0`}>
                    {postulante.dni}
                  </td>
                  <td className={`${tdBase} text-center w-[180px] min-w-[180px]`}>
                    <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                      {/* Select de Turno */}
                      <select
                        value={postulante.turno || ''}
                        onChange={e => {
                          // Por ahora solo actualizar localmente
                          console.log('Turno cambiado:', e.target.value);
                        }}
                        className="bg-white/80 border border-gray-300 rounded-lg shadow-sm px-0.5 py-0 text-[11px] h-6 min-w-[22px] focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition outline-none text-center"
                      >
                        <option value="">T</option>
                        <option value="Mañana">Mañana</option>
                        <option value="Tarde">Tarde</option>
                      </select>
                      {/* Select de Horario */}
                      <select
                        value={postulante.horario || ''}
                        onChange={e => {
                          // Por ahora solo actualizar localmente
                          console.log('Horario cambiado:', e.target.value);
                        }}
                        className="bg-white/80 border border-gray-300 rounded-lg shadow-sm px-0.5 py-0 text-[11px] h-6 w-full focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition outline-none text-center"
                      >
                        <option value="">H</option>
                        <option value="Full Time Mañana">Full Time Mañana</option>
                        <option value="Full Time Tarde">Full Time Tarde</option>
                        <option value="Part Time Mañana">Part Time Mañana</option>
                        <option value="Part Time Tarde">Part Time Tarde</option>
                      </select>
                    </div>
                  </td>
                  {/* Días de asistencia */}
                  {dias.map((_, c) => {
                    const valor = (postulante.asistencia && postulante.asistencia.length > c) ? postulante.asistencia[c] : "";
                    
                    // Deshabilitar todos los días excepto el de la deserción
                    const disabled = tieneDesercion && c !== idxDesercion;
                    // Fondo gris más oscuro si tiene deserción
                    const darkBg = tieneDesercion ? "bg-gray-400 text-[#3d3d3d]" : "bg-[#f9f6f2]/80";
                    
                    return (
                      <td key={c} className={`${tdBase} min-w-0 ${darkBg}`} style={{ position: 'relative' }}>
                        <select
                          value={valor}
                          onChange={e => {
                            if (e.target.value === "Deserción") {
                              setPopover({ open: true, row: r, col: c });
                              setMotivo("");
                            } else if (onAsistenciaChange) {
                              onAsistenciaChange(r, c, e.target.value);
                            }
                          }}
                          className={selectBase}
                          disabled={disabled}
                        >
                          {estados.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    );
                  })}
                  {/* Resultado Final */}
                  <td className={`${tdBase} text-center min-w-0 ${tieneDesercion ? 'bg-gray-400 text-[#3d3d3d]' : ''}`}>
                    <select
                      className={`${selectBase} rounded text-sm ${tieneDesercion ? 'bg-gray-400 text-[#3d3d3d] cursor-not-allowed' : ''}`}
                      value={postulante.resultadoFinal || ''}
                      onChange={e => {
                        // Por ahora solo actualizar localmente
                        console.log('Resultado final cambiado:', e.target.value);
                      }}
                      disabled={tieneDesercion}
                    >
                      <option value=""></option>
                      <option value="Contratado">✅ Contratado</option>
                      <option value="Desaprobado">❌ Desaprobado</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Popover para motivo de deserción */}
      {popover.open && (
        <PopoverPortal
          anchorRef={popoverAnchorRefs.current[`${popover.row}_${popover.col}`]}
          open={popover.open}
        >
          <div className="z-20 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64 flex flex-col">
            <label className="mb-2 font-semibold text-sm text-gray-700">Motivo de la deserción:</label>
            <textarea
              className="border rounded p-1 mb-2 text-sm resize-none"
              rows={3}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1 rounded bg-green-500 text-white text-sm hover:bg-green-600"
                onClick={handleGuardarMotivo}
                disabled={!motivo.trim() || guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-300 text-gray-700 text-sm hover:bg-gray-400"
                onClick={() => setPopover({ open: false, row: null, col: null })}
              >
                Cancelar
              </button>
            </div>
          </div>
        </PopoverPortal>
      )}
    </div>
  );
}
