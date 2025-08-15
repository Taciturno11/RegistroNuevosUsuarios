const { spawn } = require('child_process');
const { getMainIP, printNetworkInfo } = require('./backend-refactorizado/src/utils/networkUtils');
const path = require('path');

console.log('🚀 INICIANDO APLICACIÓN COMPLETA...');
console.log('=====================================');

// Detectar IP principal del servidor
const mainIP = getMainIP();
console.log(`📍 IP Principal detectada: ${mainIP}`);
console.log('=====================================');

// Mostrar todas las IPs disponibles
printNetworkInfo(5000);

// Función para iniciar el backend
function startBackend() {
  console.log('\n🔧 INICIANDO BACKEND...');
  
  const backend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'backend-refactorizado'),
    stdio: 'inherit',
    shell: true
  });

  backend.on('error', (error) => {
    console.error('❌ Error iniciando backend:', error);
  });

  return backend;
}

// Función para iniciar el frontend
function startFrontend() {
  console.log('\n🎨 INICIANDO FRONTEND...');
  
  // Crear archivo de configuración temporal para el frontend
  const frontendConfig = `
// Configuración automática de red - NO EDITAR MANUALMENTE
// Este archivo se genera automáticamente al iniciar la aplicación

window.APP_CONFIG = {
  backendURL: 'http://${mainIP}:5000/api',
  availableURLs: {
    localhost: 'http://localhost:5000/api',
    main: 'http://${mainIP}:5000/api',
    work: 'http://10.8.2.56:5000/api' // IP del trabajo (puede cambiar)
  },
  currentNetwork: '${mainIP.startsWith('10.8.') ? 'work' : 'local'}'
};

console.log('🌐 Configuración de red detectada:', window.APP_CONFIG);
`;

  const fs = require('fs');
  const configPath = path.join(__dirname, 'frontend-react', 'public', 'network-config.js');
  
  try {
    fs.writeFileSync(configPath, frontendConfig);
    console.log('✅ Configuración de red generada');
  } catch (error) {
    console.error('❌ Error generando configuración:', error);
  }

  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend-react'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      REACT_APP_BACKEND_URL: `http://${mainIP}:5000/api`
    }
  });

  frontend.on('error', (error) => {
    console.error('❌ Error iniciando frontend:', error);
  });

  return frontend;
}

// Función principal
async function main() {
  try {
    // Iniciar backend
    const backend = startBackend();
    
    // Esperar un poco para que el backend se inicie
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Iniciar frontend
    const frontend = startFrontend();
    
    // Manejar cierre de procesos
    process.on('SIGINT', () => {
      console.log('\n🛑 Cerrando aplicación...');
      backend.kill('SIGINT');
      frontend.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Cerrando aplicación...');
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error en la aplicación principal:', error);
    process.exit(1);
  }
}

// Ejecutar aplicación
main();
