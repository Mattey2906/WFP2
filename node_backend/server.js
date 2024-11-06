// /node_backend/server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');
const { logger } = require(path.join(process.cwd(), '/logging/logging'));
const { checkUvicornServer } = require(path.join(process.cwd(), '/ml_server/connection'));

app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'frontend')));
const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js')) {
        const route = require(path.join(routesPath, file));
        app.use('/api', route);
    }
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Server starten
app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});

checkUvicornServer();