const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { logger } = require(path.join(process.cwd(), '/logging/logging'));

let dbConnection;

async function connectToDatabase() {
    try {
        dbConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: {
                ca: fs.readFileSync('./secrets/aiven_ca.pem'),
            },
            charset: 'utf8mb4',
        });

        logger.info('Database connection established');
    } catch (err) {
        logger.error('Error establishing database connection:', err);
        process.exit(1); // Beende die Anwendung bei Verbindungsfehler
    }
}

connectToDatabase();

module.exports = {
    getConnection: () => dbConnection,
};
