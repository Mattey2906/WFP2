const express = require('express');
const router = express.Router();
const path = require('path');

// ---------------------------------- IMPORTS ----------------------------------
const { encryptPassword, generateSession, validateAndUpdateSession } = require(path.join(process.cwd(), '/logic/unsafe_logic_account_management'));
const { createUser, validateLogin, deleteSession } = require(path.join(process.cwd(), 'db/unsafe_db_account_management'));
const { logger } = require(path.join(process.cwd(), '/logging/logging'));

// ---------------------------------- REGISTER ROUTE ----------------------------------
/**
 * Route zum Registrieren eines neuen Benutzers.
 */
router.post('/acc_man/unsafe_register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        logger.info(`[register] Missing username or password`);
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const result = encryptPassword(password, 0);
        if (!result.hash || !result.salt) {
            logger.error('[register] Password encryption failed: hash or salt is null/undefined');
            return res.status(500).json({ message: 'Internal server error during password encryption' });
        }

        const userId = await createUser(username, result.hash, result.salt);

        logger.info(`[register] User registered successfully: username=${username}, userId=${userId}`);
        res.status(201).json({ message: 'User created', userId });
    } catch (err) {
        logger.error(`[register] Error during registration: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ---------------------------------- LOGIN ROUTE ----------------------------------
/**
 * Route für Benutzer-Login und Session-Erstellung.
 */
router.post('/acc_man/unsafe_login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        logger.info(`[login] Missing username or password`);
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const login = await validateLogin(username, password);

        if (login) {
            const sessionID = await generateSession(username);

            logger.info(`[login] Login successful: username=${username}, sessionID=${sessionID}`);

            res.cookie('id', sessionID, {
                httpOnly: true,
                sameSite: 'Strict',
                maxAge: 2 * 60 * 60 * 1000 // 2 Stunden
            });
            res.status(200).json({ message: 'Login successful' });
        } else {
            logger.info(`[login] Unauthorized login attempt: username=${username}`);
            res.status(401).json({ message: 'Unauthorized: No login' });
        }
    } catch (error) {
        logger.error(`[login] Error during login: ${error.message}`);
        res.status(500).json({ message: 'An error occurred during login' });
    }
});

// ---------------------------------- SESSION TEST ROUTE ----------------------------------
/**
 * Route zur Überprüfung einer bestehenden Session.
 */
router.get('/acc_man/unsafe_session_test', validateAndUpdateSession, async (req, res) => {
    logger.info(`[session_test] Session valid for sessionID=${req.cookies.id}`);
    res.status(200).json({ message: 'Session Valid' });
});

// ---------------------------------- LOGOUT ROUTE ----------------------------------
/**
 * Route zum Löschen einer Session (Logout).
 */
router.get('/acc_man/unsafe_logout', validateAndUpdateSession, async (req, res) => {
    try {
        const sessionID = req.cookies.id;

        if (!sessionID) {
            logger.info(`[logout] No session ID provided`);
            return res.status(400).json({ message: 'No session ID provided.' });
        }

        const isDeleted = await deleteSession(sessionID);

        if (isDeleted) {
            res.cookie('id', '', {
                httpOnly: true,
                sameSite: 'Strict',
                maxAge: 0 // Löscht das Cookie sofort
            });

            logger.info(`[logout] Session deleted successfully: sessionID=${sessionID}`);
            res.status(200).json({ message: 'Session deleted successfully.' });
        } else {
            logger.info(`[logout] Session not found: sessionID=${sessionID}`);
            res.status(404).json({ message: 'Session not found.' });
        }
    } catch (err) {
        logger.error(`[logout] Error during logout: ${err.message}`);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// ---------------------------------- EXPORTS ----------------------------------
module.exports = router;
