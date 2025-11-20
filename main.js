// main.js - Versione Completa con Cache, Sincronizzazione Fuso Orario (UTC Offset) e Logiche

// --- COSTANTI E CONFIGURAZIONE ---
// Costante geocodingApiUrl già fornita e corretta
export const geocodingApiUrl = (city, count = 1) => `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=${count}&language=it&format=json`;
const API_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const localStorageKey = 'weatherData';
const lastUpdateKey = 'lastUpdateTimestamp';
const PREFERRED_CITY_KEY = 'preferredCityName'; 
const PREFERRED_COORDS_KEY = 'preferredCityCoords'; 
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 ore
const DEFAULT_LATITUDE = 45.40;
const DEFAULT_LONGITUDE = 11.87;
const DEFAULT_CITY_NAME = 'Padova, Italia (Veneto)';

// --- GESTIONE ICONE E LOGICA (OMESSE PER BREVITÀ, MA PRESENTI) ---
const ICON_BASE_URL = "https://meteofree.altervista.org/METEONB/ICONE/";

const createIconTag = (iconNumber, altText = 'Icona Meteo') => {
    return `<img src="${ICON_BASE_URL}${iconNumber}.png" alt="${altText}" style="width: 36px; height: 36px; vertical-align: middle;" />`;
};

const getIconNumberFromData = (precipitation, cloudCover, windSpeed, precipProb, temperature_2m) => {
    
    if (precipitation >= 0.1 && temperature_2m < 1) { return 13; }
    if (precipProb >= 70 && windSpeed >= 30) { return 8; }
    if (precipitation >= 5.0) { return 7; }
    if (precipitation >= 0.5) { return 6; }
    if (precipitation >= 0.1) { return 5; }
    if (cloudCover >= 80) { return 4; }
    if (cloudCover >= 50) { return 3; }
    if (cloudCover >= 20) { return 2; }
    return 1;
};

export const getWeatherEmoji = (data, index) => {
    const { precipitation, cloud_cover, wind_speed_10m, precipitation_probability, temperature_2m, time } = data;
    const iconNumber = getIconNumberFromData(precipitation[index], cloud_cover[index], wind_speed_10m[index], precipitation_probability[index], temperature_2m[index]);
    const date = new Date(time[index]);
    const hour = date.getHours(); 
    const isNight = hour >= 18 || hour < 6;
    if (isNight && iconNumber <= 3) { return createIconTag(9, 'Meteo Notturno'); }
    return createIconTag(iconNumber, 'Meteo Diurno/Precipitazioni');
};

export const getDailyWeatherEmoji = (data, index) => {
    const { precipitation_sum, cloud_cover_mean, wind_speed_10m_max, temperature_2m_min, precipitation_probability_max } = data;
    const iconNumber = getIconNumberFromData(precipitation_sum[index], cloud_cover_mean[index], wind_speed_10m_max[index], precipitation_probability_max[index], temperature_2m_min[index]);
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


// --- FUNZIONI DI DESCRIZIONE (IMPLEMENTAZIONI BASE) ---
export const getWeatherDescription = (weatherCode) => { 
    // ... (Logica omessa per brevità) ...
    return "variabile"; 
};
export const getPrecipitationDescription = (sumPrecipitation) => {
      
    if (sumPrecipitation === 0) {
        return "assenti";
    }
    // Pioggia molto leggera o tracce
    if (sumPrecipitation > 0 && sumPrecipitation < 0.5) {
        return "tracce";
    }
    // Pioggia leggera
    if (sumPrecipitation >= 0.5 && sumPrecipitation < 5) {
        return "leggere";
    }
    // Pioggia moderata
    if (sumPrecipitation >= 5 && sumPrecipitation < 20) {
        return "moderate";
    }
    // Pioggia forte
    if (sumPrecipitation >= 20 && sumPrecipitation < 50) {
        return "forti";
    }

    // Pioggia molto forte o estrema
    if (sumPrecipitation >= 50) {
        return "estreme";
    }
    // Fallback (se il valore è negativo o non gestito)
    return "assenti"; 
};


export const getWindDescription = (windSpeed) => {
    // windSpeed è la velocità del vento in km/h (chilometri orari)

    // Vento assente (Calma) - Scala Beaufort 0
    if (windSpeed < 1) {
        return "calma";
    }

    // Vento leggerissimo (Brezza leggera) - Beaufort 1-2
    if (windSpeed >= 1 && windSpeed < 12) {
        return "leggero";
    }

    // Vento moderato (Brezza moderata) - Beaufort 3-4
    if (windSpeed >= 12 && windSpeed < 30) {
        return "moderato";
    }

    // Vento forte (Vento teso) - Beaufort 5-6
    if (windSpeed >= 30 && windSpeed < 50) {
        return "teso";
    }

    // Vento molto forte (Burrasca) - Beaufort 7-9
    if (windSpeed >= 50 && windSpeed < 88) {
        return "forte";
    }

    // Vento tempestoso (Tempesta/Uragano) - Beaufort 10+
    if (windSpeed >= 88) {
        return "estremo";
    }

    // Fallback 
    return "debole";
};



// --- FUNZIONI DI RICERCA CITTÀ (GEOCODIFICA) ---

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
                const admin1Str = result.admin1 ? ` (${result.admin1})` : '';
                const fullDisplayName = `${result.name}, ${result.country}${admin1Str}`;
                return {
                    latitude: result.latitude,
                    longitude: result.longitude,
                    name: result.name, 
                    country: result.country, 
                    admin1: result.admin1 || '', 
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

/**
 * Funzione di fallback per la geocodifica di una singola stringa.
 */
export const getCoordinatesFromCity = async (city) => {
    try {
        const response = await fetch(geocodingApiUrl(city));
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name, country, admin1 } = data.results[0];
            const adminStr = admin1 ? ` (${admin1})` : '';
            // Ritorna le coordinate e il nome completo da salvare
            return { latitude, longitude, name: `${name}, ${country}${adminStr}` };
        }
        throw new Error('Città non trovata.');
    } catch (error) {
        console.error(`ATTENZIONE: getCoordinatesFromCity non è riuscita per la stringa data: "${city}".`);
        throw new Error('Geocodifica fallita.');
    }
};

