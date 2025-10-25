
const knex = require('knex');

const dbConfig = {
    client: 'mssql',
    connection: {
        server: 'CECEBTSE',
        database: 'PetCareDB',
        user: 'sa',
        password: 'Celine5diaz',
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    }
};

const db = knex(dbConfig);

module.exports = db;