// Carga las variables de entorno
const os = require('os');
require('dotenv').config(); 
const cors = require('cors');
const express = require('express');
const sql = require('mssql');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permitir todos los orígenes (para desarrollo)
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const PORT = process.env.PORT; 

// Estado de los monitores en memoria
const monitores = new Map();
// Map estructura: dni -> { dni, nombre, rol, estado, conectadoDesde, tiempoEnLlamada, tiempoInactivo, socketId, llamadaActual }

// Función para obtener las IPs locales
function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
      // Itera sobre todas las interfaces de red (Ethernet, Wi-Fi, etc.)
      for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            // Solo queremos IPv4, no direcciones internas (loopback)
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
}

// Configuración de la base de datos SQL Server
const dbConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  port: parseInt(process.env.SQL_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// Middleware: Permite que Express lea peticiones con formato JSON
app.use(express.json());

// =====================================================
// SQL: Asegurar tabla de historial de estados (persistencia)
// =====================================================
async function ensureEstadosTable() {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.objects 
        WHERE object_id = OBJECT_ID('[Partner].[mo].[Monitores_Estados_Hist]') AND type in ('U')
      )
      BEGIN
        CREATE TABLE [Partner].[mo].[Monitores_Estados_Hist] (
          ID INT IDENTITY(1,1) PRIMARY KEY,
          DNIMonitor VARCHAR(20) NOT NULL,
          NombreMonitor NVARCHAR(200) NOT NULL,
          Estado VARCHAR(32) NOT NULL, -- 'conectado' | 'en_llamada' | 'desconectado'
          InicioEstado DATETIME NOT NULL DEFAULT(GETDATE()),
          FinEstado DATETIME NULL,
          DuracionSegundos INT NULL,
          LlamadaIdLargo VARCHAR(100) NULL,
          CreadoEn DATETIME NOT NULL DEFAULT(GETDATE())
        );
        CREATE INDEX IX_MonEst_DNI ON [Partner].[mo].[Monitores_Estados_Hist](DNIMonitor);
        CREATE INDEX IX_MonEst_Inicio ON [Partner].[mo].[Monitores_Estados_Hist](InicioEstado);
      END
    `);
  } catch (err) {
    console.error('Error asegurando tabla de estados:', err);
  }
}

async function registrarCambioEstado({ dni, nombre, estado, llamadaId, rol }) {
  try {
    // NO registrar estados de la jefa, solo de monitores
    if (rol === 'jefa') {
      console.log(`ℹ️ Ignorando registro de estado para la jefa`);
      return;
    }

    const pool = await sql.connect(dbConfig);
    
    // Verificar el último estado registrado para este monitor
    const ultimoEstado = await pool.request()
      .input('dni', sql.VarChar, dni)
      .query(`
        SELECT TOP 1 Estado, InicioEstado
        FROM [Partner].[mo].[Monitores_Estados_Hist]
        WHERE DNIMonitor = @dni AND FinEstado IS NULL
        ORDER BY InicioEstado DESC;
      `);

    // Si el estado es el mismo y fue registrado hace menos de 5 segundos, no hacer nada
    if (ultimoEstado.recordset.length > 0) {
      const estadoActual = ultimoEstado.recordset[0];
      const segundosDesdeUltimoRegistro = Math.floor(
        (new Date() - new Date(estadoActual.InicioEstado)) / 1000
      );
      
      // Si es el mismo estado y fue hace menos de 5 segundos, ignorar (evitar duplicados)
      if (estadoActual.Estado === estado && segundosDesdeUltimoRegistro < 5) {
        console.log(`⚠️ Registro duplicado evitado para ${nombre} (${estado})`);
        return;
      }
    }

    // Cerrar estado previo abierto
    await pool.request()
      .input('dni', sql.VarChar, dni)
      .query(`
        UPDATE [Partner].[mo].[Monitores_Estados_Hist]
        SET FinEstado = GETDATE(),
            DuracionSegundos = DATEDIFF(SECOND, InicioEstado, GETDATE())
        WHERE DNIMonitor = @dni AND FinEstado IS NULL;
      `);

    // Abrir nuevo estado
    await pool.request()
      .input('dni', sql.VarChar, dni)
      .input('nombre', sql.NVarChar, nombre)
      .input('estado', sql.VarChar, estado)
      .input('llamadaId', sql.VarChar, llamadaId || null)
      .query(`
        INSERT INTO [Partner].[mo].[Monitores_Estados_Hist]
          (DNIMonitor, NombreMonitor, Estado, InicioEstado, LlamadaIdLargo)
        VALUES (@dni, @nombre, @estado, GETDATE(), @llamadaId);
      `);
      
    console.log(`✅ Estado registrado: ${nombre} → ${estado}`);
  } catch (err) {
    console.error('Error registrando cambio de estado:', err);
  }
}

// Ruta de prueba (Endpoint)
app.get('/api/saludo', (req, res) => {
  res.json({ message: '¡Hola desde el Backend de Node.js!' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a mi API' });
});

// Endpoint para limpiar estado de monitores en memoria (solo desarrollo)
app.post('/api/dev/limpiar-memoria', (req, res) => {
  const cantidad = monitores.size;
  monitores.clear();
  console.log(`🧹 Memoria limpiada: ${cantidad} monitores removidos`);
  
  // Emitir actualización a la jefa
  emitirEstadoMonitoresAJefa();
  
  res.json({ 
    success: true, 
    message: `Memoria limpiada correctamente (${cantidad} monitores removidos)` 
  });
});

// Endpoint para obtener una llamada aleatoria con filtros
app.post('/api/llamada-aleatoria', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const { fechaInicio, fechaFin, campana, agente, idLargo, cola, dniUsuario } = req.body;
    
    // Si el usuario es monitor con campañas asignadas, usar siempre sus campañas
    let campanaFiltro = campana;
    if (dniUsuario && campañasAsignadas[dniUsuario]) {
      // Si no se especifica campaña (opción por defecto), usar todas las campañas asignadas
      if (!campana) {
        campanaFiltro = campañasAsignadas[dniUsuario];
      } else {
        // Si se especifica una campaña específica, verificar que esté en sus campañas asignadas
        if (campañasAsignadas[dniUsuario].includes(campana)) {
          campanaFiltro = campana; // Mantener como string, no como array
        } else {
          // Si la campaña no está asignada, usar todas las campañas asignadas
          campanaFiltro = campañasAsignadas[dniUsuario];
        }
      }
    }
    
    // Construir query con filtros opcionales
    let query = `
      SELECT TOP 1 *
      FROM [Partner].[dbo].[Reporte_Llamadas_Detalle]
      WHERE 1=1
        AND ID_Largo IS NOT NULL
        AND ID_Largo != ''
        AND Duracion >= 60
    `;
    
    const params = [];
    
    if (fechaInicio) {
      query += ` AND Fecha >= @fechaInicio`;
      params.push({ name: 'fechaInicio', type: sql.Date, value: fechaInicio });
    }
    
    if (fechaFin) {
      query += ` AND Fecha <= @fechaFin`;
      params.push({ name: 'fechaFin', type: sql.Date, value: fechaFin });
    }
    
    if (campanaFiltro) {
      if (Array.isArray(campanaFiltro)) {
        // Si es un array de campañas, usar IN
        const placeholders = campanaFiltro.map((_, index) => `@campana${index}`).join(', ');
        query += ` AND Campaña_Agente IN (${placeholders})`;
        campanaFiltro.forEach((camp, index) => {
          params.push({ name: `campana${index}`, type: sql.NVarChar, value: camp });
        });
      } else {
        // Si es una sola campaña, usar igualdad
        query += ` AND Campaña_Agente = @campana`;
        params.push({ name: 'campana', type: sql.NVarChar, value: campanaFiltro });
      }
    }
    
    if (agente) {
      query += ` AND NombreCompletoAgente LIKE @agente`;
      params.push({ name: 'agente', type: sql.NVarChar, value: `%${agente}%` });
    }
    
    if (idLargo) {
      query += ` AND ID_Largo = @idLargo`;
      params.push({ name: 'idLargo', type: sql.NVarChar, value: idLargo });
    }
    
    if (cola) {
      query += ` AND Cola = @cola`;
      params.push({ name: 'cola', type: sql.NVarChar, value: cola });
    }
    
    // Solo usar orden aleatorio si NO se está filtrando por ID_Largo específico
    if (!idLargo) {
      query += ` ORDER BY NEWID()`; // Orden aleatorio
    }
    
    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return res.status(200).json({ error: 'No se encontraron llamadas con esos filtros' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al obtener llamada:', error);
    res.status(500).json({ error: 'Error al obtener llamada', detalle: error.message });
  }
});

// Endpoint para obtener opciones de filtros (campañas, colas disponibles)
app.get('/api/opciones-filtros', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const campanas = await pool.request().query(`
      SELECT DISTINCT Campaña_Agente 
      FROM [Partner].[dbo].[Reporte_Llamadas_Detalle] 
      WHERE Campaña_Agente IS NOT NULL 
      ORDER BY Campaña_Agente
    `);
    
    const colas = await pool.request().query(`
      SELECT DISTINCT Cola 
      FROM [Partner].[dbo].[Reporte_Llamadas_Detalle] 
      WHERE Cola IS NOT NULL 
      ORDER BY Cola
    `);
    
    res.json({
      campanas: campanas.recordset.map(r => r['Campaña_Agente']),
      colas: colas.recordset.map(r => r.Cola)
    });
  } catch (error) {
    console.error('Error al obtener opciones:', error);
    res.status(500).json({ error: 'Error al obtener opciones de filtros', detalle: error.message });
  }
});

// Endpoint para guardar monitoreo en BD
app.post('/api/guardar-monitoreo', async (req, res) => {
  try {
    const {
      dniMonitor,
      nombreMonitor,
      llamada,
      fechaHoraInicio,
      fechaHoraFin,
      tiempoSegundos
    } = req.body;

    // Validaciones
    if (
      !dniMonitor ||
      !nombreMonitor ||
      !llamada ||
      !fechaHoraInicio ||
      !fechaHoraFin ||
      tiempoSegundos === undefined || tiempoSegundos === null
    ) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request()
      .input('dniMonitor', sql.VarChar, dniMonitor)
      .input('nombreMonitor', sql.VarChar, nombreMonitor)
      .input('idLlamadaLargo', sql.VarChar, llamada.ID_Largo)
      .input('numeroLlamada', sql.VarChar, llamada.Numero)
      .input('fechaLlamada', sql.Date, llamada.Fecha)
      .input('horaLlamada', sql.Time, llamada.Hora)
      .input('duracionLlamada', sql.Int, llamada.Duracion)
      .input('agenteAuditado', sql.VarChar, llamada.NombreCompletoAgente)
      .input('dniEmpleadoAuditado', sql.VarChar, llamada.DNIEmpleado)
      .input('campanaAuditada', sql.VarChar, llamada.Campaña_Agente)
      .input('colaAuditada', sql.VarChar, llamada.Cola)
      .input('fechaHoraInicio', sql.DateTime, fechaHoraInicio)
      .input('fechaHoraFin', sql.DateTime, fechaHoraFin)
      .input('tiempoSegundos', sql.Int, tiempoSegundos)
      .query(`
        INSERT INTO [Partner].[mo].[Historial_Monitoreos]
          (DNIMonitor, NombreMonitor, ID_Llamada_Largo, NumeroLlamada, FechaLlamada, 
           HoraLlamada, DuracionLlamada, AgenteAuditado, DNIEmpleadoAuditado, 
           CampañaAuditada, ColaAuditada, FechaHoraInicio, FechaHoraFin, TiempoMonitoreoSegundos)
        VALUES
          (@dniMonitor, @nombreMonitor, @idLlamadaLargo, @numeroLlamada, @fechaLlamada,
           @horaLlamada, @duracionLlamada, @agenteAuditado, LEFT(@dniEmpleadoAuditado, 8),
           @campanaAuditada, @colaAuditada, GETDATE() - CAST(@tiempoSegundos AS FLOAT) / 86400.0, GETDATE(), @tiempoSegundos);
        
        SELECT SCOPE_IDENTITY() AS ID;
      `);

    res.json({
      success: true,
      id: result.recordset[0].ID,
      message: 'Monitoreo guardado correctamente'
    });
  } catch (error) {
    console.error('Error al guardar monitoreo:', error);
    res.status(500).json({ error: 'Error al guardar monitoreo', detalle: error.message });
  }
});

// Endpoint para obtener historial personal de un monitor
app.get('/api/mi-historial', async (req, res) => {
  try {
    const { dni } = req.query;

    if (!dni) {
      return res.status(400).json({ error: 'DNI es requerido' });
    }

    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request()
      .input('dni', sql.VarChar, dni)
      .query(`
        SELECT 
          ID,
          ID_Llamada_Largo,
          NumeroLlamada,
          FechaLlamada,
          HoraLlamada,
          DuracionLlamada,
          AgenteAuditado,
          DNIEmpleadoAuditado,
          CampañaAuditada,
          ColaAuditada,
          FechaHoraInicio,
          FechaHoraFin,
          TiempoMonitoreoSegundos,
          CreadoEn
        FROM [Partner].[mo].[Historial_Monitoreos]
        WHERE DNIMonitor = @dni
        ORDER BY FechaHoraInicio DESC
      `);

    // Calcular estadísticas
    const total = result.recordset.length;
    const tiempoTotal = result.recordset.reduce((sum, r) => sum + r.TiempoMonitoreoSegundos, 0);
    const tiempoPromedio = total > 0 ? Math.floor(tiempoTotal / total) : 0;

    // Filtrar por hoy
    const hoy = new Date().toISOString().split('T')[0];
    const monitoreosHoy = result.recordset.filter(r => {
      const fecha = new Date(r.FechaHoraInicio).toISOString().split('T')[0];
      return fecha === hoy;
    });

    res.json({
      monitoreos: result.recordset,
      estadisticas: {
        total: total,
        hoy: monitoreosHoy.length,
        tiempoTotalSegundos: tiempoTotal,
        tiempoPromedioSegundos: tiempoPromedio
      }
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial', detalle: error.message });
  }
});

// Endpoint para obtener historial general (solo jefa)
app.get('/api/historial-general', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request().query(`
      SELECT 
        ID,
        DNIMonitor,
        NombreMonitor,
        ID_Llamada_Largo,
        NumeroLlamada,
        FechaLlamada,
        HoraLlamada,
        DuracionLlamada,
        AgenteAuditado,
        DNIEmpleadoAuditado,
        CampañaAuditada,
        ColaAuditada,
        FechaHoraInicio,
        FechaHoraFin,
        TiempoMonitoreoSegundos,
        CreadoEn
      FROM [Partner].[mo].[Historial_Monitoreos]
      ORDER BY FechaHoraInicio DESC
    `);

    // Estadísticas generales
    const total = result.recordset.length;
    const tiempoTotal = result.recordset.reduce((sum, r) => sum + r.TiempoMonitoreoSegundos, 0);

    // Estadísticas por monitor
    const statsPorMonitor = {};
    result.recordset.forEach(r => {
      if (!statsPorMonitor[r.DNIMonitor]) {
        statsPorMonitor[r.DNIMonitor] = {
          dni: r.DNIMonitor,
          nombre: r.NombreMonitor,
          total: 0,
          tiempoTotal: 0
        };
      }
      statsPorMonitor[r.DNIMonitor].total++;
      statsPorMonitor[r.DNIMonitor].tiempoTotal += r.TiempoMonitoreoSegundos;
    });

    const ranking = Object.values(statsPorMonitor)
      .sort((a, b) => b.total - a.total)
      .map((m, index) => ({
        posicion: index + 1,
        ...m,
        tiempoPromedio: m.total > 0 ? Math.floor(m.tiempoTotal / m.total) : 0
      }));

    res.json({
      monitoreos: result.recordset,
      estadisticas: {
        total: total,
        tiempoTotalSegundos: tiempoTotal,
        ranking: ranking
      }
    });
  } catch (error) {
    console.error('Error al obtener historial general:', error);
    res.status(500).json({ error: 'Error al obtener historial general', detalle: error.message });
  }
});

// =====================================================
// REPORTES - Rendimiento por monitor (día y rango)
// =====================================================

// Helper: parsear fecha YYYY-MM-DD a inicio y fin (fin excluyente)
function getDiaRango(fechaStr) {
  const inicio = new Date(`${fechaStr}T00:00:00`);
  const fin = new Date(inicio.getTime() + 24 * 3600 * 1000); // +1 día
  return { inicio, fin };
}

// GET /api/reporte/monitor-dia?dni=...&fecha=YYYY-MM-DD
app.get('/api/reporte/monitor-dia', async (req, res) => {
  try {
    const { dni, fecha } = req.query;
    if (!dni || !fecha) {
      return res.status(400).json({ error: 'Parámetros requeridos: dni, fecha' });
    }

    const { inicio, fin } = getDiaRango(fecha);

    const pool = await sql.connect(dbConfig);

    // Obtener nombre del monitor (último registro disponible)
    const nombreRes = await pool.request()
      .input('dni', sql.VarChar, dni)
      .query(`
        SELECT TOP 1 NombreMonitor
        FROM (
          SELECT NombreMonitor, FechaHoraInicio AS ts
          FROM [Partner].[mo].[Historial_Monitoreos]
          WHERE DNIMonitor = @dni
          UNION ALL
          SELECT NombreMonitor, InicioEstado AS ts
          FROM [Partner].[mo].[Monitores_Estados_Hist]
          WHERE DNIMonitor = @dni
        ) t
        ORDER BY ts DESC;
      `);

    // Llamadas del día
    const llamadas = await pool.request()
      .input('dni', sql.VarChar, dni)
      .input('inicio', sql.DateTime, inicio)
      .input('fin', sql.DateTime, fin)
      .query(`
        SELECT COUNT(*) AS totalLlamadas,
               ISNULL(SUM(TiempoMonitoreoSegundos),0) AS tiempoMonitoreoSegundos
        FROM [Partner].[mo].[Historial_Monitoreos]
        WHERE DNIMonitor = @dni
          AND FechaHoraInicio >= @inicio
          AND FechaHoraInicio < @fin;
      `);

    const detalleLlamadas = await pool.request()
      .input('dni', sql.VarChar, dni)
      .input('inicio', sql.DateTime, inicio)
      .input('fin', sql.DateTime, fin)
      .query(`
        SELECT ID, ID_Llamada_Largo, NumeroLlamada, AgenteAuditado, CampañaAuditada, ColaAuditada,
               FechaHoraInicio, FechaHoraFin, TiempoMonitoreoSegundos
        FROM [Partner].[mo].[Historial_Monitoreos]
        WHERE DNIMonitor = @dni
          AND FechaHoraInicio >= @inicio
          AND FechaHoraInicio < @fin
        ORDER BY FechaHoraInicio ASC;
      `);

    // Estados: calcular segundos por intersección con el rango
    const estados = await pool.request()
      .input('dni', sql.VarChar, dni)
      .input('inicio', sql.DateTime, inicio)
      .input('fin', sql.DateTime, fin)
      .query(`
        SELECT Estado,
               SUM(
                 DATEDIFF(SECOND,
                   CASE WHEN InicioEstado < @inicio THEN @inicio ELSE InicioEstado END,
                   CASE WHEN ISNULL(FinEstado, GETDATE()) > @fin THEN @fin ELSE ISNULL(FinEstado, GETDATE()) END
                 )
               ) AS segundos
        FROM [Partner].[mo].[Monitores_Estados_Hist]
        WHERE DNIMonitor = @dni
          AND ISNULL(FinEstado, GETDATE()) > @inicio
          AND InicioEstado < @fin
        GROUP BY Estado;
      `);

    const tiempoPorEstado = { conectado: 0, en_llamada: 0, desconectado: 0 };
    estados.recordset.forEach(r => {
      const s = Math.max(0, r.segundos || 0);
      if (tiempoPorEstado.hasOwnProperty(r.Estado)) tiempoPorEstado[r.Estado] = s;
    });

    res.json({
      rango: { inicio, fin },
      dni,
      nombre: nombreRes.recordset[0]?.NombreMonitor || '',
      resumen: {
        totalLlamadas: llamadas.recordset[0].totalLlamadas,
        tiempoMonitoreoSegundos: llamadas.recordset[0].tiempoMonitoreoSegundos,
        tiempoEnLlamadaSegundos: tiempoPorEstado['en_llamada'] || 0,
        tiempoConectadoSegundos: tiempoPorEstado['conectado'] || 0,
        tiempoDesconectadoSegundos: tiempoPorEstado['desconectado'] || 0
      },
      llamadas: detalleLlamadas.recordset
    });
  } catch (error) {
    console.error('Error en reporte monitor-dia:', error);
    res.status(500).json({ error: 'Error al obtener reporte', detalle: error.message });
  }
});

// GET /api/reporte/monitor-rango?dni=...&inicio=YYYY-MM-DD&fin=YYYY-MM-DD
app.get('/api/reporte/monitor-rango', async (req, res) => {
  try {
    const { dni, inicio: inicioStr, fin: finStr } = req.query;
    if (!dni || !inicioStr || !finStr) {
      return res.status(400).json({ error: 'Parámetros requeridos: dni, inicio, fin' });
    }

    const inicio = new Date(`${inicioStr}T00:00:00`);
    const fin = new Date(`${finStr}T00:00:00`);

    const pool = await sql.connect(dbConfig);

    // Obtener nombre del monitor (último registro disponible)
    const nombreRes = await pool.request()
      .input('dni', sql.VarChar, dni)
      .query(`
        SELECT TOP 1 NombreMonitor
        FROM (
          SELECT NombreMonitor, FechaHoraInicio AS ts
          FROM [Partner].[mo].[Historial_Monitoreos]
          WHERE DNIMonitor = @dni
          UNION ALL
          SELECT NombreMonitor, InicioEstado AS ts
          FROM [Partner].[mo].[Monitores_Estados_Hist]
          WHERE DNIMonitor = @dni
        ) t
        ORDER BY ts DESC;
      `);

    const llamadas = await pool.request()
      .input('dni', sql.VarChar, dni)
      .input('inicio', sql.DateTime, inicio)
      .input('fin', sql.DateTime, fin)
      .query(`
        SELECT COUNT(*) AS totalLlamadas,
               ISNULL(SUM(TiempoMonitoreoSegundos),0) AS tiempoMonitoreoSegundos
        FROM [Partner].[mo].[Historial_Monitoreos]
        WHERE DNIMonitor = @dni
          AND FechaHoraInicio >= @inicio
          AND FechaHoraInicio < @fin;
      `);

    const estados = await pool.request()
      .input('dni', sql.VarChar, dni)
      .input('inicio', sql.DateTime, inicio)
      .input('fin', sql.DateTime, fin)
      .query(`
        SELECT Estado,
               SUM(
                 DATEDIFF(SECOND,
                   CASE WHEN InicioEstado < @inicio THEN @inicio ELSE InicioEstado END,
                   CASE WHEN ISNULL(FinEstado, GETDATE()) > @fin THEN @fin ELSE ISNULL(FinEstado, GETDATE()) END
                 )
               ) AS segundos
        FROM [Partner].[mo].[Monitores_Estados_Hist]
        WHERE DNIMonitor = @dni
          AND ISNULL(FinEstado, GETDATE()) > @inicio
          AND InicioEstado < @fin
        GROUP BY Estado;
      `);

    const tiempoPorEstado = { conectado: 0, en_llamada: 0, desconectado: 0 };
    estados.recordset.forEach(r => {
      const s = Math.max(0, r.segundos || 0);
      if (tiempoPorEstado.hasOwnProperty(r.Estado)) tiempoPorEstado[r.Estado] = s;
    });

    res.json({
      rango: { inicio, fin },
      dni,
      nombre: nombreRes.recordset[0]?.NombreMonitor || '',
      resumen: {
        totalLlamadas: llamadas.recordset[0].totalLlamadas,
        tiempoMonitoreoSegundos: llamadas.recordset[0].tiempoMonitoreoSegundos,
        tiempoEnLlamadaSegundos: tiempoPorEstado['en_llamada'] || 0,
        tiempoConectadoSegundos: tiempoPorEstado['conectado'] || 0,
        tiempoDesconectadoSegundos: tiempoPorEstado['desconectado'] || 0
      }
    });
  } catch (error) {
    console.error('Error en reporte monitor-rango:', error);
    res.status(500).json({ error: 'Error al obtener reporte', detalle: error.message });
  }
});

// Mapeo de campañas asignadas por monitor
const campañasAsignadas = {
  '44037525': ['Crosselling', 'Hogar'],      // Andrea Morelia Tejeda Salinas
  '72853980': ['Crosselling', 'Renovacion'], // Evelyn Betzabeth Villa Aramburú
  '48802135': ['Migracion'],                  // Jeanpaul Aguilar Perez
  '76081717': ['Portabilidad Pospago'],       // Yadhira Margarita Vasquez P.
  '007332055': ['Portabilidad Prepago']      // Emmanuel Alejandro Lavin G.
};

// Endpoint de login para monitores y jefa
app.post('/api/login', async (req, res) => {
  try {
    const { dni, password } = req.body;

    // Validar que se envíen DNI y contraseña
    if (!dni || !password) {
      return res.status(400).json({ error: 'DNI y contraseña son requeridos' });
    }

    // Verificar que DNI y contraseña coincidan (ambos deben ser el DNI)
    if (dni !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const pool = await sql.connect(dbConfig);
    
    // Verificar si es monitor activo o la jefa
    const result = await pool.request()
      .input('dni', sql.VarChar, dni)
      .query(`
        SELECT 
          DNI,
          Nombres,
          ApellidoPaterno,
          ApellidoMaterno,
          CargoID,
          EstadoEmpleado
        FROM [Partner].[PRI].[Empleados]
        WHERE DNI = @dni 
          AND (
            (CargoID = 6 AND EstadoEmpleado = 'Activo')
            OR DNI = '76157106'
          )
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'No tienes acceso a esta aplicación' });
    }

    const empleado = result.recordset[0];
    
    // Determinar el rol
    const rol = empleado.DNI === '76157106' ? 'jefa' : 'monitor';
    
    // Obtener campañas asignadas (solo para monitores)
    const campañasAsignadasArray = rol === 'monitor' ? campañasAsignadas[empleado.DNI] : null;
    
    res.json({
      success: true,
      usuario: {
        dni: empleado.DNI,
        nombre: `${empleado.Nombres} ${empleado.ApellidoPaterno} ${empleado.ApellidoMaterno}`,
        rol: rol,
        campañasAsignadas: campañasAsignadasArray
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al procesar login', detalle: error.message });
  }
});

