// city.js - Versione Completa e Definitiva (Filtro 25 Ore + Asse X in UTC)
// Implementa il filtro dinamico per le successive 25 ore e mantiene l'asse X in UTC.

// Importazioni da main.js
import { getWeatherData, searchCities } from '../main.js';
import { updateCelestialTable } from './rise.js';

// Variabile per mantenere l'intervallo di aggiornamento della linea oraria sul grafico (Highcharts)
let chartUpdateInterval = null; 
// Variabile per salvare la posizione di una città selezionata tramite suggerimenti
let selectedCityLocation = null;


// --- 1. FUNZIONE DI RENDERING GRAFICO HIGHCHARTS (LOCALE) ---

/**
 * Funzione per disegnare il grafico delle precipitazioni orarie (Highcharts)
 * @param {object} hourlyData - Dati orari (time, precipitation, ecc.)
 * @param {number} utcOffsetSeconds - Offset UTC in secondi per la correzione oraria locale.
 * @param {string} containerId - ID del container HTML dove disegnare il grafico.
 */
const drawPrecipitationChartLocal = (hourlyData, utcOffsetSeconds, containerId) => {
    if (typeof Highcharts === 'undefined') {
        console.error("Highcharts non è definito. Assicurati che highcharts.js sia caricato nell'HTML.");
        return;
    }
    
    // 1. Definisce l'intervallo temporale per il filtro.
    
    // Otteniamo il timestamp UTC attuale (perché i dati grezzi sono in UTC)
    const nowUtc = Date.now();
    
    // Definiamo un intervallo di circa 25 ore (25 * 60 * 60 * 1000 millisecondi)
    const lookaheadTimestamp = nowUtc + (25 * 3600 * 1000); 
    

    // 2. Filtra i dati solo per le prossime 25 ore a partire dall'ora attuale.
    const dataForToday = hourlyData.time.map((timeStr, index) => {
        const utcDate = new Date(timeStr);
        const utcTimestamp = utcDate.getTime();
        
        // Filtra solo i dati che sono successivi o uguali all'ora attuale del dispositivo
        // e precedenti all'intervallo di previsione (25 ore).
        if (utcTimestamp >= nowUtc && utcTimestamp < lookaheadTimestamp) {
            return {
                timestamp: utcTimestamp, // Timestamp UTC originale (base del dato)
                precipitation: hourlyData.precipitation[index]
            };
        }
        return null;
    }).filter(item => item !== null);

    // Estrai i dati finali per Highcharts
    const chartCategories = dataForToday.map(item => 
        // L'ASSE X RIMANE IN ORA UTC (BASE DEL DATO) come richiesto
        new Date(item.timestamp).getUTCHours().toString().padStart(2, '0')
    );
    const chartSeriesData = dataForToday.map(item => item.precipitation);

    // 3. Configura Highcharts e applica il tema scuro
    if (Highcharts.themes && Highcharts.themes.darkUnica) {
        Highcharts.setOptions(Highcharts.themes.darkUnica);
    } 
    
    // Rimuovi l'intervallo precedente per evitare duplicati
    if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
        chartUpdateInterval = null;
    }

    // --- LOGICA DELLA LINEA DELL'ORA CORRENTE (ORA LOCALE CITTÀ SU ASSE UTC) ---
    const updatePlotLine = (chart) => {
        
        // 1. Calcola il timestamp locale della città (tempo UTC del dispositivo + offset)
        const nowUtcPlot = new Date(new Date().toUTCString());
        const nowLocalTimestamp = nowUtcPlot.getTime() + utcOffsetSeconds * 1000;
        
        // 2. Estrai l'oggetto Data locale della città
        const localDateForCity = new Date(nowLocalTimestamp);
        
        // 3. Calcola l'ora UTC che corrisponde a quell'istante corretto.
        // Questo valore (HH) sarà usato per trovare la categoria sull'asse X (che è in UTC)
        const hourToFindInUtcCategories = localDateForCity.getUTCHours().toString().padStart(2, '0');
        
        // 4. Trova l'indice della categoria UTC corrispondente
        const categoryIndex = chartCategories.indexOf(hourToFindInUtcCategories);
        

        if (categoryIndex !== -1) {
            // Posizione al centro della colonna
            const plotLineValue = categoryIndex + 0;

            // Rimuove la vecchia linea se esiste
            chart.xAxis[0].removePlotLine('current-time-line');
            
            // Aggiunge la nuova linea verticale (solida)
            chart.xAxis[0].addPlotLine({
                value: plotLineValue,
                color: 'red',
                width: 2,
                dashStyle: 'Solid',
                id: 'current-time-line',
                zIndex: 5,
            });
        } else {
            // Rimuovi se l'ora corrente (nel fuso orario della città) è fuori dai dati mostrati
            chart.xAxis[0].removePlotLine('current-time-line');
        }
    };
    // --- FINE LOGICA DELLA LINEA DELL'ORA CORRENTE ---


    // 4. Crea il grafico Highcharts
    const chart = Highcharts.chart(containerId, {
        chart: {
            type: 'column',
            height: 200, 
            events: {
                load: function() {
                    // Chiama la funzione di aggiornamento all'avvio
                    updatePlotLine(this); 
                    
                    // Imposta l'aggiornamento automatico (ogni 60 secondi)
                    chartUpdateInterval = setInterval(() => {
                        updatePlotLine(this);
                    }, 60000); // 60 secondi
                }
            }
        },
        title: {
            text: 'Precipitazioni Orarie Oggi (mm)',
            align: 'left'
        },
        xAxis: {
            categories: chartCategories,
            title: {
                text: ''
            },
            gridLineWidth: 0,
            tickInterval: chartCategories.length > 12 ? 2 : 1 
        },
        yAxis: {
            min: 0,
            title: {
                text: ''
            },
            labels: {
                formatter: function () {
                    return this.value + '';
                }
            },
            gridLineWidth: 1
        },
        legend: {
            enabled: false
        },
        tooltip: {
            // Usa {point.key}:00 per mostrare l'ora esatta del dato (che è UTC)
            headerFormat: '<span style="font-size:10px">{point.key}:00 UTC</span><br/>', 
            pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y:.2f} mm</b>'
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                color: '#007ACC' // Blu scuro
            }
        },
        series: [{
            name: 'Precipitazioni',
            data: chartSeriesData,
            dataLabels: {
                enabled: true,
                formatter: function() {
                    // Mostra l'etichetta solo se la precipitazione è > 0.1 mm
                    return this.y > 0.1 ? Highcharts.numberFormat(this.y, 1) : '';
                },
                style: {
                    fontSize: '9px',
                    textOutline: 'none',
                    color: 'white'
                }
            }
        }]
    });
};


