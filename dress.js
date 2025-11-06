// dress.js

// --- COPIE DI FUNZIONI E COSTANTI DA main.js PER LA GESTIONE DELLE ICONE ---
const ICON_BASE_URL = "https://meteofree.altervista.org/METEONB/ICONE/";

const createIconTag = (iconNumber, altText = 'Icona Meteo') => {
    // Dimensioni a 36x36px
    return `<img src="${ICON_BASE_URL}${iconNumber}.png" alt="${altText}" style="width: 36px; height: 36px; vertical-align: middle;" />`;
};

const getIconNumberFromData = (precipitation, cloudCover, windSpeed, precipProb, temperature_2m) => {
    // 0. NEVE (Icona 13) - NEVE
    if (precipitation >= 0.1 && temperature_2m < 1) {
        return 13; 
    }
    
    // 1. TEMPORALE (Icona 8) - Alta probabilità di pioggia + vento forte
    if (precipProb >= 70 && windSpeed >= 30) {
        return 8; 
    }
    
    // 2. PIOGGIA FORTE (Icona 7) - Precipitazioni >= 5 mm
    if (precipitation >= 5.0) {
        return 7;
    }

    // 3. PIOGGIA MODERATA (Icona 6) - Precipitazioni tra 0.5 mm e 5 mm
    if (precipitation >= 0.5) {
        return 6;
    }

    // 4. PIOGGIA LEGGERA (Icona 5) - Precipitazioni tra 0.1 mm e 0.5 mm
    if (precipitation >= 0.1) {
        return 5;
    }
    
    // Se non c'è pioggia significativa (preciptation < 0.1 mm), controlla le nuvole
    
    // 5. COPERTO (Icona 4) - Copertura nuvolosa alta
    if (cloudCover >= 80) {
        return 4;
    }
    
    // 6. NUVOLOSO (Icona 3) - Copertura nuvolosa media
    if (cloudCover >= 50) {
        return 3;
    }
    
    // 7. PREVALENTEMENTE SERENO (Icona 2) - Copertura nuvolosa bassa
    if (cloudCover >= 20) {
        return 2;
    }

    // 8. SERENO (Icona 1) - Copertura nuvolosa minima
    return 1;
};

