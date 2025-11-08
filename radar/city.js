// city.js - Versione minimale per la ricerca e l'aggiornamento dell'iframe (Radar/Windy)

// IMPORTAZIONI ESSENZIALI: Solo quelle necessarie per ottenere i dati e cercare la città.
// Tutte le importazioni non utilizzate (gradi.js, vita.js, ecc.) sono state rimosse.
import { getWeatherData, searchCities } from '../main.js';

let selectedCityLocation = null;

// --- FUNZIONE DI VISUALIZZAZIONE (Toggle) ---
// La rendiamo globale per essere usata da city.js
window.toggleSearchDisplay = (isSearching) => {
    const cityInput = document.getElementById('cityInput');
    const locationDisplay = document.getElementById('locationDisplay');
    const closeSearchButton = document.getElementById('closeSearchButton');
    const citySuggestionsList = document.getElementById('citySuggestionsList');

    // Uscita di sicurezza se gli elementi non esistono (ma dovrebbero esserci in pre.html)
    if (!cityInput || !locationDisplay) return;

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
        if (citySuggestionsList) {
            citySuggestionsList.classList.add('hidden-list');
            citySuggestionsList.innerHTML = '';
        }
    }
};

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

// --- FUNZIONE PRINCIPALE: initData (Ora si occupa SOLO del Radar) ---
window.initData = async (location = null) => {
    const locationName = document.getElementById('locationName');
    const lastUpdate = document.getElementById('lastUpdate');
    // Seleziona l'iframe del radar basandosi sulla struttura fornita
    const windyIframe = document.querySelector('.iframe-responsive-wrapper iframe');

    if (lastUpdate) lastUpdate.textContent = 'Aggiornamento in corso...';
    if (locationName) locationName.textContent = '';
    
    try {
        const cachedData = localStorage.getItem('weatherData');
        const cachedCityName = cachedData ? JSON.parse(cachedData).cityName : null;
        
        const locationToFetch = location || cachedCityName || null;
        
        // 1. CHIAMATA DATI: Ottiene i dati (inclusi Latitudine e Longitudine)
        const allData = await getWeatherData(locationToFetch);

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
            
            console.log(`Radar aggiornato a: ${cityName} (${lat}, ${lon})`);
        } else if (!windyIframe) {
            console.warn("Avviso: Elemento iframe di Windy non trovato. Il radar non è stato aggiornato.");
        }
        // ------------------------------------

        // 3. AGGIORNAMENTO UI HEADER
        const date = new Date(allData.timestamp);
        if (lastUpdate) lastUpdate.textContent = `${date.toLocaleDateString('it-IT')} alle ${date.toLocaleTimeString('it-IT')}.`;
        if (locationName) locationName.textContent = `${cityName}`;

        // Ritorna al display del messaggio dopo il successo
        window.toggleSearchDisplay(false); 

    } catch (err) {
        console.error('Errore:', err);
        if (lastUpdate) lastUpdate.textContent = err.message || 'Errore nel caricamento dei dati.';
        window.toggleSearchDisplay(false); 
    }
};


// --- INIZIO BLOCCO DOMContentLoaded (Gestione Eventi) ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Riferimenti HTML necessari ---
    const locationDisplay = document.getElementById('locationDisplay');
    const closeSearchButton = document.getElementById('closeSearchButton');
    const cityInput = document.getElementById('cityInput');
    const searchContainer = document.querySelector('.search-container');
    
    // Creazione dinamica della lista suggerimenti se non esiste (come protezione)
    let citySuggestionsList = document.getElementById('citySuggestionsList');
    if (searchContainer && !citySuggestionsList) {
        citySuggestionsList = document.createElement('ul');
        citySuggestionsList.id = 'citySuggestionsList';
        citySuggestionsList.className = 'hidden-list';
        searchContainer.appendChild(citySuggestionsList);
    }
    
    // Riferimento al valore di posizione selezionato (usato dagli eventi)
    let selectedCityLocation = null;

    // STATO INIZIALE
    if (cityInput) cityInput.classList.add('hidden');
    if (closeSearchButton) closeSearchButton.classList.add('hidden');

    // --- EVENTI ---

    // 1. Attivazione ricerca
    if (locationDisplay) {
        locationDisplay.addEventListener('click', () => {
            window.toggleSearchDisplay(true);
        });
    }

    // 2. Chiusura ricerca
    if (closeSearchButton) {
        closeSearchButton.addEventListener('click', () => {
            window.toggleSearchDisplay(false);
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
                    // Passa la stringa come ricerca
                    window.initData(cityValue);
                    if (citySuggestionsList) citySuggestionsList.classList.add('hidden-list');
                }
            }
        });
    }

    // 5. Gestione del click fuori dalla barra per nascondere la lista
    document.addEventListener('click', (e) => {
        if (searchContainer && citySuggestionsList && !searchContainer.contains(e.target)) {
            citySuggestionsList.classList.add('hidden-list');
        }
    });

    // Avvia il caricamento iniziale dei dati
    window.initData();

});
