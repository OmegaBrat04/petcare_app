// /Web/src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '980h_F3l$K9tB0zPzW!aQnRvYmCgX1dE2pA4sU7jL6iT8oH5eD0fG2uI4vJ6'; // Usa tu clave real

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Espera "Bearer [token]"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token inválido o expirado.' });
    }
};
module.exports = requireAuth;