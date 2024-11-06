require('dotenv').config();
const path = require("path");
const { logger } = require(path.join(process.cwd(), '/logging/logging'));
const mysql = require('mysql2/promise');

let dbConnection;

async function connectToDatabase() {
    const timeout = 10000; // in ms
    const connectionConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password:  process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        charset: 'utf8mb4',
        connectTimeout: timeout,
    };


    try {
        dbConnection = await mysql.createConnection(connectionConfig);
        logger.info('Database connection successful');
    } catch (error) {
        logger.error('Database error:', error);
        throw error; // Fehler weitergeben, wenn die Verbindung fehlschlägt
    }
    return dbConnection;
}

// Initialisiere die Verbindung beim Laden des Moduls
connectToDatabase();

module.exports = dbConnection;
