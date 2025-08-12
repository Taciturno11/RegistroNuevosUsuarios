# 📊 Reporte de Asistencias

## 🎯 Descripción

Nueva funcionalidad que permite a los **analistas** visualizar reportes detallados de asistencia de empleados en formato de tabla dinámica, mostrando el estado de asistencia por día de cada empleado en un mes específico.

## 🔐 Permisos de Acceso

- **Solo usuarios con rol `analista`** (CargoID = 4) pueden acceder a esta funcionalidad
- La opción aparece en el sidebar únicamente para usuarios autorizados
- Protegida con middleware de autenticación y autorización

## 🗄️ Estructura de Base de Datos

### Tabla Principal: `[Partner].[dbo].[ReporteDeAsistenciaGuardado]`

```sql
CREATE TABLE [Partner].[dbo].[ReporteDeAsistenciaGuardado] (
    DNI VARCHAR(20) NOT NULL,
    Fecha DATE NOT NULL,
    Estado VARCHAR(5) NOT NULL,
    CONSTRAINT PK_ReporteAsistencia PRIMARY KEY (DNI, Fecha)
);
```

### Estados de Asistencia

| Estado | Descripción | Color |
|--------|-------------|-------|
| `P` | Presente | Verde |
| `F` | Falta | Rojo |
| `T` | Tardanza | Naranja |
| `J` | Justificado | Azul |
| `V` | Vacaciones | Gris |

## 🚀 Funcionalidades

### 1. **Interfaz de Usuario**
- 🎨 Diseño moderno con Material-UI
- 📱 Responsive para móviles y tablets
- 🔍 Filtros por mes y año
- 📊 Estadísticas visuales del reporte

### 2. **Tabla Dinámica**
- 📋 Columnas fijas para DNI y nombre del empleado
- 📅 Columnas dinámicas para cada día del mes
- 🏷️ Estados codificados por colores
- 📏 Scroll horizontal y vertical
- 📌 Columnas principales fijas (sticky)

### 3. **Filtros y Búsqueda**
- 📆 Selector de mes (1-12)
- 🗓️ Selector de año (dinámico basado en datos disponibles)
- 🔄 Generación automática del reporte
- ⚡ Carga asíncrona de datos

### 4. **Estadísticas**
- 👥 Total de empleados en el reporte
- 📅 Días del mes seleccionado
- 📊 Información del período reportado
- 🏷️ Leyenda de estados de asistencia

## 🛠️ Implementación Técnica

### Backend (Node.js + Express)

#### Endpoints

```javascript
// Obtener reporte de asistencias
GET /api/reportes/asistencias?mes=8&anio=2025

// Obtener años disponibles
GET /api/reportes/anios-disponibles
```

#### Consulta SQL Dinámica

La consulta se genera dinámicamente basada en el mes y año seleccionados:

```sql
SELECT
    e.DNI,
    UPPER(e.ApellidoPaterno) AS ApellidoPaterno,
    UPPER(e.ApellidoMaterno) AS ApellidoMaterno,
    UPPER(e.Nombres) AS Nombres,
    UPPER(c.NombreCampaña) AS Campaña,
    UPPER(cg.NombreCargo) AS Cargo,
    UPPER(e.EstadoEmpleado) AS EstadoEmpleado,
    e.FechaContratacion,
    -- Columnas dinámicas para cada día del mes
    AsistenciaPivotada.[2025-08-01], AsistenciaPivotada.[2025-08-02], ...
FROM [Partner].[PRI].[Empleados] e
LEFT JOIN (
    -- Subconsulta PIVOT para transformar filas en columnas
    SELECT DNI, [2025-08-01], [2025-08-02], ...
    FROM (
        SELECT DNI, CONVERT(varchar, Fecha, 23) AS Fecha, Estado
        FROM [Partner].[dbo].[ReporteDeAsistenciaGuardado]
        WHERE Fecha BETWEEN @fechaInicio AND @fechaFin
    ) AS SourceData
    PIVOT (
        MAX(Estado)
        FOR Fecha IN ([2025-08-01], [2025-08-02], ...)
    ) AS pvt
) AS AsistenciaPivotada ON e.DNI = AsistenciaPivotada.DNI
-- JOINs con catálogos...
WHERE (e.FechaCese IS NULL OR e.FechaCese >= @fechaInicio) 
  AND e.FechaContratacion <= @fechaFin
ORDER BY e.ApellidoPaterno, e.ApellidoMaterno, e.Nombres
```

