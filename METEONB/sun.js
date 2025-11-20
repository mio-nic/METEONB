// sun.js
// Importiamo SOLO formatTime da main.js (mantenuto per consistenza)
import { formatTime } from './main.js'; 

// **********************************************************
// COSTANTI ICONE E LOGICA EMOJI (ORA IMMAGINI)
// **********************************************************

const ICON_BASE_URL = "https://meteofree.altervista.org/METEONB/ICONE/";

/**
 * Funzione di utilità per creare il tag <img> per l'icona.
 * @param {number} iconNumber - Numero dell'icona (da 1 a 10, basato sulla logica di main.js).
 * @param {string} altText - Testo alternativo per l'immagine.
 * @returns {string} Tag HTML <img>.
 */
const createIconTag = (iconNumber, altText = 'Icona Meteo') => {
    // Dimensioni adattate per la tabella sun.js
    return `<img src="${ICON_BASE_URL}${iconNumber}.png" alt="${altText}" style="width: 36px; height: 36px; vertical-align: middle;" />`;
};

/**
 * Funzione che restituisce l'icona (in HTML) in base alla copertura nuvolosa.
 * La mappatura segue la logica: 1=Sereno, 2=Prev. Sereno, 3=Nuvoloso, 4=Coperto.
 * Le icone per Pioggia/Temporale (5-8) sono meno rilevanti qui, ma usiamo la 4 come fallback per maltempo.
 * @param {number} cloudCover - Percentuale di copertura nuvolosa (0-100).
 * @returns {string} Tag HTML <img> corrispondente.
 */
const getWeatherEmoji = (cloudCover) => {
    let iconNumber;
    let altText;

    if (cloudCover <= 10) {
        iconNumber = 1; // Sereno
        altText = 'Sole';
    } else if (cloudCover <= 30) {
        iconNumber = 2; // Parzialmente Sereno
        altText = 'Poco Nuvoloso';
    } else if (cloudCover <= 60) {
        iconNumber = 3; // Nuvoloso
        altText = 'Nuvoloso';
    } else { // Copertura > 60% (Coperto o Maltempo)
        iconNumber = 4; // Coperto (o generico maltempo per la tabella sole)
        altText = 'Coperto';
    }
    
    return createIconTag(iconNumber, altText);
};


// Colori
const COLOR_BACKGROUND_DARK = '#2C3E50'; // Blu scuro elegante
const COLOR_HIGHLIGHT_SUN = '#FFD700'; // Oro brillante
const COLOR_TEXT_LIGHT = '#ECF0F1'; // Grigio chiaro
const COLOR_PULSE_GREEN = '#27AE60'; // Verde per il punto pulsante
// NUOVI COLORI PER LA BARRA DI PROGRESSIONE
const COLOR_PROGRESS_BAR_FILL = '#95A5A6'; // Grigio per la parte riempita (nuvolosità)
const COLOR_PROGRESS_BAR_EMPTY = '#F1C40F'; // Giallo per la parte vuota (sereno)


