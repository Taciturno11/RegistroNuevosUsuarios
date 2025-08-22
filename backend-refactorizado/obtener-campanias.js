const sql = require('mssql');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  server: process.env.SQL_SERVER || '127.0.0.1',
  database: process.env.SQL_DATABASE || 'Partner',
  user: process.env.SQL_USER || 'tu_usuario',
  password: process.env.SQL_PASSWORD || 'tu_password',
  port: parseInt(process.env.SQL_PORT || '1433'),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  }
};

async function obtenerTodasLasCampanias() {
  let pool;
  
  try {
    console.log('🔍 Conectando a la base de datos...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Conexión establecida');

    // Consulta 1: Todas las campañas en PRI.Campanias
    console.log('\n📊 CONSULTA 1: Todas las campañas en PRI.Campanias');
    const todasCampanias = await pool.request().query(`
      SELECT CampañaID, NombreCampaña 
      FROM PRI.Campanias 
      ORDER BY NombreCampaña
    `);
    
    console.log('📋 Resultado:');
    todasCampanias.recordset.forEach((camp, index) => {
      console.log(`  ${index + 1}. ID: ${camp.CampañaID} - ${camp.NombreCampaña}`);
    });

    // Consulta 2: Campañas que aparecen en empleados activos/cesados
    console.log('\n📊 CONSULTA 2: Campañas en empleados (Activos/Cesados)');
    const campaniasEnEmpleados = await pool.request().query(`
      SELECT DISTINCT c.NombreCampaña
      FROM PRI.Campanias c
      INNER JOIN PRI.Empleados e ON c.CampañaID = e.CampañaID
      WHERE e.EstadoEmpleado IN ('Activo', 'Cese')
      ORDER BY c.NombreCampaña
    `);
    
    console.log('📋 Resultado:');
    campaniasEnEmpleados.recordset.forEach((camp, index) => {
      console.log(`  ${index + 1}. ${camp.NombreCampaña}`);
    });

    // Consulta 3: Campañas que aparecen en capacitaciones
    console.log('\n📊 CONSULTA 3: Campañas en capacitaciones');
    const campaniasEnCapacitaciones = await pool.request().query(`
      SELECT DISTINCT c.NombreCampaña
      FROM PRI.Campanias c
      INNER JOIN Postulantes_En_Formacion pf ON c.CampañaID = pf.CampañaID
      ORDER BY c.NombreCampaña
    `);
    
    console.log('📋 Resultado:');
    campaniasEnCapacitaciones.recordset.forEach((camp, index) => {
      console.log(`  ${index + 1}. ${camp.NombreCampaña}`);
    });

    // Análisis de clasificación
    console.log('\n🎯 ANÁLISIS DE CLASIFICACIÓN POR ÁREAS');
    console.log('=====================================');
    
    const areasCampañas = {
      'OUTBOUND': [
        'MIGRACION',
        'PORTABILIDAD PREPAGO', 
        'RENOVACION',
        'HOGAR',
        'REGULARIZACION',
        'PORTABILIDAD POSPAGO',
        'PREPAGO DIGITAL'
      ],
      'INBOUND': [
        'UNIFICADO',
        'AUDITORIA',
        'CROSSELLING',
        'BACK SEGUIMIENTO',
        'REDES SOCIALES'
      ],
      'STAFF': [
        'ESTRUCTURA',
        'CALIDAD',
        'CAPACITACION',
        'ANALISTAS'
      ]
    };

    const todasLasCampaniasNombres = todasCampanias.recordset.map(c => c.NombreCampaña.toUpperCase());
    
    console.log('\n📊 CLASIFICACIÓN DE CAMPAÑAS:');
    
    Object.entries(areasCampañas).forEach(([area, campañas]) => {
      console.log(`\n🔵 ${area}:`);
      campañas.forEach(campaña => {
        const existe = todasLasCampaniasNombres.includes(campaña);
        console.log(`  ${existe ? '✅' : '❌'} ${campaña} ${existe ? '(EXISTE)' : '(NO EXISTE)'}`);
      });
    });

    // Campañas que están en "OTROS"
    console.log('\n❓ CAMPAÑAS EN "OTROS":');
    const campañasClasificadas = Object.values(areasCampañas).flat();
    const campañasOtros = todasLasCampaniasNombres.filter(campaña => 
      !campañasClasificadas.includes(campaña)
    );
    
    if (campañasOtros.length > 0) {
      campañasOtros.forEach((campaña, index) => {
        console.log(`  ${index + 1}. ${campaña}`);
      });
    } else {
      console.log('  ✅ No hay campañas en "OTROS" - todas están clasificadas');
    }

    // Resumen
    console.log('\n📈 RESUMEN:');
    console.log(`  Total campañas en BD: ${todasCampanias.recordset.length}`);
    console.log(`  Campañas en empleados: ${campaniasEnEmpleados.recordset.length}`);
    console.log(`  Campañas en capacitaciones: ${campaniasEnCapacitaciones.recordset.length}`);
    console.log(`  Campañas en "OTROS": ${campañasOtros.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n✅ Conexión cerrada');
    }
  }
}

// Ejecutar el script
obtenerTodasLasCampanias();
