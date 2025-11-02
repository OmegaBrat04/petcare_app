// server.js (Colócalo dentro de la carpeta veterinaria-api)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql'); 
const dotenv = require('dotenv'); // 🚨 Importar dotenv

// Cargar las variables del archivo .env inmediatamente
dotenv.config();

const app = express();
const port = 3001;

// --- Configuración de Conexión a SQL Server (Portabilidad) ---
// 🚨 Ahora lee todas las credenciales del archivo .env 🚨
const dbConfig = {
    // Lectura desde variables de entorno
    server: process.env.DB_SERVER, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_DATABASE,
    
    // El puerto usa la variable de entorno o el puerto por defecto (1433)
    options: {
        trustServerCertificate: true, 
        enableArithAbort: true,
        encrypt: false, 
        // Puerto que configuraste estáticamente, leído del .env o por defecto 1433
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
app.use(cors()); 
app.use(bodyParser.json()); 

// --- Endpoint POST para Registro de Veterinaria ---
app.post('/api/veterinarias/registro', async (req, res) => {
    const payload = req.body; 

    // 1. Desestructuración y ASEGURAMIENTO DE VALORES
    const { 
        nombreComercial = '', 
        descripcionVeterinaria, 
        telefonoResponsable = '', 
        emailResponsable = '',
        servicios
    } = payload;
    
    // Validación Mínima (Email y NombreComercial son requeridos)
    if (!nombreComercial || !emailResponsable) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
    }

    let pool;

    try {
        pool = await sql.connect(dbConfig); 
        const transaction = new sql.Transaction(pool);

        await transaction.begin(); 

        try {
            // A. INSERTAR EN TABLA dbo.veterinarias
            const requestVet = new sql.Request(transaction);
            
            const direccion = 'DIRECCION MOCK'; 

            requestVet.input('NombreComercial', sql.NVarChar, nombreComercial);
            requestVet.input('Direccion', sql.NVarChar, direccion);
            requestVet.input('Telefono', sql.NVarChar, telefonoResponsable);

            // Ejecutar la inserción y obtener el ID de la veterinaria insertada
            const resultVet = await requestVet.query(
                `INSERT INTO dbo.veterinarias (nombre, direccion, telefono) 
                 OUTPUT inserted.id
                 VALUES (@NombreComercial, @Direccion, @Telefono)`
            );
            
            const veterinariaID = resultVet.recordset[0].id;

            // B. INSERTAR EN TABLA dbo.servicios
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

            await transaction.commit(); // Éxito: CONFIRMAR todos los cambios
            pool.close(); 
            
            res.status(201).json({ 
                mensaje: '✅ Registro guardado y en verificación.',
                id: veterinariaID 
            });

        } catch (txError) {
            await transaction.rollback(); 
            pool.close();
            // 🚨 IMPRESIÓN FORZADA DEL ERROR DE CONSULTA SQL 🚨
            console.error('\n--- ERROR DE TRANSACCIÓN SQL (Consulta fallida) ---');
            console.error('DETALLE DEL ERROR DE BASE DE DATOS:', txError.message); 
            res.status(500).json({ mensaje: '❌ Error en la base de datos. Transacción revertida.' });
        }

    } catch (connError) {
        // Esto solo debería fallar si la conexión se pierde DESPUÉS de la prueba inicial
        console.error('Error de conexión durante el POST (ya testeada al inicio):', connError.message);
        res.status(503).json({ mensaje: '🚨 No se pudo conectar a la base de datos SQL Server.' });
    }
});


// --- INICIO PRINCIPAL (Modo de desarrollo portátil) ---
// Ejecutamos la prueba de conexión y solo iniciamos Express si es exitosa.
testDbConnection()
    .catch(() => {
        // Si la prueba falla (error capturado e impreso en la consola por testDbConnection), 
        // continuamos para que el frontend pueda ver el error 503.
    })
    .finally(() => {
        app.listen(port, () => {
            console.log(`🚀 Servidor backend escuchando en http://localhost:${port}.`);
        });
    });