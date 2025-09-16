const { executeQuery, sql } = require('../config/database');

exports.getOrganigrama = async (req, res) => {
  try {
    const { area, estado = 'Activo' } = req.query;
    
    console.log('🌳 Generando organigrama dinámico para área:', area, 'estado:', estado);
    
    // 1. Obtener el jefe supremo (44991089) con su cargo
    const jefeSupremo = await executeQuery(
      `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.EstadoEmpleado, c.NombreCargo
       FROM PRI.Empleados e
       LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
       WHERE e.DNI = '44991089' AND e.EstadoEmpleado = @estado`,
      [{ name: 'estado', type: sql.VarChar, value: estado }]
    );

    if (jefeSupremo.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jefe supremo no encontrado'
      });
    }

    // 2. Obtener los 3 jefes de área específicos con sus cargos
    const jefesArea = await executeQuery(
      `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.EstadoEmpleado, c.NombreCargo
       FROM PRI.Empleados e
       LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
       WHERE e.DNI IN ('002702515', '76157106', '46142691') 
       AND e.EstadoEmpleado = @estado`,
      [{ name: 'estado', type: sql.VarChar, value: estado }]
    );

    console.log('👥 Jefes de área encontrados:', jefesArea.recordset.length);

    // 3. Construir el árbol jerárquico DINÁMICO (solo jefe supremo + jefes de área)
    const organigrama = await construirArbolDinamico(
      jefeSupremo.recordset[0], 
      jefesArea.recordset, 
      area, 
      estado
    );
    
    res.json({
      success: true,
      data: { organigrama }
    });

  } catch (error) {
    console.error('❌ Error generando organigrama:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Nuevo endpoint para expandir nodos dinámicamente
exports.expandirNodo = async (req, res) => {
  try {
    const { dni, area, estado = 'Activo' } = req.query;
    
    console.log('🔍 Expandiendo nodo para DNI:', dni, 'área:', area, 'estado:', estado);
    
    if (!dni) {
      return res.status(400).json({
        success: false,
        message: 'DNI es requerido'
      });
    }

    // Buscar el empleado y sus subordinados directos
    const empleado = await executeQuery(
      `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.EstadoEmpleado, c.NombreCargo
       FROM PRI.Empleados e
       LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
       WHERE e.DNI = @dni AND e.EstadoEmpleado = @estado`,
      [
        { name: 'dni', type: sql.VarChar, value: dni },
        { name: 'estado', type: sql.VarChar, value: estado }
      ]
    );

    if (empleado.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    const empleadoData = empleado.recordset[0];
    
    // Determinar el nivel jerárquico del empleado para buscar subordinados correctos
    const nivelEmpleado = obtenerNivelCargo(empleadoData.NombreCargo);
    console.log(`📊 Nivel del empleado ${empleadoData.Nombres}: ${nivelEmpleado}`);
    
    let subordinados;
    
    if (nivelEmpleado === 1) {
      // Jefe de Área: buscar coordinadores (JefeDNI) - SOLO coordinadores
      console.log('🔍 Buscando coordinadores para jefe de área');
      subordinados = await executeQuery(
        `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.EstadoEmpleado, c.NombreCargo
         FROM PRI.Empleados e
         LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
         WHERE e.JefeDNI = @dni 
         AND e.EstadoEmpleado = @estado
         AND c.NombreCargo LIKE '%coordinador%'`,
        [
          { name: 'dni', type: sql.VarChar, value: dni },
          { name: 'estado', type: sql.VarChar, value: estado }
        ]
      );
    } else if (nivelEmpleado === 2) {
      // Coordinador: buscar supervisores (CoordinadorDNI) - SOLO supervisores
      console.log('🔍 Buscando supervisores para coordinador');
      subordinados = await executeQuery(
        `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.EstadoEmpleado, c.NombreCargo
         FROM PRI.Empleados e
         LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
         WHERE e.CoordinadorDNI = @dni 
         AND e.EstadoEmpleado = @estado
         AND c.NombreCargo LIKE '%supervisor%'`,
        [
          { name: 'dni', type: sql.VarChar, value: dni },
          { name: 'estado', type: sql.VarChar, value: estado }
        ]
      );
    } else if (nivelEmpleado === 3) {
      // Supervisor: buscar agentes (SupervisorDNI) - SOLO agentes
      console.log('🔍 Buscando agentes para supervisor');
      subordinados = await executeQuery(
        `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.EstadoEmpleado, c.NombreCargo
         FROM PRI.Empleados e
         LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
         WHERE e.SupervisorDNI = @dni 
         AND e.EstadoEmpleado = @estado
         AND (c.NombreCargo LIKE '%agente%' OR c.NombreCargo LIKE '%operador%' OR c.NombreCargo LIKE '%asesor%')`,
        [
          { name: 'dni', type: sql.VarChar, value: dni },
          { name: 'estado', type: sql.VarChar, value: estado }
        ]
      );
    } else {
      // Otros niveles: no buscar subordinados
      console.log('⚠️ Nivel no válido para buscar subordinados');
      subordinados = { recordset: [] };
    }

    console.log(`👥 Subordinados encontrados para ${empleadoData.Nombres}:`, subordinados.recordset.length);

    // Construir nodos de subordinados
    const nodosSubordinados = subordinados.recordset.map(sub => ({
      id: sub.DNI,
      name: `${sub.Nombres} ${sub.ApellidoPaterno} ${sub.ApellidoMaterno}`.trim(),
      dni: sub.DNI,
      cargo: sub.NombreCargo || 'Empleado',
      area: obtenerAreaInfo(dni).area,
      nivel: obtenerNivelCargo(sub.NombreCargo),
      children: [], // Vacío para expansión posterior
      expandible: true // Indica que se puede expandir
    }));

    console.log('📦 Nodos de subordinados construidos:', nodosSubordinados.length);

    res.json({
      success: true,
      data: { 
        empleado: empleadoData,
        subordinados: nodosSubordinados 
      }
    });

  } catch (error) {
    console.error('❌ Error expandiendo nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Función DINÁMICA para call center - Solo jefe supremo + jefes de área
async function construirArbolDinamico(jefeSupremo, jefesArea, area, estado) {
  const { DNI, Nombres, ApellidoPaterno, ApellidoMaterno, CargoID, NombreCargo } = jefeSupremo;
  
  // Construir nodo del jefe supremo
  const nodo = {
    id: DNI,
    name: `${Nombres} ${ApellidoPaterno} ${ApellidoMaterno}`.trim(),
    dni: DNI,
    cargo: NombreCargo || 'Jefe de Operaciones',
    area: 'OPERACIONES',
    nivel: 0,
    children: [],
    expandible: true // Indica que se puede expandir
  };

  // Procesar cada jefe de área SIN subordinados (se expandirán dinámicamente)
  for (const jefe of jefesArea) {
    const areaInfo = obtenerAreaInfo(jefe.DNI);
    
    // Filtrar por área si se especifica
    if (area && area !== 'todas' && areaInfo.area !== area) {
      continue;
    }
    
    // Crear nodo del jefe de área
    const jefeNodo = {
      id: jefe.DNI,
      name: `${jefe.Nombres} ${jefe.ApellidoPaterno} ${jefe.ApellidoMaterno}`.trim(),
      dni: jefe.DNI,
      cargo: jefe.NombreCargo || `Jefe de ${areaInfo.nombre}`,
      area: areaInfo.area,
      nivel: 1,
      children: [], // Vacío para expansión posterior
      expandible: true // Indica que se puede expandir
    };
    
    nodo.children.push(jefeNodo);
  }

  console.log('✅ Organigrama dinámico generado exitosamente');
  return nodo;
}

// Función para obtener información del área
function obtenerAreaInfo(dni) {
  const areas = {
    '002702515': { area: 'OUTBOUND', nombre: 'OUTBOUND' },
    '76157106': { area: 'CALIDAD', nombre: 'Calidad, Formación, Monitoreo' },
    '46142691': { area: 'ATC', nombre: 'ATC' }
  };
  return areas[dni] || { area: 'OTRO', nombre: 'Otra Área' };
}

// Función para determinar el nivel jerárquico basado en el cargo
function obtenerNivelCargo(cargo) {
  if (!cargo) return 4;
  
  const cargoLower = cargo.toLowerCase();
  
  // Jefe Supremo (nivel 0)
  if (cargoLower.includes('jefe') && cargoLower.includes('operaciones')) return 0;
  
  // Jefe de Área (nivel 1) - busca coordinadores
  if (cargoLower.includes('jefe') && !cargoLower.includes('operaciones')) return 1;
  
  // Coordinador (nivel 2) - busca supervisores
  if (cargoLower.includes('coordinador')) return 2;
  
  // Supervisor (nivel 3) - busca agentes
  if (cargoLower.includes('supervisor')) return 3;
  
  // Agente o nivel más bajo (nivel 4) - no busca subordinados
  return 4;
}
