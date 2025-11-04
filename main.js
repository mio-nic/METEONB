// main.js - Versione con persistenza robusta della città preferita

// Costanti e Mappe
export const geocodingApiUrl = (city, count = 1) => `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=${count}&language=it&format=json`;
const API_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const localStorageKey = 'weatherData';
const lastUpdateKey = 'lastUpdateTimestamp';
const PREFERRED_CITY_KEY = 'preferredCityName'; // <--- CHIAVE PER LA CITTÀ PREFERITA PERSISTENTE
const PREFERRED_COORDS_KEY = 'preferredCityCoords'; // <--- CHIAVE PER LE COORDINATE PREFERITE PERSISTENTI (utile per ricarica robusta)
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 ore
const DEFAULT_LATITUDE = 45.40;
const DEFAULT_LONGITUDE = 11.87;
const DEFAULT_CITY_NAME = 'Padova, Italia (Veneto)';

// --- NUOVE MAPPE CON ICONE METEO IN HTML ---
const ICON_BASE_URL = "https://meteofree.altervista.org/METEONB/ICONE/";

/**
 * Funzione di utilità per creare il tag <img> per l'icona.
 * @param {number} iconNumber - Numero dell'icona (da 1 a 10).
 * @param {string} altText - Testo alternativo per l'immagine.
 * @returns {string} Tag HTML <img>.
 */
const createIconTag = (iconNumber, altText = 'Icona Meteo') => {
    // Dimensioni aumentate a 40x35px
    return `<img src="${ICON_BASE_URL}${iconNumber}.png" alt="${altText}" style="width: 36px; height: 36px; vertical-align: middle;" />`;
};

// Mappa di riferimento per le descrizioni (NON USATA PER LA LOGICA ICONE)
const weatherCodeToIconNumberMap = {
    0: 1, 1: 2, 2: 3, 3: 4, 45: 4, 48: 4, 51: 5, 53: 5, 55: 5, 56: 5, 57: 5, 
    61: 5, 63: 6, 80: 6, 81: 6, 65: 7, 82: 7, 95: 8, 96: 8, 99: 8, 
    66: 7, 67: 7, 71: 7, 73: 7, 75: 7, 85: 7, 86: 7, 77: 7,
};

// --- NUOVA LOGICA DI ASSEGNAZIONE ICONA (Sostituisce la mappatura WMO) ---

/**
 * Assegna il numero di icona (da 1 a 10) basandosi sui dati grezzi, ignorando il weather_code dell'API.
 * @param {number} precipitation - Precipitazione oraria in mm (o media giornaliera).
 * @param {number} cloudCover - Percentuale di copertura nuvolosa (oraria o media giornaliera).
 * @param {number} windSpeed - Velocità del vento in km/h (oraria o massima giornaliera).
 * @param {number} precipProb - Probabilità di precipitazione in % (oraria o max giornaliera).
 * @returns {number} Numero dell'icona da 1 a 10.
 */
const getIconNumberFromData = (precipitation, cloudCover, windSpeed, precipProb, temperature_2m) => {
    // 0. NEVE (Icona 13) - NEVE
    if (precipitation >= 0.1 && temperature_2m < 1) {
        return 13; 
    }
    
    // 1. TEMPORALE (Icona 8) - Alta probabilità di pioggia + vento forte
    if (precipProb >= 70 && windSpeed >= 30) {
        return 8; 
    }
    
    // 2. PIOGGIA FORTE (Icona 7) - Precipitazioni >= 5 mm
    if (precipitation >= 5.0) {
        return 7;
    }

    // 3. PIOGGIA MODERATA (Icona 6) - Precipitazioni tra 0.5 mm e 5 mm
    if (precipitation >= 0.5) {
        return 6;
    }

    // 4. PIOGGIA LEGGERA (Icona 5) - Precipitazioni tra 0.1 mm e 0.5 mm
    if (precipitation >= 0.1) {
        return 5;
    }
    
    // Se non c'è pioggia significativa (preciptation < 0.1 mm), controlla le nuvole
    
    // 5. COPERTO (Icona 4) - Copertura nuvolosa alta
    if (cloudCover >= 80) {
        return 4;
    }
    
    // 6. NUVOLOSO (Icona 3) - Copertura nuvolosa media
    if (cloudCover >= 50) {
        return 3;
    }
    
    // 7. PREVALENTEMENTE SERENO (Icona 2) - Copertura nuvolosa bassa
    if (cloudCover >= 20) {
        return 2;
    }

    // 8. SERENO (Icona 1) - Copertura nuvolosa minima
    return 1;
};

