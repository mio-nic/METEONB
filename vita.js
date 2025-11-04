// vita.js - Modulo per la Tabella di Allerta Meteo (Matrice a Punti Pulsanti - ORA TRIANGOLI FISSI CON PULSAZIONE DI OMBRA/OPACITÀ!)

// Importa la funzione unificata di recupero dati da main.js
import { getWeatherData } from './main.js';

// **********************************************************
// 1. COSTANTI, MAPPE E SOGLIE PARAMETRO
// **********************************************************

// SOGLIE DI RISCHIO A 4 LIVELLI con Descrizioni Brevissime
const THRESHOLDS = {
    // Caldo (Temp Max)
    'HOT': {
        RED: 38, ORANGE: 34, YELLOW: 28,
        title: 'Caldo', unit: '°C',
        desc: {
            4: 'Caldo Estremo. Rischio di COLPO DI CALORE.',
            3: 'caldo Intenso. Attenzione: stress da calore.',
            2: 'Caldo Moderato. Necessaria gestione attenta delle risorse (idratazione).'
        },
    },
    // Freddo (Temp Min)
    'COLD': {
        RED: -5, ORANGE: 0, YELLOW: 6,
        title: 'Freddo', unit: '°C',
        desc: {
            4: 'Freddo Estremo. RISCHIO GELO, DANNI STRUTTURALI e ipotermia grave.',
            3: 'Freddo Critico. Alto rischio di Raffreddamento e problemi di funzionamento.',
            2: 'Freddo Moderato. Attivare misure difensive (es. isolamento/vestiario).'
        },
    },
    // Vento (Vento Max in km/h)
    'WIND': {
        RED: 50, ORANGE: 20, YELLOW: 10,
        title: 'Vento', unit: 'km/h',
        desc: {
            4: 'Vento Estremo. Pericolo per strutture (RISCHIO CROLLO) e oggetti non fissati.',
            3: 'Vento Forte. Rischio di proiezione detriti e difficoltà nella movimentazione.',
            2: 'Vento Moderato. Cautela nell\'attività all\'esterno e oggetti mobili.'
        },
    },
    // Pioggia (Precipitazioni in mm)
    'RAIN': {
        RED: 50, ORANGE: 25, YELLOW: 5,
        title: 'Piogge', unit: 'mm',
        desc: {
            4: 'Pioggia Estrema. ALTO RISCHIO IDROGEOLOGICO, ALLUVIONE e inondazioni gravi.',
            3: 'Pioggia Intensa. Rischio di allagamenti locali e deflusso superficiale critico.',
            2: 'Pioggia Moderata. Attenzione a drenaggio e condizioni di viabilità.'
        },
    },
};

// Mappa dei parametri richiesti
const PARAMETERS_MAP = [
    ['allerta_caldo', 'Caldo', '°C', '🔥', 'HOT'],
    ['allerta_freddo', 'Freddo', '°C', '❄️', 'COLD'],
    ['wind_speed_10m_max', 'Vento', 'km/h', '🌬️', 'WIND'],
    ['precipitation_sum', 'Pioggia', 'mm', '🌧️', 'RAIN'],
];

// MODIFICATO: Rimosse emoji e modificato il formato della label in ALLERTA [LIVELLO]
const LEVEL_MAP = {
    4: { color: '#ff3b30', label: 'ALLERTA ROSSA', short: 'ROSSA' },
    3: { color: '#ff9500', label: 'ALLERTA ARANCIONE', short: 'ARANCIONE' },
    2: { color: '#ffcc00', label: 'ALLERTA GIALLA', short: 'GIALLA' },
    1: { color: '#34c759', label: 'ALLERTA VERDE', short: 'VERDE' }
};

// **********************************************************
// 2. CSS SPECIFICO PER LA TABELLA E ANIMAZIONI
// **********************************************************

