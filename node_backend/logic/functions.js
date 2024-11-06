require('dotenv').config();
const bcrypt = require('bcryptjs');
const path = require("path");
const { createUser, getUser, createSession } = require(path.join(process.cwd(), 'db/db_account_management'));
const crypto = require('crypto');
const dbConnection = require(path.join(process.cwd(), '/db/db_connector'));
const mysql = require('mysql');
const { logger } = require(path.join(process.cwd(), '/logging/logging'));

const saltRounds = 10;
const pepper = process.env.PEPPER;
function encryptPassword(password, salt) {
    if(salt === 0){
        salt = bcrypt.genSaltSync(saltRounds);
    }
    const hash = bcrypt.hashSync(password + pepper, salt);

    return {
        hash: hash,
        salt: pwSalt
    };
}

function queryAsync(query, params) {
    return new Promise((resolve, reject) => {
        dbConnection.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function authenticateUser(username, password) {
    try {
        const user = await getUser(username, password);
        if (user) {
            logger.info('User authenticated successfully:', user);
            return true;
        } else {
            logger.info('Authentication failed: Invalid credentials');
            throw new Error('Authentication failed: User not found or invalid credentials');
        }
    } catch (error) {
        logger.info('Error during authentication:', error);
        throw error;
    }
}

//--------------------------------- SESSION MANAGEMENT -------------------------------------

function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
    );
}

async function generateSession(username){
    try {
        const sessionID = generateUUID();
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 2);

        const user = await createSession(username, sessionID, expireDate);
        if (user) {
            logger.info('Session stored', user);
            return sessionID;
        } else {
            logger.error('Session storing failed');
            throw new Error('Session storing failed');
        }
    } catch (error) {
        logger.error('Error during session generation:', error);
        throw error;
    }
}

module.exports = { encryptPassword, authenticateUser, generateSession };