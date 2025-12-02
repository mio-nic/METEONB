// rise.js - Versione 3.9: Etichette Alba/Tramonto sotto il grafico con Tempo Rimanente (hh:mm)
// AGGIUNTA COLONNA PESCA

// --- CONFIGURAZIONE E CONSTANTI ---
const WEATHER_API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";
const PREFERRED_COORDS_KEY = 'preferredCityCoords';
const DEFAULT_LATITUDE = 45.40;
const DEFAULT_LONGITUDE = 11.87;

// Elemento per la nota
const notaElement = document.querySelector('.nota');
// Elementi per le etichette esterne rimosse:
// const sunLabelsContainer = document.getElementById('sunLabels'); 
// const moonLabelsContainer = document.getElementById('moonLabels'); 

// Colori per il tema scuro (Dark Theme) per Chart.js
const DARK_THEME_COLORS = {
    fontColor: '#EEE',
    gridColor: 'rgba(255, 255, 255, 0.15)',
    horizonColor: 'rgba(102, 102, 102, 0.5)', 
    
    // Sole
    sunLineCompletedColor: '#FFD700', 
    sunLineFutureColor: 'rgba(255, 215, 0, 0.4)', 
    sunFillColor: 'rgba(255, 215, 0, 0.1)', 
    sunMarkerColor: '#FFD700', 
    sunEndPointColor: '#FFF',

    // Luna
    moonLineCompletedColor: '#E0E0E0', 
    moonLineFutureColor: 'rgba(224, 224, 224, 0.4)', 
    moonFillColor: 'rgba(169, 169, 169, 0.05)',
    moonMarkerColor: '#FFFFFF',
    moonEndPointColor: '#FFF',
};

// Variabili globali per le istanze dei grafici
// Mantengo le variabili, ma le distruggo e non le riassegno
let sunChartInstance = null;
let moonChartInstance = null;

// --- FUNZIONI DI UTILITÀ (Aggiornate) ---

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

function formatTime(timeString) {
    if (!timeString) return 'N/D';
    try {
        const parts = timeString.match(/T(\d{2}:\d{2}):\d{2}/);
        return parts ? parts[1] : 'N/D';
    } catch (e) {
        return 'N/D';
    }
}

function timeToMinutes(timeString) {
    if (timeString === 'N/D') return NaN;
    const [hours, minutes] = timeString.split(':').map(Number);
    return (isNaN(hours) || isNaN(minutes)) ? NaN : hours * 60 + minutes;
}

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
 * Calcola il tempo rimanente tra l'ora attuale e un orario futuro/passato.
 * @param {number} targetMinutes - Orario target in minuti (0-1440).
 * @param {number} currentMinutes - Orario attuale in minuti (0-1440).
 * @returns {string} Tempo rimanente in formato "hh:mm" con segno (+/-)
 */
