const express = require('express');
const cors = require('cors');
require('dotenv').config();

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let name in interfaces) {
    for (let iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('10.')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}




const app = express();
app.use(cors());
app.use(express.json());
// Redirigir la raíz al login si no está autenticado
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static('src/public'));   // sirve /index.html y demás

// Rutas de autenticación
app.use('/api', require('./routes/auth.routes'));

// Rutas
app.use('/catalogos', require('./routes/catalogos.routes'));
app.use('/empleados', require('./routes/empleados.routes'));
app.use('/grupos', require('./routes/grupos.routes'));
app.use('/cese', require('./routes/cese.routes'));
app.use('/justificaciones', require('./routes/justificaciones.routes'));
app.use('/ojt', require('./routes/ojt.routes'));

// API Routes
const excepcionesRoutes = require('./routes/excepciones.routes');
const ojtRoutes = require('./routes/ojt.routes');

app.use('/api/excepciones', excepcionesRoutes);
app.use('/api/ojt', ojtRoutes);

// Arranque
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// HTML Routes
app.get('/cese', (req, res) => {
  res.sendFile(__dirname + '/public/cese.html');
});

app.get('/justificaciones', (req, res) => {
  res.sendFile(__dirname + '/public/justificaciones.html');
});

app.get('/ojt', (req, res) => {
  res.sendFile(__dirname + '/public/ojt.html');
});

app.get('/excepciones', (req, res) => {
  res.sendFile(__dirname + '/public/excepciones.html');
});






app.get('/martin', (req, res) => {
  res.sendFile(__dirname + '/public/martin.html');
});

// Ruta de login
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// Ruta para registrar empleado
app.get('/registrar-empleado', (req, res) => {
  res.sendFile(__dirname + '/public/registrar-empleado.html');
});

// Ruta para actualizar empleado
app.get('/actualizar-empleado', (req, res) => {
  res.sendFile(__dirname + '/public/actualizar-empleado.html');
});








app.listen(PORT, HOST, () => {
  console.log(`🚀 API corriendo en http://${getLocalIP()}:${PORT}`);

});
