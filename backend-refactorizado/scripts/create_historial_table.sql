-- Script para crear la tabla de historial de cambios de roles
-- Ejecutar en SQL Server Management Studio o en la base de datos

USE [NombreDeTuBaseDeDatos] -- Cambiar por el nombre real de tu base de datos
GO

-- Crear la tabla de historial si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[PRI].[HistorialCambiosRoles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [PRI].[HistorialCambiosRoles](
        [ID] [int] IDENTITY(1,1) NOT NULL,
        [DNIEmpleado] [varchar](8) NOT NULL,
        [RolAnterior] [varchar](100) NULL,
        [RolNuevo] [varchar](100) NOT NULL,
        [FechaCambio] [datetime] NOT NULL,
        [DNIResponsable] [varchar](8) NOT NULL,
        [Comentario] [varchar](500) NULL,
        CONSTRAINT [PK_HistorialCambiosRoles] PRIMARY KEY CLUSTERED ([ID] ASC)
    )
    
    -- Agregar índices para mejor rendimiento
    CREATE NONCLUSTERED INDEX [IX_HistorialCambiosRoles_DNIEmpleado] ON [PRI].[HistorialCambiosRoles] ([DNIEmpleado] ASC)
    CREATE NONCLUSTERED INDEX [IX_HistorialCambiosRoles_FechaCambio] ON [PRI].[HistorialCambiosRoles] ([FechaCambio] ASC)
    
    PRINT 'Tabla PRI.HistorialCambiosRoles creada exitosamente'
END
ELSE
BEGIN
    PRINT 'La tabla PRI.HistorialCambiosRoles ya existe'
END
GO

-- Agregar comentarios a la tabla
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Tabla para registrar el historial de cambios de roles de empleados', 
    @level0type = N'SCHEMA', @level0name = N'PRI', 
    @level1type = N'TABLE', @level1name = N'HistorialCambiosRoles'
GO

-- Agregar comentarios a las columnas
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'DNI del empleado al que se le cambió el rol', 
    @level0type = N'SCHEMA', @level0name = N'PRI', 
    @level1type = N'TABLE', @level1name = N'HistorialCambiosRoles', 
    @level2type = N'COLUMN', @level2name = N'DNIEmpleado'
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Rol anterior del empleado', 
    @level0type = N'SCHEMA', @level0name = N'PRI', 
    @level1type = N'TABLE', @level1name = N'HistorialCambiosRoles', 
    @level2type = N'COLUMN', @level2name = N'RolAnterior'
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Nuevo rol asignado al empleado', 
    @level0type = N'SCHEMA', @level0name = N'PRI', 
    @level1type = N'TABLE', @level1name = N'HistorialCambiosRoles', 
    @level2type = N'COLUMN', @level2name = N'RolNuevo'
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Fecha y hora del cambio de rol', 
    @level0type = N'SCHEMA', @level0name = N'PRI', 
    @level1type = N'TABLE', @level1name = N'HistorialCambiosRoles', 
    @level2type = N'COLUMN', @level2name = N'FechaCambio'
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'DNI del usuario responsable del cambio (solo el creador)', 
    @level0type = N'SCHEMA', @level0name = N'PRI', 
    @level1type = N'TABLE', @level1name = N'HistorialCambiosRoles', 
    @level2type = N'COLUMN', @level2name = N'DNIResponsable'
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Comentario adicional sobre el cambio de rol', 
    @level0type = N'SCHEMA', @level0name = N'PRI', 
    @level1type = N'TABLE', @level1name = N'HistorialCambiosRoles', 
    @level2type = N'COLUMN', @level2name = N'Comentario'
GO

PRINT 'Script ejecutado exitosamente. La tabla de historial está lista para usar.'
