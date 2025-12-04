// table.js
// Versione finale con barra di ricerca unificata e controlli migliorati.

import { getWeatherData, getWeatherEmoji, getDailyWeatherEmoji, precipitationEmojiMap, formatDate, formatTime, getWeatherDescription, getPrecipitationDescription, getWindDescription, searchCities } from './main.js';
import { updateChart } from './gradi.js';
import { updateRainChart } from './gradi-precipitazioni.js';
import { updateComfortTable } from './vita.js';
import { updateSunTable } from './sun.js';
import { updateSportTable } from './sport.js';
import { generateHourlyDressTable } from './dress.js';

// --- FUNZIONI DI UTILITÀ (Alert e Descrizione) ---

const getWeatherAlertStatus = (weatherCode, maxTemp, minTemp, precipitation, windSpeed) => {
    let alertLevel = 0;
    
    // Inizializzazione e conversione dei valori
    const tMax = Number(maxTemp) || 0;
    const tMin = Number(minTemp) || 0;
    const p = Number(precipitation) || 0; 
    const w = Number(windSpeed) || 0; 

    // ROSSO (MAX RISK)
    // Se la Max è >= 38 O la Min è <= -10 O vento >= 50 O pioggia >= 50
    if (tMax >= 40 || tMin <= -15 || w >= 50 || p >= 50) {
        alertLevel = 3; // Rosso
    } 
    // ARANCIONE (HIGH RISK)
    // Se la Max è >= 33 O la Min è <= 0 O vento >= 25 O pioggia >= 30
    else if (tMax >= 35 || tMin <= -5 || w >= 35 || p >= 35) {
        alertLevel = 2; // Arancione
    } 
    // GIALLO (LOW RISK)
    // Se la Max è >= 28 O la Min è <= 5 O vento >= 10 O pioggia >= 1
    else if (tMax >= 33 || tMin <= 5 || w >= 15 || p >= 25) {
        alertLevel = 1; // Giallo
    }

    switch (alertLevel) {
        case 3: return 'dot-discreto'; // Rosso
        case 2: return 'dot-allerta'; // Arancione
        case 1: return 'dot-buono'; // Giallo
        default: return 'dot-ottimo';
    }
};

/**
 * Funzione di supporto per generare la descrizione breve del rischio.
 * CORREZIONE: Assicura un fallback per tutti gli status.
 * @param {number} temp - Temperatura media giornaliera (o 0 se N/D).
 * @param {number} precipitation - Somma delle precipitazioni giornaliere (o 0 se N/D).
 * @param {number} windSpeed - Velocità massima del vento giornaliera (o 0 se N/D).
 * @param {string} statusClass - La classe di allerta calcolata (es. 'dot-discreto').
 * @returns {string} Messaggio breve del tipo "Rischio alto di ghiaccio".
 */
const getAlertRiskDescription = (temp, precipitation, windSpeed, statusClass) => {
    // CORREZIONE 1: Gestione esplicita di dot-ottimo per evitare undefined
    if (statusClass === 'dot-ottimo') {
        return 'Condizioni normali';
    }

    let risks = [];
    const t = Number(temp) || 0;
    const p = Number(precipitation) || 0;
    const w = Number(windSpeed) || 0;

    // Allerta Rossa (Rischio Alto)
    if (statusClass === 'dot-discreto') {
    	if (t >= 40) risks.push('Caldo Estremo (colpo di calore)');
        if (t <= -15) risks.push('Ghiaccio/Freddo Estremo (sottozero)');
        if (w >= 50) risks.push('vento molto forte (>50km/h)');
        if (p >= 50) risks.push('piogge torrenziali (>50mm)');
        if (risks.length > 0) return `Rischio Estremo di ${risks.join(' e/o ')}`;
    }

    // Allerta Arancione (Rischio Moderato/Alto)
    if (statusClass === 'dot-allerta') {
        if (t >= 35) risks.push('Caldo intenso (disagio moderato)');
        if (t <= -5) risks.push('Ghiaccio/Freddo Estremo (sottozero)');
        if (w >= 35) risks.push('vento forte (>35km/h)');
        if (p >= 35) risks.push('piogge intense (>35mm)');
        if (risks.length > 0) return `Rischio Alto di ${risks.join(', ')}`;
    }

    // Allerta Gialla (Rischio Basso)
    if (statusClass === 'dot-buono') {
        if (t >= 33) risks.push('Caldo (disagio lieve)');
        if (t <= 5) risks.push('freddo (temperatura <5°C)');
        if (w >= 15) risks.push('raffiche di vento (>15km/h)');
        if (p >= 25) risks.push('pioggia (>25mm)');
        if (risks.length > 0) return `Rischio basso di ${risks.join(', ')}`;
    }
    
    // Fallback in caso di logica non coperta (dovrebbe essere raro)
    return 'Condizioni meteo avverse generiche'; 
};

