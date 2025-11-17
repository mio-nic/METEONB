// city.js - Versione Modificata (Grafico Pesca)
// Implementa il filtro dinamico per le successive 25 ore e mantiene l'asse X in UTC.

// Importazioni da main.js
import { getWeatherData, searchCities } from '../main.js';
import { updateCelestialTable } from './rise.js';

// Variabile per mantenere l'intervallo di aggiornamento della linea oraria sul grafico (Highcharts)
let chartUpdateInterval = null; 
// Variabile per salvare la posizione di una città selezionata tramite suggerimenti
let selectedCityLocation = null;

// Variabile GLOBALE per l'istanza della mappa Leaflet
let mapInstance = null; // NUOVA VARIABILE PER LA MAPPA
let markerInstance = null; // NUOVA VARIABILE PER IL MARKER


// --- NUOVA FUNZIONE DI VALUTAZIONE PESCA ---

/**
 * Funzione di scoring per la favorevolezza della pesca (0-10) basata sui parametri meteo.
 * (Questa è una logica semplificata, adattabile con formule più complesse per precisione.)
 * * @param {number} temp - Temperatura in °C.
 * @param {number} windSpeed - Velocità del vento in km/h.
 * @param {number} pressure - Pressione a livello del mare in hPa.
 * @param {number} precipitation - Precipitazione in mm.
 * @returns {number} Punteggio di favorevolezza (0-10).
 */
const calculateFishingScore = (temp, windSpeed, pressure, precipitation) => {
    let score = 10; // Inizia da un livello molto positivo

    // 1. Pressione (fattore chiave: cambiamenti e livelli moderati)
    // Condizione ideale: 1010 hPa - 1020 hPa (pressione stabile e moderata)
    if (pressure < 1000 || pressure > 1030) {
        score -= 2; // Pressione molto bassa o molto alta è meno favorevole
    } else if (pressure < 1010 || pressure > 1020) {
        score -= 1; // Pressione leggermente fuori dall'ideale
    }

    // 2. Vento (ideale: leggero o assente)
    // 0-10 km/h: Ottimo
    // 10-20 km/h: Buono
    // > 20 km/h: Sfavorevole
    if (windSpeed > 20) {
        score -= 3;
    } else if (windSpeed > 5) {
        score -= 1.5;
    }

    // 3. Temperatura (ideale: mite, dipende dalla specie, qui usiamo un range generale)
    // 10°C - 25°C è un range generale buono per molte specie
    if (temp < 8 || temp > 28) {
        score -= 2.5;
    } else if (temp < 18 || temp > 22) {
        score -= 1;
    }

    // 4. Precipitazioni (ideale: assenti o pioggerella leggera non immediata)
    // > 0.5 mm/h: Sfavorevole
    if (precipitation > 0.5) {
        score -= 3;
    } else if (precipitation > 0) {
        score -= 1;
    }

    // Assicura che il punteggio sia tra 0 e 10
    score = Math.max(0, Math.min(10, score));

    // Arrotonda al decimale per un grafico più liscio ma comunque variabile
    return parseFloat(score.toFixed(1));
};

// --- 1. NUOVA FUNZIONE DI RENDERING GRAFICO PESCA (HIGHCHARTS) ---

/**
 * Funzione per disegnare il grafico delle condizioni di pesca orarie (Highcharts)
 * @param {object} hourlyData - Dati orari (time, temperature, windspeed, pressure, precipitation, ecc.)
 * @param {number} utcOffsetSeconds - Offset UTC in secondi per la correzione oraria locale.
 * @param {string} containerId - ID del container HTML dove disegnare il grafico.
 */
