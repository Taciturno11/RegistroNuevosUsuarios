const express = require('express');
const cors = require('cors');
require('dotenv').config();



const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('src/public'));   // sirve /index.html y demás

// Rutas
app.use('/catalogos', require('./routes/catalogos.routes'));
app.use('/empleados', require('./routes/empleados.routes'));
// debajo de los otros app.use(...)
app.use('/grupos', require('./routes/grupos.routes'));


// Arranque
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 API corriendo en http://${HOST === '0.0.0.0' ? '10.8.6.51' : HOST}:${PORT}`);
});
