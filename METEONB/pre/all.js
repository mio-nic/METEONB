// all.js - Aggiornato con logica di caching (Memoization)

// Variabili per il caching dei dati
let dataPromise = null;
let cachedData = null;

// L'API URL è unica e punta all'intervallo più ampio necessario per tutti i grafici
const sheetsApiUrl = "https://sheets.googleapis.com/v4/spreadsheets/1AySWKvTZTfwKG8HjK3QA1jchC6ESWly5RgUeX7kGJfU/values/SHEET!a1:y30?key=AIzaSyCWyLCGhaapvmQy4em7k5UY6O7yYA3TzZI";

/**
 * Normalizza le intestazioni di colonna rimuovendo gli spazi e convertendo in minuscolo.
 * @param {string} header - Intestazione originale.
 * @returns {string} Intestazione normalizzata.
 */
const normalizeHeader = (header) => {
    return String(header).toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Recupera i dati dal foglio Google Sheets, li parsa in un array di oggetti 
 * e implementa la logica di caching (Memoization).
 * @returns {Promise<Array<Object>>} Una Promise che si risolve con i dati parsificati.
 */
export const getParsedData = async () => {
    // 1. Controllo della Cache
    if (cachedData) {
        console.log('getParsedData: Dati recuperati dalla cache.');
        return cachedData;
    }
    
    // 2. Controllo della Promise in corso
    if (dataPromise) {
        console.log('getParsedData: Attesa del completamento della richiesta in corso.');
        return dataPromise;
    }

    // 3. Esecuzione della nuova richiesta
    dataPromise = fetch(sheetsApiUrl)
        .then(res => {
            if (!res.ok) {
                // Rimuove la promise in caso di errore per permettere un nuovo tentativo
                dataPromise = null; 
                throw new Error(`Errore API Google Sheets: ${res.statusText}`);
            }
            return res.json();
        })
        .then(sheetsData => {
            if (!sheetsData.values || sheetsData.values.length < 1) {
                // Rimuove la promise in caso di dati non validi
                dataPromise = null;
                throw new Error("Dati insufficienti dal foglio di calcolo.");
            }

            // Parsifica i dati
            const [headers, ...rows] = sheetsData.values;
            const normalizedHeaders = headers.map(normalizeHeader);

            const parsedData = rows.map(row => {
                const rowObject = {};
                normalizedHeaders.forEach((header, index) => {
                    // Controlla se il valore esiste prima di assegnarlo
                    const rawValue = row[index];
                    if (rawValue !== undefined && rawValue !== null) {
                        rowObject[header] = rawValue;
                    } else {
                        rowObject[header] = null;
                    }
                });
                return rowObject;
            });
            
            // 4. Salva i risultati nella cache e resetta la promise
            cachedData = parsedData;
            dataPromise = null; 
            
            return parsedData;
        })
        .catch(error => {
            // Assicura che la promise venga resettata anche in caso di eccezione
            dataPromise = null; 
            console.error('Errore nel recupero o parsing dei dati da Sheets:', error);
            throw error; // Rilancia l'errore per i chiamanti
        });
        
    return dataPromise;
};

// Se hai altre funzioni da esportare in all.js, le metti qui
// ...