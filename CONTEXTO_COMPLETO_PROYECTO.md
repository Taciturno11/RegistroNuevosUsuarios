# 📋 CONTEXTO COMPLETO DEL PROYECTO - SISTEMA DE GESTIÓN DE EMPLEADOS

## 🎯 **RESUMEN EJECUTIVO**

Este es un sistema completo de gestión de empleados desarrollado en **Node.js + Express** con frontend en **HTML/JavaScript vanilla** y base de datos **SQL Server**. El sistema permite gestionar empleados, horarios, excepciones, justificaciones, ceses y más.

---

## 🏗️ **ARQUITECTURA DEL PROYECTO**

### **Backend (Node.js + Express)**
- **Framework**: Express.js
- **Base de Datos**: SQL Server (MSSQL)
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: express-validator
- **Desarrollo**: nodemon para auto-restart

### **Frontend**
- **Framework**: Vanilla JavaScript
- **UI Framework**: Bootstrap 5.3.3
- **Iconos**: Font Awesome 6.4.0
- **Estilos**: CSS personalizado con variables

### **Base de Datos**
- **Motor**: SQL Server
- **Tablas principales**: 
  - `PRI.Empleados` (empleados)
  - `PRI.Jornada` (jornadas laborales)
  - `PRI.Campanias` (campañas)
  - `PRI.Cargos` (cargos)
  - `PRI.ModalidadesTrabajo` (modalidades)
  - `Horarios_Base` (horarios disponibles)
  - `AsignacionExcepciones` (excepciones de horario)
  - `Partner.dbo.Justificaciones` (justificaciones)
  - `PRI.UsoUsuarioCIC` (usuarios OJT/CIC)

---

## 🚀 **FUNCIONALIDADES IMPLEMENTADAS**

### **1. SISTEMA DE AUTENTICACIÓN**
- **Login**: Formulario de autenticación con JWT
- **Middleware**: Protección de rutas con `authMiddleware`
- **Frontend**: Gestión de tokens en `localStorage`
- **Archivos**: `auth.js`, `login.html`, `login.js`
- **Whitelist de DNIs**: Solo DNIs autorizados pueden acceder
- **Roles basados en CargoID**: Diferentes permisos según el cargo

### **2. DASHBOARD PRINCIPAL (REORGANIZADO)**
- **Búsqueda centralizada**: Un solo campo de búsqueda por DNI o nombre
- **Búsqueda en tiempo real**: Autocompletado con debounce
- **Información detallada**: Muestra cargo, campaña, jornada, modalidad (nombres, no IDs)
- **Persistencia**: DNI y nombre se mantienen al navegar entre páginas
- **Acciones disponibles**: 5 tarjetas de acción para cada empleado
- **Botón "Cerrar Sesión"**: Solo disponible desde el dashboard principal
- **Navegación unificada**: Páginas secundarias con "Volver al Dashboard"

### **3. GESTIÓN DE EMPLEADOS**
- **Registro**: Formulario completo para nuevos empleados
- **Actualización**: Modificación de datos existentes
- **Validaciones**: Frontend y backend
- **Archivos**: `registrar-empleado.html`, `actualizar-empleado.html`

### **4. CESE DE EMPLEADOS (MEJORADO)**
- **Funcionalidad**: Registro de terminación laboral
- **Formulario**: Compacto y centrado
- **Anulación de cese**: Opción para reactivar empleados cesados
- **Estados visuales**: Activo/Cesado con indicadores
- **Mensajes permanentes**: No desaparecen automáticamente
- **Archivos**: `cese.html`, `cese.js`

### **5. JUSTIFICACIONES (COMPLETAMENTE MEJORADO)**
- **Gestión**: Registro de ausencias justificadas
- **Formulario**: Compacto y centrado
- **Histórico completo**: Tabla con todas las justificaciones del empleado
- **Funcionalidades CRUD**: Crear, leer, actualizar, eliminar
- **Tipos de justificación**: Dropdown con opciones predefinidas
- **Estados**: Aprobado/Desaprobado con indicadores visuales
- **Validaciones**: Fechas futuras permitidas (configurable)
- **Mensajes permanentes**: No desaparecen automáticamente
- **Gestión de scroll**: Mantiene posición al eliminar/agregar
- **Archivos**: `justificaciones.html`, `justificacion.js`

