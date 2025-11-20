// dati.js

// 🚨 INIZIO CODICE DA MODIFICARE FACILMENTE 🚨
const STATION_IDS = [
    'IVESALA7', 
    'ICAMPO93', 
    'IRESAN10',
    'INOALE15' 
];
// 🚨 FINE CODICE DA MODIFICARE FACILMENTE 🚨

const API_BASE_URL = 'https://api.weather.com/v2/pws/observations/current?apiKey=f6d2efe5720d47ea92efe5720df7eaa8&numericPrecision=decimal&format=json&units=m&stationId=';

// Variabili globali per l'ordinamento
let datiMeteoAttuali = []; 
let ordinamentoCorrente = { 
    colIndex: -1, 
    direzione: 'asc' // 'asc' per crescente, 'desc' per decrescente
};

// Mappa per le intestazioni e i tipi di dato
// N.B.: Le chiavi usate qui sono quelle che il JS usa per costruire l'oggetto
const COLONNE = [
    { key: 'Località', type: 'string' },
    { key: 'Temperatura', type: 'number' },
    { key: 'Umidità', type: 'number' },
    { key: 'Pressione', type: 'number' },
    { key: 'Velocità Vento', type: 'number' },
    { key: 'Tasso Precipitazione', type: 'number' },
    { key: 'Precipitazione Totale', type: 'number' },
    { key: 'Radiazione Solare', type: 'number' }
];


/**
 * Estrae il valore numerico pulito da una stringa (es. "17.4 °C" -> 17.4).
 * Funziona anche se il dato è già un numero.
 * @param {*} value - Il valore da pulire.
 * @returns {number} Il numero pulito o 0 se non è un numero valido.
 */
function estraiValoreNumerico(value) {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        // Usa una regex più sicura per estrarre numeri, inclusi negativi
        const match = value.match(/^-?\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
    }
    return 0;
}

/**
 * Funzione per ordinare i dati e ridisegnare la tabella.
 * @param {number} colIndex - Indice della colonna su cui ordinare (0-7).
 */
function sortData(colIndex) {
    // 1. Determina la direzione
    let direzione = 'asc';
    if (ordinamentoCorrente.colIndex === colIndex && ordinamentoCorrente.direzione === 'asc') {
        direzione = 'desc';
    }

    const { key: dataKey, type: dataType } = COLONNE[colIndex];

    // 2. Logica di ordinamento
    datiMeteoAttuali.sort((a, b) => {
        let valA = a[dataKey];
        let valB = b[dataKey];
        
        let confronto = 0;

        if (dataType === 'number') {
            // Confronto numerico sicuro
            valA = estraiValoreNumerico(valA);
            valB = estraiValoreNumerico(valB);
            
            confronto = valA - valB;

        } else {
            // Confronto testuale
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();

            if (valA > valB) {
                confronto = 1;
            } else if (valA < valB) {
                confronto = -1;
            }
        }

        return direzione === 'asc' ? confronto : confronto * -1;
    });

    // 3. Aggiorna lo stato
    ordinamentoCorrente = { colIndex: colIndex, direzione: direzione };

    // 4. Ridisegna la tabella
    ridisegnaTabella(datiMeteoAttuali);
    
    // 5. Aggiorna le icone
    aggiornaIconeOrdinamento(colIndex, direzione);
}

/**
 * Ridisegna la tabella utilizzando i dati ordinati. (INVARIANTI nelle logiche)
 */
function ridisegnaTabella(dati) {
    const corpoTabella = document.getElementById('corpo-tabella-meteo');
    corpoTabella.innerHTML = ''; // Svuota il corpo attuale

    dati.forEach(item => {
        const riga = corpoTabella.insertRow();
        
        if (item.errore) {
            riga.classList.add('riga-errore');
            const cellaErrore = riga.insertCell();
            cellaErrore.colSpan = 8;
            cellaErrore.textContent = `❌ Errore Stazione ID ${item.stationId}: ${item.errore}`;
        } else {
            // Popola le celle nell'ordine definito dalla costante COLONNE
            COLONNE.forEach(col => {
                riga.insertCell().textContent = item[col.key];
            });
            riga.title = `Aggiornato il: ${item['Ultimo Aggiornamento']}`;
        }
    });
    
    // Ridisegna la riga di aggiornamento se necessario
    if (dati.length > 0 || document.querySelectorAll('.riga-errore').length > 0) {
        const rigaAggiornamento = corpoTabella.insertRow();
        const cellaAggiornamento = rigaAggiornamento.insertCell();
        cellaAggiornamento.colSpan = 8; 
        cellaAggiornamento.classList.add('aggiornamento-info');
        cellaAggiornamento.textContent = `Ultimo tentativo di aggiornamento: ${new Date().toLocaleString('it-IT')}`;
    }
}


