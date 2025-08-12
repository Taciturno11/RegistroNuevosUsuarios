-- ========================================
-- SCRIPT: Verificar y crear tabla de Justificaciones
-- ========================================

USE [Partner];
GO

-- Verificar si la tabla existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Justificaciones]') AND type in (N'U'))
BEGIN
    PRINT '📋 Creando tabla Justificaciones...';
    
    CREATE TABLE [dbo].[Justificaciones] (
        [JustificacionID] INT IDENTITY(1,1) PRIMARY KEY,
        [EmpleadoDNI] VARCHAR(20) NOT NULL,
        [Fecha] DATE NOT NULL,
        [TipoJustificacion] VARCHAR(100) NOT NULL,
        [Motivo] VARCHAR(500) NOT NULL,
        [Estado] VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
        [AprobadorDNI] VARCHAR(20) NULL,
        [FechaCreacion] DATETIME DEFAULT GETDATE(),
        [FechaModificacion] DATETIME DEFAULT GETDATE(),
        
        -- Índices para optimizar consultas
        INDEX IX_Justificaciones_EmpleadoDNI (EmpleadoDNI),
        INDEX IX_Justificaciones_Fecha (Fecha),
        INDEX IX_Justificaciones_Estado (Estado),
        
        -- Constraint para estados válidos
        CONSTRAINT CK_Justificaciones_Estado CHECK (Estado IN ('Pendiente', 'Aprobada', 'Desaprobada', 'pendiente', 'aprobada', 'desaprobada'))
    );
    
    PRINT '✅ Tabla Justificaciones creada exitosamente';
END
ELSE
BEGIN
    PRINT '✅ La tabla Justificaciones ya existe';
END

-- Verificar estructura de la tabla
PRINT '📊 Estructura actual de la tabla Justificaciones:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Justificaciones' 
ORDER BY ORDINAL_POSITION;

-- Insertar datos de prueba si la tabla está vacía
IF NOT EXISTS (SELECT 1 FROM [dbo].[Justificaciones])
BEGIN
    PRINT '📝 Insertando datos de prueba...';
    
    -- Obtener algunos DNIs de empleados existentes
    DECLARE @dni1 VARCHAR(20), @dni2 VARCHAR(20), @dni3 VARCHAR(20);
    
    SELECT TOP 3 
        @dni1 = CASE WHEN ROW_NUMBER() OVER (ORDER BY DNI) = 1 THEN DNI END,
        @dni2 = CASE WHEN ROW_NUMBER() OVER (ORDER BY DNI) = 2 THEN DNI END,
        @dni3 = CASE WHEN ROW_NUMBER() OVER (ORDER BY DNI) = 3 THEN DNI END
    FROM [PRI].[Empleados] 
    WHERE DNI IS NOT NULL;
    
    -- Insertar justificaciones de prueba
    IF @dni1 IS NOT NULL
    BEGIN
        INSERT INTO [dbo].[Justificaciones] (EmpleadoDNI, Fecha, TipoJustificacion, Motivo, Estado, AprobadorDNI)
        VALUES 
            (@dni1, '2025-01-10', 'Tardanza Justificada', 'Problemas de transporte público', 'Pendiente', '73766815'),
            (@dni1, '2025-01-08', 'Descanso Compensatorio', 'Trabajo en día feriado anterior', 'Aprobada', '73766815'),
            (@dni2, '2025-01-09', 'Licencia Sin Goce de Haber', 'Asuntos personales urgentes', 'Desaprobada', '73766815'),
            (@dni2, '2025-01-07', 'Tardanza Justificada', 'Cita médica de emergencia', 'Aprobada', '73766815'),
            (@dni3, '2025-01-11', 'Suspensión', 'Incumplimiento de protocolo', 'Pendiente', '73766815'),
            (@dni3, '2025-01-05', 'Tardanza Justificada', 'Problema familiar', 'Aprobada', '73766815');
        
        PRINT '✅ Datos de prueba insertados exitosamente';
    END
    ELSE
    BEGIN
        PRINT '⚠️  No se encontraron empleados para insertar datos de prueba';
    END
END
ELSE
BEGIN
    PRINT '✅ La tabla ya contiene datos';
END

-- Mostrar resumen de datos
SELECT 
    COUNT(*) as TotalJustificaciones,
    COUNT(CASE WHEN Estado IN ('Pendiente', 'pendiente') THEN 1 END) as Pendientes,
    COUNT(CASE WHEN Estado IN ('Aprobada', 'aprobada') THEN 1 END) as Aprobadas,
    COUNT(CASE WHEN Estado IN ('Desaprobada', 'desaprobada') THEN 1 END) as Desaprobadas
FROM [dbo].[Justificaciones];

PRINT '🎉 Script completado exitosamente';
