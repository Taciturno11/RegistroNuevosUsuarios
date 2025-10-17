# 📞 Sistema de Monitoreo de Llamadas - Backend API

## 📋 Descripción General

Este es el backend del sistema de monitoreo de llamadas desarrollado en Node.js con Express y Socket.IO. Proporciona una API REST para la gestión de monitoreos, historial de auditorías y reportes, además de comunicación en tiempo real entre monitores y supervisores.

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web para Node.js
- **Socket.IO** - Comunicación en tiempo real
- **SQL Server** - Base de datos principal
- **mssql** - Driver para conexión con SQL Server
- **CORS** - Middleware para manejo de CORS
- **dotenv** - Gestión de variables de entorno

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 14 o superior)
- SQL Server
- Acceso a la base de datos `Partner`

### Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:

```env
PORT=3210
SQL_SERVER=tu_servidor_sql
SQL_DATABASE=Partner
SQL_USER=tu_usuario
SQL_PASSWORD=tu_contraseña
SQL_PORT=1433
```

### Instalación
```bash
npm install
npm start
```

## 📡 Endpoints de la API

### 🔐 Autenticación

#### `POST /api/login`
Autentica usuarios (monitores y jefa) en el sistema.

**Parámetros:**
- `dni` (string): DNI del usuario
- `password` (string): Contraseña (debe coincidir con el DNI)

**Respuesta exitosa:**
```json
{
  "success": true,
  "usuario": {
    "dni": "44037525",
    "nombre": "Andrea Morelia Tejeda Salinas",
    "rol": "monitor",
    "campañasAsignadas": ["Crosselling", "Hogar"]
  }
}
```

**Códigos de estado:**
- `200`: Login exitoso
- `400`: Faltan parámetros requeridos
- `401`: Credenciales inválidas o sin acceso
- `500`: Error interno del servidor

---

### 📞 Gestión de Llamadas

#### `POST /api/llamada-aleatoria`
Obtiene una llamada aleatoria con filtros opcionales para monitoreo.

**Parámetros:**
- `fechaInicio` (string, opcional): Fecha inicio en formato YYYY-MM-DD
- `fechaFin` (string, opcional): Fecha fin en formato YYYY-MM-DD
- `campana` (string, opcional): Nombre de la campaña
- `agente` (string, opcional): Nombre del agente (búsqueda parcial)
- `idLargo` (string, opcional): ID específico de la llamada
- `cola` (string, opcional): Cola de la llamada
- `dniUsuario` (string, opcional): DNI del usuario para filtros automáticos

**Respuesta exitosa:**
```json
{
  "ID_Corto": "2001136580",
  "Usuario_Llamada_Origen": "PSGRALVG",
  "DNIEmpleado": "48137726",
  "Numero": "984054888",
  "Fecha": "2025-09-13T00:00:00.000Z",
  "Hora": "1970-01-01T15:09:30.000Z",
  "Duracion": 70,
  "Cola": "OUT_POR_PPA",
  "NombreCompletoAgente": "Rosalinda Vidal Alvarez",
  "Cargo": "Agente",
  "EstadoEmpleado": "Activo",
  "Modalidad": "Remoto",
  "Jornada": "FullTime",
  "Campaña_Agente": "Portabilidad Prepago",
  "NombreCompletoSupervisor": "Flor De Maria Cuespan Souza",
  "Tipificacion_Detalle": "No Da Informacion No Confia",
  "Tipificacion_Estado_IPC": "No Acepta",
  "Tipificacion_Estado_General": "Contactado",
  "ID_Largo": "200113658090250000",
  "ReporteID": 8145891
}
```

**Respuesta sin resultados:**
```json
{
  "error": "No se encontraron llamadas con esos filtros"
}
```

#### `GET /api/opciones-filtros`
Obtiene las opciones disponibles para los filtros de llamadas.

