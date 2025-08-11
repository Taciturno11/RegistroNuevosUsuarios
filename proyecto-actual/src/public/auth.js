// Funciones de autenticación para el frontend

// Verificar si el usuario está autenticado
function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token;
}

// Obtener token del localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Obtener información del usuario
function getUserInfo() {
  return {
    dni: localStorage.getItem('dni'),
    nombres: localStorage.getItem('nombres'),
    apellidoPaterno: localStorage.getItem('apellidoPaterno'),
    apellidoMaterno: localStorage.getItem('apellidoMaterno'),
    cargoID: localStorage.getItem('cargoID'),
    rol: localStorage.getItem('rol')
  };
}

// Verificar token con el servidor
async function verifyToken() {
  const token = getToken();
  if (!token) return false;

  try {
    // Verificar token usando una ruta protegida
    const res = await fetch('/catalogos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      // Si el token está expirado, limpiar localStorage y redirigir
      if (res.status === 401) {
        logout();
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verificando token:', error);
    logout();
    return false;
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('dni');
  localStorage.removeItem('nombres');
  localStorage.removeItem('apellidoPaterno');
  localStorage.removeItem('apellidoMaterno');
  localStorage.removeItem('cargoID');
  localStorage.removeItem('rol');
  
  // Redirigir al login
  window.location.href = '/login';
}

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
        console.log('Token expirado detectado antes de la petición, limpiando localStorage...');
        logout();
        return Promise.reject(new Error('Token expirado'));
      }
    }
  } catch (error) {
    console.log('Token inválido detectado antes de la petición, limpiando localStorage...');
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

// Verificar autenticación al cargar la página
async function checkAuth() {
  // Primero verificar si el token está expirado
  checkAndCleanExpiredToken();
  
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return;
  }
  
  const isValid = await verifyToken();
  if (!isValid) {
    window.location.href = '/login';
  }
}

// Verificar autenticación inmediata (sin async)
function checkAuthImmediate() {
  // Primero verificar si el token está expirado
  checkAndCleanExpiredToken();
  
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// Mostrar información del usuario en la página
function displayUserInfo() {
  const user = getUserInfo();
  const userInfoElement = document.getElementById('userInfo');
  
  if (userInfoElement && user.nombres) {
    userInfoElement.innerHTML = `
      <button class="btn btn-sm btn-logout" onclick="logout()">
        <i class="fas fa-sign-out-alt me-1"></i>
        Cerrar Sesión
      </button>
    `;
  }
}

// Mostrar saludo personalizado
function displayGreeting() {
  const user = getUserInfo();
  const greetingElement = document.getElementById('greeting');
  
  if (greetingElement && user.nombres) {
    const now = new Date();
    const hour = now.getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = 'Buenos días';
    } else if (hour < 18) {
      greeting = 'Buenas tardes';
    } else {
      greeting = 'Buenas noches';
    }
    
    greetingElement.innerHTML = `
      <h3 class="text-dark mb-0">
        Bienvenido, ${user.nombres}! 👋
      </h3>
    `;
  }
}

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