/**
 * Gestisce l'aggiornamento visivo delle icone di ordinamento. (INVARIANTI)
 */
function aggiornaIconeOrdinamento(colIndex, direzione) {
    const headers = document.querySelectorAll('.tabella-meteo th');
    headers.forEach((th, index) => {
        th.classList.remove('sort-asc', 'sort-desc');
        // Assicurati che lo span esista prima di provare a modificarlo
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) {
            indicator.textContent = ''; 
            if (index === colIndex) {
                th.classList.add(`sort-${direzione}`);
                indicator.innerHTML = direzione === 'asc' ? ' &uarr;' : ' &darr;';
            }
        }
    });
}


/**
 * Funzione per recuperare i dati meteo di una singola stazione. (INVARIANTI nella logica di fetch)
 * N.B.: Questo ora restituisce i dati sia nel formato numerico (per l'ordinamento) che stringa con unità (per la visualizzazione).
 */
async function getDatiStazione(stationId) {
    const url = API_BASE_URL + stationId;
    
    try {
        const risposta = await fetch(url);
        
        if (!risposta.ok) {
            throw new Error(`Errore (${risposta.status}) per ID: ${stationId}`);
        }
        
        const dati = await risposta.json();
        const osservazione = dati.observations[0];

        if (!osservazione) {
             return {
                errore: `Nessun dato di osservazione disponibile per ID: ${stationId}`,
                stationId: stationId
            };
        }

        // Gestione dati null: usa 0.0 se i dati sono nulli
        const metric = osservazione.metric;
        const temp = metric.temp ?? 0.0;
        const dewpt = metric.dewpt ?? 0.0;
        const windSpeed = metric.windSpeed ?? 0.0;
        const pressure = metric.pressure ?? 0.0;
        const precipRate = metric.precipRate ?? 0.0;
        const precipTotal = metric.precipTotal ?? 0.0;
        const solarRadiation = osservazione.solarRadiation ?? 0.0;
        const humidity = osservazione.humidity ?? 0.0;

        // Restituisci un oggetto che contiene i dati formattati per la visualizzazione
        return {
            'Località': osservazione.neighborhood || 'N/D',
            'Temperatura': `${temp.toFixed(1)} °C`,
            'Umidità': `${humidity.toFixed(0)} %`,
            'Pressione': `${pressure.toFixed(2)} hPa`,
            'Velocità Vento': `${windSpeed.toFixed(1)} m/s`,
            'Tasso Precipitazione': `${precipRate.toFixed(2)} mm/h`, 
            'Precipitazione Totale': `${precipTotal.toFixed(2)} mm`, 
            'Radiazione Solare': `${solarRadiation.toFixed(1)} W/m²`,
            'Ultimo Aggiornamento': new Date(osservazione.obsTimeLocal).toLocaleString('it-IT'),
            stationId: stationId // Manteniamo ID per il debug se necessario
        };

    } catch (errore) {
        return { 
            errore: errore.message,
            stationId: stationId
        };
    }
}


/**
 * Funzione principale per popolare la tabella con tutte le stazioni. (MODIFICATA)
 */
async function popolaTabellaMeteo() {
    const corpoTabella = document.getElementById('corpo-tabella-meteo');
    const headers = document.querySelectorAll('.tabella-meteo th');

    if (!corpoTabella || headers.length === 0) {
        console.error("Struttura tabella non trovata.");
        return;
    }
    
    corpoTabella.innerHTML = '<tr><td colspan="8" style="text-align: center;">Caricamento dati in corso...</td></tr>'; 

    const promesseDati = STATION_IDS.map(getDatiStazione);
    const risultati = await Promise.all(promesseDati);

    // Filtra solo i risultati che non hanno un errore
    datiMeteoAttuali = risultati.filter(dati => !dati.errore && dati.Località !== 'N/D'); 

    // Aggiungi i listener e gli indicatori di ordinamento
    headers.forEach((header, index) => {
        // Aggiunge un gestore di click che chiama la funzione di ordinamento
        header.addEventListener('click', () => sortData(index));
        // Aggiunge un elemento span vuoto per l'icona di ordinamento
        header.innerHTML += ' <span class="sort-indicator"></span>'; 
    });
    
    // Popola e ordina inizialmente (es. per Località)
    sortData(0); // Ordina la colonna 0 (Località) in ordine crescente
}

// Esegui la funzione all'avvio della pagina
document.addEventListener('DOMContentLoaded', popolaTabellaMeteo);