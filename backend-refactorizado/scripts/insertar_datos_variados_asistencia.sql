-- ===============================================
-- SCRIPT PARA INSERTAR DATOS VARIADOS DE ASISTENCIA
-- ===============================================

-- Limpiar datos existentes para regenerar con más variedad
DELETE FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
PRINT '🗑️ Datos anteriores eliminados'

-- Obtener algunos DNIs de empleados existentes
DECLARE @DNIs TABLE (DNI VARCHAR(20), Orden INT)
INSERT INTO @DNIs (DNI, Orden)
SELECT TOP 10 DNI, ROW_NUMBER() OVER (ORDER BY DNI) as Orden
FROM [Partner].[PRI].[Empleados] 
WHERE EstadoEmpleado = 'ACTIVO'

-- Si no hay empleados, usar DNIs de prueba
IF NOT EXISTS (SELECT 1 FROM @DNIs)
BEGIN
    INSERT INTO @DNIs VALUES 
    ('12345678', 1), ('87654321', 2), ('11111111', 3), 
    ('22222222', 4), ('33333333', 5), ('44444444', 6),
    ('55555555', 7), ('66666666', 8), ('77777777', 9), ('88888888', 10)
END

PRINT '👥 DNIs preparados para inserción de datos'

-- Insertar datos para Enero 2025 con patrones realistas
DECLARE @Fecha DATE = '2025-01-01'
DECLARE @FechaFin DATE = '2025-01-31'
DECLARE @Contador INT = 1

WHILE @Fecha <= @FechaFin
BEGIN
    -- Solo días laborables (lunes a viernes)
    IF DATEPART(WEEKDAY, @Fecha) NOT IN (1, 7)
    BEGIN
        -- Insertar para cada empleado con patrones diferentes
        DECLARE @DNI VARCHAR(20)
        DECLARE @Orden INT
        
        -- DNI 1 - Empleado muy puntual (95% presente, 5% tardanza)
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 1
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, CASE WHEN @Contador % 20 = 0 THEN 'T' ELSE 'P' END)
        
        -- DNI 2 - Empleado con faltas ocasionales
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 2
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Contador % 15 = 0 THEN 'F'  -- Falta cada 15 días
                WHEN @Contador % 8 = 0 THEN 'T'   -- Tardanza cada 8 días
                WHEN @Contador % 12 = 0 THEN 'J'  -- Justificado cada 12 días
                ELSE 'P' 
            END)
        
        -- DNI 3 - Empleado con tardanzas frecuentes
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 3
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Contador % 3 = 0 THEN 'T'   -- Tardanza cada 3 días
                WHEN @Contador % 10 = 0 THEN 'F'  -- Falta cada 10 días
                ELSE 'P' 
            END)
        
        -- DNI 4 - Empleado con vacaciones (15-18 de enero)
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 4
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Fecha BETWEEN '2025-01-15' AND '2025-01-18' THEN 'V'
                WHEN @Contador % 7 = 0 THEN 'T'
                ELSE 'P'
            END)
        
        -- DNI 5 - Empleado con justificaciones médicas
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 5
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Contador % 6 = 0 THEN 'J'   -- Justificado cada 6 días
                WHEN @Contador % 14 = 0 THEN 'F'  -- Falta cada 14 días
                WHEN @Contador % 4 = 0 THEN 'T'   -- Tardanza cada 4 días
                ELSE 'P' 
            END)
        
        -- DNI 6 - Empleado irregular
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 6
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Contador % 5 = 0 THEN 'F'   -- Falta cada 5 días
                WHEN @Contador % 3 = 1 THEN 'T'   -- Tardanza variada
                WHEN @Contador % 7 = 0 THEN 'J'   -- Justificado cada 7 días
                ELSE 'P' 
            END)
        
        -- DNI 7 - Empleado con vacaciones largas (22-26 de enero)
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 7
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Fecha BETWEEN '2025-01-22' AND '2025-01-26' THEN 'V'
                WHEN @Contador % 9 = 0 THEN 'T'
                ELSE 'P'
            END)
        
        -- DNI 8 - Empleado muy responsable con pocas tardanzas
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 8
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, CASE WHEN @Contador % 25 = 0 THEN 'T' ELSE 'P' END)
        
        -- DNI 9 - Empleado con patrón mixto
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 9
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Contador % 11 = 0 THEN 'F'
                WHEN @Contador % 6 = 0 THEN 'T'
                WHEN @Contador % 13 = 0 THEN 'J'
                ELSE 'P' 
            END)
        
        -- DNI 10 - Empleado con justificaciones frecuentes
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 10
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Contador % 4 = 0 THEN 'J'   -- Muchas justificaciones
                WHEN @Contador % 16 = 0 THEN 'F'
                WHEN @Contador % 8 = 0 THEN 'T'
                ELSE 'P' 
            END)
    END
    
    SET @Fecha = DATEADD(DAY, 1, @Fecha)
    SET @Contador = @Contador + 1
END

-- Insertar algunos datos para Agosto 2025 también
SET @Fecha = '2025-08-01'
SET @FechaFin = '2025-08-31'
SET @Contador = 1

WHILE @Fecha <= @FechaFin
BEGIN
    IF DATEPART(WEEKDAY, @Fecha) NOT IN (1, 7)
    BEGIN
        -- Insertar patrones similares pero con algunas variaciones para agosto
        
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 1
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, CASE WHEN @Contador % 18 = 0 THEN 'T' ELSE 'P' END)
        
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 2
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Contador % 12 = 0 THEN 'F'
                WHEN @Contador % 5 = 0 THEN 'T'
                WHEN @Contador % 8 = 0 THEN 'J'
                ELSE 'P' 
            END)
            
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 3
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Contador % 4 = 0 THEN 'T'
                WHEN @Contador % 15 = 0 THEN 'F'
                ELSE 'P' 
            END)
            
        -- Vacaciones de verano para DNI 4 (5-12 de agosto)
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 4
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Fecha BETWEEN '2025-08-05' AND '2025-08-12' THEN 'V'
                ELSE 'P'
            END)
            
        SELECT @DNI = DNI FROM @DNIs WHERE Orden = 5
        INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
        VALUES (@DNI, @Fecha, 
            CASE 
                WHEN @Contador % 7 = 0 THEN 'J'
                WHEN @Contador % 11 = 0 THEN 'F'
                WHEN @Contador % 3 = 0 THEN 'T'
                ELSE 'P' 
            END)
    END
    
    SET @Fecha = DATEADD(DAY, 1, @Fecha)
    SET @Contador = @Contador + 1
END

PRINT '✅ Datos variados insertados exitosamente'

-- Mostrar resumen de estados
PRINT ''
PRINT '📊 RESUMEN DE ESTADOS INSERTADOS:'
SELECT 
    Estado,
    CASE Estado
        WHEN 'P' THEN 'Presente'
        WHEN 'F' THEN 'Falta'
        WHEN 'T' THEN 'Tardanza'
        WHEN 'J' THEN 'Justificado'
        WHEN 'V' THEN 'Vacaciones'
        ELSE 'Desconocido'
    END as Descripcion,
    COUNT(*) as Cantidad,
    CAST(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]) AS DECIMAL(5,2)) as Porcentaje
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
GROUP BY Estado
ORDER BY Estado

PRINT ''
PRINT '🎉 Script de datos variados completado exitosamente'