// =====================================================
// SOCKET.IO - Manejo de conexiones en tiempo real
// =====================================================

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Evento: Monitor/Jefa se conecta y envía sus datos
  socket.on('usuario_conectado', (data) => {
    const { dni, nombre, rol } = data;
    
    console.log(`👤 Usuario conectado: ${nombre} (${rol}) - DNI: ${dni}`);
    
    // Guardar/actualizar información del monitor
    monitores.set(dni, {
      dni,
      nombre,
      rol,
      estado: 'conectado', // Estados: conectado, en_llamada, desconectado
      conectadoDesde: Date.now(),
      estadoDesde: Date.now(),
      tiempoEnLlamada: 0,
      tiempoInactivo: 0,
      socketId: socket.id,
      llamadaActual: null,
      ultimaActualizacion: Date.now()
    });

    // Unir a sala según el rol
    if (rol === 'jefa') {
      socket.join('sala_jefa');
      console.log('👑 Jefa unida a sala_jefa');
    } else {
      socket.join('sala_monitores');
      console.log('👤 Monitor unido a sala_monitores');
    }

    // Persistir cambio de estado
    registrarCambioEstado({ dni, nombre, estado: 'conectado', llamadaId: null, rol });

    // Enviar lista actualizada de monitores a la jefa
    emitirEstadoMonitoresAJefa();
  });

  // Evento: Monitor inicia monitoreo de una llamada
  socket.on('iniciar_monitoreo', (data) => {
    const { dni, llamadaId } = data;
    
    const monitor = monitores.get(dni);
    if (monitor) {
      monitor.estado = 'en_llamada';
      monitor.llamadaActual = {
        id: llamadaId,
        inicioMonitoreo: Date.now()
      };
      monitor.estadoDesde = Date.now();
      monitor.ultimaActualizacion = Date.now();
      
      console.log(`▶️ Monitor ${monitor.nombre} inició monitoreo de llamada ${llamadaId}`);
      
      // Persistir cambio de estado
      registrarCambioEstado({ dni: monitor.dni, nombre: monitor.nombre, estado: 'en_llamada', llamadaId: llamadaId, rol: monitor.rol });

      // Notificar a la jefa
      emitirEstadoMonitoresAJefa();
    }
  });

  // Evento: Monitor finaliza monitoreo de una llamada
  socket.on('finalizar_monitoreo', (data) => {
    const { dni, tiempoTotal } = data;
    
    const monitor = monitores.get(dni);
    if (monitor && monitor.llamadaActual) {
      const tiempoMonitoreo = Math.floor((Date.now() - monitor.llamadaActual.inicioMonitoreo) / 1000);
      
      // Cambiar estado y acumular tiempo total en llamada
      monitor.estado = 'conectado';
      monitor.tiempoEnLlamada += tiempoMonitoreo;
      monitor.llamadaActual = null;
      monitor.estadoDesde = Date.now();
      monitor.ultimaActualizacion = Date.now();
      monitor.conectadoDesde = Date.now(); // Resetear tiempo de conexión para tiempo inactivo
      
      console.log(`⏹️ Monitor ${monitor.nombre} finalizó monitoreo (${tiempoMonitoreo}s)`);
      
      // Persistir cambio de estado
      registrarCambioEstado({ dni: monitor.dni, nombre: monitor.nombre, estado: 'conectado', llamadaId: null, rol: monitor.rol });

      // Notificar a la jefa
      emitirEstadoMonitoresAJefa();
    }
  });

  // Evento: Actualización periódica de tiempo (cada segundo)
  socket.on('actualizar_tiempo', (data) => {
    const { dni } = data;
    
    const monitor = monitores.get(dni);
    if (monitor) {
      monitor.ultimaActualizacion = Date.now();
      
      // Calcular tiempos
      const tiempoConectado = Math.floor((Date.now() - monitor.conectadoDesde) / 1000);
      
      if (monitor.estado === 'conectado') {
        // Tiempo inactivo = tiempo conectado - tiempo en llamada
        monitor.tiempoInactivo = tiempoConectado - monitor.tiempoEnLlamada;
      }
    }
  });

  // Evento: Desconexión
  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
    
    // Buscar el monitor por socketId
    for (const [dni, monitor] of monitores.entries()) {
      if (monitor.socketId === socket.id) {
        monitor.estado = 'desconectado';
        monitor.estadoDesde = Date.now();
        monitor.ultimaActualizacion = Date.now();
        
        console.log(`👤 Monitor desconectado: ${monitor.nombre}`);
        
        // Persistir cambio de estado
        registrarCambioEstado({ dni: monitor.dni, nombre: monitor.nombre, estado: 'desconectado', llamadaId: null, rol: monitor.rol });

        // Notificar a la jefa
        emitirEstadoMonitoresAJefa();
        break;
      }
    }
  });
});