/**
 * Funzione modificata per includere il messaggio breve del rischio.
 * @param {string} statusClass - La classe di allerta calcolata.
 * @param {string} riskDescription - La descrizione breve del rischio (nuovo parametro).
 * @returns {{title: string, description: string}}
 */
const getAlertDescription = (statusClass, riskDescription) => {
    // CORREZIONE 2: Assicura che riskDescription sia una stringa (anche se getAlertRiskDescription già lo fa)
    const desc = riskDescription || 'Dati non disponibili o allerta non specificata.';

    switch (statusClass) {
        case 'dot-discreto': return { 
            title: 'ALLERTA ROSSA', 
            description: `${desc}. Condizioni Estreme: Massima cautela richiesta.` 
        };
        case 'dot-allerta': return { 
            title: 'ALLERTA ARANCIONE', 
            description: `${desc}. Possibili disagi, si consiglia attenzione.` 
        };
        case 'dot-buono': return { 
            title: 'ALLERTA GIALLA', 
            description: `${desc}. Condizioni variabili. Si consiglia cautela.` 
        };
        default: return { 
            title: 'NESSUNA ALLERTA', 
            description: `${desc}. Buona giornata!` 
        };
    }
};

const getAlertHexColor = (statusClass) => {
    switch (statusClass) {
        case 'dot-discreto': return '#FF0000'; // Rosso
        case 'dot-allerta': return '#FFA500'; // Arancione
        case 'dot-buono': return '#FFFF00'; // Giallo
        default: return '#32CD32'; // Verde
    }
};