function calculateTimeRemaining(targetMinutes, currentMinutes) {
    let diff = targetMinutes - currentMinutes;

    if (diff < -720) { // Se l'evento è avvenuto più di 12 ore fa, assumiamo che sia il giorno successivo
        diff += 1440;
    } else if (diff > 720) { // Se l'evento è tra più di 12 ore, assumiamo che sia il giorno precedente
        diff -= 1440;
    }

    const sign = diff >= 0 ? '+' : '-';
    const absDiff = Math.abs(diff);
    
    const hours = Math.floor(absDiff / 60);
    const minutes = absDiff % 60;
    
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

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
            throw new Error(`Errore HTTP! Stato: ${response.status}. Controlla la API Key e il formato delle coordinate (${geocode}).`);
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

// --- NUOVE FUNZIONI PER LA PESCA ---

/**
 * Calcola un punteggio di favorevolezza per la pesca (0-100%).
 * Basato su: Orario Solare (alba/tramonto) e Fase Lunare.
 * @param {string} sunRise - Ora alba (es: "06:30").
 * @param {string} sunSet - Ora tramonto (es: "18:45").
 * @param {string} moonPhase - Fase lunare (es: "Plenilunio").
 * @returns {number} Punteggio di pesca da 0 a 100.
 */
function calculateFishingScore(sunRise, sunSet, moonPhase) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const sunRiseMinutes = timeToMinutes(sunRise);
    const sunSetMinutes = timeToMinutes(sunSet);

    // Punti base per la fase lunare
    let score = 0;
    switch (moonPhase) {
        case "Novilunio": // Luna Nuova (ottima)
        case "Plenilunio": // Luna Piena (ottima)
            score += 40;
            break;
        case "Primo quarto": // Media
        case "Ultimo quarto": // Media
            score += 25;
            break;
        case "Luna Crescente":
        case "Gibbosa Crescente":
        case "Gibbosa Calante":
        case "Luna calante": // Bassa
            score += 10;
            break;
        default:
            score += 5;
    }

    // Punti bonus per l'orario del sole (migliore all'alba e al tramonto)
    if (!isNaN(sunRiseMinutes) && !isNaN(sunSetMinutes)) {
        const preRise = sunRiseMinutes - 60; // 1 ora prima dell'alba
        const postSet = sunSetMinutes + 60;  // 1 ora dopo il tramonto
        
        let closenessScore = 0;
        
        // Calcola la vicinanza all'alba
        const diffRise = Math.abs(currentMinutes - sunRiseMinutes);
        const diffPreRise = Math.abs(currentMinutes - preRise);
        const minDiffRise = Math.min(diffRise, diffPreRise);

        // Calcola la vicinanza al tramonto
        const diffSet = Math.abs(currentMinutes - sunSetMinutes);
        const diffPostSet = Math.abs(currentMinutes - postSet);
        const minDiffSet = Math.min(diffSet, diffPostSet);

        // Il momento migliore è circa 30 minuti prima/dopo alba/tramonto.
        // Assegna il massimo punteggio (30) se si è molto vicini, degradando linearmente.
        const maxProximityMinutes = 120; // Max 2 ore di distanza per ottenere un bonus
        
        if (minDiffRise < maxProximityMinutes) {
            closenessScore = Math.max(closenessScore, 30 * (1 - minDiffRise / maxProximityMinutes));
        }
        
        if (minDiffSet < maxProximityMinutes) {
            closenessScore = Math.max(closenessScore, 30 * (1 - minDiffSet / maxProximityMinutes));
        }

        score += Math.round(closenessScore);
    }
    
    // Punteggio bonus casuale per variazione (simula vento, marea, ecc)
    score += Math.floor(Math.random() * 20); // Variazione da 0 a 20 punti

    // Assicura che il punteggio sia tra 0 e 100
    return Math.min(100, Math.max(0, score));
}

/**
 * Genera l'HTML per il cerchio di progresso SVG.
 * @param {number} score - Punteggio di pesca (0-100).
 * @returns {string} HTML per la cella della tabella.
 */
function createFishingScoreHtml(score) {
    const radius = 15;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 75 ? '#2ECC71' : (score >= 40 ? '#F39C12' : '#E74C3C'); // Verde, Giallo, Rosso

    return `
        <div style="display: flex; justify-content: center; align-items: center; width: 40px; height: 40px; margin: 0 auto; position: relative;">
            <svg width="40" height="40" viewbox="0 0 40 40" style="transform: rotate(-90deg);">
                <circle cx="20" cy="20" r="${radius}" fill="none" stroke="#333" stroke-width="5"></circle>
                <circle cx="20" cy="20" r="${radius}" fill="none" stroke="${color}" stroke-width="5"
                    stroke-dasharray="${circumference} ${circumference}"
                    stroke-dashoffset="${offset}"
                    style="transition: stroke-dashoffset 0.5s linear;"></circle>
            </svg>
            <span style="position: absolute; color: ${DARK_THEME_COLORS.fontColor}; font-size: 10px; font-weight: bold;">
                ${score}%
            </span>
        </div>
    `;
}

// --- NUOVA FUNZIONE: Icona del Pesce Animato ---

/**
 * Genera l'icona del pesce animato da visualizzare al posto dei grafici.
 * L'animazione dipende dal punteggio di pesca.
 * @param {number} score - Punteggio di pesca (0-100) per determinare l'animazione.
 * @returns {string} HTML/CSS per l'icona del pesce.
 */
