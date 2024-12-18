const express = require('express');
const router = express.Router();
const path = require('path');

// ---------------------------------------------------------------------------------------
// -------------------------------------- IMPORTS ----------------------------------------
// ---------------------------------------------------------------------------------------
const { encryptPassword, generateSession, validateAndUpdateSession } = require(path.join(process.cwd(), '/logic/unsafe_logic_account_management'));
const { createUser, validateLogin, deleteSession } = require(path.join(process.cwd(), 'db/unsafe_db_account_management'));
const { logger } = require(path.join(process.cwd(), '/logging/logging'));
const { getConnection } = require("../db/db_connector");

// ---------------------------------------------------------------------------------------
// ------------------------------- CONTENT MANAGEMENT ROUTES -----------------------------
// ---------------------------------------------------------------------------------------

/**
 * Route zum Erstellen eines neuen Blogbeitrags.
 */
router.post('/blog/unsafe_createPost', validateAndUpdateSession, async (req, res) => {
    const { title, content, category_name } = req.body;
    const sessionID = req.cookies.id;

    // Input validieren
    if (!title || !content || !category_name) {
        return res.status(400).json({ message: 'Title, content, and category are required.' });
    }
    if (!sessionID) {
        return res.status(401).json({ message: 'Unauthorized: No session ID provided.' });
    }

    try {
        const dbConnection = getConnection();
        const [sessionResult] = await dbConnection.execute(
            'SELECT user_id FROM sessions WHERE session_id = ?',
            [sessionID]
        );

        const author_id = sessionResult[0].user_id;
        const query = `INSERT INTO posts (title, content, category_name, author_id) VALUES (?, ?, ?, ?)`;

        const [insertResult] = await dbConnection.execute(query, [title, content, category_name, author_id]);

        logger.info(`Post created successfully with ID: ${insertResult.insertId}`);
        res.status(201).json({ message: 'Post created successfully', postId: insertResult.insertId });
    } catch (err) {
        logger.error(`Error creating post: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route zum Erstellen eines neuen Kommentars.
 */
router.post('/blog/unsafe_createComment', validateAndUpdateSession, async (req, res) => {
    const { post_id, content } = req.body;
    const sessionID = req.cookies.id;

    // Input validieren
    if (!post_id || !content) {
        return res.status(400).json({ message: 'Post ID and content are required.' });
    }
    if (!sessionID) {
        return res.status(401).json({ message: 'Unauthorized: No session ID provided.' });
    }

    try {
        const dbConnection = getConnection();
        const [sessionResult] = await dbConnection.execute(
            'SELECT user_id FROM sessions WHERE session_id = ?',
            [sessionID]
        );

        if (sessionResult.length === 0) {
            return res.status(401).json({ message: 'Invalid session.' });
        }
        const user_id = sessionResult[0].user_id;

        const query = `INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`;
        const [insertResult] = await dbConnection.execute(query, [post_id, user_id, content]);

        logger.info(`Comment created successfully with ID: ${insertResult.insertId}`);
        res.status(201).json({ message: 'Comment created successfully', commentId: insertResult.insertId });
    } catch (err) {
        logger.error(`Error creating comment: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route zum Abrufen aller Blogposts.
 */
router.get('/blog/unsafe_posts', async (req, res) => {
    try {
        const dbConnection = getConnection();
        const [rows] = await dbConnection.execute('SELECT * FROM posts');

        res.status(200).json(rows);
    } catch (err) {
        logger.error('Error fetching posts:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route zum Abrufen von Kommentaren zu einem spezifischen Blogpost.
 */
router.get('/blog/unsafe_comments', async (req, res) => {
    const { post_id } = req.query;

    // Input validieren
    if (!post_id) {
        return res.status(400).json({ message: 'post_id is required as a query parameter.' });
    }

    try {
        const dbConnection = getConnection();
        const [comments] = await dbConnection.execute(
            'SELECT content, creation_date, user_id FROM comments WHERE post_id = ? ORDER BY creation_date DESC',
            [post_id]
        );

        res.status(200).json(comments);
    } catch (err) {
        logger.error(`Error fetching comments: ${err.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route zum Abrufen aller Kategorien.
 */
router.get('/blog/unsafe_categories', async (req, res) => {
    try {
        const dbConnection = getConnection();
        const [rows] = await dbConnection.execute('SELECT name FROM categories');

        res.status(200).json(rows);
    } catch (err) {
        logger.error('Error fetching categories:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.get('/blog/unsafe_searchPosts', async (req, res) => {
    const { title } = req.query; // Input aus der URL-Query
    const dbConnection = getConnection();

    try {
        if (!title) {
            logger.info(`[unsafe_searchPosts] No title parameter provided`);
            return res.status(400).json({ error: 'Title parameter is required' });
        }

        // SQL-Query debuggen
        const query = `
            SELECT title, content, creation_date 
            FROM posts 
            WHERE title LIKE '%${title}%'
        `;
        logger.info(`[unsafe_searchPosts] Executing query: ${query}`);

        const [results] = await dbConnection.query(query);

        logger.info(`[unsafe_searchPosts] Query executed successfully, returned ${results.length} result(s)`);
        res.json(results); // Ergebnisse als JSON zurückgeben
    } catch (error) {
        logger.error(`[unsafe_searchPosts] Error executing query: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// ---------------------------------------------------------------------------------------
// -------------------------------------- EXPORTS ----------------------------------------
// ---------------------------------------------------------------------------------------
module.exports = router;
