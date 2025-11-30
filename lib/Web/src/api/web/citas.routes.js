const express = require('express');
const router = express.Router();
const db = require('../../../config/db');


router.get('/:veterinariaId', async (req, res) => {
    const { veterinariaId } = req.params;

    try {
        const citas = await db('citas as c')
            .join('Mascotas as m', 'c.mascota_id', '=', 'm.IdMascota')
            .leftJoin('servicios as s', 'c.servicio_id', '=', 's.id')
            .where('c.veterinaria_id', veterinariaId)
            .select(
                'c.id',
                'm.Nombre as NombreMascota',
                's.Nombre as NombreServicio',
                'c.fecha_preferida',
                'c.status',
                'c.created_at',
                'c.telefono_contacto',
                'c.notas',
                'c.horario_confirmado'
            )
            .orderBy('c.created_at', 'desc');

        const citasFormateadas = citas.map(row => {
            let estadoEsp = 'Pendiente';
            if (row.status === 'confirmed') estadoEsp = 'Confirmada';
            if (row.status === 'cancelled') estadoEsp = 'Rechazada';
            
            // Detectar "Terminada"
            if (row.status === 'cancelled' && row.notas && row.notas.includes('#COMPLETED')) {
                estadoEsp = 'Terminada';
            }

            const notaLimpia = row.notas ? row.notas.replace(' #COMPLETED', '') : null;

            return {
                id: row.id.toString(),
                mascota: row.NombreMascota || 'Desconocida',
                servicio: row.NombreServicio || 'Consulta General',
                fechaPreferida: new Date(row.fecha_preferida).toLocaleDateString('es-MX', { 
                    day: 'numeric', month: 'short', year: 'numeric' 
                }),
                fechaPreferidaRaw: row.fecha_preferida,
                estado: estadoEsp,
                solicitada: new Date(row.created_at).toLocaleDateString('es-MX', { 
                    day: 'numeric', month: 'short', year: 'numeric' 
                }),
                horario_confirmado: row.horario_confirmado,
                detalles: {
                    telefono: row.telefono_contacto || 'No registrado',
                    motivo: notaLimpia || 'Sin detalles adicionales'
                }
            };
        });

        res.json(citasFormateadas);

    } catch (err) {
        console.error("❌ Error al obtener citas:", err.message);
        res.status(500).json({ error: 'Error interno al obtener citas' });
    }
});

router.get('/propietario/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;

    try {
        const citas = await db('citas as c')
            .join('VeterinariasMaestra as v', 'c.veterinaria_id', '=', 'v.id')
            .join('Mascotas as m', 'c.mascota_id', '=', 'm.IdMascota')
            .leftJoin('servicios as s', 'c.servicio_id', '=', 's.id')
            .where('v.usuario_web_id', usuarioId)
            .where('v.estado_verificacion', 'Aprobada')
            .select(
                'c.id',
                'm.Nombre as NombreMascota',
                's.Nombre as NombreServicio',
                'c.fecha_preferida',
                'c.status',
                'c.created_at',
                'c.telefono_contacto',
                'c.notas',
                'c.horario_confirmado',
                'v.nombre_comercial as NombreVeterinaria'
            )
            .orderBy('c.created_at', 'desc');

        const citasFormateadas = citas.map(row => {
            let estadoEsp = 'Pendiente';
            if (row.status === 'confirmed') estadoEsp = 'Confirmada';
            if (row.status === 'cancelled') estadoEsp = 'Rechazada';
            
            if (row.status === 'cancelled' && row.notas && row.notas.includes('#COMPLETED')) {
                estadoEsp = 'Terminada';
            }

            const notaLimpia = row.notas ? row.notas.replace(' #COMPLETED', '') : null;

            return {
                id: row.id.toString(),
                mascota: row.NombreMascota || 'Desconocida',
                servicio: row.NombreServicio || 'Consulta General',
                sucursal: row.NombreVeterinaria,
                fechaPreferida: new Date(row.fecha_preferida).toLocaleDateString('es-MX', { 
                    day: 'numeric', month: 'short', year: 'numeric' 
                }),
                fechaPreferidaRaw: row.fecha_preferida,
                estado: estadoEsp,
                solicitada: new Date(row.created_at).toLocaleDateString('es-MX', { 
                    day: 'numeric', month: 'short', year: 'numeric' 
                }),
                horario_confirmado: row.horario_confirmado,
                detalles: {
                    telefono: row.telefono_contacto || 'No registrado',
                    motivo: notaLimpia || 'Sin detalles adicionales'
                }
            };
        });

        res.json(citasFormateadas);

    } catch (err) {
        console.error("❌ Error al obtener citas del propietario:", err.message);
        res.status(500).json({ error: 'Error interno' });
    }
});

router.put('/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { estado, horario_confirmado } = req.body;

    let dbStatus = undefined;
    let appendNote = "";

    if (estado === 'Confirmada') dbStatus = 'confirmed';
    if (estado === 'Rechazada') dbStatus = 'cancelled';
    if (estado === 'Cancelada') dbStatus = 'cancelled';
    if (estado === 'Terminada') {
        dbStatus = 'cancelled';
        appendNote = " #COMPLETED";
    }

    try {
        const updateData = {
            updated_at: db.fn.now()
        };

        if (dbStatus) {
            updateData.status = dbStatus;
        }

        if (horario_confirmado) {
            let fechaParaDB = horario_confirmado;
            if (horario_confirmado.length === 16) {
                fechaParaDB = `${horario_confirmado}:00-06:00`;
            }
            updateData.horario_confirmado = fechaParaDB;
        }

        await db('citas').where('id', id).update(updateData);

        // Agregar nota si es "Terminada"
        if (appendNote) {
            await db('citas')
                .where('id', id)
                .update({
                    notas: db.raw("ISNULL(notas, '') + ?", [appendNote])
                });
        }

        res.json({ id, message: 'Actualizado correctamente' });

    } catch (err) {
        console.error("❌ Error al actualizar cita:", err.message);
        res.status(500).json({ error: 'Error servidor' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await db('citas').where('id', id).del();

        if (deleted === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        res.json({ message: 'Cita eliminada correctamente' });
    } catch (err) {
        console.error("❌ Error al eliminar cita:", err.message);
        res.status(500).json({ error: 'Error interno al eliminar' });
    }
});

module.exports = router;