// server.js (Colócalo dentro de la carpeta veterinaria-api)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const dotenv = require('dotenv'); // Importar dotenv

// Cargar las variables del archivo .env inmediatamente
dotenv.config();

const app = express();
const port = 3001;

// --- Configuración de Conexión a SQL Server (Portabilidad) ---
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
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// --- ENDPOINT: LOGIN DE USUARIO (Propietario / Admin) ---
// Ruta: /api/web/auth/login
app.post('/api/web/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios.' });
    }

    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const request = new sql.Request(pool);

        request.input('Email', sql.NVarChar, email);

        // 1. Buscar al usuario por email
        const result = await request.query(
            `SELECT IdUsuarioWeb, NombreCompleto, ContrasenaHash, Rol 
             FROM dbo.UsuariosWeb 
             WHERE Email = @Email`
        );

        if (result.recordset.length === 0) {
            await pool.close();
            return res.status(404).json({ success: false, message: 'Credenciales inválidas (usuario no encontrado).' });
        }

        const usuario = result.recordset[0];

        // 2. Comparar la contraseña
        // ADVERTENCIA: Esto es una comparación en texto plano.
        // En un proyecto real, DEBES usar bcrypt.compare(password, usuario.ContrasenaHash)
        const passwordEsCorrecta = (password === usuario.ContrasenaHash);

        if (!passwordEsCorrecta) {
            await pool.close();
            return res.status(401).json({ success: false, message: 'Credenciales inválidas (contraseña incorrecta).' });
        }

        await pool.close();

        // 3. Respuesta exitosa (en un proyecto real, aquí se genera un JWT/Token)
        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso.',
            token: 'un-token-jwt-simulado-por-ahora', // Simulación de token
            rol: usuario.Rol,
            nombre: usuario.NombreCompleto
        });

    } catch (dbError) {
        console.error('\n--- ERROR EN LOGIN DE USUARIO ---');
        console.error('DETALLE:', dbError.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor en el login.' });
    }
});


// --- ENDPOINT: REGISTRO DE USUARIO (Propietario) ---
// Ruta: /api/web/auth/register
app.post('/api/web/auth/register', async (req, res) => {
    const { NombreCompleto, Email, ContrasenaHash } = req.body;

    if (!NombreCompleto || !Email || !ContrasenaHash) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios (Nombre, Email, Contraseña).' });
    }

    const rolAsignado = 'Propietario';

    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const request = new sql.Request(pool);

        request.input('Email', sql.NVarChar, Email);

        const checkEmail = await request.query(
            `SELECT IdUsuarioWeb FROM dbo.UsuariosWeb WHERE Email = @Email`
        );

        if (checkEmail.recordset.length > 0) {
            await pool.close();
            return res.status(409).json({ success: false, message: 'El email ya está registrado.' });
        }

        request.input('NombreCompleto', sql.NVarChar, NombreCompleto);
        request.input('ContrasenaHash', sql.NVarChar, ContrasenaHash);
        request.input('Rol', sql.NVarChar, rolAsignado);

        const result = await request.query(
            `INSERT INTO dbo.UsuariosWeb (NombreCompleto, Email, ContrasenaHash, Rol) 
             OUTPUT inserted.IdUsuarioWeb
             VALUES (@NombreCompleto, @Email, @ContrasenaHash, @Rol)`
        );

        await pool.close();
        const idUsuario = result.recordset[0].IdUsuarioWeb;

        res.status(201).json({
            success: true,
            message: 'Usuario registrado con éxito.',
            idUsuario: idUsuario
        });

    } catch (dbError) {
        console.error('\n--- ERROR AL REGISTRAR USUARIO ---');
        console.error('DETALLE:', dbError.message);
        res.status(500).json({ success: false, message: 'Error interno del servidor al registrar.' });
    }
});


// --- ENDPOINT: REGISTRO DE VETERINARIA ---
// Ruta: /api/web/veterinarias/registro
app.post('/api/web/veterinarias/registro', async (req, res) => {
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

    let pool;

    try {
        pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const requestVet = new sql.Request(transaction);
            const direccion = 'DIRECCION MOCK';

            requestVet.input('NombreComercial', sql.NVarChar, nombreComercial);
            requestVet.input('Direccion', sql.NVarChar, direccion);
            requestVet.input('Telefono', sql.NVarChar, telefonoResponsable);

            const resultVet = await requestVet.query(
                `INSERT INTO dbo.veterinarias (nombre, direccion, telefono) 
                 OUTPUT inserted.id
                 VALUES (@NombreComercial, @Direccion, @Telefono)`
            );
            const veterinariaID = resultVet.recordset[0].id;

            if (servicios && servicios.length > 0) {
                for (const servicio of servicios) {
                    if (servicio.activo) {
                        const requestServ = new sql.Request(transaction);
                        requestServ.input('VeterinariaID', sql.Int, veterinariaID);
                        requestServ.input('NombreServicio', sql.NVarChar, servicio.nombre || '');
                        requestServ.input('Precio', sql.Decimal(10, 2), servicio.precio || 0);
                        requestServ.input('Descripcion', sql.NVarChar, servicio.descripcion || descripcionVeterinaria || null);
                        requestServ.input('Activo', sql.Bit, servicio.activo);
                        await requestServ.query(
                            `INSERT INTO dbo.servicios (veterinaria_id, nombre, descripcion, precio, activo) 
                             VALUES (@VeterinariaID, @NombreServicio, @Descripcion, @Precio, @Activo)`
                        );
                    }
                }
            }

            await transaction.commit();
            pool.close();

            res.status(201).json({
                mensaje: '✅ Registro guardado y en verificación.',
                id: veterinariaID
            });

        } catch (txError) {
            await transaction.rollback();
            pool.close();
            console.error('\n--- ERROR DE TRANSACCIÓN SQL (Consulta fallida) ---');
            console.error('DETALLE DEL ERROR DE BASE DE DATOS:', txError.message);
            res.status(500).json({ mensaje: '❌ Error en la base de datos. Transacción revertida.' });
        }

    } catch (connError) {
        console.error('Error de conexión durante el POST (ya testeada al inicio):', connError.message);
        res.status(503).json({ mensaje: '🚨 No se pudo conectar a la base de datos SQL Server.' });
    }
});


// --- INICIO PRINCIPAL (Modo de desarrollo portátil) ---
testDbConnection()
    .catch(() => {
        // Error ya manejado en la función
    })
    .finally(() => {
        app.listen(port, () => {
            console.log(`🚀 Servidor backend escuchando en http://localhost:${port}.`);
        });
    });