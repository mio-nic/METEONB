// rise.js - Versione 3.9: Etichette Alba/Tramonto sotto il grafico con Tempo Rimanente (hh:mm)

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

// --- FUNZIONI GRAFICI AD ARCO GIORNALIERO ---

/**
 * Calcola la posizione Y sull'arco parabolico (Y = sin(Angolo)).
 */
function calculateArcY(currentMinutes, riseMinutes, setMinutes) {
    if (isNaN(riseMinutes) || isNaN(setMinutes)) {
        return NaN;
    }

    const dayDuration = setMinutes - riseMinutes;
    const nightDuration = 1440 - dayDuration;

    // Se l'oggetto è sopra l'orizzonte (tra rise e set)
    if (currentMinutes >= riseMinutes && currentMinutes <= setMinutes) {
        const timeFraction = (currentMinutes - riseMinutes) / dayDuration; 
        return Math.sin(timeFraction * Math.PI) * 1.1; 
    } 
    
    // Sotto l'orizzonte
    let timeFraction;
    let nightTime;

    if (currentMinutes < riseMinutes) {
        nightTime = currentMinutes + (1440 - setMinutes); 
        timeFraction = nightTime / nightDuration;
    } else {
        nightTime = currentMinutes - setMinutes;
        timeFraction = nightTime / nightDuration;
    }

    return Math.sin(Math.PI + timeFraction * Math.PI) * 0.5; 
}

/**
 * Disegna il grafico giornaliero dell'arco per Sole o Luna.
 */
function drawDailyArcChart(config) {
    const { canvasId, title, markerTime, riseTime, setTime, lineCompletedColor, lineFutureColor, fillArea, markerColor, endPointColor } = config;
    const ctx = document.getElementById(canvasId);

    if (!ctx || typeof Chart === 'undefined') return;

    // Distrugge l'istanza precedente
    const chartInstance = canvasId === 'sunChartCanvas' ? sunChartInstance : moonChartInstance;
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const riseMinutes = timeToMinutes(riseTime);
    const setMinutes = timeToMinutes(setTime);
    const currentMinutes = timeToMinutes(markerTime);

    if (isNaN(riseMinutes) || isNaN(setMinutes)) {
         const chartDiv = ctx.parentElement;
         chartDiv.innerHTML = `<p style="color:${DARK_THEME_COLORS.fontColor}; text-align:center;">${title} non disponibile per oggi.</p>`;
         return;
    }

    // Calcolo tempo rimanente
    const riseRemaining = calculateTimeRemaining(riseMinutes, currentMinutes);
    const setRemaining = calculateTimeRemaining(setMinutes, currentMinutes);
    
    // --- Preparazione dei dati (invariata) ---
    const arcData = [];
    const markerData = [];
    const endPointsData = [];

    // Genera punti ogni 30 minuti (24h)
    for (let m = 0; m <= 1440; m += 30) {
        const yValue = calculateArcY(m, riseMinutes, setMinutes);
        arcData.push({ x: m, y: yValue });
    }
    
    // Divisione del percorso (invariata)
    let closestIndex = arcData.reduce((closest, point, index) => {
        if (Math.abs(point.x - currentMinutes) < Math.abs(arcData[closest].x - currentMinutes)) {
            return index;
        }
        return closest;
    }, 0);
    
    const currentPoint = { x: currentMinutes, y: calculateArcY(currentMinutes, riseMinutes, setMinutes) };
    
    const completedArcData = [...arcData.slice(0, closestIndex), currentPoint];
    const futureArcData = [currentPoint, ...arcData.slice(closestIndex + 1)];

    endPointsData.push(
        { x: riseMinutes, y: calculateArcY(riseMinutes, riseMinutes, setMinutes) }, 
        { x: setMinutes, y: calculateArcY(setMinutes, riseMinutes, setMinutes) }   
    );
    markerData.push(currentPoint);

    // --- Opzioni Grafico ---
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: `${title}`,
                color: DARK_THEME_COLORS.fontColor,
                font: { size: 16 }
            },
            legend: { display: false },
            tooltip: { enabled: false }, // Disabilita tooltip di default per pulizia

            // === RISTABILITO IL PLUGIN ANNOTATION CON NUOVE POSIZIONI ===
            annotation: {
                annotations: {
                    // Etichetta Alba/Sorgere
                    riseLabel: {
                        type: 'label',
                        xValue: riseMinutes,
                        yValue: -0.2, // Spostato sotto l'orizzonte (Y=0)
                        content: [`▲ ${riseTime}`, `(${riseRemaining})`],
                        color: DARK_THEME_COLORS.fontColor,
                        font: { size: 12, weight: 'bold' },
                        position: 'start',
                        xAdjust: 5,
                        yAdjust: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        borderColor: lineCompletedColor,
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    // Etichetta Tramonto/Tramontare
                    setLabel: {
                        type: 'label',
                        xValue: setMinutes,
                        yValue: -0.2, // Spostato sotto l'orizzonte (Y=0)
                        content: [`▼ ${setTime}`, `(${setRemaining})`],
                        color: DARK_THEME_COLORS.fontColor,
                        font: { size: 12, weight: 'bold' },
                        position: 'end',
                        xAdjust: -5,
                        yAdjust: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        borderColor: lineCompletedColor,
                        borderWidth: 1,
                        borderRadius: 4
                    }
                }
            }
        },
        scales: {
            x: {
                display: true, // Riattivato l'asse X per allineare le annotazioni
                type: 'linear',
                min: 0,
                max: 1440,
                title: { display: false },
                grid: { 
                    display: false, // Griglia X (linee verticali) visibile
                                    },
                ticks: { display: false } // Rimosse le etichette orarie
            },
            y: {
                display: true, 
                min: -1.2, 
                max: 1.2, 
                ticks: { display: false },// Rimosse le etichette orarie
                grid: {
                    // Linea dell'Orizzonte (asse X a Y=0) - Tratteggiata e bianca
                    color: (context) => context.tick.value === 0 ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
                    drawOnChartArea: true,
                    drawTicks: false,
                    // Usa la funzione per disegnare la linea solo su Y=0
                    lineWidth: (context) => context.tick.value === 0 ? 1.5 : 0, 
                    // Aggiunge la tratteggiatura solo alla linea dell'orizzonte (Y=0)
                    borderDash: (context) => context.tick.value === 0 ? [4, 4] : [], 
                },
            }
        },
    };

    // Crea l'istanza del grafico (dataset invariati)
    const newChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
            // 1. Linea dell'Arco (Percorso Completo e Colorato)
            {
                label: 'Percorso Completo',
                data: completedArcData,
                borderColor: lineCompletedColor,
                backgroundColor: fillArea,
                borderWidth: 5, 
                tension: 0.8, 
                fill: (context) => {
                    if (context.parsed && !isNaN(context.parsed.y)) {
                        return context.parsed.y > 0 ? 'origin' : false; 
                    }
                    return false;
                },
                pointRadius: 0,
                showLine: true,
                spanGaps: true,
                borderDash: []
            },
            // 2. Linea dell'Arco (Percorso Futuro e Tratteggiato)
            {
                label: 'Percorso Futuro',
                data: futureArcData,
                borderColor: lineFutureColor,
                backgroundColor: 'transparent',
                borderWidth: 2, 
                tension: 0.8,
                fill: false,
                pointRadius: 0,
                showLine: true,
                spanGaps: true,
                borderDash: [5, 5]
            },
            // 3. Pallini fissi Alba/Tramonto
            {
                label: 'Alba/Tramonto',
                data: endPointsData,
                backgroundColor: endPointColor,
                borderColor: endPointColor,
                pointRadius: 4, 
                pointStyle: 'circle', 
                showLine: false
            },
            // 4. Marcatore Posizione Attuale
            {
                label: 'Posizione Corrente',
                data: markerData,
                backgroundColor: markerColor,
                borderColor: markerColor, 
                pointRadius: 8,
                pointStyle: 'circle', 
                showLine: false
            }
            ]
        },
        options: options
    });

    if (canvasId === 'sunChartCanvas') {
        sunChartInstance = newChartInstance;
    } else {
        moonChartInstance = newChartInstance;
    }
}


