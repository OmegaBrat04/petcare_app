require('dotenv').config();
const knex = require('knex');

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

const db = knex(dbConfig);

module.exports = db;