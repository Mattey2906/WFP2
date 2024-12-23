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
        if (safeMode) {
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
        } else if (!safeMode) {

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
 * Route zum Erstellen eines neuen Kommentars.
 */
router.post('/blog/createComment', validateAndUpdateSession, async (req, res) => {
    const {post_id, content} = req.body;
    const sessionID = req.cookies.id;

    // Input validieren
    if (!post_id || !content) {
        return res.status(400).json({message: 'Post ID and content are required.'});
    }
    if (!sessionID) {
        return res.status(401).json({message: 'Unauthorized: No session ID provided.'});
    }

    try {
        const dbConnection = getConnection();
        const [sessionResult] = await dbConnection.execute(
            'SELECT user_id FROM sessions WHERE session_id = ?',
            [sessionID]
        );

        if (sessionResult.length === 0) {
            return res.status(401).json({message: 'Invalid session.'});
        }
        const user_id = sessionResult[0].user_id;

        const query = `INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`;
        const [insertResult] = await dbConnection.execute(query, [post_id, user_id, content]);

        logger.info(`Comment created successfully with ID: ${insertResult.insertId}`);
        res.status(201).json({message: 'Comment created successfully', commentId: insertResult.insertId});
    } catch (err) {
        logger.error(`Error creating comment: ${err.message}`);
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
 * Route zum Abrufen von Kommentaren zu einem spezifischen Blogpost.
 */
router.get('/blog/comments', async (req, res) => {
    const {post_id} = req.query;

    // Input validieren
    if (!post_id) {
        return res.status(400).json({message: 'post_id is required as a query parameter.'});
    }

    try {
        const dbConnection = getConnection();
        const [comments] = await dbConnection.execute(
            'SELECT content, creation_date, user_id FROM comments WHERE post_id = ? ORDER BY creation_date DESC',
            [post_id]
        );

        res.status(200).json(comments);
    } catch (err) {
        console.error(`Error fetching comments: ${err.message}`);
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

        if (safeMode) {
            const [rows] = await dbConnection.execute('SELECT * FROM posts WHERE id = ?', [postId]);

            if (rows.length === 0) {
                return res.status(404).json({message: 'Post not found'});
            }

            // Post löschen
            await dbConnection.execute('DELETE FROM posts WHERE id = ?', [postId]);
            res.status(200).json({message: 'Post deleted successfully'});

        } else if (!safeMode) {
            const query1 = 'SELECT * FROM posts WHERE id = ${post_id}';
            const [rows] = await dbConnection.execute(query1);

            if (rows.length === 0) {
                return res.status(404).json({message: 'Post not found'});
            }

            // Post löschen
            const query2 = 'DELETE FROM posts WHERE id = ${post_id}';
            await dbConnection.execute(query2);
            res.status(200).json({message: 'Post deleted successfully'});

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

        if (safeMode) {
            // Regex für Title und Content
            const textRegex = /^[a-zA-Z0-9.,!?;:'"() -]+$/;

            // Eingabe validieren
            if (!textRegex.test(title) || !textRegex.test(content)) {
                return res.status(400).json({message: 'Invalid input. Please ensure all fields are correctly formatted.'});
            }

            await dbConnection.execute(
                'UPDATE posts SET title = ?, content = ? WHERE id = ?',
                [title, content, postId]
            );
            res.status(200).json({message: 'Post updated successfully'});
        } else if (!safeMode) {
            await dbConnection.execute(
                'UPDATE posts SET title = ${title}, content = ${content} WHERE id = ${postId}'
            );
            res.status(200).json({message: 'Post updated successfully'});
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
        if (safeMode) {
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

            const [results] = await dbConnection.execute(query, [
                title ? `%${title}%` : null,
                title ? `%${title}%` : null,
                category || null,
                category || null,
                startDate || null,
                startDate || null,
                endDate || null,
                endDate || null
            ]);

            logger.info(`[searchPosts] Query executed successfully, returned ${results.length} result(s)`);
            res.json(results); // Ergebnisse als JSON zurückgeben

        } else if (!safeMode) {
            // SQL-Query debuggen
            const query = `SELECT title, content, creation_date, category_name, id
            FROM posts
            WHERE 1=1
              ${title ? `AND (title LIKE '%${title}%')` : ''}
              ${category ? `AND (category_name = '${category}')` : ''}
              ${startDate ? `AND (creation_date >= '${startDate}')` : ''}
              ${endDate ? `AND (creation_date <= '${endDate}')` : ''};
            `;

            logger.info(`[searchPosts] Executing UNSAFE query: ${query}`);

            const [results] = await dbConnection.query(query);

            logger.info(`[searchPosts] Query executed successfully, returned ${results.length} result(s)`);
            res.json(results); // Ergebnisse als JSON zurückgeben
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
