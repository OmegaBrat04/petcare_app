const db = require('../../../config/db'); // instancia única

// GET /api/mobile/veterinarias
async function listVeterinarias(req, res) {
  try {
    // Traer veterinarias con coordenadas (para el mapa)
    const vets = await db('veterinarias')
      .select(
        'id',
        'nombre',
        'descripcion',
        'direccion',
        'telefono',
        'lat',
        'lon',
        'horario_apertura',
        'horario_cierre',
        'created_at'
      )
      .whereNotNull('lat')
      .whereNotNull('lon');

    if (vets.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Traer servicios activos de todas en un solo query
    const ids = vets.map(v => v.id);
    const servicios = await db('servicios')
      .select('veterinaria_id', 'nombre', 'descripcion', 'precio')
      .whereIn('veterinaria_id', ids)
      .where('activo', 1);

    // Mapear servicios por veterinaria
    const serviciosByVet = servicios.reduce((acc, s) => {
      (acc[s.veterinaria_id] ||= []).push({
        nombre: s.nombre,
        descripcion: s.descripcion,
        precio: s.precio
      });
      return acc;
    }, {});

    const data = vets.map(v => ({
      ...v,
      servicios: serviciosByVet[v.id] || []
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error al obtener veterinarias:', err);
    res.status(500).json({ success: false, mensaje: 'Error al obtener veterinarias' });
  }
}

module.exports = { listVeterinarias };