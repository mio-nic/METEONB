// dress.js - Versione Finale Sincronizzata Icone Giorno/Notte (Logica basata sull'ora della Città)

// --- CONFIGURAZIONE GLOBALE (Lasciare come 0) ---
// --------------------------------------------------

// --- DIPENDENZE E COSTANTI ---
const ICON_BASE_URL = "https://meteofree.altervista.org/METEONB/ICONE/";
const ONE_HOUR_MS = 3600000;

// Funzioni di Supporto (Invariate)
const createIconTag = (iconNumber, altText = 'Icona Meteo') => {
    return `<img src="${ICON_BASE_URL}${iconNumber}.png" alt="${altText}" style="width: 36px; height: 36px; vertical-align: middle;" />`;
};

const getIconNumberFromData = (precipitation, cloudCover, windSpeed, precipProb, temperature_2m) => {
    if (precipitation >= 0.1 && temperature_2m < 1) { return 13; }
    if (precipProb >= 70 && windSpeed >= 30) { return 8; }
    if (precipitation >= 5.0) { return 7; }
    if (precipitation >= 0.5) { return 6; }
    if (precipitation >= 0.1) { return 5; }
    if (cloudCover >= 80) { return 4; }
    if (cloudCover >= 50) { return 3; }
    if (cloudCover >= 20) { return 2; }
    return 1;
};

/**
 * Calcola l'icona del tempo oraria, basandosi sull'ora numerica passata.
 *
 * @param {object} data - Dati orari completi dall'API.
 * @param {number} index - Indice dell'ora corrente.
 * @param {number} numericHour - L'ora numerica (0-23) della colonna della tabella.
 * @returns {string} Tag HTML dell'icona.
 */
const getHourlyWeatherIcon = (data, index, numericHour) => {
    const { precipitation, cloud_cover, wind_speed_10m, precipitation_probability, temperature_2m } = data;
    const iconNumber = getIconNumberFromData(precipitation[index], cloud_cover[index], wind_speed_10m[index], precipitation_probability[index], temperature_2m[index]);
    
    // Uso di numericHour per la decisione giorno/notte nella città target
    const isNight = numericHour >= 18 || numericHour < 6;
    
    // Applica l'icona notturna (9) solo se l'icona originale è soleggiata/parzialmente nuvolosa (1, 2, 3)
    if (isNight && iconNumber <= 3) {
        return createIconTag(9, 'Meteo Notturno');
    }
    
    return createIconTag(iconNumber, 'Meteo Diurno/Precipitazioni');
};

const getDressSuggestion = (temp) => {
    const t = Number(temp);
    if (t >= 30) { return `Costume`; } else if (t >= 25) { return `T-shirt`; } else if (t >= 20) { return `Maglietta`; } else if (t >= 15) { return `Felpa`; } else if (t >= 10) { return `Giacca`; } else if (t >= 5) { return `Giubbotto`; } else { return `Cappotto.`; }
};

const getTempColorClass = (temp) => {
    const t = Number(temp);
    if (t >= 30) { return "col-extreme"; } else if (t >= 25) { return "col-hot"; } else if (t >= 20) { return "col-mild"; } else if (t >= 15) { return "col-fresh"; } else if (t >= 10) { return "col-cold"; } else if (t >= 5) { return "col-freezing"; } else { return "col-intense"; }
};

/**
 * Inietta stili CSS specifici utilizzando l'ID del contenitore.
 */
const injectDressTableStyles = () => {
    if (document.getElementById('dress-table-styles')) return;
    const style = document.createElement('style');
    style.id = 'dress-table-styles';
    style.innerHTML = ` 
        #dress-table-container .hourly-dress-table {
            width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 10px;
        }
        #dress-table-container .hourly-dress-table th, 
        #dress-table-container .hourly-dress-table td {
            border: 1px solid #363636; padding: 6px 2px; text-align: center; font-size: 0.85em; vertical-align: middle; width: 60px;
        }
        #dress-table-container .hourly-dress-table th {
            background-color: #000000; font-weight: bold; font-size: 0.9em; color: #ffffff;
        }
        #dress-table-container .hourly-dress-table td.temp-data {
            font-weight: bold;
        }
        #dress-table-container .col-extreme { background-color: #b00000; }
        #dress-table-container .col-hot { background-color: #b06c00; }
        #dress-table-container .col-mild { background-color: #b5b200; }
        #dress-table-container .col-fresh { background-color: #00680e; }
        #dress-table-container .col-cold { background-color: #006f91; }
        #dress-table-container .col-freezing { background-color: #004991; }
        #dress-table-container .col-intense { background-color: #730091; }
        #dress-table-container .table-scroll-container {
            overflow-x: auto;
            max-width: 100%;
        }
    `;
    document.head.appendChild(style);
};