// CSS per la visualizzazione orizzontale centrata
const BAR_CSS = `
/* Keyframes per l'effetto pulsante */
@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 ${COLOR_PULSE_GREEN};
    }
    70% {
        box-shadow: 0 0 0 8px rgba(39, 174, 96, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(39, 174, 96, 0);
    }
}

/* Stili globali della tabella per il tema scuro */

.container-sun-info {
	box-shadow: 0 0 40px rgb(0 129 255);
    border-radius: 8px; 
    background-color: var(--chart-bg-color, #2C3E50);
    }

#sunTableBody {
    background-color: var(--chart-bg-color); 
    color: ${COLOR_TEXT_LIGHT};
    border-radius: 8px;
    padding: 10px; 
    
}

/* Stili della riga singola (TR) */
#sunTableBody tr {
    display: flex; 
    align-items: stretch; 
    width: 100%;
    cursor: default !important; 
    background-color: transparent !important; 
    border-bottom: none !important;
    
    /* Permette alle colonne di andare a capo su schermi strettissimi (fallback) */
    flex-wrap: wrap; 
}

/* Stili delle colonne (TD) per ogni giorno */
#sunTableBody td {
    flex-grow: 1; 
    flex-basis: 0;
    min-width: 0;
    padding: 10px 5px; 
    text-align: center;
    border-right: 1px solid rgba(255, 255, 255, 0.15); 
    position: relative; 
    display: flex; 
    flex-direction: column;
    /*align-items: center;*/
    justify-content: center; 
    min-height: 120px; 
}

/* Rimuovi il separatore dall'ultima colonna */
#sunTableBody td:last-child {
    border-right: none;
}

/* Contenitore dell'emoji e dell'ora */
.top-sun-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 5px 0;
}

/* Ora TOP (sopra l'emoji) - Grandezza standard */
.hour-display {
    font-size: 1.1em;
    font-weight: bold;
    color: ${COLOR_HIGHLIGHT_SUN};
    margin-bottom: 5px;
    text-shadow: 0 0 3px rgba(255, 215, 0, 0.7);
}

/* Emoji del Meteo - Grandezza standard e centrata */
.emoji-display {
    line-height: 1;
    margin-bottom: 5px; /* Spazio sotto l'emoji */
}
/* Stile per l'immagine all'interno di .emoji-display */
.emoji-display img {
    /* Assicurati che l'immagine sia al centro e della dimensione giusta */
    display: block;
    margin: 0 auto;
    width: 36px !important; 
    height: 36px !important;
}


/* ********************************************************** */
/* NUOVO STILE: Barra di Progressione (Nuvolosità) */
/* ********************************************************** */
.cloud-progress-container {
    width: 80%; /* Larghezza della barra */
    height: 8px; /* Altezza della barra */
    background-color: ${COLOR_PROGRESS_BAR_EMPTY}; /* Colore dello sfondo (parte non riempita) */
    border-radius: 4px; /* Bordi arrotondati */
    margin-top: 5px; /* Spazio sotto l'emoji */
    overflow: hidden; /* Assicura che la barra di riempimento non fuoriesca */
    position: relative; /* Per posizionare la barra interna */
}

.cloud-progress-bar {
    height: 100%;
    width: var(--p); /* La percentuale di riempimento viene passata tramite variabile CSS */
    background-color: ${COLOR_PROGRESS_BAR_FILL}; /* Colore della parte riempita */
    border-radius: 4px;
    transition: width 0.3s ease-in-out; /* Animazione fluida del riempimento */
}

/* La percentuale, ora sotto la barra */
.cloud-percent-value {
    font-size: 0.8em;
    font-weight: bold;
    color: ${COLOR_TEXT_LIGHT};
    margin-top: 5px; /* Spazio tra barra e percentuale */
}

/* ********************************************************** */


/* Giorno della settimana e data (in basso) */
.day-label {
    font-size: 1em;
    font-weight: 600;
    opacity: 0.8;
}

/* Stili per il punto pulsante */
.pulse-dot-container {
    position: absolute;
    top: 5px; 
    right: 5px;
}

.pulse-dot {
    height: 8px;
    width: 8px;
    background-color: ${COLOR_PULSE_GREEN};
    border-radius: 50%;
    display: inline-block;
    animation: pulse 1.5s infinite;
}

/* ------------------------------------------- */
/* MEDIA QUERY PER MOBILE (Larghezza max 600px) */
/* ------------------------------------------- */
@media (max-width: 600px) {
    
    #sunTableBody td {
        min-height: 90px; /* Riduci l'altezza minima della cella per risparmiare spazio verticale */
        padding: 8px 3px;
    }

    .hour-display {
        font-size: 0.9em; 
        margin-bottom: 3px;
    }

    /* Riduci la dimensione dell'immagine per mobile */
    .emoji-display img {
        width: 30px !important; 
        height: 30px !important;
    }
    
    /* Adatta la barra di progressione per mobile */
    .cloud-progress-container {
        width: 90%; 
        height: 6px; 
        margin-top: 3px;
    }

    /* Riduci dimensione percentuale per mobile */
    .cloud-percent-value {
        font-size: 0.7em;
        margin-top: 3px;
    }
    
    .day-label {
        font-size: 0.8em; 
    }
    
    /* Adatta il punto pulsante */
    .pulse-dot-container {
        top: 3px; 
        right: 3px;
    }

    .pulse-dot {
        height: 6px;
        width: 6px;
    }

    /* Riduci l'effetto pulsante per schermi piccoli */
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 ${COLOR_PULSE_GREEN}; }
        70% { box-shadow: 0 0 0 6px rgba(39, 174, 96, 0); }
        100% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
    }
}


/* Messaggio informativo */
#offsetMessage {
    
    font-size: 0.85em;
    
    padding-bottom: 15px;
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
}
`;

