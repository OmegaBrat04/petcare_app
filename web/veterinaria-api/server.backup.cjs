const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const dotenv = require('dotenv');

// Cargar variables de entorno (.env)
dotenv.config();

const app = express();
const port = 3001;

// --- Configuración de Base de Datos SQL Server ---
const dbConfig = {
    server: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: {
        trustServerCertificate: true,
        enableArithAbort: true,
        encrypt: false,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
    }
};

// --- FUNCIÓN DE PRUEBA DE CONEXIÓN INICIAL ---
async function testDbConnection() {
    console.log('Intentando conectar a SQL Server...');
    try {
        const pool = await sql.connect(dbConfig);
        console.log('✅ Conexión a SQL Server exitosa.');
        await pool.close();
        return true;
    } catch (err) {
        console.error('\n🛑 ERROR CRÍTICO DE CONEXIÓN AL INICIAR SERVIDOR:');
        console.error('VERIFIQUE CREDENCIALES EN EL ARCHIVO .env');
        console.error('DETALLE:', err.message);
        console.error('----------------------------------------------------');
        process.exit(1);
    }
}

// --- Middleware ---
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '50mb' }));


// =================================================================
// SECCIÓN 1: AUTENTICACIÓN (Login/Registro) - (¡Esta ya funcionaba!)
// =================================================================

app.post('/api/web/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Datos incompletos' });

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT IdUsuarioWeb, NombreCompleto, ContrasenaHash, Rol FROM dbo.UsuariosWeb WHERE Email = @Email');

        if (result.recordset.length === 0) {
            await pool.close();
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        const usuario = result.recordset[0];
        if (password !== usuario.ContrasenaHash) {
            await pool.close();
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
        await pool.close();
        // Devolvemos el ID del usuario para usarlo en el frontend
        res.status(200).json({ success: true, message: 'Login OK', idUsuario: usuario.IdUsuarioWeb, rol: usuario.Rol, nombre: usuario.NombreCompleto });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error de servidor' });
    }
});

app.post('/api/web/auth/register', async (req, res) => {
    const { NombreCompleto, Email, ContrasenaHash } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const request = new sql.Request(pool);
        request.input('Email', sql.NVarChar, Email);
        const checkEmail = await request.query('SELECT IdUsuarioWeb FROM dbo.UsuariosWeb WHERE Email = @Email');

        if (checkEmail.recordset.length > 0) {
            await pool.close();
            return res.status(409).json({ success: false, message: 'El email ya está registrado.' });
        }

        request.input('NombreCompleto', sql.NVarChar, NombreCompleto);
        request.input('ContrasenaHash', sql.NVarChar, ContrasenaHash);
        request.input('Rol', sql.NVarChar, 'Propietario');

        const result = await request.query(`INSERT INTO dbo.UsuariosWeb (NombreCompleto, Email, ContrasenaHash, Rol) OUTPUT inserted.IdUsuarioWeb VALUES (@NombreCompleto, @Email, @ContrasenaHash, @Rol)`);
        await pool.close();
        res.status(201).json({ success: true, message: 'Usuario registrado con éxito.', idUsuario: result.recordset[0].IdUsuarioWeb });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al registrar usuario' });
    }
});


// =================================================================
// SECCIÓN 2: GESTIÓN DE VETERINARIAS (AQUÍ ESTABAN LOS ERRORES)
// =================================================================

