
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
//const uuid = require('uuid');
const { randomUUID } = require('crypto');
const authController = require('./auth_controller');
const mascotaController = require('./mascota_controller');
const requireAuth = require('../middlewares/auth.middleware');

// Configuracion Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, randomUUID() + ext); 
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

// Rutas de Autenticación
router.post('/signup', authController.signUp);
router.post('/login', authController.login);

router.get('/test', (req, res) => {
    res.status(200).json({
        message: 'Ruta API de prueba funcionando correctamente.'
    });
});

// Rutas de Mascotas
router.post(
    '/register',
    requireAuth,
    upload.single('photo'), 
    mascotaController.registerPet
);

module.exports = router;