// dress.js
// Logica per l'abbigliamento e il rendering della tabella oraria associata.

/**
 * Funzione di utilità per fornire una semplice raccomandazione sull'abbigliamento
 * basata sulla temperatura e sulla probabilità di precipitazioni.
 *
 * @param {number} temp - Temperatura in Celsius.
 * @param {number} precipitationProb - Probabilità di precipitazioni (0-100%).
 * @returns {string} Suggerimento di abbigliamento.
 */
const getDressSuggestion = (temp, precipitationProb) => {
    const t = Number(temp);
    const p = Number(precipitationProb);
    let suggestion = '';

    if (isNaN(t)) {
        return "Dati non disponibili";
    }

    // 1. Logica basata sulla Temperatura
    if (t >= 30) {
        suggestion = "☀️ Abbigliamento estivo leggerissimo";
    } else if (t >= 25) {
        suggestion = "👕 Abbigliamento leggero (maglietta, pantaloncini)";
    } else if (t >= 20) {
        suggestion = "👚 Abbigliamento primaverile/autunnale leggero";
    } else if (t >= 15) {
        suggestion = "🧥 Strati leggeri (maglia a maniche lunghe, giacca leggera)";
    } else if (t >= 10) {
        suggestion = "🧣 Giacca media, maglione";
    } else if (t >= 5) {
        suggestion = "🧤 Abbigliamento pesante (cappotto, sciarpa)";
    } else {
        suggestion = "🥶 Freddo estremo (giacca invernale, guanti, cappello)";
    }

    // 2. Aggiunta della logica per la Pioggia
    if (p > 50) {
        suggestion += " + ☔️ **Porta un ombrello!**";
    } else if (p > 20) {
        suggestion += " + ☂️ Potrebbe servire l'ombrello.";
    }

    return suggestion;
};

/**
 * Aggiorna il contenitore dell'abbigliamento con una tabella oraria semplificata.
 *
 * @param {object} allData - Oggetto completo dei dati meteo (da getWeatherData).
 */
export const generateHourlyDressTable = (allData) => {
    const container = document.getElementById('dress-table-container');
    
    // Controllo di sicurezza: verifica che l'elemento HTML esista
    if (!container) {
        console.error("Elemento '#dress-table-container' non trovato. Impossibile eseguire il rendering della tabella Abbigliamento.");
        return;
    }
    
    // Cancella l'eventuale messaggio di "Caricamento dati..."
    container.innerHTML = ''; 

    const hourlyData = allData?.hourly;

    if (!hourlyData || !hourlyData.time || hourlyData.time.length === 0) {
        container.innerHTML = '<p>Dati orari non disponibili per l\'abbigliamento.</p>';
        return;
    }

    let tableHtml = `
        <h3 class="section-title">Consigli Orari Abbigliamento</h3>
        <table class="hourly-dress-table custom-table">
            <thead>
                <tr>
                    <th>Ora</th>
                    <th>Temp. percepita</th>
                    <th>Prob. Pioggia</th>
                    <th>Raccomandazione</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Visualizza le prossime 12 ore per una previsione ragionevole
    const numHoursToShow = 12;

    for (let i = 0; i < Math.min(hourlyData.time.length, numHoursToShow); i++) {
        const time = hourlyData.time[i];
        // Usiamo la temperatura apparente per una raccomandazione più accurata
        const apparentTemp = hourlyData.apparent_temperature[i]; 
        const precipitationProb = hourlyData.precipitation_probability[i];
        
        // Formatta l'ora (es. 14:00)
        const date = new Date(time);
        const formattedTime = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        const suggestion = getDressSuggestion(apparentTemp, precipitationProb);

        tableHtml += `
            <tr>
                <td>${formattedTime}</td>
                <td style="font-weight: bold;">${Math.round(apparentTemp)}°C</td>
                <td>${Math.round(precipitationProb)}%</td>
                <td>${suggestion}</td>
            </tr>
        `;
    }

    tableHtml += `
            </tbody>
        </table>
    `;

    // Inserisce la tabella nel DOM
    container.innerHTML = tableHtml;
};
