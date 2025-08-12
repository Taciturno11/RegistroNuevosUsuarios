-- Script para verificar la tabla de Reporte de Asistencia
-- y mostrar datos de ejemplo

-- 1. Verificar si existe la tabla ReporteDeAsistenciaGuardado
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ReporteDeAsistenciaGuardado' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '✅ La tabla [Partner].[dbo].[ReporteDeAsistenciaGuardado] existe'
    
    -- Mostrar estructura de la tabla
    PRINT ''
    PRINT '📋 Estructura de la tabla:'
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_NAME = 'ReporteDeAsistenciaGuardado'
    ORDER BY ORDINAL_POSITION;
    
    -- Mostrar cantidad de registros
    DECLARE @TotalRegistros INT
    SELECT @TotalRegistros = COUNT(*) FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
    PRINT ''
    PRINT '📊 Total de registros en la tabla: ' + CAST(@TotalRegistros AS VARCHAR(10))
    
    -- Mostrar rango de fechas disponibles
    DECLARE @FechaMin DATE, @FechaMax DATE
    SELECT 
        @FechaMin = MIN(Fecha),
        @FechaMax = MAX(Fecha)
    FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
    WHERE Fecha IS NOT NULL
    
    PRINT '📅 Rango de fechas: ' + CAST(@FechaMin AS VARCHAR(10)) + ' a ' + CAST(@FechaMax AS VARCHAR(10))
    
    -- Mostrar años disponibles
    PRINT ''
    PRINT '📆 Años disponibles:'
    SELECT DISTINCT YEAR(Fecha) as Año, COUNT(*) as Registros
    FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
    WHERE Fecha IS NOT NULL
    GROUP BY YEAR(Fecha)
    ORDER BY Año DESC;
    
    -- Mostrar estados disponibles
    PRINT ''
    PRINT '🏷️ Estados de asistencia disponibles:'
    SELECT Estado, COUNT(*) as Cantidad
    FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
    WHERE Estado IS NOT NULL
    GROUP BY Estado
    ORDER BY Cantidad DESC;
    
    -- Mostrar muestra de datos recientes
    PRINT ''
    PRINT '📋 Muestra de datos recientes (últimos 10 registros):'
    SELECT TOP 10 
        DNI,
        Fecha,
        Estado,
        CASE 
            WHEN Estado = 'P' THEN 'Presente'
            WHEN Estado = 'F' THEN 'Falta'
            WHEN Estado = 'T' THEN 'Tardanza'
            WHEN Estado = 'J' THEN 'Justificado'
            WHEN Estado = 'V' THEN 'Vacaciones'
            ELSE 'Desconocido'
        END as EstadoDescripcion
    FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
    ORDER BY Fecha DESC;
    
END
ELSE
BEGIN
    PRINT '❌ La tabla [Partner].[dbo].[ReporteDeAsistenciaGuardado] NO existe'
    PRINT ''
    PRINT '💡 Para crear datos de prueba, ejecute el siguiente script:'
    PRINT ''
    PRINT '-- Crear tabla de ejemplo (si no existe)'
    PRINT 'CREATE TABLE [Partner].[dbo].[ReporteDeAsistenciaGuardado] ('
    PRINT '    DNI VARCHAR(20) NOT NULL,'
    PRINT '    Fecha DATE NOT NULL,'
    PRINT '    Estado VARCHAR(5) NOT NULL,'
    PRINT '    PRIMARY KEY (DNI, Fecha)'
    PRINT ');'
    PRINT ''
    PRINT '-- Insertar datos de prueba para agosto 2025'
    PRINT 'INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado) VALUES'
    PRINT '(''12345678'', ''2025-08-01'', ''P''),'
    PRINT '(''12345678'', ''2025-08-02'', ''P''),'
    PRINT '(''12345678'', ''2025-08-03'', ''F''),'
    PRINT '(''87654321'', ''2025-08-01'', ''P''),'
    PRINT '(''87654321'', ''2025-08-02'', ''T''),'
    PRINT '(''87654321'', ''2025-08-03'', ''P'');'
END

-- 2. Verificar si hay empleados en la tabla PRI.Empleados
PRINT ''
PRINT '👥 Verificando empleados disponibles:'
SELECT COUNT(*) as TotalEmpleados
FROM [Partner].[PRI].[Empleados]
WHERE EstadoEmpleado = 'Activo';

-- 3. Mostrar algunos empleados de ejemplo
PRINT ''
PRINT '📋 Empleados de ejemplo (primeros 5 activos):'
SELECT TOP 5
    DNI,
    Nombres,
    ApellidoPaterno,
    ApellidoMaterno,
    EstadoEmpleado
FROM [Partner].[PRI].[Empleados]
WHERE EstadoEmpleado = 'Activo'
ORDER BY ApellidoPaterno, ApellidoMaterno;

PRINT ''
PRINT '🔍 Script de verificación completado'
PRINT '💡 Si la tabla no existe, cree datos de prueba usando los scripts mostrados arriba'