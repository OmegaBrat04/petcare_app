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
// SECCIÓN 1: AUTENTICACIÓN (Login/Registro)
// =================================================================

// --- ENDPOINT: LOGIN DE USUARIO ---
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
        if (password !== usuario.ContrasenaHash) { // Nota: Usar bcrypt en producción
            await pool.close();
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
        await pool.close();
        res.status(200).json({ success: true, message: 'Login OK', idUsuario: usuario.IdUsuarioWeb, rol: usuario.Rol, nombre: usuario.NombreCompleto });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error de servidor' });
    }
});

// --- ENDPOINT: REGISTRO DE USUARIO ---
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
// SECCIÓN 2: GESTIÓN DE VETERINARIAS
// =================================================================

// --- 1. LISTA PENDIENTES (ADMIN) ---
app.get('/api/veterinarias/pendientes', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`SELECT ID, NombreComercial, NombreResponsable + ' ' + ApellidosResponsable AS Responsable, Ciudad, FORMAT(FechaRegistro, 'dd MMM yyyy') as FechaSolicitud, EstadoVerificacion FROM Veterinarias WHERE EstadoVerificacion = 'Pendiente' ORDER BY ID DESC`);
        await pool.close();
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: 'Error servidor' }); }
});

// --- 2. DETALLE (ADMIN) ---
app.get('/api/veterinarias/detalle/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        const v = await pool.request().input('id', sql.Int, id).query('SELECT * FROM Veterinarias WHERE ID = @id');
        if (v.recordset.length === 0) return res.status(404).json({ error: 'No existe' });
        const s = await pool.request().input('id', sql.Int, id).query('SELECT * FROM Servicios WHERE VeterinariaID = @id');
        const h = await pool.request().input('id', sql.Int, id).query('SELECT * FROM Horarios WHERE VeterinariaID = @id');
        await pool.close();
        res.json({ ...v.recordset[0], servicios: s.recordset, horarios: h.recordset });
    } catch (err) { res.status(500).json({ error: 'Error servidor' }); }
});

