const db = require("../../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  "980h_F3l$K9tB0zPzW!aQnRvYmCgX1dE2pA4sU7jL6iT8oH5eD0fG2uI4vJ6";

// --------------------------------- REGISTRO (SIGN UP) ---------------------------------
const signUp = async (req, res) => {
  const { email, password, nombreCompleto } = req.body;

  if (!email || !password || !nombreCompleto) {
    return res
      .status(400)
      .json({ success: false, message: "Faltan campos obligatorios." });
  }

  try {
    const existingUser = await db("Usuarios").where({ email: email }).first();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "El correo electrónico ya está registrado.",
      });
    }

    //Ciframos la contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(password, salt);

    // Insertar el nuevo usuario en SQL Server
    // Devolvemos un array con el id insertado
    const [idUsuario] = await db("Usuarios").insert({
      NombreCompleto: nombreCompleto,
      Email: email,
      ContrasenaHash: contrasenaHash,
      Rol: "APP_USER",
    });

    //Generar el JWT Token para iniciar sesión inmediatamente
    const token = jwt.sign(
      { idUsuario: idUsuario, rol: "APP_USER" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Cuenta creada exitosamente.",
      token: token,
      user: { idUsuario: idUsuario, email: email, rol: "APP_USER", nombreCompleto: nombreCompleto, telefono: null },
    });
  } catch (error) {
    console.error("Error al registrar usuario en SQL Server:", error);
    // Devuelve un error genérico 500
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al crear la cuenta.",
    });
  }
};

// --------------------------------- LOGIN IMPLEMENTADO ---------------------------------
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Faltan credenciales." });
  }

  try {
    // Buscar usuario por email y verificar que sea un APP_USER
    const user = await db("Usuarios")
      .where({ email: email, Rol: "APP_USER" })
      .first();

    if (!user) {
      // Usuario no encontrado o no es un APP_USER
      return res
        .status(401)
        .json({ success: false, message: "Credenciales inválidas." });
    }

    // Comparar la contraseña (PASSWORD HASHING)
    const passwordMatch = await bcrypt.compare(password, user.ContrasenaHash);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Credenciales inválidas." });
    }

    // Generar el JWT Token
    const token = jwt.sign(
      {
        id: user.IdUsuario,
        email: user.Email,
        nombre: user.Nombre,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("Token generado para userId:", user.IdUsuario);

    // Devolver el token y los datos del usuario (200 OK)
    return res.json({
      success: true,
      token,
      user: {
        id: user.IdUsuario,
        IdUsuario: user.IdUsuario,
        email: user.Email,
        rol: user.Rol || "APP_USER",
        nombreCompleto: user.NombreCompleto || user.Nombre || "",
        telefono: user.Telefono || null,
      },
    });
  } catch (error) {
    console.error("Error durante el inicio de sesión:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }
};

const updateTelefono = async (req, res) => {
  try {
    const userId = (req.user && (req.user.idUsuario || req.user.id)) || null;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const { telefono } = req.body;
    if (!telefono || telefono.toString().trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Teléfono inválido' });
    }

    console.log('📞 [updateTelefono] userId:', userId, 'nuevo:', telefono);

    const rows = await db('Usuarios')
      .where('IdUsuario', userId)
      .update({ Telefono: telefono.toString().trim() });

    if (rows === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const u = await db('Usuarios')
      .where('IdUsuario', userId)
      .first();

    return res.json({
      success: true,
      message: 'Teléfono actualizado',
      usuario: {
        IdUsuario: u.IdUsuario,
        email: u.Email,
        rol: u.Rol,
        nombreCompleto: u.NombreCompleto,
        telefono: u.Telefono || null,
      },
    });
  } catch (e) {
    console.error('updateTelefono error', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

module.exports = {
  signUp,
  login,
  updateTelefono,
};