const getAlertStyles = (alertColor) => {
    
    const animationStyle = `animation: border-and-shadow-pulse 4s infinite alternate;`;

    return `
        <style>
            /* Keyframes per l'animazione di pulsazione del BORDO e dell'OMBRA */
            @keyframes border-and-shadow-pulse {
                0% { 
                    border-color: ${alertColor}1a; 
                    box-shadow: 0 0 5px ${alertColor}00; 
                } 
                50% { 
                    border-color: ${alertColor}; 
                    box-shadow: 0 0 15px ${alertColor}; 
                } 
                100% { 
                    border-color: ${alertColor}1a; 
                    box-shadow: 0 0 5px ${alertColor}00; 
                } 
            }

            .alert-card-new {
                display: flex;
                align-items: stretch; 
                background-color: rgba(30, 30, 30, 0.9);
                color: var(--text-color);
                
                border: 1px solid ${alertColor}1a; 
                
                border-radius: 15px;
                margin-top: 10px; 
                overflow: hidden; 
                width: 100%; 
                box-sizing: border-box; 

                ${animationStyle} 
            }
            .alert-symbol {
                width: 40px; 
                background-color: ${alertColor};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.8em; 
                font-weight: bold;
                color: #000; 
                padding: 5px; 
                writing-mode: horizontal-tb; 
                text-orientation: mixed;
            }
            .alert-content {
                flex-grow: 1;
                flex-shrink: 1; 
                padding: 10px 15px;
                max-width: 100%; 
            }
            .alert-title {
                font-size: 1.1em;
                font-weight: bold;
                margin-bottom: 4px;
                color: ${alertColor}; 
                max-width: 100%; 
                word-wrap: break-word; 
                overflow-wrap: break-word;
            }
            .alert-description {
                font-size: 0.9em;
                color: var(--secondary-text-color);
                word-wrap: break-word; 
                overflow-wrap: break-word;
                max-width: 100%; 
            }
            
            

            /* --- NUOVI STILI PER IL MENÙ A TENDINA (Ricerca Città) --- */
            
            /* 1. Contenitore dei suggerimenti (deve essere posizionato in relazione a cityInput) */
            .search-container {
                position: relative;
            }

            /* 2. Stile dell'elenco dei suggerimenti (simula un dropdown) */
            #citySuggestionsList {
                position: absolute;
                top: 100%; /* Sotto l'input */
                left: 0;
                right: 0;
                z-index: 1000; /* Assicura che sia sopra gli altri elementi */
                max-height: 200px; /* Limita l'altezza */
                overflow-y: auto; /* Aggiunge scroll se necessario */
                background-color: rgba(30, 30, 30, 0.95); /* Sfondo scuro e leggermente trasparente */
                border: 1px solid var(--border-color);
                border-top: none; 
                border-radius: 0 0 8px 8px; /* Angoli arrotondati solo in basso */
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
                padding: 0;
                margin: 0;
                list-style: none; /* Rimuove i pallini */
                color: var(--text-color);
            }

            /* 3. Stile di ogni elemento suggerito */
            .suggestion-item {
                padding: 10px 15px;
                cursor: pointer;
                transition: background-color 0.2s;
                font-size: 0.95em;
            }

            /* 4. Effetto hover */
            .suggestion-item:hover {
                background-color: rgba(66, 161, 255, 0.2); /* Azzurro chiaro al passaggio del mouse */
            }

            .suggestion-item:last-child {
                border-bottom: none;
            }

            /* 5. Nasconde l'elenco quando non ci sono suggerimenti */
            .hidden-list {
                display: none;
            }
            
            /* Elementi di stato */
            .status-dot.dot-ottimo { background-color: #32CD32; }
            .status-dot.dot-buono { background-color: #FFFF00; }
            .status-dot.dot-allerta { background-color: #FFA500; }
            .status-dot.dot-discreto { background-color: #FF0000; }
            .hidden { display: none !important; }
        </style>
    `;
};

// ... (Resto delle funzioni di utilità omesso per brevità) ...
const getCurrentWeatherDescriptionFromData = (precipitation, cloudCover, windSpeed, precipProb, temperature_2m) => {
    if (precipProb >= 70 && windSpeed >= 30) { return "temporale"; }
    if (precipitation >= 0.1 && temperature_2m < 2) { return "neve"; }
    if (precipitation >= 5.0) { return "pioggia forte"; }
    if (precipitation >= 2.0) { return "pioggia"; }
    if (precipitation >= 0.1) { return "pioviggina"; }
    if (cloudCover >= 80) { return "coperto"; }
    if (cloudCover >= 50) { return "nuvoloso"; }
    if (cloudCover >= 20) { return "poco nuvoloso"; }
    return "sereno";
};

const formatDetail = (emoji, label, value, unit = '') => {
    const displayValue = value === "N/D" || isNaN(value) ? "N/D" : `${value}${unit}`;
    
    return `
        <div style="display: flex; justify-content: space-between; font-size: 0.8em; padding: 2px 0;">
            <span title="${label}">${emoji} ${label}:</span>
            <span style="font-weight: bold;">${displayValue}</span>
        </div>
    `;
};

/**
 * Funzione modificata per accettare la descrizione del rischio.
 * @param {string} dailyAlertClass - La classe di allerta calcolata.
 * @param {string} dailyAlertColor - Il colore esadecimale dell'allerta.
 * @param {string} riskDescription - La descrizione breve del rischio (nuovo parametro).
 * @returns {string} HTML per la card di allerta.
 */
