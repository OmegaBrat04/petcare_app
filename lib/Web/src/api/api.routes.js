
const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
    res.status(200).json({
        message: 'Ruta API de prueba funcionando correctamente.'
    });
});

module.exports = router;