/**
 * Aggiorna il contenitore dell'abbigliamento con una tabella oraria di 12 ore trasposta.
 * @param {object} allData - Oggetto completo dei dati API.
 */
export const generateHourlyDressTable = (allData) => {
    injectDressTableStyles(); 

    const container = document.getElementById('dress-table-container');
    if (!container) return;
    
    container.innerHTML = ''; 

    const hourlyData = allData?.hourly;
    const cityTimeZone = allData?.timezone;
    const utcOffsetSeconds = allData?.utc_offset_seconds; 

    if (!hourlyData || !hourlyData.time || hourlyData.time.length === 0 || !cityTimeZone || typeof utcOffsetSeconds === 'undefined') {
        container.innerHTML = '<p>Dati orari essenziali non disponibili.</p>';
        return;
    }

    // --- LOGICA DI CALCOLO DELL'INDICE DI PARTENZA (startIndex) ---

    // 1. Ottieni l'ora intera attuale nella città target (0-23)
    const now = new Date();
    // Ottieni la stringa dell'ora nella città target (es. "01:00")
    const cityTimeString = now.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: cityTimeZone 
    });
    // Estrai l'ora numerica arrotondata per eccesso (o l'ora corrente se non sono passati minuti)
    const currentCityHour = parseInt(cityTimeString.substring(0, 2));

    // 2. Trova l'indice corretto nell'array API.
    // L'array API contiene timestamp UTC, che formattati con timeZone: cityTimeZone, 
    // devono corrispondere all'ora attuale della città (currentCityHour).
        
    let timeIndex = -1; // Indice unico di partenza
    let minTimeDifference = Infinity; // Per trovare l'ora più vicina in caso di secondi

    for (let i = 0; i < hourlyData.time.length; i++) {
        const dataTime = new Date(hourlyData.time[i]);
        
        // Formatta il timestamp API nell'ora della città per il confronto (es. "01")
        const apiHourString = dataTime.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            timeZone: cityTimeZone 
        }).substring(0, 2);
        
        const apiHour = parseInt(apiHourString);

        // Se l'ora formattata dell'API corrisponde all'ora attuale della città:
        if (apiHour === currentCityHour) {
            // Troviamo l'indice che visualizzerà l'ora corretta.
            timeIndex = i;
            // Per maggiore precisione, se siamo a cavallo dell'ora, potremmo
            // voler trovare l'indice con il timestamp più vicino all'ora intera.
            
            // Per il problema mezzanotte/cambio giorno, ci fermiamo al primo match.
            break; 
        }
    }
        
    // Fallback: cerca l'ora successiva se non abbiamo trovato un match esatto (es. se l'API non è aggiornata)
    if (timeIndex === -1 && hourlyData.time.length > 0) {
        let foundNextHour = false;
        for (let i = 0; i < hourlyData.time.length; i++) {
            const dataTime = new Date(hourlyData.time[i]);
            const apiHourString = dataTime.toLocaleTimeString('it-IT', { 
                hour: '2-digit', 
                timeZone: cityTimeZone 
            }).substring(0, 2);
            const apiHour = parseInt(apiHourString);

            // Cerca la prima ora successiva all'ora attuale
            if (apiHour > currentCityHour) {
                timeIndex = i; // Iniziamo da questa ora (che è la prossima)
                foundNextHour = true;
                break;
            }
        }
        
        if (!foundNextHour) {
            // Se non trova nessuna ora successiva (siamo quasi alla fine dei dati del giorno),
            // inizia semplicemente dal primo dato disponibile.
            timeIndex = 0;
        }
    }
    
    // Fallback estremo se ancora non trovato.
    if (timeIndex === -1) {
        timeIndex = 0; 
    }
        
    // 3. Configurazione degli indici di lettura: USIAMO UN SOLO INDICE
    const startIndexForTime = timeIndex; 
    const startIndexForData = timeIndex; 

    if (startIndexForTime < 0 || startIndexForTime >= hourlyData.time.length) {
        container.innerHTML = '<p>Errore nel calcolo dell\'indice di partenza. Dati non disponibili.</p>';
        return;
    }

    // --- FINE LOGICA DI CALCOLO INDICE BASE ---


    const numColumns = 12; // Tabella di 12 ore
    const { precipitation, precipitation_probability, cloud_cover, wind_speed_10m, temperature_2m, time } = hourlyData;
    
    const hours = [];
    const weatherIcons = []; 
    const temperatures = [];
    const suggestions = [];
    const combinedPrecipitation = []; 
    const colorClasses = []; 

    // 4. Itera per selezionare i 12 blocchi di dati orari
    for (let j = 0; j < numColumns; j++) {
        // Indice di lettura UNICO per ORA e DATI
        const timeReadIndex = startIndexForTime + j; 
        const dataReadIndex = startIndexForData + j; 
        
        if (timeReadIndex >= time.length || dataReadIndex >= time.length || dataReadIndex < 0) {
            break; 
        }

        const currentHourTime = time[timeReadIndex]; // Timestamp UTC
        
        // ACCESSO AI DATI E ORA: USIAMO dataReadIndex/timeReadIndex
        const temp = temperature_2m[dataReadIndex]; 
        const pop = precipitation_probability ? (precipitation_probability[dataReadIndex] || 0) : 0;
        const precip = precipitation ? (precipitation[dataReadIndex] || 0) : 0; 

        // Formatta il timestamp UTC con il fuso orario della città (CORRETTO)
        const date = new Date(currentHourTime);
        const formattedHourFull = date.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: cityTimeZone // Questo converte il timestamp UTC nell'ora visualizzata (es. 02:00)
        });
        
        // Estraiamo l'ora a due cifre per l'intestazione della colonna (Es. "02")
        const formattedHour = formattedHourFull.substring(0, 2); 
        hours.push(formattedHour); 
        
        // Estraiamo l'ora numerica per la decisione giorno/notte
        const numericHourForIcon = parseInt(formattedHour);

        // Chiama la funzione per l'icona HTML (PASSANDO L'ORA NUMERICA e l'indice dei DATI)
        const iconHtml = getHourlyWeatherIcon(hourlyData, dataReadIndex, numericHourForIcon); 
        weatherIcons.push(iconHtml);
        
        temperatures.push(`${Math.round(temp)}°C`);
        suggestions.push(getDressSuggestion(temp));
        
        // Unisci i dati di precipitazione
        const combined = `${Math.round(pop)}%, ${precip.toFixed(1)} mm`;
        combinedPrecipitation.push(combined);
        
        // Ottiene la classe di colore per questa colonna
        colorClasses.push(getTempColorClass(temp));
    }

    if (hours.length === 0) {
        container.innerHTML = '<p>Dati insufficienti per la previsione oraria (12 colonne).</p>';
        return;
    }


    // 5. Costruzione della tabella TRASPOSTA
    let tableHtml = `
        <div class="table-scroll-container">
            <table class="hourly-dress-table transposed-table">
                <thead>
                    <tr>
                        ${hours.map((h) => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${weatherIcons.map((icon) => `<td class="weather-icon-data">${icon}</td>`).join('')}
                    </tr>
                    <tr>
                        ${temperatures.map((t, i) => `<td class="temp-data ${colorClasses[i]}">${t}</td>`).join('')}
                    </tr>
                    <tr>
                        ${combinedPrecipitation.map((c) => `<td class="precip-data">${c}</td>`).join('')}
                    </tr>
                    <tr>
                        ${suggestions.map((s) => `<td class="suggestion-data">${s}</td>`).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // 6. Inserisce la tabella nel DOM
    container.innerHTML = tableHtml;
};