**Respuesta:**
```json
{
  "campanas": ["Crosselling", "Hogar", "Migracion", "Portabilidad Pospago", "Portabilidad Prepago", "Renovacion"],
  "colas": ["Movil_RenovOut", "OUT_POR_PPA", "OUT_POR_PRE"]
}
```

---

### 💾 Gestión de Monitoreos

#### `POST /api/guardar-monitoreo`
Guarda un monitoreo completado en la base de datos.

**Parámetros:**
- `dniMonitor` (string): DNI del monitor
- `nombreMonitor` (string): Nombre completo del monitor
- `llamada` (object): Objeto con datos de la llamada monitoreada
- `fechaHoraInicio` (string): Fecha/hora de inicio del monitoreo
- `fechaHoraFin` (string): Fecha/hora de fin del monitoreo
- `tiempoSegundos` (number): Duración del monitoreo en segundos

**Respuesta exitosa:**
```json
{
  "success": true,
  "id": 123,
  "message": "Monitoreo guardado correctamente"
}
```

---

### 📊 Historial y Reportes

#### `GET /api/mi-historial`
Obtiene el historial personal de monitoreos de un monitor.

**Parámetros de consulta:**
- `dni` (string): DNI del monitor

**Respuesta:**
```json
{
  "monitoreos": [
    {
      "ID": 1,
      "ID_Llamada_Largo": "200113658090250000",
      "NumeroLlamada": "984054888",
      "FechaLlamada": "2025-09-13T00:00:00.000Z",
      "HoraLlamada": "1970-01-01T15:09:30.000Z",
      "DuracionLlamada": 70,
      "AgenteAuditado": "Rosalinda Vidal Alvarez",
      "DNIEmpleadoAuditado": "48137726",
      "CampañaAuditada": "Portabilidad Prepago",
      "ColaAuditada": "OUT_POR_PPA",
      "FechaHoraInicio": "2025-10-15T17:48:00.000Z",
      "FechaHoraFin": "2025-10-15T17:50:00.000Z",
      "TiempoMonitoreoSegundos": 120,
      "CreadoEn": "2025-10-15T17:50:00.000Z"
    }
  ],
  "estadisticas": {
    "total": 15,
    "hoy": 3,
    "tiempoTotalSegundos": 1800,
    "tiempoPromedioSegundos": 120
  }
}
```

#### `GET /api/historial-general`
Obtiene el historial general de todos los monitoreos (solo para jefa).

**Respuesta:**
```json
{
  "monitoreos": [...],
  "estadisticas": {
    "total": 150,
    "tiempoTotalSegundos": 18000,
    "ranking": [
      {
        "posicion": 1,
        "dni": "44037525",
        "nombre": "Andrea Morelia Tejeda Salinas",
        "total": 25,
        "tiempoTotal": 3000,
        "tiempoPromedio": 120
      }
    ]
  }
}
```

---

### 📈 Reportes de Rendimiento

#### `GET /api/reporte/monitor-dia`
Genera reporte de rendimiento de un monitor para un día específico.

**Parámetros de consulta:**
- `dni` (string): DNI del monitor
- `fecha` (string): Fecha en formato YYYY-MM-DD

**Respuesta:**
```json
{
  "rango": {
    "inicio": "2025-10-15T00:00:00.000Z",
    "fin": "2025-10-16T00:00:00.000Z"
  },
  "dni": "44037525",
  "nombre": "Andrea Morelia Tejeda Salinas",
  "resumen": {
    "totalLlamadas": 5,
    "tiempoMonitoreoSegundos": 600,
    "tiempoEnLlamadaSegundos": 300,
    "tiempoConectadoSegundos": 1800,
    "tiempoDesconectadoSegundos": 0
  },
  "llamadas": [...]
}
```

#### `GET /api/reporte/monitor-rango`
Genera reporte de rendimiento de un monitor para un rango de fechas.

**Parámetros de consulta:**
- `dni` (string): DNI del monitor
- `inicio` (string): Fecha inicio en formato YYYY-MM-DD
- `fin` (string): Fecha fin en formato YYYY-MM-DD

