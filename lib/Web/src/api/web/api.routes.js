const express = require('express');
const router = express.Router();
const db = require('../../../config/db'); // usa la conexión unificada

// POST /api/web/veterinarias/registro  (lo montaremos bajo /api/web)
router.post('/veterinarias/registro', async (req, res) => {
    const payload = req.body;
    const {
        nombreComercial = '',
        descripcionVeterinaria,
        telefonoResponsable = '',
        emailResponsable = '',
        servicios
    } = payload;

    if (!nombreComercial || !emailResponsable) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
    }

    try {
        const trx = await db.transaction();

        try {
            const [veterinariaID] = await trx('veterinarias')
                .insert({
                    nombre: nombreComercial,
                    direccion: 'DIRECCION MOCK',
                    telefono: telefonoResponsable
                })
                .returning('id');

            if (servicios && servicios.length > 0) {
                const serviciosData = servicios
                    .filter(s => s.activo)
                    .map(s => ({
                        veterinaria_id: veterinariaID,
                        nombre: s.nombre || '',
                        descripcion: s.descripcion || descripcionVeterinaria || null,
                        precio: s.precio || 0,
                        activo: s.activo
                    }));

                if (serviciosData.length > 0) {
                    await trx('servicios').insert(serviciosData);
                }
            }

            await trx.commit();
            res.status(201).json({ mensaje: '✅ Registro guardado y en verificación.', id: veterinariaID });
        } catch (txError) {
            await trx.rollback();
            console.error('Error en la transacción:', txError);
            res.status(500).json({ mensaje: '❌ Error en la base de datos. Transacción revertida.' });
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        res.status(503).json({ mensaje: '🚨 No se pudo conectar a la base de datos.' });
    }
});

module.exports = router;