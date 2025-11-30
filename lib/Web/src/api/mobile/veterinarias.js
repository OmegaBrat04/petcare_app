const db = require("../../../config/db"); // instancia única

// GET /api/mobile/veterinarias
async function listVeterinarias(req, res) {
  try {
    const vets = await db("VeterinariasMaestra")
      .select(
        "id",
        "nombre_comercial as nombre", 
        "descripcion",
        "direccion_completa as direccion", 
        "telefono_clinica as telefono", 
        "lat",
        "lon",
        "horario_apertura", 
        "horario_cierre", 
        "fecha_registro as created_at" 
      )
      .where("estado_verificacion", "Aprobada") 
      .where("verificado", 1) 
      .whereNotNull("lat")
      .whereNotNull("lon");

    if (vets.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Traer servicios activos de todas en un solo query
    const ids = vets.map((v) => v.id);
    const servicios = await db("servicios")
      .select("veterinaria_id", "nombre", "descripcion", "precio")
      .whereIn("veterinaria_id", ids)
      .where("activo", 1);

    // Mapear servicios por veterinaria
    const serviciosByVet = servicios.reduce((acc, s) => {
      (acc[s.veterinaria_id] ||= []).push({
        nombre: s.nombre,
        descripcion: s.descripcion,
        precio: s.precio,
      });
      return acc;
    }, {});

    const data = vets.map((v) => ({
      ...v,
      servicios: serviciosByVet[v.id] || [],
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error al obtener veterinarias:", err);
    res
      .status(500)
      .json({ success: false, mensaje: "Error al obtener veterinarias" });
  }
}

module.exports = { listVeterinarias };
