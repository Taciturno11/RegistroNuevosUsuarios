const os = require('os');

/**
 * Obtiene todas las IPs disponibles del servidor
 * @returns {Object} Objeto con todas las IPs disponibles
 */
function getServerIPs() {
  const interfaces = os.networkInterfaces();
  const ips = {
    localhost: '127.0.0.1',
    all: []
  };

  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets) {
      // Solo IPv4
      if (net.family === 'IPv4' && !net.internal) {
        ips.all.push(net.address);
      }
    }
  }

  return ips;
}

/**
 * Obtiene la IP principal del servidor (primera IP disponible)
 * @returns {string} IP principal
 */
function getMainIP() {
  const ips = getServerIPs();
  
  if (ips.all.length > 0) {
    console.log('🌐 Usando IP:', ips.all[0]);
    return ips.all[0];
  }
  
  console.log('🏠 No se detectaron IPs externas, usando localhost');
  return '127.0.0.1';
}

/**
 * Obtiene todas las URLs disponibles del servidor
 * @param {number} port Puerto del servidor
 * @returns {Array} URLs disponibles
 */
function getServerURLs(port = 5000) {
  const ips = getServerIPs();
  const urls = [`http://localhost:${port}`];
  
  ips.all.forEach(ip => urls.push(`http://${ip}:${port}`));
  
  return urls;
}

/**
 * Imprime información de red del servidor
 * @param {number} port Puerto del servidor
 */
function printNetworkInfo(port = 5000) {
  const ips = getServerIPs();
  
  console.log('🌐 INFORMACIÓN DE RED DEL SERVIDOR:');
  console.log('=====================================');
  
  console.log('🏠 Localhost:');
  console.log(`   http://localhost:${port}`);
  
  if (ips.all.length > 0) {
    console.log('🌐 Todas las IPs disponibles:');
    ips.all.forEach(ip => console.log(`   http://${ip}:${port}`));
  }
  
  console.log('=====================================');
}

module.exports = {
  getServerIPs,
  getMainIP,
  getServerURLs,
  printNetworkInfo
};
