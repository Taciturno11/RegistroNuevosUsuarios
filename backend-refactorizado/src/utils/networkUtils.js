const os = require('os');

/**
 * Obtiene todas las IPs disponibles del servidor
 * @returns {Object} Objeto con todas las IPs disponibles
 */
function getServerIPs() {
  const interfaces = os.networkInterfaces();
  const ips = { all: [] };

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
}

/**
 * Obtiene todas las URLs disponibles del servidor
 * Usa el puerto definido por la variable de entorno PORT.
 * @returns {Array} URLs disponibles
 */
function getServerURLs() {
  const resolvedPort = parseInt(process.env.PORT, 10);
  const ips = getServerIPs();
  const urls = [];
  
  ips.all.forEach(ip => urls.push(`http://${ip}:${resolvedPort}`));
  
  return urls;
}

/**
 * Imprime información de red del servidor
 * Usa el puerto definido por la variable de entorno PORT.
 */
function printNetworkInfo() {
  const resolvedPort = parseInt(process.env.PORT, 10);
  const ips = getServerIPs();
  
  console.log('🌐 INFORMACIÓN DE RED DEL SERVIDOR:');
  console.log('=====================================');
  
  if (ips.all.length > 0) {
    console.log('🌐 Todas las IPs disponibles:');
    ips.all.forEach(ip => console.log(`   http://${ip}:${resolvedPort}`));
  }
  
  console.log('=====================================');
}

module.exports = {
  getServerIPs,
  getMainIP,
  getServerURLs,
  printNetworkInfo
};
