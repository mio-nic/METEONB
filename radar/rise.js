// rise.js - Versione Semplificata: Percorso Sole e Luna su linea orizzontale con CSS integrato.

// --- IMPORTAZIONI (Deve essere compatibile con city.js) ---
import { getCurrentCityLocalTime } from './city.js';

// --- CONFIGURAZIONE E CONSTANTI ---
const WEATHER_API_KEY = "e1f10a1e78da46f5b10a1e78da96f525"; // USA LA TUA CHIAVE REALE QUI
const PREFERRED_COORDS_KEY = 'preferredCityCoords';
const DEFAULT_LATITUDE = 45.40;
const DEFAULT_LONGITUDE = 11.87;

// Elemento per la nota
const notaElement = document.querySelector('.nota');
// Elementi contenitore per i percorsi (riutilizzo degli ID del canvas)
const sunPathElement = document.getElementById('sunChartCanvas'); 
const moonPathElement = document.getElementById('moonChartCanvas'); 

// Variabili globali per i dati statici
let graphDataToday = null; 
let updateInterval = null; 

// --- FUNZIONI DI UTILITÀ ---

/**
 * Recupera le coordinate salvate in localStorage o usa i valori predefiniti.
 */
function getCoordinates() {
    const preferredCoordsStr = localStorage.getItem(PREFERRED_COORDS_KEY);
    
    if (preferredCoordsStr) {
        try {
            const preferredCoords = JSON.parse(preferredCoordsStr);
            if (preferredCoords.latitude && preferredCoords.longitude) {
                return { lat: preferredCoords.latitude, lon: preferredCoords.longitude };
            }
        } catch (e) {
            console.error("Errore parsing coordinate salvate:", e);
        }
    }
    return { lat: DEFAULT_LATITUDE, lon: DEFAULT_LONGITUDE };
}

/**
 * Formatta la stringa di tempo UTC (es. "2025-01-01T12:00:00") in "HH:mm".
 */
function formatTime(timeString) {
    if (!timeString) return 'N/D';
    try {
        const parts = timeString.match(/T(\d{2}:\d{2}):\d{2}/);
        return parts ? parts[1] : 'N/D';
    } catch (e) {
        return 'N/D';
    }
}

/**
 * Converte l'ora nel formato "HH:mm" in minuti totali (0-1439).
 */
function timeToMinutes(timeString) {
    if (timeString === 'N/D') return NaN;
    const [hours, minutes] = timeString.split(':').map(Number);
    return (isNaN(hours) || isNaN(minutes)) ? NaN : hours * 60 + minutes;
}

/**
 * Restituisce l'emoji della fase lunare.
 */
function getMoonEmoji(phase) {
    switch(phase) {
        case "Novilunio": return "🌑";
        case "Luna Crescente": return "🌒";
        case "Primo quarto": return "🌓";
        case "Gibbosa Crescente": return "🌔";
        case "Plenilunio": return "🌕";
        case "Gibbosa Calante": return "🌖";
        case "Ultimo quarto": return "🌗";
        case "Luna calante": return "🌘";
        default: return "🌙";
    }
}

/**
 * Calcola il tempo rimanente fino all'evento target.
 */
