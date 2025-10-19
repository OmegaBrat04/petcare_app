
const db = require('../../config/db');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

const JWT_SECRET = '980h_F3l$K9tB0zPzW!aQnRvYmCgX1dE2pA4sU7jL6iT8oH5eD0fG2uI4vJ6'; 

// --------------------------------- REGISTRO (SIGN UP) ---------------------------------
const signUp = async (req, res) => {
    const { email, password, nombreCompleto } = req.body;

    if (!email || !password || !nombreCompleto) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }

    try {
        const existingUser = await db('Usuarios').where({ email: email }).first();
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado.' });
        }

        //Cifrar la contraseña (Hashing)
        const salt = await bcrypt.genSalt(10);
        const contrasenaHash = await bcrypt.hash(password, salt);

        // Insertar el nuevo usuario en SQL Server
        // Knex devuelve un array con los IDs insertados
        const [idUsuario] = await db('Usuarios').insert({
            NombreCompleto: nombreCompleto,
            Email: email,
            ContrasenaHash: contrasenaHash,
            Rol: 'APP_USER',
        });

        //Generar el JWT Token para iniciar sesión inmediatamente
        const token = jwt.sign(
            { idUsuario: idUsuario, rol: 'APP_USER' },
            JWT_SECRET,
            { expiresIn: '7d' } 
        );
        
        return res.status(201).json({ 
            success: true, 
            message: 'Cuenta creada exitosamente.',
            token: token,
            user: { idUsuario: idUsuario, email: email, rol: 'APP_USER' }
        });

    } catch (error) {
        console.error('Error al registrar usuario en SQL Server:', error);
        // Devuelve un error genérico 500
        return res.status(500).json({ success: false, message: 'Error interno del servidor al crear la cuenta.' });
    }
};

// --------------------------------- LOGIN (PENDIENTE) ---------------------------------
const login = async (req, res) => {
    return res.status(501).json({ success: false, message: 'La función de Inicio de Sesión aún no está implementada.' });
};

module.exports = {
    signUp,
    login,
};