// Funzione principale per ottenere il tag <img> dell'icona del tempo in base all'ora (per tabelle orarie)
export const getWeatherEmoji = (data, index) => {
    // Assicurati che i dati necessari per la nuova logica siano estratti:
    const { precipitation, cloud_cover, wind_speed_10m, precipitation_probability, temperature_2m, time } = data;
    
    // Calcola il numero base dell'icona usando la nuova logica
    const iconNumber = getIconNumberFromData(
        precipitation[index], 
        cloud_cover[index], 
        wind_speed_10m[index], 
        precipitation_probability[index],
        temperature_2m[index]
    );
    
    const date = new Date(time[index]);
    const hour = date.getHours();
    
    // Controlla se l'ora è NOTTURNA (tra le 18:00 inclusa e le 6:00 esclusa)
    const isNight = hour >= 18 || hour < 6;
    
    // Gestione Notte: Solo se l'icona base è Sereno (1), Prev. Sereno (2) o Nuvoloso (3)
    if (isNight && iconNumber <= 3) {
        // Notte: Usa sempre l'icona 9 (Luna)
        return createIconTag(9, 'Meteo Notturno');
    }
    
    // Per tutti gli altri codici (pioggia, neve, temporale, o giorno), usa l'icona determinata
    return createIconTag(iconNumber, 'Meteo Diurno/Precipitazioni');
};

// Funzione per ottenere l'icona del tempo solo diurna (per la tabella giornaliera)
export const getDailyWeatherEmoji = (data, index) => {
    // Assicurati che i dati necessari per la nuova logica siano estratti:
    const { precipitation_sum, cloud_cover_mean, wind_speed_10m_max, temperature_2m_min, precipitation_probability_max } = data;

    // Poiché è l'icona giornaliera, non c'è distinzione giorno/notte (si usa sempre l'icona diurna)
    const iconNumber = getIconNumberFromData(
        precipitation_sum[index], // Usa la somma delle precipitazioni
        cloud_cover_mean[index], 
        wind_speed_10m_max[index],
        precipitation_probability_max[index],
        temperature_2m_min[index]
    );
    
    return createIconTag(iconNumber, 'Meteo Giornaliero');
};

export const precipitationEmojiMap = (mm) => {
    if (mm < 0.1) return '⚫';
    if (mm < 2) return '🔵';
    if (mm < 10) return '🟢';
    if (mm < 20) return '🟡';
    if (mm < 50) return '🔴';
    return '🟣';
};


// --- FUNZIONI DI DESCRIZIONE ---

/**
 * Ritorna una descrizione testuale del meteo (basata su WMO).
 */
export const getWeatherDescription = (weatherCode) => {
    switch (weatherCode) {
        case 1: return "sereno";
        case 2: return "nuvoloso";
        case 3: return "nuvoloso";
        case 4: return "coperto";
        case 5: return "pioggia"; 
        case 6:  return "pioggia";
        case 7: return "pioggia";
        case 8: return "temporale";
        case 9: return "sereno";
        default: return "variabile";
    }
};

/**
 * Ritorna una descrizione testuale della quantità di precipitazioni (mm).
 */
export const getPrecipitationDescription = (sumPrecipitation) => {
    if (sumPrecipitation < 0.1) return "assenti";
    if (sumPrecipitation < 10) return "leggere";
    if (sumPrecipitation < 20) return "medie";
    if (sumPrecipitation < 50) return "forti";
    return "estreme";
};

