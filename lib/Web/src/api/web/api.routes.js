const express = require("express");
const router = express.Router();
const db = require("../../../config/db"); // usa la conexión unificada
const geocoder = require("../../servicios/geocoder");

// --- Rutas existentes de tu colega ---

router.get("/_geocode", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q)
      return res.status(400).json({ ok: false, error: "Falta parámetro q" });
    const r = await geocoder.geocode(q);
    res.json({ ok: true, result: r });
  } catch (e) {
    console.error("Geocode test error:", e);
    res.status(500).json({ ok: false, error: e.message || "error" });
  }
});

router.post("/veterinarias/registro", async (req, res) => {
  const payload = req.body;
  const {
    // Responsable
    nombreResponsable = "",
    apellidosResponsable = "",
    emailResponsable = "",
    telefonoResponsable = "",
    documentoIdentidad = "",
    puesto = "",

    // Veterinaria
    nombreComercial = "",
    descripcionVeterinaria = "",
    horaApertura = "",
    horaCierre = "",
    razonSocial = "",
    rfc = "",

    // Ubicación
    calle = "",
    numeroExterior = "",
    colonia = "",
    ciudad = "",
    estado = "",
    codigoPostal = "",
    referencias = "",

    // Contacto
    telefonoClinica = "",
    whatsapp = "",
    emailClinica = "",
    sitioWeb = "",
    facebook = "",
    instagram = "",

    // Servicios y Categorías
    servicios = [],
    categorias = [],

    // Logo y Usuario
    logoUrl = "",
    usuarioWebID = null,
  } = payload;

  // Validación básica
  if (!nombreComercial || !emailResponsable || !calle || !ciudad) {
    return res.status(400).json({
      mensaje:
        "Faltan campos obligatorios: nombre comercial, email, calle y ciudad.",
    });
  }

  try {
    // 1. CONSTRUIR DIRECCIÓN COMPLETA
    const direccionCompleta =
      `${calle} ${numeroExterior}, ${colonia}, ${ciudad}, ${estado}, ${codigoPostal}`.trim();
    console.log("📍 Dirección a geocodificar:", direccionCompleta);

    // 2. GEOCODIFICAR
    let lat = null;
    let lon = null;
    try {
      const geoResult = await geocoder.geocode(direccionCompleta);
      if (geoResult && geoResult.length > 0) {
        lat = geoResult[0].latitude;
        lon = geoResult[0].longitude;
        console.log(`✅ Coordenadas obtenidas: lat=${lat}, lon=${lon}`);
      }
    } catch (geoErr) {
      console.warn("⚠️ Error en geocodificación:", geoErr.message);
    }

    const trx = await db.transaction();

    try {
      // 3. INSERTAR EN VeterinariasMaestra (CAMBIO PRINCIPAL)
      const [inserted] = await trx("VeterinariasMaestra")
        .insert({
          // IDs y Referencias
          usuario_web_id: usuarioWebID,

          // Información Básica
          nombre_comercial: nombreComercial,
          razon_social: razonSocial || null,
          rfc: rfc || null,
          descripcion: descripcionVeterinaria || null,
          categorias: Array.isArray(categorias)
            ? categorias.join(", ")
            : categorias,

          // Responsable
          nombre_responsable: nombreResponsable,
          apellidos_responsable: apellidosResponsable,
          email_responsable: emailResponsable,
          telefono_responsable: telefonoResponsable,
          puesto: puesto || null,
          documento_identidad: documentoIdentidad || null,

          // Ubicación
          calle: calle,
          numero_exterior: numeroExterior,
          colonia: colonia,
          ciudad: ciudad,
          estado: estado,
          codigo_postal: codigoPostal,
          referencias: referencias || null,
          direccion_completa: direccionCompleta,
          lat: lat,
          lon: lon,

          // Contacto
          telefono_clinica: telefonoClinica || telefonoResponsable,
          email_clinica: emailClinica || emailResponsable,
          whatsapp: whatsapp || null,
          sitio_web: sitioWeb || null,
          facebook: facebook || null,
          instagram: instagram || null,

          // Horarios
          horario_apertura: horaApertura || null,
          horario_cierre: horaCierre || null,

          // Logo y Estado
          logo: logoUrl || null,
          estado_publicacion: "borrador",
          estado_verificacion: "Pendiente",
          verificado: 0,

          // Fechas
          fecha_registro: db.fn.now(),
          updated_at: db.fn.now(),
        })
        .returning("id");

      const veterinariaID =
        typeof inserted === "object" ? inserted.id : inserted;
      console.log(`✅ Veterinaria insertada con ID: ${veterinariaID}`);

      // 5. INSERTAR SERVICIOS
      if (servicios && servicios.length > 0) {
        const serviciosData = servicios
          .filter((s) => s.activo)
          .map((s) => ({
            veterinaria_id: veterinariaID,
            nombre: s.nombre || "",
            descripcion: s.descripcion || descripcionVeterinaria || null,
            precio: s.precio || 0,
            activo: s.activo,
          }));

        if (serviciosData.length > 0) {
          await trx("servicios").insert(serviciosData);
        }
      }

      await trx.commit();

      res.status(201).json({
        mensaje: "✅ Registro guardado exitosamente.",
        id: veterinariaID,
        coordenadas: lat && lon ? { lat, lon } : null,
        advertencia:
          !lat || !lon
            ? "No se pudieron obtener coordenadas. Verifica la dirección."
            : null,
      });
    } catch (txError) {
      await trx.rollback();
      console.error("❌ Error en transacción:", txError);
      res.status(500).json({
        mensaje: "❌ Error al guardar en la base de datos.",
        detalle: txError.message,
      });
    }
  } catch (error) {
    console.error("❌ Error general:", error);
    res.status(503).json({
      mensaje: "🚨 Error en el servidor.",
      detalle: error.message,
    });
  }
});

