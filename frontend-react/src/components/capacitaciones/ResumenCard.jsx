export default function ResumenCard({ tablaDatos, dias, capCount, campania, capa }) {
  if (!tablaDatos || !tablaDatos.length) return null;

  // Calcular estadísticas
  const total = tablaDatos.length;
  const bajas = tablaDatos.filter(p => p.asistencia?.some(a => a === "Deserción")).length;
  const activos = total - bajas;
  
  // Calcular porcentaje de asistencia promedio
  const totalAsistencias = tablaDatos.reduce((sum, p) => {
    const asistenciasValidas = p.asistencia?.filter(a => a === "A" || a === "J" || a === "T").length || 0;
    return sum + asistenciasValidas;
  }, 0);
  
  const totalDias = dias.length;
  const porcentajeAsistencia = total > 0 ? Math.round((totalAsistencias / (total * totalDias)) * 100) : 0;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-[#297373] mb-4">📊 Resumen de Capacitación</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{total}</div>
          <div className="text-sm text-blue-700">Total Postulantes</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{activos}</div>
          <div className="text-sm text-green-700">Activos</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{bajas}</div>
          <div className="text-sm text-red-700">Bajas</div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{porcentajeAsistencia}%</div>
          <div className="text-sm text-yellow-700">Asistencia Promedio</div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Campaña</div>
          <div className="font-semibold text-gray-800">{campania}</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Capa</div>
          <div className="font-semibold text-gray-800">{capa}</div>
        </div>
      </div>
      
      <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600 mb-2">Distribución de Fases</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span className="text-sm text-gray-700">Capacitación: {capCount} días</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span className="text-sm text-gray-700">OJT: {dias.length - capCount} días</span>
          </div>
        </div>
      </div>
    </div>
  );
}