const getHourlyWeatherIcon = (data, index) => {
    // Assicurati che i dati necessari per la nuova logica siano estratti:
    const { precipitation, cloud_cover, wind_speed_10m, precipitation_probability, temperature_2m, time } = data;
    
    // Calcola il numero base dell'icona usando la nuova logica
    const iconNumber = getIconNumberFromData(
        precipitation[index], 
        cloud_cover[index], 
        wind_speed_10m[index], 
        precipitation_probability[index],
        temperature_2m[index]
    );
    
    const date = new Date(time[index]);
    const hour = date.getHours();
    
    // Controlla se l'ora è NOTTURNA (tra le 18:00 inclusa e le 6:00 esclusa)
    const isNight = hour >= 18 || hour < 6;
    
    // Gestione Notte: Solo se l'icona base è Sereno (1), Prev. Sereno (2) o Nuvoloso (3)
    if (isNight && iconNumber <= 3) {
        // Notte: Usa sempre l'icona 9 (Luna)
        return createIconTag(9, 'Meteo Notturno');
    }
    
    // Per tutti gli altri codici (pioggia, neve, temporale, o giorno), usa l'icona determinata
    return createIconTag(iconNumber, 'Meteo Diurno/Precipitazioni');
};
// --- FINE COPIE DI FUNZIONI main.js ---


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
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 0px;
            font-size: 0.85em; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            color: var(--text-color); 
            box-shadow: 0 0 10px rgb(0 129 255);
        }

        /* Stile per intestazioni e celle (rese più strette) */
        .transposed-table th, 
        .transposed-table td {
            padding: 5px 0px !important;
            text-align: center;
            border: 1px solid #3c3c3c; 
            vertical-align: top; 
            min-width: 70px !important; 
            
        }
        
        /* Stile specifico per le icone meteo */
        .transposed-table .weather-icon-data {
            font-size: 1.5em; 
            padding-top: 5px !important; 
            padding-bottom: 5px !important; 
            line-height: 1;
        }
        .transposed-table .weather-icon-data img {
            width: 36px; 
            height: 36px;
        }


        /* Colonna di intestazione fissa a sinistra */
        .transposed-table th.header-col {
            background-color: var(--table-row-even-bg); 
            color: var(--text-color);
            text-align: left;
            width: 1px;
            padding: 5px 8px;
            font-weight: bold;
            position: sticky; 
            left: 0;
            z-index: 20; 
            font-size: 1em; 
        }

        /* Intestazione superiore (le ore) */
        .transposed-table thead th {
            background-color: var(--table-header-bg);
            color: var(--text-color);
            font-weight: 600;
        }

        /* MODIFICA CHIAVE: Targetta solo le celle della temperatura per l'aspetto "colorato" */
        .transposed-table .temp-data {
            font-weight: bold;
            color: white !important; /* Testo bianco per la leggibilità sugli sfondi scuri */
        }
        
        /* ECCEZIONE: Per il colore Giallo, il testo deve restare nero */
        .transposed-table .col-mild {
            color: black !important;
        }
        
        /* Stile per il testo della raccomandazione (più compatto) */
        .transposed-table .suggestion-data {
              font-size: 0.75em; 
              line-height: 1.1;
        }
        
        /* Stile per le precipitazioni unite */
        .transposed-table .precip-data {
            font-size: 0.8em;
        }
        
        
        /* 🎨 CLASSI DI COLORE DI SFONDO (USATE SOLO SU .temp-data) 🎨 */
        .col-extreme { background-color: #b00000; } /* Rosso (>= 30°C) */
        .col-hot 	 { background-color: #b06c00; } /* Arancione (>= 25°C) */
        .col-mild 	 { background-color: #b5b200; } /* Giallo chiaro (>= 20°C) */
        .col-fresh 	 { background-color: #00680e; } /* Verde (>= 15°C) */
        .col-cold 	 { background-color: #006f91; } /* Azzurro (>= 10°C) */
        .col-freezing{ background-color: #004991; } /* Blu (>= 5°C) */
        .col-intense { background-color: #730091; } /* Viola Scuro (< 5°C) */
    `;
    document.head.appendChild(style);
};


/**
 * Funzione di utilità per fornire raccomandazioni ultra-brevi sull'abbigliamento
 * basate sulla temperatura.
 *
 * @param {number} temp - Temperatura in Celsius.
 * @returns {string} Suggerimento di abbigliamento.
 */
const getDressSuggestion = (temp) => {
    const t = Number(temp);
    const br = '<br>'; 

    if (isNaN(t)) {
        return "Dati non disponibili";
    }

    // Logica basata sulla Temperatura
    if (t >= 30) {
        return `Costume`;
    } else if (t >= 25) {
        return `T-shirt`;
    } else if (t >= 20) {
        return `Maglietta`;
    } else if (t >= 15) {
        return `Felpa`;
    } else if (t >= 10) {
        return `Giacca`;
    } else if (t >= 5) {
        return `Giubbotto`;
    } else {
        return `Cappotto.`;
    }
};

/**
 * Restituisce la classe CSS per il colore della colonna.
 *
 * @param {number} temp - Temperatura in Celsius.
 * @returns {string} Classe CSS di colore.
 */
const getTempColorClass = (temp) => {
    const t = Number(temp);

    if (isNaN(t)) {
        return "";
    }

    if (t >= 30) {
        return "col-extreme";
    } else if (t >= 25) {
        return "col-hot";
    } else if (t >= 20) {
        return "col-mild"; // Testo nero
    } else if (t >= 15) {
        return "col-fresh";
    } else if (t >= 10) {
        return "col-cold";
    } else if (t >= 5) {
        return "col-freezing";
    } else {
        return "col-intense";
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
    // Dati necessari per la logica delle icone
    const precipitationSum = hourlyData.precipitation; 
    const precipitationProbability = hourlyData.precipitation_probability;
    const cloudCover = hourlyData.cloud_cover; 
    const windSpeed = hourlyData.wind_speed_10m; 
    const temperatureData = hourlyData.temperature_2m; 
    

    // Array per raccogliere le righe di dati
    const hours = [];
    const weatherIcons = []; 
    const temperatures = [];
    const suggestions = [];
    const combinedPrecipitation = []; 
    const colorClasses = []; 

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
    
    // 🆕 MODIFICA CHIAVE: Avanza l'indice di partenza di un'ora.
    // L'ora corrente trovata (startIndex) sarà l'inizio della previsione.
    // Aggiungiamo +1 per iniziare dall'ora successiva a quella trovata.
    startIndex = startIndex + 1;
    // Assicurati che l'indice non superi la lunghezza dei dati
    if (startIndex >= hourlyData.time.length) {
        container.innerHTML = '<p>Dati insufficienti per l\'ora successiva.</p>';
        return;
    }
    
    // 3. Itera per selezionare i 24 blocchi di dati orari
    for (let j = 0; j < numColumns; j++) {
        const index = startIndex + j;
        
        if (index >= hourlyData.time.length) {
            break; 
        }

        const time = hourlyData.time[index];
        const temp = temperatureData[index]; 
        const pop = precipitationProbability ? (precipitationProbability[index] || 0) : 0;
        const precip = precipitationSum ? (precipitationSum[index] || 0) : 0; 

        // Formatta l'ora (es. 14:00)
        const date = new Date(time);
        const formattedHour = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        hours.push(formattedHour.substring(0, 2)); // Solo l'ora (es. "14")
        
        // Chiama la funzione per l'icona HTML (gestisce giorno/notte)
        const iconHtml = getHourlyWeatherIcon({
             precipitation: precipitationSum,
             cloud_cover: cloudCover,
             wind_speed_10m: windSpeed,
             precipitation_probability: precipitationProbability,
             temperature_2m: temperatureData,
             time: hourlyData.time
        }, index);
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
        container.innerHTML = '<p>Dati insufficienti per la previsione oraria (24 colonne).</p>';
        return;
    }


    // 4. Costruzione della tabella TRASPOSTA
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

    // 5. Inserisce la tabella nel DOM
    container.innerHTML = tableHtml;
};