// CSS Semplificato: Rimosse le variabili di colore in conflitto e usate quelle globali.
// Rimosse le regole generali già presenti in style.css.
const TABLE_CSS = `
/* Definisci variabili specifiche per il layout della tabella */
:root {
    /* Manteniamo solo i colori specifici dei triangoli */
    --color-dot-red: #ff3b30;
    --color-dot-orange: #ff9500;
    --color-dot-yellow: #ffcc00;
    --color-dot-green: #34c759;

    /* Aggiungi variabili per il colore del box-shadow del pulsante in animazione */
    --shadow-red: rgba(255, 59, 48, 0.7);
    --shadow-orange: rgba(255, 149, 0, 0.7);
    --shadow-yellow: rgba(255, 204, 0, 0.7);
}

/* MODIFICATO: Animazione di Pulsazione con solo box-shadow e opacità */
@keyframes pulse-triangle {
    0% { opacity: 0.8; box-shadow: 0 0 0 0; }
    50% { opacity: 1; box-shadow: 0 0 10px 4px var(--shadow-color-dynamic); } /* Usa una variabile dinamica */
    100% { opacity: 0.8; box-shadow: 0 0 0 0; }
}

/* Stili del contenitore: Rimosso background-color (usa container-bg-color globale) */
#comfortTableContainer.table-container {
    padding: 0;
    border-radius: 12px;
    margin: 0 auto 0px auto;
    display: block;
    box-shadow: 0 0 40px rgb(0 105 208);
    border: 1px solid rgba(66, 161, 255, 0.3);
}

/* Stili globali della tabella: Usa variabili globali per colore e bordi */
.daily-analysis-table {
    background-color: var(--container-bg-color); /* Usa la variabile globale */
    border-collapse: collapse;
    width: 100%;
    overflow-x: auto;
    border-radius: 12px;
}
.daily-analysis-table[style] {
    margin-top: 10px !important;
}

/* Cells Generiche: Regole specifiche per questa tabella */
.daily-analysis-table td, .daily-analysis-table th {
    border-right: none !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08); /* Bordo interno più discreto */
    padding: 10px 5px;
    font-size: 1.8em;
    text-align: center;
    transition: background-color 0.3s ease;
}

/* Intestazione delle Date */
.daily-analysis-table thead .header-row th {
    background-color: #0d0d0d;
    color: var(--primary-color);
    font-weight: bold;
    font-size: 1.0em;
    border-bottom: 3px solid var(--primary-color);
    position: sticky;
    top: 0;
    z-index: 20;
}

/* 🛑 Larghezza Fissa per le Colonne dei Giorni */
.daily-analysis-table thead .header-row th:not(:first-child) {
    width: var(--day-col-width);
    min-width: var(--day-col-width);
}

/* La cella vuota della testata */
.daily-analysis-table thead .header-row th:first-child {
    width: var(--alert-col-width);
    min-width: var(--alert-col-width);
    background-color: var(--container-bg-color); /* Usa la variabile globale */
    border-right: 2px solid var(--primary-color);
}


/* 💎 Prima colonna (Emoji + Unità) - Fissa e Iconica */
.daily-analysis-table td:first-child {
    background-color: #111111; /* Sfondo scuro specifico */
    color: var(--secondary-text-color);
    font-weight: bold;
    width: var(--alert-col-width);
    min-width: var(--alert-col-width);
    white-space: nowrap;
    position: sticky;
    left: 0;
    z-index: 30;
    border-right: 2px solid var(--primary-color);

    font-size: 1.0em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.daily-analysis-table td:first-child .alert-label {
    font-size: 0.7em;
    line-height: 1.1;
    margin-top: 2px;
}

/* 🛑 Larghezza Fissa e Padding Ristretto per le celle del corpo per evitare espansione */
.daily-analysis-table tbody tr td:not(:first-child) {
    width: var(--day-col-width) !important;
    min-width: var(--day-col-width) !important;
    padding: 5px 2px; /* Riduci padding orizzontale */
}


/* ⚠️ MODIFICATO: Stili del Triangolo di Pericolo Pulsante (Sostituisce .status-dot) */
/* Rimosso transform-origin e animazione diretta per non scalare il contenitore */
.status-triangle {
    display: inline-flex; /* Usa flex per centrare l'esclamativo */
    align-items: center;
    justify-content: center;
    width: 20px; /* Larghezza del contenitore */
    height: 18px; /* Altezza del contenitore */
    position: relative;
    pointer-events: none;
    line-height: 0; /* Rimuovi lo spazio extra */
    /* La pulsazione sarà applicata solo a shadow e opacity */
}

/* Crea la forma del Triangolo usando border */
.status-triangle::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    border-left: 10px solid transparent; /* Metà larghezza */
    border-right: 10px solid transparent; /* Metà larghezza */
    border-bottom-width: 18px; /* Altezza del triangolo */
    border-bottom-style: solid;
    /* Applica l'animazione di pulsazione solo qui */
    animation: pulse-triangle 1.5s infinite;
}

/* Punto esclamativo all'interno del triangolo */
.status-triangle::after {
    content: '!';
    position: absolute;
    top: 2px; /* Regola la posizione verticale */
    font-size: 14px; /* Dimensione del punto esclamativo */
    font-weight: 900;
    color: black; /* Colore del punto esclamativo */
    line-height: 1;
}

/* Stile del Bottone (per il pallino cliccabile) */
.alert-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    line-height: 0;
    margin: 0;
    display: inline-block;
    vertical-align: middle;
}
/* Al passaggio del mouse, aumenta leggermente l'opacità per un feedback */
.alert-button:hover .status-triangle::before {
    opacity: 0.9;
}

/* MODIFICATO: Colori in base al livello (Ora applicati a ::before, con variabili CSS per l'ombra) */
/* RED */
.dot-livello4::before {
    border-bottom-color: var(--color-dot-red);
    --shadow-color-dynamic: var(--shadow-red); /* Imposta la variabile per l'animazione */
}
/* ORANGE */
.dot-livello3::before {
    border-bottom-color: var(--color-dot-orange);
    --shadow-color-dynamic: var(--shadow-orange); /* Imposta la variabile per l'animazione */
}
/* YELLOW */
.dot-livello2::before {
    border-bottom-color: var(--color-dot-yellow);
    --shadow-color-dynamic: var(--shadow-yellow); /* Imposta la variabile per l'animazione */
}


/* Stili Pop-up (Modal) - Ultra compatto */
.alert-modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.7); z-index: 1000;
    display: none; justify-content: center; align-items: center;
}
.alert-modal-content {
    background: #2b2b2b; color: #fff; padding: 0;
    border-radius: 10px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    max-width: 320px;
    width: 90%;
    overflow: hidden;
}
.alert-modal-header {
    background-color: #000;
    color: #fff;
    padding: 10px 15px 8px 15px;
    margin-bottom: 0;
    border-bottom: 3px solid transparent;
}
.alert-modal-header h4 {
    margin: 0;
    font-size: 1.0em;
}

.alert-modal-body {
    padding: 10px 15px 15px 15px;
}
.alert-modal-body p {
    font-size: 0.9em;
    margin: 3px 0;
    line-height: 1.2;
}
.alert-modal-body strong {
    color: var(--primary-color);
}


/* Sezione segnalazione (per contenere la descrizione) */
.info-section {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Aggiunto bordo inferiore */
    margin-bottom: 8px; /* Spazio sotto la sezione */
    padding-bottom: 8px;
}
.info-section h5 {
    font-size: 0.8em;
    margin-bottom: 2px;
    color: var(--secondary-text-color);
    text-transform: uppercase;
}
/* Rimuovi spazi extra tra le righe di testo */
.info-section p {
    margin: 0;
}
/* Stile specifico per il Valore Rilevato nel pop-up (SPERIORE e COLORATO) */
.alert-value-display {
    display: block;
    font-size: 1.4em; /* Più grande */
    font-weight: bold;
    margin: 10px 0;
    padding: 5px 0;
    text-align: center;
}


/* Stile per il livello d'allerta nel pop-up */
.alert-level-display {
    font-size: 1.1em;
    font-weight: bold;
    margin-bottom: 5px;
    padding: 5px 0;
    border-radius: 4px;
    text-align: center;
    /* Usa un background più chiaro per evidenziare */
    background-color: rgba(255, 255, 255, 0.1);
}


.alert-modal-content button {
    margin-top: 15px; background: var(--primary-color); color: #0d0d0d; border: none;
    padding: 8px 15px; border-radius: 5px; cursor: pointer;
    font-weight: bold;
}

/* Legenda Finale: Solo istruzione di Clic */
#legend-message {
    margin: 15px 10px 5px 10px;
    font-size: 0.9em;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 10px;
    text-align: center;
    color: var(--secondary-text-color);
    line-height: 1.6;
}
#legend-message .level-indicator {
    font-weight: bold;
    margin: 0 8px;
    display: inline-block;
}

/* MEDIA QUERY PER MOBILE */
@media (max-width: 600px) {
    :root {
        --alert-col-width: 60px;
        --day-col-width: 40px;
    }
    .daily-analysis-table td, .daily-analysis-table th {
        padding: 8px 3px;
        font-size: 1.5em;
    }
    /* Mantenere la prima colonna fissa per la navigazione mobile */
    .daily-analysis-table td:first-child {
        min-width: var(--alert-col-width);
    }
}
`;

