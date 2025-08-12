-- ===============================================
-- SCRIPT PARA VERIFICAR Y CREAR TABLA DE ASISTENCIA
-- ===============================================

-- 1. Verificar si existe la tabla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReporteDeAsistenciaGuardado' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '❌ La tabla ReporteDeAsistenciaGuardado NO existe. Creándola...'
    
    -- Crear la tabla
    CREATE TABLE [Partner].[dbo].[ReporteDeAsistenciaGuardado] (
        [ID] [int] IDENTITY(1,1) NOT NULL,
        [DNI] [varchar](20) NOT NULL,
        [Fecha] [date] NOT NULL,
        [Estado] [varchar](1) NOT NULL, -- P=Presente, F=Falta, T=Tardanza, J=Justificado, V=Vacaciones
        [FechaRegistro] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_ReporteDeAsistenciaGuardado] PRIMARY KEY CLUSTERED ([ID] ASC),
        CONSTRAINT [IX_ReporteDeAsistenciaGuardado_DNI_Fecha] UNIQUE ([DNI], [Fecha])
    )
    
    PRINT '✅ Tabla ReporteDeAsistenciaGuardado creada exitosamente'
END
ELSE
BEGIN
    PRINT '✅ La tabla ReporteDeAsistenciaGuardado ya existe'
END

-- 2. Verificar si tiene datos
DECLARE @TotalRegistros INT
SELECT @TotalRegistros = COUNT(*) FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]

IF @TotalRegistros = 0
BEGIN
    PRINT '⚠️  La tabla está vacía. Insertando datos de prueba...'
    
    -- Obtener algunos DNIs de empleados existentes
    DECLARE @DNI1 VARCHAR(20), @DNI2 VARCHAR(20), @DNI3 VARCHAR(20), @DNI4 VARCHAR(20), @DNI5 VARCHAR(20)
    
    SELECT TOP 5 
        @DNI1 = CASE WHEN ROW_NUMBER() OVER (ORDER BY DNI) = 1 THEN DNI END,
        @DNI2 = CASE WHEN ROW_NUMBER() OVER (ORDER BY DNI) = 2 THEN DNI END,
        @DNI3 = CASE WHEN ROW_NUMBER() OVER (ORDER BY DNI) = 3 THEN DNI END,
        @DNI4 = CASE WHEN ROW_NUMBER() OVER (ORDER BY DNI) = 4 THEN DNI END,
        @DNI5 = CASE WHEN ROW_NUMBER() OVER (ORDER BY DNI) = 5 THEN DNI END
    FROM [Partner].[PRI].[Empleados] 
    WHERE EstadoEmpleado = 'ACTIVO'
    
    -- Si no se obtuvieron DNIs, usar algunos por defecto
    IF @DNI1 IS NULL SET @DNI1 = '12345678'
    IF @DNI2 IS NULL SET @DNI2 = '87654321'  
    IF @DNI3 IS NULL SET @DNI3 = '11111111'
    IF @DNI4 IS NULL SET @DNI4 = '22222222'
    IF @DNI5 IS NULL SET @DNI5 = '33333333'
    
    -- Insertar datos para Enero 2025
    DECLARE @Fecha DATE = '2025-01-01'
    DECLARE @FechaFin DATE = '2025-01-31'
    
    WHILE @Fecha <= @FechaFin
    BEGIN
        -- Solo insertar datos para días laborables (lunes a viernes)
        IF DATEPART(WEEKDAY, @Fecha) NOT IN (1, 7) -- No domingo(1) ni sábado(7)
        BEGIN
            -- DNI 1 - Empleado muy puntual
            INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
            VALUES (@DNI1, @Fecha, CASE WHEN RAND() > 0.95 THEN 'T' ELSE 'P' END)
            
            -- DNI 2 - Empleado con algunas faltas
            INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
            VALUES (@DNI2, @Fecha, 
                CASE 
                    WHEN RAND() > 0.85 THEN 'P'
                    WHEN RAND() > 0.7 THEN 'T' 
                    WHEN RAND() > 0.5 THEN 'J'
                    ELSE 'F' 
                END)
            
            -- DNI 3 - Empleado regular
            INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
            VALUES (@DNI3, @Fecha, 
                CASE 
                    WHEN RAND() > 0.8 THEN 'P'
                    WHEN RAND() > 0.9 THEN 'T'
                    ELSE 'P'
                END)
            
            -- DNI 4 - Empleado con vacaciones algunos días
            INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
            VALUES (@DNI4, @Fecha, 
                CASE 
                    WHEN @Fecha BETWEEN '2025-01-15' AND '2025-01-18' THEN 'V'
                    WHEN RAND() > 0.9 THEN 'T'
                    ELSE 'P'
                END)
            
            -- DNI 5 - Empleado con patrón mixto
            INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
            VALUES (@DNI5, @Fecha, 
                CASE 
                    WHEN RAND() > 0.75 THEN 'P'
                    WHEN RAND() > 0.85 THEN 'T'
                    WHEN RAND() > 0.6 THEN 'J'
                    ELSE 'F'
                END)
        END
        
        SET @Fecha = DATEADD(DAY, 1, @Fecha)
    END
    
    -- Insertar algunos datos para Agosto 2025 también
    SET @Fecha = '2025-08-01'
    SET @FechaFin = '2025-08-31'
    
    WHILE @Fecha <= @FechaFin
    BEGIN
        IF DATEPART(WEEKDAY, @Fecha) NOT IN (1, 7)
        BEGIN
            INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
            VALUES (@DNI1, @Fecha, CASE WHEN RAND() > 0.9 THEN 'T' ELSE 'P' END)
            
            INSERT INTO [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
            VALUES (@DNI2, @Fecha, 
                CASE 
                    WHEN RAND() > 0.8 THEN 'P'
                    WHEN RAND() > 0.6 THEN 'T'
                    ELSE 'J'
                END)
        END
        
        SET @Fecha = DATEADD(DAY, 1, @Fecha)
    END
    
    PRINT '✅ Datos de prueba insertados exitosamente'
END
ELSE
BEGIN
    PRINT '✅ La tabla ya tiene datos (' + CAST(@TotalRegistros AS VARCHAR(10)) + ' registros)'
END

-- 3. Mostrar resumen de datos
PRINT ''
PRINT '📊 RESUMEN DE DATOS:'
PRINT '==================='

SELECT 
    'Total de registros' as Descripcion,
    COUNT(*) as Cantidad
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]

UNION ALL

SELECT 
    'Empleados únicos' as Descripcion,
    COUNT(DISTINCT DNI) as Cantidad
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]

UNION ALL

SELECT 
    'Años disponibles' as Descripcion,
    COUNT(DISTINCT YEAR(Fecha)) as Cantidad
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]

-- 4. Mostrar años disponibles
PRINT ''
PRINT '📅 AÑOS DISPONIBLES:'
SELECT DISTINCT YEAR(Fecha) as Anio
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
ORDER BY Anio DESC

-- 5. Mostrar muestra de datos
PRINT ''
PRINT '📋 MUESTRA DE DATOS:'
SELECT TOP 10 
    DNI, 
    Fecha, 
    Estado,
    CASE Estado
        WHEN 'P' THEN 'Presente'
        WHEN 'F' THEN 'Falta'
        WHEN 'T' THEN 'Tardanza'
        WHEN 'J' THEN 'Justificado'
        WHEN 'V' THEN 'Vacaciones'
        ELSE 'Desconocido'
    END as EstadoDescripcion
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
ORDER BY Fecha DESC, DNI

PRINT ''
PRINT '🎉 Script completado exitosamente'
