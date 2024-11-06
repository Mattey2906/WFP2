const mysql = require('mysql');
const path = require("path");
const { logger } = require(path.join(process.cwd(), '/logging/logging'));
const { encryptPassword, authenticateUser, generateSession } = require(path.join(process.cwd(), '/logic/functions'));

const dbConnection = require('./db_connector');


// ----------------------------------- REGISTER -----------------------------------
async function createUser(username, password, salt) {
    try {

        if (!dbConnection) {
            throw new Error('No database connection available');
        }

        const [results] = await dbConnection.execute('INSERT INTO users (username, password, salt) VALUES (?, ?, ?)', [username, password, salt]);
        logger.info('User inserted');
        return results.insertId;
    } catch (err) {
        logger.error('Error inserting user into database:', err);
        throw err;
    }
}

// ----------------------------------- LOGIN -----------------------------------
async function validateLogin(username, password) {
    try {
        // Hole den Salt-Wert aus der Datenbank
        const querySalt = `SELECT salt FROM users WHERE username = ?`;
        const [results1] = await dbConnection.execute(querySalt, [username]);

        if (results1.length === 0) {
            // Benutzername existiert nicht
            return false;
        }

        const salt = results1[0].salt;
        const hash = encryptPassword(password, salt);

        const [results2] = await dbConnection.execute(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, hash]);

        if (results2.length > 0) {
            return true; // Benutzer erfolgreich validiert
        } else {
            return false; // Falsches Passwort
        }
    } catch (err) {
        logger.error('Error during login validation:', err);
        throw err;
    }
}



async function getUser(username, password) {
    try {
        const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
        const [results] = await dbConnection.execute(query);

        if (results.length > 0) {
            return results[0];
        } else {
            return null;
        }
    } catch (err) {
        logger.error('Error getting user from database:', err);
        throw err;
    }
}
// ----------------------------------- SESSION -----------------------------------
function createSession(username, sessionID, expireDate) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO sessions (username, sessionID, expireDate) VALUES (?, ?, ?)';
        dbConnection.execute(query, [username, sessionID, expireDate], (err, results) => {
            if (err) {
                logger.error('Error inserting user into database:', err);
                return reject(err);
            }
            logger.info('Session inserted with ID:', results.insertId);
            resolve(results.insertId);
        });
    });
}

async function validateAndUpdateSession(req, res, next) {
    const sessionID = req.cookies.id;
    if (!sessionID) {
        return res.status(401).json({ message: 'Unauthorized: No session' });
    }

    try {
        const query = `
            UPDATE sessions 
            SET expire_date = DATE_ADD(NOW(), INTERVAL 2 HOUR)
            WHERE session_id = ? AND expire_date > NOW()
        `;

        const [results] = await dbConnection.execute(query, [sessionID]);

        if (results.affectedRows > 0) {
            logger.info('Session updated successfully:', sessionID);
            next(); // weiter zur Route oder nächsten Middleware
        } else {
            logger.info('Session not found or already expired:', sessionID);
            res.status(401).json({ message: 'Unauthorized: Session expired or invalid' });
        }
    } catch (err) {
        logger.error('Error updating session in database:', err);
        res.status(500).json({ message: 'Error updating session' });
    }
}



module.exports = { createUser, getUser, createSession, validateAndUpdateSession };