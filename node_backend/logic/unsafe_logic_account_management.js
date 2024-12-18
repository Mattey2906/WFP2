require('dotenv').config();
const bcrypt = require('bcryptjs');
const path = require("path");
const crypto = require('crypto');
const { logger } = require(path.join(process.cwd(), '/logging/logging'));
const { getConnection } = require("../db/db_connector");

// ---------------------------------- CONFIG ----------------------------------
const saltRounds = 10;
const pepper = process.env.PEPPER;

// ---------------------------------- PASSWORD MANAGEMENT ----------------------------------

/**
 * Verschlüsselt ein Passwort mit Pepper und Salt.
 * @param {string} password - Das zu verschlüsselnde Passwort.
 * @param {string} salt - Der Salt-Wert (wird generiert, falls 0).
 * @returns {string} - Verschlüsselter Passwort-Hash.
 */
function encryptPassword(password, salt) {
    if (salt === 0) {
        salt = bcrypt.genSaltSync(saltRounds);
        logger.info(`[encryptPassword] New salt generated: ${salt}`);
    }
    const hash = bcrypt.hashSync(password + pepper, salt);
    logger.info(`[encryptPassword] Password encrypted successfully`);
    return { hash, salt };
}

// ---------------------------------- SESSION MANAGEMENT -----------------------------------

/**
 * Generiert eine zufällige UUID.
 * @returns {string} - Eine generierte UUID.
 */
function generateUUID() {
    const uuid = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
    );
    logger.info(`[generateUUID] Generated UUID: ${uuid}`);
    return uuid;
}

/**
 * Erstellt eine neue Session für einen Benutzer.
 * Löscht bestehende Sessions und fügt eine neue hinzu.
 * @param {string} username - Benutzername, für den die Session generiert wird.
 * @returns {string} - Die generierte Session-ID.
 */

// Hilfsfunktion, um das Datum ins MySQL-Format zu bringen
function formatDateToMySQL(date) {
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Hilfsfunktion zur Formatierung des Datums im MySQL-Format
function formatDateToMySQL(date) {
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function generateSession(username) {
    try {
        const dbConnection = getConnection();
        const sessionID = generateUUID();
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 2);

        const formattedExpireDate = formatDateToMySQL(expireDate);

        logger.info(`[generateSession] Starting session creation for user: ${username}`);

        // UNSICHER: Benutzer-ID abrufen
        const queryUserId = `SELECT id FROM users WHERE username = '${username}'`;
        const [userResults] = await dbConnection.query(queryUserId);

        if (userResults.length === 0) {
            logger.info(`[generateSession] User not found: ${username}`);
            throw new Error('User not found');
        }
        const userId = userResults[0].id;

        // UNSICHER: Bestehende Sessions löschen
        const queryDelete = `DELETE FROM sessions WHERE user_id = '${userId}'`;
        const [sessionCheckResult] = await dbConnection.query(queryDelete);
        logger.info(`[generateSession] Deleted ${sessionCheckResult.affectedRows} session(s) for user ID: ${userId}`);

        // UNSICHER: Neue Session erstellen
        const queryInsert = `
            INSERT INTO sessions (session_id, user_id, expire_date) 
            VALUES ('${sessionID}', '${userId}', '${formattedExpireDate}')`;
        const [results] = await dbConnection.query(queryInsert);

        logger.info(`[generateSession] Session created: ID=${sessionID}, user=${username}`);
        return sessionID;

    } catch (error) {
        logger.error(`[generateSession] Error creating session for user: ${username} - ${error.message}`);
        throw error;
    }
}


/**
 * Middleware zur Validierung und Aktualisierung von Sessions.
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
async function validateAndUpdateSession(req, res, next) {
    const sessionID = req.cookies.id;

    if (!sessionID) {
        logger.info(`[validateAndUpdateSession] No session ID provided`);
        return res.status(401).json({ message: 'Unauthorized: No session' });
    }

    try {
        const dbConnection = getConnection();

        // UNSICHER: Dynamische SQL-Query mit direkter Einbindung des sessionID
        const query = `
            UPDATE sessions 
            SET expire_date = DATE_ADD(NOW(), INTERVAL 2 HOUR)
            WHERE session_id = '${sessionID}' AND expire_date > NOW()
        `;

        const [results] = await dbConnection.query(query);

        if (results.affectedRows > 0) {
            logger.info(`[validateAndUpdateSession] Session updated successfully: ID=${sessionID}`);
            next();
        } else {
            logger.info(`[validateAndUpdateSession] Session not found or expired: ID=${sessionID}`);
            res.status(401).json({ message: 'Unauthorized: Session expired or invalid' });
        }
    } catch (err) {
        logger.error(`[validateAndUpdateSession] Error updating session: ${err.message}`);
        res.status(500).json({ message: 'Error updating session' });
    }
}

// -------------------------------------- EXPORTS -----------------------------------------
module.exports = {
    encryptPassword,
    generateSession,
    validateAndUpdateSession
};