/**
 * Inietta gli stili CSS.
 */
const injectStyles = () => {
    if (!document.getElementById('sunTableStyles')) {
        const style = document.createElement('style');
        style.id = 'sunTableStyles';
        style.textContent = BAR_CSS;
        document.head.appendChild(style);
    }
};


// **********************************************************
// UTILITY: FORMATTAZIONE E RICERCA TOP
// **********************************************************
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    // Formato richiesto: solo giorno a due cifre
    return day.toString().padStart(2, '0'); 
};

/**
 * Trova la PRIMA ora con la copertura nuvolosa PIÙ BASSA (migliore) tra 10:00 e 18:00.
 * @returns {{time: number, cloudCover: number}} L'ora e la copertura nuvolosa migliore.
 */
const findTopSunHour = (dateStr, hourlyData) => {
    const targetDate = new Date(dateStr);
    
    let minCloudCover = 101; // Inizializza a un valore massimo > 100
    let topHour = -1; 
    
    const START_HOUR_CONSIDERED = 10;
    const END_HOUR_CONSIDERED = 18; 

    // Mappa e filtra i dati orari
    const segments = hourlyData.time
        .map((timeStr, i) => ({
            time: new Date(timeStr),
            cloudCover: hourlyData.cloud_cover[i], // Usa la copertura nuvolosa
        }))
        .filter(segment => 
             segment.time.getDate() === targetDate.getDate() && 
             segment.time.getHours() >= START_HOUR_CONSIDERED && 
             segment.time.getHours() <= END_HOUR_CONSIDERED 
        );

    for (const segment of segments) {
        // Cerca la copertura nuvolosa strettamente minore
        if (segment.cloudCover < minCloudCover) {
            minCloudCover = segment.cloudCover;
            topHour = segment.time.getHours();
            
            // Se trovi il cielo perfettamente sereno (0%), ferma la ricerca
            if (minCloudCover === 0) break;
        }
    }

    return { 
        time: topHour, 
        cloudCover: minCloudCover 
    };
};

/**
 * Trova l'indice del giorno della settimana che ha la copertura nuvolosa più bassa in assoluto.
 */
const findOverallBestDayIndex = (dailyData, hourlyData) => {
    let bestCloudCover = 101;
    let bestDayIndex = -1;

    dailyData.time.forEach((dateStr, index) => {
        const { cloudCover } = findTopSunHour(dateStr, hourlyData);
        
        // Confronta la copertura nuvolosa minima trovata in quel giorno con il minimo assoluto
        if (cloudCover < bestCloudCover) {
            bestCloudCover = cloudCover;
            bestDayIndex = index;
        }
    });

    return bestDayIndex;
};


// **********************************************************
// LOGICA DI RENDERING DELLA COLONNA GIORNALIERA
// **********************************************************

/**
 * Genera l'HTML di una singola colonna (TD) per un giorno.
 */
