// dress.js

// 🛑 IMPORTANTE: Inietta gli stili CSS per la tabella
const injectDressTableStyles = () => {
    // Evita di iniettare lo stile più volte
    if (document.getElementById('dress-table-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'dress-table-styles';
    style.innerHTML = `
        /* Contenitore per lo scorrimento laterale */
        .table-scroll-container {
            overflow-x: auto; 
            width: 100%; 
            
        }

        /* Stile base per la tabella (Desktop/Fisso) */
        .hourly-dress-table.transposed-table {
            /*min-width: 1600px;*/ 
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 0.85em; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            color: var(--text-color); 
        }

        /* Stile per intestazioni e celle (rese più strette) */
        .transposed-table th, 
        .transposed-table td {
            padding: 5px 0px !important;
            text-align: center;
            border: 1px solid var(--border-color); 
            /*white-space: nowrap;*/
            vertical-align: top; 
            min-width: 70px !important; 
        }

        /* Colonna di intestazione fissa a sinistra (RESA PIÙ STRETTA) */
        .transposed-table th.header-col {
            background-color: var(--table-row-even-bg); 
            color: var(--text-color);
            text-align: left;
            width: 1px; /* Forza la larghezza minima */
            padding: 5px 8px; /* RIDUZIONE CHIAVE: Padding ridotto */
            font-weight: bold;
            position: sticky; 
            left: 0;
            z-index: 20; 
            font-size: 1em; 
        }

        /* Sfondo delle righe (usa le variabili globali) */
        .transposed-table tbody tr:nth-child(even) {
            background-color: var(--table-row-even-bg);
        }
        .transposed-table tbody tr:nth-child(odd) {
            background-color: var(--table-row-odd-bg);
        }

        /* Intestazione superiore (le ore) */
        .transposed-table thead th {
            background-color: var(--table-header-bg);
            color: var(--text-color);
            font-weight: 600;
        }



        /* Stile specifico per i dati di temperatura */
        .transposed-table .temp-data {
            font-weight: bold;
            color:#ff6f6f; 
        }
        
        /* Stile per il testo della raccomandazione (più compatto) */
        .transposed-table .suggestion-data {
             font-size: 0.75em; 
             line-height: 1.1;
        }
        
        /* Stile per le precipitazioni unite */
        .transposed-table .precip-data {
            font-size: 0.8em;
            color: #87ceeb; /* Azzurro per i dati relativi all'acqua */
        }
    `;
    document.head.appendChild(style);
};


/**
 * Funzione di utilità per fornire raccomandazioni ultra-brevi sull'abbigliamento
 * basate sulla temperatura, utilizzando simboli neutri e spaziatura aggiuntiva.
 *
 * @param {number} temp - Temperatura in Celsius.
 * @returns {string} Suggerimento di abbigliamento dettagliato formattato con <br>.
 */
const getDressSuggestion = (temp) => {
    const t = Number(temp);
    const br = '<br>'; 

    if (isNaN(t)) {
        return "Dati non disponibili";
    }

    // Logica basata sulla Temperatura, con simbolo e spaziatura ridotta.
    if (t >= 30) {
        return `🔴${br}Estremo:${br}costume`;
    } else if (t >= 25) {
        return `🟠${br}Caldo:${br}T-shirt`;
    } else if (t >= 20) {
        return `🟡${br}Mite:${br}Mezza manica`;
    } else if (t >= 15) {
        return `🟢${br}Fresco:${br}Felpa`;
    } else if (t >= 10) {
        return `🔵${br}Freddo:${br}Maglione`;
    } else if (t >= 5) {
        return `🟣${br}Freddo:${br}Giubbotto`;
    } else {
        return `❄️${br}Intenso:${br}Cappotto.`;
    }
};

/**
 * Aggiorna il contenitore dell'abbigliamento con una tabella oraria di 24 ore trasposta.
 *
 * @param {object} allData - Oggetto completo dei dati meteo.
 */
export const generateHourlyDressTable = (allData) => {
    // 1. INIETTA GLI STILI FISSI PRIMA DI GENERARE LA TABELLA
    injectDressTableStyles(); 

    const container = document.getElementById('dress-table-container');
    
    if (!container) {
        console.error("Elemento '#dress-table-container' non trovato.");
        return;
    }
    
    container.innerHTML = ''; 

    const hourlyData = allData?.hourly;

    if (!hourlyData || !hourlyData.time || hourlyData.time.length === 0) {
        container.innerHTML = '<p>Dati orari essenziali non disponibili per l\'abbigliamento.</p>';
        return;
    }

    const numColumns = 12; // Tabella di 24 ore
    const precipitationSum = hourlyData.precipitation_sum;
    const precipitationProbability = hourlyData.precipitation_probability;


    // Array per raccogliere le righe di dati
    const hours = [];
    const temperatures = [];
    const suggestions = [];
    const combinedPrecipitation = []; // Nuova riga combinata

    // Ottiene l'ora attuale e la arrotonda all'ora intera più vicina
    const currentTime = new Date();
    const currentHourMs = currentTime.setMinutes(0, 0, 0); 
    
    let startIndex = -1;

    // 2. Trova l'indice di partenza (l'ora attuale nei dati API)
    for (let i = 0; i < hourlyData.time.length; i++) {
        if (new Date(hourlyData.time[i]).getTime() >= currentHourMs) {
            startIndex = i;
            break;
        }
    }

    if (startIndex === -1) {
          container.innerHTML = '<p>Dati orari per l\'ora attuale non trovati.</p>';
          return;
    }
    
    // 3. Itera per selezionare i 24 blocchi di dati orari
    for (let j = 0; j < numColumns; j++) {
        const index = startIndex + j;
        
        if (index >= hourlyData.time.length) {
            break; 
        }

        const time = hourlyData.time[index];
        const temp = hourlyData.temperature_2m[index]; 
        const pop = precipitationProbability ? (precipitationProbability[index] || 0) : 0;
        const precip = precipitationSum ? (precipitationSum[index] || 0) : 0; 
        
        // Formatta l'ora (es. 14:00)
        const date = new Date(time);
        const formattedHour = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        hours.push(formattedHour.substring(0, 2)); // Solo l'ora (es. "14")
        temperatures.push(`${Math.round(temp)}°C`);
        suggestions.push(getDressSuggestion(temp));
        
        // Unisci i dati di precipitazione nel formato richiesto: "XX%, X.X mm"
        const combined = `${Math.round(pop)}%, ${precip.toFixed(1)} mm`;
        combinedPrecipitation.push(combined);
    }

    if (hours.length === 0) {
        container.innerHTML = '<p>Dati insufficienti per la previsione oraria (24 colonne).</p>';
        return;
    }


    // 4. Costruzione della tabella TRASPOSTA (con intestazione Ora: vuota)
    let tableHtml = `
        
        <div class="table-scroll-container">
            <table class="hourly-dress-table transposed-table">
                <thead>
                    <tr>
                        
                        ${hours.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        
                        ${temperatures.map(t => `<td class="temp-data">${t}</td>`).join('')}
                    </tr>
                    <tr>
                        
                        ${combinedPrecipitation.map(c => `<td class="precip-data">${c}</td>`).join('')}
                    </tr>
                    <tr>
                        
                        ${suggestions.map(s => `<td class="suggestion-data">${s}</td>`).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // 5. Inserisce la tabella nel DOM
    container.innerHTML = tableHtml;
};