function calculateTimeRemaining(targetMinutes, currentMinutes) {
    let diff = targetMinutes - currentMinutes;
    if (diff < -720) {
        diff += 1440;
    } else if (diff > 720) {
        diff -= 1440;
    }
    const sign = diff >= 0 ? '+' : '-';
    const absDiff = Math.abs(diff);
    const hours = Math.floor(absDiff / 60);
    const minutes = absDiff % 60;
    
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Recupera i dati celesti (Alba/Tramonto) dall'API TWC per le coordinate attuali.
 */
async function getCelestialData() {
    const { lat, lon } = getCoordinates();
    const geocode = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    const apiUrl = `https://api.weather.com/v3/wx/forecast/daily/7day?geocode=${geocode}&format=json&units=m&language=it-IT&apiKey=${WEATHER_API_KEY}`;

    if (notaElement) {
        notaElement.textContent = `I dati sono relativi alle coordinate: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Errore HTTP! Stato: ${response.status}.`);
        }
        const data = await response.json();
        return data;
    } catch (errore) {
        console.error("Errore nel recupero dati celesti:", errore);
        const tableBody = document.getElementById('tabellaCorpo');
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="color:red; font-weight:bold;">ERRORE: Impossibile caricare i dati. Verifica la console per i dettagli.</td></tr>`;
        return { dayOfWeek: [] };
    }
}

// --- FUNZIONI DI INIEZIONE STILI CSS ---

/**
 * Inietta gli stili CSS necessari per i percorsi Sole/Luna nella sezione <head> del documento.
 */
function injectStyles() {
    const styleId = 'rise-styles';
    if (document.getElementById(styleId)) return; // Evita di iniettare due volte

    // Aggiornamento CSS per l'icona dinamica: aumentiamo top a -25px per centrare l'emoji sulla linea.
    const css = `
        .path-container {
            color: #EEE; 
            padding: 10px 0;
            margin-bottom: 20px;
            border-top: 1px solid #333;
        }
        .path-container h3 {
            font-size: 16px;
            margin-bottom: 25px;
            text-align: center;
        }
        .path-line {
            height: 4px;
            background-color: #444; 
            position: relative;
            margin: 20px 20px 40px; 
            border-radius: 2px;
        }
        .time-marker {
            position: absolute;
            font-size: 14px;
            font-weight: bold;
            transform: translateX(-50%); 
            text-align: center;
            line-height: 1.2;
            z-index: 5;
        }
        /* Marker di Alba/Levata: posizionato SOPRA la linea */
        .rise-marker {
            top: 10px; 
            color: #d1ca00;
        }
        /* Marker di Tramonto/Tramontare: posizionato SOTTO la linea */
        .set-marker {
            top: 10px;
            color: #d16200;
        }
        .time-remaining {
            display: block;
            font-size: 11px;
            color: #AAA;
            font-weight: normal;
        }
        .icon-now {
            position: absolute;
            top: -20px; /* Modificato: sposta l'emoji più in alto */
            font-size: 24px; /* Modificato: aumenta la dimensione dell'emoji */
            transform: translateX(-50%); 
            z-index: 999; 
            /* Rimosso 'color: #FF6347;' in quanto l'emoji usa il suo colore naturale */
        }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
}

// --- FUNZIONI DI RAPPRESENTAZIONE LINEA PERCORSO ---

/**
 * Genera l'HTML per il percorso del sole o della luna.
 */
function createPathHtml(riseTime, setTime, markerTime, emoji, title) {
    const riseMinutes = timeToMinutes(riseTime);
    const setMinutes = timeToMinutes(setTime);
    const currentMinutes = timeToMinutes(markerTime);

    if (isNaN(riseMinutes) || isNaN(setMinutes)) {
        return `<p style="color:#EEE; text-align:center;">${title} non disponibile per oggi.</p>`;
    }
    
    const riseRemaining = calculateTimeRemaining(riseMinutes, currentMinutes);
    const setRemaining = calculateTimeRemaining(setMinutes, currentMinutes);

    // Calcolo della posizione del marker (0% a 00:00, 100% a 24:00)
    const markerPosition = (currentMinutes / 1440) * 100; 
    const risePosition = (riseMinutes / 1440) * 100;
    const setPosition = (setMinutes / 1440) * 100;

    return `
        <div class="path-container">
            <h3>${emoji} ${title} - Ora: ${markerTime}</h3>
            <div class="path-line">
                
                <span class="icon-now" style="left: ${markerPosition}%;">
                    ${emoji} </span>

                <span class="time-marker rise-marker" style="left: ${risePosition}%;">
                    ▲ ${riseTime}<br><span class="time-remaining">(${riseRemaining})</span>
                </span>
                
                <span class="time-marker set-marker" style="left: ${setPosition}%;">
                    ▼ ${setTime}<br><span class="time-remaining">(${setRemaining})</span>
                </span>
                
            </div>
        </div>
    `;
}

/**
 * Funzione per aggiornare il percorso del Sole.
 */
function updateSunPath(riseTime, setTime, markerTime) {
    if (sunPathElement) {
        sunPathElement.innerHTML = createPathHtml(riseTime, setTime, markerTime, '☀️', 'Sole - alba/tramonto');
    }
}

/**
 * Funzione per aggiornare il percorso della Luna.
 */
function updateMoonPath(riseTime, setTime, moonPhase, markerTime) {
    const emoji = getMoonEmoji(moonPhase);
    if (moonPathElement) {
        // Usa l'emoji di fase lunare specifica come indicatore sul percorso
        updateMoonPath.currentEmoji = emoji; // Memorizza l'emoji attuale se necessario altrove
        moonPathElement.innerHTML = createPathHtml(riseTime, setTime, markerTime, emoji, `Luna - alba/tramonto (${moonPhase})`);
    }
}


// --- FUNZIONI DI AGGIORNAMENTO DINAMICO ---

/**
 * Funzione per aggiornare solo i percorsi utilizzando l'ora del BROWSER + OFFSET CITTA'.
 */
