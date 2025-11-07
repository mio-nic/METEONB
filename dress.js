// dress.js - Versione Finale Sincronizzata Icone Giorno/Notte

// --- CONFIGURAZIONE GLOBALE (Lasciare come 0) ---
// L'offset non è più manuale; viene calcolato automaticamente in base ai fusi orari.
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
 * @param {number} numericHour - L'ora numerica (0-23) della colonna della tabella. ⭐ MODIFICATO
 * @returns {string} Tag HTML dell'icona.
 */
const getHourlyWeatherIcon = (data, index, numericHour) => {
    const { precipitation, cloud_cover, wind_speed_10m, precipitation_probability, temperature_2m } = data;
    const iconNumber = getIconNumberFromData(precipitation[index], cloud_cover[index], wind_speed_10m[index], precipitation_probability[index], temperature_2m[index]);
    
    // ⭐ USO DI numericHour GIA' PASSATO E RICONOSCIUTO NELLA COLONNA
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
            border: 1px solid #363636; padding: 6px 2px; text-align: center; font-size: 0.85em; vertical-align: middle;
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
    
    // 1. Ottieni il timestamp UTC corrente (neutro)
    const currentTimeUtcMs = new Date().getTime(); 

    // 2. Arrotonda l'ora UTC corrente all'ora intera precedente.
    const currentHourUtcMs = Math.floor(currentTimeUtcMs / ONE_HOUR_MS) * ONE_HOUR_MS; 
    
    let timeIndex = -1; // Indice basato sull'ora UTC (del browser)

    // 3. Trova l'indice del blocco dati API che corrisponde all'ora UTC calcolata.
    for (let i = 0; i < hourlyData.time.length; i++) {
        const dataTimeMs = new Date(hourlyData.time[i]).getTime();

        if (dataTimeMs === currentHourUtcMs) {
            timeIndex = i;
            break;
        }

        // Fallback per cache non allineata
        if (dataTimeMs > currentHourUtcMs && timeIndex === -1) {
            timeIndex = Math.max(0, i - 1);
            break;
        }
    }
    
    // Fallback estremo
    if (timeIndex === -1 && hourlyData.time.length > 0) {
        timeIndex = 0; 
    }
    
    // 4. Calcolo dell'Offset Dinamico:
    
    // L'offset della città target (es: New York = -5 ore)
    const targetOffsetHours = utcOffsetSeconds / 3600;
    
    // L'offset del fuso orario del tuo browser (es: Italia/CET = +1 o +2 ore)
    // getTimezoneOffset() restituisce la differenza in minuti tra UTC e l'ora locale.
    // Dobbiamo dividerla per -60 per ottenere le ore con il segno corretto (+1 o +2 per l'Italia).
    const localOffsetHours = new Date().getTimezoneOffset() / -60; 

    // L'offset necessario per allineare i DATI è la differenza tra il fuso orario locale e quello target.
    const totalOffsetHours = localOffsetHours - targetOffsetHours; 

    // Configurazione degli indici di lettura:
    // a) L'ora (time) è letta dall'indice base non sfalsato (come richiesto)
    const startIndexForTime = timeIndex; 
    
    // b) I dati sono letti dall'indice sfalsato per allinearsi all'ora della città target
    const startIndexForData = timeIndex - totalOffsetHours; 

    if (startIndexForTime < 0 || startIndexForTime >= hourlyData.time.length) {
        container.innerHTML = '<p>Errore nel calcolo dell\'indice per l\'ora.</p>';
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

    // 6. Itera per selezionare i 12 blocchi di dati orari
    for (let j = 0; j < numColumns; j++) {
        // Indice di lettura per l'ORA
        const timeReadIndex = startIndexForTime + j; 
        
        // Indice di lettura per i DATI (dinamico)
        const dataReadIndex = startIndexForData + j; 
        
        if (timeReadIndex >= time.length || dataReadIndex >= time.length || dataReadIndex < 0) {
            break; 
        }

        const currentHourTime = time[timeReadIndex]; // Usa l'indice non sfalsato per l'ora
        
        // ACCESSO AI DATI: USIAMO L'INDICE dataReadIndex
        const temp = temperature_2m[dataReadIndex]; 
        const pop = precipitation_probability ? (precipitation_probability[dataReadIndex] || 0) : 0;
        const precip = precipitation ? (precipitation[dataReadIndex] || 0) : 0; 

        // Formatta l'ora con il fuso orario della città
        const date = new Date(currentHourTime);
        const formattedHourFull = date.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: cityTimeZone 
        });
        
        // Estraiamo l'ora a due cifre per l'intestazione della colonna (Es. "18")
        const formattedHour = formattedHourFull.substring(0, 2); 
        hours.push(formattedHour); 
        
        // ⭐ NUOVA LOGICA: Estraiamo l'ora numerica per la decisione giorno/notte
        const numericHourForIcon = parseInt(formattedHour);

        // Chiama la funzione per l'icona HTML (PASSANDO L'ORA NUMERICA)
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


    // 7. Costruzione della tabella TRASPOSTA
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

    // 8. Inserisce la tabella nel DOM
    container.innerHTML = tableHtml;
};
