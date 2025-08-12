-- ===============================================
-- SCRIPT PARA DEBUG COMPLETO DE TARDANZAS
-- ===============================================

PRINT '🔍 INICIANDO DEBUG DE TARDANZAS'
PRINT '================================='

-- 1. Verificar si existe la tabla
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ReporteDeAsistenciaGuardado')
BEGIN
    PRINT '✅ La tabla ReporteDeAsistenciaGuardado existe'
END
ELSE
BEGIN
    PRINT '❌ La tabla ReporteDeAsistenciaGuardado NO existe'
    RETURN
END

-- 2. Mostrar estructura de la tabla
PRINT ''
PRINT '📋 ESTRUCTURA DE LA TABLA:'
SELECT 
    COLUMN_NAME as NombreColumna,
    DATA_TYPE as TipoDato,
    IS_NULLABLE as PermiteNull,
    CHARACTER_MAXIMUM_LENGTH as LongitudMaxima
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ReporteDeAsistenciaGuardado'
ORDER BY ORDINAL_POSITION

-- 3. Contar total de registros
DECLARE @TotalRegistros INT
SELECT @TotalRegistros = COUNT(*) FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
PRINT ''
PRINT '📊 TOTAL DE REGISTROS: ' + CAST(@TotalRegistros AS VARCHAR(10))

-- 4. Mostrar muestra de datos RAW
PRINT ''
PRINT '📋 MUESTRA DE DATOS (primeros 10 registros):'
SELECT TOP 10 * FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
ORDER BY Fecha DESC

-- 5. Verificar registros con estado 'T' (tardanzas)
DECLARE @TotalTardanzas INT
SELECT @TotalTardanzas = COUNT(*) 
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
WHERE Estado = 'T'

PRINT ''
PRINT '⏰ REGISTROS CON ESTADO "T": ' + CAST(@TotalTardanzas AS VARCHAR(10))

-- 6. Mostrar tardanzas específicas
IF @TotalTardanzas > 0
BEGIN
    PRINT ''
    PRINT '📋 MUESTRA DE TARDANZAS:'
    SELECT TOP 10 
        Fecha,
        DNI,
        Nombres,
        ApellidoPaterno,
        ApellidoMaterno,
        HorarioEntrada,
        MarcacionReal,
        Estado,
        DATEDIFF(MINUTE, HorarioEntrada, MarcacionReal) as MinutosTardanza
    FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
    WHERE Estado = 'T'
    AND MarcacionReal > HorarioEntrada
    ORDER BY Fecha DESC
END
ELSE
BEGIN
    PRINT '⚠️  NO HAY REGISTROS CON ESTADO "T"'
END

-- 7. Verificar registros en el rango de fechas que estás usando
DECLARE @FechaInicio DATE = '2025-08-01'
DECLARE @FechaFin DATE = '2025-08-12'

PRINT ''
PRINT '📅 REGISTROS EN RANGO ' + CAST(@FechaInicio AS VARCHAR(10)) + ' - ' + CAST(@FechaFin AS VARCHAR(10)) + ':'

SELECT COUNT(*) as TotalEnRango
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
WHERE Fecha BETWEEN @FechaInicio AND @FechaFin

-- 8. Verificar tardanzas en el rango específico
PRINT ''
PRINT '⏰ TARDANZAS EN RANGO ESPECÍFICO:'
SELECT 
    COUNT(*) as TotalTardanzasEnRango,
    MIN(Fecha) as FechaMasAntigua,
    MAX(Fecha) as FechaMasReciente
FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
WHERE Fecha BETWEEN @FechaInicio AND @FechaFin
AND Estado = 'T'
AND MarcacionReal > HorarioEntrada

-- 9. Probar la consulta exacta que usa el backend
PRINT ''
PRINT '🔍 PROBANDO CONSULTA EXACTA DEL BACKEND:'

SELECT 
    r.Fecha,
    r.DNI,
    r.Nombres + ' ' + r.ApellidoPaterno + ' ' + r.ApellidoMaterno as NombreCompleto,
    r.Nombres,
    r.ApellidoPaterno,
    r.ApellidoMaterno,
    CONVERT(VARCHAR(8), r.HorarioEntrada, 108) as HorarioEntrada,
    CONVERT(VARCHAR(8), r.MarcacionReal, 108) as MarcacionReal,
    r.Estado,
    -- Calcular minutos de tardanza
    CASE 
        WHEN r.MarcacionReal > r.HorarioEntrada 
        THEN DATEDIFF(MINUTE, r.HorarioEntrada, r.MarcacionReal)
        ELSE 0
    END as MinutosTardanza
FROM 
    [Partner].[dbo].[ReporteDeAsistenciaGuardado] r
WHERE 
    r.Fecha BETWEEN @FechaInicio AND @FechaFin
    AND r.Estado = 'T'
    AND r.MarcacionReal > r.HorarioEntrada
    AND DATEDIFF(MINUTE, r.HorarioEntrada, r.MarcacionReal) > 0
ORDER BY 
    r.Fecha DESC, MinutosTardanza DESC, r.ApellidoPaterno, r.ApellidoMaterno, r.Nombres

PRINT ''
PRINT '🎉 DEBUG COMPLETADO'