/**
 * Inietta gli stili CSS.
 */
const injectStyles = () => {
    if (!document.getElementById('comfortTableStyles')) {
        const style = document.createElement('style');
        style.id = 'comfortTableStyles';
        style.textContent = TABLE_CSS;
        document.head.appendChild(style);
    }
};

/**
 * Formatta il giorno con due cifre.
 */
const formatDay = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}`;
};

/**
 * Formatta la data completa in italiano (es. Venerdì, 17/10/2025).
 */
const formatFullDate = (dateString) => {
    try {
        // Correggi il problema 'Invalid Date' assicurandoti che il formato sia corretto per il parsing
        const date = new Date(dateString + 'T00:00:00');

        if (isNaN(date)) return "Data non valida";

        const weekday = date.toLocaleDateString('it-IT', { weekday: 'long' });
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        // Formato richiesto: Giorno della settimana, GG/MM/AAAA
        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day}/${month}/${year}`;
    } catch (e) {
        return `Data: ${dateString}`;
    }
};


/**
 * Logica per determinare il livello di allerta (1 a 4) per un dato parametro.
 */
const getAlertLevel = (key, value) => {
    const roundedValue = Math.round(value);
    const risk = THRESHOLDS[key];

    if (!risk || isNaN(roundedValue)) return 1;

    // Logica per Caldo, Vento, Pioggia (più è alto, peggio è)
    if (key === 'HOT' || key === 'WIND' || key === 'RAIN') {
        if (roundedValue >= risk.RED) return 4;
        if (roundedValue >= risk.ORANGE) return 3;
        if (roundedValue >= risk.YELLOW) return 2;
        return 1;
    }

    // Logica per Freddo (più è basso, peggio è)
    if (key === 'COLD') {
        if (roundedValue <= risk.RED) return 4;
        if (roundedValue <= risk.ORANGE) return 3;
        if (roundedValue <= risk.YELLOW) return 2;
        return 1;
    }

    return 1;
};