// --- 3. REGISTRO DE VETERINARIA (Con Dueño) ---
app.post('/api/veterinarias/registro', async (req, res) => {
    const payload = req.body; 
    const { nombreResponsable, apellidosResponsable, emailResponsable, telefonoResponsable, puesto, documentoIdentidad, nombreComercial, razonSocial, rfc, descripcionVeterinaria, categorias, calle, numeroExterior, colonia, ciudad, estado, codigoPostal, referencias, telefonoClinica, whatsapp, emailClinica, sitioWeb, facebook, instagram, servicios, horarios, logoUrl, usuarioWebID } = payload;

    try {
        const pool = await sql.connect(dbConfig); 
        const transaction = new sql.Transaction(pool);
        await transaction.begin(); 
        try {
            const requestVet = new sql.Request(transaction);
            
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
            requestVet.input('UID', sql.Int, usuarioWebID);

            const resultVet = await requestVet.query(`
                INSERT INTO Veterinarias (
                    NombreComercial, RazonSocial, RFC, Descripcion, Categorias,
                    NombreResponsable, ApellidosResponsable, EmailResponsable, TelefonoResponsable, Puesto, DocumentoIdentidad,
                    Calle, NumeroExterior, Colonia, Ciudad, Estado, CodigoPostal, Referencias,
                    TelefonoClinica, Whatsapp, EmailClinica, SitioWeb, Facebook, Instagram,
                    Logo, EstadoVerificacion, UsuarioWebID
                ) 
                OUTPUT inserted.ID
                VALUES (
                    @NomCom, @RazSoc, @RFC, @Desc, @Cat,
                    @NomResp, @ApeResp, @EmailResp, @TelResp, @Puesto, @DocID,
                    @Calle, @NumExt, @Col, @Ciu, @Edo, @CP, @Ref,
                    @TelClin, @Whats, @EmailClin, @Web, @Face, @Insta,
                    @Logo, 'Pendiente', @UID
                )
            `);
            
            const veterinariaID = resultVet.recordset[0].ID;
            console.log(`✅ Veterinaria creada en BD con ID: ${veterinariaID}`);

            if (servicios && servicios.length > 0) {
                for (const serv of servicios) {
                    const reqServ = new sql.Request(transaction);
                    reqServ.input('Vid', sql.Int, veterinariaID).input('Nom', sql.NVarChar, serv.nombre).input('Pre', sql.Decimal(10,2), serv.precio).input('Desc', sql.NVarChar, serv.descripcion || '');
                    await reqServ.query(`INSERT INTO Servicios (VeterinariaID, Nombre, Precio, Descripcion, Activo) VALUES (@Vid, @Nom, @Pre, @Desc, 1)`);
                }
            }

            if (horarios && horarios.length > 0) {
                for (const hor of horarios) {
                    const reqHor = new sql.Request(transaction);
                    reqHor.input('Vid', sql.Int, veterinariaID).input('Dia', sql.NVarChar, hor.dia).input('Ape', sql.NVarChar, hor.apertura).input('Cie', sql.NVarChar, hor.cierre);
                    await reqHor.query(`INSERT INTO Horarios (VeterinariaID, Dia, Apertura, Cierre) VALUES (@Vid, @Dia, @Ape, @Cie)`);
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

// --- 4. ACTUALIZAR ESTADO (ADMIN) ---
app.put('/api/veterinarias/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body; 
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request().input('id', sql.Int, id).input('estado', sql.NVarChar, nuevoEstado).query('UPDATE Veterinarias SET EstadoVerificacion = @estado WHERE ID = @id');
        await pool.close();
        res.json({ mensaje: `Estado actualizado a ${nuevoEstado}` });
    } catch (err) {
        console.error("❌ Error actualizando estado:", err);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

// --- 5. OBTENER ÚLTIMA (DASHBOARD USUARIO INICIAL) ---
app.get('/api/veterinarias/ultima', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`SELECT TOP 1 ID, NombreComercial, Logo, EstadoVerificacion FROM Veterinarias ORDER BY ID DESC`);
        if (result.recordset.length > 0) { res.json(result.recordset[0]); } else { res.json(null); }
    } catch (err) { res.status(500).json({ error: 'Error de servidor' }); }
});

// --- 6. LISTAR PROPIAS (DASHBOARD USUARIO FILTRADO) ---
app.get('/api/veterinarias/propias/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid', sql.Int, usuarioId)
            .query(`
                SELECT ID, NombreComercial, Logo, EstadoVerificacion, Ciudad
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

// =================================================================
// SECCIÓN 3: GESTIÓN DE CITAS (COMPLETA Y CORREGIDA)
// =================================================================

// --- 1. OBTENER CITAS DE UNA VETERINARIA ---
app.get('/api/citas/:veterinariaId', async (req, res) => {
    const { veterinariaId } = req.params;

    try {
        const pool = await sql.connect(dbConfig);

        // NOTA: Verifica que en tu tabla 'Mascotas' la columna del nombre sea 'Nombre'
        const query = `
            SELECT 
                c.id,
                m.Nombre AS NombreMascota,       
                s.Nombre AS NombreServicio,      
                c.fecha_preferida,
                c.status,                        -- 'pending', 'confirmed', 'cancelled'
                c.created_at,
                c.telefono_contacto,
                c.notas
            FROM dbo.citas c
            INNER JOIN dbo.Mascotas m ON c.mascota_id = m.IdMascota
            LEFT JOIN dbo.servicios s ON c.servicio_id = s.id
            WHERE c.veterinaria_id = @vid
            ORDER BY c.created_at DESC
        `;

        const result = await pool.request()
            .input('vid', sql.Int, veterinariaId)
            .query(query);

        // Formatear datos para React
        const citasFormateadas = result.recordset.map(row => {
            
            // Traducción: BD (Inglés) -> Web (Español)
            let estadoEsp = 'Pendiente';
            if (row.status === 'confirmed') estadoEsp = 'Confirmada';
            if (row.status === 'cancelled') estadoEsp = 'Rechazada';

            // Formato de fechas legible
            const fechaPref = new Date(row.fecha_preferida).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
            const fechaSol = new Date(row.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

            return {
                id: row.id.toString(),
                mascota: row.NombreMascota || 'Desconocida',
                servicio: row.NombreServicio || 'Consulta General',
                fechaPreferida: fechaPref,
                estado: estadoEsp,
                solicitada: fechaSol,
                detalles: {
                    telefono: row.telefono_contacto || 'No registrado',
                    motivo: row.notas || 'Sin detalles adicionales'
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

// --- 2. ACTUALIZAR ESTADO DE CITA (Confirmar/Rechazar) ---
app.put('/api/citas/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // Recibimos 'Confirmada' o 'Rechazada'

    // Traducción: Web (Español) -> BD (Inglés)
    let dbStatus = 'pending';
    if (estado === 'Confirmada') dbStatus = 'confirmed';
    if (estado === 'Rechazada') dbStatus = 'cancelled';

    try {
        const pool = await sql.connect(dbConfig);
        
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .input('status', sql.NVarChar, dbStatus)
            .query(`
                UPDATE dbo.citas 
                SET 
                    status = @status,
                    updated_at = SYSDATETIMEOFFSET()
                OUTPUT inserted.id
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            await pool.close();
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        await pool.close();
        res.json({ id: id, estado: estado, message: 'Estado actualizado correctamente' });

    } catch (err) {
        console.error("❌ Error al actualizar cita:", err.message);
        res.status(500).json({ error: 'Error al actualizar estado de la cita' });
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