**Respuesta:** Similar a `monitor-dia` pero sin el array `llamadas`.

---

### 🛠️ Endpoints de Desarrollo

#### `GET /api/saludo`
Endpoint de prueba para verificar que el servidor está funcionando.

**Respuesta:**
```json
{
  "message": "¡Hola desde el Backend de Node.js!"
}
```

#### `POST /api/dev/limpiar-memoria`
Limpia el estado de monitores en memoria (solo para desarrollo).

**Respuesta:**
```json
{
  "success": true,
  "message": "Memoria limpiada correctamente (5 monitores removidos)"
}
```

---

## 🔌 Socket.IO - Comunicación en Tiempo Real

### Eventos del Cliente

#### `usuario_conectado`
Notifica que un usuario se ha conectado al sistema.

**Datos:**
```json
{
  "dni": "44037525",
  "nombre": "Andrea Morelia Tejeda Salinas",
  "rol": "monitor"
}
```

#### `iniciar_monitoreo`
Notifica que un monitor ha iniciado el monitoreo de una llamada.

**Datos:**
```json
{
  "dni": "44037525",
  "llamadaId": "200113658090250000"
}
```

#### `finalizar_monitoreo`
Notifica que un monitor ha finalizado el monitoreo de una llamada.

**Datos:**
```json
{
  "dni": "44037525",
  "tiempoTotal": 120
}
```

#### `actualizar_tiempo`
Actualización periódica del tiempo (cada segundo).

**Datos:**
```json
{
  "dni": "44037525"
}
```

### Eventos del Servidor

#### `estado_monitores`
Envía el estado actual de todos los monitores a la jefa.

**Datos:**
```json
[
  {
    "dni": "44037525",
    "nombre": "Andrea Morelia Tejeda Salinas",
    "rol": "monitor",
    "estado": "en_llamada",
    "tiempoEnLlamada": 45,
    "tiempoInactivo": 0,
    "tiempoDesconectado": 0,
    "llamadaActual": "200113658090250000",
    "fechaEstado": "15/10/2025",
    "horaEstado": "17:48:30",
    "tiempoEnEstado": 45
  }
]
```

---

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

#### `[Partner].[mo].[Historial_Monitoreos]`
Almacena el historial de monitoreos realizados.

**Campos:**
- `ID` (INT, IDENTITY): Identificador único
- `DNIMonitor` (VARCHAR): DNI del monitor
- `NombreMonitor` (VARCHAR): Nombre del monitor
- `ID_Llamada_Largo` (VARCHAR): ID de la llamada monitoreada
- `NumeroLlamada` (VARCHAR): Número de teléfono
- `FechaLlamada` (DATE): Fecha de la llamada
- `HoraLlamada` (TIME): Hora de la llamada
- `DuracionLlamada` (INT): Duración de la llamada en segundos
- `AgenteAuditado` (VARCHAR): Nombre del agente auditado
- `DNIEmpleadoAuditado` (VARCHAR): DNI del agente auditado
- `CampañaAuditada` (VARCHAR): Campaña de la llamada
- `ColaAuditada` (VARCHAR): Cola de la llamada
- `FechaHoraInicio` (DATETIME): Inicio del monitoreo
- `FechaHoraFin` (DATETIME): Fin del monitoreo
- `TiempoMonitoreoSegundos` (INT): Duración del monitoreo
- `CreadoEn` (DATETIME): Fecha de creación del registro

#### `[Partner].[mo].[Monitores_Estados_Hist]`
Almacena el historial de estados de los monitores.

**Campos:**
- `ID` (INT, IDENTITY): Identificador único
- `DNIMonitor` (VARCHAR): DNI del monitor
- `NombreMonitor` (NVARCHAR): Nombre del monitor
- `Estado` (VARCHAR): Estado actual (conectado, en_llamada, desconectado)
- `InicioEstado` (DATETIME): Inicio del estado
- `FinEstado` (DATETIME): Fin del estado (NULL si está activo)
- `DuracionSegundos` (INT): Duración del estado en segundos
- `LlamadaIdLargo` (VARCHAR): ID de la llamada (si aplica)
- `CreadoEn` (DATETIME): Fecha de creación del registro

