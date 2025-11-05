import { formatTime, getWeatherEmoji } from './main.js';

/**
 * Determina il suggerimento di abbigliamento in base ai parametri meteo orari.
 * Logica: Più dettagliato con l'abbigliamento base + accessori in base a pioggia/vento.
 * @param {number} temp - Temperatura in °C.
 * @param {number} precip - Precipitazione oraria in mm.
 * @param {number} wind - Velocità del vento in km/h.
 * @returns {string} Suggerimento di abbigliamento in formato HTML.
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
    if (precip >= 1.5) { // Pioggia da moderata a forte
        accessories.push('Impermeabile e Ombrello ☔');
    } else if (precip > 0.1) { // Pioggia leggera
        accessories.push('Giacca idrorepellente');
    }

    if (wind > 35 && temp < 20) { // Vento forte con temperature fresche
        accessories.push('Antivento Aggiuntivo');
    }

    // 3. Combinazione del risultato in un formato pulito
    const accessoryStr = accessories.length > 0 ? 
        `<br/><span style="font-size: 0.75em; color: var(--secondary-text-color); font-weight: normal;">${accessories.join(' - ')}</span>` 
        : '';
        
    return `<div style="padding: 4px; line-height: 1.2; font-weight: 500;">${suggestion}</div>${accessoryStr}`;
};


/**
 * Genera la tabella oraria dell'abbigliamento per le prossime 24 ore.
 * @param {object} hourlyData - Oggetto contenente i dati orari (hourly) dell'API Open-Meteo.
 * @returns {string} Il markup HTML della tabella.
 */
export const generateHourlyDressTable = (hourlyData) => {
    if (!hourlyData || !hourlyData.time || hourlyData.time.length === 0) {
        return '<p style="color: red;">Dati orari non disponibili.</p>';
    }

    const now = new Date();
    // Trova l'indice dell'ora corrente o della prossima ora disponibile
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

    // Costruzione della tabella (Utilizzando le classi CSS fornite nell'HTML)
    let html = `
    <div class="table-container">
        <table class="hourly-dress-table">
            <thead>
                <tr>
                    <th class="sticky-col" style="min-width: 100px; text-align: left;">
                        Dettaglio
                    </th>
                    ${hourlyForecasts.map(f => `
                        <th style="min-width: 60px; text-align: center;">
                            ${formatTime(f.time).substring(0, 5)}
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                
                <tr> 
                    <td class="sticky-col" style="text-align: left; font-weight: 500;">
                        Temperatura
                    </td>
                    ${hourlyForecasts.map(f => {
                        const tempStyle = f.temp < 10 ? 'color: var(--temp-low-color);' : f.temp > 25 ? 'color: var(--temp-high-color);' : ''; 
                        return `
                            <td style="font-size: 1.1em; font-weight: bold; ${tempStyle}">
                                ${Math.round(f.temp)}°C
                            </td>
                        `;
                    }).join('')}
                </tr>
                
                <tr class="weather-row">
                    <td class="sticky-col" style="text-align: left; font-weight: 500;">
                        Meteo
                    </td>
                    ${hourlyForecasts.map(f => `
                        <td style="font-size: 1.5em; padding: 5px;">
                            ${f.emoji}
                        </td>
                    `).join('')}
                </tr>
                
                <tr class="dress-suggestion-row" style="border-top: 2px solid var(--primary-color);">
                    <td class="sticky-col" style="text-align: left; font-weight: bold; color: var(--primary-color);">
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
    </div>
    `;

    return html;
};

// Rimuovo l'export default e lascio solo l'export con nome per compatibilità con table.js
// export { getClothingSuggestion }; // Mantenuta per debug se volessi
