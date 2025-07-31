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
      logout();
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
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
}

// Verificar autenticación al cargar la página
async function checkAuth() {
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
  displayGreeting
}; 