const db = require("../../../config/db");

// Helper: normaliza strings
const norm = (s) => (s || "").toString().trim();

exports.create = async (req, res) => {
  console.log("📋 Creando cita - req.user:", req.user);
  console.log("📋 Body recibido:", req.body);
  const userId = req.user && req.user.id;
  try {
    const {
      veterinaria_id,
      mascota_nombre,
      servicio_nombre,
      telefono_contacto,
      fecha_preferida,
      notas,
    } = req.body;

    if (!userId) {
      console.log("❌ userId no encontrado en req.user");
      return res.status(401).json({ success: false, message: "No autorizado" });
    }

    console.log("👤 userId validado:", userId);
    if (!veterinaria_id)
      return res
        .status(400)
        .json({ success: false, message: "veterinaria_id es requerido" });
    if (!mascota_nombre)
      return res
        .status(400)
        .json({ success: false, message: "mascota_nombre es requerido" });
    if (!fecha_preferida)
      return res
        .status(400)
        .json({
          success: false,
          message: "fecha_preferida es requerida (YYYY-MM-DD)",
        });

    // 1) Resolver mascota_id por nombre del usuario
        console.log('🔍 Buscando mascota:', mascota_nombre, 'para usuario:', userId);
    
    const pet = await db('mascotas')
      .select('IdMascota as id')
      .whereRaw('LOWER(Nombre) = LOWER(?)', [norm(mascota_nombre)])
      .andWhere('IdUsuario', userId)
      .first();

    if (!pet) {
      console.log('❌ Mascota no encontrada');
      return res.status(400).json({ success: false, message: `No se encontró la mascota "${mascota_nombre}" para este usuario` });
    }

    console.log('✅ Mascota encontrada, id:', pet.id);

    // 2) Resolver servicio_id (opcional)
    let servicioId = null;
    if (servicio_nombre) {
      const srv = await db('servicios')
        .select('id')
        .where('veterinaria_id', veterinaria_id)
        .andWhereRaw('LOWER(nombre) = LOWER(?)', [norm(servicio_nombre)])
        .first();
      servicioId = srv ? srv.id : null;
      console.log('🔍 Servicio:', servicio_nombre, '→ id:', servicioId);
    }

    // 3) Insertar cita
    const data = {
      mascota_id: pet.id,
      usuario_id: userId,
      veterinaria_id,
      servicio_id: servicioId,
      telefono_contacto: norm(telefono_contacto),
      fecha_preferida,
      horario_confirmado: null,
      status: 'pending',
      notas: norm(notas),
      fuente: 'mobile',
      created_at: new Date(),
      updated_at: new Date(),
    };

    console.log('💾 Insertando cita:', data);

    let newId = null;
    try {
      const inserted = await db('citas').insert(data).returning('id');
      const first = Array.isArray(inserted) ? inserted[0] : inserted;
      newId = typeof first === 'object' ? first.id : first;
    } catch (e) {
      console.log('⚠️ Fallback insert sin .returning()');
      const fallback = await db('citas').insert(data);
      newId = Array.isArray(fallback) ? fallback[0] : null;
    }

    console.log('✅ Cita creada con id:', newId);

    return res.json({ success: true, data: { id: newId } });
  } catch (e) {
    console.error('❌ Error creando cita:', e);
    return res.status(500).json({ success: false, message: 'Error al crear la cita: ' + e.message });
  }
};
