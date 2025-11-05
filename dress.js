import { formatTime, getWeatherEmoji } from './main.js';

/**
 * Inietta gli stili CSS specifici per la tabella dell'abbigliamento
 * se non sono già presenti nel DOM.
 */
const injectDressStyles = () => {
    // Evita di iniettare gli stili più di una volta
    if (document.getElementById('dress-table-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'dress-table-styles';
    style.innerHTML = `
        /* Variabili di colore specifiche per la temperatura */
        :root {
            --temp-low-color: #90CAF9; /* Blu chiaro */
            --temp-high-color: #FFCDD2; /* Rosso chiaro */
        }
        
        /* Stili per il wrapper scorrevole (CRUCIALE PER SCROLL OR.) */
        .scrollable-table-wrapper {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }

        /* Stili per la Tabella Oraria (Override o Aggiunte) */
        .hourly-dress-table {
            table-layout: auto;
            width: max-content; /* Permette alla tabella di espandersi orizzontalmente */
            border-collapse: collapse;
            color: var(--text-color);
            font-size: 0.9em;
            overflow: hidden;
            border-radius: 8px;
        }

        /* Stili per colonna sticky (FONDAMENTALE per lo scroll orizzontale) */
        .sticky-col {
            position: sticky;
            left: 0;
            z-index: 5; 
            /* Usa le variabili globali già definite in index.html */
            background-color: var(--table-row-odd-bg) !important; 
            border-right: 1px solid var(--border-color);
            font-weight: bold;
            text-align: left !important;
        }
        .hourly-dress-table thead th:first-child {
            background-color: var(--table-header-bg) !important;
            z-index: 6; 
        }
        .dress-suggestion-row .sticky-col {
            /* Colore leggermente diverso per la riga suggerimento */
            background-color: rgba(66, 161, 255, 0.2) !important;
        }
        .dress-suggestion-row td {
             /* Bordi sulla riga del suggerimento */
             border-top: 2px solid var(--primary-color);
        }
        
        /* Stili per il suggerimento di testo */
        .clothing-suggestion-box {
            padding: 4px; 
            line-height: 1.2; 
            font-weight: 500;
        }
        
    `;
    document.head.appendChild(style);
};


/**
 * Determina il suggerimento di abbigliamento in base ai parametri meteo orari.
 * ... (Logica invariata)
 */
const getClothingSuggestion = (temp, precip, wind) => {
    let suggestion = '';
    let accessories = [];

    // 1. Logica basata sulla temperatura (Abbigliamento Base)
    if (temp < 4) {
        suggestion = 'GIUBBOTTO PESANTE (Inverno)';
        accessories.push('Cappello, Guanti e Sciarpa');
    } else if (temp < 10) {
        suggestion = 'Giubbotto Pesante (Autunno/Inverno)';
        accessories.push('Maglione di Lana');
    } else if (temp < 14) {
        suggestion = 'Giubbotto Leggero + Felpa';
    } else if (temp < 18) {
        suggestion = 'Maglione o Felpa pesante';
    } else if (temp < 22) {
        suggestion = 'Maglietta Lunga o Polo';
    } else if (temp < 26) {
        suggestion = 'Maglietta Leggera';
    } else {
        suggestion = 'ABBIGLIAMENTO LEGGERO (Estivo)';
        accessories.push('Occhiali da sole 🕶️');
    }

    // 2. Logica per vento e pioggia (Accessori Aggiuntivi)
    if (precip >= 1.5) { 
        accessories.push('Impermeabile e Ombrello ☔');
    } else if (precip > 0.1) {
        accessories.push('Giacca idrorepellente');
    }

    if (wind > 35 && temp < 20) {
        accessories.push('Antivento Aggiuntivo');
    }

    // 3. Combinazione del risultato
    const accessoryStr = accessories.length > 0 ? 
        `<br/><span style="font-size: 0.75em; color: var(--secondary-text-color); font-weight: normal;">${accessories.join(' - ')}</span>` 
        : '';
        
    // Uso della classe CSS definita sopra
    return `<div class="clothing-suggestion-box">${suggestion}</div>${accessoryStr}`;
};


/**
 * Genera la tabella oraria dell'abbigliamento per le prossime 24 ore.
 * @param {object} hourlyData - Oggetto contenente i dati orari (hourly) dell'API Open-Meteo.
 * @returns {string} Il markup HTML della tabella.
 */
export const generateHourlyDressTable = (hourlyData) => {
    // 1. Inietta gli stili all'avvio della funzione
    injectDressStyles(); 
    
    if (!hourlyData || !hourlyData.time || hourlyData.time.length === 0) {
        return '<p style="color: red;">Dati orari non disponibili.</p>';
    }

    const now = new Date();
    const startIndex = hourlyData.time.findIndex(timeStr => new Date(timeStr) >= now);

    if (startIndex === -1) {
        return '<p style="color: red;">Ora corrente non trovata nei dati.</p>';
    }

    const hoursToDisplay = 24;
    const end = Math.min(startIndex + hoursToDisplay, hourlyData.time.length);
    const hourlyForecasts = [];

    for (let i = startIndex; i < end; i++) {
        hourlyForecasts.push({
            time: hourlyData.time[i],
            temp: hourlyData.temperature_2m[i],
            precip: hourlyData.precipitation[i],
            wind: hourlyData.wind_speed_10m[i],
            emoji: getWeatherEmoji(hourlyData, i)
        });
    }

    // Costruzione della tabella 
    let html = `
    <div class="scrollable-table-wrapper"> <table class="hourly-dress-table">
            <thead>
                <tr>
                    <th class="sticky-col" style="min-width: 100px;">
                        Dettaglio
                    </th>
                    ${hourlyForecasts.map(f => `
                        <th style="min-width: 60px;">
                            ${formatTime(f.time).substring(0, 5)}
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                
                <tr> 
                    <td class="sticky-col">
                        Temperatura
                    </td>
                    ${hourlyForecasts.map(f => {
                        // Usa le variabili CSS --temp-low-color e --temp-high-color
                        const tempStyle = f.temp < 10 ? 'color: var(--temp-low-color);' : f.temp > 25 ? 'color: var(--temp-high-color);' : ''; 
                        return `
                            <td style="font-size: 1.1em; font-weight: bold; ${tempStyle}">
                                ${Math.round(f.temp)}°C
                            </td>
                        `;
                    }).join('')}
                </tr>
                
                <tr class="weather-row">
                    <td class="sticky-col">
                        Meteo
                    </td>
                    ${hourlyForecasts.map(f => `
                        <td style="font-size: 1.5em; padding: 5px;">
                            ${f.emoji}
                        </td>
                    `).join('')}
                </tr>
                
                <tr class="dress-suggestion-row">
                    <td class="sticky-col" style="font-weight: bold; color: var(--primary-color);">
                        ABBIGLIAMENTO
                    </td>
                    ${hourlyForecasts.map(f => `
                        <td style="font-size: 0.85em; padding: 5px 2px;">
                            ${getClothingSuggestion(f.temp, f.precip, f.wind)}
                        </td>
                    `).join('')}
                </tr>

            </tbody>
        </table>
    </div> `;

    return html;
};