const drawFishingChartLocal = (hourlyData, utcOffsetSeconds, containerId) => {
    if (typeof Highcharts === 'undefined') {
        console.error("Highcharts non è definito. Assicurati che highcharts.js sia caricato nell'HTML.");
        return;
    }
    
    // 1. Definisce l'intervallo temporale per il filtro (25 ore).
    const nowUtc = Date.now();
    const lookaheadTimestamp = nowUtc + (25 * 3600 * 1000); 
    

    // 2. Filtra i dati e calcola il punteggio pesca per le prossime 25 ore.
    const dataForToday = hourlyData.time.map((timeStr, index) => {
        const utcDate = new Date(timeStr);
        const utcTimestamp = utcDate.getTime();
        
        // Filtra solo i dati che sono successivi o uguali all'ora attuale del dispositivo
        // e precedenti all'intervallo di previsione (25 ore).
        if (utcTimestamp >= nowUtc && utcTimestamp < lookaheadTimestamp) {
            // Estrai i parametri necessari per lo score
            const temp = hourlyData.temperature_2m[index];
            const windSpeed = hourlyData.wind_speed_10m[index]; // Assumendo esista wind_speed_10m
            const pressure = 1013; // Assumendo esista surface_pressure in hPa
            const precipitation = hourlyData.precipitation[index];

            // Calcola il punteggio
            const fishingScore = calculateFishingScore(temp, windSpeed, pressure, precipitation);

            return {
                timestamp: utcTimestamp, // Timestamp UTC originale (base del dato)
                fishingScore: fishingScore
            };
        }
        return null;
    }).filter(item => item !== null);

    // Estrai i dati finali per Highcharts
    const chartCategories = dataForToday.map(item => 
        // L'ASSE X RIMANE IN ORA UTC (BASE DEL DATO) come richiesto
        new Date(item.timestamp).getUTCHours().toString().padStart(2, '0')
    );
    const chartSeriesData = dataForToday.map(item => item.fishingScore);

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
        const hourToFindInUtcCategories = localDateForCity.getUTCHours().toString().padStart(2, '0');
        
        // 4. Trova l'indice della categoria UTC corrispondente
        const categoryIndex = chartCategories.indexOf(hourToFindInUtcCategories);
        

        if (categoryIndex !== -1) {
            const plotLineValue = categoryIndex + 0;

            chart.xAxis[0].removePlotLine('current-time-line');
            
            chart.xAxis[0].addPlotLine({
                value: plotLineValue,
                color: 'red',
                width: 2,
                dashStyle: 'Solid',
                id: 'current-time-line',
                zIndex: 5,
            });
        } else {
            chart.xAxis[0].removePlotLine('current-time-line');
        }
    };
    // --- FINE LOGICA DELLA LINEA DELL'ORA CORRENTE ---


    // 4. Crea il grafico Highcharts (Area Chart)
    const chart = Highcharts.chart(containerId, {
        chart: {
            // Cambiato da 'column' a 'area'
            type: 'area', 
            height: 200, 
            events: {
                load: function() {
                    updatePlotLine(this); 
                    
                    chartUpdateInterval = setInterval(() => {
                        updatePlotLine(this);
                    }, 60000); // 60 secondi
                }
            }
        },
        title: {
            // Nuovo titolo
            text: 'Condizioni Favorevoli per la Pesca Sportiva (0-10)',
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
            // Range da 0 (assente) a 10 (molto positiva)
            min: 0,
            max: 10, 
            title: {
                text: 'Favorevolezza'
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
            // Aggiornato il tooltip per il punteggio pesca
            headerFormat: '<span style="font-size:10px">{point.key}:00 UTC</span><br/>', 
            pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y:.1f} / 10</b>'
        },
        plotOptions: {
            area: {
                // Opzioni specifiche per Area Chart
                marker: {
                    enabled: false,
                    symbol: 'circle',
                    radius: 2,
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                },
                lineWidth: 2,
                // Colore per un tema "pesca/acqua"
                color: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, 'rgba(0, 122, 204, 0.8)'], // Blu più scuro in alto
                        [1, 'rgba(0, 122, 204, 0.1)']  // Trasparente in basso
                    ]
                }, 
                fillColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, 'rgba(0, 122, 204, 0.5)'],
                        [1, 'rgba(0, 122, 204, 0.05)']
                    ]
                },
                shadow: false
            }
        },
        series: [{
            name: 'Punteggio Pesca',
            data: chartSeriesData,
            // Rimosse le dataLabels perché un grafico ad area non le gestisce bene
        }]
    });
};

// --- 2. NUOVA FUNZIONE DI MAPPA LEAFLET/OPENSTREETMAP (INVARIANTI) ---

/**
 * Funzione per inizializzare o aggiornare la mappa OpenStreetMap/Leaflet.
 * @param {number} lat - Latitudine della città.
 * @param {number} lon - Longitudine della città.
 * @param {string} cityName - Nome della città per il popup del marker.
 */