// **********************************************************
// 4. LOGICA DI POP-UP (MODAL)
// **********************************************************

/**
 * Simula l'apertura di un pop-up con i dettagli dell'allerta.
 */
window.showAlertDetails = (dateStr, alertKey, level, value) => {
    const risk = THRESHOLDS[alertKey];
    const levelInfo = LEVEL_MAP[level];

    if (!risk || !levelInfo) return;

    const riskDescription = risk.desc[level];

    // Titolo (Parametro)
    const titleText = `${risk.title}`;

    // Formattazione della data completa
    const fullDate = formatFullDate(dateStr);

    // Struttura Dati - Pop-up
    const modalDetailsHTML = `
        <div class="alert-modal-header" style="border-bottom-color: ${levelInfo.color};">
            <h4>⚠️Allerta ${titleText}</h4>
        </div>
        <div class="alert-modal-body">
            <p><strong>DATA:</strong> ${fullDate}</p>

            <div class="alert-level-display" style="background-color: ${levelInfo.color}; color: #000;">
                 ${levelInfo.label}
            </div>

            <div class="alert-value-display" style="color: ${levelInfo.color};">
                🚨Valore Rilevato: ${Math.round(value)} ${risk.unit}
            </div>

 <div class="info-section">
                <h5 style="margin-top: 1px;">DESCRIZIONE RISCHIO‼️</h5>
                <p>${riskDescription}</p>
            </div>

            <button onclick="closeModal()">Chiudi</button>
        </div>
    `;

    const modal = document.getElementById('alertModal');
    if (modal) {
        document.getElementById('modalDetails').innerHTML = modalDetailsHTML;
        modal.style.display = 'flex';
    }
};

/**
 * Chiude il pop-up (Modal).
 */
