// dress.js
/**
 * Funzione di utilità per fornire raccomandazioni ultra-brevi sull'abbigliamento
 * basate sulla temperatura, utilizzando simboli neutri e spaziatura aggiuntiva.
 *
 * @param {number} temp - Temperatura in Celsius.
 * @returns {string} Suggerimento di abbigliamento dettagliato formattato con <br><br>.
 */
const getDressSuggestion = (temp) => {
    const t = Number(temp);
    const semibr = '<br>'; // Usato per separare il simbolo dal testo
    const br = '<br><br>'; // Usato per separare il titolo dalla descrizione

    if (isNaN(t)) {
        return "Dati non disponibili";
    }

    // Logica basata sulla Temperatura, con simbolo e spaziatura aggiunta.
    if (t >= 30) {
        return `🔆${semibr}Caldo Estremo:${br}Solo abiti traspiranti. Protezione solare obbligatoria.`;
    } else if (t >= 25) {
        return `👕${semibr}Caldo:${br}T-shirt, pantaloncini. Vesti leggero.`;
    } else if (t >= 20) {
        return `👚${semibr}Mite:${br}Mezza manica. Giacca leggera sera.`;
    } else if (t >= 15) {
        return `🧥${semibr}Fresco:${br}Strati leggeri, felpa o giacca.`;
    } else if (t >= 10) {
        return `🧣${semibr}Freddo Moderato:${br}Maglione pesante e giacca.`;
    } else if (t >= 5) {
        return `🧤${semibr}Freddo:${br}Cappotto, sciarpa, guanti.`;
    } else {
        return `❄️${semibr}Freddo Intenso:${br}Giacca invernale, strati termici.`;
    }
};
/**
 * Aggiorna il contenitore dell'abbigliamento con una tabella oraria trioraria trasposta.
 *
 * @param {object} allData - Oggetto completo dei dati meteo.
 */
export const generateHourlyDressTable = (allData) => {
    const container = document.getElementById('dress-table-container');
    
    if (!container) {
        console.error("Elemento '#dress-table-container' non trovato.");
        return;
    }
    
    // Cancella l'eventuale messaggio di "Caricamento dati..."
    container.innerHTML = ''; 

    const hourlyData = allData?.hourly;

    if (!hourlyData || !hourlyData.time || !hourlyData.temperature_2m || hourlyData.time.length === 0) {
        container.innerHTML = '<p>Dati orari essenziali non disponibili per l\'abbigliamento.</p>';
        return;
    }

    const numColumns = 7; // Totale colonne richieste (0, 3, 6, 9, 12, 15, 18 ore)
    const intervalHours = 3; // Intervallo tra le colonne

    // 1. Array per raccogliere le righe di dati
    const hours = [];
    const temperatures = [];
    const suggestions = [];

    // Ottiene l'ora attuale e la arrotonda all'ora intera più vicina
    const currentTime = new Date();
    const currentHourMs = currentTime.setMinutes(0, 0, 0); 
    
    let startIndex = -1;

    // 2. Trova l'indice di partenza (l'ora attuale nei dati API)
    for (let i = 0; i < hourlyData.time.length; i++) {
        // Confronta il timestamp dell'ora API con l'ora attuale arrotondata
        if (new Date(hourlyData.time[i]).getTime() >= currentHourMs) {
            startIndex = i;
            break;
        }
    }

    if (startIndex === -1) {
          container.innerHTML = '<p>Dati orari per l\'ora attuale non trovati.</p>';
          return;
    }
    
    // 3. Itera per selezionare i 7 blocchi di dati triorari
    for (let j = 0; j < numColumns; j++) {
        const index = startIndex + (j * intervalHours);
        
        // Controlla che l'indice non superi la lunghezza dei dati disponibili
        if (index >= hourlyData.time.length) {
            // Se finiscono i dati, ferma il loop
            break; 
        }

        const time = hourlyData.time[index];
        const temp = hourlyData.temperature_2m[index]; 
        
        // Formatta l'ora (es. 14:00)
        const date = new Date(time);
        const formattedHour = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        hours.push(formattedHour);
        temperatures.push(`${Math.round(temp)}°C`);
        suggestions.push(getDressSuggestion(temp));
    }

    // Se non abbiamo abbastanza dati per le colonne richieste
    if (hours.length === 0) {
        container.innerHTML = '<p>Dati insufficienti per la previsione trioraria (7 colonne).</p>';
        return;
    }


    // 4. Costruzione della tabella TRASPOSTA
    // Aggiungiamo un <th> per l'intestazione di riga in thead
    let tableHtml = `
        <h3 class="section-title">Consigli Orari Abbigliamento (Ogni ${intervalHours} Ore)</h3>
        <div class="table-scroll-container">
            <table class="hourly-dress-table transposed-table">
                <thead>
                    <tr>
                        <th class="header-col">Ora:</th>
                        ${hours.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th class="header-col">Temp.</th>
                        ${temperatures.map(t => `<td class="temp-data">${t}</td>`).join('')}
                    </tr>
                    <tr>
                        <th class="header-col">Abbigliamento</th>
                        ${suggestions.map(s => `<td class="suggestion-data">${s}</td>`).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // 5. Inserisce la tabella nel DOM
    container.innerHTML = tableHtml;
};
