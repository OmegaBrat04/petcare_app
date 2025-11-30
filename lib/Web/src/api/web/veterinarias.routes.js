const express = require('express');
const router = express.Router();
const db = require('../../../config/db');


router.get('/pendientes', async (req, res) => {
    try {
        const result = await db('VeterinariasMaestra')
            .select(
                'id',
                'nombre_comercial',
                db.raw("nombre_responsable + ' ' + apellidos_responsable AS Responsable"),
                'ciudad',
                db.raw("FORMAT(fecha_registro, 'dd MMM yyyy') as FechaSolicitud"),
                'estado_verificacion'
            )
            .where('estado_verificacion', 'Pendiente')
            .orderBy('id', 'desc');

        res.json(result);
    } catch (err) {
        console.error("❌ Error obteniendo pendientes:", err);
        res.status(500).json({ error: 'Error servidor' });
    }
});

router.get('/detalle/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const veterinaria = await db('VeterinariasMaestra')
            .where('id', id)
            .first();

        if (!veterinaria) {
            return res.status(404).json({ error: 'Veterinaria no encontrada' });
        }

        const servicios = await db('servicios')
            .where('veterinaria_id', id);

        // Ya no hay tabla Horarios separada, usamos horario_apertura y horario_cierre
        const horarios = [
            {
                dia: 'Lunes a Viernes',
                apertura: veterinaria.horario_apertura,
                cierre: veterinaria.horario_cierre
            }
        ];

        res.json({
            ...veterinaria,
            servicios,
            horarios
        });
    } catch (err) {
        console.error("❌ Error obteniendo detalle:", err);
        res.status(500).json({ error: 'Error servidor' });
    }
});


router.put('/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado, motivo } = req.body;

    try {
        const updateData = {
            estado_verificacion: nuevoEstado,
            verificado: nuevoEstado === 'Aprobada' ? 1 : 0,
            updated_at: db.fn.now()
        };

        if (nuevoEstado === 'Rechazada' && motivo) {
            updateData.referencias = `[RECHAZADO] ${motivo}`;
        }

        await db('VeterinariasMaestra')
            .where('id', id)
            .update(updateData);

        res.json({ mensaje: `Estado actualizado a ${nuevoEstado}` });
    } catch (err) {
        console.error("❌ Error actualizando estado:", err);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

router.get('/ultima', async (req, res) => {
    try {
        const result = await db('VeterinariasMaestra')
            .select('id', 'nombre_comercial', 'logo', 'estado_verificacion')
            .orderBy('id', 'desc')
            .limit(1)
            .first();

        res.json(result || null);
    } catch (err) {
        console.error("❌ Error obteniendo última:", err);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.get('/propias/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const result = await db('VeterinariasMaestra')
            .select(
                'id',
                'nombre_comercial',
                'logo',
                'estado_verificacion',
                'ciudad',
                'referencias' // Aquí estaría el motivo de rechazo si existe
            )
            .where('usuario_web_id', usuarioId)
            .orderBy('id', 'desc');

        res.json(result);
    } catch (err) {
        console.error("❌ Error obteniendo lista propia:", err);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

router.put('/registro/:id', async (req, res) => {
    const { id } = req.params;
    const {
        nombreComercial, razonSocial, rfc, descripcion, categorias,
        nombreResponsable, apellidosResponsable, emailResponsable, telefonoResponsable, puesto, documentoIdentidad,
        calle, numeroExterior, colonia, ciudad, estado, codigoPostal, referencias,
        telefonoClinica, whatsapp, emailClinica, sitioWeb, facebook, instagram,
        logo, servicios
    } = req.body;

    const trx = await db.transaction();

    try {
        // Construir dirección completa
        const direccionCompleta = `${calle} ${numeroExterior}, ${colonia}, ${ciudad}, ${estado}, ${codigoPostal}`.trim();

        const updateData = {
            nombre_comercial: nombreComercial,
            razon_social: razonSocial,
            rfc: rfc,
            descripcion: descripcion,
            categorias: Array.isArray(categorias) ? categorias.join(', ') : categorias,
            nombre_responsable: nombreResponsable,
            apellidos_responsable: apellidosResponsable,
            email_responsable: emailResponsable,
            telefono_responsable: telefonoResponsable,
            puesto: puesto,
            documento_identidad: documentoIdentidad,
            calle: calle,
            numero_exterior: numeroExterior,
            colonia: colonia,
            ciudad: ciudad,
            estado: estado,
            codigo_postal: codigoPostal,
            referencias: referencias,
            direccion_completa: direccionCompleta,
            telefono_clinica: telefonoClinica,
            whatsapp: whatsapp,
            email_clinica: emailClinica,
            sitio_web: sitioWeb,
            facebook: facebook,
            instagram: instagram,
            estado_verificacion: 'Pendiente', // Vuelve a pendiente al editar
            updated_at: db.fn.now()
        };

        // Solo actualizar logo si viene en base64
        if (logo && logo.startsWith('data:image')) {
            updateData.logo = logo;
        }

        await trx('VeterinariasMaestra')
            .where('id', id)
            .update(updateData);

        // Actualizar servicios
        if (servicios && servicios.length > 0) {
            await trx('servicios').where('veterinaria_id', id).del();

            const serviciosData = servicios
                .filter(s => s.activo)
                .map(s => ({
                    veterinaria_id: id,
                    nombre: s.Nombre || s.nombre,
                    precio: s.Precio || s.precio || 0,
                    descripcion: descripcion || '',
                    activo: 1
                }));

            if (serviciosData.length > 0) {
                await trx('servicios').insert(serviciosData);
            }
        }

        await trx.commit();
        res.json({ success: true, message: 'Actualización exitosa' });

    } catch (error) {
        await trx.rollback();
        console.error("Error en transacción Update:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;