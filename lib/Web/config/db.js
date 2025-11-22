require('dotenv').config();
const knex = require('knex');

const dbConfig = {
    client: 'mssql',
    connection: {
        server: process.env.DB_HOST || 'DESKTOP-8ALV8U2',
        database: process.env.DB_NAME || 'PetCareDB',
        user: process.env.DB_USER || 'Pancho',
        password: process.env.DB_PASSWORD || 'contra12345',
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    },
    pool: { min: 0, max: 10 }
};

const db = knex(dbConfig);

module.exports = db;