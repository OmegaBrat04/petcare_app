
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

const mobileRoutes = require('./src/api/mobile/api.routes');
const webRoutes = require('./src/api/web/api.routes'); 

// Middleware para que Express pueda leer JSON (necesario para la API)
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Servir archivos estáticos desde /uploads

// Montar los enrutadores
app.use('/api/mobile', mobileRoutes);
app.use('/api/web', webRoutes); // <-- montado aqui

// Ruta de prueba simple
app.get('/', (req, res) => {
    res.send('Servidor de la API de Veterinarias listo para iniciar la programación.');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${port}`);
});