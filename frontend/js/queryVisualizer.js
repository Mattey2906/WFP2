export function visualizeSQLInjection(queries, userInput, dbResponses, mlResponses, containerId = []) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Container with ID ${containerId} not found.`);
        return;
    }

    // Container sichtbar machen
    container.style.display = 'block';

    container.innerHTML = ''; // Alte Inhalte löschen

    // Überschrift mit Toggle-Funktion hinzufügen
    const title = document.createElement('h3');
    title.style.cursor = 'pointer'; // Zeigt an, dass es klickbar ist

    // Pfeil-Icon hinzufügen
    const arrow = document.createElement('span');
    arrow.textContent = '▶'; // Standardmäßig geschlossen
    arrow.style.marginRight = '10px';
    title.appendChild(arrow);

    // Text hinzufügen
    const titleText = document.createTextNode('SQL Injection Visualization');
    title.appendChild(titleText);

    container.appendChild(title);

    // Inhalt-Container erstellen
    const contentContainer = document.createElement('div');
    contentContainer.style.display = 'none'; // Startet versteckt
    container.appendChild(contentContainer);

    // Event-Listener für das Auf- und Zuklappen
    title.addEventListener('click', () => {
        if (contentContainer.style.display === 'none') {
            contentContainer.style.display = 'block';
            arrow.textContent = '▼'; // Geöffnet
        } else {
            contentContainer.style.display = 'none';
            arrow.textContent = '▶'; // Geschlossen
        }
    });

    // User Input anzeigen
    const userInputDiv = document.createElement('div');
    userInputDiv.innerHTML = `<strong>User Input:</strong><pre>${JSON.stringify(userInput, null, 2)}</pre>`;
    contentContainer.appendChild(userInputDiv);

    // Queries, DB-Responses und ML-Responses anzeigen
    const queryList = document.createElement('ul');
    queryList.innerHTML = '<strong>Executed Queries, Responses, and ML Results:</strong>';
    queries.forEach((query, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Query ${index + 1}: ${query}`;

        // Füge Query zur Liste hinzu
        queryList.appendChild(listItem);

        // Zeige die entsprechenden DB-Response an
        if (dbResponses[index] && dbResponses[index].length > 0) {
            const responseDiv = document.createElement('div');
            responseDiv.innerHTML = `
                <strong>DB Rows for Query ${index + 1}:</strong>
                <pre>${JSON.stringify(dbResponses[index], null, 2)}</pre>
            `;
            responseDiv.style.marginLeft = '20px'; // Leichte Einrückung für Übersichtlichkeit
            queryList.appendChild(responseDiv);
        } else {
            const noResponseDiv = document.createElement('div');
            noResponseDiv.innerHTML = `<strong>DB Rows for Query ${index + 1}:</strong> No rows returned.`;
            noResponseDiv.style.marginLeft = '20px';
            queryList.appendChild(noResponseDiv);
        }

        // Zeige die entsprechenden ML-Response an
        if (mlResponses[index]) {
            const mlResponseDiv = document.createElement('div');
            mlResponseDiv.innerHTML = `
                <strong>ML Response for Query ${index + 1}:</strong>
                <pre><strong>Predicted Class:</strong> ${mlResponses[index].predicted_class}</pre>
                <pre><strong>Probabilities:</strong> ${JSON.stringify(mlResponses[index].probabilities, null, 2)}</pre>
                <pre><strong>Message:</strong> ${mlResponses[index].message}</pre>
            `;
            mlResponseDiv.style.marginLeft = '20px';
            queryList.appendChild(mlResponseDiv);
        } else {
            const noMLResponseDiv = document.createElement('div');
            noMLResponseDiv.innerHTML = `<strong>ML Response for Query ${index + 1}:</strong> No ML response available.`;
            noMLResponseDiv.style.marginLeft = '20px';
            queryList.appendChild(noMLResponseDiv);
        }
    });

    contentContainer.appendChild(queryList);
}
