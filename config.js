require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: 'localhost', 
    database: process.env.DB_NAME,
    synchronize: true,
    options: {
        encrypt: false, 
        trustServerCertificate: true,
        enableArithAbort: true
    },
    port: parseInt(process.env.DB_PORT, 10),
};



module.exports = config;