function createFishingIconHtml(score) {
    let fishIcon = '🐟'; // Icona base del pesce
    let animationStyle = '';
    let message = 'Attività bassa';
    let containerClass = 'fishing-container';
    
    // Stili CSS di base (da definire in un file CSS o in uno <style> nel tuo HTML)
    const baseCss = `
        .fishing-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            min-height: 150px;
            color: ${DARK_THEME_COLORS.fontColor};
            font-family: sans-serif;
            text-align: center;
        }
        .fishing-icon {
            font-size: 80px;
            display: inline-block;
            transition: transform 0.5s ease-in-out;
        }

        /* Animazioni Custom */
        @keyframes subtle-float {
            0% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-5px) rotate(1deg); }
            100% { transform: translateY(0) rotate(0); }
        }
        @keyframes active-swim {
            0% { transform: translateX(0) rotate(-5deg); }
            25% { transform: translateX(5px) rotate(0deg); }
            50% { transform: translateX(0) rotate(5deg); }
            75% { transform: translateX(-5px) rotate(0deg); }
            100% { transform: translateX(0) rotate(-5deg); }
        }
    `;


    if (score >= 80) {
        // Ottima pesca: pesce molto attivo (nuoto veloce e frequente)
        fishIcon = '🐠'; // Pesce più attivo o colorato
        animationStyle = 'active-swim 0.7s infinite alternate;';
        message = 'ATTIVITÀ ECCELLENTE!';
        containerClass += ' excellent';
    } else if (score >= 50) {
        // Buona pesca: pesce che galleggia/nuota dolcemente
        fishIcon = '🐟';
        animationStyle = 'subtle-float 2s infinite alternate;';
        message = 'Attività buona';
        containerClass += ' good';
    } else if (score >= 20) {
         // Pesca media: pesce quasi fermo
        fishIcon = '🐡';
        animationStyle = 'subtle-float 4s infinite alternate;';
        message = 'Attività moderata';
        containerClass += ' moderate';
    } else {
        // Poca attività
        fishIcon = '🎣'; // Anziché il pesce, l'amo vuoto o un pesce triste
        message = 'Attività molto bassa';
        containerClass += ' poor';
    }
    
    // Controlla se gli elementi del grafico sono ancora presenti e li nasconde
    // Il CSS deve essere iniettato o già presente nell'HTML.
    const styleTag = document.getElementById('fishing-styles');
    if (!styleTag) {
        const head = document.head || document.getElementsByTagName('head')[0];
        const style = document.createElement('style');
        style.id = 'fishing-styles';
        style.textContent = baseCss;
        head.appendChild(style);
    }

    return `
        <div class="${containerClass}">
            <span class="fishing-icon" style="animation: ${animationStyle}">${fishIcon}</span>
            <p style="margin-top: 5px; font-weight: bold;">${message}</p>
        </div>
    `;
}

// --- FUNZIONI GRAFICI AD ARCO GIORNALIERO (RIMOSSE/SOSTITUITE) ---

/**
 * [RIMOSSA] Calcola la posizione Y sull'arco parabolico (Y = sin(Angolo)).
 * (Non più necessaria)
 */
/*
function calculateArcY(currentMinutes, riseMinutes, setMinutes) {
    ... codice rimosso ...
}
*/

/**
 * [RIMOSSA] Disegna il grafico giornaliero dell'arco per Sole o Luna.
 * (Sostituita dalla funzione che aggiunge l'icona)
 */
/*
function drawDailyArcChart(config) {
    ... codice rimosso ...
}
*/

/**
 * Funzione wrapper per il Sole
 * [MODIFICATA] Ora inserisce l'icona del Pesce nel container del Sole (sunChartCanvas).
 */
function drawDailySunArcChart(riseTime, setTime, moonPhase) {
    const sunChartContainer = document.getElementById('sunChartCanvas');
    if (!sunChartContainer) return;

    // Distrugge l'istanza precedente del grafico se esistente
    if (sunChartInstance) {
        sunChartInstance.destroy();
        sunChartInstance = null;
    }
    
    const fishingScore = calculateFishingScore(riseTime, setTime, moonPhase);
    const fishingIconHtml = createFishingIconHtml(fishingScore);

    // Sostituisce il canvas con l'icona del pesce.
    // **NOTA:** Questo richiede che l'elemento 'sunChartCanvas' sia un contenitore
    // (ad esempio, un <div>) e non direttamente il <canvas> di Chart.js.
    // Se fosse un <canvas>, è necessario sostituirlo con un <div> con lo stesso ID.
    sunChartContainer.innerHTML = fishingIconHtml;
    // Rimuove la necessità di un'intestazione separata per il grafico
    const chartTitle = sunChartContainer.closest('.chart-wrapper').querySelector('.chart-title');
    if (chartTitle) chartTitle.textContent = '🎣 Attività di Pesca Oggi';

    // Rimuoviamo anche il contenitore del grafico lunare, se esiste
    const moonChartContainer = document.getElementById('moonChartCanvas');
    if (moonChartContainer) {
        if (moonChartInstance) {
            moonChartInstance.destroy();
            moonChartInstance = null;
        }
        moonChartContainer.style.display = 'none'; // Nascondi o rimuovi il contenitore della Luna
        const moonTitle = moonChartContainer.closest('.chart-wrapper').querySelector('.chart-title');
        if (moonTitle) moonTitle.style.display = 'none';
    }
}

