const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
// Intenta cargar el .env de la carpeta actual primero
const result = require('dotenv').config();

// Si no cargó nada (o no existe), intenta buscar el de la raíz
if (result.error) {
    require('dotenv').config({ path: '../../.env' });
}

// DEBUG: Verificamos si ya leyó las variables
console.log("--> DB_HOST detectado:", process.env.DB_HOST || "NO DETECTADO ❌");// Ajusta la ruta si es necesario

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use((req, res, next) => {
    console.log(`📡 PETICIÓN RECIBIDA: ${req.method} ${req.url}`);
    console.log('   Datos Body:', req.body);
    next();
});
// Configuración de la Base de Datos (PetCareDB Unificada)
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: 'PetCareDB', // <--- FORZAMOS LA BASE UNIFICADA
    options: {
        encrypt: false, // Cambiar a true si estás en Azure
        trustServerCertificate: true,
    },
};

// Conectar a la base de datos
sql.connect(dbConfig).then(pool => {
    if (pool.connected) {
        console.log('✅ Conectado a SQL Server (PetCareDB Unificada)');
    }
}).catch(err => {
    console.error('❌ Error de conexión SQL:', err);
});



// ---------------- RUTAS CORREGIDAS ----------------

// 1. REGISTRO DE USUARIO WEB (Ajustado a lo que envía tu Frontend)
app.post('/api/web/auth/register', async (req, res) => {
    // LEEMOS LAS VARIABLES EXACTAMENTE COMO LLEGAN EN EL LOG (PascalCase)
    // Nota: El frontend envía la contraseña en el campo 'ContrasenaHash' (aunque sea texto plano)
    const { NombreCompleto, Email, ContrasenaHash, Rol } = req.body;

    // Debug para confirmar que ya leemos los datos
    console.log('⚡ Procesando registro para:', Email);

    if (!Email || !ContrasenaHash) {
        return res.status(400).json({ message: 'Faltan datos obligatorios (Email o Contraseña).' });
    }

    try {
        const pool = await sql.connect(dbConfig);

        // Verificar si existe
        const checkUser = await pool.request()
            .input('Email', sql.NVarChar, Email)
            .query('SELECT * FROM UsuariosWeb WHERE Email = @Email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        // Encriptar la contraseña (que viene en la variable ContrasenaHash)
        const hashedPassword = await bcrypt.hash(ContrasenaHash, 10);

        // Insertar
        await pool.request()
            .input('NombreCompleto', sql.NVarChar, NombreCompleto)
            .input('Email', sql.NVarChar, Email)
            .input('ContrasenaHash', sql.NVarChar, hashedPassword)
            .input('Rol', sql.NVarChar, Rol || 'Propietario') // Default si viene vacío
            .query(`INSERT INTO UsuariosWeb (NombreCompleto, Email, ContrasenaHash, Rol, FechaRegistro, EstadoCuenta) 
              VALUES (@NombreCompleto, @Email, @ContrasenaHash, @Rol, SYSDATETIMEOFFSET(), 1)`);

        console.log('✅ Usuario registrado exitosamente en BD Unificada');
        res.status(201).json({ success: true, message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// 2. LOGIN USUARIO WEB (También ajustamos la ruta y variables por si acaso)
app.post('/api/web/auth/login', async (req, res) => {
    // Asumo que el login también envía las claves en Mayúscula o similar,
    // pero generalmente es email y password. Ajusta si tu log dice otra cosa al loguear.
    // Por ahora aceptamos ambas formas (Mayúscula o minúscula) para prevenir.
    const email = req.body.email || req.body.Email;
    const password = req.body.password || req.body.Password || req.body.ContrasenaHash;

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM UsuariosWeb WHERE Email = @Email');

        if (result.recordset.length === 0) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        const user = result.recordset[0];
        // Comparamos la contraseña plana que llega vs el Hash en BD
        const isMatch = await bcrypt.compare(password, user.ContrasenaHash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        // ... (código anterior del login)

        // RESPUESTA CORREGIDA: Agregamos success: true y un token dummy
        res.status(200).json({
            success: true,  // <--- ¡ESTO ES LO QUE EL FRONTEND ESPERA!
            message: 'Login exitoso',
            token: 'sesion_web_activa', // Token de relleno por si el front lo busca
            user: {
                id: user.IdUsuarioWeb,
                nombre: user.NombreCompleto,
                email: user.Email,
                rol: user.Rol
            }
        });

        // ... (catch error)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// ... El resto de rutas (/api/registro-veterinaria, etc.) déjalas como te las pasé antes ...
// REGISTRO DE VETERINARIA (FORMULARIO)
// ⚠️ AQUÍ ESTÁ EL CAMBIO GRANDE: Mapeamos los campos del Front a las columnas Snake_Case nuevas
// 3. REGISTRO DE VETERINARIA (FORMULARIO WEB)
// 3. REGISTRO DE VETERINARIA (RUTA CORREGIDA Y SOPORTE PARA SERVICIOS/HORARIOS)
// 3. REGISTRO DE VETERINARIA (CORREGIDO: Rellena campos legacy Dirección y Horarios)
app.post('/api/veterinarias/registro', upload.single('logo'), async (req, res) => {
    console.log('⚡ Procesando Registro de Veterinaria en /api/veterinarias/registro');

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        const logoPath = req.file ? `/uploads/${req.file.filename}` : null;
        const data = req.body;

        // 1. PREPARAR DATOS LEGACY (Para que la App no vea NULLs)

        // A) Armar la Dirección Completa
        const direccionCompleta = `${data.calle || ''} ${data.numeroExterior || ''}, ${data.colonia || ''}, ${data.ciudad || ''}, ${data.estado || ''}, CP ${data.codigoPostal || ''}`.trim();

        // B) Extraer Horarios Principales (Tomamos el primero del array o defaults)
        let horariosArray = [];
        if (data.horarios) {
            try {
                horariosArray = typeof data.horarios === 'string' ? JSON.parse(data.horarios) : data.horarios;
            } catch (e) { }
        }

        // Tomamos apertura/cierre del primer horario disponible, o NULL si no hay
        const aperturaLegacy = (horariosArray.length > 0) ? horariosArray[0].apertura : null;
        const cierreLegacy = (horariosArray.length > 0) ? horariosArray[0].cierre : null;


        // Iniciar transacción
        await transaction.begin();
        const request = new sql.Request(transaction);

        // Inputs mapeados
        request.input('NombreComercial', sql.NVarChar, data.nombreComercial);
        request.input('RazonSocial', sql.NVarChar, data.razonSocial);
        request.input('RFC', sql.NVarChar, data.rfc);
        request.input('Descripcion', sql.NVarChar, data.descripcionVeterinaria);
        request.input('Categorias', sql.NVarChar, data.categorias);

        request.input('NombreResponsable', sql.NVarChar, data.nombreResponsable);
        request.input('ApellidosResponsable', sql.NVarChar, data.apellidosResponsable);
        request.input('EmailResponsable', sql.NVarChar, data.emailResponsable);
        request.input('TelefonoResponsable', sql.NVarChar, data.telefonoResponsable);
        request.input('Puesto', sql.NVarChar, data.puesto);
        request.input('DocumentoIdentidad', sql.NVarChar, data.documentoIdentidad);

        request.input('Calle', sql.NVarChar, data.calle);
        request.input('NumeroExterior', sql.NVarChar, data.numeroExterior);
        request.input('Colonia', sql.NVarChar, data.colonia);
        request.input('Ciudad', sql.NVarChar, data.ciudad);
        request.input('Estado', sql.NVarChar, data.estado);
        request.input('CodigoPostal', sql.NVarChar, data.codigoPostal);
        request.input('Referencias', sql.NVarChar, data.referencias);

        request.input('TelefonoClinica', sql.NVarChar, data.telefonoClinica);
        request.input('Whatsapp', sql.NVarChar, data.whatsapp);
        request.input('EmailClinica', sql.NVarChar, data.emailClinica);
        request.input('SitioWeb', sql.NVarChar, data.sitioWeb);
        request.input('Facebook', sql.NVarChar, data.facebook);
        request.input('Instagram', sql.NVarChar, data.instagram);

        request.input('Logo', sql.NVarChar, logoPath);
        request.input('UsuarioWebID', sql.Int, parseInt(data.usuarioWebID) || null);

        // NUEVOS INPUTS CALCULADOS
        request.input('DireccionCompleta', sql.NVarChar, direccionCompleta);
        request.input('HorarioApertura', sql.VarChar, aperturaLegacy); // VarChar para coincidir con TIME o STRING
        request.input('HorarioCierre', sql.VarChar, cierreLegacy);

        // Insertamos
        const resultVet = await request.query(`
            INSERT INTO veterinarias (
                nombre, razon_social, rfc, descripcion, categorias, 
                nombre_responsable, apellidos_responsable, email_responsable, telefono_responsable, 
                puesto, documento_identidad, 
                calle, numero_exterior, colonia, ciudad, estado, codigo_postal, referencias, 
                direccion, -- <--- AQUÍ SE LLENA EL CAMPO VIEJO
                horario_apertura, horario_cierre, -- <--- AQUÍ SE LLENAN LOS HORARIOS VIEJOS
                telefono, whatsapp, email, sitio_web, facebook, instagram, 
                logo, usuario_web_id,
                estado_publicacion, verificado, created_at
            ) VALUES (
                @NombreComercial, @RazonSocial, @RFC, @Descripcion, @Categorias,
                @NombreResponsable, @ApellidosResponsable, @EmailResponsable, @TelefonoResponsable,
                @Puesto, @DocumentoIdentidad,
                @Calle, @NumeroExterior, @Colonia, @Ciudad, @Estado, @CodigoPostal, @Referencias,
                @DireccionCompleta, -- Insertamos la concatenación
                @HorarioApertura, @HorarioCierre, -- Insertamos las horas extraídas
                @TelefonoClinica, @Whatsapp, @EmailClinica, @SitioWeb, @Facebook, @Instagram,
                @Logo, @UsuarioWebID, 
                'pendiente', 0, SYSDATETIMEOFFSET()
            );
            SELECT SCOPE_IDENTITY() AS id;
        `);

        const veterinariaId = resultVet.recordset[0].id;
        console.log(`✅ Veterinaria creada con ID: ${veterinariaId} (Datos Legacy generados)`);

        // 2. INSERTAR SERVICIOS
        if (data.servicios) {
            let servicios = data.servicios;
            if (typeof servicios === 'string') { try { servicios = JSON.parse(servicios); } catch (e) { } }

            if (Array.isArray(servicios) && servicios.length > 0) {
                for (const s of servicios) {
                    const reqServ = new sql.Request(transaction);
                    // Aseguramos conversión de tipos
                    reqServ.input('VetID', sql.Int, veterinariaId);
                    reqServ.input('Nombre', sql.NVarChar, s.nombre);
                    reqServ.input('Precio', sql.Decimal(10, 2), s.precio || 0);
                    reqServ.input('Activo', sql.Bit, s.activo ? 1 : 0);

                    await reqServ.query(`INSERT INTO servicios (veterinaria_id, nombre, precio, activo, created_at) VALUES (@VetID, @Nombre, @Precio, @Activo, SYSDATETIMEOFFSET())`);
                }
            }
        }

        // 3. INSERTAR HORARIOS (Tabla Detallada)
        if (horariosArray.length > 0) {
            for (const h of horariosArray) {
                const reqHor = new sql.Request(transaction);
                reqHor.input('VetID', sql.Int, veterinariaId);
                reqHor.input('Dia', sql.NVarChar, h.dia);
                reqHor.input('Apertura', sql.NVarChar, h.apertura);
                reqHor.input('Cierre', sql.NVarChar, h.cierre);

                await reqHor.query(`INSERT INTO Horarios (veterinaria_id, dia, apertura, cierre) VALUES (@VetID, @Dia, @Apertura, @Cierre)`);
            }
        }

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Solicitud enviada exitosamente.'
        });

    } catch (error) {
        if (transaction._begun) await transaction.rollback();
        console.error("❌ Error al registrar veterinaria:", error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar la veterinaria.',
            error: error.message
        });
    }
});
app.get('/api/veterinarias/propias/:id', async (req, res) => {
    const { id } = req.params;

    // Si llega "undefined" por error del front, respondemos vacío para no tronar
    if (id === 'undefined' || !id) return res.json([]);

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('UsuarioWebID', sql.Int, id)
            .query(`
                SELECT 
                    id as ID,
                    nombre as NombreComercial,
                    direccion as Direccion, -- El frontend espera 'Direccion'
                    calle, colonia, ciudad,
                    estado_publicacion as Estado, -- El front espera 'Estado'
                    motivo_rechazo as MotivoRechazo,
                    logo as Logo,
                    verificado as Verificado
                FROM veterinarias 
                WHERE usuario_web_id = @UsuarioWebID
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error en veterinarias propias:", error);
        res.status(500).send('Error del servidor');
    }
});

// 2. ESTADÍSTICAS DEL DASHBOARD (Lo que pide Inicio.tsx línea 31)
app.get('/api/dashboard/stats/:id', async (req, res) => {
    const { id } = req.params;

    if (id === 'undefined' || !id) return res.json({});

    try {
        const pool = await sql.connect(dbConfig);

        // Contamos cuántas veterinarias tiene y cuántas citas pendientes
        // (Nota: Ajusta la lógica de citas si quieres que sea real, por ahora contamos veterinarias)
        const result = await pool.request()
            .input('UsuarioWebID', sql.Int, id)
            .query(`
                SELECT 
                    COUNT(*) as totalVeterinarias,
                    SUM(CASE WHEN estado_publicacion = 'pendiente' THEN 1 ELSE 0 END) as solicitudesPendientes,
                    (SELECT COUNT(*) FROM citas 
                     JOIN veterinarias v ON citas.veterinaria_id = v.id 
                     WHERE v.usuario_web_id = @UsuarioWebID AND citas.status = 'pending') as citasPendientes
                FROM veterinarias
                WHERE usuario_web_id = @UsuarioWebID
            `);

        const stats = result.recordset[0];

        res.json({
            totalVeterinarias: stats.totalVeterinarias || 0,
            solicitudesPendientes: stats.solicitudesPendientes || 0,
            citasActivas: stats.citasPendientes || 0, // Usamos las citas reales
            calificacionPromedio: 4.8 // Dato dummy por ahora
        });
    } catch (error) {
        console.error("Error en stats:", error);
        res.status(500).send('Error del servidor');
    }
});

// OBTENER TODAS LAS VETERINARIAS (Para el Admin)
app.get('/api/veterinarias', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        // ALIAS DE NUEVO para compatibilidad
        const result = await pool.request().query(`
      SELECT 
        id as ID, 
        nombre as NombreComercial, 
        nombre_responsable as NombreResponsable, 
        estado_publicacion as EstadoVerificacion, 
        created_at as FechaRegistro
      FROM veterinarias
    `);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error del servidor');
    }
});

// APROBAR O RECHAZAR VETERINARIA (Admin)
app.post('/api/aprobar-veterinaria', async (req, res) => {
    const { id, estado, motivo } = req.body;
    // estado viene como 'Aprobado' o 'Rechazado' desde el front?
    // Lo convertimos a minúsculas 'aprobado'/'rechazado' para estandarizar
    const estadoFinal = estado.toLowerCase();

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('ID', sql.Int, id)
            .input('Estado', sql.NVarChar, estadoFinal)
            .input('Motivo', sql.NVarChar, motivo || null)
            .query(`
        UPDATE veterinarias 
        SET 
            estado_publicacion = @Estado, 
            motivo_rechazo = @Motivo,
            verificado = CASE WHEN @Estado = 'aprobado' THEN 1 ELSE 0 END
        WHERE id = @ID
      `);

        res.json({ message: `Veterinaria ${estadoFinal} correctamente` });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error del servidor');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Web (Unificado) corriendo en el puerto ${PORT}`);
});