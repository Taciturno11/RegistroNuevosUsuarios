# 🔐 Sistema de Login - Implementación Simple

## 📋 Resumen

Sistema de autenticación simple para 4 usuarios específicos:

- ✅ Login con DNI como usuario y contraseña
- ✅ Solo 4 DNIs autorizados
- ✅ Autenticación JWT
- ✅ Protección de rutas
- ✅ Interfaz de usuario moderna
- ✅ Sin modificar la base de datos

## 🚀 Instalación

### 1. Instalar dependencias
```bash
npm install jsonwebtoken
```

### 2. Configurar variables de entorno (opcional)
Crear archivo `.env` basado en `env.example`:
```env
# Configuración de la base de datos
DB_USER=tu_usuario
DB_PASS=tu_password
DB_NAME=Partner
DB_HOST=127.0.0.1
DB_PORT=1433

# Clave secreta para JWT (opcional, tiene una por defecto)
JWT_SECRET=clave_secreta_simple_2024

# Puerto del servidor
PORT=3000
HOST=0.0.0.0
```

## 🔧 Configuración

### Usuarios Autorizados
Solo estos 4 DNIs pueden acceder:
- `72548769`
- `73766815` 
- `71936801`
- `44991089`

### Credenciales
- **Usuario**: DNI del empleado
- **Contraseña**: DNI del empleado (el mismo)

### Roles de Usuario
Los roles se asignan automáticamente según el `CargoID`:
- `CargoID = 8` → `admin`
- `CargoID = 2` → `supervisor` 
- `CargoID = 5` → `coordinador`
- Otros → `usuario`

## 📱 Uso

### 1. Acceder al login
```
http://localhost:3000/login
```

### 2. Iniciar sesión
- **Usuario**: DNI del empleado (ej: 72548769)
- **Contraseña**: DNI del empleado (ej: 72548769)

### 3. Navegación
Una vez autenticado, el usuario puede:
- Acceder a todas las funcionalidades
- Ver su información en el header
- Cerrar sesión desde el botón "Cerrar Sesión"

### 4. Ejemplo de login
```
Usuario: 72548769
Contraseña: 72548769
```

## 🛡️ Seguridad

### Características implementadas:
- ✅ Lista blanca de DNIs autorizados
- ✅ Tokens JWT con expiración (8 horas)
- ✅ Validación de tokens en cada petición
- ✅ Logout automático al expirar token
- ✅ Protección de rutas API
- ✅ Sin modificar la base de datos existente

### Para producción:
- 🔄 Cambiar la clave secreta JWT
- 🔄 Agregar HTTPS
- 🔄 Implementar logs de acceso

## 🔄 Flujo de Autenticación

1. **Usuario accede a `/login`**
2. **Ingresa DNI y contraseña**
3. **Sistema verifica credenciales**
4. **Genera token JWT**
5. **Almacena token en localStorage**
6. **Redirige al dashboard**
7. **Todas las peticiones incluyen token**
8. **Sistema valida token en cada petición**

## 📁 Archivos Modificados/Creados

### Nuevos archivos:
- `src/public/login.html` - Página de login
- `src/public/login.js` - Lógica del login
- `src/public/auth.js` - Funciones de autenticación
- `src/controllers/auth.controller.js` - Controlador de auth
- `src/routes/auth.routes.js` - Rutas de autenticación

### Archivos modificados:
- `src/server.js` - Agregadas rutas de auth
- `src/public/index.html` - Agregado header de usuario
- `src/public/app.js` - Integrada autenticación

## 🐛 Solución de Problemas

### Error: "Usuario no autorizado"
- Verificar que el DNI está en la lista de autorizados
- DNIs permitidos: 72548769, 73766815, 71936801, 44991089

### Error: "Usuario no encontrado en la base de datos"
- Verificar que el DNI existe en la tabla `PRI.Empleados`
- Verificar que `FechaCese` es NULL

### Error: "Contraseña incorrecta"
- Verificar que usuario y contraseña son iguales (ambos son el DNI)

### Error: "Token inválido"
- Verificar que `JWT_SECRET` está configurado (opcional)
- Verificar que el token no ha expirado

## 📞 Soporte

Para problemas o dudas sobre la implementación, revisar:
1. Logs del servidor
2. Console del navegador
3. Network tab en DevTools
4. Configuración de variables de entorno 