#### `[Partner].[dbo].[Reporte_Llamadas_Detalle]`
Tabla de llamadas disponibles para monitoreo.

**Campos principales:**
- `ID_Largo` (VARCHAR): Identificador único de la llamada
- `Numero` (VARCHAR): Número de teléfono
- `Fecha` (DATE): Fecha de la llamada
- `Hora` (TIME): Hora de la llamada
- `Duracion` (INT): Duración en segundos
- `NombreCompletoAgente` (VARCHAR): Nombre del agente
- `DNIEmpleado` (VARCHAR): DNI del agente
- `Campaña_Agente` (VARCHAR): Campaña asignada
- `Cola` (VARCHAR): Cola de la llamada
- `NombreCompletoSupervisor` (VARCHAR): Nombre del supervisor

---

## 👥 Gestión de Usuarios

### Roles del Sistema

#### Monitor
- **DNI**: Cualquier empleado con `CargoID = 6` y `EstadoEmpleado = 'Activo'`
- **Permisos**: 
  - Monitoreo de llamadas
  - Visualización de historial personal
  - Acceso limitado a campañas asignadas

#### Jefa
- **DNI**: `76157106`
- **Permisos**:
  - Dashboard en tiempo real
  - Historial general de todos los monitores
  - Generación de reportes
  - Acceso completo a todas las campañas

### Campañas Asignadas

```javascript
const campañasAsignadas = {
  '44037525': ['Crosselling', 'Hogar'],      // Andrea Morelia Tejeda Salinas
  '72853980': ['Crosselling', 'Renovacion'], // Evelyn Betzabeth Villa Aramburú
  '48802135': ['Migracion'],                  // Jeanpaul Aguilar Perez
  '76081717': ['Portabilidad Pospago'],       // Yadhira Margarita Vasquez P.
  '007332055': ['Portabilidad Prepago']      // Emmanuel Alejandro Lavin G.
};
```

---

## 🔧 Configuración y Mantenimiento

### Logs del Sistema
El servidor genera logs detallados para:
- Conexiones y desconexiones de usuarios
- Cambios de estado de monitores
- Errores de base de datos
- Eventos de Socket.IO

### Monitoreo de Estado
- **Estados posibles**: `conectado`, `en_llamada`, `desconectado`
- **Actualización**: Cada segundo via Socket.IO
- **Persistencia**: Todos los cambios se guardan en BD

### Manejo de Errores
- Validación de parámetros en todos los endpoints
- Manejo de errores de conexión a BD
- Respuestas HTTP apropiadas con códigos de estado
- Logs detallados para debugging

---

## 📝 Notas de Desarrollo

### Consideraciones de Seguridad
- Validación de entrada en todos los endpoints
- Sanitización de consultas SQL con parámetros
- Autenticación basada en DNI
- CORS configurado para desarrollo

### Optimizaciones
- Conexión pool para SQL Server
- Índices en tablas de historial
- Validación de duplicados en estados
- Limpieza automática de memoria

### Escalabilidad
- Arquitectura modular con Express
- Separación de responsabilidades
- Manejo eficiente de conexiones Socket.IO
- Persistencia de estado en BD

---

## 🚀 Despliegue

### Producción
1. Configurar variables de entorno de producción
2. Configurar CORS para dominios específicos
3. Implementar logs estructurados
4. Configurar monitoreo de salud del servidor
5. Implementar backup automático de BD

### Desarrollo
```bash
# Modo desarrollo con auto-reload
npm run dev

# Limpiar memoria durante desarrollo
curl -X POST http://localhost:3210/api/dev/limpiar-memoria
```

---

*Documentación generada automáticamente - Sistema de Monitoreo de Llamadas v1.0*
