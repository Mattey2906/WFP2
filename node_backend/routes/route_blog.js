const express = require('express');
const router = express.Router();
const path = require('path');

// ---------------------------------------------------------------------------------------
// -------------------------------------- IMPORTS ----------------------------------------
// ---------------------------------------------------------------------------------------
const {
    encryptPassword,
    generateSession,
    validateAndUpdateSession
} = require(path.join(process.cwd(), '/logic/logic_account_management'));
const {createUser, validateLogin, deleteSession} = require(path.join(process.cwd(), 'db/db_account_management'));
const {logger} = require(path.join(process.cwd(), '/logging/logging'));
const {getConnection} = require("../db/db_connector");

// ---------------------------------------------------------------------------------------
// ------------------------------- CONTENT MANAGEMENT ROUTES -----------------------------
// ---------------------------------------------------------------------------------------

/**
 * Route zum Erstellen eines neuen Blogbeitrags.
 */
router.post('/blog/createPost', validateAndUpdateSession, async (req, res) => {
    const {title, content, category_name} = req.body;
    const sessionID = req.cookies.id;
    const safeMode = req.cookies.safeMode;

    // Input validieren
    if (!title || !content || !category_name) {
        return res.status(400).json({message: 'Title, content, and category are required.'});
    }
    if (!sessionID) {
        return res.status(401).json({message: 'Unauthorized: No session ID provided.'});
    }

    if (safeMode === undefined) {
        return res.status(401).json({message: 'Unauthorized: No Mode selected.'});
    }

    const dbConnection = getConnection();

    try {
        if (safeMode === 'true') {
            // Regex für Title und Content
            const textRegex = /^[a-zA-Z0-9.,!?;:'"() -]+$/;

            // Gültige Kategorien
            const validCategories = ['Industry Insights', 'Product Updates', 'Company News'];

            // Eingabe validieren
            if (!textRegex.test(title) || !textRegex.test(content) || !validCategories.includes(category_name)) {
                return res.status(400).json({message: 'Invalid input. Please ensure all fields are correctly formatted.'});
            }

            const [sessionResult] = await dbConnection.execute(
                'SELECT user_id FROM sessions WHERE session_id = ?',
                [sessionID]
            );

            const author_id = sessionResult[0].user_id;
            const query = `INSERT INTO posts (title, content, category_name, author_id) VALUES (?, ?, ?, ?)`;

            const [insertResult] = await dbConnection.execute(query, [title, content, category_name, author_id]);

            logger.info(`Post created successfully with ID: ${insertResult.insertId}`);
            res.status(201).json({message: 'Post created successfully', postId: insertResult.insertId});
        } else if (safeMode === 'false') {

            const sessionQuery = `SELECT user_id FROM sessions WHERE session_id = '${sessionID}'`;
            const [sessionResult] = await dbConnection.query(sessionQuery);

            const author_id = sessionResult[0].user_id;
            const insertQuery = `INSERT INTO posts (title, content, category_name, author_id) VALUES ('${title}', '${content}', '${category_name}', '${author_id}')`;

            const [insertResult] = await dbConnection.query(insertQuery);

            logger.info(`Post created successfully with ID: ${insertResult.insertId}`);
            res.status(201).json({message: 'Post created successfully', postId: insertResult.insertId});
        }
    } catch (err) {
        logger.error(`Error creating post: ${err.message}`);
        res.status(500).json({message: 'Internal server error'});
    }
});

/**
 * Route zum Abrufen aller Blogposts.
 */
router.get('/blog/posts', async (req, res) => {
    try {
        const dbConnection = getConnection();
        const [rows] = await dbConnection.execute('SELECT * FROM posts');

        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching posts:', err.message);
        res.status(500).json({message: 'Internal server error'});
    }
});

/**
 * Route zum Abrufen aller Kategorien.
 */
router.get('/blog/categories', async (req, res) => {
    try {
        const dbConnection = getConnection();
        const [rows] = await dbConnection.execute('SELECT name FROM categories');

        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching categories:', err.message);
        res.status(500).json({message: 'Internal server error'});
    }
});

/**
 * Route zum Löschen von einem Post.
 */
router.delete('/blog/deletePost/:post_id', validateAndUpdateSession, async (req, res) => {
    try {
        const postId = req.params.post_id; // URL-Parameter abrufen
        const safeMode = req.cookies.safeMode;

        logger.info(`[deletePost] Safe Mode: ${safeMode}.`);

        const modelSelection = req.cookies.modelSelection;

        if (!postId) {
            return res.status(400).json({message: 'PostId is required'});
        }

        if (safeMode === undefined || safeMode === null) {
            return res.status(400).json({message: 'Mode is required'});
        }

        if (modelSelection === undefined || modelSelection === null) {
            return res.status(400).json({message: 'Model is required'});
        }

        const dbConnection = getConnection();

        if (safeMode === 'true') {
            const [rows] = await dbConnection.execute('SELECT * FROM posts WHERE id = ?', [postId]);

            if (rows.length === 0) {
                return res.status(404).json({message: 'Post not found'});
            }

            // Post löschen
            await dbConnection.execute('DELETE FROM posts WHERE id = ?', [postId]);
            res.status(200).json({message: 'Safe Mode: Post deleted successfully'});

        }

        else if (safeMode === 'false') {
            const query1 = `SELECT * FROM posts WHERE id = ${postId}`;
            const [rows1] = await dbConnection.execute(query1);

            if (rows1.length === 0) {
                return res.status(404).json({
                    message: 'Post not found',
                    queries: [query1],
                    dbResponses: [rows1], // Rückgabe der Datenbankantwort
                    userInput: { postId }
                });
            }

            const query2 = `DELETE FROM posts WHERE id = ${postId}`;
            await dbConnection.execute(query2);

            res.status(200).json({
                message: 'Unsafe Mode: Post deleted successfully',
                queries: [query1, query2],
                dbResponses: [rows1, []], // Beide Antworten zurückgeben (z. B. leere Antwort für DELETE)
                userInput: { postId }
            });
        }

    } catch (err) {
        console.error('Error deleting post:', err.message);
        res.status(500).json({message: 'Internal server error'});
    }
});

router.put('/blog/editPost/:post_id', validateAndUpdateSession, async (req, res) => {
    const postId = req.params.post_id;
    const {title, content} = req.body;
    const safeMode = req.cookies.safeMode;

    if (!title || !content || !postId) {
        return res.status(400).json({message: 'Title, content and PostID are required'});
    }

    try {
        const dbConnection = getConnection();

        if (safeMode === 'true') {
            // Regex für Title und Content
            const textRegex = /^[\p{L}\p{N}\p{P}\p{Zs}]+$/u;

            // Eingabe validieren
            if (!textRegex.test(title) || !textRegex.test(content)) {
                return res.status(400).json({message: 'Invalid input. Please ensure all fields are correctly formatted.'});
            }

            await dbConnection.execute(
                'UPDATE posts SET title = ?, content = ? WHERE id = ?',
                [title, content, postId]
            );
            res.status(200).json({message: 'Post updated successfully'});
        } else if (safeMode === 'false') {

            const query1 = `UPDATE posts SET title = '${title}', content = '${content}' WHERE id = ${postId}`;

            logger.info(query1)

            const [result1] = await dbConnection.execute(query1);

            if(result1.length === 0) {
                return res.status(404).json({
                    message: 'Could not update Post',
                    queries: [query1],
                    dbResponses: [result1], // Rückgabe der Datenbankantwort
                    userInput: { title, content, postId }
                });
            }

            else{
                return res.status(200).json({
                    message: 'Post updated.',
                    queries: [query1],
                    dbResponses: [result1], // Rückgabe der Datenbankantwort
                    userInput: { title, content, postId }
                });
            }
        }

    } catch (err) {
        console.error('Error updating post:', err.message);
        res.status(500).json({message: 'Internal server error'});
    }
});

router.post('/blog/searchPosts', async (req, res) => {
    const {title, category, startDate, endDate} = req.body;
    const safeMode = req.cookies.safeMode;

    if (!title && !category && !startDate && !endDate) {
        logger.info(`[searchPosts] No Search Parameters provided`);
        return res.status(400).json({error: 'No Search Parameters provided'});
    }

    if (safeMode === undefined) {
        logger.info(`[searchPosts] No Mode`);
        return res.status(400).json({error: 'No Mode'});
    }

    const dbConnection = getConnection();

    try {
        if (safeMode === 'true') {
            // Regex für Title und Content
            const textRegex = /^[a-zA-Z0-9.,!?;:'"() -]+$/;

            // Eingabe validieren
            if (!textRegex.test(title)) {
                return res.status(400).json({message: 'Invalid input. Please ensure all fields are correctly formatted.'});
            }

            const query = `SELECT title, content, creation_date, category_name, id
            FROM posts
            WHERE 1=1
              AND (? IS NULL OR title LIKE ?)
              AND (? IS NULL OR category_name = ?)
              AND (? IS NULL OR creation_date >= ?)
              AND (? IS NULL OR creation_date <= ?);
            `;
            logger.info(`[searchPosts] Executing query: ${query} with parameters: [${title ? `%${title}%` : null}, ${title ? `%${title}%` : null}, ${category || null}, ${category || null}, ${startDate || null}, ${startDate || null}, ${endDate || null}, ${endDate || null}]`);

            const [result1] = await dbConnection.execute(query, [
                title ? `%${title}%` : null,
                title ? `%${title}%` : null,
                category || null,
                category || null,
                startDate || null,
                startDate || null,
                endDate || null,
                endDate || null
            ]);

            logger.info(`[searchPosts] Query executed successfully, returned ${result1.length} result(s)`);
            return res.status(200).json({
                message: 'Posts searched.',
                dbResponses: [result1], // Rückgabe der Datenbankantwort
            });

        } else if (safeMode === 'false') {
            // SQL-Query debuggen
            const query1 = `SELECT title, content, creation_date, category_name, id
            FROM posts
            WHERE 1=1
              ${title ? `AND (title LIKE '%${title}%')` : ''}
              ${category ? `AND (category_name = '${category}')` : ''}
              ${startDate ? `AND (creation_date >= '${startDate}')` : ''}
              ${endDate ? `AND (creation_date <= '${endDate}')` : ''};
            `;

            const [result1] = await dbConnection.execute(query1);

            if(result1.length === 0) {
                return res.status(404).json({
                    message: 'Could not search Posts',
                    queries: [query1],
                    dbResponses: [result1], // Rückgabe der Datenbankantwort
                    userInput: { title, category, startDate, endDate }
                });
            }

            else{
                return res.status(200).json({
                    message: 'Posts searched.',
                    queries: [query1],
                    dbResponses: [result1], // Rückgabe der Datenbankantwort
                    userInput: { title, category, startDate, endDate }
                });
            }
        }

    } catch (error) {
        logger.error(`[searchPosts] Error executing query: ${error.message}`);
        res.status(500).json({error: 'Internal server error'});
    }
});

// ---------------------------------------------------------------------------------------
// -------------------------------------- EXPORTS ----------------------------------------
// ---------------------------------------------------------------------------------------
module.exports = router;
