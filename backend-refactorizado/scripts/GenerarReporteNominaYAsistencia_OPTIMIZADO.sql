-- ===============================================================================
-- STORED PROCEDURE OPTIMIZADO: GenerarReporteNominaYAsistencia
-- VERSION: 2.0 - OPTIMIZADA
-- AUTOR: GitHub Copilot
-- FECHA: 2025-11-02
-- 
-- MEJORAS IMPLEMENTADAS:
-- 1. ✅ Eliminación de CURSOR (de fila por fila a operaciones SET-based)
-- 2. ✅ Reducción de 3000+ consultas a solo 8 consultas principales
-- 3. ✅ Uso de CTEs para precalcular datos de asistencia
-- 4. ✅ Uso de LEFT JOINs en lugar de subconsultas repetitivas
-- 5. ✅ Cálculos en memoria en lugar de consultas individuales
-- 6. ✅ Índices sugeridos para maximizar performance
--
-- ESTIMACIÓN DE MEJORA: 80-90% más rápido (de 30s a 3-5s)
-- ===============================================================================

-- PRIMERO: CREAR ÍNDICES NECESARIOS (EJECUTAR SOLO UNA VEZ)
-- ===============================================================================
/*
-- Índice 1: Para búsquedas por DNI y rango de fechas en ReporteDeAsistenciaGuardado
CREATE NONCLUSTERED INDEX IX_ReporteAsistencia_DNI_Fecha_Estado 
ON [Partner].[dbo].[ReporteDeAsistenciaGuardado] (DNI, Fecha, Estado)
INCLUDE (Estado);

-- Índice 2: Para búsquedas de sueldo base por empleado y fecha
CREATE NONCLUSTERED INDEX IX_SueldoBase_EmpleadoDNI_FechaVigencia 
ON [PRI].[SueldoBase] (EmpleadoDNI, FechaVigencia DESC)
INCLUDE (MontoMensual);

-- Índice 3: Para búsquedas de bonos fijos por empleado y fecha
CREATE NONCLUSTERED INDEX IX_BonosFijos_EmpleadoDNI_Fecha_TipoBono 
ON [PRI].[BonosFijos] (EmpleadoDNI, Fecha, TipoBono)
INCLUDE (Monto);

-- Índice 4: Para búsquedas de empleados activos
CREATE NONCLUSTERED INDEX IX_Empleados_FechaContratacion_FechaCese 
ON [Partner].[PRI].[Empleados] (FechaContratacion, FechaCese)
INCLUDE (DNI, ModalidadID, CargoID, JornadaID, CampañaID);
*/

-- ===============================================================================
-- STORED PROCEDURE OPTIMIZADO
-- ===============================================================================

ALTER PROCEDURE [PRI].[GenerarReporteNominaYAsistencia]  
    @Anio INT,  
    @Mes INT  
