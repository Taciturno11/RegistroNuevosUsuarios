// Variables globales
let loading = false;

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const usuarioInput = document.getElementById('usuario');
const contrasenaInput = document.getElementById('contrasena');
const btnLogin = document.getElementById('btnLogin');
const togglePassword = document.getElementById('togglePassword');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');

// Toggle password visibility
togglePassword.addEventListener('click', () => {
  const type = contrasenaInput.type === 'password' ? 'text' : 'password';
  contrasenaInput.type = type;
  
  // Cambiar icono
  togglePassword.innerHTML = type === 'password' 
    ? `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
         <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3 9c-4.5 0-8.31-3.5-10-7.5 1.69-4 5.5-7.5 10-7.5s8.31 3.5 10 7.5c-1.69 4-5.5 7.5-10 7.5z"/>
       </svg>`
    : `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
         <path d="M3 3l18 18M9.88 9.88a3 3 0 104.24 4.24M15.54 15.54C14.34 16.54 12.74 17 11 17c-4 0-7-4.5-7-4.5a12.17 12.17 0 014.88-4.88 12.16 12.16 0 014.88 4.88s-.25.33-.72.73"/>
       </svg>`;
});

// Manejar envío del formulario
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (loading) return;
  
  const usuario = usuarioInput.value.trim();
  const contrasena = contrasenaInput.value.trim();
  
  if (!usuario || !contrasena) {
    showError('Por favor complete todos los campos');
    return;
  }
  
  setLoading(true);
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      showError(data.error || 'Error de autenticación');
      return;
    }
    
    // Guardar datos en localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('dni', data.dni);
    localStorage.setItem('nombres', data.nombres);
    localStorage.setItem('apellidoPaterno', data.apellidoPaterno);
    localStorage.setItem('apellidoMaterno', data.apellidoMaterno);
    localStorage.setItem('cargoID', data.cargoID);
    localStorage.setItem('rol', data.rol);
    
    // Redirigir al dashboard
    window.location.href = '/';
    
  } catch (error) {
    console.error('Error de red:', error);
    showError('Error de conexión. Verifique su conexión a internet.');
  } finally {
    setLoading(false);
  }
});

// Funciones auxiliares
function setLoading(isLoading) {
  loading = isLoading;
  btnLogin.disabled = isLoading;
  btnLogin.textContent = isLoading ? 'Ingresando...' : 'Ingresar';
}

function showError(message) {
  errorMessage.textContent = message;
  errorModal.classList.remove('d-none');
}

function closeErrorModal() {
  errorModal.classList.add('d-none');
}

// Verificar si ya está logueado
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Si ya tiene token, redirigir al dashboard
    window.location.href = '/';
  }
}); 