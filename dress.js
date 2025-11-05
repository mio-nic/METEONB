// dress.js
// Logica per l'abbigliamento e il rendering della tabella oraria associata.

/**
 * Funzione di utilità per fornire una semplice raccomandazione sull'abbigliamento
 * basata sulla temperatura (usiamo solo la temperatura standard).
 *
 * @param {number} temp - Temperatura in Celsius.
 * @returns {string} Suggerimento di abbigliamento.
 */
const getDressSuggestion = (temp) => {
    const t = Number(temp);

    if (isNaN(t)) {
        return "Dati non disponibili";
    }

    // Logica basata sulla Temperatura
    if (t >= 30) {
        return "☀️ Abbigliamento estivo leggerissimo";
    } else if (t >= 25) {
        return "👕 Abbigliamento leggero (maglietta, pantaloncini)";
    } else if (t >= 20) {
        return "👚 Abbigliamento primaverile/autunnale leggero";
    } else if (t >= 15) {
        return "🧥 Strati leggeri (maglia a maniche lunghe, giacca leggera)";
    } else if (t >= 10) {
        return "🧣 Giacca media, maglione";
    } else if (t >= 5) {
        return "🧤 Abbigliamento pesante (cappotto, sciarpa)";
    } else {
        return "🥶 Freddo estremo (giacca invernale, guanti, cappello)";
    }
};

/**
 * Aggiorna il contenitore dell'abbigliamento con una tabella oraria semplificata.
 *
 * @param {object} allData - Oggetto completo dei dati meteo.
 */
export const generateHourlyDressTable = (allData) => {
    const container = document.getElementById('dress-table-container');
    
    // 1. Controllo di sicurezza
    if (!container) {
        console.error("Elemento '#dress-table-container' non trovato.");
        return;
    }
    
    // Cancella l'eventuale messaggio di "Caricamento dati..."
    container.innerHTML = ''; 

    const hourlyData = allData?.hourly;

    // 2. Controllo dei dati minimi richiesti (time e temperature_2m)
    if (!hourlyData || !hourlyData.time || !hourlyData.temperature_2m || hourlyData.time.length === 0) {
        container.innerHTML = '<p>Dati orari essenziali (tempo/temperatura) non disponibili per l\'abbigliamento.</p>';
        return;
    }

    let tableHtml = `
        <h3 class="section-title">Consigli Orari Abbigliamento</h3>
        <table class="hourly-dress-table custom-table">
            <thead>
                <tr>
                    <th>Ora</th>
                    <th>Temperatura</th>
                    <th>Raccomandazione</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Visualizza le prossime 12 ore
    const numHoursToShow = 12;

    for (let i = 0; i < Math.min(hourlyData.time.length, numHoursToShow); i++) {
        const time = hourlyData.time[i];
        // ORA USIAMO SOLO temperature_2m, che è il dato confermato
        const temp = hourlyData.temperature_2m[i]; 
        
        // Formatta l'ora (es. 14:00)
        const date = new Date(time);
        const formattedTime = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        const suggestion = getDressSuggestion(temp);

        tableHtml += `
            <tr>
                <td>${formattedTime}</td>
                <td style="font-weight: bold;">${Math.round(temp)}°C</td>
                <td>${suggestion}</td>
            </tr>
        `;
    }

    tableHtml += `
            </tbody>
        </table>
    `;

    // 3. Inserisce la tabella nel DOM
    container.innerHTML = tableHtml;
};