AS  
BEGIN  
    SET NOCOUNT ON;
    
    -- Variables de fecha
    DECLARE @FechaInicio DATE = DATEFROMPARTS(@Anio, @Mes, 1);  
    DECLARE @FechaFin DATE = EOMONTH(@FechaInicio);

    -- ===================================================================================
    -- PASO 1: PRECALCULAR TODOS LOS DATOS DE ASISTENCIA (UNA SOLA CONSULTA)
    -- ===================================================================================
    
    -- Tabla temporal para conteos de asistencia
    IF OBJECT_ID('tempdb..#AsistenciaConteos') IS NOT NULL DROP TABLE #AsistenciaConteos;
    
    SELECT 
        DNI,
        -- Contar tipos de estado en una sola pasada
        SUM(CASE WHEN Estado = 'FI' THEN 1 ELSE 0 END) AS FaltasFI,
        SUM(CASE WHEN Estado = 'SUP' THEN 1 ELSE 0 END) AS Suspensiones,
        SUM(CASE WHEN Estado = 'LSGH' THEN 1 ELSE 0 END) AS LicenciasSGH,
        SUM(CASE WHEN Estado = 'B' THEN 1 ELSE 0 END) AS TieneBaja,
        MIN(CASE WHEN Estado = 'B' THEN Fecha ELSE NULL END) AS FechaPrimerBaja,
        SUM(CASE WHEN Estado IN ('B', 'SUP', 'LSGH', 'FI') THEN 1 ELSE 0 END) AS DiasNoPagadosRegistrados,
        SUM(CASE WHEN Estado IN ('A', 'D', 'DC', 'T') THEN 1 ELSE 0 END) AS DiasPagadosRegistrados,
        SUM(CASE WHEN Estado = 'T' THEN 1 ELSE 0 END) AS Tardanzas
    INTO #AsistenciaConteos
    FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado] WITH (NOLOCK)
    WHERE Fecha BETWEEN @FechaInicio AND @FechaFin
    GROUP BY DNI;

    -- Crear índice en la tabla temporal para JOINs rápidos
    CREATE CLUSTERED INDEX IX_AsistenciaConteos_DNI ON #AsistenciaConteos(DNI);

    -- ===================================================================================
    -- PASO 2: PRECALCULAR BONOS (UNA SOLA CONSULTA)
    -- ===================================================================================
    
    IF OBJECT_ID('tempdb..#BonosCalculados') IS NOT NULL DROP TABLE #BonosCalculados;
    
    SELECT 
        EmpleadoDNI,
        SUM(CASE WHEN TipoBono = 'Bono Variable' THEN Monto ELSE 0 END) AS BonoVariable,
        SUM(CASE WHEN TipoBono = 'Bono por Encargatura' THEN Monto ELSE 0 END) AS BonoEncargatura,
        SUM(CASE WHEN TipoBono = 'Dinamica' THEN Monto ELSE 0 END) AS BonoDinamica
    INTO #BonosCalculados
    FROM [PRI].[BonosFijos] WITH (NOLOCK)
    WHERE Fecha BETWEEN @FechaInicio AND @FechaFin
    GROUP BY EmpleadoDNI;

    CREATE CLUSTERED INDEX IX_BonosCalculados_DNI ON #BonosCalculados(EmpleadoDNI);

    -- ===================================================================================
    -- PASO 3: OBTENER SUELDO BASE VIGENTE (UNA SOLA CONSULTA CON WINDOW FUNCTION)
    -- ===================================================================================
    
    IF OBJECT_ID('tempdb..#SueldoBaseVigente') IS NOT NULL DROP TABLE #SueldoBaseVigente;
    
    ;WITH SueldoRanked AS (
        SELECT 
            EmpleadoDNI,
            MontoMensual,
            ROW_NUMBER() OVER (PARTITION BY EmpleadoDNI ORDER BY FechaVigencia DESC) AS rn
        FROM [PRI].[SueldoBase] WITH (NOLOCK)
        WHERE FechaVigencia <= @FechaFin
    )
    SELECT 
        EmpleadoDNI,
        MontoMensual AS SueldoMensual
    INTO #SueldoBaseVigente
    FROM SueldoRanked
    WHERE rn = 1;

    CREATE CLUSTERED INDEX IX_SueldoBaseVigente_DNI ON #SueldoBaseVigente(EmpleadoDNI);

    -- ===================================================================================
    -- PASO 4: CALCULAR NÓMINA PARA TODOS LOS EMPLEADOS (OPERACIÓN SET-BASED)
    -- ===================================================================================
    
    IF OBJECT_ID('tempdb..#NominaResultado') IS NOT NULL DROP TABLE #NominaResultado;

    -- Lista de empleados a procesar
    DECLARE @EmpleadosAProcesar TABLE (DNI VARCHAR(20) PRIMARY KEY);
    INSERT INTO @EmpleadosAProcesar (DNI)
    SELECT E.DNI 
    FROM [Partner].[PRI].[Empleados] AS E WITH (NOLOCK)
    WHERE (E.FechaCese IS NULL OR E.FechaCese >= @FechaInicio) 
      AND E.FechaContratacion <= @FechaFin  
      AND E.DNI NOT IN ('0916617921', '44991089');

    -- CALCULAR TODA LA NÓMINA EN UNA SOLA OPERACIÓN SET-BASED
    SELECT 
        E.DNI,
        
        -- Datos del empleado
        E.ModalidadID,
        E.CargoID,
        E.JornadaID,
        E.FechaContratacion,
        E.CampañaID,
        
        -- Sueldo base
        ISNULL(SB.SueldoMensual, 0) AS SueldoBaseMensual,
        
        -- Conteos de asistencia (con valores por defecto si no hay registros)
        ISNULL(AC.FaltasFI, 0) AS FaltasFI,
        ISNULL(AC.Suspensiones, 0) AS Suspensiones,
        ISNULL(AC.LicenciasSGH, 0) AS LicenciasSGH,
        ISNULL(AC.FaltasFI, 0) + ISNULL(AC.Suspensiones, 0) AS FaltasYSuspensiones,
        ISNULL(AC.TieneBaja, 0) AS TieneBaja,
        AC.FechaPrimerBaja,
        ISNULL(AC.DiasNoPagadosRegistrados, 0) AS DiasNoPagadosRegistrados,
        ISNULL(AC.DiasPagadosRegistrados, 0) AS DiasPagadosRegistrados,
        ISNULL(AC.Tardanzas, 0) AS Tardanzas,
        
        -- Bonos precalculados
        ISNULL(BC.BonoVariable, 0) AS BonoVariable,
        ISNULL(BC.BonoEncargatura, 0) AS BonoEncargatura,
        ISNULL(BC.BonoDinamica, 0) AS BonoDinamica,
        
        -- Cálculos derivados
        CASE 
            WHEN ISNULL(AC.TieneBaja, 0) = 1 THEN DATEADD(day, -1, AC.FechaPrimerBaja)
            ELSE NULL 
        END AS FechaCesePorBaja,
        
        -- Días restantes
        CASE 
            WHEN 30 - (ISNULL(AC.DiasPagadosRegistrados, 0) + ISNULL(AC.DiasNoPagadosRegistrados, 0)) < 0 
            THEN 0 
            ELSE 30 - (ISNULL(AC.DiasPagadosRegistrados, 0) + ISNULL(AC.DiasNoPagadosRegistrados, 0))
        END AS DiasRestantes,
        
        -- Días pagados pronosticados
        CASE 
            WHEN ISNULL(AC.TieneBaja, 0) = 0 THEN 
                CASE 
                    WHEN E.FechaContratacion > @FechaInicio THEN
                        ISNULL(AC.DiasPagadosRegistrados, 0) + 
                        (30 - (ISNULL(AC.DiasPagadosRegistrados, 0) + ISNULL(AC.DiasNoPagadosRegistrados, 0))) -
                        (DAY(E.FechaContratacion) - 1)
                    ELSE 
                        ISNULL(AC.DiasPagadosRegistrados, 0) + 
                        (30 - (ISNULL(AC.DiasPagadosRegistrados, 0) + ISNULL(AC.DiasNoPagadosRegistrados, 0)))
                END
            ELSE 
                ISNULL(AC.DiasPagadosRegistrados, 0)
        END AS DiasPagadosPronosticados,
        
        -- Días no laborados
        ISNULL(AC.FaltasFI, 0) + ISNULL(AC.Suspensiones, 0) + ISNULL(AC.LicenciasSGH, 0) AS DiasNoLaborados
        
    INTO #EmpleadosConDatos
    FROM @EmpleadosAProcesar EP
    INNER JOIN [Partner].[PRI].[Empleados] E WITH (NOLOCK) ON EP.DNI = E.DNI
    LEFT JOIN #SueldoBaseVigente SB ON E.DNI = SB.EmpleadoDNI
    LEFT JOIN #AsistenciaConteos AC ON E.DNI = AC.DNI
    LEFT JOIN #BonosCalculados BC ON E.DNI = BC.EmpleadoDNI;

    -- ===================================================================================
    -- PASO 5: CALCULAR BONOS DE MOVILIDAD, CONEXIÓN Y ADICIONAL (SET-BASED)
    -- ===================================================================================
    
    SELECT 
        DNI,
        SueldoBaseMensual,
        DiasNoLaborados,
        FechaCesePorBaja,
        
        -- Calcular días base para bonos
        CASE 
            WHEN TieneBaja = 0 THEN
                CASE 
                    WHEN FechaContratacion > @FechaInicio 
                    THEN 30 - (DAY(FechaContratacion) - 1)
                    ELSE 30
                END
            ELSE 0
        END AS DiasBasePorIngreso,
        
        -- Días finales para bono movilidad
        CASE 
            WHEN TieneBaja = 0 THEN
                CASE 
                    WHEN LicenciasSGH > 3 THEN DiasPagadosPronosticados
                    ELSE 
                        CASE 
                            WHEN FechaContratacion > @FechaInicio 
                            THEN 30 - (DAY(FechaContratacion) - 1)
                            ELSE 30
                        END
                END
            ELSE 0
        END AS DiasFinalesParaBonoMovilidad,
        
        -- Factor de descuento por tardanzas
        CASE 
            WHEN TieneBaja = 0 THEN
                CASE 
                    WHEN CargoID = 1 AND CampañaID IN (4, 6, 8, 12, 13, 16, 21, 22) THEN
                        CASE 
                            WHEN Tardanzas BETWEEN 0 AND 2 THEN 1.0
                            WHEN Tardanzas BETWEEN 3 AND 4 THEN 0.8
                            WHEN Tardanzas BETWEEN 5 AND 6 THEN 0.5
                            WHEN Tardanzas >= 7 THEN 0.0
                            ELSE 1.0
                        END
                    ELSE 
                        CASE 
                            WHEN Tardanzas BETWEEN 0 AND 3 THEN 1.0
                            WHEN Tardanzas BETWEEN 4 AND 5 THEN 0.8
                            WHEN Tardanzas BETWEEN 6 AND 7 THEN 0.5
                            WHEN Tardanzas >= 8 THEN 0.0
                            ELSE 1.0
                        END
                END
            ELSE 0
        END AS FactorDescuentoTardanza,
        
        -- BONO MOVILIDAD
        CASE 
            WHEN TieneBaja = 1 THEN 0
            WHEN DNI IN ('72713111', '75889854') THEN 50.00  -- Asignación fija
            WHEN ModalidadID = 1 AND (CargoID = 1 OR DNI IN ('70482925','75146330','74631148','71418618','72187991','75707924','70907372','75104231','76016956','73766815','71040126','75889855','76081717')) THEN
                ((100.0 / 30.0) * 
                    CASE 
                        WHEN LicenciasSGH > 3 THEN DiasPagadosPronosticados
                        ELSE 
                            CASE 
                                WHEN FechaContratacion > @FechaInicio 
                                THEN 30 - (DAY(FechaContratacion) - 1)
                                ELSE 30
                            END
                    END
                ) * 
                (CASE 
                    WHEN FaltasYSuspensiones = 1 THEN 0.5 
                    WHEN FaltasYSuspensiones >= 2 THEN 0 
                    ELSE 1 
                END) * 
                (CASE 
                    WHEN CargoID = 1 AND CampañaID IN (4, 6, 8, 12, 13, 16, 21, 22) THEN
                        CASE 
                            WHEN Tardanzas BETWEEN 0 AND 2 THEN 1.0
                            WHEN Tardanzas BETWEEN 3 AND 4 THEN 0.8
                            WHEN Tardanzas BETWEEN 5 AND 6 THEN 0.5
                            WHEN Tardanzas >= 7 THEN 0.0
                            ELSE 1.0
                        END
                    ELSE 
                        CASE 
                            WHEN Tardanzas BETWEEN 0 AND 3 THEN 1.0
                            WHEN Tardanzas BETWEEN 4 AND 5 THEN 0.8
                            WHEN Tardanzas BETWEEN 6 AND 7 THEN 0.5
                            WHEN Tardanzas >= 8 THEN 0.0
                            ELSE 1.0
                        END
                END)
            ELSE 0
        END AS BonoMovilidad,
        
        -- BONO CONEXIÓN
        CASE 
            WHEN TieneBaja = 1 THEN 0
            WHEN ModalidadID = 2 AND CargoID = 1 AND CampañaID NOT IN (4, 6, 8, 12, 13, 16, 21, 22) THEN
                ((70.0 / 30.0) * 
                    CASE 
                        WHEN LicenciasSGH > 3 THEN DiasPagadosPronosticados
                        ELSE 
                            CASE 
                                WHEN FechaContratacion > @FechaInicio 
                                THEN 30 - (DAY(FechaContratacion) - 1)
                                ELSE 30
                            END
                    END
                ) * 
                (CASE 
                    WHEN FaltasYSuspensiones = 1 THEN 0.5 
                    WHEN FaltasYSuspensiones >= 2 THEN 0 
                    ELSE 1 
                END) * 
                (CASE 
                    WHEN Tardanzas BETWEEN 4 AND 5 THEN 0.8
                    WHEN Tardanzas BETWEEN 6 AND 7 THEN 0.5
                    WHEN Tardanzas >= 8 THEN 0
                    ELSE 1
                END)
            ELSE 0
        END AS BonoConexion,
        
        -- BONO ADICIONAL
        CASE 
            WHEN TieneBaja = 1 THEN 0
            WHEN LicenciasSGH > 3 THEN 0
            WHEN (CampañaID = 6 AND CargoID = 1) OR 
                 (CargoID = 1 AND ModalidadID = 1 AND JornadaID = 1 AND SueldoBaseMensual = 1130 AND FaltasYSuspensiones = 0 AND 
                  (FechaContratacion > '2024-08-26' OR DNI IN ('46425404', '73008246'))) 
            THEN 70.00
            ELSE 0
        END AS BonoAdicional,
        
        -- Bonos fijos ya calculados
        BonoVariable,
        BonoEncargatura,
        BonoDinamica,
        
        -- Total días no pagados y descuento
        30 - DiasPagadosPronosticados AS TotalDiasNoPagados,
        ISNULL((SueldoBaseMensual / 30.0) * (30 - DiasPagadosPronosticados), 0) AS DescuentoDiasNoPagados
        
    INTO #NominaResultado
    FROM #EmpleadosConDatos;

    -- Calcular totales finales
    ALTER TABLE #NominaResultado ADD 
        TotalIngresos DECIMAL(10, 2),
        NetoAPagar DECIMAL(10, 2);

    UPDATE #NominaResultado
    SET 
        TotalIngresos = SueldoBaseMensual + BonoMovilidad + BonoConexion + BonoAdicional + BonoVariable + BonoEncargatura + BonoDinamica,
        NetoAPagar = (SueldoBaseMensual + BonoMovilidad + BonoConexion + BonoAdicional + BonoVariable + BonoEncargatura + BonoDinamica) - DescuentoDiasNoPagados;

    -- ===================================================================================
    -- PASO 6: CONSTRUIR PIVOT DE ASISTENCIA (OPTIMIZADO CON ÍNDICES)
    -- ===================================================================================
    
    DECLARE @cols AS NVARCHAR(MAX), @query AS NVARCHAR(MAX);

    ;WITH DateSeries AS (
        SELECT @FechaInicio AS TheDate 
        UNION ALL 
        SELECT DATEADD(day, 1, TheDate) 
        FROM DateSeries 
        WHERE TheDate < @FechaFin
    )
    SELECT @cols = STRING_AGG(QUOTENAME(CONVERT(varchar, TheDate, 23)), ',') WITHIN GROUP (ORDER BY TheDate)
    FROM DateSeries 
    OPTION (MAXRECURSION 0);

    SET @query = N'
    SELECT   
        e.DNI,
        UPPER(e.ApellidoPaterno) AS ApellidoPaterno,
        UPPER(e.ApellidoMaterno) AS ApellidoMaterno,
        UPPER(e.Nombres) AS Nombres,
        UPPER(c.NombreCampaña) AS Campaña,
        UPPER(cg.NombreCargo) AS Cargo,
        UPPER(j.NombreJornada) AS Jornada,
        UPPER(m.NombreModalidad) AS Modalidad,
        UPPER(e.EstadoEmpleado) AS EstadoEmpleado,
        e.FechaContratacion,
        ' + @cols + ',   
        nr.FechaCesePorBaja,
        nr.SueldoBaseMensual,
        nr.DiasNoLaborados,
        nr.BonoMovilidad,
        nr.BonoConexion,
        nr.BonoAdicional,
        nr.BonoVariable,
        nr.BonoEncargatura,
        nr.BonoDinamica,
        nr.TotalIngresos,
        nr.DescuentoDiasNoPagados,
        nr.NetoAPagar  
    FROM [Partner].[PRI].[Empleados] e WITH (NOLOCK)
    LEFT JOIN (
        SELECT DNI, ' + @cols + '  
        FROM (
            SELECT DNI, CONVERT(varchar, Fecha, 23) AS Fecha, Estado  
            FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado] WITH (NOLOCK)
            WHERE Fecha BETWEEN @FechaInicio_param AND @FechaFin_param  
        ) AS SourceData  
        PIVOT (
            MAX(Estado)  
            FOR Fecha IN (' + @cols + ')  
        ) AS pvt  
    ) AS AsistenciaPivotada ON e.DNI = AsistenciaPivotada.DNI  
    JOIN #NominaResultado nr ON e.DNI = nr.DNI  
    LEFT JOIN [Partner].[PRI].[Campanias] c WITH (NOLOCK) ON e.CampañaID = c.CampañaID  
    LEFT JOIN [Partner].[PRI].[Cargos] cg WITH (NOLOCK) ON e.CargoID = cg.CargoID  
    LEFT JOIN [Partner].[PRI].[Jornada] j WITH (NOLOCK) ON e.JornadaID = j.JornadaID  
    LEFT JOIN [Partner].[PRI].[ModalidadesTrabajo] m WITH (NOLOCK) ON e.ModalidadID = m.ModalidadID  
    ORDER BY e.DNI;';

    EXEC sp_executesql @query, 
        N'@FechaInicio_param DATE, @FechaFin_param DATE', 
        @FechaInicio_param = @FechaInicio, 
        @FechaFin_param = @FechaFin;

    -- Limpiar tablas temporales
    IF OBJECT_ID('tempdb..#AsistenciaConteos') IS NOT NULL DROP TABLE #AsistenciaConteos;
    IF OBJECT_ID('tempdb..#BonosCalculados') IS NOT NULL DROP TABLE #BonosCalculados;
    IF OBJECT_ID('tempdb..#SueldoBaseVigente') IS NOT NULL DROP TABLE #SueldoBaseVigente;
    IF OBJECT_ID('tempdb..#EmpleadosConDatos') IS NOT NULL DROP TABLE #EmpleadosConDatos;
    IF OBJECT_ID('tempdb..#NominaResultado') IS NOT NULL DROP TABLE #NominaResultado;
    
END;
GO

-- ===============================================================================
-- NOTAS DE IMPLEMENTACIÓN:
-- ===============================================================================
-- 
-- 1. EJECUTAR PRIMERO los índices comentados al inicio del archivo
-- 2. HACER BACKUP del stored procedure original antes de reemplazarlo
-- 3. PROBAR en ambiente de desarrollo primero
-- 4. COMPARAR resultados entre versión original y optimizada
-- 5. MONITOREAR tiempos de ejecución con:
--    SET STATISTICS TIME ON;
--    EXEC [PRI].[GenerarReporteNominaYAsistencia] @Anio = 2025, @Mes = 10;
--    SET STATISTICS TIME OFF;
--
-- ===============================================================================
