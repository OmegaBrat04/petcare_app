const express = require('express');
const router = express.Router();
const db = require('../../../config/db'); // usa la conexión unificada
const geocoder = require('../../servicios/geocoder');

// --- Rutas existentes de tu colega ---

router.get('/_geocode', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ ok: false, error: 'Falta parámetro q' });
    const r = await geocoder.geocode(q);
    res.json({ ok: true, result: r });
  } catch (e) {
    console.error('Geocode test error:', e);
    res.status(500).json({ ok: false, error: e.message || 'error' });
  }
});


router.post('/veterinarias/registro', async (req, res) => {
    const payload = req.body;
    const {
        // Responsable
        nombreResponsable = '',
        apellidosResponsable = '',
        emailResponsable = '',
        telefonoResponsable = '',
        
        // Veterinaria
        nombreComercial = '',
        descripcionVeterinaria = '',
        horaApertura = '',
        horaCierre = '',
        
        // Ubicación
        calle = '',
        numeroExterior = '',
        colonia = '',
        ciudad = '',
        estado = '',
        codigoPostal = '',
        referencias = '',
        
        // Contacto
        telefonoClinica = '',
        whatsapp = '',
        emailClinica = '',
        sitioWeb = '',
        facebook = '',
        instagram = '',
        
        // Servicios
        servicios = [],
        
        // Categorías
        categorias = [] // Ej: ['Clínica', '24/7']
    } = payload;

    // Validación básica
    if (!nombreComercial || !emailResponsable || !calle || !ciudad) {
        return res.status(400).json({ 
            mensaje: 'Faltan campos obligatorios: nombre comercial, email, calle y ciudad.' 
        });
    }

    try {
        // 1. CONSTRUIR DIRECCIÓN COMPLETA
        const direccionCompleta = `${calle} ${numeroExterior}, ${colonia}, ${ciudad}, ${estado}, ${codigoPostal}, México`;
        
        // 2. GEOCODIFICAR (obtener lat/lon)
        let lat = null;
        let lon = null;
        
        try {
            console.log('🔍 Geocodificando:', direccionCompleta);
            const geoResult = await geocoder.geocode(direccionCompleta);
            
            if (geoResult && geoResult.length > 0) {
                lat = geoResult[0].latitude;
                lon = geoResult[0].longitude;
                console.log(`✅ Coordenadas: ${lat}, ${lon}`);
            } else {
                console.warn('⚠️ No se encontraron coordenadas para esta dirección');
            }
        } catch (geoError) {
            console.warn('⚠️ Error en geocodificación:', geoError.message);
            // Continúa sin coordenadas
        }

        const trx = await db.transaction();

        try {
            // 3. INSERTAR VETERINARIA
            const [inserted] = await trx('veterinarias')
                .insert({
                    nombre: nombreComercial,
                    descripcion: descripcionVeterinaria,
                    direccion: direccionCompleta,
                    telefono: telefonoClinica || telefonoResponsable,
                    email: emailClinica || emailResponsable,
                    lat: lat,
                    lon: lon,
                    horario_apertura: horaApertura || null,
                    horario_cierre: horaCierre || null,
                    whatsapp: whatsapp || null,
                    sitio_web: sitioWeb || null,
                    facebook: facebook || null,
                    instagram: instagram || null,
                    estado_publicacion: 'borrador',
                    verificado: 0 // Corregido (decía Cita: 0)
                })
                .returning('id');

            const veterinariaID = typeof inserted === 'object' ? inserted.id : inserted;
            console.log(`✅ Veterinaria insertada con ID: ${veterinariaID}`);

            // 4. INSERTAR CATEGORÍAS
            if (categorias && categorias.length > 0) {
                const categoriasData = categorias.map(cat => ({
                    veterinaria_id: veterinariaID,
                    categoria: cat
                }));
                await trx('categorias_veterinaria').insert(categoriasData);
            }

            // 5. INSERTAR SERVICIOS
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
            
            res.status(201).json({ 
                mensaje: '✅ Registro guardado exitosamente.',
                id: veterinariaID,
                coordenadas: lat && lon ? { lat, lon } : null,
                advertencia: !lat || !lon ? 'No se pudieron obtener coordenadas. Verifica la dirección.' : null
            });

        } catch (txError) {
            await trx.rollback();
            console.error('❌ Error en transacción:', txError);
            res.status(500).json({ 
                mensaje: '❌ Error al guardar en la base de datos.',
                detalle: txError.message 
            });
        }

    } catch (error) {
        console.error('❌ Error general:', error);
        res.status(503).json({ 
            mensaje: '🚨 Error en el servidor.',
            detalle: error.message 
        });
    }
});

// --- INICIO DE NUESTRO CÓDIGO AÑADIDO ---

// Función de query para obtener citas con JOINs
const getCitasQuery = () => {
  return db('citas')
    .join('Mascotas', 'citas.mascota_id', '=', 'Mascotas.IdMascota')
    .join('servicios', 'citas.servicio_id', '=', 'servicios.id')
    .select(
      'citas.id as id',
      'citas.status as status',
      'citas.notas as notas',
      'citas.telefono_contacto as telefono_contacto',
      'citas.fecha_preferida as fecha_preferida',
      'citas.horario_confirmado as horario_confirmado',
      'citas.created_at as created_at',
      'Mascotas.nombre as mascota_nombre',
      'Mascotas.raza as mascota_raza',
      'Mascotas.edad as mascota_edad',
      'Mascotas.peso as mascota_peso',
      'servicios.nombre as servicio_nombre'
    )
    .orderBy('citas.created_at', 'desc');
};

// Endpoint para obtener todas las citas (para nuestra vista)
router.get('/citas', async (req, res) => {
  try {
    const citas = await getCitasQuery();
    res.json(citas);
  } catch (err) {
    console.error("Error al obtener citas:", err);
    res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
});

// --- FIN DE NUESTRO CÓDIGO AÑADIDO ---


module.exports = router;