### Frontend (React + Material-UI)

#### Componente Principal: `ReporteAsistencias.js`

- **Estados**: Loading, error, datos del reporte
- **Filtros**: Mes, año, años disponibles
- **Tabla**: Material-UI Table con sticky headers
- **Responsive**: Grid system para diferentes tamaños de pantalla

#### Navegación

```javascript
// Sidebar.js - Solo visible para analistas
{isAnalista && (
  <ListItemButton onClick={() => navigate('/reporte-asistencias')}>
    <TableChartIcon />
    Reporte de Asistencias
  </ListItemButton>
)}

// App.js - Ruta protegida
<Route path="/reporte-asistencias" element={
  <ProtectedRoute requireRole={['analista']}>
    <ReporteAsistencias />
  </ProtectedRoute>
} />
```

## 📋 Configuración e Instalación

### 1. Verificar Base de Datos

```bash
# Ejecutar script de verificación
sqlcmd -S localhost -d Partner -i "backend-refactorizado/scripts/verificar_reporte_asistencia.sql"
```

### 2. Crear Datos de Prueba (si es necesario)

```bash
# Ejecutar script de datos de prueba
sqlcmd -S localhost -d Partner -i "backend-refactorizado/scripts/crear_datos_prueba_asistencia.sql"
```

### 3. Asignar Rol de Analista

```sql
-- Asignar CargoID = 4 (analista) a un usuario
UPDATE [Partner].[PRI].[Empleados] 
SET CargoID = 4 
WHERE DNI = 'TU_DNI_AQUI';
```

### 4. Iniciar Aplicación

```bash
# Backend
cd backend-refactorizado
npm run dev

# Frontend
cd frontend-react
npm start
```

## 🎯 Uso de la Aplicación

### Para Analistas

1. **Iniciar Sesión** con un usuario que tenga CargoID = 4
2. **Navegar** al sidebar y hacer clic en "Reporte de Asistencias"
3. **Seleccionar** el mes y año deseados
4. **Hacer clic** en "Generar Reporte"
5. **Visualizar** la tabla con los datos de asistencia
6. **Usar** la leyenda de colores para interpretar los estados

### Características de la Tabla

- **Columnas Fijas**: DNI y nombre del empleado permanecen visibles al hacer scroll
- **Días del Mes**: Una columna por cada día, mostrando solo el número del día
- **Estados Codificados**: Chips de colores según el estado de asistencia
- **Información Completa**: Campaña, cargo y estado del empleado
- **Scroll Inteligente**: Navegación fluida en tablas grandes

## 🔧 Personalización

### Agregar Nuevos Estados

```javascript
// En ReporteAsistencias.js
const getEstadoColor = (estado) => {
  switch (estado) {
    case 'P': return 'success';
    case 'F': return 'error';
    case 'T': return 'warning';
    case 'J': return 'info';
    case 'V': return 'default';
    case 'N': return 'secondary'; // Nuevo estado
    default: return 'default';
  }
};
```

### Modificar Permisos

```javascript
// En auth.middleware.js - Agregar más roles
router.get('/asistencias', requireRole(['analista', 'jefe']), reportesController.getReporteAsistencias);
```

## 📊 Datos de Ejemplo

El script de datos de prueba genera:
- **10 empleados** con datos de asistencia
- **Enero y Agosto 2025** con datos completos
- **Distribución realista**: 85% presente, 5% tardanza, 5% justificado, 3% vacaciones, 2% falta
- **Lógica de fines de semana**: Menor actividad los fines de semana

## 🐛 Troubleshooting

### Problema: "Usuario no autorizado"
**Solución**: Verificar que el usuario tenga `CargoID = 4` en la base de datos

### Problema: "No hay datos de reporte"
**Solución**: Ejecutar el script de datos de prueba o verificar que existan datos en `ReporteDeAsistenciaGuardado`

### Problema: "Error de conexión"
**Solución**: Verificar que el backend esté ejecutándose en el puerto 5000 y que la base de datos esté accesible

### Problema: Tabla no se muestra correctamente
**Solución**: Verificar que los nombres de las columnas en la respuesta del backend coincidan con los esperados en el frontend

## 🎉 ¡Listo!

La funcionalidad de Reporte de Asistencias está completamente implementada y lista para usar. Los analistas ahora pueden generar reportes detallados de asistencia con una interfaz moderna y funcional.