/**
 * Ritorna una descrizione testuale della velocità del vento (km/h).
 */
export const getWindDescription = (windSpeed) => {
    if (windSpeed < 3) return "assente";
    if (windSpeed <= 8) return "debole";
    if (windSpeed <= 20) return "moderato";
    if (windSpeed <= 40) return "teso";
    return "forte";
};

// MODIFICATO: Funzione per cercare più località, includendo admin1 (provincia/stato).
/**
 * Funzione per cercare e ritornare un array di possibili località.
 * @param {string} city - Nome della città da cercare.
 * @returns {Array<{latitude: number, longitude: number, name: string, fullDisplayName: string}>} Array di risultati.
 */
export const searchCities = async (city) => {
    if (!city || city.length < 3) return [];
    try {
        const response = await fetch(geocodingApiUrl(city, 5));
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results.map(result => {
                // Aggiungiamo la provincia/stato (admin1) se esiste
                const admin1Str = result.admin1 ? ` (${result.admin1})` : '';
                // fullDisplayName è la stringa da mostrare nel menu (es. "Padova, Italia (Veneto)")
                const fullDisplayName = `${result.name}, ${result.country}${admin1Str}`;
                return {
                    latitude: result.latitude,
                    longitude: result.longitude,
                    name: result.name, // Nome città
                    country: result.country, // Nazione
                    admin1: result.admin1 || '', // Provincia/Stato
                    fullDisplayName: fullDisplayName // Nome completo per l'utente
                };
            });
        }
        return [];
    } catch (error) {
        console.error('Errore ricerca geocodifica multipla:', error);
        return [];
    }
};

// Funzione di fallback per la geocodifica di una singola stringa (usata solo se l'utente digita e non seleziona)
export const getCoordinatesFromCity = async (city) => {
    try {
        const response = await fetch(geocodingApiUrl(city));
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name, country, admin1 } = data.results[0];
            const adminStr = admin1 ? ` (${admin1})` : '';
            return { latitude, longitude, name: `${name}, ${country}${adminStr}` };
        }
        throw new Error('Città non trovata.');
    } catch (error) {
        console.error(`ATTENZIONE: getCoordinatesFromCity non è riuscita per la stringa data: "${city}".`);
        throw new Error('Geocodifica fallita.');
    }
};

