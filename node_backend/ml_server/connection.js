const axios = require('axios');
const path = require("path");
const { logger } = require(path.join(process.cwd(), '/logging/logging'));

const checkUvicornServer = async () => {
    try {
        const response = await axios.get('http://127.0.0.1:8001/health');

        if (response.status === 200) {
            const { status, uptime } = response.data;
            console.info(`Uvicorn Server erreichbar. Status: ${status}. Uptime: ${uptime}`);
        } else {
            logger.info(`Uvicorn Server nicht erreichbar. Statuscode: ${response.status}`);
        }
    } catch (error) {
        logger.error(`Fehler beim Überprüfen des Uvicorn-Servers: ${error.message}`);
    }
};

module.exports = { checkUvicornServer };
