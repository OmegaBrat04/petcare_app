
const knex = require('knex');

const dbConfig = {
    client: 'mssql',
    connection: {
        server: 'DESKTOP-I34HH4E',
        database: 'PetCareDB',
        user: 'Brandon',
        password: 'hola1234',
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    }
};

const db = knex(dbConfig);

module.exports = db;