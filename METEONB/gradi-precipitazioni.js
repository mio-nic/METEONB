// gradi-precipitazioni.js
import { formatDate, formatTime } from './main.js';

if (typeof Chart !== 'undefined') {
    Chart.register(ChartDataLabels);
}

let myRainChart = null;

// ... (RAIN_THRESHOLDS e funzioni getRainIntensityThreshold, getRainStartEndTimes invariate)

// 💡 FUNZIONE PER LA DIMENSIONE DEL FONT RESPONSIVE
function getResponsiveFontSize(chart) {
    // Usa un valore base per desktop (es. 13px per l'asse X)
    let baseSize = 13; 
    
    // Se la larghezza del grafico è inferiore a una soglia (es. 500px), riduci il font
    if (chart.width < 500) {
        baseSize = 11; // Riduci la dimensione per schermi più stretti
    }
    return baseSize;
}

// 💡 FUNZIONE PER LA DIMENSIONE DEL FONT DATALABEL RESPONSIVE
function getDatalabelFontSize(chart) {
    let baseSize = 14; 
    if (chart.width < 500) {
        baseSize = 12; // Riduci la dimensione per schermi più stretti
    }
    return baseSize;
}


// DEFINIZIONE DELLE SOGLIE, DEI COLORI DI SFONDO E DEL TESTO PER LE DATALABELS
const RAIN_THRESHOLDS = [
    { max: 0.1, backgroundColor: 'rgba(230, 230, 230, 0.9)', color: 'rgba(50, 50, 50, 1)' }, 
    { max: 2, backgroundColor: 'rgba(100, 192, 255, 0.9)', color: 'rgba(255, 255, 255, 1)' }, 
    { max: 10, backgroundColor: 'rgba(54, 162, 235, 0.9)', color: 'rgba(255, 255, 255, 1)' }, 
    { max: 30, backgroundColor: 'rgba(255, 165, 0, 0.9)', color: 'rgba(50, 50, 50, 1)' }, 
    { max: Infinity, backgroundColor: 'rgba(255, 69, 0, 0.9)', color: 'rgba(255, 255, 255, 1)' }
];

function getRainIntensityThreshold(rain) {
    for (const threshold of RAIN_THRESHOLDS) {
        if (rain <= threshold.max) {
            return threshold;
        }
    }
    return RAIN_THRESHOLDS[0]; 
}

function getRainStartEndTimes(dateString, weatherData) {
    if (!weatherData || !weatherData.hourly) return null;

    const hourlyTimes = weatherData.hourly.time;
    const hourlyPrecipitation = weatherData.hourly.precipitation;
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0); 
    const nextDate = new Date(targetDate.getTime() + (24 * 60 * 60 * 1000));
    const nextDateTimestamp = nextDate.getTime();
    
    const threshold = 0.05; 

    let startIndex = -1;
    let endIndex = -1; 

    for (let i = 0; i < hourlyTimes.length; i++) {
        const currentTimestamp = new Date(hourlyTimes[i]).getTime();
        
        if (currentTimestamp >= targetDate.getTime() && currentTimestamp < nextDateTimestamp) {
            
            const precipitation = hourlyPrecipitation[i];
            
            if (precipitation > threshold) {
                if (startIndex === -1) {
                    startIndex = i; 
                }
                endIndex = i; 
            }
        } else if (currentTimestamp >= nextDateTimestamp) {
             break;
        }
    }

    if (startIndex !== -1) {
        const startTime = formatTime(hourlyTimes[startIndex]);
        
        let endTime;
        if (endIndex + 1 < hourlyTimes.length) {
            endTime = formatTime(hourlyTimes[endIndex + 1]);
        } else {
            endTime = '00:00'; 
        }

        return { start: startTime, end: endTime };
    }

    return null;
}