/**
 * Funzione wrapper per la Luna
 * [RIMOSSA] (Inclusa la sua logica per l'eliminazione/nascondimento in drawDailySunArcChart)
 */
/*
function drawDailyMoonArcChart(riseTime, setTime, moonPhase) {
    ... codice rimosso ...
}
*/


// --- FUNZIONE PRINCIPALE ESPORTATA (Modificata) ---
export async function updateCelestialTable() {
    const tableBody = document.getElementById('tabellaCorpo');
    const titolo = document.getElementById('titoloTabella');
    const tableHeader = document.getElementById('tabellaHeader'); // Aggiunto per l'intestazione
    if (!tableBody || !titolo || !tableHeader) return;

    titolo.textContent = "Caricamento dati celesti...";

    const dati = await getCelestialData();
    
    if (dati.dayOfWeek && dati.dayOfWeek.length === 0) {
        titolo.textContent = "Dati Non Disponibili";
        // Distrugge le istanze Chart.js anche in caso di errore
        if (sunChartInstance) sunChartInstance.destroy();
        if (moonChartInstance) moonChartInstance.destroy();
        return;
    }

    const giorniTotali = dati.dayOfWeek.length;
    const oggi = new Date(dati.validTimeLocal[0]).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const finePeriodo = new Date(dati.validTimeLocal[giorniTotali - 1]).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    titolo.textContent = `Previsione ${giorniTotali} giorni (dal ${oggi} al ${finePeriodo})`;

    // AGGIUNTA DELL'INTESTAZIONE "PESCA"
    if (!tableHeader.innerHTML.includes('<th>Pesca</th>')) {
        const existingHeaderRow = tableHeader.querySelector('tr');
        // Inserisce '<th>Pesca</th>' dopo '<th>Giorno</th>'
        if (existingHeaderRow) {
             const giornoHeader = existingHeaderRow.querySelector('th:first-child');
             if (giornoHeader && giornoHeader.textContent.trim() === 'Giorno') {
                 giornoHeader.insertAdjacentHTML('afterend', '<th>Pesca</th>');
             } else {
                 // Fallback se la colonna "Giorno" non è la prima
                 existingHeaderRow.innerHTML = '<th>Giorno</th><th>Pesca</th><th>Alba</th><th>Tramonto</th><th>Sorge</th><th>Tramonta</th><th>Fase Lunare</th>';
             }
        }
    }


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
        
        // --- NUOVO: Calcolo e HTML del Punteggio Pesca ---
        const fishingScore = calculateFishingScore(albaSole, tramontoSole, faseLuna);
        const fishingHtml = createFishingScoreHtml(fishingScore);
        // --------------------------------------------------

        const riga = document.createElement('tr');
        riga.innerHTML = `
            <td>${giornoLabel}</td>
            <td class="pesca">${fishingHtml}</td>
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
                moonPhase: faseLuna,
                fishingScore: fishingScore // Salviamo anche il punteggio di pesca di oggi
            };
        }
    }

    // [MODIFICATO] Chiama la funzione che ora inserisce l'icona del pesce al posto del grafico solare
    drawDailySunArcChart(todayData.sunRise, todayData.sunSet, todayData.moonPhase);
    
    // [RIMOSSO] La chiamata a drawDailyMoonArcChart è stata rimossa,
    // e la sua funzionalità di distruzione/nascondimento è in drawDailySunArcChart
    // drawDailyMoonArcChart(todayData.moonRise, todayData.moonSet, todayData.moonPhase);
}
