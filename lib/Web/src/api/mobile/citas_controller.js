const db = require("../../../config/db");

// Helper
const norm = (s) => (s || "").toString().trim();

exports.create = async (req, res) => {
  console.log("📋 Creando cita - req.user:", req.user);
  const userId = req.user && (req.user.id || req.user.idUsuario);
  try {
    const {
      veterinaria_id,
      mascota_nombre,
      servicio_nombre,
      telefono_contacto,
      fecha_preferida,
      notas,
    } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "No autorizado" });
    if (!veterinaria_id) return res.status(400).json({ success: false, message: "veterinaria_id es requerido" });
    if (!mascota_nombre) return res.status(400).json({ success: false, message: "mascota_nombre es requerido" });
    if (!fecha_preferida) return res.status(400).json({ success: false, message: "fecha_preferida es requerida (YYYY-MM-DD)" });

    const pet = await db("mascotas")
      .select("IdMascota as id")
      .whereRaw("LOWER(Nombre) = LOWER(?)", [norm(mascota_nombre)])
      .andWhere("IdUsuario", userId)
      .first();

    if (!pet) {
      return res.status(400).json({
        success: false,
        message: `No se encontró la mascota "${mascota_nombre}" para este usuario`,
      });
    }

    let servicioId = null;
    if (servicio_nombre) {
      const srv = await db("servicios")
        .select("id")
        .where("veterinaria_id", veterinaria_id)
        .andWhereRaw("LOWER(nombre) = LOWER(?)", [norm(servicio_nombre)])
        .first();
      servicioId = srv ? srv.id : null;
    }

    const data = {
      mascota_id: pet.id,
      usuario_id: userId,
      veterinaria_id,
      servicio_id: servicioId,
      telefono_contacto: norm(telefono_contacto),
      fecha_preferida,
      horario_confirmado: null,
      status: "pending",
      notas: norm(notas),
      // fuente/updated_at existen en tu tabla; no son obligatorios para leer
      fuente: "mobile",
      created_at: new Date(),
      updated_at: new Date(),
    };

    let newId = null;
    try {
      const inserted = await db("citas").insert(data).returning("id");
      const first = Array.isArray(inserted) ? inserted[0] : inserted;
      newId = typeof first === "object" ? first.id : first;
    } catch (_) {
      const fallback = await db("citas").insert(data);
      newId = Array.isArray(fallback) ? fallback[0] : null;
    }

    return res.json({ success: true, data: { id: newId } });
  } catch (e) {
    console.error("❌ Error creando cita:", e);
    return res.status(500).json({ success: false, message: "Error al crear la cita: " + e.message });
  }
};

exports.getCitas = async (req, res) => {
  try {
    const userId = (req.user && (req.user.id || req.user.idUsuario)) || null;
    if (!userId) return res.status(401).json({ success: false, message: "No autorizado" });

    const { status, mascota_id } = req.query;

    let q = db("citas")
      .select(
        "id",
        "mascota_id",
        "usuario_id",
        "veterinaria_id",
        "servicio_id",
        "telefono_contacto",
        "fecha_preferida",
        "horario_confirmado",
        "status",
        "notas",
        "created_at"
      )
      .where("usuario_id", userId);

    if (status) q = q.andWhere("status", status);
    if (mascota_id) q = q.andWhere("mascota_id", mascota_id);

    const rows = await q.orderBy("fecha_preferida", "desc");

    const data = rows.map((r) => ({
      id: r.id != null ? Number(r.id) : null,
      mascota_id: r.mascota_id != null ? Number(r.mascota_id) : null,
      usuario_id: r.usuario_id != null ? Number(r.usuario_id) : null,
      veterinaria_id: r.veterinaria_id != null ? Number(r.veterinaria_id) : null,
      servicio_id: r.servicio_id != null ? Number(r.servicio_id) : null,
      telefono_contacto: r.telefono_contacto ?? null,
      fecha_preferida: r.fecha_preferida,        
      horario_confirmado: r.horario_confirmado,  
      status: r.status,
      notas: r.notas ?? null,
      created_at: r.created_at,
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error("❌ [getCitas] Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error al obtener citas", error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req.user && (req.user.id || req.user.idUsuario)) || null;

    const valid = ["pending", "confirmed", "cancelled", "completed"];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: "Estado inválido" });
    if (!userId) return res.status(401).json({ success: false, message: "No autorizado" });

    const owned = await db("citas").where({ id }).andWhere("usuario_id", userId).first();
    if (!owned) return res.status(404).json({ success: false, message: "Cita no encontrada" });

    await db("citas").update({ status }).where({ id });
    return res.json({ success: true, message: "Estado actualizado" });
  } catch (error) {
    console.error("❌ [updateStatus]", error);
    return res.status(500).json({ success: false, message: "Error al actualizar" });
  }
};

exports.deleteCita = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user && (req.user.id || req.user.idUsuario)) || null;
    if (!userId) return res.status(401).json({ success: false, message: "No autorizado" });

    const owned = await db("citas").where({ id }).andWhere("usuario_id", userId).first();
    if (!owned) return res.status(404).json({ success: false, message: "Cita no encontrada" });

    await db("citas").where({ id }).del();
    return res.json({ success: true, message: "Cita eliminada" });
  } catch (error) {
    console.error("❌ [deleteCita]", error);
    return res.status(500).json({ success: false, message: "Error al eliminar" });
  }
};

exports.reschedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user && (req.user.id || req.user.idUsuario)) || null;
    if (!userId) return res.status(401).json({ success: false, message: "No autorizado" });

    const { fecha_preferida, horario_confirmado } = req.body;
    if (!fecha_preferida) {
      return res.status(400).json({ success: false, message: "fecha_preferida es requerida (YYYY-MM-DD)" });
    }

    const owned = await db("citas").where({ id }).andWhere("usuario_id", userId).first();
    if (!owned) return res.status(404).json({ success: false, message: "Cita no encontrada" });

    await db("citas")
      .update({
        fecha_preferida,
        horario_confirmado: horario_confirmado || null,
        updated_at: new Date(),
      })
      .where({ id });

    return res.json({ success: true, message: "Cita reagendada" });
  } catch (error) {
    console.error("❌ [reschedule]", error);
    return res.status(500).json({ success: false, message: "Error al reagendar" });
  }
};