export function updateRainChart(weatherData) {
    if (typeof Chart === 'undefined' || !weatherData || !weatherData.daily || weatherData.daily.time.length === 0) {
        console.warn("ATTENZIONE: Chart.js non definito o dati meteo non validi per i grafici.");
        return;
    }

    const dailyData = weatherData.daily;
    const originalDates = dailyData.time; 
    const dailyRain = dailyData.precipitation_sum.map(rain => Math.round(rain * 10) / 10); 
    
    const dayNames = ['D', 'L', 'M', 'M', 'G', 'V', 'S']; 
    
    const rainTimes = originalDates.map((date, index) => {
        const times = getRainStartEndTimes(date, weatherData); 
        
        if (times && dailyRain[index] > 0.1) {
             return `\nI:${times.start}\nF:${times.end}`; 
        }
        return '\n\n\n\n'; 
    });
    
    const combinedLabels = originalDates.map((dateStr, index) => {
        const date = new Date(dateStr);
        const dayInitial = dayNames[date.getDay()]; 
        const dayOfMonth = String(date.getDate()).padStart(2, '0'); 
        const rainTimeLabel = rainTimes[index];

        let label = `${dayInitial}\n${dayOfMonth}\n`; 
        label += rainTimeLabel; 

        return label;
    });
        
    const ctxRain = document.getElementById('dailyRainChart');
    if (ctxRain) {
        if (myRainChart) myRainChart.destroy();
        
        const nonZeroRain = dailyRain.filter(r => r > 0);
        const yMaxRain = nonZeroRain.length > 0 ? Math.max(...nonZeroRain) + 2 : 5;

        myRainChart = new Chart(ctxRain, {
    type: 'bar',
    data: {
        labels: combinedLabels, 
        datasets: [
            {
                label: 'Precipitazioni (mm)',
                data: dailyRain,
                
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return;

                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    const colorLowRisk = 'rgba(0, 150, 255, 0.7)'; 	
                    const colorMidRisk = 'rgba(128, 0, 128, 0.8)'; 	
                    const colorHighRisk = 'rgba(255, 0, 0, 0.95)'; 
                    
                    gradient.addColorStop(0, colorLowRisk); 	 
                    gradient.addColorStop(0.7, colorMidRisk); 	
                    gradient.addColorStop(1, colorHighRisk); 	 
                    
                    return gradient;
                },
                
                borderColor: 'rgba(255, 255, 255, 0.5)', 
                borderWidth: 1,
                
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                shadowOffsetX: 3,
                shadowOffsetY: 3,

                datalabels: {
                    anchor: 'start', 
                    align: 'center', 
                    offset: 8, 
                    
                    backgroundColor: (context) => {
                        const rainValue = context.dataset.data[context.dataIndex];
                        return getRainIntensityThreshold(rainValue).backgroundColor;
                    },
                    
                    color: (context) => {
                        const rainValue = context.dataset.data[context.dataIndex];
                        return getRainIntensityThreshold(rainValue).color;
                    },
                    
                    borderRadius: 4,
                    padding: { top: 1, bottom: 1, left: 6, right: 6 },
                    
                    // 💡 MODIFICA: Utilizza la funzione responsive per il font
                    font: function(context) { 
                        return { 
                            size: getDatalabelFontSize(context.chart), 
                            weight: 'bolder' 
                        }; 
                    },
                    formatter: (value) => value.toFixed(1) 
                }
            }
        ]
    },
    options: {
        // ✅ CONFERMATO: Questi assicurano che il grafico si adatti al contenitore
        responsive: true,
        maintainAspectRatio: false, 
        
        backgroundColor: 'rgba(31, 31, 31, 0.9)', 
        layout: { padding: { top: 30, bottom: 20, left: 10, right: 10 } },
        plugins: {
            legend: { display: false },
            title: { display: false, text: 'Precipitazioni Giornaliere (mm)', color: 'white' },
            tooltip: { 
                display: false, 
                backgroundColor: 'rgba(0, 0, 0, 0.7)', 
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 12 },
                callbacks: { 
                    title: () => null,
                    label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} mm` 
                } 
            }
        },

        scales: {
            x: {
                barPercentage: 0.9, 
                categoryPercentage: 0.9,
                ticks: { 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    textShadow: '0px 0px 8px #000', 
                    callback: function(val, index) { 
                        const labelParts = this.getLabelForValue(val).split('\n'); 
                        return labelParts; 
                    },
                    padding: 15,
                    // 💡 MODIFICA: Utilizza la funzione responsive per il font
                    font: function(context) { 
                        return { 
                            size: getResponsiveFontSize(context.chart), 
                            weight: 'bolder' 
                        }; 
                    }
                }, 
                grid: { 
                    display: true, 
                    drawOnChartArea: true, 
                    drawTicks: false, 
                    color: 'rgba(255, 255, 255, 0.3)', 
                    lineWidth: 1, 
                    borderDash: [],
                    
                } 
            },
            y: {
                display: false,
                min: 0,
                max: yMaxRain,
                ticks: { color: 'white' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    }
});
    }
}