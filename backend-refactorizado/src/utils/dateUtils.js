/**
 * Utilidades para manejo de fechas sin problemas de zona horaria
 */

/**
 * Formatea una fecha a string YYYY-MM-DD usando la zona horaria local
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
exports.formatearFechaLocal = (fecha) => {
  if (!fecha) return null;
  
  try {
    const fechaObj = new Date(fecha);
    
    // Verificar que la fecha sea válida
    if (isNaN(fechaObj.getTime())) {
      return null;
    }
    
    // Usar métodos locales para evitar problemas de zona horaria
    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return null;
  }
};

/**
 * Formatea una fecha para mostrar en español
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en español
 */
exports.formatearFechaEspanol = (fecha) => {
  if (!fecha) return 'No especificada';
  
  try {
    const fechaObj = new Date(fecha);
    
    // Verificar que la fecha sea válida
    if (isNaN(fechaObj.getTime())) {
      return 'Fecha inválida';
    }
    
    // Formatear en español
    return fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formateando fecha en español:', error);
    return 'Error en fecha';
  }
};