function updatePathsOnly() {
    if (!graphDataToday || graphDataToday.utcOffsetSeconds === undefined) {
        return;
    }

    // OTTIENI ORA LOCALE CORRETTA: usa l'offset memorizzato per chiamare la funzione da city.js
    const currentLocalTime = getCurrentCityLocalTime(graphDataToday.utcOffsetSeconds);

    // Aggiorna i percorsi usando i dati statici (Alba/Tramonto) e l'ora dinamica
    updateSunPath(graphDataToday.sunRise, graphDataToday.sunSet, currentLocalTime);
    updateMoonPath(graphDataToday.moonRise, graphDataToday.moonSet, graphDataToday.moonPhase, currentLocalTime);
}

/**
 * Avvia o riavvia l'aggiornamento automatico dell'ora (ogni 60 secondi).
 */
function startAutoUpdate() {
    // 1. ANNULLA qualsiasi intervallo di aggiornamento precedente
    if (updateInterval !== null) {
        clearInterval(updateInterval);
        updateInterval = null;
    }

    // 2. Imposta l'aggiornamento grafico ad intervalli regolari (ogni 60 secondi).
    updateInterval = setInterval(updatePathsOnly, 60000); 
}

// --- FUNZIONE PRINCIPALE DI CARICAMENTO DATI ---

/**
 * Funzione principale per caricare i dati statici API e popolare la tabella (chiamata all'inizio e al cambio città).
 * Accetta l'offset UTC della città da city.js.
 */
export async function updateCelestialTable(utcOffsetSeconds = 0) { 
    const tableBody = document.getElementById('tabellaCorpo');
    const titolo = document.getElementById('titoloTabella');
    if (!tableBody || !titolo) return;

    titolo.textContent = "Caricamento dati celesti...";

    const dati = await getCelestialData();
    
    if (dati.dayOfWeek && dati.dayOfWeek.length === 0) {
        titolo.textContent = "Dati Non Disponibili";
        return;
    }

    const giorniTotali = dati.dayOfWeek.length;
    const oggi = new Date(dati.validTimeLocal[0]).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const finePeriodo = new Date(dati.validTimeLocal[giorniTotali - 1]).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    titolo.textContent = `Previsione ${giorniTotali} giorni (dal ${oggi} al ${finePeriodo})`;

    // Popola la tabella
    tableBody.innerHTML = '';
    let todayData = {};

    for (let i = 0; i < giorniTotali; i++) {
        const giornoSettimana = dati.dayOfWeek[i].charAt(0).toUpperCase() + dati.dayOfWeek[i].slice(1);
        const dataCompleta = new Date(dati.validTimeLocal[i]);
        const giornoMese = dataCompleta.getDate().toString().padStart(2, '0');
        const giornoLabel = `${giornoMese} (${giornoSettimana.substring(0, 3)})`;

        const albaSole = formatTime(dati.sunriseTimeLocal[i]);
        const tramontoSole = formatTime(dati.sunsetTimeLocal[i]);
        const albaLuna = formatTime(dati.moonriseTimeLocal[i]);
        const tramontoLuna = formatTime(dati.moonsetTimeLocal[i]);

        const faseLuna = dati.moonPhase[i] || 'N/D';
        const emojiFase = getMoonEmoji(faseLuna);

        const riga = document.createElement('tr');
        riga.innerHTML = `
            <td>${giornoLabel}</td>
            <td class="sole">${albaSole}</td>
            <td class="sole">${tramontoSole}</td>
            <td class="luna">${albaLuna}</td>
            <td class="luna">${tramontoLuna}</td>
            <td class="fase">${emojiFase} ${faseLuna}</td>
        `;
        tableBody.appendChild(riga);

        if (i === 0) {
            todayData = {
                sunRise: albaSole,
                sunSet: tramontoSole,
                moonRise: albaLuna,
                moonSet: tramontoLuna,
                moonPhase: dati.moonPhase[0],
                utcOffsetSeconds: utcOffsetSeconds
            };
        }
    }
    
    // Memorizza i dati statici di oggi globalmente
    graphDataToday = todayData;
    
    // 1. Aggiorna i percorsi immediatamente dopo il caricamento iniziale dei dati statici
    updatePathsOnly(); 
    
    // 2. Riavvia l'aggiornamento dinamico dell'ora
    startAutoUpdate(); 
}

// --- BLOCCO AVVIO (DOMContentLoaded) ---

/**
 * Inizializza il sistema e avvia i processi.
 */
function initializeSystem() {
    // 1. INIETTA GLI STILI CSS nel documento
    injectStyles();
    
    // 2. Chiama la funzione principale di carico dati all'inizio.
    updateCelestialTable(); 
    
    // 3. Avvia l'intervallo di aggiornamento
    startAutoUpdate();
}

// Avvia tutto al caricamento del documento
document.addEventListener('DOMContentLoaded', initializeSystem);
