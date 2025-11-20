// tableh.js
// Aggiornato per rimuovere il riferimento e l'uso di hourlyDateTitle e inserire le descrizioni COMPLETE
import { getWeatherEmoji, precipitationEmojiMap, formatDate, formatTime, getWeatherDescription, getPrecipitationDescription, getWindDescription } from './main.js';

// --- Funzione di Allerta (MODIFICATA - RIMOSSO WMO) ---
const getWeatherAlertStatus = (weatherCode, temp, precipitation, windSpeed, isDaily = false) => {
    // I codici WMO sono stati rimossi dall'API. La logica si basa solo su Temp/Vento/Precipitazioni.
    
    let alertLevel = 0;

    // Livello 3 (DISCRETO/CRITICO) - Vento estremo o precipitazioni altissime (sostituisce temporale)
    if (windSpeed >= 50 || precipitation >= (isDaily ? 50 : 15)) {
        alertLevel = 3; 
    }
    
    // Livello 2 (ALLERTA) - Vento forte, Pioggia forte o temperature sotto zero
    if (alertLevel < 3) {
        if (windSpeed >= 35 || precipitation >= (isDaily ? 35 : 10) || temp <= -1) {
             alertLevel = 2; 
        }
    }

    // Livello 1 (BUONO) - Vento moderato, Pioggia moderata o temperature basse
    if (alertLevel < 2) {
        if (windSpeed >= 20 || precipitation >= (isDaily ? 20 : 5) || temp < 5) {
            alertLevel = 1;
        }
    }

    switch (alertLevel) {
        case 3: return 'dot-discreto'; 
        case 2: return 'dot-allerta'; 
        case 1: return 'dot-buono'; 
        default: return 'dot-ottimo';
    }
};
// --- Fine Funzione di Allerta ---


