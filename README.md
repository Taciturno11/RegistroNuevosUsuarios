# 🚀 Sistema de Gestión de Empleados

Sistema completo de gestión de empleados con frontend React y backend Node.js, configurado para funcionar automáticamente en **todas las redes**.

## 🌐 **FUNCIONAMIENTO MULTI-RED**

### **Redes Soportadas:**
- ✅ **Localhost** (`127.0.0.1:3000` → `127.0.0.1:5000`)
- ✅ **Red Local** (`192.168.x.x:3000` → `192.168.x.x:5000`)
- ✅ **Red del Trabajo** (`10.8.x.x:3000` → `10.8.x.x:5000`)
- ✅ **Red Externa** (cualquier IP pública)

### **Detección Automática:**
El sistema detecta automáticamente en qué red estás y configura las URLs correspondientes.

## 🚀 **INICIO RÁPIDO**

### **Opción 1: Inicio Automático (Recomendado)**
```bash
# Desde la raíz del proyecto
npm start
```

### **Opción 2: Inicio Manual**
```bash
# Terminal 1: Backend
cd backend-refactorizado
npm start

# Terminal 2: Frontend
cd frontend-react
npm start
```

## 📱 **ACCESO A LA APLICACIÓN**

### **Una vez iniciada, podrás acceder desde:**

#### **🏠 En Casa (Red Local):**
- Frontend: `http://192.168.x.x:3000`
- Backend: `http://192.168.x.x:5000`

#### **💼 En el Trabajo (VPN):**
- Frontend: `http://10.8.x.x:3000` (o IP detectada automáticamente)
- Backend: `http://10.8.x.x:5000` (o IP detectada automáticamente)

#### **🏠 Localhost (Siempre disponible):**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## 🏢 **DESPLIEGUE EN TRABAJO (NUEVA MÁQUINA)**

### **Pasos para usar en el trabajo:**

1. **Clonar el repositorio:**
   ```bash
   git clone [URL-DE-TU-REPO]
   cd RegistroNuevosUsuarios
   ```

2. **Crear archivo .env** (si no existe):
   ```env
   DB_SERVER=servidor-sql-trabajo
   DB_NAME=base-datos-trabajo
   DB_USER=usuario-trabajo
   DB_PASSWORD=password-trabajo
   ```

3. **Iniciar aplicación:**
   ```bash
   npm start
   ```

### **✅ Lo que sucede automáticamente:**
- **Detección automática**: El sistema detecta todas las IPs disponibles
- **Configuración automática**: Funciona en cualquier red sin configuración manual
- **CORS automático**: Se configura para permitir acceso desde cualquier IP
- **URLs dinámicas**: El frontend se conecta automáticamente al backend correcto

## 🔧 **CONFIGURACIÓN**

### **Variables de Entorno:**
El backend se configura automáticamente. Solo necesitas:

1. **Crear archivo `.env` en `backend-refactorizado/`:**
```env
DB_SERVER=tu-servidor-sql
DB_NAME=tu-base-de-datos
DB_USER=tu-usuario
DB_PASSWORD=tu-password
```

### **Puertos:**
- **Frontend**: 3000
- **Backend**: 5000
- **Base de Datos**: 1433 (SQL Server)

## 📊 **FUNCIONALIDADES**

### **Gestión de Empleados:**
- ✅ Registrar empleado
- ✅ Actualizar empleado
- ✅ Registrar cese
- ✅ Consultar empleados

### **Reportes:**
- ✅ Reporte de asistencias
- ✅ Reporte de tardanzas
- ✅ Reporte de nómina
- ✅ Generar reporte maestro

### **Gestión de Horarios:**
- ✅ Excepciones de horario
- ✅ OJT/CIC
- ✅ Justificaciones

## 🛠️ **ESTRUCTURA DEL PROYECTO**

```
RegistroNuevosUsuarios/
├── frontend-react/          # Frontend React
├── backend-refactorizado/   # Backend Node.js
├── start-app.js            # Script de inicio automático
├── package.json            # Configuración principal
└── README.md              # Este archivo
```

## 🔍 **SOLUCIÓN DE PROBLEMAS**

### **Problema: "Puerto ya en uso"**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /F /PID [PID]

# Linux/Mac
lsof -i :5000
kill -9 [PID]
```

### **Problema: "No se puede conectar a la base de datos"**
1. Verificar que SQL Server esté ejecutándose
2. Verificar credenciales en `.env`
3. Verificar que el firewall permita conexiones

### **Problema: "Frontend no puede conectar al backend"**
1. Verificar que ambos servicios estén ejecutándose
2. Verificar que las IPs sean correctas
3. Reiniciar con `npm start`

## 🌟 **CARACTERÍSTICAS AVANZADAS**

### **Auto-detección de Red:**
- Detecta automáticamente la IP del servidor
- Configura CORS dinámicamente
- Prioriza redes del trabajo sobre redes locales

### **Gestión de Procesos:**
- Inicio y cierre graceful de servicios
- Manejo de señales del sistema
- Logs detallados de red

### **Configuración Dinámica:**
- URLs generadas automáticamente
- Fallback a localhost si es necesario
- Configuración por entorno

## 📞 **SOPORTE**

Si tienes problemas:
1. Verificar logs en la consola
2. Reiniciar con `npm start`
3. Verificar configuración de red
4. Verificar que todos los servicios estén ejecutándose

## 🎯 **PRÓXIMAS MEJORAS**

- [ ] Configuración por archivo de configuración
- [ ] Monitoreo de salud de servicios
- [ ] Auto-reinicio en caso de fallo
- [ ] Interfaz web para gestión de configuración

---

**¡Disfruta usando tu sistema multi-red! 🚀**