// --- INICIO DE NUESTRO CÓDIGO AÑADIDO ---

// Función de query para obtener citas con JOINs
const getCitasQuery = () => {
  return db("citas")
    .join("Mascotas", "citas.mascota_id", "=", "Mascotas.IdMascota")
    .join("servicios", "citas.servicio_id", "=", "servicios.id")
    .select(
      "citas.id as id",
      "citas.status as status",
      "citas.notas as notas",
      "citas.telefono_contacto as telefono_contacto",
      "citas.fecha_preferida as fecha_preferida",
      "citas.horario_confirmado as horario_confirmado",
      "citas.created_at as created_at",
      "Mascotas.nombre as mascota_nombre",
      "Mascotas.raza as mascota_raza",
      "Mascotas.edad as mascota_edad",
      "Mascotas.peso as mascota_peso",
      "servicios.nombre as servicio_nombre"
    )
    .orderBy("citas.created_at", "desc");
};

// Endpoint para obtener todas las citas (para nuestra vista)
router.get("/citas", async (req, res) => {
  try {
    const citas = await getCitasQuery();
    res.json(citas);
  } catch (err) {
    console.error("Error al obtener citas:", err);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: err.message });
  }
});

// --- FIN DE NUESTRO CÓDIGO AÑADIDO ---

// ...existing code...

// =================================================================
// AUTENTICACIÓN (Login/Registro)
// =================================================================

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Datos incompletos",
    });
  }

  try {
    const usuario = await db("UsuariosWeb")
      .where("Email", email)
      .select("IdUsuarioWeb", "NombreCompleto", "ContrasenaHash", "Rol")
      .first();

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // ⚠️ IMPORTANTE: En producción, usa bcrypt.compare()
    if (password !== usuario.ContrasenaHash) {
      return res.status(401).json({
        success: false,
        message: "Contraseña incorrecta",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login OK",
      idUsuario: usuario.IdUsuarioWeb,
      rol: usuario.Rol,
      nombre: usuario.NombreCompleto,
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({
      success: false,
      message: "Error de servidor",
    });
  }
});

router.post("/auth/register", async (req, res) => {
  const { NombreCompleto, Email, ContrasenaHash } = req.body;

  if (!NombreCompleto || !Email || !ContrasenaHash) {
    return res.status(400).json({
      success: false,
      message: "Datos incompletos",
    });
  }

  try {
    // Verificar si el email ya existe
    const existeUsuario = await db("UsuariosWeb").where("Email", Email).first();

    if (existeUsuario) {
      return res.status(409).json({
        success: false,
        message: "El email ya está registrado.",
      });
    }

    // Insertar nuevo usuario
    const [nuevoUsuario] = await db("UsuariosWeb")
      .insert({
        NombreCompleto,
        Email,
        ContrasenaHash, // ⚠️ En producción, hashear con bcrypt
        Rol: "Propietario",
        FechaRegistro: db.fn.now(),
      })
      .returning("IdUsuarioWeb");

    const idUsuario =
      typeof nuevoUsuario === "object"
        ? nuevoUsuario.IdUsuarioWeb
        : nuevoUsuario;

    res.status(201).json({
      success: true,
      message: "Usuario registrado con éxito.",
      idUsuario,
    });
  } catch (err) {
    console.error("❌ Error en registro:", err);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      detalle: err.message,
    });
  }
});

// ...existing code...

module.exports = router;
