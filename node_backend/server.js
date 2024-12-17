// ----------------------------------- IMPORTS ---------------------------------------
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { logger } = require(path.join(process.cwd(), '/logging/logging'));
const { checkUvicornServer } = require(path.join(process.cwd(), '/ml_server/connection'));

// ----------------------------------- INITIALISIERUNG -------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------------- MIDDLEWARES -----------------------------------
app.use(cookieParser()); // Cookie-Parser für das Auslesen von Cookies
app.use(express.json()); // JSON-Body-Parser
app.use(express.urlencoded({ extended: true })); // URL-Encoded Body-Parser

// ----------------------------------- STATISCHES FRONTEND ---------------------------
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ----------------------------------- ROUTEN ----------------------------------------
// Dynamische Routeneinbindung
const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js')) {
        logger.info(`Loading route file: ${file}`); // Debug-Ausgabe
        const route = require(path.join(routesPath, file));
        app.use('/api', route);
    }
});

// Haupt-Route für die Startseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ----------------------------------- SERVER STARTEN --------------------------------
app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});

// ----------------------------------- UVICORN CHECK ---------------------------------
checkUvicornServer();