// Función para enviar estado de monitores a la jefa
function emitirEstadoMonitoresAJefa() {
  const estadoMonitores = Array.from(monitores.values()).map(monitor => {
    const ahora = Date.now();
    
    // Inicializar todos los tiempos en 0
    let tiempoEnLlamada = 0;
    let tiempoInactivo = 0;
    let tiempoDesconectado = 0;
    const estadoDesde = monitor.estadoDesde || monitor.conectadoDesde || ahora;
    const segundosEnEstado = Math.max(0, Math.floor((ahora - estadoDesde) / 1000));
    
    // Solo calcular el tiempo del estado actual
    switch (monitor.estado) {
      case 'en_llamada':
        if (monitor.llamadaActual) {
          tiempoEnLlamada = Math.floor((ahora - monitor.llamadaActual.inicioMonitoreo) / 1000);
        }
        break;
        
      case 'conectado':
        // Tiempo inactivo = tiempo desde que se conectó - tiempo acumulado en llamadas
        const tiempoConectado = Math.floor((ahora - monitor.conectadoDesde) / 1000);
        tiempoInactivo = Math.max(0, tiempoConectado - monitor.tiempoEnLlamada);
        break;
        
      case 'desconectado':
        tiempoDesconectado = Math.floor((ahora - monitor.ultimaActualizacion) / 1000);
        break;
    }
    
    // Formatear fecha/hora del cambio de estado
    const fechaEstadoDate = new Date(estadoDesde);
    const yyyy = fechaEstadoDate.getFullYear();
    const mm = String(fechaEstadoDate.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaEstadoDate.getDate()).padStart(2, '0');
    const HH = String(fechaEstadoDate.getHours()).padStart(2, '0');
    const MM = String(fechaEstadoDate.getMinutes()).padStart(2, '0');
    const SS = String(fechaEstadoDate.getSeconds()).padStart(2, '0');

    return {
      dni: monitor.dni,
      nombre: monitor.nombre,
      rol: monitor.rol,
      estado: monitor.estado,
      tiempoEnLlamada,
      tiempoInactivo,
      tiempoDesconectado,
      llamadaActual: monitor.llamadaActual?.id || null,
      fechaEstado: `${dd}/${mm}/${yyyy}`,
      horaEstado: `${HH}:${MM}:${SS}`,
      tiempoEnEstado: segundosEnEstado
    };
  });
  
  // Emitir solo a la sala de la jefa
  io.to('sala_jefa').emit('estado_monitores', estadoMonitores);
}

// Actualizar estado cada segundo
setInterval(() => {
  emitirEstadoMonitoresAJefa();
}, 1000);

// =====================================================
// FIN SOCKET.IO
// =====================================================

// Inicia el servidor
const HOST = '0.0.0.0';
// Inicia el servidor
server.listen(PORT, HOST, () => {
    console.log(`\n--- Accesible a través de ---`);
    
    // Imprime localhost (siempre funciona)
    console.log(`👉 http://localhost:${PORT}`);
    
    // Imprime las IPs detectadas dinámicamente
    const localIps = getLocalIps();
    localIps.forEach(ip => {
        console.log(`👉 http://${ip}:${PORT}`);
    });
  
    console.log(`-----------------------------`);
  });