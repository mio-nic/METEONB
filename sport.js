// sport.js

// Importa le funzioni e le costanti necessarie da main.js
import { getWeatherData, formatDate, getDailyWeatherEmoji } from './main.js'; // Aggiunto getDailyWeatherEmoji

// --- CHIAVI DI STATO E LOCAL STORAGE ---
// La chiave per i dati meteo principali (usata da table.js/main.js)
const MAIN_WEATHER_DATA_KEY = 'weatherData'; 
// Chiave per la preferenza sportiva dell'utente
const ACTIVITY_KEY = 'sportModule_activity';

// --- STATO GLOBALE DEL MODULO ---
// 1. Carica l'attività preferita salvata
let currentActivity = localStorage.getItem(ACTIVITY_KEY) || 'escursione'; 

// 2. Carica i dati meteo più recenti dalla cache principale (per persistenza al ricaricamento)
let currentWeatherData = JSON.parse(localStorage.getItem(MAIN_WEATHER_DATA_KEY)); 

// --- LOGICA DI CALCOLO FAVOREVOLEZZA ---
const calculateFavorability = (activity, dayData) => {
    // Estrai i dati necessari dal giorno
    const temp = dayData.temperature_2m_max;
    const humidity = dayData.relative_humidity_2m_mean;
    const precipProb = dayData.precipitation_probability_max;
    const wind = dayData.wind_speed_10m_max;

    let score = 0;
    const maxScore = 400; // 4 fattori * 100 max

    switch (activity) {
        case 'pesca':
            // 🎣 Condizioni Ideali: Temp (10-25°C), Zero Pioggia (0%), Poco Vento (<= 5 km/h), Umidità Neutra
            // NOTE: Ho impostato 0% di pioggia per 100 punti, rendendolo più severo.
            score += (temp >= 10 && temp <= 25) ? 100 : (temp >= 5 && temp <= 30 ? 60 : 20); // Intervallo intermedio più stretto
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 60 : 20); // Solo 0% prende 100, <= 5% prende 60
            score += (wind <= 5) ? 100 : (wind <= 10 ? 60 : 20); // Massimi 100 punti solo per vento molto basso (<= 5 km/h)
            score += 100; // Umidità neutra (fattore non discriminante)
            break;
            
        case 'escursione':
            // 🥾 Condizioni Ideali: Temp (15-25°C), Bassa Umidità (<= 50%), Zero Pioggia (0%), Poco Vento (<= 10 km/h)
            score += (temp >= 15 && temp <= 25) ? 100 : (temp >= 10 && temp <= 30 ? 60 : 20); // Intervallo intermedio ridotto
            score += (humidity <= 50) ? 100 : (humidity <= 70 ? 60 : 20); // Massimi 100 punti solo per umidità bassa (<= 50%)
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 50 : 10); // Zero Pioggia rigoroso (0%)
            score += (wind <= 10) ? 100 : (wind <= 20 ? 60 : 20); // Vento massimo 10 km/h per 100 punti
            break;

        /* RIMOSSO: case 'influenza':
        // ... Logica di calcolo del rischio influenza ...
        break; */

        /* RIMOSSO: case 'polline':
        // ... Logica di calcolo del rischio polline ...
        break; */

        case 'guida':
            // 🚗 Condizioni Ideali: Temp (10-25°C), Zero Pioggia (0%), Poco Vento (<= 15 km/h), Bassa Umidità (<= 60%)
            score += (temp >= 10 && temp <= 25) ? 100 : (temp >= 5 && temp <= 30 ? 60 : 20); // Intervallo ideale più stretto
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 60 : 20); // Zero pioggia rigoroso (0%)
            score += (wind <= 15) ? 100 : (wind <= 25 ? 60 : 20); // Vento massimo 15 km/h per 100 punti
            score += (humidity <= 60) ? 100 : (humidity <= 80 ? 60 : 20); // Umidità massima 60% per 100 punti
            break;
            
        case 'sfalcio_erba':
            // 🚜 Condizioni Ideali: Temp Mite (20-28°C), Zero Pioggia (0%), Vento Nullo (<= 5 km/h), Umidità Bassa (<= 40%)
            score += (temp >= 20 && temp <= 28) ? 100 : (temp >= 15 && temp <= 30 ? 60 : 20); // Intervallo ideale più stretto
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 50 : 10); // Zero pioggia rigoroso (0%)
            score += (wind <= 5) ? 100 : (wind <= 10 ? 60 : 20); // Vento molto basso (<= 5 km/h) per 100 punti
            score += (humidity <= 40) ? 100 : (humidity <= 60 ? 60 : 20); // Umidità molto bassa (<= 40%) per 100 punti
            break;

        default:
            score = maxScore * 0.5;
            break;
    }

    const percentage = Math.round((score / maxScore) * 100);
    return Math.max(0, Math.min(100, percentage));
};


