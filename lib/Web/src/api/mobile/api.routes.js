
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { randomUUID } = require('crypto');

const authController = require('./auth_controller');
const mascotaController = require('./mascota_controller');
const veterinarias = require('./veterinarias');
const requireAuth = require('../../middlewares/auth.middleware');
const citas = require('./citas_controller');
const salud = require('./RegistrosSalud_controller');
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
router.patch('/usuario/telefono', requireAuth, authController.updateTelefono);

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

router.get('/mascotas', requireAuth, mascotaController.getPets)

router.patch(
  "/mascotas/:id",
  requireAuth,
  upload.single("photo"),
  mascotaController.updatePet
);


router.get('/_health', (req, res) => res.json({ ok: true }));
router.get('/veterinarias', veterinarias.listVeterinarias);


router.post('/citas', requireAuth, citas.create);

router.get('/citas', requireAuth, citas.getCitas);         
router.patch('/citas/:id/status', requireAuth, citas.updateStatus);
router.patch('/citas/:id/reagendar', requireAuth, citas.reschedule);
router.delete('/citas/:id', requireAuth, citas.deleteCita);

router.post('/mascotas/:id/salud', requireAuth, salud.crearRegistro);
router.get('/mascotas/:id/salud', requireAuth, salud.listarRegistros);
router.delete('/salud/:id', requireAuth, salud.eliminarRegistro);

module.exports = router;