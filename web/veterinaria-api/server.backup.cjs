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

// --- Middleware ---
app.use(cors({
    origin: '*', // Permite conexiones desde cualquier origen (útil para desarrollo)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Límite alto para recibir imágenes en Base64 (Logos)
app.use(bodyParser.json({ limit: '50mb' }));


// =================================================================
// ENDPOINT 1: Obtener lista de pendientes (Para el Admin)
// =================================================================
app.get('/api/veterinarias/pendientes', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT 
                ID, 
                NombreComercial, 
                NombreResponsable + ' ' + ApellidosResponsable AS Responsable,
                Ciudad, 
                FORMAT(FechaRegistro, 'dd MMM yyyy') as FechaSolicitud,
                EstadoVerificacion
            FROM Veterinarias
            WHERE EstadoVerificacion = 'Pendiente'
            ORDER BY ID DESC
        `);
        await pool.close();
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error lista:", err);
        res.status(500).json({ error: 'Error al obtener datos del servidor.' });
    }
});


// =================================================================
// ENDPOINT 2: Obtener DETALLE de una veterinaria por ID (Para el Admin)
// =================================================================
app.get('/api/veterinarias/detalle/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);

        // 1. Datos generales
        const vetResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Veterinarias WHERE ID = @id');

        if (vetResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Veterinaria no encontrada' });
        }

        // 2. Servicios
        const servResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Servicios WHERE VeterinariaID = @id');

        // 3. Horarios
        const horResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Horarios WHERE VeterinariaID = @id');

        await pool.close();

        // Armamos el objeto completo
        const dataCompleta = {
            ...vetResult.recordset[0],
            servicios: servResult.recordset,
            horarios: horResult.recordset
        };

        res.json(dataCompleta);

    } catch (err) {
        console.error("❌ Error obteniendo detalle:", err);
        res.status(500).json({ error: 'Error de servidor' });
    }
});


// =================================================================
// ENDPOINT 3: Registrar nueva veterinaria (Desde el Formulario)
// =================================================================
app.post('/api/veterinarias/registro', async (req, res) => {
    const payload = req.body; 
    console.log("📥 Solicitud POST recibida:", payload.nombreComercial);

    const { 
        nombreResponsable, apellidosResponsable, emailResponsable, telefonoResponsable, puesto, documentoIdentidad,
        nombreComercial, razonSocial, rfc, descripcionVeterinaria, categorias,
        calle, numeroExterior, colonia, ciudad, estado, codigoPostal, referencias,
        telefonoClinica, whatsapp, emailClinica, sitioWeb, facebook, instagram,
        servicios, horarios, logoUrl 
    } = payload;

    let pool;
    try {
        pool = await sql.connect(dbConfig); 
        const transaction = new sql.Transaction(pool);
        await transaction.begin(); 

        try {
            const requestVet = new sql.Request(transaction);
            
            // Mapeo de variables
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

            const resultVet = await requestVet.query(`
                INSERT INTO Veterinarias (
                    NombreComercial, RazonSocial, RFC, Descripcion, Categorias,
                    NombreResponsable, ApellidosResponsable, EmailResponsable, TelefonoResponsable, Puesto, DocumentoIdentidad,
                    Calle, NumeroExterior, Colonia, Ciudad, Estado, CodigoPostal, Referencias,
                    TelefonoClinica, Whatsapp, EmailClinica, SitioWeb, Facebook, Instagram,
                    Logo, EstadoVerificacion
                ) 
                OUTPUT inserted.ID
                VALUES (
                    @NomCom, @RazSoc, @RFC, @Desc, @Cat,
                    @NomResp, @ApeResp, @EmailResp, @TelResp, @Puesto, @DocID,
                    @Calle, @NumExt, @Col, @Ciu, @Edo, @CP, @Ref,
                    @TelClin, @Whats, @EmailClin, @Web, @Face, @Insta,
                    @Logo, 'Pendiente'
                )
            `);
            
            const veterinariaID = resultVet.recordset[0].ID;
            console.log(`✅ Veterinaria creada en BD con ID: ${veterinariaID}`);

            // Insertar Servicios
            if (servicios && servicios.length > 0) {
                for (const serv of servicios) {
                    const reqServ = new sql.Request(transaction);
                    reqServ.input('Vid', sql.Int, veterinariaID);
                    reqServ.input('Nom', sql.NVarChar, serv.nombre);
                    reqServ.input('Pre', sql.Decimal(10,2), serv.precio);
                    reqServ.input('Desc', sql.NVarChar, serv.descripcion || ''); 
                    
                    await reqServ.query(`
                        INSERT INTO Servicios (VeterinariaID, Nombre, Precio, Descripcion, Activo)
                        VALUES (@Vid, @Nom, @Pre, @Desc, 1)
                    `);
                }
            }

            // Insertar Horarios
            if (horarios && horarios.length > 0) {
                for (const hor of horarios) {
                    const reqHor = new sql.Request(transaction);
                    reqHor.input('Vid', sql.Int, veterinariaID);
                    reqHor.input('Dia', sql.NVarChar, hor.dia);
                    reqHor.input('Ape', sql.NVarChar, hor.apertura);
                    reqHor.input('Cie', sql.NVarChar, hor.cierre);

                    await reqHor.query(`
                        INSERT INTO Horarios (VeterinariaID, Dia, Apertura, Cierre)
                        VALUES (@Vid, @Dia, @Ape, @Cie)
                    `);
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


// =================================================================
// ENDPOINT 4: Actualizar Estado de Verificación (Para el Admin)
// =================================================================
app.put('/api/veterinarias/estado/:id', async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body; 

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, id)
            .input('estado', sql.NVarChar, nuevoEstado)
            .query('UPDATE Veterinarias SET EstadoVerificacion = @estado WHERE ID = @id');
        
        await pool.close();
        console.log(`🔄 Veterinaria ID ${id} actualizada a: ${nuevoEstado}`);
        res.json({ mensaje: `Estado actualizado a ${nuevoEstado}` });

    } catch (err) {
        console.error("❌ Error actualizando estado:", err);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});


// =================================================================
// ENDPOINT 5: Obtener la última veterinaria (Para el Inicio Usuario)
// =================================================================
app.get('/api/veterinarias/ultima', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // Seleccionamos la última registrada
        const result = await pool.request().query(`
            SELECT TOP 1 
                ID, 
                NombreComercial, 
                Logo, 
                EstadoVerificacion 
            FROM Veterinarias 
            ORDER BY ID DESC
        `);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.json(null); // No hay veterinarias registradas aún
        }

    } catch (err) {
        console.error("❌ Error obteniendo última veterinaria:", err);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// =================================================================
// ENDPOINT 6 (NUEVO): Simular "Mis Veterinarias" (Trae las últimas 5)
// =================================================================
app.get('/api/veterinarias/propias', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // Seleccionamos las últimas 5 para simular que son del usuario
        const result = await pool.request().query(`
            SELECT TOP 5 
                ID, 
                NombreComercial, 
                Logo, 
                EstadoVerificacion,
                Ciudad
            FROM Veterinarias 
            ORDER BY ID DESC
        `);

        res.json(result.recordset);

    } catch (err) {
        console.error("❌ Error obteniendo lista propia:", err);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// --- Iniciar Servidor ---
app.listen(port, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${port}`);
});