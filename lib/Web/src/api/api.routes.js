
const express = require('express');
const router = express.Router();
const authController = require('./auth_controller');

// Rutas de Autenticación
router.post('/signup', authController.signUp);
router.post('/login', authController.login);

router.get('/test', (req, res) => {
    res.status(200).json({
        message: 'Ruta API de prueba funcionando correctamente.'
    });
});

module.exports = router;