// --- FUNZIONI DI RENDERING UI ---

// Funzione che genera il codice SVG per il grafico circolare tagliato (Donut Chart)
const createDonutChartSVG = (percentage) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    let color = '#4CAF50'; // Ottimo
    let className = 'favorevole-ottimo';

    if (percentage < 30) {
        color = '#F44336'; // Scarso (Rosso)
        className = 'favorevole-scarso';
    } else if (percentage < 60) {
        color = '#FFC107'; // Buono (Arancio)
        className = 'favorevole-buono';
    }

    return `
        <div class="day-circle-container">
            <svg class="day-circle-svg" viewbox="0 0 50 50" width="50" height="50">
                <g transform="rotate(0 25 25)"> 
                    
                    <circle class="circle-bg" cx="25" cy="25" r="${radius}"></circle>
                    <circle
                        class="circle-fill"
                        cx="25"
                        cy="25"
                        r="${radius}"
                        stroke="${color}"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${strokeDashoffset}"
                        transform="rotate(90 25 25)">
                    </circle>
                </g>
                
                <text 
                    class="percentage-text ${className}" 
                    x="25" 
                    y="-25" 
                    dominant-baseline="middle" 
                    text-anchor="middle"
                    transform="rotate(90 25 25)" >
                    ${percentage}%
                </text>
                
            </svg>
        </div>
    `;
};


/**
 * Funzione principale per generare e popolare la tabella in base allo stato interno.
 */
const generateSportTable = () => {
    const dataContainer = document.getElementById('sport-table-container');
    
    if (!currentWeatherData || !currentWeatherData.daily) {
        dataContainer.innerHTML = '<p style="color: var(--secondary-text-color);">Caricamento dati meteo...</p>';
        return;
    }
    
    const dailyData = currentWeatherData.daily;
    const activity = currentActivity;
    
    const days = dailyData.time.slice(0, 7); // I primi 7 giorni
    const sportSelect = document.getElementById('sport-select');
    
    // Titolo dinamico
    // Controlla se l'attività corrente è ancora nel menù (se non lo è, usa il default 'Escursione')
    const selectedOption = Array.from(sportSelect.options).find(option => option.value === activity);
    let activityName = selectedOption ? selectedOption.text : 'Attività';

    let tableHTML = `<h2 style="margin-top: 15px;">Livello di ${activityName} per ${currentWeatherData.cityName || 'la Città Corrente'}</h2>`;
    tableHTML += `<div class="table-container sport-table-container"><table class="sport-table"><thead><tr>`;
    
    // Intestazione con i giorni della settimana
    days.forEach(dateStr => {
        tableHTML += `<th>${formatDate(dateStr)}</th>`;
    });
    tableHTML += `</tr></thead><tbody>`;

    // Riga 1: Cerchio di favorevolezza
    tableHTML += `<tr>`;
    days.forEach((_, index) => {
        const dayData = {
            temperature_2m_max: dailyData.temperature_2m_max[index],
            relative_humidity_2m_mean: dailyData.relative_humidity_2m_mean[index],
            precipitation_probability_max: dailyData.precipitation_probability_max[index],
            wind_speed_10m_max: dailyData.wind_speed_10m_max[index],
        };
        const percentage = calculateFavorability(activity, dayData);
        tableHTML += `<td>${createDonutChartSVG(percentage)}</td>`;
    });
    tableHTML += `</tr>`;

    // Riga 2: Icone del Tempo
    tableHTML += `<tr>`;
    days.forEach((_, index) => {
        // Passa l'intero oggetto dailyData e l'indice
        tableHTML += `<td>${getDailyWeatherEmoji(dailyData, index)}</td>`; 
    });
    tableHTML += `</tr>`;


    // Righe Nascoste (Fattori Meteo) - 4 righe
    const hiddenRowsData = [
        { label: '🌡️ Temp. Max', dataKey: 'temperature_2m_max', unit: ' °C' },
        { label: '💧 Umidità Media', dataKey: 'relative_humidity_2m_mean', unit: ' %' },
        { label: '🌧️ Prob. Pioggia Max', dataKey: 'precipitation_probability_max', unit: ' %' },
        { label: '💨 Vento Max', dataKey: 'wind_speed_10m_max', unit: ' km/h' },
    ];

    hiddenRowsData.forEach((row) => {
        // Tutte le 4 righe di fattori sono nascoste (classe CSS "hidden-row")
        tableHTML += `<tr class="factor-row hidden-row">`;
        
        // Prima cella della riga: Etichetta del fattore
        tableHTML += `<th class="factor-label-cell" style="text-align: left; font-size: 0.9em; padding-left: 10px;">${row.label}</th>`; 
        
        // Celle dei giorni
        days.forEach((_, index) => {
            const value = dailyData[row.dataKey][index];
            tableHTML += `<td>${Math.round(value)}${row.unit}</td>`;
        });
        tableHTML += `</tr>`;
    });
    
    tableHTML += `</tbody></table></div>`;
    dataContainer.innerHTML = tableHTML;
};


