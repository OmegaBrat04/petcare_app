// server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors()); // Permite que tu app de React (en otro puerto) llame a esta API
app.use(express.json()); // Permite leer JSON en las peticiones POST/PUT

// --- Función del Query (la definimos aquí o la importamos) ---
const getCitasQuery = () => {
  return db('citas')
    .join('Mascotas', 'citas.mascota_id', '=', 'Mascotas.IdMascota')
    .join('servicios', 'citas.servicio_id', '=', 'servicios.id')
    .select(
      'citas.id as id',
      'citas.status as status',
      'citas.notas as notas',
      'citas.telefono_contacto as telefono_contacto',
      'citas.fecha_preferida as fecha_preferida',
      'citas.horario_confirmado as horario_confirmado',
      'citas.created_at as created_at',
      'Mascotas.nombre as mascota_nombre',
      'Mascotas.raza as mascota_raza',
      'Mascotas.edad as mascota_edad',
      'Mascotas.peso as mascota_peso',
      'servicios.nombre as servicio_nombre'
    )
    .orderBy('citas.created_at', 'desc');
};


// --- ENDPOINT PRINCIPAL ---
app.get('/api/citas', async (req, res) => {
  try {
    const citas = await getCitasQuery();
    res.json(citas); // Envía los datos como JSON
  } catch (err) {
    console.error("Error al obtener citas:", err);
    res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
});

// --- Iniciar servidor ---
app.listen(PORT, () => {
  console.log(`Servidor de API corriendo en http://localhost:${PORT}`);
});