const renderAlertCard = (dailyAlertClass, dailyAlertColor, riskDescription) => {
    // Il parametro riskDescription è garantito di essere una stringa da renderCurrentWeatherCard
    const alertInfo = getAlertDescription(dailyAlertClass, riskDescription);
    let symbol = '⚠'; 
    if (dailyAlertClass === 'dot-ottimo') {
        symbol = '✔'; 
    }

    return `
        <div class="alert-card-new">
            <div class="alert-symbol" style="background-color: ${dailyAlertColor};">
                ${symbol}
            </div>
            <div class="alert-content">
                <div class="alert-title">${alertInfo.title}</div>
                <div class="alert-description">${alertInfo.description}</div>
            </div>
        </div>
    `;
}

const renderCurrentWeatherCard = (allData, currentTimeIndex) => {
    const dailyData = allData.daily;
    const hourlyData = allData.hourly;
    
    const getHourlyValue = (key, index) => {
        if (index === -1 || !hourlyData || !hourlyData[key] || index >= hourlyData[key].length) { return "N/D"; }
        const value = hourlyData[key][index];
        return value !== null && value !== undefined ? value : "N/D";
    };

    const currentTemp = Math.round(Number(getHourlyValue('temperature_2m', currentTimeIndex)));
    const currentWindSpeed = Math.round(Number(getHourlyValue('wind_speed_10m', currentTimeIndex)));
    const currentCloudCover = Math.round(Number(getHourlyValue('cloud_cover', currentTimeIndex)));
    const currentPrecipitation = Number(getHourlyValue('precipitation', currentTimeIndex));
    const currentPrecipitationProb = Math.round(Number(getHourlyValue('precipitation_probability', currentTimeIndex)));

    const currentWeatherDescription = getCurrentWeatherDescriptionFromData(currentPrecipitation, currentCloudCover, currentWindSpeed, currentPrecipitationProb, currentTemp);
    const weatherEmojiNow = currentTimeIndex !== -1 ? getWeatherEmoji(hourlyData, currentTimeIndex) : "❓";

    const getMaxMin = (dataArray, index) => {
        if (!dataArray || dataArray.length <= index) return "N/D";
        const value = dataArray[index];
        return value !== null && value !== undefined ? Math.round(value) : "N/D";
    };

    const maxTemp = getMaxMin(dailyData.temperature_2m_max, 0);
    const minTemp = getMaxMin(dailyData.temperature_2m_min, 0);
    const precipitationSum = (dailyData.precipitation_sum.length > 0 ? dailyData.precipitation_sum[0] : 0).toFixed(1); 
    const maxDailyWindSpeed = dailyData.wind_speed_10m_max.length > 0 ? dailyData.wind_speed_10m_max[0] : 0;

    // --- NUOVA LOGICA DI ALLERTA (Corretta e Unificata) ---
    
    // 1. Dichiara la variabile *una sola volta*
    const dailyAlertClass = getWeatherAlertStatus(
        null, 
        maxTemp, 
        minTemp, 
        precipitationSum, 
        maxDailyWindSpeed
    );
    
    // 2. Calcola il colore
    const dailyAlertColor = getAlertHexColor(dailyAlertClass);
     
    // 3. Logica per determinare quale temperatura usare nella descrizione (Max o Min)
    let tempForDescription = maxTemp; 
     
    if (dailyAlertClass !== 'dot-ottimo') {
        // Logica per confrontare i livelli di rischio Freddo vs Caldo/Vento/Pioggia
        // NOTA: I livelli di rischio per vento/pioggia vengono trattati in modo implicito come rischio caldo
        const hotRiskLevel = (Number(maxTemp) >= 38 ? 3 : Number(maxTemp) >= 33 ? 2 : Number(maxTemp) >= 28 ? 1 : 0);
        const coldRiskLevel = (Number(minTemp) <= -10 ? 3 : Number(minTemp) <= 0 ? 2 : Number(minTemp) <= 5 ? 1 : 0);
        
        // Se il rischio freddo è uguale o maggiore del rischio caldo, usiamo la T_Min per la descrizione.
        // Questo permette alla descrizione di menzionare il freddo estremo se è la causa principale.
        if (coldRiskLevel >= hotRiskLevel) {
            tempForDescription = minTemp; 
        }
    }
     
    // 4. Calcola la descrizione breve del rischio (usa la temperatura rilevante)
    const riskDescription = getAlertRiskDescription(tempForDescription, precipitationSum, maxDailyWindSpeed, dailyAlertClass);
 
    
    
    
    const alertStyles = getAlertStyles(dailyAlertColor);
    // Passa la riskDescription (che è una stringa)
    const newAlertCard = renderAlertCard(dailyAlertClass, dailyAlertColor, riskDescription);
    
    const dailyPrecipitationProb = dailyData.precipitation_probability_max.length > 0 ? dailyData.precipitation_probability_max[0] : "N/D";

    

    

    return `
        ${alertStyles} 
        ${newAlertCard} 
        
            
            </div>
        </div>
    `;
};