// MODIFICATO: fetchAndStoreWeatherData ora salva anche le coordinate come preferenza robusta.
export const fetchAndStoreWeatherData = async (latitude, longitude, cityName) => {
    // URL API UNIFICATO
    const unifiedApiUrl = `${API_BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
        `&hourly=temperature_2m,precipitation,wind_speed_10m,precipitation_probability,cloud_cover` + 
        `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,cloud_cover_mean,relative_humidity_2m_mean,winddirection_10m_dominant,surface_pressure_mean` +
        `&forecast_days=7&timezone=Europe%2FRome&models=best_match`;

    try {
        const response = await fetch(unifiedApiUrl);
        const unifiedApiData = await response.json();

        // Estrai i dati orari e giornalieri
        const { hourly, daily } = unifiedApiData;
        
        const combinedData = {
            hourly: hourly, 
            daily: daily, 
            timestamp: new Date().getTime(),
            latitude,
            longitude,
            cityName // Ora è la stringa completa "Città, Nazione (Provincia)"
        };

        // SALVA I DATI METEO IN CACHE (con scadenza)
        localStorage.setItem(localStorageKey, JSON.stringify(combinedData));
        localStorage.setItem(lastUpdateKey, combinedData.timestamp);
        
        // SALVA LE COORDINATE E IL NOME DELLA CITTÀ SCELTA COME PREFERENZA PERSISTENTE (senza scadenza)
        localStorage.setItem(PREFERRED_CITY_KEY, cityName);
        localStorage.setItem(PREFERRED_COORDS_KEY, JSON.stringify({ latitude, longitude }));
        
        return combinedData;

    } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
        throw new Error('Errore nel caricamento dei dati meteo.');
    }
};

/**
 * Funzione principale per ottenere i dati meteo, con logica di persistenza e fallback.
 * @param {object|string|null} location - Nuova città da caricare (oggetto completo, stringa di ricerca o null).
 * @returns {object} Dati meteo.
 */
export const getWeatherData = async (location = null) => {
    const cachedData = localStorage.getItem(localStorageKey);
    const lastUpdateTimestamp = localStorage.getItem(lastUpdateKey);
    const preferredCity = localStorage.getItem(PREFERRED_CITY_KEY); // Città preferita salvata
    const preferredCoordsStr = localStorage.getItem(PREFERRED_COORDS_KEY); // Coordinate preferite salvate

    let coords = null;
    let cityName = null;
    let cachedDataParsed = cachedData ? JSON.parse(cachedData) : null;
    let preferredCoords = preferredCoordsStr ? JSON.parse(preferredCoordsStr) : null;
    
    const now = new Date().getTime();
    const cacheExpired = !cachedData || !lastUpdateTimestamp || (now - parseInt(lastUpdateTimestamp)) >= CACHE_DURATION_MS;
    
    // 1. Controlla la cache per dati validi (NON scaduti)
    if (!cacheExpired) {
        let targetCityName = (typeof location === 'string') ? location : (location ? location.fullDisplayName : null);
        
        // Se la cache non è scaduta E stiamo ricaricando la città corrente (o non è specificata una nuova)
        if (!location || (targetCityName && cachedDataParsed.cityName && cachedDataParsed.cityName.toLowerCase() === targetCityName.toLowerCase())) {
            console.log('Utilizzo dati da cache valida per la città corrente.');
            return cachedDataParsed;
        }
        // Se la cache non è scaduta, ma l'utente ha cercato una NUOVA città, si prosegue col caricamento.
    }
    
    // 2. Determina le coordinate e il nome della città da caricare
    
    // 2a. Caso: L'utente ha selezionato un suggerimento (oggetto Location)
    if (location && typeof location === 'object') {
        coords = { latitude: location.latitude, longitude: location.longitude };
        cityName = location.fullDisplayName;
    } 
    
    // 2b. Caso: L'utente ha digitato e premuto invio (stringa)
    else if (location && typeof location === 'string') {
        try {
            coords = await getCoordinatesFromCity(location);
            cityName = coords.name;
        } catch (e) {
            // Se la geocodifica fallisce, effetto il fallback alla città preferita o Padova
            console.error(`Geocodifica per "${location}" fallita. Tentativo di fallback.`);
            location = null; // Rimuove la richiesta esplicita fallita per passare al punto 2c
        }
    }
    
    // 2c. Caso: Nessuna location specificata o geocodifica fallita, ma c'è una città preferita salvata.
    // Questo gestisce l'avvio dell'app dopo la chiusura o la scadenza della cache.
    if (!coords && preferredCity && preferredCoords) {
        coords = preferredCoords;
        cityName = preferredCity;
        console.log('Ricarico la città preferita persistente.');
    }
    
    // 2d. Caso: Nessuna location specificata e nessuna preferenza salvata (Avvio per la prima volta).
    else if (!coords) { 
        coords = { latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE };
        cityName = DEFAULT_CITY_NAME;
        console.log('Nessuna preferenza trovata. Utilizzo la città di default.');
        
        // NON SALVARE qui la preferenza, perché il salvataggio avviene in fetchAndStoreWeatherData
        // e vogliamo che il primo avvio con Padova salvi Padova.
    }
    
    // 3. Effettua la richiesta API e salva i dati (sia cache che preferenza)
    // A questo punto, coords e cityName sono sempre validi.
    return fetchAndStoreWeatherData(coords.latitude, coords.longitude, cityName);
};

// Funzioni di utilità per la formattazione dei dati
export const formatDate = (dateString) => {
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const months = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
    const date = new Date(dateString);
    const dayName = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${dayName}. ${day} ${month}`;
};

export const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};