/**
 * Funzione wrapper per il Sole
 */
function drawDailySunArcChart(riseTime, setTime) {
    const now = new Date();
    const markerTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    
    // Rimosso l'aggiornamento del div esterno
    
    drawDailyArcChart({
        canvasId: 'sunChartCanvas',
        title: `☀️ Percorso Solare Oggi`,
        markerTime: markerTime,
        riseTime: riseTime,
        setTime: setTime,
        lineCompletedColor: DARK_THEME_COLORS.sunLineCompletedColor,
        lineFutureColor: DARK_THEME_COLORS.sunLineFutureColor,
        fillArea: DARK_THEME_COLORS.sunFillColor,
        markerColor: DARK_THEME_COLORS.sunMarkerColor,
        endPointColor: DARK_THEME_COLORS.sunEndPointColor 
    });
}

/**
 * Funzione wrapper per la Luna
 */
function drawDailyMoonArcChart(riseTime, setTime, moonPhase) {
    const now = new Date();
    const markerTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    
    // Rimosso l'aggiornamento del div esterno
    
    drawDailyArcChart({
        canvasId: 'moonChartCanvas',
        title: `${getMoonEmoji(moonPhase)} Percorso Lunare Oggi`,
        markerTime: markerTime,
        riseTime: riseTime,
        setTime: setTime,
        lineCompletedColor: DARK_THEME_COLORS.moonLineCompletedColor,
        lineFutureColor: DARK_THEME_COLORS.moonLineFutureColor,
        fillArea: DARK_THEME_COLORS.moonFillColor,
        markerColor: DARK_THEME_COLORS.moonMarkerColor,
        endPointColor: DARK_THEME_COLORS.moonEndPointColor
    });
}


// --- FUNZIONE PRINCIPALE ESPORTATA (invariata) ---
export async function updateCelestialTable() {
    const tableBody = document.getElementById('tabellaCorpo');
    const titolo = document.getElementById('titoloTabella');
    if (!tableBody || !titolo) return;

    titolo.textContent = "Caricamento dati celesti...";

    const dati = await getCelestialData();
    
    if (dati.dayOfWeek && dati.dayOfWeek.length === 0) {
        titolo.textContent = "Dati Non Disponibili";
        if (sunChartInstance) sunChartInstance.destroy();
        if (moonChartInstance) moonChartInstance.destroy();
        return;
    }

    const giorniTotali = dati.dayOfWeek.length;
    const oggi = new Date(dati.validTimeLocal[0]).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const finePeriodo = new Date(dati.validTimeLocal[giorniTotali - 1]).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    titolo.textContent = `Previsione ${giorniTotali} giorni (dal ${oggi} al ${finePeriodo})`;


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
                moonPhase: faseLuna
            };
        }
    }

    drawDailySunArcChart(todayData.sunRise, todayData.sunSet);
    drawDailyMoonArcChart(todayData.moonRise, todayData.moonSet, todayData.moonPhase);
}

document.addEventListener('DOMContentLoaded', updateCelestialTable);
