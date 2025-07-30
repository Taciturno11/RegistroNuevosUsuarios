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
  
  // Cambiar icono de Font Awesome
  const icon = togglePassword.querySelector('i');
  icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
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
  btnLogin.innerHTML = isLoading 
    ? '<i class="fas fa-spinner fa-spin me-2"></i>Ingresando...' 
    : '<i class="fas fa-sign-in-alt me-2"></i>Ingresar';
}

function showError(message) {
  errorMessage.textContent = message;
  const modal = new bootstrap.Modal(errorModal);
  modal.show();
}

// Verificar si ya está logueado
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Si ya tiene token, redirigir al dashboard
    window.location.href = '/';
  }
}); 