// --- FUNZIONE DI INIZIALIZZAZIONE UI ---

const ensureUIInitialized = () => {
    const sportWidgetContainer = document.getElementById('sport-widget');
    if (!sportWidgetContainer) {
        // Se il contenitore principale non esiste, lo crea
        const appContainer = document.getElementById('app') || document.body;
        const newContainer = document.createElement('div');
        newContainer.id = 'sport-widget';
        appContainer.appendChild(newContainer); 
    }
    
    // Contenitore principale del menu (lo creiamo solo se non esiste)
    if (!document.getElementById('sport-select-container')) {
        document.getElementById('sport-widget').innerHTML = `
            <div class="sport-menu-container" id="sport-select-container" style="margin-top: 20px; text-align: center;">
                <label for="sport-select" style="font-weight: bold;">Seleziona Attività:</label>
                <select id="sport-select" class="custom-select" style="padding: 5px; border-radius: 5px;">
                    <option value="pesca">🎣 Pesca</option>
                    <option value="escursione">🚶 Escursione</option>
                    <option value="guida">🚗 Guida</option>
                    <option value="sfalcio_erba">🌾 Sfalcio Erba</option>
                </select>
            </div>
            <div id="sport-table-container"></div>
        `;
        
        // Se l'attività salvata era 'influenza' o 'polline', resettala a 'escursione'
        if (currentActivity === 'influenza' || currentActivity === 'polline') {
            currentActivity = 'escursione';
            localStorage.setItem(ACTIVITY_KEY, currentActivity); 
        }

        // Aggiungi l'event listener per il cambio di attività
        const sportSelect = document.getElementById('sport-select');
        sportSelect.value = currentActivity; // Sincronizza con lo stato persistente
        sportSelect.onchange = () => {
            currentActivity = sportSelect.value; // Aggiorna lo stato interno
            localStorage.setItem(ACTIVITY_KEY, currentActivity); // Salva preferenza
            generateSportTable(); // Ridisegna con i dati meteo CORRENTI
        };
    }
};


// --- PUNTO DI INGRESSO PRINCIPALE (ESPORTATO) ---
// QUESTA È L'UNICA DICHIARAZIONE ESPORTATA DI updateSportTable.
/**
 * **Funzione esportata** che table.js deve chiamare ogni volta che i dati meteo cambiano.
 * Questa funzione RICEVE e USA i dati immediatamente per forzare l'aggiornamento del widget.
 * @param {object} data - L'oggetto dati completo (daily, hourly, cityName, etc.)
 */
export const updateSportTable = (data) => {
    console.log("Sport Widget: Dati aggiornati ricevuti dal modulo principale.");
    
    // 1. Aggiorna lo stato interno con i NUOVI dati ricevuti.
    currentWeatherData = data; 
    
    // 2. Assicura che l'UI sia stata creata (utile se table.js si carica prima del DOM)
    ensureUIInitialized(); 
    
    // 3. Ridisegna la tabella con i nuovi dati
    generateSportTable(); 
    
    // 4. Sincronizza il menu a tendina (nel caso in cui sia la prima esecuzione)
    const sportSelect = document.getElementById('sport-select');
    if (sportSelect) {
        sportSelect.value = currentActivity;
    }
};


// --- INIZIALIZZAZIONE AL CARICAMENTO DELLA PAGINA (INTERNA) ---

/**
 * Funzione di inizializzazione: gestisce il caricamento del modulo all'avvio della pagina (DOMContentLoaded).
 * Nota: NON è esportata, per evitare il conflitto di nome con updateSportTable.
 */
const initSportModule = async () => { 
    ensureUIInitialized(); // Crea l'UI (menu e contenitori)
    
    // 1. Se lo stato interno ha già dei dati in cache, usali immediatamente
    if (currentWeatherData) {
        console.log("Sport Widget: Dati caricati dalla cache principale all'avvio.");
        generateSportTable();
        return; 
    }

    // 2. Se non ci sono dati, li richiediamo (necessario solo al primo avvio assoluto senza cache)
    try {
        const weatherData = await getWeatherData(); // Prende i dati da main.js
        currentWeatherData = weatherData; // Aggiorna lo stato interno
        generateSportTable(); // Renderizza
    } catch (error) {
        console.error("Errore nell'inizializzazione del widget sport (Primo Avvio):", error);
        document.getElementById('sport-table-container').innerHTML = 
            '<p style="color: red; font-family: sans-serif; text-align: center;">Impossibile caricare i dati delle attività.</p>';
    }
};

// Avvia il modulo sport quando il DOM è completamente caricato

document.addEventListener('DOMContentLoaded', initSportModule);
