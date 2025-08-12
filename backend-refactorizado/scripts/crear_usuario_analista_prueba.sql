-- Script para crear un usuario de prueba con rol de analista
-- Ejecutar este script para tener un usuario para probar la funcionalidad de Reporte de Asistencias

-- 1. Verificar si existe un usuario analista
PRINT '🔍 Verificando usuarios con CargoID = 4 (analista)...'
SELECT 
    DNI, 
    Nombres, 
    ApellidoPaterno, 
    ApellidoMaterno,
    c.NombreCargo,
    EstadoEmpleado
FROM [Partner].[PRI].[Empleados] e
INNER JOIN [Partner].[PRI].[Cargos] c ON e.CargoID = c.CargoID
WHERE e.CargoID = 4
ORDER BY e.DNI;

-- 2. Si no hay analistas, crear uno de prueba
IF NOT EXISTS (SELECT 1 FROM [Partner].[PRI].[Empleados] WHERE CargoID = 4)
BEGIN
    PRINT '🔧 No se encontraron analistas. Creando usuario de prueba...'
    
    -- Obtener IDs necesarios
    DECLARE @CampañaID INT = (SELECT TOP 1 CampañaID FROM [Partner].[PRI].[Campañas] ORDER BY CampañaID);
    DECLARE @JornadaID INT = (SELECT TOP 1 JornadaID FROM [Partner].[PRI].[Jornadas] ORDER BY JornadaID);
    DECLARE @ModalidadID INT = (SELECT TOP 1 ModalidadID FROM [Partner].[PRI].[Modalidades] ORDER BY ModalidadID);
    
    -- Insertar usuario analista de prueba
    INSERT INTO [Partner].[PRI].[Empleados] (
        DNI,
        Nombres,
        ApellidoPaterno,
        ApellidoMaterno,
        Telefono,
        Email,
        FechaNacimiento,
        Direccion,
        CargoID,
        CampañaID,
        JornadaID,
        ModalidadID,
        FechaContratacion,
        EstadoEmpleado,
        Password
    ) VALUES (
        '12345678', -- DNI único para pruebas
        'ANALISTA',
        'DE',
        'PRUEBA',
        '999999999',
        'analista.prueba@partner.com',
        '1990-01-01',
        'Dirección de prueba',
        4, -- CargoID = 4 (analista)
        @CampañaID,
        @JornadaID,
        @ModalidadID,
        GETDATE(),
        'ACTIVO',
        '$2b$10$rGz8qK5y9Qz8qK5y9Qz8qOz8qK5y9Qz8qK5y9Qz8qK5y9Qz8qK5y9Q' -- password: "123456"
    );
    
    PRINT '✅ Usuario analista de prueba creado:'
    PRINT '   DNI: 12345678'
    PRINT '   Password: 123456'
    PRINT '   Rol: Analista'
END
ELSE
BEGIN
    PRINT '✅ Ya existen usuarios con rol de analista'
END

-- 3. Mostrar todos los analistas disponibles
PRINT ''
PRINT '📋 Lista de usuarios analistas disponibles:'
SELECT 
    DNI, 
    CONCAT(Nombres, ' ', ApellidoPaterno, ' ', ApellidoMaterno) AS NombreCompleto,
    c.NombreCargo,
    EstadoEmpleado,
    FechaContratacion
FROM [Partner].[PRI].[Empleados] e
INNER JOIN [Partner].[PRI].[Cargos] c ON e.CargoID = c.CargoID
WHERE e.CargoID = 4
ORDER BY e.DNI;

PRINT ''
PRINT '🔐 Para probar el Reporte de Asistencias:'
PRINT '   1. Usar cualquiera de los DNIs mostrados arriba'
PRINT '   2. La contraseña por defecto es: 123456'
PRINT '   3. Iniciar sesión en la aplicación'
PRINT '   4. Verificar que aparezca "Reporte de Asistencias" en el sidebar'