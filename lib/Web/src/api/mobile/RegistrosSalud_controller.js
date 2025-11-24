const db = require("../../../config/db");

const crearRegistro = async (req, res) => {
  const { id } = req.params; // mascota
  const idUsuario = req.user.idUsuario;
  const { tipo, fechaAplicacion, producto, lote, veterinaria, adjuntos, notas, regularidadMeses } = req.body;

  if (!tipo || !fechaAplicacion || !producto) {
    return res.status(400).json({ success: false, message: "Faltan campos obligatorios." });
  }
  if (!['vacuna', 'desparasitacion'].includes(tipo)) {
    return res.status(400).json({ success: false, message: "Tipo inválido." });
  }

  try {
    const mascota = await db("Mascotas")
      .where({ IdMascota: id, IdUsuario: idUsuario })
      .first();
    if (!mascota) return res.status(404).json({ success: false, message: "Mascota no encontrada." });

    const regData = {
      IdMascota: id,
      Tipo: tipo,
      FechaAplicacion: fechaAplicacion,
      Producto: producto,
      Lote: lote || null,
      Veterinaria: veterinaria || null,
      Adjuntos: adjuntos ? parseInt(adjuntos, 10) : 0,
      Notas: notas || null,
      RegularidadMeses: regularidadMeses ? parseInt(regularidadMeses, 10) : null,
    };

    const [nuevoId] = await db("RegistrosSalud").insert(regData).returning("Id");

    const registro = await db("RegistrosSalud")
      .where("Id", nuevoId.Id ?? nuevoId)
      .select({
        id: "Id",
        mascotaId: "IdMascota",
        tipo: "Tipo",
        fechaAplicacion: "FechaAplicacion",
        producto: "Producto",
        lote: "Lote",
        veterinaria: "Veterinaria",
        adjuntos: "Adjuntos",
        notas: "Notas",
        regularidadMeses: "RegularidadMeses",
        creadoEn: "CreadoEn",
      }).first();

    res.status(201).json({ success: true, data: registro });
  } catch (e) {
    console.error("crearRegistro error:", e);
    res.status(500).json({ success: false, message: "Error interno." });
  }
};

const listarRegistros = async (req, res) => {
  const { id } = req.params;
  const idUsuario = req.user.idUsuario;
  try {
    const mascota = await db("Mascotas")
      .where({ IdMascota: id, IdUsuario: idUsuario })
      .first();
    if (!mascota) return res.status(404).json({ success: false, message: "Mascota no encontrada." });

    const registros = await db("RegistrosSalud")
      .where("IdMascota", id)
      .orderBy("FechaAplicacion", "desc")
      .select({
        id: "Id",
        mascotaId: "IdMascota",
        tipo: "Tipo",
        fechaAplicacion: "FechaAplicacion",
        producto: "Producto",
        lote: "Lote",
        veterinaria: "Veterinaria",
        adjuntos: "Adjuntos",
        notas: "Notas",
        regularidadMeses: "RegularidadMeses",
      });

    res.json({ success: true, data: registros });
  } catch (e) {
    console.error("listarRegistros error:", e);
    res.status(500).json({ success: false, message: "Error interno." });
  }
};


const eliminarRegistro = async (req, res) => {
  const { id } = req.params; // registro
  const idUsuario = req.user.idUsuario;
  try {
    const reg = await db("RegistrosSalud")
      .where("Id", id)
      .first();
    if (!reg) return res.status(404).json({ success: false, message: "Registro no encontrado." });

    // Verificar que la mascota pertenece al usuario
    const mascota = await db("Mascotas")
      .where({ IdMascota: reg.IdMascota, IdUsuario: idUsuario })
      .first();
    if (!mascota) return res.status(403).json({ success: false, message: "No autorizado." });

    await db("RegistrosSalud").where("Id", id).delete();
    res.json({ success: true, message: "Registro eliminado." });
  } catch (e) {
    console.error("eliminarRegistro error:", e);
    res.status(500).json({ success: false, message: "Error interno." });
  }
};

module.exports = { crearRegistro, listarRegistros, eliminarRegistro };