// sport.js - Modulo per la Tabella Attività Sportive/Rischio (VERSIONE MODIFICATA)

// Importa le funzioni e le costanti necessarie da main.js
import { getWeatherData, getDailyWeatherEmoji } from './main.js'; 

// --- CHIAVI DI STATO E LOCAL STORAGE ---
const MAIN_WEATHER_DATA_KEY = 'weatherData'; 
const ACTIVITY_KEY = 'sportModule_activity';

// --- STATO GLOBALE DEL MODULO ---
// Rimuovo influenza/polline, uso 'escursione' come fallback se l'attività salvata era una di quelle eliminate.
let currentActivity = localStorage.getItem(ACTIVITY_KEY) || 'escursione'; 
if (currentActivity === 'influenza' || currentActivity === 'polline') {
    currentActivity = 'escursione';
}
let currentWeatherData = JSON.parse(localStorage.getItem(MAIN_WEATHER_DATA_KEY)); 

// --- FUNZIONI DI FORMATTAZIONE INTERNA ---

/**
 * Converte la stringa data (YYYY-MM-DD) in un'intestazione leggibile per la tabella sport.
 * Mostra "Oggi" per il primo giorno e "Giorno DD/MM" per gli altri.
 */
const formatDayHeader = (dateStr, index) => {
    const date = new Date(dateStr + 'T00:00:00'); 
    
    if (isNaN(date.getTime())) {
        return 'Giorno ?';
    }
    
    if (index === 0) {
        return 'Oggi'; 
    }
    
    // Mostra giorno della settimana abbreviato e data breve (es. "Gio 07/11")
    const weekday = date.toLocaleDateString('it-IT', { weekday: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Ritorna "Gio 07/11" (rimuovendo il punto se presente nell'abbreviazione del giorno)
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', '')} ${day}/${month}`;
};


// --- LOGICA DI CALCOLO FAVOREVOLEZZA ---
const calculateFavorability = (activity, dayData) => {
    // Estrai i dati necessari dal giorno
    const temp = dayData.temperature_2m_max;
    const humidity = dayData.relative_humidity_2m_mean;
    const precipProb = dayData.precipitation_probability_max;
    const wind = dayData.wind_speed_10m_max;

    let score = 0;
    const maxScore = 400; 

    switch (activity) {
    
    case 'studiare':
            // Ideale: Temperatura mite/fresca per concentrazione, no pioggia/vento (anche se attività indoor, il meteo può influenzare l'umore/il comfort)
            score += (temp >= 15 && temp <= 22) ? 100 : (temp >= 10 && temp <= 25 ? 60 : 20);
            score += (humidity <= 60) ? 100 : (humidity <= 75 ? 60 : 20);
            score += (precipProb <= 10) ? 100 : (precipProb <= 20 ? 50 : 10);
            score += (wind <= 20) ? 100 : (wind <= 30 ? 60 : 20);
            break;

        case 'arieggiare':
            // Ideale: Temperatura non troppo fredda/calda, poco vento (per non raffreddare troppo la casa), no pioggia.
            score += (temp >= 10 && temp <= 28) ? 100 : (temp >= 5 && temp <= 32 ? 60 : 20);
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 50 : 10);
            score += (wind <= 15) ? 100 : (wind <= 25 ? 60 : 20);
            score += (humidity <= 70) ? 100 : (humidity <= 80 ? 60 : 20);
            break;

        case 'asciugare':
            // Ideale: Alta temperatura, bassa umidità, vento (per asciugare il bucato all'aperto), no pioggia.
            score += (temp >= 20) ? 100 : (temp >= 15 ? 60 : 20);
            score += (humidity <= 50) ? 100 : (humidity <= 70 ? 60 : 20);
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 20 : 0); // La pioggia rende impossibile l'asciugatura
            score += (wind >= 10 && wind <= 25) ? 100 : (wind < 10 && wind > 35 ? 60 : 20);
            break;

        case 'innaffiare':
            // Ideale: Nessuna pioggia, temperatura alta/media (quando serve irrigare), poco vento.
            score += (temp >= 20) ? 100 : (temp >= 15 ? 60 : 20);
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 50 : 10);
            score += (wind <= 15) ? 100 : (wind <= 25 ? 60 : 20);
            score += (humidity <= 70) ? 100 : (humidity <= 80 ? 60 : 20);
            break;

        case 'lavaggio_macchina':
            score += (temp >= 10 && temp <= 25) ? 100 : (temp >= 5 && temp <= 30 ? 60 : 20);
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 50 : 10);
            score += (wind <= 10) ? 100 : (wind <= 20 ? 60 : 20);
            score += (humidity <= 60) ? 100 : (humidity <= 75 ? 60 : 20);
            break;
            
        case 'escursione':
            score += (temp >= 15 && temp <= 25) ? 100 : (temp >= 10 && temp <= 30 ? 60 : 20); 
            score += (humidity <= 50) ? 100 : (humidity <= 70 ? 60 : 20); 
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 50 : 10); 
            score += (wind <= 10) ? 100 : (wind <= 20 ? 60 : 20); 
            break;
            
        // Rimosse le logiche 'influenza' e 'polline'

        case 'guida':
            score += (temp >= 10 && temp <= 25) ? 100 : (temp >= 5 && temp <= 30 ? 60 : 20); 
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 60 : 20); 
            score += (wind <= 15) ? 100 : (wind <= 25 ? 60 : 20); 
            score += (humidity <= 60) ? 100 : (humidity <= 80 ? 60 : 20); 
            break;
            
        case 'sfalcio_erba':
            score += (temp >= 20 && temp <= 28) ? 100 : (temp >= 15 && temp <= 30 ? 60 : 20); 
            score += (precipProb === 0) ? 100 : (precipProb <= 5 ? 50 : 10); 
            score += (wind <= 5) ? 100 : (wind <= 10 ? 60 : 20); 
            score += (humidity <= 40) ? 100 : (humidity <= 60 ? 60 : 20); 
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
    
    // RIMOZIONE: Rimosso il titolo dinamico "Livello di..."

    let tableHTML = `<div class="table-container sport-table-container"><table class="sport-table"><thead><tr>`;
    
    // Intestazione con i giorni della settimana - USA formatDayHeader
    days.forEach((dateStr, index) => { 
        tableHTML += `<th>${formatDayHeader(dateStr, index)}</th>`; 
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
        // RIMOZIONE: Rimosse le opzioni 'influenza' e 'polline'
        document.getElementById('sport-widget').innerHTML = `
            <div class="sport-menu-container" id="sport-select-container" style="margin-top: 20px; text-align: center;">
                <label for="sport-select" style="font-weight: bold;">Seleziona Attività:</label>
                <select id="sport-select" class="custom-select" style="padding: 5px; border-radius: 5px;">
                    <option value="escursione">🚶 Escursione</option>
                    <option value="lavaggio_macchina">🧼 Lavaggio Macchina</option>
                    <option value="guida">🚗 Guida</option>
                    <option value="sfalcio_erba">🌾 Sfalcio Erba</option>
                    <option value="studiare">📚 Studiare</option>
                    <option value="arieggiare">🏠 Arieggiare</option>
                    <option value="asciugare">🧺 Asciugare</option>
                    <option value="innaffiare">🪴 Innaffiare</option>
                </select>
            </div>
            <div id="sport-table-container"></div>
        `;
        
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
/**
 * **Funzione esportata** che table.js deve chiamare ogni volta che i dati meteo cambiano.
 * @param {object} data - L'oggetto dati completo (daily, hourly, cityName, etc.)
 */
export const updateSportTable = (data) => {
    console.log("Sport Widget: Dati aggiornati ricevuti dal modulo principale.");
    
    // 1. Aggiorna lo stato interno con i NUOVI dati ricevuti.
    currentWeatherData = data; 
    
    // 2. Assicura che l'UI sia stata creata 
    ensureUIInitialized(); 
    
    // 3. Ridisegna la tabella con i nuovi dati
    generateSportTable(); 
    
    // 4. Sincronizza il menu a tendina 
    const sportSelect = document.getElementById('sport-select');
    if (sportSelect) {
        sportSelect.value = currentActivity;
    }
};


// --- INIZIALIZZAZIONE AL CARICAMENTO DELLA PAGINA (INTERNA) ---

/**
 * Funzione di inizializzazione: gestisce il caricamento del modulo all'avvio della pagina.
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
