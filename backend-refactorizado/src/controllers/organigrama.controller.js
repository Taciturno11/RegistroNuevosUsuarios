const { executeQuery, sql } = require('../config/database');

exports.getOrganigrama = async (req, res) => {
  try {
    const { area, estado = 'Activo' } = req.query;
    
    console.log('🌳 Generando organigrama dinámico para área:', area, 'estado:', estado);
    
    // 1. Obtener el jefe supremo (44991089) con su cargo y campaña
    const jefeSupremo = await executeQuery(
      `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, 
              e.FechaContratacion, e.EstadoEmpleado, c.NombreCargo, camp.NombreCampaña
       FROM PRI.Empleados e
       LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
       LEFT JOIN PRI.Campanias camp ON camp.CampañaID = e.CampañaID
       WHERE e.DNI = '44991089' AND e.EstadoEmpleado = @estado`,
      [{ name: 'estado', type: sql.VarChar, value: estado }]
    );

    if (jefeSupremo.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jefe supremo no encontrado'
      });
    }

    // 2. Obtener los 3 jefes de área específicos con sus cargos y campañas
    const jefesArea = await executeQuery(
      `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, 
              e.FechaContratacion, e.EstadoEmpleado, c.NombreCargo, camp.NombreCampaña
       FROM PRI.Empleados e
       LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
       LEFT JOIN PRI.Campanias camp ON camp.CampañaID = e.CampañaID
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
    
    // Debug: mostrar datos del jefe supremo
    console.log('🐛 DEBUG - Datos del jefe supremo:', {
      dni: jefeSupremo.recordset[0].DNI,
      cargoId: jefeSupremo.recordset[0].CargoID,
      cargoNombre: jefeSupremo.recordset[0].NombreCargo,
      campaniaId: jefeSupremo.recordset[0].CampañaID,
      campaniaNombre: jefeSupremo.recordset[0].NombreCampaña,
      fechaContratacion: jefeSupremo.recordset[0].FechaContratacion
    });
    
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

    // CASOS ESPECIALES: Secciones de Calidad (manejar ANTES de buscar en la base de datos)
    if (dni === 'SEC_CAPACITACION') {
      console.log('🎯 EXPANDIENDO SECCIÓN: Capacitación - Buscando todos los Capacitadores');
      const subordinados = await executeQuery(
        `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, 
                e.FechaContratacion, e.EstadoEmpleado, c.NombreCargo, camp.NombreCampaña
         FROM PRI.Empleados e
         LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
         LEFT JOIN PRI.Campanias camp ON camp.CampañaID = e.CampañaID
         WHERE e.CargoID = 7
         AND e.EstadoEmpleado = @estado`,
        [
          { name: 'estado', type: sql.VarChar, value: estado }
        ]
      );
      console.log(`📚 Capacitadores encontrados:`, subordinados.recordset.length);

      // Construir nodos de subordinados
      const nodosSubordinados = subordinados.recordset.map(sub => ({
        id: sub.DNI,
        name: `${sub.Nombres} ${sub.ApellidoPaterno} ${sub.ApellidoMaterno}`.trim(),
        dni: sub.DNI,
        cargo: sub.NombreCargo,
        cargoId: sub.CargoID,
        cargoNombre: sub.NombreCargo,
        campaniaId: sub.CampañaID,
        campaniaNombre: sub.NombreCampaña,
        fechaContratacion: sub.FechaContratacion,
        area: 'CAPACITACION',
        nivel: 4,
        children: [],
        expandible: false
      }));

      return res.json({
        success: true,
        data: { 
          empleado: { DNI: 'SEC_CAPACITACION', Nombres: '📚 CAPACITACIÓN' },
          subordinados: nodosSubordinados 
        }
      });
    }
    
    if (dni === 'SEC_MONITOREO') {
      console.log('🎯 EXPANDIENDO SECCIÓN: Monitoreo - Buscando todos los Monitores');
      const subordinados = await executeQuery(
        `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, 
                e.FechaContratacion, e.EstadoEmpleado, c.NombreCargo, camp.NombreCampaña
         FROM PRI.Empleados e
         LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
         LEFT JOIN PRI.Campanias camp ON camp.CampañaID = e.CampañaID
         WHERE e.CargoID = 6
         AND e.EstadoEmpleado = @estado`,
        [
          { name: 'estado', type: sql.VarChar, value: estado }
        ]
      );
      console.log(`🖥️ Monitores encontrados:`, subordinados.recordset.length);

      // Construir nodos de subordinados
      const nodosSubordinados = subordinados.recordset.map(sub => ({
        id: sub.DNI,
        name: `${sub.Nombres} ${sub.ApellidoPaterno} ${sub.ApellidoMaterno}`.trim(),
        dni: sub.DNI,
        cargo: sub.NombreCargo,
        cargoId: sub.CargoID,
        cargoNombre: sub.NombreCargo,
        campaniaId: sub.CampañaID,
        campaniaNombre: sub.NombreCampaña,
        fechaContratacion: sub.FechaContratacion,
        area: 'MONITOREO',
        nivel: 4,
        children: [],
        expandible: false
      }));

      return res.json({
        success: true,
        data: { 
          empleado: { DNI: 'SEC_MONITOREO', Nombres: '🖥️ MONITOREO' },
          subordinados: nodosSubordinados 
        }
      });
    }

    // Buscar el empleado y sus subordinados directos (solo para DNIs reales)
    const empleado = await executeQuery(
      `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, 
              e.FechaContratacion, e.EstadoEmpleado, c.NombreCargo, camp.NombreCampaña
       FROM PRI.Empleados e
       LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
       LEFT JOIN PRI.Campanias camp ON camp.CampañaID = e.CampañaID
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
    const nivelEmpleado = obtenerNivelCargo(empleadoData.NombreCargo, empleadoData.CargoID);
    console.log(`📊 Nivel del empleado ${empleadoData.Nombres}: ${nivelEmpleado}`);
    
    let subordinados;
    
    if (nivelEmpleado === 1) {
      // CASO ESPECIAL: Jefa de Calidad y Monitoreo "76157106" - DIVIDIR EN 2 SECCIONES
      if (dni === '76157106') {
        console.log('🎯 CASO ESPECIAL: Jefa de Calidad y Monitoreo - Creando secciones CAPACITACIÓN y MONITOREO');
        
        // Crear nodos de secciones
        subordinados = { recordset: [
          {
            DNI: 'SEC_CAPACITACION',
            Nombres: '📚 CAPACITACIÓN',
            ApellidoPaterno: '',
            ApellidoMaterno: '',
            CargoID: 997,
            CampañaID: null,
            FechaContratacion: null,
            EstadoEmpleado: 'Activo',
            NombreCargo: 'Sección Capacitación',
            NombreCampaña: null
          },
          {
            DNI: 'SEC_MONITOREO',
            Nombres: '🖥️ MONITOREO',
            ApellidoPaterno: '',
            ApellidoMaterno: '',
            CargoID: 996,
            CampañaID: null,
            FechaContratacion: null,
            EstadoEmpleado: 'Activo',
            NombreCargo: 'Sección Monitoreo',
            NombreCampaña: null
          }
        ]};
        
        console.log(`📊 Secciones creadas para jefa de Calidad ${dni}: CAPACITACIÓN y MONITOREO`);
      } else {
        // Jefe de Área normal: buscar coordinadores (JefeDNI) - SOLO coordinadores
        console.log('🔍 Buscando coordinadores para jefe de área');
        subordinados = await executeQuery(
          `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, 
                  e.FechaContratacion, e.EstadoEmpleado, c.NombreCargo, camp.NombreCampaña
           FROM PRI.Empleados e
           LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
           LEFT JOIN PRI.Campanias camp ON camp.CampañaID = e.CampañaID
           WHERE e.JefeDNI = @dni 
           AND e.EstadoEmpleado = @estado
           AND c.NombreCargo LIKE '%coordinador%'`,
          [
            { name: 'dni', type: sql.VarChar, value: dni },
            { name: 'estado', type: sql.VarChar, value: estado }
          ]
        );

        // CASO ESPECIAL: Si no hay coordinadores (como el jefe "002702515"), buscar supervisores directamente
        if (subordinados.recordset.length === 0) {
          console.log('⚠️ No se encontraron coordinadores, buscando supervisores directamente para jefe:', dni);
          subordinados = await executeQuery(
            `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, 
                    e.FechaContratacion, e.EstadoEmpleado, c.NombreCargo, camp.NombreCampaña
             FROM PRI.Empleados e
             LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
             LEFT JOIN PRI.Campanias camp ON camp.CampañaID = e.CampañaID
             WHERE e.JefeDNI = @dni 
             AND e.EstadoEmpleado = @estado
             AND c.NombreCargo LIKE '%supervisor%'`,
            [
              { name: 'dni', type: sql.VarChar, value: dni },
              { name: 'estado', type: sql.VarChar, value: estado }
            ]
          );
          console.log(`📊 Supervisores encontrados directamente para jefe ${dni}:`, subordinados.recordset.length);
        }
      }
    } else if (nivelEmpleado === 2) {
      // Coordinador: buscar supervisores (CoordinadorDNI) - SOLO supervisores
      console.log('🔍 Buscando supervisores para coordinador');
      subordinados = await executeQuery(
        `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, 
                e.FechaContratacion, e.EstadoEmpleado, c.NombreCargo, camp.NombreCampaña
         FROM PRI.Empleados e
         LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
         LEFT JOIN PRI.Campanias camp ON camp.CampañaID = e.CampañaID
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
        `SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, 
                e.FechaContratacion, e.EstadoEmpleado, c.NombreCargo, camp.NombreCampaña
         FROM PRI.Empleados e
         LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
         LEFT JOIN PRI.Campanias camp ON camp.CampañaID = e.CampañaID
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
    const nodosSubordinados = subordinados.recordset.map(sub => {
      const nivel = obtenerNivelCargo(sub.NombreCargo, sub.CargoID);
      const esSeccion = sub.DNI === 'SEC_CAPACITACION' || sub.DNI === 'SEC_MONITOREO';
      
      return {
        id: sub.DNI,
        name: `${sub.Nombres} ${sub.ApellidoPaterno} ${sub.ApellidoMaterno}`.trim(),
        dni: sub.DNI,
        cargo: sub.NombreCargo || 'Empleado',
        cargoId: sub.CargoID,
        cargoNombre: sub.NombreCargo,
        campaniaId: sub.CampañaID,
        campaniaNombre: sub.NombreCampaña,
        fechaContratacion: sub.FechaContratacion,
        area: obtenerAreaInfo(sub.DNI).area,
        nivel: nivel,
        children: [], // Vacío para expansión posterior
        expandible: esSeccion || nivel < 4 // Secciones y niveles no terminales son expandibles
      };
    });

    console.log('📦 Nodos de subordinados construidos:', nodosSubordinados.length);
    
    // Debug: mostrar algunos datos de subordinados
    if (nodosSubordinados.length > 0) {
      console.log('🐛 DEBUG - Ejemplo subordinado:', {
        dni: nodosSubordinados[0].dni,
        cargoId: nodosSubordinados[0].cargoId,
        cargoNombre: nodosSubordinados[0].cargoNombre,
        campaniaId: nodosSubordinados[0].campaniaId,
        campaniaNombre: nodosSubordinados[0].campaniaNombre,
        fechaContratacion: nodosSubordinados[0].fechaContratacion
      });
    }

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
  const { DNI, Nombres, ApellidoPaterno, ApellidoMaterno, CargoID, CampañaID, FechaContratacion, NombreCargo, NombreCampaña } = jefeSupremo;
  
  // Construir nodo del jefe supremo
  const nodo = {
    id: DNI,
    name: `${Nombres} ${ApellidoPaterno} ${ApellidoMaterno}`.trim(),
    dni: DNI,
    cargo: NombreCargo || 'Jefe de Operaciones',
    cargoId: CargoID,
    cargoNombre: NombreCargo,
    campaniaId: CampañaID,
    campaniaNombre: NombreCampaña,
    fechaContratacion: FechaContratacion,
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
      cargoId: jefe.CargoID,
      cargoNombre: jefe.NombreCargo,
      campaniaId: jefe.CampañaID,
      campaniaNombre: jefe.NombreCampaña,
      fechaContratacion: jefe.FechaContratacion,
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
    '46142691': { area: 'ATC', nombre: 'ATC' },
    // Secciones de Calidad
    'SEC_CAPACITACION': { area: 'CAPACITACION', nombre: 'Capacitación' },
    'SEC_MONITOREO': { area: 'MONITOREO', nombre: 'Monitoreo' }
  };
  return areas[dni] || { area: 'OTRO', nombre: 'Otra Área' };
}

// Función para determinar el nivel jerárquico basado en el cargo
function obtenerNivelCargo(cargo, cargoId = null) {
  if (!cargo) return 4;
  
  const cargoLower = cargo.toLowerCase();
  
  // Secciones de Calidad (nivel 2) - se expanden para mostrar empleados
  if (cargoId === 997 || cargoId === 996) return 2;
  
  // Jefe Supremo (nivel 0)
  if (cargoLower.includes('jefe') && cargoLower.includes('operaciones')) return 0;
  
  // Jefe de Área (nivel 1) - busca coordinadores
  if (cargoLower.includes('jefe') && !cargoLower.includes('operaciones')) return 1;
  
  // Categorías virtuales de Calidad (nivel 2) - se expanden para mostrar empleados
  if (cargoLower.includes('categoría capacitación') || cargoLower.includes('categoría monitoreo')) return 2;
  
  // Coordinador (nivel 2) - busca supervisores
  if (cargoLower.includes('coordinador')) return 2;
  
  // Supervisor (nivel 3) - busca agentes
  if (cargoLower.includes('supervisor')) return 3;
  
  // Capacitador y Monitor (nivel 4) - roles especiales sin subordinados
  if (cargoLower.includes('capacitador') || cargoLower.includes('monitor')) return 4;
  
  // Agente o nivel más bajo (nivel 4) - no busca subordinados
  return 4;
}
