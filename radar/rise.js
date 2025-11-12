// rise.js - Versione 3.0: Modulo e Funzione di Aggiornamento Esportata

// --- CONFIGURAZIONE E CONSTANTI ---
const WEATHER_API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";
const PREFERRED_COORDS_KEY = 'preferredCityCoords';
const DEFAULT_LATITUDE = 45.40; 
const DEFAULT_LONGITUDE = 11.87; 

// Elemento per la nota (ora aggiorniamo anche questo)
const notaElement = document.querySelector('.nota');


// --- FUNZIONI DI UTILITÀ ---

function getCoordinates() {
    const preferredCoordsStr = localStorage.getItem(PREFERRED_COORDS_KEY);
    
    if (preferredCoordsStr) {
        try {
            const preferredCoords = JSON.parse(preferredCoordsStr);
            if (preferredCoords.latitude && preferredCoords.longitude) {
                console.log(`Coordinate caricate da localStorage: ${preferredCoords.latitude}, ${preferredCoords.longitude}`);
                return { lat: preferredCoords.latitude, lon: preferredCoords.longitude };
            }
        } catch (e) {
            console.error("Errore parsing coordinate salvate:", e);
        }
    }
    
    console.log(`Utilizzo coordinate di default: ${DEFAULT_LATITUDE}, ${DEFAULT_LONGITUDE}`);
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

async function getCelestialData() {
    const { lat, lon } = getCoordinates();
    const geocode = `${lat.toFixed(4)},${lon.toFixed(4)}`; 
    
    // API fornita dall'utente
    const apiUrl = `https://api.weather.com/v3/wx/forecast/daily/7day?geocode=${geocode}&format=json&units=m&language=it-IT&apiKey=${WEATHER_API_KEY}`;

    // Aggiorna la nota con le coordinate attuali
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


// --- FUNZIONE PRINCIPALE ESPORTATA ---

/**
 * Funzione principale che aggiorna la tabella degli orari celesti.
 * Questa funzione sarà chiamata anche dal main.js quando la città cambia.
 */
export async function updateCelestialTable() {
    const tableBody = document.getElementById('tabellaCorpo');
    const titolo = document.getElementById('titoloTabella');
    if (!tableBody || !titolo) return;

    titolo.textContent = "Caricamento dati celesti...";
    
    const dati = await getCelestialData();

    if (dati.dayOfWeek && dati.dayOfWeek.length === 0) {
        titolo.textContent = "Dati Non Disponibili";
        return;
    }

    // Imposta il titolo
    const oggi = new Date(dati.validTimeLocal[0]).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const finePeriodo = new Date(dati.validTimeLocal[dati.dayOfWeek.length - 1]).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    titolo.textContent = `Previsione 7 giorni (dal ${oggi} al ${finePeriodo})`;


    // Genera le righe della tabella
    tableBody.innerHTML = ''; 
    const daysCount = dati.dayOfWeek.length;

    for (let i = 0; i < daysCount; i++) {
        const giornoSettimana = dati.dayOfWeek[i].charAt(0).toUpperCase() + dati.dayOfWeek[i].slice(1);
        const dataCompleta = new Date(dati.validTimeLocal[i]);
        const giornoMese = dataCompleta.getDate().toString().padStart(2, '0');
        
        const albaSole = formatTime(dati.sunriseTimeLocal[i]);
        const tramontoSole = formatTime(dati.sunsetTimeLocal[i]);
        const albaLuna = formatTime(dati.moonriseTimeLocal[i]);
        const tramontoLuna = formatTime(dati.moonsetTimeLocal[i]);
        
        const faseLuna = dati.moonPhase[i] || 'N/D';
        const emojiFase = getMoonEmoji(faseLuna);

        const riga = document.createElement('tr');
        riga.innerHTML = `
            <td>${giornoMese} (${giornoSettimana.substring(0, 3)})</td>
            <td class="sole">${albaSole}</td>
            <td class="sole">${tramontoSole}</td>
            <td class="luna">${albaLuna}</td>
            <td class="luna">${tramontoLuna}</td>
            <td class="fase">${emojiFase} ${faseLuna}</td>
        `;
        tableBody.appendChild(riga);
    }
}

// Avvia l'aggiornamento della tabella al caricamento del DOM
document.addEventListener('DOMContentLoaded', updateCelestialTable);