window.closeModal = () => {
    const modal = document.getElementById('alertModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// **********************************************************
// 5. LOGICA DI RENDERING PRINCIPALE
// **********************************************************

export const updateComfortTable = async (data = null) => {
    injectStyles();

    const tableContainerId = 'comfortTableContainer';
    let finalData = data;
    let containerDiv = document.getElementById(tableContainerId);

    // Setup iniziale del container e del Modal (solo se non esistono)
    if (!containerDiv) {
        const parent = document.querySelector('.main-content') || document.body;
        const newContainer = document.createElement('div');
        newContainer.id = tableContainerId;
        parent.appendChild(newContainer);
        containerDiv = newContainer;
    }

    if (!document.getElementById('alertModal')) {
        const modalHTML = `
            <div id="alertModal" class="alert-modal-overlay" onclick="if(event.target.id === 'alertModal') closeModal()">
                <div class="alert-modal-content">
                    <div id="modalDetails"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    if (!containerDiv.classList.contains('table-container')) {
        containerDiv.classList.add('table-container');
    }

    // Simulazione dati (da sostituire con la vera API)
    if (!finalData || !finalData.daily) {
        try {
             finalData = { daily: {
                 time: ["2025-10-17", "2025-10-18", "2025-10-19", "2025-10-20", "2025-10-21", "2025-10-22", "2025-10-23"],
                 temperature_2m_max: [24, 26, 28, 31, 33, 36, 29],
                 temperature_2m_min: [12, 10, 8, 5, 2, 0, -3],
                 wind_speed_10m_max: [20, 30, 45, 60, 80, 55, 35],
                 precipitation_sum: [0, 1, 2, 6, 12, 8, 3]
             }};
        } catch (error) {
            if (containerDiv) {
                containerDiv.innerHTML = '<p style="color: var(--text-color);">Dati meteo non disponibili.</p>';
            }
            return;
        }
    }

    const dailyData = finalData.daily;
    const dates = dailyData.time ? dailyData.time.slice(0, 7) : [];
    if (dates.length === 0) { return; }

    const maxTemps = dailyData.temperature_2m_max || [];
    const minTemps = dailyData.temperature_2m_min || [];
    const maxWinds = dailyData.wind_speed_10m_max || [];
    const precipitations = dailyData.precipitation_sum || [];


    // 1. COSTRUZIONE INTESTAZIONE (DATE)
    let headerHTML = `<tr class="header-row"><th></th>`;
    headerHTML += dates.map(dateStr => `<th>${formatDay(dateStr)}</th>`).join('');
    headerHTML += `</tr>`;


    // 2. COSTRUZIONE DEL CORPO DELLA TABELLA (PARAMETRI ALLERTA)
    let bodyHTML = '';

    PARAMETERS_MAP.forEach(([key, title, unit, icon, alertKey], rowIndex) => {

        let rowHTML = `<tr>`;

        rowHTML += `<td>${icon}<span class="alert-label"></span></td>`;

        for (let i = 0; i < dates.length; i++) {

            let currentAlertKey = alertKey;
            let value;

            switch (currentAlertKey) {
                case 'HOT': value = maxTemps[i]; break;
                case 'COLD': value = minTemps[i]; break;
                case 'WIND': value = maxWinds[i]; break;
                case 'RAIN': value = precipitations[i]; break;
                default: value = null;
            }

            const level = getAlertLevel(currentAlertKey, value);

            let cellContent = '';
            if (level > 1) {
                const classStr = `dot-livello${level}`; // La classe è rimasta per compatibilità
                // Passiamo la data completa (ISO string) per la formattazione nel pop-up
                const fullDateStr = dates[i];
                cellContent = `
                    <button class="alert-button" onclick="showAlertDetails('${fullDateStr}', '${currentAlertKey}', ${level}, ${value})">
                        <span class="status-triangle ${classStr}"></span>
                    </button>
                `;
            }

            rowHTML += `<td>${cellContent}</td>`;
        }

        rowHTML += `</tr>`;
        bodyHTML += rowHTML;
    });


    // 3. COSTRUZIONE FINALE DELLA STRUTTURA
    const titleHTML = `<h3 style="color: var(--primary-color); text-align: center; margin-bottom: 5px; font-size: 1.4em; text-shadow: 0 0 5px rgba(66, 161, 255, 0.4);">ALLERTA METEO</h3>`;
    let tableHTML = `
        <table class="daily-analysis-table" style="margin-top: 10px;">
            <thead>
                ${headerHTML}
            </thead>
            <tbody>
                ${bodyHTML}
            </tbody>
        </table>
        <p id="legend-message">
            ❔Clicca i triangoli per i dettagli.
        </p>
    `;

    // 4. Inserimento nel DOM
    const existingTitle = containerDiv.previousElementSibling;
    if (!existingTitle || existingTitle.tagName !== 'H3' || existingTitle.textContent !== 'ALLERTA METEO') {
          containerDiv.insertAdjacentHTML('beforebegin', titleHTML);
    }

    containerDiv.innerHTML = tableHTML;
};

export function getComfortChartInstance() {
    return null;
}


export const updateVisuals = updateComfortTable;










