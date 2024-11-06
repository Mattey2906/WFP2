const express = require('express');
const router = express.Router();
const path = require('path');
const { encryptPassword, authenticateUser, generateSession } = require(path.join(process.cwd(), '/logic/functions'));
const { createUser, validateAndUpdateSession } = require(path.join(process.cwd(), 'db/db_account_management'));
const { logger } = require(path.join(process.cwd(), '/logging/logging'));

router.post('/acc_man/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const result = encryptPassword(password, 0);
        const userId = await createUser(username, result.hash, result.salt);
        res.status(201).json({ message: 'User created', userId });
    } catch (err) {
        logger.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }

});

router.post('/acc_man/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        await authenticateUser(username, password);
        const sessionID = await generateSession(username);

        res.cookie('id', sessionID, {
            httpOnly: true,
            //secure: true,
            sameSite: 'Strict',
            maxAge: 2 * 60 * 60 * 1000 // 2 Stunden
        });
        res.status(200).json({ message: 'Login successful' });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'An error occurred during session generation' });
    }
});

router.get('/session-test', validateAndUpdateSession, async (req, res) => {
    res.status(200).json({message: 'Session Valid'});
});



module.exports = router;