document.addEventListener('DOMContentLoaded', () => {
    // --- Riferimenti HTML ---
    const locationName = document.getElementById('locationName');
    const lastUpdate = document.getElementById('lastUpdate');
    const hourlyTableBody = document.querySelector('#hourlyTable tbody');
    // RIMOZIONE: hourlyDateTitle non è più necessario
    const hourlyTitle = document.getElementById('hourlyTitle'); 
    const backButton = document.getElementById('backButton');
    const prevDayButton = document.getElementById('prevDayButton');
    const nextDayButton = document.getElementById('nextDayButton');
    const toggleHourlyButton = document.getElementById('toggleHourlyButton');

    let allData = {};
    let currentDayIndex = 0; 
    let isHourlyView = false; 

    // Funzione per ottenere il dayIndex dall'URL
    const getDayIndexFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const index = urlParams.get('dayIndex');
        return index ? parseInt(index) : 0;
    };

    const renderHourlyTable = (hourlyData, selectedDateIndex) => {
        if (!hourlyData || !hourlyData.time || !allData.daily || !allData.daily.time) {
            hourlyTableBody.innerHTML = '<tr><td colspan="5">Errore: Dati meteo mancanti. Torna alla HOME per ricaricare.</td></tr>';
            return;
        }

        hourlyTableBody.innerHTML = '';
        
        if (selectedDateIndex < 0 || selectedDateIndex >= allData.daily.time.length) {
             selectedDateIndex = 0; 
        }

        const selectedDate = allData.daily.time[selectedDateIndex];
        currentDayIndex = selectedDateIndex;
        
        // Formatta la data
        const formattedFullDate = new Date(selectedDate).toLocaleDateString('it-IT', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });

        // Aggiorna solo il titolo principale
        if (hourlyTitle) {
            hourlyTitle.innerHTML = formattedFullDate.toUpperCase();
        }
        
        prevDayButton.disabled = selectedDateIndex === 0;
        nextDayButton.disabled = selectedDateIndex >= allData.daily.time.length - 1;

        // Logica per filtrare i dati orari
        const dayStart = new Date(selectedDate).setHours(0, 0, 0, 0);
        const dayEnd = new Date(selectedDate).setHours(23, 59, 59, 999);
        const startIndex = hourlyData.time.findIndex(time => new Date(time).getTime() >= dayStart);
        // Se l'indice di fine non è trovato (forecast finisce prima), usa la lunghezza totale
        const endIndex = hourlyData.time.findIndex(time => new Date(time).getTime() > dayEnd);
        
        // Gestione caso in cui non ci sono ore per il giorno selezionato (non dovrebbe accadere se il forecast è 7 giorni)
        if (startIndex === -1 || startIndex >= hourlyData.time.length) {
            hourlyTableBody.innerHTML = '<tr><td colspan="5">Nessun dato orario disponibile per questo giorno.</td></tr>';
            return;
        }
        
        const hourlySlice = hourlyData.time.slice(startIndex, endIndex !== -1 ? endIndex : undefined);
        
        const step = isHourlyView ? 1 : 3;

        for (let i = 0; i < hourlySlice.length; i += step) {
            const hour = hourlySlice[i];
            const absoluteIndex = startIndex + i;
            
            // hourlyWeatherCode è ora null, ma serve per le descrizioni (se non modificate)
            const hourlyWeatherCode = null; 
            
            // Estrazione dati orari tramite absoluteIndex
            const temp = Math.round(hourlyData.temperature_2m[absoluteIndex]);
            const probPrecipitation = hourlyData.precipitation_probability[absoluteIndex];
            const wind = Math.round(hourlyData.wind_speed_10m[absoluteIndex]);

            // Calcolo della precipitazione aggregata (per step di 3 ore)
            let precipitationSum = 0;
            for (let j = 0; j < step && (absoluteIndex + j) < hourlyData.precipitation.length; j++) {
                precipitationSum += hourlyData.precipitation[absoluteIndex + j];
            }
             
            // --- INIZIO MODIFICA: Gestione e Conversione Unità ---
            // Qui usiamo precipitationSum per l'inizializzazione
            let displayPrecipitation = (Math.round(precipitationSum * 10) / 10).toFixed(1); 
            let precipitationUnit = ' mm';

            // Condizione: temperatura < 1°C E precipitazione rilevata. (CORRETTO)
            if (temp < 1 && precipitationSum > 0.1) {
                // Conversione da mm a cm (1 mm = 0.1 cm)
                const precipInCm = precipitationSum / 1; 
                displayPrecipitation = precipInCm.toFixed(1); 
                precipitationUnit = ' cm';
            }
            // --- FINE MODIFICA ---
            
            const precipitationEmoji = precipitationEmojiMap(displayPrecipitation);

            // --- CHIAMATA ALLE FUNZIONI DI DESCRIZIONE (uso di hourlyWeatherCode=null per getWeatherDescription) ---
            const weatherDescription = getWeatherDescription(hourlyWeatherCode); 
            const precipitationDescription = getPrecipitationDescription(displayPrecipitation); 
            const windDescription = getWindDescription(wind);
            // --------------------------------------------------------

            const startTime = formatTime(hour);
            const timeDisplay = `${startTime}`; 

            // statusClass usa la funzione modificata senza WMO
            const statusClass = getWeatherAlertStatus(hourlyWeatherCode, temp, precipitationSum, wind, false);
            
            // CORREZIONE CRITICA: Chiama getWeatherEmoji passando i dati orari e l'indice assoluto
            const weatherEmoji = getWeatherEmoji(hourlyData, absoluteIndex);

            const row = document.createElement('tr');
            
            // --- MODIFICA RIGA HTML CON DESCRIZIONI COMPLETE ---
            row.innerHTML = `<td><span class="status-dot ${statusClass}"></span><br>${timeDisplay}</td>
                            <td><span style="font-size: 2.0em !important;">${weatherEmoji}</span><br><span style="font-size: 1.0em !important;"></td>
                            <td>${temp}°C</td>
                            <td>${precipitationEmoji} ${displayPrecipitation} ${precipitationUnit} ${probPrecipitation}%<br>${precipitationDescription}</td>
                            <td>${wind} km/h<br>${windDescription}</td>`;
            // ---------------------------------------------------------------------

            hourlyTableBody.appendChild(row);
        }
    };


    const initData = () => {
        let initialDayIndex = getDayIndexFromUrl();
        
        const cachedData = localStorage.getItem('allWeatherData'); 
        
        if (!cachedData) {
            locationName.textContent = 'ERRORE CARICAMENTO';
            lastUpdate.textContent = 'Dati non trovati. Torna alla HOME per ricaricare.';
            hourlyTableBody.innerHTML = '<tr><td colspan="5">I dati non sono stati caricati. Torna alla HOME.</td></tr>';
            return;
        }

        try {
            allData = JSON.parse(cachedData);
            
            locationName.textContent = `${allData.cityName}`;
            const date = new Date(allData.timestamp);
            lastUpdate.textContent = `${date.toLocaleDateString('it-IT')} ${date.toLocaleTimeString('it-IT')}.`;
            
            renderHourlyTable(allData.hourly, initialDayIndex);

        } catch (err) {
            console.error('Errore durante il parsing o il rendering:', err);
            lastUpdate.textContent = 'Errore di lettura dati.';
            hourlyTableBody.innerHTML = '<tr><td colspan="5">Errore critico di lettura dati. Torna alla HOME.</td></tr>';
        }
    };


    // --- Eventi (rimangono invariati) ---
    backButton.addEventListener('click', () => {
        window.location.href = './index.html'; 
    });

    prevDayButton.addEventListener('click', () => { 
        if(currentDayIndex > 0) {
            window.history.pushState(null, '', `./tableh.html?dayIndex=${currentDayIndex - 1}`);
            renderHourlyTable(allData.hourly, currentDayIndex - 1); 
        }
    });

    nextDayButton.addEventListener('click', () => { 
        if(currentDayIndex < allData.daily.time.length - 1) {
            window.history.pushState(null, '', `./tableh.html?dayIndex=${currentDayIndex + 1}`);
            renderHourlyTable(allData.hourly, currentDayIndex + 1); 
        }
    });

    toggleHourlyButton.addEventListener('click', () => {
        isHourlyView = !isHourlyView;
        toggleHourlyButton.innerHTML = `<i class="fas fa-clock"></i><span>${isHourlyView?'Mostra 1 ora':'Mostra 3 ore'}</span>`;
        renderHourlyTable(allData.hourly, currentDayIndex); 
    });

    initData();

});