// --- INIZIO BLOCCO DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Riferimenti HTML ---
    const locationName = document.getElementById('locationName');
    const lastUpdate = document.getElementById('lastUpdate');
    const weatherTableBody = document.querySelector('#weatherTable tbody');
    const cityInput = document.getElementById('cityInput');
    const weatherCardContainer = document.querySelector('.weather-card-container');
    
    // Riferimenti per la BARRA UNIFICATA e il pulsante di chiusura
    const locationDisplay = document.getElementById('locationDisplay'); 
    const closeSearchButton = document.getElementById('closeSearchButton'); 

    // ** PUNTO DI CORREZIONE: Assicuriamo che citySuggestionsList esista **
    const searchContainer = document.querySelector('.search-container'); 
    let citySuggestionsList = document.getElementById('citySuggestionsList');

    // Se l'elemento non esiste, lo creiamo SOLO se il contenitore genitore (.search-container) è presente
    if (searchContainer && !citySuggestionsList) {
        citySuggestionsList = document.createElement('ul');
        citySuggestionsList.id = 'citySuggestionsList';
        citySuggestionsList.className = 'hidden-list'; 
        searchContainer.appendChild(citySuggestionsList);
    }
    // Fine punto di correzione
    
    let allData = {};
    let selectedCityLocation = null; 

    // STATO INIZIALE: Nascondi l'input e il pulsante di chiusura
    if (cityInput) {
        cityInput.classList.add('hidden');
    }
    if (closeSearchButton) {
        closeSearchButton.classList.add('hidden');
    }
    

    // --- Funzione di visualizzazione (Toggle) ---
    const toggleSearchDisplay = (isSearching) => {
        if (isSearching) {
            // MOSTRA: Input e Pulsante X
            cityInput.classList.remove('hidden');
            locationDisplay.classList.add('hidden');
            if (closeSearchButton) {
                closeSearchButton.classList.remove('hidden'); 
            }
            cityInput.focus();
        } else {
            // NASCONDI: Input e Pulsante X
            cityInput.classList.add('hidden');
            locationDisplay.classList.remove('hidden');
            if (closeSearchButton) {
                closeSearchButton.classList.add('hidden');
            }
            cityInput.value = ''; 
            selectedCityLocation = null;
            // Nascondi i suggerimenti alla chiusura (Aggiunta protezione citySuggestionsList)
            if (citySuggestionsList) {
                citySuggestionsList.classList.add('hidden-list');
                citySuggestionsList.innerHTML = ''; 
            }
        }
    };
    
    // --- Funzione per renderizzare la lista di suggerimenti ---
    const renderSuggestions = (cities) => {
        if (!citySuggestionsList) return; // Protezione

        citySuggestionsList.innerHTML = ''; 

        if (cities.length === 0) {
            citySuggestionsList.classList.add('hidden-list');
            return;
        }

        cities.forEach(city => {
            const listItem = document.createElement('li');
            listItem.className = 'suggestion-item';
            listItem.textContent = city.fullDisplayName;
            listItem.dataset.location = JSON.stringify({
                latitude: city.latitude,
                longitude: city.longitude,
                fullDisplayName: city.fullDisplayName
            });
            
            // Gestore click per selezionare il suggerimento
            listItem.addEventListener('click', () => {
                cityInput.value = city.fullDisplayName;
                selectedCityLocation = JSON.parse(listItem.dataset.location);
                // Avvia la ricerca e nasconde la lista
                citySuggestionsList.classList.add('hidden-list');
                initData(selectedCityLocation);
            });

            citySuggestionsList.appendChild(listItem);
        });

        citySuggestionsList.classList.remove('hidden-list');
    };

    // --- Funzione di rendering della Tabella Giornaliera ---
    const renderTable = (dailyData) => {
        if (!weatherTableBody) {
             console.error("Errore: Elemento <tbody> per la tabella del meteo giornaliero non trovato.");
             return;
        }

        weatherTableBody.innerHTML = '';

        if (!dailyData || !dailyData.time) {
            weatherTableBody.innerHTML = '<tr><td colspan="5">Dati giornalieri non disponibili.</td></tr>';
            return;
        }

        dailyData.time.forEach((day, index) => {
            const row = document.createElement('tr');
            row.dataset.index = index; 
            const today = new Date();
            const currentDay = new Date(day);
            
            const dateOptions = { weekday: 'short', day: 'numeric' }; 
            const formattedDateWithoutMonth = currentDay.toLocaleDateString('it-IT', dateOptions);
            const dayName = (currentDay.toDateString() === today.toDateString()) ? 'Oggi' : formattedDateWithoutMonth;
            
            const weatherCode = null; 

            const maxTemp = Math.round(dailyData.temperature_2m_max[index] ?? 'N/D'); 
            const minTemp = Math.round(dailyData.temperature_2m_min[index] ?? 'N/D');
            const windSpeed = Math.round(dailyData.wind_speed_10m_max[index] ?? 0); 
            const probPrecipitation = dailyData.precipitation_probability_max[index] ?? 0;
            const sumPrecipitation = dailyData.precipitation_sum[index] ?? 0;
            
            const numericMax = typeof dailyData.temperature_2m_max[index] === 'number';
            const numericMin = typeof dailyData.temperature_2m_min[index] === 'number';
            const avgTemp = (numericMax && numericMin) ? (maxTemp + minTemp) / 2 : 0;
            
            let displaySumPrecipitation = Number(sumPrecipitation).toFixed(1);
            let precipitationUnit = ' mm'; // Unità predefinita
            
            // --- INIZIO CONDIZIONE RICHIESTA ---
            // La precipitazione (pioggia) è considerata 'pioggia' se sumPrecipitation > 0 (giorno piovoso)
            const isRain = sumPrecipitation > 0.1; // Si considera pioggia una quantità minima misurabile
            
            if (avgTemp < 1 && isRain) {
                // Conversione da mm a cm (1 mm = 0.1 cm)
                const precipInCm = sumPrecipitation / 1;
                displaySumPrecipitation = precipInCm.toFixed(1); // Usa più decimali per i cm
                precipitationUnit = ' cm';
            }
            // --- FINE CONDIZIONE RICHIESTA ---
            const precipitationEmoji = precipitationEmojiMap(displaySumPrecipitation);

            const weatherDescription = getWeatherDescription(weatherCode); 
            const precipitationDescription = getPrecipitationDescription(displaySumPrecipitation);
            const windDescription = getWindDescription(windSpeed);

            const statusClass = getWeatherAlertStatus(weatherCode, avgTemp, sumPrecipitation, windSpeed, true);
            const weatherEmoji = getDailyWeatherEmoji(dailyData, index);

            row.style.cursor = 'pointer'; 
            
            const tempDisplay = (maxTemp === 'N/D' || minTemp === 'N/D') ? 'N/D' : `${maxTemp}°/${minTemp}°`;

            row.innerHTML = `<td><span class="status-dot ${statusClass}"></span><br>${dayName}</td>
                                 <td>${weatherEmoji}</td>
                                 <td>${tempDisplay}</td>
                                 <td>${displaySumPrecipitation}${precipitationUnit}, ${probPrecipitation}%<br>${precipitationDescription}</td>
                                 <td>${windSpeed}km/h<br>${windDescription}</td>`;

            weatherTableBody.appendChild(row);
        });
    };
    
    
    // --- Funzione Principale di Inizializzazione ---
    const initData = async (location = null) => { 
        lastUpdate.textContent = 'Aggiornamento in corso...';
        locationName.textContent = '';
        try {
            const cachedData = localStorage.getItem('weatherData');
            const cachedCityName = cachedData ? JSON.parse(cachedData).cityName : null;
            
            const locationToFetch = location || cachedCityName || null;
            
            allData = await getWeatherData(locationToFetch);

            localStorage.setItem('allWeatherData', JSON.stringify(allData));

            renderTable(allData.daily); 

            const date = new Date(allData.timestamp);
            lastUpdate.textContent = `${date.toLocaleDateString('it-IT')} alle ${date.toLocaleTimeString('it-IT')}.`;
            locationName.textContent = `${allData.cityName}`;

            let currentTimeIndex = allData.hourly.time.findIndex(time => new Date(time) > new Date());
            
            if (currentTimeIndex === -1 && allData.hourly.time.length > 0) {
                 currentTimeIndex = allData.hourly.time.length - 1;
            }
            
            if (weatherCardContainer) {
                weatherCardContainer.innerHTML = renderCurrentWeatherCard(allData, currentTimeIndex);
            } else {
                console.error("Errore: Elemento .weather-card-container non trovato. Assicurati di averlo aggiunto nell'HTML.");
            }

            updateChart(allData);
            updateRainChart(allData);
            updateComfortTable(allData);
            updateSunTable(allData); 
            updateSportTable(allData);
            generateHourlyDressTable(allData);

            // Ritorna al display del messaggio dopo il successo
            toggleSearchDisplay(false); 

        } catch (err) {
            console.error('Errore:', err);
            lastUpdate.textContent = err.message || 'Errore nel caricamento dei dati.';
            if (weatherTableBody) {
                weatherTableBody.innerHTML = '<tr><td colspan="5">Impossibile caricare i dati meteo.</td></tr>';
            }
            // Ritorna al display del messaggio anche in caso di errore
            toggleSearchDisplay(false); 
        }
    };

    // --- EVENTI ---
    
    // 1. Attivazione ricerca tramite click sul messaggio di stato
    if (locationDisplay) {
        locationDisplay.addEventListener('click', () => {
            toggleSearchDisplay(true);
        });
    }
    
    // 2. Click sul pulsante X per chiudere la ricerca
    if (closeSearchButton) {
        closeSearchButton.addEventListener('click', () => {
            toggleSearchDisplay(false); 
        });
    }

    // 3. Click sulla tabella per vedere i dettagli orari
    if (weatherTableBody) {
        weatherTableBody.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row) {
                const index = row.dataset.index;
                window.location.href = `./tableh.html?dayIndex=${index}`;
            }
        });
    }

    // 4. Evento input (per suggerimenti)
    if (cityInput) {
        cityInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            selectedCityLocation = null;

            if (query.length < 3) {
                // Protezione contro citySuggestionsList = null
                if (citySuggestionsList) { 
                    citySuggestionsList.classList.add('hidden-list');
                }
                return;
            }

            const cities = await searchCities(query);
            renderSuggestions(cities);
        });
        
        // 5. Gestione del focus per nascondere la lista quando si clicca altrove
        document.addEventListener('click', (e) => {
            // Protezione e controllo sul contenitore principale
            if (searchContainer && citySuggestionsList && !searchContainer.contains(e.target)) {
                citySuggestionsList.classList.add('hidden-list');
            }
        });
        
        // 6. Evento keydown (tasto Invio - AVVIA LA RICERCA)
        if (cityInput) {
            cityInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); 
                    
                    const cityValue = cityInput.value.trim();
                    
                    if (cityValue) {
                        initData(cityValue);
                        // Protezione contro citySuggestionsList = null
                        if (citySuggestionsList) {
                            citySuggestionsList.classList.add('hidden-list');
                        }
                    }
                }
            });
        }
    }

    // Avvia il caricamento iniziale dei dati
    initData();

});




