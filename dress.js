import { formatTime, getWeatherEmoji } from './main.js';

/**
 * Determina il suggerimento di abbigliamento in base ai parametri meteo orari.
 * Logica: Più dettagliato con l'abbigliamento base + accessori in base a pioggia/vento.
 * * @param {number} temp - Temperatura in °C.
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
        `<br/><span class="text-xs text-gray-500 font-normal">${accessories.join(' - ')}</span>` 
        : '';

    return `<div class="p-1 leading-snug font-medium">${suggestion}</div>${accessoryStr}`;
};


/**
 * Genera la tabella oraria dell'abbigliamento per le prossime 24 ore.
 * @param {object} hourlyData - Oggetto contenente i dati orari (hourly) dell'API Open-Meteo.
 * @returns {string} Il markup HTML della tabella.
 */
export const generateHourlyDressTable = (hourlyData) => {
    if (!hourlyData || !hourlyData.time || hourlyData.time.length === 0) {
        return '<p class="text-red-500">Dati orari non disponibili.</p>';
    }

    const now = new Date();
    // Trova l'indice dell'ora corrente o della prossima ora disponibile
    const startIndex = hourlyData.time.findIndex(timeStr => new Date(timeStr) >= now);

    if (startIndex === -1) {
        return '<p class="text-red-500">Ora corrente non trovata nei dati.</p>';
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
            // Uso getWeatherEmoji da main.js
            emoji: getWeatherEmoji(hourlyData, i)
        });
    }

    // Costruzione della tabella orizzontale scrollabile (Tailwind CSS)
    let html = `
    <div class="overflow-x-auto w-full shadow-xl rounded-xl">
        <table class="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead class="bg-gray-100">
                <tr>
                    <th class="sticky left-0 bg-gray-200 text-left text-xs font-semibold text-gray-700 uppercase p-3 w-36 min-w-[144px] border-r border-gray-300">
                        Dettaglio
                    </th>
                    ${hourlyForecasts.map(f => `
                        <th class="p-3 text-center text-xs font-bold text-indigo-700 uppercase min-w-[72px] border-l border-gray-200">
                            ${formatTime(f.time).substring(0, 5)}
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                
                <!-- Riga Temperatura -->
                <tr>
                    <td class="sticky left-0 bg-gray-50 text-left text-sm font-medium text-gray-800 whitespace-nowrap p-3 border-r border-gray-200">
                        Temperatura
                    </td>
                    ${hourlyForecasts.map(f => `
                        <td class="p-3 text-center text-base font-bold ${f.temp < 10 ? 'bg-blue-50 text-blue-700' : f.temp > 25 ? 'bg-red-50 text-red-700' : 'text-gray-700'}">
                            ${Math.round(f.temp)}°C
                        </td>
                    `).join('')}
                </tr>

                <!-- Riga Meteo/Icona -->
                <tr>
                    <td class="sticky left-0 bg-gray-50 text-left text-sm font-medium text-gray-800 whitespace-nowrap p-3 border-r border-gray-200">
                        Meteo
                    </td>
                    ${hourlyForecasts.map(f => `
                        <td class="p-3 text-center text-sm">
                            ${f.emoji}
                        </td>
                    `).join('')}
                </tr>
                
                <!-- Riga Abbigliamento (Focus) -->
                <tr class="border-t-2 border-indigo-400">
                    <td class="sticky left-0 bg-indigo-50 text-left text-sm font-extrabold text-indigo-800 whitespace-nowrap p-3 border-r border-indigo-400">
                        ABBIGLIAMENTO
                    </td>
                    ${hourlyForecasts.map(f => `
                        <td class="p-1 text-center text-xs bg-indigo-100/50 hover:bg-indigo-100 transition duration-150 ease-in-out border-l border-gray-200">
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

/**
 * Esporta la funzione principale che sarà usata nel file table.js (o index.html).
 */
export { getClothingSuggestion }; // Esportata solo per test interni/debug se necessario
export default generateHourlyDressTable;
