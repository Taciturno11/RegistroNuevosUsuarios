-- Script para crear datos de prueba del Reporte de Asistencia
-- Ejecutar este script si la tabla no existe o necesita datos de prueba

-- 1. Crear la tabla si no existe
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReporteDeAsistenciaGuardado' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '🔧 Creando tabla ReporteDeAsistenciaGuardado...'
    
    CREATE TABLE [Partner].[dbo].[ReporteDeAsistenciaGuardado] (
        DNI VARCHAR(20) NOT NULL,
        Fecha DATE NOT NULL,
        Estado VARCHAR(5) NOT NULL,
        CONSTRAINT PK_ReporteAsistencia PRIMARY KEY (DNI, Fecha)
    );
    
    PRINT '✅ Tabla creada exitosamente'
END
ELSE
BEGIN
    PRINT '✅ La tabla ya existe'
END

-- 2. Limpiar datos existentes para el periodo de prueba (opcional)
PRINT '🧹 Limpiando datos existentes para enero 2025...'
DELETE FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado] 
WHERE Fecha BETWEEN '2025-01-01' AND '2025-01-31';

-- 3. Obtener algunos DNIs de empleados activos para generar datos
DECLARE @EmpleadosDNI TABLE (DNI VARCHAR(20))

INSERT INTO @EmpleadosDNI (DNI)
SELECT TOP 10 DNI 
FROM [Partner].[PRI].[Empleados] 
WHERE EstadoEmpleado = 'Activo'
ORDER BY DNI;

-- 4. Generar datos de asistencia para enero 2025 (31 días)
PRINT '📊 Generando datos de prueba para enero 2025...'

DECLARE @Fecha DATE = '2025-01-01'
DECLARE @FechaFin DATE = '2025-01-31'
DECLARE @DNI VARCHAR(20)
DECLARE @Estado VARCHAR(5)
DECLARE @Random FLOAT

WHILE @Fecha <= @FechaFin
BEGIN
    -- Para cada empleado en la fecha actual
    DECLARE empleado_cursor CURSOR FOR 
    SELECT DNI FROM @EmpleadosDNI
    
    OPEN empleado_cursor
    FETCH NEXT FROM empleado_cursor INTO @DNI
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Generar estado aleatorio basado en probabilidades realistas
        SET @Random = RAND()
        
        -- Lógica para fines de semana (sábado=7, domingo=1)
        IF DATEPART(WEEKDAY, @Fecha) IN (1, 7)
        BEGIN
            -- Fines de semana - mayoría no trabaja
            IF @Random < 0.8
                SET @Estado = NULL -- No insertar registro (no trabaja)
            ELSE IF @Random < 0.95
                SET @Estado = 'P' -- Presente (trabajo fin de semana)
            ELSE
                SET @Estado = 'F' -- Falta
        END
        ELSE
        BEGIN
            -- Días laborales - distribución realista
            IF @Random < 0.85
                SET @Estado = 'P' -- Presente (85%)
            ELSE IF @Random < 0.90
                SET @Estado = 'T' -- Tardanza (5%)
            ELSE IF @Random < 0.95
                SET @Estado = 'J' -- Justificado (5%)
            ELSE IF @Random < 0.98
                SET @Estado = 'V' -- Vacaciones (3%)
            ELSE
                SET @Estado = 'F' -- Falta (2%)
        END
        
        -- Insertar registro si hay estado
        IF @Estado IS NOT NULL
        BEGIN
            INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
            VALUES (@DNI, @Fecha, @Estado)
        END
        
        FETCH NEXT FROM empleado_cursor INTO @DNI
    END
    
    CLOSE empleado_cursor
    DEALLOCATE empleado_cursor
    
    -- Siguiente día
    SET @Fecha = DATEADD(DAY, 1, @Fecha)
END

-- 5. Generar también datos para agosto 2025 (como en tu consulta original)
PRINT '📊 Generando datos de prueba para agosto 2025...'

-- Limpiar agosto 2025
DELETE FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado] 
WHERE Fecha BETWEEN '2025-08-01' AND '2025-08-31';

SET @Fecha = '2025-08-01'
SET @FechaFin = '2025-08-31'

WHILE @Fecha <= @FechaFin
BEGIN
    -- Para cada empleado en la fecha actual
    DECLARE empleado_cursor2 CURSOR FOR 
    SELECT DNI FROM @EmpleadosDNI
    
    OPEN empleado_cursor2
    FETCH NEXT FROM empleado_cursor2 INTO @DNI
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @Random = RAND()
        
        -- Lógica para fines de semana
        IF DATEPART(WEEKDAY, @Fecha) IN (1, 7)
        BEGIN
            IF @Random < 0.8
                SET @Estado = NULL
            ELSE IF @Random < 0.95
                SET @Estado = 'P'
            ELSE
                SET @Estado = 'F'
        END
        ELSE
        BEGIN
            IF @Random < 0.85
                SET @Estado = 'P'
            ELSE IF @Random < 0.90
                SET @Estado = 'T'
            ELSE IF @Random < 0.95
                SET @Estado = 'J'
            ELSE IF @Random < 0.98
                SET @Estado = 'V'
            ELSE
                SET @Estado = 'F'
        END
        
        IF @Estado IS NOT NULL
        BEGIN
            INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
            VALUES (@DNI, @Fecha, @Estado)
        END
        
        FETCH NEXT FROM empleado_cursor2 INTO @DNI
    END
    
    CLOSE empleado_cursor2
    DEALLOCATE empleado_cursor2
    
    SET @Fecha = DATEADD(DAY, 1, @Fecha)
END

-- 6. Mostrar resumen de datos creados
PRINT ''
PRINT '📊 Resumen de datos creados:'

SELECT 
    YEAR(Fecha) as Año,
    MONTH(Fecha) as Mes,
    COUNT(*) as TotalRegistros,
    COUNT(DISTINCT DNI) as EmpleadosUnicos
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
WHERE Fecha BETWEEN '2025-01-01' AND '2025-08-31'
GROUP BY YEAR(Fecha), MONTH(Fecha)
ORDER BY Año, Mes;

PRINT ''
PRINT '🏷️ Distribución de estados:'
SELECT 
    Estado,
    CASE 
        WHEN Estado = 'P' THEN 'Presente'
        WHEN Estado = 'F' THEN 'Falta'
        WHEN Estado = 'T' THEN 'Tardanza'
        WHEN Estado = 'J' THEN 'Justificado'
        WHEN Estado = 'V' THEN 'Vacaciones'
        ELSE 'Desconocido'
    END as Descripcion,
    COUNT(*) as Cantidad,
    CAST(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado] WHERE Fecha BETWEEN '2025-01-01' AND '2025-08-31') AS DECIMAL(5,2)) as Porcentaje
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
WHERE Fecha BETWEEN '2025-01-01' AND '2025-08-31'
GROUP BY Estado
ORDER BY Cantidad DESC;

PRINT ''
PRINT '✅ Datos de prueba creados exitosamente'
PRINT '💡 Ahora puede probar el reporte de asistencias en la aplicación web'