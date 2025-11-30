require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
app.use(cors()); 

const mobileRoutes = require('./src/api/mobile/api.routes');
const webRoutes = require('./src/api/web/api.routes');
const veterinariasWebRoutes = require('./src/api/web/veterinarias.routes');
const citasWebRoutes = require('./src/api/web/citas.routes');
const dashboardRoutes = require('./src/api/web/dashboard.routes');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Montar los enrutadores
app.use('/api/mobile', mobileRoutes);
app.use('/api/web', webRoutes);

app.use('/api/veterinarias', veterinariasWebRoutes);
app.use('/api/citas', citasWebRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de prueba simple
app.get('/', (req, res) => {
    res.send('Servidor de la API de Veterinarias listo para iniciar la programación.');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${port}`);
});