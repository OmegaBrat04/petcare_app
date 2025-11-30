const express = require('express');
const router = express.Router();
const db = require('../../../config/db');

router.get('/stats/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;

    try {
        const result = await db('citas as c')
            .join('VeterinariasMaestra as v', 'c.veterinaria_id', '=', 'v.id')
            .where('v.usuario_web_id', usuarioId)
            .where('v.estado_verificacion', 'Aprobada')
            .select(
                db.raw(`SUM(CASE WHEN c.status = 'pending' THEN 1 ELSE 0 END) AS Pendientes`),
                db.raw(`SUM(CASE 
                    WHEN c.status = 'confirmed' 
                    AND c.horario_confirmado IS NOT NULL
                    AND CAST(c.horario_confirmado AS DATE) = CAST(GETDATE() AS DATE) 
                    THEN 1 
                    ELSE 0 
                END) AS CitasHoy`)
            )
            .first();

        res.json({
            citasHoy: result.CitasHoy || 0,
            citasPendientes: result.Pendientes || 0,
            ingresos: 0
        });

    } catch (err) {
        console.error("❌ Error al obtener estadísticas:", err.message);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

module.exports = router;