const createDayColumnContent = (dateStr, hourlyData, index, overallBestDayIndex) => {
    const { time: topHour, cloudCover } = findTopSunHour(dateStr, hourlyData); // Ora prende cloudCover
    const formattedDate = formatDate(dateStr); 
    
    const isBestDay = index === overallBestDayIndex;
    
    let contentHtml = '';
    let pulseDotHtml = '';

    if (isBestDay) {
        pulseDotHtml = `
            <div class="pulse-dot-container">
                <span class="pulse-dot"></span>
            </div>
        `;
    }

    if (topHour !== -1) {
        const hourDisplay = topHour.toString().padStart(2, '0');
        // EMOJI/ICONA basata sulla copertura nuvolosa
        const specificIcon = getWeatherEmoji(cloudCover); 
        
        // ** HTML per la barra di progressione **
        // Utilizziamo una variabile CSS '--p' per la larghezza della barra interna
        const progressBarHtml = `
            <div class="cloud-progress-container">
                <div class="cloud-progress-bar" style="--p: ${cloudCover}%;"></div>
            </div>
        `;

        contentHtml = `
            <div class="top-sun-info">
                <span class="hour-display">${hourDisplay}:00</span>
                <span class="emoji-display">${specificIcon}</span>
                ${progressBarHtml}
                <span class="cloud-percent-value">${cloudCover}%</span>
            </div>
            <span class="day-label">${formattedDate}</span>
        `;
    } else {
        // Contenuto per dati non disponibili
        const placeholderIcon = createIconTag(10, 'Nessun dato'); // Icona 10 = Placeholder
        
        // Placeholder per la barra
        const progressBarPlaceholder = `
            <div class="cloud-progress-container">
                <div class="cloud-progress-bar" style="--p: 0%;"></div>
            </div>
        `;

        contentHtml = `
            <div class="top-sun-info">
                <span class="hour-display">--h</span>
                <span class="emoji-display">${placeholderIcon}</span>
                ${progressBarPlaceholder}
                <span class="cloud-percent-value">--%</span>
            </div>
            <span class="day-label">${formattedDate}</span>
        `;
    }


    return `
        <td class="day-column">
            ${pulseDotHtml}
            ${contentHtml}
        </td>
    `;
};


// **********************************************************
// LOGICA DI RENDERING PRINCIPALE
// **********************************************************

/**
 * Funzione principale per aggiornare la tabella Solare.
 */
export const updateSunTable = (weatherData, containerId = 'sunTableBody') => {
    // 1. INIETTA GLI STILI
    injectStyles();

    const sunTableBody = document.getElementById(containerId);
    const dailyData = weatherData.daily; 
    const hourlyData = weatherData.hourly; 

    const sunInfoContainer = sunTableBody ? sunTableBody.closest('.container-sun-info') : sunTableBody ? sunTableBody.parentElement : null;

    if (!sunTableBody || !dailyData || !dailyData.time || !hourlyData || !hourlyData.time || !hourlyData.cloud_cover) {
        console.error("Dati mancanti o elemento tabella non trovato.");
        return;
    }

    // 2. Trova il giorno più soleggiato di tutta la settimana
    const overallBestDayIndex = findOverallBestDayIndex(dailyData, hourlyData);

    // 3. Generazione delle COLONNE (TD)
    const columnContent = dailyData.time
        .map((dateStr, index) => createDayColumnContent(dateStr, hourlyData, index, overallBestDayIndex)) 
        .join('');

    // 4. Inseriamo tutte le colonne in una SINGOLA RIGA (TR)
    sunTableBody.innerHTML = `<tr>${columnContent}</tr>`;

    // 5. Messaggio statico aggiornato
    const finalMessage = `L'ora indicata è la prima con la copertura nuvolosa più favorevole (tra le 10:00 e le 18:00). Il punto verde pulsante indica il giorno più soleggiato dell'intera settimana.`;
    
    if (sunInfoContainer) {
        let offsetDiv = document.getElementById('offsetMessage');
        if (!offsetDiv) {
            offsetDiv = document.createElement('p');
            offsetDiv.id = 'offsetMessage';
            sunInfoContainer.appendChild(offsetDiv);
        }
        
        offsetDiv.textContent = finalMessage;
    }
};