// --- 2. FUNZIONI DI VISUALIZZAZIONE (INVARIATE) ---

/**
 * Controlla la visualizzazione della barra di ricerca e dell'input.
 * @param {boolean} isSearching - True per mostrare l'input di ricerca, False per mostrare il display.
 */
const toggleSearchDisplay = (isSearching) => {
    const cityInput = document.getElementById('cityInput');
    const locationDisplay = document.getElementById('locationDisplay');
    const closeSearchButton = document.getElementById('closeSearchButton');
    const citySuggestionsList = document.getElementById('citySuggestionsList');

    if (isSearching) {
        cityInput.classList.remove('hidden');
        locationDisplay.classList.add('hidden');
        if (closeSearchButton) closeSearchButton.classList.remove('hidden');
        cityInput.focus();
    } else {
        cityInput.classList.add('hidden');
        locationDisplay.classList.remove('hidden');
        if (closeSearchButton) closeSearchButton.classList.add('hidden');
        cityInput.value = '';
        selectedCityLocation = null;
        if (citySuggestionsList) {
            citySuggestionsList.classList.add('hidden-list');
            citySuggestionsList.innerHTML = '';
        }
    }
};

/**
 * Renderizza la lista di suggerimenti della città.
 * @param {Array<Object>} cities - Array di oggetti città.
 */
const renderSuggestions = (cities) => {
    const citySuggestionsList = document.getElementById('citySuggestionsList');
    if (!citySuggestionsList) return;

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
            const cityInput = document.getElementById('cityInput'); 
            cityInput.value = city.fullDisplayName;
            selectedCityLocation = JSON.parse(listItem.dataset.location);
            citySuggestionsList.classList.add('hidden-list');
            // Avvia la ricerca con l'oggetto location completo
            window.initData(selectedCityLocation); 
        });

        citySuggestionsList.appendChild(listItem);
    });

    citySuggestionsList.classList.remove('hidden-list');
};


// --- 3. FUNZIONE PRINCIPALE: initData (INVARIATA) ---

/**
 * Funzione principale per caricare i dati meteo, aggiornare l'UI e disegnare il grafico.
 * Resa globale (window.initData) per essere richiamata dagli eventi DOM.
 * @param {string|Object} location - Stringa di ricerca o oggetto location selezionato.
 */
