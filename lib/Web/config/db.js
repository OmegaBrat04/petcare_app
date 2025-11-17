
const knex = require('knex');

const dbConfig = {
    client: 'mssql',
    connection: {
        server: 'localhost',
        database: 'PetCareDB',
        user: 'cowelxz',
        password: 'contra12345',
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    }
};

const db = knex(dbConfig);

module.exports = db; z