const updateLeafletMap = (lat, lon, cityName) => {
    // ... codice updateLeafletMap invariato ...
    const mapContainerId = 'map'; 
    
    if (typeof L === 'undefined') {
        console.error("Leaflet non è definito. Assicurati che leaflet.js e leaflet.css siano caricati nell'HTML.");
        return;
    }

    const zoomLevel = 13;
    const coords = [lat, lon];
    
    if (mapInstance === null) {
        const mapContainer = document.getElementById(mapContainerId);
        if (mapContainer) mapContainer.innerHTML = ''; 

        mapInstance = L.map(mapContainerId).setView(coords, zoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 15,
            attribution: '© OpenStreetMap'
        }).addTo(mapInstance);
        
    } else {
        mapInstance.setView(coords, zoomLevel);
        mapInstance.invalidateSize(); 
    }

    if (markerInstance !== null) {
        markerInstance.remove(); 
    }

    markerInstance = L.marker(coords).addTo(mapInstance)
        .bindPopup(`<b>${cityName}</b>`)
        .openPopup();
};


// --- 3. FUNZIONI DI VISUALIZZAZIONE (INVARIANTI) ---

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
        
        listItem.addEventListener('click', () => {
            const cityInput = document.getElementById('cityInput'); 
            cityInput.value = city.fullDisplayName;
            selectedCityLocation = JSON.parse(listItem.dataset.location);
            citySuggestionsList.classList.add('hidden-list');
            window.initData(selectedCityLocation); 
        });

        citySuggestionsList.appendChild(listItem);
    });

    citySuggestionsList.classList.remove('hidden-list');
};


// --- 4. FUNZIONE PRINCIPALE: initData (MODIFICATA PER IL GRAFICO) ---

/**
 * Funzione principale per caricare i dati meteo, aggiornare l'UI e disegnare il grafico.
 * Resa globale (window.initData) per essere richiamata dagli eventi DOM.
 * @param {string|Object} location - Stringa di ricerca o oggetto location selezionato.
 */
window.initData = async (location = null) => {
    const locationName = document.getElementById('locationName');
    const lastUpdate = document.getElementById('lastUpdate');

    if (lastUpdate) lastUpdate.textContent = 'Aggiornamento in corso...';
    if (locationName) locationName.textContent = '';
    
    try {
        // 1. CHIAMATA DATI: Ottiene i dati (inclusi Latitudine e Longitudine) da main.js
        const allData = await getWeatherData(location);

        // --- 2. LOGICA AGGIORNAMENTO MAPPA OPENSTREETMAP ---
        const lat = allData.latitude;
        const lon = allData.longitude;
        const cityName = allData.cityName;

        if (lat && lon) {
            updateLeafletMap(lat, lon, cityName); 
        } else {
            console.error('Coordinate non disponibili per aggiornare la mappa.');
        }

        // ------------------------------------

        // --- 3. RENDERING GRAFICO HIGHCHARTS (CHIAMATA AGGIORNATA) ---
        const hourlyData = allData.hourly;
        const utcOffsetSeconds = allData.utc_offset_seconds;
        
        if (hourlyData && utcOffsetSeconds !== undefined) {
            // !!! CHIAMATA ALLA NUOVA FUNZIONE DEL GRAFICO PESCA !!!
            drawFishingChartLocal(hourlyData, utcOffsetSeconds, 'precipitationChartContainer'); 
            // 'precipitationChartContainer' è mantenuto come ID del container
        } 
        // ----------------------------------------

        // 4. AGGIORNAMENTO UI HEADER
        const updateTimestampUtc = allData.timestamp; 
        const dateForCityLocalTime = new Date(updateTimestampUtc + utcOffsetSeconds * 1000);
        
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


// --- 5. BLOCCO DOMContentLoaded (Gestione Eventi) (INVARIANTI) ---

document.addEventListener('DOMContentLoaded', () => {

    // --- Riferimenti HTML necessari ---
    const locationDisplay = document.getElementById('locationDisplay');
    const closeSearchButton = document.getElementById('closeSearchButton');
    const cityInput = document.getElementById('cityInput');
    const searchContainer = document.querySelector('.search-container');
    
    // Creazione dinamica della lista suggerimenti
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
