const path = require('path');
const { logger } = require(path.join(process.cwd(), '/logging/logging'));

function escapeSQLQuery(query) {
    // Escaping kritischer Zeichen
    return query
        .replace(/\\/g, "\\\\") // Backslashes escapen
        .replace(/"/g, '\\"')  // Doppelte Anführungszeichen escapen
        .replace(/'/g, "\\'")  // Einfache Anführungszeichen escapen
        .replace(/\n/g, "\\n") // Neue Zeilen escapen
        .replace(/\r/g, "\\r") // Wagenrücklauf escapen
        .replace(/\t/g, "\\t"); // Tabs escapen
}

const axios = require("axios");

async function sendSQLQueryToUvicorn(query, modelSelection = "default_model") {
    // Query escapen
    const escapedQuery = escapeSQLQuery(query);

    const payload = {
        query: escapedQuery,
        model_selection: modelSelection,
    };

    try {
        logger.info("Sending SQL query to Uvicorn: " + escapedQuery);

        const response = await axios.post("http://127.0.0.1:8001/analyze-sql", payload, {
            headers: { "Content-Type": "application/json" },
        });
        return response.data;
    } catch (error) {
        console.error("Error sending SQL query:", error.message);
        throw error;
    }
}

module.exports = { escapeSQLQuery, sendSQLQueryToUvicorn };
