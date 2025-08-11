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

// Toggle password visibility con animación
togglePassword.addEventListener('click', () => {
  const type = contrasenaInput.type === 'password' ? 'text' : 'password';
  contrasenaInput.type = type;
  
  // Cambiar icono de Font Awesome con animación
  const icon = togglePassword.querySelector('i');
  icon.style.transform = 'scale(0.8)';
  
  setTimeout(() => {
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    icon.style.transform = 'scale(1)';
  }, 150);
  
  // Efecto visual en el botón
  togglePassword.style.transform = 'scale(0.95)';
  setTimeout(() => {
    togglePassword.style.transform = 'scale(1)';
  }, 150);
});

// Efectos visuales en los inputs
[usuarioInput, contrasenaInput].forEach(input => {
  input.addEventListener('focus', () => {
    input.parentElement.style.transform = 'translateY(-2px)';
  });
  
  input.addEventListener('blur', () => {
    input.parentElement.style.transform = 'translateY(0)';
  });
  
  // Efecto de typing
  input.addEventListener('input', () => {
    if (input.value.length > 0) {
      input.style.borderColor = '#3498db';
    } else {
      input.style.borderColor = '#e2e8f0';
    }
  });
});

// Manejar envío del formulario
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (loading) return;
  
  const usuario = usuarioInput.value.trim();
  const contrasena = contrasenaInput.value.trim();
  
  if (!usuario || !contrasena) {
    showError('Por favor complete todos los campos');
    shakeForm();
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
      shakeForm();
      return;
    }
    
    // Efecto de éxito antes de redirigir
    showSuccessEffect();
    
    // Guardar datos en localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('dni', data.dni);
    localStorage.setItem('nombres', data.nombres);
    localStorage.setItem('apellidoPaterno', data.apellidoPaterno);
    localStorage.setItem('apellidoMaterno', data.apellidoMaterno);
    localStorage.setItem('cargoID', data.cargoID);
    localStorage.setItem('rol', data.rol);
    
    // Redirigir al dashboard después de un breve delay
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
    
  } catch (error) {
    console.error('Error de red:', error);
    showError('Error de conexión. Verifique su conexión a internet.');
    shakeForm();
  } finally {
    setLoading(false);
  }
});

// Funciones auxiliares mejoradas
function setLoading(isLoading) {
  loading = isLoading;
  btnLogin.disabled = isLoading;
  
  if (isLoading) {
    btnLogin.innerHTML = '<span class="loading-spinner"></span> Ingresando...';
    btnLogin.style.background = 'linear-gradient(135deg, #95a5a6, #7f8c8d)';
  } else {
    btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar al Sistema';
    btnLogin.style.background = 'linear-gradient(135deg, var(--accent-color), #2980b9)';
  }
}

function showError(message) {
  errorMessage.textContent = message;
  const modal = new bootstrap.Modal(errorModal);
  modal.show();
  
  // Efecto de vibración en el modal
  const modalContent = document.querySelector('.modal-content');
  modalContent.style.animation = 'shake 0.5s ease-in-out';
  setTimeout(() => {
    modalContent.style.animation = '';
  }, 500);
}

function shakeForm() {
  const loginCard = document.querySelector('.login-card');
  loginCard.style.animation = 'shake 0.5s ease-in-out';
  setTimeout(() => {
    loginCard.style.animation = '';
  }, 500);
}

function showSuccessEffect() {
  const loginCard = document.querySelector('.login-card');
  btnLogin.innerHTML = '<i class="fas fa-check"></i> ¡Bienvenido!';
  btnLogin.style.background = 'linear-gradient(135deg, var(--success-color), #10b981)';
  
  // Efecto de pulso verde
  loginCard.style.animation = 'successPulse 1s ease-in-out';
  setTimeout(() => {
    loginCard.style.animation = '';
  }, 1000);
}

// Verificar si ya está logueado
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Si ya tiene token, redirigir al dashboard
    window.location.href = '/';
  }
  
  // Efecto de entrada
  const loginCard = document.querySelector('.login-card');
  loginCard.style.opacity = '0';
  loginCard.style.transform = 'translateY(30px)';
  
  setTimeout(() => {
    loginCard.style.transition = 'all 0.6s ease-out';
    loginCard.style.opacity = '1';
    loginCard.style.transform = 'translateY(0)';
  }, 100);
});

// Agregar animaciones CSS adicionales
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  @keyframes successPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
  
  .form-group {
    transition: transform 0.3s ease;
  }
  
  .password-toggle {
    transition: all 0.3s ease;
  }
  
  .password-toggle:hover {
    background: rgba(52, 152, 219, 0.1);
    transform: translateY(-50%) scale(1.1);
  }
`;
document.head.appendChild(style); 