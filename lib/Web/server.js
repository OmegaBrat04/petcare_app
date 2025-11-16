require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
app.use(cors()); 

const mobileRoutes = require('./src/api/mobile/api.routes');
const webRoutes = require('./src/api/web/api.routes'); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Montar los enrutadores
app.use('/api/mobile', mobileRoutes);
app.use('/api/web', webRoutes);

// Ruta de prueba simple
app.get('/', (req, res) => {
    res.send('Servidor de la API de Veterinarias listo para iniciar la programación.');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${port}`);
});