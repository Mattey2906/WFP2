const mysql = require('mysql');
const path = require("path");
const { logger } = require(path.join(process.cwd(), '/logging/logging'));
const { getConnection } = require('./db_connector'); // Verbindungsabruf

// ---------------------------------------------------------------------------------------
// ----------------------------------- USER MANAGEMENT -----------------------------------
// ---------------------------------------------------------------------------------------

/**
 * Erstelle einen neuen Benutzer in der Datenbank.
 * @param {string} username
 * @param {string} password
 * @param {string} salt
 * @returns {number} Insert ID des erstellten Benutzers
 */
async function unsafeCreateUser(username, password, salt) {
    try {
        const dbConnection = getConnection();

        if (!dbConnection) {
            throw new Error('No database connection available');
        }

        // UNSICHER: Dynamische SQL-Query ohne Parameterized Queries
        const query = `INSERT INTO users (username, password, salt) 
                       VALUES ('${username}', '${password}', '${salt}')`;

        const [results] = await dbConnection.query(query);

        logger.info(`[unsafeCreateUser] User successfully created: ID=${results.insertId}`);
        return results.insertId;
    } catch (err) {
        logger.error(`[unsafeCreateUser] Error inserting user: ${err.message}`);
        throw err;
    }
}

/**
 * Hole Benutzerdaten basierend auf Benutzername und Passwort.
 * @param {string} username
 * @param {string} password
 * @returns {Object|null} Benutzerdaten oder null
 */
async function unsafeGetUser(username, password) {
    try {
        const dbConnection = getConnection();

        if (!dbConnection) {
            throw new Error('No database connection available');
        }

        // UNSICHER: Dynamische SQL-Query mit direkter Einbindung der Parameter
        const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
        const [results] = await dbConnection.query(query);

        logger.info(`[unsafeGetUser] User fetch attempt: username=${username}`);
        return results.length > 0 ? results[0] : null;
    } catch (err) {
        logger.error(`[unsafeGetUser] Error fetching user: ${err.message}`);
        throw err;
    }
}

/**
 * Validiere Benutzer-Login und überprüfe Passwort-Hash.
 * @param {string} username
 * @param {string} password
 * @returns {boolean} true bei erfolgreicher Validierung, sonst false
 */
async function unsafeValidateLogin(username, password) {
    try {
        const dbConnection = getConnection();
        const { encryptPassword } = require(path.join(process.cwd(), '/logic/logic_account_management'));

        // UNSICHER: Dynamische SQL-Query ohne Parameterized Queries
        const querySalt = `SELECT salt FROM users WHERE username = '${username}'`;
        const [results1] = await dbConnection.query(querySalt);

        if (results1.length === 0) {
            logger.info(`[unsafeValidateLogin] User not found: username=${username}`);
            return false;
        }

        const salt = results1[0]?.salt; // Verhindert TypeError bei undefined
        const { hash } = encryptPassword(password, salt); // Nur den Hash extrahieren

        // UNSICHER: Dynamische SQL-Query ohne Parameterized Queries
        const queryLogin = `SELECT * FROM users WHERE username = '${username}' AND password = '${hash}'`;
        const [results2] = await dbConnection.query(queryLogin);

        if (results2.length > 0) {
            logger.info(`[unsafeValidateLogin] Login successful: username=${username}`);
            return true;
        } else {
            logger.info(`[unsafeValidateLogin] Incorrect password: username=${username}`);
            return false;
        }
    } catch (err) {
        logger.error(`[unsafeValidateLogin] Error validating login: ${err.message}`);
        throw err;
    }
}


// ---------------------------------------------------------------------------------------
// ----------------------------------- SESSION MANAGEMENT --------------------------------
// ---------------------------------------------------------------------------------------

/**
 * Erstelle eine neue Session in der Datenbank.
 * @param {string} username
 * @param {string} sessionID
 * @param {string} expireDate
 * @returns {number} Insert ID der erstellten Session
 */
async function unsafeCreateSession(username, sessionID, expireDate) {
    try {
        const dbConnection = getConnection();

        if (!dbConnection) {
            throw new Error('No database connection available');
        }

        // UNSICHER: Dynamische SQL-Query mit direkter String-Konkatenation
        const query = `INSERT INTO sessions (session_id, user_id, expire_date) 
                       VALUES ('${sessionID}', '${username}', '${expireDate}')`;

        const [results] = await dbConnection.query(query);

        logger.info(`[unsafeCreateSession] Session created: ID=${sessionID} for user=${username}`);
        return results.insertId;
    } catch (err) {
        logger.error(`[unsafeCreateSession] Error creating session: ${err.message}`);
        throw err;
    }
}

/**
 * Löscht eine bestehende Session anhand der sessionID aus der Datenbank.
 * @param {string} sessionID
 * @returns {boolean}
 */
async function unsafeDeleteSession(sessionID) {
    try {
        const dbConnection = getConnection();

        if (!dbConnection) {
            throw new Error('No database connection available');
        }

        // UNSICHER: Dynamische SQL-Query mit direkter String-Konkatenation
        const query = `DELETE FROM sessions WHERE session_id = '${sessionID}'`;

        const [results] = await dbConnection.query(query);

        if (results.affectedRows > 0) {
            logger.info(`[unsafeDeleteSession] Session deleted: ID=${sessionID}`);
            return true;
        } else {
            logger.info(`[unsafeDeleteSession] No session found to delete: ID=${sessionID}`);
            return false;
        }
    } catch (err) {
        logger.error(`[unsafeDeleteSession] Error deleting session: ${err.message}`);
        throw err;
    }
}


// ---------------------------------------------------------------------------------------
// -------------------------------------- EXPORTS ----------------------------------------
// ---------------------------------------------------------------------------------------
module.exports = {
    unsafeValidateLogin,
    unsafeCreateSession,
    unsafeDeleteSession,
    unsafeGetUser,
    unsafeCreateUser
};