app.get('/api/veterinarias/pendientes', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT 
                id, 
                nombre_comercial, 
                nombre_responsable + ' ' + apellidos_responsable AS Responsable, 
                ciudad, 
                FORMAT(fecha_registro, 'dd MMM yyyy') as FechaSolicitud, 
                estado_verificacion 
            FROM dbo.veterinarias 
            WHERE estado_verificacion = 'Pendiente' 
            ORDER BY id DESC
        `);
        await pool.close();
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error obteniendo pendientes:", err);
        res.status(500).json({ error: 'Error servidor' });
    }
});

app.get('/api/veterinarias/detalle/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        const v = await pool.request().input('id', sql.Int, id).query('SELECT * FROM dbo.veterinarias WHERE id = @id');
        if (v.recordset.length === 0) return res.status(404).json({ error: 'No existe' });

        // Usamos los nombres correctos de las tablas (servicios, Horarios)
        const s = await pool.request().input('id', sql.Int, id).query('SELECT * FROM dbo.servicios WHERE veterinaria_id = @id');
        const h = await pool.request().input('id', sql.Int, id).query('SELECT * FROM dbo.Horarios WHERE veterinaria_id = @id');

        await pool.close();
        res.json({ ...v.recordset[0], servicios: s.recordset, horarios: h.recordset });
    } catch (err) {
        console.error("❌ Error obteniendo detalle:", err);
        res.status(500).json({ error: 'Error servidor' });
    }
});

app.post('/api/veterinarias/registro', async (req, res) => {
    const payload = req.body;
    const { nombreResponsable, apellidosResponsable, emailResponsable, telefonoResponsable, puesto, documentoIdentidad, nombreComercial, razonSocial, rfc, descripcionVeterinaria, categorias, calle, numeroExterior, colonia, ciudad, estado, codigoPostal, referencias, telefonoClinica, whatsapp, emailClinica, sitioWeb, facebook, instagram, servicios, horarios, logoUrl, usuarioWebID } = payload;

    try {
        const pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const requestVet = new sql.Request(transaction);

            // Mapeo de V2 (Payload) a V1 (Base de Datos)
            requestVet.input('NomCom', sql.NVarChar, nombreComercial);
            requestVet.input('RazSoc', sql.NVarChar, razonSocial);
            requestVet.input('RFC', sql.NVarChar, rfc);
            requestVet.input('Desc', sql.NVarChar, descripcionVeterinaria);
            requestVet.input('Cat', sql.NVarChar, categorias);
            requestVet.input('NomResp', sql.NVarChar, nombreResponsable);
            requestVet.input('ApeResp', sql.NVarChar, apellidosResponsable);
            requestVet.input('EmailResp', sql.NVarChar, emailResponsable);
            requestVet.input('TelResp', sql.NVarChar, telefonoResponsable);
            requestVet.input('Puesto', sql.NVarChar, puesto);
            requestVet.input('DocID', sql.NVarChar, documentoIdentidad);
            requestVet.input('Calle', sql.NVarChar, calle);
            requestVet.input('NumExt', sql.NVarChar, numeroExterior);
            requestVet.input('Col', sql.NVarChar, colonia);
            requestVet.input('Ciu', sql.NVarChar, ciudad);
            requestVet.input('Edo', sql.NVarChar, estado);
            requestVet.input('CP', sql.NVarChar, codigoPostal);
            requestVet.input('Ref', sql.NVarChar, referencias);
            requestVet.input('TelClin', sql.NVarChar, telefonoClinica);
            requestVet.input('Whats', sql.NVarChar, whatsapp);
            requestVet.input('EmailClin', sql.NVarChar, emailClinica);
            requestVet.input('Web', sql.NVarChar, sitioWeb);
            requestVet.input('Face', sql.NVarChar, facebook);
            requestVet.input('Insta', sql.NVarChar, instagram);
            requestVet.input('Logo', sql.NVarChar, logoUrl);
            requestVet.input('UID', sql.Int, usuarioWebID); // usuario_web_id

            // Usamos los nombres de columna V1 (minúsculas)
            const resultVet = await requestVet.query(`
                INSERT INTO dbo.veterinarias (
                    nombre_comercial, razon_social, rfc, descripcion, categorias,
                    nombre_responsable, apellidos_responsable, email_responsable, telefono_responsable, puesto, documento_identidad,
                    calle, numero_exterior, colonia, ciudad, estado, codigo_postal, referencias,
                    telefono_clinica, whatsapp, email_clinica, sitio_web, facebook, instagram,
                    logo, estado_verificacion, usuario_web_id
                ) 
                OUTPUT inserted.id
                VALUES (
                    @NomCom, @RazSoc, @RFC, @Desc, @Cat,
                    @NomResp, @ApeResp, @EmailResp, @TelResp, @Puesto, @DocID,
                    @Calle, @NumExt, @Col, @Ciu, @Edo, @CP, @Ref,
                    @TelClin, @Whats, @EmailClin, @Web, @Face, @Insta,
                    @Logo, 'Pendiente', @UID
                )
            `);

            const veterinariaID = resultVet.recordset[0].id;
            console.log(`✅ Veterinaria creada en BD con ID: ${veterinariaID}`);

            if (servicios && servicios.length > 0) {
                for (const serv of servicios) {
                    const reqServ = new sql.Request(transaction);
                    reqServ.input('Vid', sql.Int, veterinariaID).input('Nom', sql.NVarChar, serv.nombre).input('Pre', sql.Decimal(10, 2), serv.precio).input('Desc', sql.NVarChar, serv.descripcion || '');
                    await reqServ.query(`INSERT INTO dbo.servicios (veterinaria_id, nombre, precio, descripcion, activo) VALUES (@Vid, @Nom, @Pre, @Desc, 1)`);
                }
            }

            if (horarios && horarios.length > 0) {
                for (const hor of horarios) {
                    const reqHor = new sql.Request(transaction);
                    reqHor.input('Vid', sql.Int, veterinariaID).input('Dia', sql.NVarChar, hor.dia).input('Ape', sql.NVarChar, hor.apertura).input('Cie', sql.NVarChar, hor.cierre);
                    await reqHor.query(`INSERT INTO dbo.Horarios (veterinaria_id, dia, apertura, cierre) VALUES (@Vid, @Dia, @Ape, @Cie)`);
                }
            }

            await transaction.commit();
            pool.close();
            res.status(201).json({ mensaje: 'Registro exitoso', id: veterinariaID });

        } catch (txError) {
            await transaction.rollback();
            pool.close();
            console.error("❌ Error en transacción SQL:", txError);
            res.status(500).json({ mensaje: 'Error guardando datos', error: txError.message });
        }
    } catch (err) {
        console.error("❌ Error general de conexión:", err);
        res.status(500).json({ mensaje: 'Error de servidor' });
    }
});

app.put('/api/veterinarias/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado, motivo } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request()
            .input('id', sql.Int, id)
            .input('estado', sql.NVarChar, nuevoEstado);

        let query = "UPDATE Veterinarias SET EstadoVerificacion = @estado";

        if (motivo) {
            request.input('motivo', sql.NVarChar, motivo);
            query += ", MotivoRechazo = @motivo";
        } else if (nuevoEstado === 'Aprobada') {
            query += ", MotivoRechazo = NULL";
        }

        query += " WHERE ID = @id";

        await request.query(query);
        await pool.close();

        res.json({ mensaje: `Estado actualizado a ${nuevoEstado}` });

    } catch (err) {
        console.error("❌ Error actualizando estado:", err);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

app.get('/api/veterinarias/ultima', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT TOP 1 
                id, nombre_comercial, logo, estado_verificacion 
            FROM dbo.veterinarias 
            ORDER BY id DESC
        `);
        if (result.recordset.length > 0) { res.json(result.recordset[0]); } else { res.json(null); }
    } catch (err) {
        console.error("❌ Error obteniendo última:", err);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

app.get('/api/veterinarias/propias/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid', sql.Int, usuarioId)
            .query(`
                SELECT ID, NombreComercial, Logo, EstadoVerificacion, Ciudad, MotivoRechazo
                FROM Veterinarias 
                WHERE UsuarioWebID = @uid
                ORDER BY ID DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error obteniendo lista propia:", err);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

app.put('/api/veterinarias/registro/:id', async (req, res) => {
    const { id } = req.params;
    const {
        nombreComercial, razonSocial, rfc, descripcion, categorias,
        nombreResponsable, apellidosResponsable, emailResponsable, telefonoResponsable, puesto, documentoIdentidad,
        calle, numeroExterior, colonia, ciudad, estado, codigoPostal, referencias,
        telefonoClinica, whatsapp, emailClinica, sitioWeb, facebook, instagram,
        logo, servicios
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            let logoUpdateSQL = "";
            if (logo && logo.startsWith('data:image')) {
                request.input('logo', sql.NVarChar, logo);
                logoUpdateSQL = ", Logo = @logo";
            }

            request.input('id', sql.Int, id);
            request.input('NomCom', sql.NVarChar, nombreComercial);
            request.input('RazSoc', sql.NVarChar, razonSocial);
            request.input('RFC', sql.NVarChar, rfc);
            request.input('Desc', sql.NVarChar, descripcion);
            request.input('Cat', sql.NVarChar, categorias);
            request.input('NomResp', sql.NVarChar, nombreResponsable);
            request.input('ApeResp', sql.NVarChar, apellidosResponsable);
            request.input('EmailResp', sql.NVarChar, emailResponsable);
            request.input('TelResp', sql.NVarChar, telefonoResponsable);
            request.input('Puesto', sql.NVarChar, puesto);
            request.input('DocID', sql.NVarChar, documentoIdentidad);
            request.input('Calle', sql.NVarChar, calle);
            request.input('NumExt', sql.NVarChar, numeroExterior);
            request.input('Col', sql.NVarChar, colonia);
            request.input('Ciu', sql.NVarChar, ciudad);
            request.input('Edo', sql.NVarChar, estado);
            request.input('CP', sql.NVarChar, codigoPostal);
            request.input('Ref', sql.NVarChar, referencias);
            request.input('TelClin', sql.NVarChar, telefonoClinica);
            request.input('Whats', sql.NVarChar, whatsapp);
            request.input('EmailClin', sql.NVarChar, emailClinica);
            request.input('Web', sql.NVarChar, sitioWeb);
            request.input('Face', sql.NVarChar, facebook);
            request.input('Insta', sql.NVarChar, instagram);

            await request.query(`
                UPDATE Veterinarias SET 
                    NombreComercial = @NomCom, RazonSocial = @RazSoc, RFC = @RFC, Descripcion = @Desc, Categorias = @Cat,
                    NombreResponsable = @NomResp, ApellidosResponsable = @ApeResp, EmailResponsable = @EmailResp, TelefonoResponsable = @TelResp,
                    Puesto = @Puesto, DocumentoIdentidad = @DocID,
                    Calle = @Calle, NumeroExterior = @NumExt, Colonia = @Col, Ciudad = @Ciu, Estado = @Edo, CodigoPostal = @CP, Referencias = @Ref,
                    TelefonoClinica = @TelClin, Whatsapp = @Whats, EmailClinica = @EmailClin, SitioWeb = @Web, Facebook = @Face, Instagram = @Insta,
                    EstadoVerificacion = 'Pendiente', MotivoRechazo = NULL
                    ${logoUpdateSQL}
                WHERE ID = @id
            `);

            if (servicios) {
                const reqDel = new sql.Request(transaction);
                reqDel.input('vid', sql.Int, id);
                await reqDel.query("DELETE FROM Servicios WHERE VeterinariaID = @vid");

                for (const serv of servicios) {
                    const reqServ = new sql.Request(transaction);
                    reqServ.input('Vid', sql.Int, id);
                    reqServ.input('Nom', sql.NVarChar, serv.Nombre);
                    reqServ.input('Pre', sql.Decimal(10, 2), serv.Precio);
                    reqServ.input('Desc', sql.NVarChar, '');
                    await reqServ.query(`INSERT INTO Servicios (VeterinariaID, Nombre, Precio, Descripcion, Activo) VALUES (@Vid, @Nom, @Pre, @Desc, 1)`);
                }
            }

            await transaction.commit();
            res.json({ success: true, message: 'Actualización exitosa' });

        } catch (txError) {
            await transaction.rollback();
            console.error("Error en transacción Update:", txError);
            res.status(500).json({ error: txError.message });
        }
    } catch (err) {
        console.error("Error general Update:", err);
        res.status(500).json({ error: 'Error servidor' });
    }
});

app.get('/api/dashboard/stats/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;

    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('uid', sql.Int, usuarioId)
            .query(`
                SELECT
                    SUM(CASE WHEN c.status = 'pending' THEN 1 ELSE 0 END) AS Pendientes,
                    SUM(CASE 
                            WHEN c.status = 'confirmed' 
                            AND c.horario_confirmado IS NOT NULL
                            AND CAST(c.horario_confirmado AS DATE) = CAST(GETDATE() AS DATE) 
                            THEN 1 
                            ELSE 0 
                        END) AS CitasHoy
                FROM dbo.citas c
                INNER JOIN dbo.Veterinarias v ON c.veterinaria_id = v.ID
                WHERE v.UsuarioWebID = @uid AND v.EstadoVerificacion = 'Aprobada';
            `);

        await pool.close();
        const stats = result.recordset[0];

        res.json({
            citasHoy: stats.CitasHoy || 0,
            citasPendientes: stats.Pendientes || 0,
            ingresos: 0
        });

    } catch (err) {
        console.error("❌ Error al obtener estadísticas del dashboard:", err.message);
        res.status(500).json({ error: 'Error de servidor' });
    }
});


// =================================================================
// SECCIÓN 3: GESTIÓN DE CITAS (MODIFICADO PARA SOPORTAR "TERMINADA")
// =================================================================

// --- 1. OBTENER CITAS ---
app.get('/api/citas/:veterinariaId', async (req, res) => {
    const { veterinariaId } = req.params;

    try {
        const pool = await sql.connect(dbConfig);

        const query = `
            SELECT 
                c.id, m.Nombre AS NombreMascota, s.Nombre AS NombreServicio, c.fecha_preferida,
                c.status, c.created_at, c.telefono_contacto, c.notas, c.horario_confirmado             
            FROM dbo.citas c
            INNER JOIN dbo.Mascotas m ON c.mascota_id = m.IdMascota
            LEFT JOIN dbo.servicios s ON c.servicio_id = s.id
            WHERE c.veterinaria_id = @vid
            ORDER BY c.created_at DESC
        `;

        const result = await pool.request().input('vid', sql.Int, veterinariaId).query(query);

        const citasFormateadas = result.recordset.map(row => {
            let estadoEsp = 'Pendiente';
            if (row.status === 'confirmed') estadoEsp = 'Confirmada';
            if (row.status === 'cancelled') estadoEsp = 'Rechazada';
            // ✨ TRUCO: Si está cancelada pero tiene la marca #COMPLETED en notas, es "Terminada"
            if (row.status === 'cancelled' && row.notas && row.notas.includes('#COMPLETED')) {
                estadoEsp = 'Terminada';
            }

            // Limpiamos la nota para que el usuario no vea la marca interna
            const notaLimpia = row.notas ? row.notas.replace(' #COMPLETED', '') : null;

            const fechaPref = new Date(row.fecha_preferida).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
            const fechaSol = new Date(row.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

            return {
                id: row.id.toString(),
                mascota: row.NombreMascota || 'Desconocida',
                servicio: row.NombreServicio || 'Consulta General',
                fechaPreferida: fechaPref,
                fechaPreferidaRaw: row.fecha_preferida,
                estado: estadoEsp,
                solicitada: fechaSol,
                horario_confirmado: row.horario_confirmado,
                detalles: {
                    telefono: row.telefono_contacto || 'No registrado',
                    motivo: notaLimpia || 'Sin detalles adicionales'
                }
            };
        });

        await pool.close();
        res.json(citasFormateadas);

    } catch (err) {
        console.error("❌ Error al obtener citas:", err.message);
        res.status(500).json({ error: 'Error interno al obtener citas' });
    }
});

// --- 1.5. OBTENER CITAS PROPIETARIO ---
app.get('/api/citas-propietario/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;

    try {
        const pool = await sql.connect(dbConfig);

        const query = `
            SELECT 
                c.id, m.Nombre AS NombreMascota, s.Nombre AS NombreServicio, c.fecha_preferida,
                c.status, c.created_at, c.telefono_contacto, c.notas, c.horario_confirmado,
                v.NombreComercial AS NombreVeterinaria
            FROM dbo.citas c
            INNER JOIN dbo.Veterinarias v ON c.veterinaria_id = v.ID
            INNER JOIN dbo.Mascotas m ON c.mascota_id = m.IdMascota
            LEFT JOIN dbo.servicios s ON c.servicio_id = s.id
            WHERE v.UsuarioWebID = @uid AND v.EstadoVerificacion = 'Aprobada'
            ORDER BY c.created_at DESC
        `;

        const result = await pool.request().input('uid', sql.Int, usuarioId).query(query);

        const citasFormateadas = result.recordset.map(row => {
            let estadoEsp = 'Pendiente';
            if (row.status === 'confirmed') estadoEsp = 'Confirmada';
            if (row.status === 'cancelled') estadoEsp = 'Rechazada';
            // ✨ TRUCO APLICADO TAMBIÉN AQUÍ
            if (row.status === 'cancelled' && row.notas && row.notas.includes('#COMPLETED')) {
                estadoEsp = 'Terminada';
            }

            const notaLimpia = row.notas ? row.notas.replace(' #COMPLETED', '') : null;

            const fechaPref = new Date(row.fecha_preferida).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
            const fechaSol = new Date(row.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

            return {
                id: row.id.toString(),
                mascota: row.NombreMascota || 'Desconocida',
                servicio: row.NombreServicio || 'Consulta General',
                sucursal: row.NombreVeterinaria,
                fechaPreferida: fechaPref,
                fechaPreferidaRaw: row.fecha_preferida,
                estado: estadoEsp,
                solicitada: fechaSol,
                horario_confirmado: row.horario_confirmado,
                detalles: {
                    telefono: row.telefono_contacto || 'No registrado',
                    motivo: notaLimpia || 'Sin detalles adicionales'
                }
            };
        });

        await pool.close();
        res.json(citasFormateadas);

    } catch (err) {
        console.error("❌ Error al obtener citas del propietario:", err.message);
        res.status(500).json({ error: 'Error interno' });
    }
});

// --- 2. ACTUALIZAR ESTADO Y HORARIO (CORREGIDO: NO BORRA FECHAS) ---
app.put('/api/citas/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { estado, horario_confirmado } = req.body;

    let dbStatus = undefined;
    let appendNote = "";

    // Mapeo de estados
    if (estado === 'Confirmada') dbStatus = 'confirmed';
    if (estado === 'Rechazada') dbStatus = 'cancelled';
    if (estado === 'Cancelada') dbStatus = 'cancelled';

    // Hack para "Terminada"
    if (estado === 'Terminada') {
        dbStatus = 'cancelled';
        appendNote = " #COMPLETED";
    }

    // Preparar fecha SQL solo si se envió
    let fechaParaSQL = null;
    if (horario_confirmado) {
        if (horario_confirmado.length === 16) {
            fechaParaSQL = `${horario_confirmado}:00-06:00`;
        } else {
            fechaParaSQL = horario_confirmado;
        }
    }

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request()
            .input('id', sql.BigInt, id)
            .input('updated', sql.DateTimeOffset, new Date());

        // CONSTRUCCIÓN DINÁMICA DE LA QUERY
        // Solo actualizamos los campos que vienen en el body
        let updateFields = ["updated_at = @updated"];

        if (dbStatus) {
            request.input('status', sql.NVarChar, dbStatus);
            updateFields.push("status = @status");
        }

        if (fechaParaSQL) {
            request.input('horario', sql.VarChar, fechaParaSQL);
            updateFields.push("horario_confirmado = @horario");
        }

        if (appendNote) {
            // Concatenar nota sin borrar lo anterior
            updateFields.push("notas = ISNULL(notas, '') + '" + appendNote + "'");
        }

        // Unimos las partes de la query
        const query = `
            UPDATE dbo.citas 
            SET ${updateFields.join(', ')}
            OUTPUT inserted.id
            WHERE id = @id
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            await pool.close();
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        await pool.close();
        res.json({ id, message: 'Actualizado correctamente' });

    } catch (err) {
        console.error("❌ Error al actualizar cita:", err.message);
        res.status(500).json({ error: 'Error servidor' });
    }
});

// --- 3. ELIMINAR CITA (DELETE) ---
app.delete('/api/citas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query('DELETE FROM dbo.citas WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        res.json({ message: 'Cita eliminada correctamente' });
        await pool.close();
    } catch (err) {
        console.error("❌ Error al eliminar cita:", err.message);
        res.status(500).json({ error: 'Error interno al eliminar' });
    }
});

// --- Inicio Principal ---
testDbConnection()
    .catch(() => { /* Error ya manejado */ })
    .finally(() => {
        app.listen(port, () => {
            console.log(`🚀 Servidor backend escuchando en http://localhost:${port}.`);
        });
    });