window.initData = async (location = null) => {
    const locationName = document.getElementById('locationName');
    const lastUpdate = document.getElementById('lastUpdate');
    // Seleziona l'iframe del radar basandosi sulla struttura fornita
    const windyIframe = document.querySelector('.iframe-responsive-wrapper iframe');

    if (lastUpdate) lastUpdate.textContent = 'Aggiornamento in corso...';
    if (locationName) locationName.textContent = '';
    
    try {
        // 1. CHIAMATA DATI: Ottiene i dati (inclusi Latitudine e Longitudine) da main.js
        const allData = await getWeatherData(location);

        // --- 2. LOGICA AGGIORNAMENTO RADAR ---
        const lat = allData.latitude;
        const lon = allData.longitude;
        const cityName = allData.cityName;

        if (windyIframe && lat && lon) {
            let currentSrc = windyIframe.src;
            
            // Logica per sostituire i parametri lat e lon nel SRC esistente
            let newSrc = currentSrc.replace(/&lat=[\d.-]+/g, `&lat=${lat}`);
            newSrc = newSrc.replace(/&lon=[\d.-]+/g, `&lon=${lon}`);
            
            windyIframe.src = newSrc;
        } 
        // ------------------------------------

        // --- 3. RENDERING GRAFICO HIGHCHARTS (CHIAMATA LOCALE) ---
        const hourlyData = allData.hourly;
        const utcOffsetSeconds = allData.utc_offset_seconds;
        
        if (hourlyData && utcOffsetSeconds !== undefined) {
            // Usa la funzione LOCALE con la logica ora locale corretta
            drawPrecipitationChartLocal(hourlyData, utcOffsetSeconds, 'precipitationChartContainer');
        } 
        // ----------------------------------------

        // 4. AGGIORNAMENTO UI HEADER
        // Mantiene la visualizzazione dell'ora di aggiornamento nel fuso orario della città.
        const updateTimestampUtc = allData.timestamp; 
        const dateForCityLocalTime = new Date(updateTimestampUtc + utcOffsetSeconds * 1000); // Tempo locale corretto
        
        if (lastUpdate) lastUpdate.textContent = `Aggiornato il ${dateForCityLocalTime.toLocaleDateString('it-IT')} alle ${dateForCityLocalTime.toLocaleTimeString('it-IT')}.`;
        if (locationName) locationName.textContent = `${cityName}`;
        updateCelestialTable();

        // 5. Ritorna al display del messaggio dopo il successo
        toggleSearchDisplay(false); 

    } catch (err) {
        console.error('Errore durante initData:', err);
        if (lastUpdate) lastUpdate.textContent = err.message || 'Errore nel caricamento dei dati.';
        toggleSearchDisplay(false); 
    }
};


// --- 4. BLOCCO DOMContentLoaded (Gestione Eventi) (INVARIATO) ---

document.addEventListener('DOMContentLoaded', () => {

    // --- Riferimenti HTML necessari ---
    const locationDisplay = document.getElementById('locationDisplay');
    const closeSearchButton = document.getElementById('closeSearchButton');
    const cityInput = document.getElementById('cityInput');
    const searchContainer = document.querySelector('.search-container');
    
    // Creazione dinamica della lista suggerimenti (essenziale per la ricerca)
    let citySuggestionsList = document.getElementById('citySuggestionsList');
    if (searchContainer && !citySuggestionsList) {
        citySuggestionsList = document.createElement('ul');
        citySuggestionsList.id = 'citySuggestionsList';
        citySuggestionsList.className = 'hidden-list';
        searchContainer.appendChild(citySuggestionsList);
    }
    
    // STATO INIZIALE
    if (cityInput) cityInput.classList.add('hidden');
    if (closeSearchButton) closeSearchButton.classList.add('hidden');

    // --- EVENTI ---

    // 1. Attivazione ricerca
    if (locationDisplay) {
        locationDisplay.addEventListener('click', () => {
            toggleSearchDisplay(true);
        });
    }

    // 2. Chiusura ricerca
    if (closeSearchButton) {
        closeSearchButton.addEventListener('click', () => {
            toggleSearchDisplay(false);
        });
    }

    // 3. Evento input (per suggerimenti)
    if (cityInput) {
        cityInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            selectedCityLocation = null;

            if (query.length < 3) {
                if (citySuggestionsList) citySuggestionsList.classList.add('hidden-list');
                return;
            }

            const cities = await searchCities(query);
            renderSuggestions(cities);
        });

        // 4. Evento keydown (tasto Invio - AVVIA LA RICERCA)
        cityInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const cityValue = cityInput.value.trim();
                
                if (cityValue) {
                    // Passa la stringa se non è stato selezionato un suggerimento completo
                    window.initData(selectedCityLocation || cityValue);
                    if (citySuggestionsList) citySuggestionsList.classList.add('hidden-list');
                }
            }
        });
    }

    // 5. Gestione del click fuori dalla barra per nascondere la lista
    document.addEventListener('click', (e) => {
        if (searchContainer && citySuggestionsList && !searchContainer.contains(e.target) && !e.target.closest('.suggestion-item')) {
            citySuggestionsList.classList.add('hidden-list');
        }
    });

    // Avvia il caricamento iniziale dei dati
    window.initData();

});