
const express = require('express');
const app = express();
const port = 3000;
const apiRoutes = require('./src/api/api.routes'); 

// Middleware para que Express pueda leer JSON (necesario para la API)
app.use(express.json());

// Montar el enrutador de la API bajo el prefijo /api
app.use('/api', apiRoutes);

// Ruta de prueba simple para verificar que el servidor está activo
app.get('/', (req, res) => {
    res.send('Servidor de la API de Veterinarias listo para iniciar la programación.');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${port}`);
});