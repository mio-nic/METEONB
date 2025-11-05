// dress.js
// Logica per l'abbigliamento e il rendering della tabella oraria trasposta.

/**
 * Funzione di utilità per fornire una semplice raccomandazione sull'abbigliamento
 * basata sulla temperatura (usiamo solo la temperatura standard).
 *
 * @param {number} temp - Temperatura in Celsius.
 * @returns {string} Suggerimento di abbigliamento.
 */
const getDressSuggestion = (temp) => {
    const t = Number(temp);

    if (isNaN(t)) {
        return "N/D";
    }

   // Logica basata sulla Temperatura con descrizioni ampliate
    if (t >= 30) {
        return "☀️ **Molto Caldo:** Abbigliamento minimo e traspirante (canottiera, pantaloncini, vestiti leggeri). Indispensabile crema solare e cappello.";
    } else if (t >= 25) {
        return "👕 **Caldo:** Abbigliamento estivo leggero (T-shirt, pantaloncini/gonna). Evita fibre sintetiche e vesti con colori chiari.";
    } else if (t >= 20) {
        return "👚 **Clima Mite:** Mezza manica o camicia leggera. Utile un maglioncino sottile per la sera o zone d'ombra.";
    } else if (t >= 15) {
        return "🧥 **Fresco:** T-shirt con giacca leggera o felpa (strati leggeri). Ideale per quando la temperatura può oscillare.";
    } else if (t >= 10) {
        return "🧣 **Moderatamente Freddo:** Maglione o felpa pesante e giacca a vento. Consigliati pantaloni lunghi.";
    } else if (t >= 5) {
        return "🧤 **Freddo:** Cappotto medio/pesante, sciarpa e maglione caldo. È il momento di aggiungere strati termici.";
    } else {
        return "🥶 **Freddo Intenso:** Giacca invernale pesante, cappello, guanti e sciarpa. Necessari strati termici e calzature adatte.";
    }
};

/**
 * Aggiorna il contenitore dell'abbigliamento con una tabella oraria trasposta.
 *
 * @param {object} allData - Oggetto completo dei dati meteo.
 */
export const generateHourlyDressTable = (allData) => {
    const container = document.getElementById('dress-table-container');
    
    if (!container) {
        console.error("Elemento '#dress-table-container' non trovato.");
        return;
    }
    
    container.innerHTML = ''; 

    const hourlyData = allData?.hourly;

    if (!hourlyData || !hourlyData.time || !hourlyData.temperature_2m || hourlyData.time.length === 0) {
        container.innerHTML = '<p>Dati orari essenziali (tempo/temperatura) non disponibili per l\'abbigliamento.</p>';
        return;
    }

    const numHoursToShow = 10; // Visualizziamo 10 ore (puoi cambiarlo)

    // 1. Array per raccogliere le righe di dati
    const hours = [];
    const temperatures = [];
    const suggestions = [];
    
    for (let i = 0; i < Math.min(hourlyData.time.length, numHoursToShow); i++) {
        const time = hourlyData.time[i];
        const temp = hourlyData.temperature_2m[i]; 
        
        // Formatta l'ora (es. 14:00)
        const date = new Date(time);
        const formattedHour = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        hours.push(formattedHour);
        temperatures.push(`${Math.round(temp)}°C`);
        suggestions.push(getDressSuggestion(temp));
    }

    // 2. Costruzione della tabella TRASPOSTA
    let tableHtml = `
        <h3 class="section-title">Consigli Orari Abbigliamento (Prossime ${hours.length} Ore)</h3>
        <div class="table-scroll-container">
            <table class="hourly-dress-table transposed-table">
                <thead>
                    <tr>
                        <th class="header-col">Ora:</th>
                        ${hours.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th class="header-col">Temperatura:</th>
                        ${temperatures.map(t => `<td class="temp-data">${t}</td>`).join('')}
                    </tr>
                    <tr>
                        <th class="header-col">Abbigliamento:</th>
                        ${suggestions.map(s => `<td>${s}</td>`).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // 3. Inserisce la tabella nel DOM
    container.innerHTML = tableHtml;
};