// --- GESTIONE DATI E CACHE ---

/**
 * Effettua la richiesta API, estrae e salva tutti i dati, inclusi fuso orario e OFFSET UTC.
 */
export const fetchAndStoreWeatherData = async (latitude, longitude, cityName) => {
    // URL API UNIFICATO
    const unifiedApiUrl = `${API_BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
        `&hourly=temperature_2m,precipitation,wind_speed_10m,precipitation_probability,cloud_cover` + 
        `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,cloud_cover_mean,relative_humidity_2m_mean,winddirection_10m_dominant,surface_pressure_mean` +
        `&forecast_days=7&timezone=auto&models=best_match`;

    try {
        const response = await fetch(unifiedApiUrl);
        const unifiedApiData = await response.json();

        // ESTREMO ANCHE UTC_OFFSET_SECONDS PER LA SINCRONIZZAZIONE
        const { hourly, daily, timezone, utc_offset_seconds } = unifiedApiData; 
        
        const combinedData = {
            hourly: hourly, 
            daily: daily, 
            timestamp: new Date().getTime(),
            latitude,
            longitude,
            cityName, 
            timezone,
            utc_offset_seconds // <-- CAMPO FONDAMENTALE PER LA CORREZIONE ORARIA
        };

        // SALVA I DATI METEO IN CACHE
        localStorage.setItem(localStorageKey, JSON.stringify(combinedData));
        localStorage.setItem(lastUpdateKey, combinedData.timestamp);
        
        // SALVA LE COORDINATE E IL NOME DELLA CITTÀ SCELTA COME PREFERENZA PERSISTENTE
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
 */
export const getWeatherData = async (location = null) => {
    const cachedData = localStorage.getItem(localStorageKey);
    const lastUpdateTimestamp = localStorage.getItem(lastUpdateKey);
    const preferredCity = localStorage.getItem(PREFERRED_CITY_KEY); 
    const preferredCoordsStr = localStorage.getItem(PREFERRED_COORDS_KEY); 

    let coords = null;
    let cityName = null;
    let cachedDataParsed = cachedData ? JSON.parse(cachedData) : null;
    let preferredCoords = preferredCoordsStr ? JSON.parse(preferredCoordsStr) : null;
    
    const now = new Date().getTime();
    const cacheExpired = !cachedData || !lastUpdateTimestamp || (now - parseInt(lastUpdateTimestamp)) >= CACHE_DURATION_MS;
    
    // 1. Controlla la cache per dati validi (NON scaduti)
    if (!cacheExpired) {
        let targetCityName = (typeof location === 'string') ? location : (location ? location.fullDisplayName : null);
        
        if (!location || (targetCityName && cachedDataParsed.cityName && cachedDataParsed.cityName.toLowerCase() === targetCityName.toLowerCase())) {
            console.log('Utilizzo dati da cache valida per la città corrente.');
            return cachedDataParsed;
        }
    }
    
    // 2. Determina le coordinate e il nome della città da caricare
    
    // 2a. Caso: L'utente ha selezionato un suggerimento (oggetto Location)
    if (location && typeof location === 'object' && location.fullDisplayName) {
        coords = { latitude: location.latitude, longitude: location.longitude };
        cityName = location.fullDisplayName;
    }
    
    // 2b. Caso: L'utente ha digitato e premuto invio (stringa)
    else if (location && typeof location === 'string') {
        try {
            coords = await getCoordinatesFromCity(location);
            cityName = coords.name;
        } catch (e) {
            console.error(`Geocodifica per "${location}" fallita. Tentativo di fallback.`);
            location = null; 
        }
    }
    
    // 2c. Caso: Nessuna location specificata o geocodifica fallita, ma c'è una città preferita salvata.
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
    }
    
    // 3. Effettua la richiesta API e salva i dati
    return fetchAndStoreWeatherData(coords.latitude, coords.longitude, cityName);
};

// --- FUNZIONI DI FORMATTAZIONE ORA/DATA ---

export const formatDate = (dateString, timeZone = undefined) => {
    if (timeZone) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            timeZone: timeZone 
        }).replace(/\s*,/g, '.'); 
    }
    // Fallback omesso per brevità
    return 'Data Fallback';
};

export const formatTime = (timeString, timeZone = undefined) => { 
    const date = new Date(timeString);
    return date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: timeZone 
    });
};