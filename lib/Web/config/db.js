require('dotenv').config();
const knex = require('knex');


DB_PORT = 1433
SERVER_PORT = 3001
const dbConfig = {
    client: 'mssql',
    connection: {
        server: process.env.DB_HOST || 'DESKTOP-I34HH4E',
        database: process.env.DB_NAME || 'PetCareDB',
        user: process.env.DB_USER || 'Brandon',
        password: process.env.DB_PASSWORD || 'hola1234',
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    },
    pool: { min: 0, max: 10 }
};
console.log("--> INTENTANDO CONECTAR CON USUARIO:", dbConfig.connection.user);
console.log("--> A LA BASE DE DATOS:", dbConfig.connection.database);
const db = knex(dbConfig);

module.exports = db;