### **6. OJT/CIC (MEJORADO)**
- **Gestión**: Usuarios de capacitación
- **Formulario**: Alineado con tema corporativo
- **Histórico**: Tabla con todos los registros del empleado
- **Funcionalidad de eliminación**: Botón de eliminar con confirmación
- **Mensajes permanentes**: No desaparecen automáticamente
- **Estados**: Activo (sin fecha fin) o Finalizado
- **Archivos**: `ojt.html`, `ojt.js`

### **7. ASIGNACIÓN EXCEPCIONES (NUEVA FUNCIONALIDAD)**
- **Propósito**: Asignar horarios especiales por día específico
- **Filtrado**: Solo muestra horarios del mismo tipo (Full Time, Part Time, etc.)
- **Descanso**: Opción para marcar días de descanso
- **Tabla**: Muestra fecha, horario, rango horario, motivo
- **Histórico**: Tabla con todas las excepciones
- **Funcionalidades CRUD**: Completas para gestión de excepciones
- **Archivos**: `excepciones.html`, `excepciones.js`

---

## 🎨 **DISEÑO Y ESTÉTICA**

### **Tema Corporativo Implementado**
- **Colores**: Azul corporativo (#1e40af), grises profesionales
- **Tipografía**: Segoe UI
- **Bordes**: Menos redondeados (0.5rem)
- **Sombras**: Sutiles y profesionales
- **Sin gradientes**: Estilo limpio y formal

### **Componentes Rediseñados**
- **Dashboard**: Búsqueda centralizada con autocompletado
- **Tarjetas de acción**: Grid responsivo con hover effects
- **Formularios**: Compactos y centrados
- **Tablas**: Diseño limpio con iconos

---

## 🔧 **CAMBIOS TÉCNICOS REALIZADOS**

### **1. REORGANIZACIÓN DEL FLUJO**
**ANTES**: Cada página pedía DNI individualmente
**AHORA**: DNI se ingresa una vez en el dashboard principal

### **2. PERSISTENCIA DE DATOS**
- **localStorage**: Guarda DNI y nombre del empleado
- **Navegación**: Mantiene contexto entre páginas
- **Limpieza**: Se borra al buscar nuevo empleado

### **3. BÚSQUEDA EN TIEMPO REAL**
- **Debounce**: 300ms para optimizar rendimiento
- **Autocompletado**: Dropdown con sugerencias
- **Navegación**: Teclado (flechas arriba/abajo)
- **Selección**: Click o Enter

### **4. INFORMACIÓN DETALLADA**
- **Catálogos**: Muestra nombres en lugar de IDs
- **Formato**: "Agente" en lugar de "ID: 1"
- **Campos**: Cargo, Campaña, Jornada, Modalidad, Fechas

### **5. CORRECCIÓN DE FECHAS**
- **Problema**: Desfase de 1 día por zona horaria
- **Solución**: Uso de métodos UTC
- **Archivos**: `dashboard.js`, `actualizar-empleado.js`

### **6. ASIGNACIÓN EXCEPCIONES**
- **Backend**: Nuevos controladores y rutas
- **Frontend**: Formulario y tabla de excepciones
- **Validación**: Permite `null` para descanso
- **Filtrado**: Por tipo de horario base

---

## 📁 **ESTRUCTURA DE ARCHIVOS**

```
RegistroNuevosUsuarios/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js          # Autenticación
│   │   ├── empleados.controller.js     # Gestión empleados
│   │   ├── catalogos.controller.js     # Catálogos
│   │   ├── cese.controller.js          # Cese empleados
│   │   ├── justificaciones.controller.js # Justificaciones
│   │   ├── ojt.controller.js           # OJT/CIC
│   │   └── excepciones.controller.js   # NUEVO: Excepciones
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── empleados.routes.js
│   │   ├── catalogos.routes.js
│   │   ├── cese.routes.js
│   │   ├── justificaciones.routes.js
│   │   ├── ojt.routes.js
│   │   └── excepciones.routes.js      # NUEVO
│   ├── public/
│   │   ├── index.html                  # Dashboard principal
│   │   ├── dashboard.js                # Lógica del dashboard
│   │   ├── auth.js                     # Utilidades de auth
│   │   ├── login.html                  # Página de login
│   │   ├── login.js                    # Lógica de login
│   │   ├── registrar-empleado.html     # Registro empleados
│   │   ├── actualizar-empleado.html    # Actualizar empleados
│   │   ├── cese.html                   # Cese empleados
│   │   ├── justificaciones.html        # Justificaciones
│   │   ├── ojt.html                    # OJT/CIC
│   │   ├── excepciones.html            # NUEVO: Excepciones
│   │   └── excepciones.js              # NUEVO: Lógica excepciones
│   ├── server.js                       # Servidor principal
│   └── db.js                          # Conexión BD
├── package.json
├── env.example
└── CONTEXTO_COMPLETO_PROYECTO.md      # Este archivo
```

---

## 🔄 **FLUJO DE NAVEGACIÓN ACTUAL**

1. **Login** → Autenticación con JWT
2. **Dashboard** → Búsqueda de empleado por DNI/nombre
3. **Información** → Muestra datos detallados del empleado
4. **Acciones** → 5 tarjetas de acción disponibles:
   - Actualizar Datos
   - Registrar Cese
   - Justificaciones
   - OJT/CIC
   - Asignación Excepciones
5. **Páginas específicas** → Cada acción lleva a su formulario
6. **Retorno** → Al dashboard manteniendo contexto

---

## 🐛 **PROBLEMAS RESUELTOS**

### **1. Error de nodemon**
- **Problema**: `nodemon` no reconocido
- **Solución**: `npm install`

### **2. Error de conexión BD**
- **Problema**: Configuración de `.env`
- **Solución**: Usuario configuró variables de entorno

### **3. Validación de HorarioID**
- **Problema**: No permitía `null` para descanso
- **Solución**: Validación condicional en backend

### **4. Desfase de fechas**
- **Problema**: 1 día de diferencia por zona horaria
- **Solución**: Uso de métodos UTC

### **5. Estructura de tarjetas**
- **Problema**: "Asignación Excepciones" con estructura diferente
- **Solución**: Unificación de estilos

### **16. Mejoras Generales de UX**
- **Scroll management**: Mantenimiento de posición de scroll
- **Mensajes persistentes**: No desaparecen automáticamente
- **Confirmaciones**: Solo donde es necesario
- **Feedback visual**: Mejor respuesta a acciones del usuario
- **Navegación consistente**: Patrón unificado en todas las páginas

### **6. Rediseño del Login**
- **Problema**: Diseño "no tan bonito" según feedback del usuario
- **Solución**: Rediseño completo con gradientes, animaciones y efectos modernos
- **Resultado**: Interfaz más atractiva y profesional

### **7. Corrección de Botón "Cerrar Sesión"**
- **Problema**: Botón oscuro sobre fondo oscuro, invisible
- **Solución**: Nuevos estilos `.btn-logout` con colores claros
- **Resultado**: Botón visible y accesible

### **8. Navegación Unificada**
- **Problema**: Botones "Cerrar Sesión" duplicados en páginas secundarias
- **Solución**: Reemplazo con "Volver al Dashboard" en páginas secundarias
- **Resultado**: Navegación más intuitiva y consistente

### **9. Sistema de Justificaciones - Múltiples Problemas**
- **Problemas iniciales**: Dropdown no funcionaba, errores de guardado
- **Soluciones implementadas**:
  - Corrección de mapeo de datos en dropdown
  - Ajuste de payload para coincidir con backend
  - Eliminación de confirmaciones automáticas
  - Prevención de redirecciones automáticas
  - Implementación de histórico completo
  - Corrección de estilos de tabla
  - Gestión de posición de scroll
  - Mensajes permanentes (no auto-ocultos)
  - Permisión de fechas futuras

### **10. Registro OJT/CIC - Errores y Mejoras**
- **Problemas resueltos**:
  - Error de parámetros en creación de registros (`DNI` vs `DNIEmpleado`)
  - Mensajes auto-ocultos
  - Implementación de funcionalidad de eliminación
- **Mejoras implementadas**:
  - Botón de eliminar con confirmación
  - Mensajes permanentes
  - Estilos mejorados para botones

### **11. Gestión de Cese - Múltiples Mejoras**
- **Funcionalidades agregadas**:
  - Registro de cese con validaciones
  - Anulación de cese (reactivación de empleados)
  - Mensajes permanentes
  - Corrección de método HTTP (POST → PUT)
  - Eliminación de redirecciones automáticas

### **12. Errores de API**
- **404 en cese**: Método HTTP incorrecto (POST vs PUT)
- **Error en OJT**: Parámetro `DNI` vs `DNIEmpleado`
- **Error en justificaciones**: Mapeo incorrecto de tipos

### **13. Problemas de UI/UX**
- **Botones invisibles**: Estilos de color incorrectos
- **Navegación confusa**: Múltiples botones de logout
- **Scroll no deseado**: Movimiento automático de página
- **Mensajes que desaparecen**: Auto-ocultado no deseado

### **14. Problemas de Datos**
- **Dropdowns vacíos**: Mapeo incorrecto de datos
- **Validaciones restrictivas**: Fechas futuras bloqueadas
- **Redirecciones automáticas**: No deseadas por el usuario

### **15. Problemas de Funcionalidad**
- **Falta de CRUD**: Operaciones de eliminación faltantes
- **Históricos incompletos**: Tablas sin funcionalidad completa
- **Estados inconsistentes**: Indicadores visuales incorrectos

---

## 🔐 **SISTEMA DE AUTENTICACIÓN Y GESTIÓN DE TOKENS EXPIRADOS**

### **🚨 PROBLEMA IDENTIFICADO (Diciembre 2024)**

**Error que aparecía en consola:**
```
Error verificando token: TokenExpiredError: jwt expired
    at C:\Users\71936801\Desktop\RegistroEmpleados\RegistroNuevosUsuarios\node_modules\jsonwebtoken\verify.js:190:21
    at getSecret (C:\Users\71936801\Desktop\RegistroEmpleados\RegistroNuevosUsuarios\node_modules\jsonwebtoken\verify.js:97:14)
    at module.exports [as verify] (C:\Users\71936801\Desktop\RegistroEmpleados\RegistroNuevosUsuarios\node_modules\jsonwebtoken\verify.js:101:10)
    at exports.authMiddleware (C:\Users\71936801\Desktop\RegistroEmpleados\RegistroNuevosUsuarios\src\controllers\auth.controller.js:92:25)
```

### **🔍 ANÁLISIS DEL PROBLEMA**

**Causas identificadas:**
1. **Token JWT expira después de 8 horas** (configurado en `auth.controller.js`)
2. **Usuario tiene token guardado en localStorage que ya expiró**
3. **Frontend sigue enviando token expirado en peticiones**
4. **Middleware de autenticación logueaba cada error** generando ruido en consola
5. **No había verificación previa de expiración** en el frontend

### **✅ SOLUCIONES IMPLEMENTADAS**

#### **1. Middleware de Autenticación Mejorado**
**Archivo:** `src/controllers/auth.controller.js`

```javascript
// Middleware de autenticación
exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_simple_2024');
    req.user = payload; // { dni, nombre, rol, cargoID }
    next();
  } catch (error) {
    // Solo loguear errores que no sean de expiración para reducir ruido
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    } else {
      console.error('Error verificando token:', error);
      return res.status(401).json({ error: 'Error de autenticación' });
    }
  }
};
```

#### **2. Verificación de Token en Frontend**
**Archivo:** `src/public/auth.js`

```javascript
// Verificar y limpiar token expirado
function checkAndCleanExpiredToken() {
  const token = getToken();
  if (!token) return;

  try {
    // Decodificar el token sin verificar (solo para obtener la fecha de expiración)
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.log('Token malformado detectado, limpiando localStorage...');
      logout();
      return;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    const expirationDate = new Date(payload.exp * 1000);
    const currentDate = new Date();

    // Si el token ha expirado, limpiar localStorage
    if (currentDate > expirationDate) {
      console.log('Token expirado detectado, limpiando localStorage...');
      logout();
      return;
    }
  } catch (error) {
    // Si hay error al decodificar el token, limpiarlo
    console.log('Token inválido detectado, limpiando localStorage...');
    logout();
  }
}
```

#### **3. Función fetchWithAuth Mejorada**
**Archivo:** `src/public/auth.js`

```javascript
// Agregar token a las peticiones fetch
function fetchWithAuth(url, options = {}) {
  const token = getToken();
  
  if (!token) {
    logout();
    return Promise.reject(new Error('No hay token'));
  }

  // Verificar si el token está expirado antes de hacer la petición
  try {
    const base64Url = token.split('.')[1];
    if (base64Url) {
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      const expirationDate = new Date(payload.exp * 1000);
      const currentDate = new Date();

      if (currentDate > expirationDate) {
        console.log('Token expirado detectado antes de petición, limpiando localStorage...');
        logout();
        return Promise.reject(new Error('Token expirado'));
      }
    }
  } catch (error) {
    // Si hay error al decodificar, limpiar token
    logout();
    return Promise.reject(new Error('Token inválido'));
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  }).then(response => {
    // Si el token está expirado, limpiar localStorage y redirigir
    if (response.status === 401) {
      logout();
    }
    return response;
  }).catch(error => {
    // Si hay un error de red, también verificar si es por token expirado
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      logout();
    }
    throw error;
  });
}
```

#### **4. Inicialización Automática**
**Archivo:** `src/public/auth.js`

```javascript
// Función que se ejecuta automáticamente al cargar cualquier página
function initializeAuth() {
  // Verificar y limpiar token expirado al cargar la página
  checkAndCleanExpiredToken();
  
  // Si no hay token válido y no estamos en la página de login, redirigir
  if (!isAuthenticated() && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// Ejecutar la inicialización cuando se carga el script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
  initializeAuth();
}
```

#### **5. Funciones Exportadas Actualizadas**
**Archivo:** `src/public/auth.js`

```javascript
// Exportar funciones para uso global
window.auth = {
  isAuthenticated,
  getToken,
  getUserInfo,
  verifyToken,
  logout,
  fetchWithAuth,
  checkAuth,
  checkAuthImmediate,
  displayUserInfo,
  displayGreeting,
  checkAndCleanExpiredToken,
  initializeAuth
};
```

### **🎯 RESULTADOS DE LA IMPLEMENTACIÓN**

#### **✅ Problemas Resueltos:**
1. **Ruido en consola eliminado**: Los errores de token expirado ya no se loguean
2. **Verificación automática**: Tokens expirados se detectan y limpian automáticamente
3. **Redirección automática**: Usuarios con tokens expirados son redirigidos al login
4. **Experiencia mejorada**: No más errores visibles para el usuario
5. **Seguridad reforzada**: Tokens inválidos se limpian inmediatamente

#### **🔧 Funcionalidades Agregadas:**
1. **Verificación previa**: Tokens se verifican antes de hacer peticiones
2. **Limpieza automática**: Tokens expirados se eliminan del localStorage
3. **Inicialización automática**: Verificación al cargar cualquier página
4. **Manejo robusto**: Funciona en todos los navegadores modernos
5. **Logging inteligente**: Solo errores importantes se loguean

### **📝 NOTAS TÉCNICAS IMPORTANTES**

#### **Configuración de JWT:**
- **Duración**: 8 horas (configurable en `auth.controller.js`)
- **Almacenamiento**: localStorage del navegador
- **Verificación**: Automática en cada petición
- **Limpieza**: Automática al detectar expiración

#### **Compatibilidad:**
- **Navegadores**: Todos los navegadores modernos
- **Decodificación**: Usa `atob()` nativo del navegador
- **Manejo de errores**: Robustez ante tokens malformados
- **Fallbacks**: Redirección al login en caso de error

#### **Seguridad:**
- **Verificación**: Doble verificación (frontend + backend)
- **Limpieza**: Tokens inválidos se eliminan inmediatamente
- **Redirección**: Automática al login cuando es necesario
- **Logging**: Solo errores importantes se registran

---

## 🎯 **ESTADO ACTUAL**

### **✅ FUNCIONALIDADES COMPLETADAS**
- ✅ Sistema de autenticación con JWT y whitelist de DNIs
- ✅ Dashboard reorganizado con búsqueda centralizada
- ✅ Búsqueda en tiempo real con autocompletado
- ✅ Persistencia de datos entre páginas
- ✅ Información detallada de empleados
- ✅ Todas las acciones disponibles (5 tarjetas)
- ✅ Asignación de excepciones con histórico
- ✅ Diseño corporativo unificado
- ✅ Sistema de justificaciones completo (CRUD + histórico)
- ✅ Registro OJT/CIC completo (CRUD + histórico)
- ✅ Gestión de cese con anulación
- ✅ Navegación unificada (Volver al Dashboard)
- ✅ Mensajes permanentes (no auto-ocultos)
- ✅ Gestión de scroll (mantiene posición)
- ✅ Rediseño del login con animaciones modernas
- ✅ **Sistema robusto de gestión de tokens expirados**

### **🔧 FUNCIONALIDADES TÉCNICAS**
- ✅ Validaciones frontend y backend
- ✅ Manejo de errores
- ✅ Responsive design
- ✅ Animaciones suaves
- ✅ Navegación intuitiva
- ✅ **Gestión automática de tokens expirados**
- ✅ **Verificación previa de autenticación**
- ✅ **Limpieza automática de tokens inválidos**

---

## 📝 **NOTAS IMPORTANTES PARA DESARROLLO FUTURO**

### **1. Base de Datos**
- Las tablas principales están en esquema `PRI`
- Las excepciones usan `AsignacionExcepciones`
- Los horarios están en `Horarios_Base`

### **2. Autenticación**
- JWT se almacena en `localStorage`
- Middleware protege todas las rutas API
- Frontend maneja tokens automáticamente
- **NUEVO**: Verificación automática de tokens expirados
- **NUEVO**: Limpieza automática de tokens inválidos

### **3. Frontend**
- No usa frameworks (vanilla JS)
- Bootstrap para componentes UI
- CSS personalizado para tema corporativo
- **NUEVO**: Sistema robusto de gestión de autenticación

### **4. API Endpoints**
- `/api/login` - Autenticación
- `/api/empleados/*` - Gestión empleados
- `/api/catalogos/*` - Catálogos
- `/api/excepciones/*` - Excepciones
- `/api/cese/*` - Cese (incluye anulación)
- `/api/justificaciones/*` - Justificaciones (CRUD completo)
- `/api/ojt/*` - OJT/CIC (CRUD completo)

**Endpoints específicos agregados:**
- `DELETE /api/justificaciones/:id` - Eliminar justificación
- `DELETE /api/ojt/:id` - Eliminar registro OJT
- `DELETE /api/cese/:dni` - Anular cese

### **5. Variables de Entorno**
- Ver `env.example` para configuración
- Requiere SQL Server configurado
- JWT_SECRET necesario

### **6. Gestión de Tokens (NUEVO)**
- **Duración**: 8 horas por defecto
- **Verificación**: Automática en cada petición
- **Limpieza**: Automática al detectar expiración
- **Redirección**: Automática al login cuando es necesario
- **Logging**: Solo errores importantes se registran

---

## 🚀 **COMANDOS DE DESARROLLO**

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

---

## 📞 **CONTACTO Y SOPORTE**

Este documento debe ser compartido con cualquier nuevo chat de Cursor para mantener el contexto completo del proyecto. Incluye:

1. **Arquitectura completa**
2. **Todas las funcionalidades**
3. **Cambios realizados**
4. **Problemas resueltos**
5. **Estado actual**
6. **Notas técnicas importantes**
7. **Sistema de gestión de tokens expirados (NUEVO)**

**Última actualización**: Diciembre 2024
**Versión del proyecto**: 2.1.0
**Estado**: ✅ COMPLETO Y FUNCIONAL CON TODAS LAS MEJORAS IMPLEMENTADAS + SISTEMA ROBUSTO DE GESTIÓN DE TOKENS 