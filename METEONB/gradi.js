// gradi.js - Versione Aggiornata: Iniziale Giorno Settimana e Giorno del Mese (2 cifre) nell'Asse X

let myChart = null;

export function getChartInstance() {
    return myChart;
}

/**
 * Aggiorna o crea il grafico Highcharts con i dati meteo.
 * @param {object} weatherData - Oggetto contenente i dati meteo giornalieri.
 */
export function updateChart(weatherData) {
    if (!weatherData || !weatherData.daily) {
        console.error("Dati meteo non validi per l'aggiornamento del grafico.");
        return;
    }

    const dailyData = weatherData.daily;
    const days = dailyData.time;
    const maxTemps = dailyData.temperature_2m_max;
    const minTemps = dailyData.temperature_2m_min;

    // --- 1. Calcolo Dati ---
    const data = days.map((dateStr, index) => {
        const timestamp = new Date(dateStr).getTime();
        const min = Math.round(minTemps[index]);
        const max = Math.round(maxTemps[index]);
        
        return {
            x: timestamp,
            low: min,
            high: max,
        };
    });

    // 2. Calcola i limiti dell'asse Y
    const yMin = Math.min(...minTemps);
    const yMax = Math.max(...maxTemps);
    
    // 3. Calcolo PlotLines per le linee verticali
    const plotLines = days.slice(1).map(dateStr => {
        const timestamp = new Date(dateStr).getTime();
        return {
            color: 'rgba(255, 255, 255, 0.1)', // Linea bianca tenue
            width: 1,
            value: timestamp, 
            zIndex: 0 
        };
    });
    
    // Aggiungi un'ultima linea per delimitare l'ultimo giorno
    if (days.length > 0) {
        const lastTimestamp = new Date(days[days.length - 1]).getTime();
        plotLines.push({
            color: 'rgba(255, 255, 255, 0.1)',
            width: 1,
            value: lastTimestamp + 24 * 3600 * 1000,
            zIndex: 0
        });
    }
    
    // Array personalizzato per le iniziali dei giorni in italiano (L, M, M, G, V, S, D)
    // 0=Domenica, 1=Lunedì, ecc.
    const dayInitials = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
    
    /**
     * Helper per formattare il giorno a due cifre (es. 5 -> '05')
     * @param {number} num - Il numero del giorno.
     * @returns {string} Il numero del giorno formattato a due cifre.
     */
    const pad2 = num => String(num).padStart(2, '0');

    // Inizializza il grafico Highcharts
    myChart = Highcharts.chart('container', {
        
        chart: {
            type: 'arearange',
            backgroundColor: 'transparent',
            style: { fontFamily: 'Arial, sans-serif' },
            spacingTop: 0, 
            spacingBottom: 25
        },

        // --- RIMOZIONE ELEMENTI ---
        title: { 
            text: null,
            margin: 0 
        }, 
        credits: { enabled: false },
        tooltip: { enabled: false },
        legend: { enabled: false },

        // --- Asse X (Date) ---
        xAxis: {
            type: 'datetime',
            tickInterval: 24 * 3600 * 1000,
            labels: { 
                style: { color: 'white', fontWeight: 'bold' },
                x: 0,
                // ⭐ MODIFICA: La formatter restituisce Iniziale Giorno Settimana + Giorno del Mese a 2 cifre
                formatter: function() {
                    const date = new Date(this.value);
                    const dayIndex = date.getDay(); 
                    const dayInitial = dayInitials[dayIndex];
                    const dayOfMonth = pad2(date.getDate()); // Usa l'helper per 2 cifre
                    
                    // Restituisce l'iniziale del giorno della settimana sopra il giorno del mese
                    return `${dayInitial}<br>${dayOfMonth}`; 
                }
            },
            gridLineWidth: 0,
            lineColor: 'rgba(255, 255, 255, 0.2)',
            // Linee verticali
            plotLines: plotLines, 
        },

        // --- Asse Y (Temperature - Spazio Ridotto) ---
        yAxis: {
            title: { text: null },
            labels: { enabled: false },
            gridLineWidth: 0,
            lineColor: 'transparent',
            min: yMin - 2,  
            max: yMax + 2  
        },

        // --- Plot Options: Etichette Dinamiche Semplici ---
        plotOptions: {
            arearange: {
                shadow: false, 
                lineWidth: 0, 
                lineColor: 'transparent', 
                marker: { enabled: false },

                // Sfumatura (Invariata)
                fillColor: {
                    linearGradient: [0, 0, 0, '100%'],
                    stops: [
                        [0, 'rgba(255, 0, 100, 0.0)'],  
                        [0.15, 'rgba(255, 0, 100, 0.95)'], 
                        [0.4, 'rgba(255, 100, 200, 0.7)'], 
                        [0.6, 'rgba(100, 0, 255, 0.7)'],   
                        [0.85, 'rgba(0, 100, 255, 0.95)'], 
                        [1, 'rgba(0, 100, 255, 0.0)']       
                    ]
                },
                
                // --- Etichette Dinamiche (SOLO Valore) ---
                dataLabels: {
                    enabled: true,
                    useHTML: true, 
                    y: 0, 
                    crop: false, 
                    overflow: 'allow',
                    style: {
                        textOutline: 'none', 
                        fontWeight: 'bold',
                        fontSize: '13px', 
                        color: 'white' 
                    },
                    formatter: function() {
                        if (this.y !== this.point.high && this.y !== this.point.low) {
                            return null;
                        }

                        let value = this.y;
                        let isMax = this.y === this.point.high;
                        
                        // Sposta sopra (per MAX: -10) o sotto (per MIN: 18)
                        this.y = isMax ? -10 : 18; 
                        
                        return `<span style="color: white; font-weight: bold;">${value}°</span>`;
                    }
                }
            }
        },

        // --- Serie di Dati (Invariata) ---
        series: [{
            name: 'Intervallo Temp.',
            data: data,
            zIndex: 1
        }]
    });
}