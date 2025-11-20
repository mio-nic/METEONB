// meteogram.js
// Aggiornato per utilizzare i dati parsificati forniti da all.js.

import { getParsedData } from './all.js';

let combinedHighchart = null;

// Mappa delle emoji meteo ai nomi descrittivi
const weatherMap = {
    "☀️": "Soleggiato",
    "🌤️": "Parzialmente Nuvoloso",
    "🌥️": "Velato/Poco Nuvoloso",
    "☁️": "Nuvoloso",
    "💧": "Pioggia Leggera",    
    "⛈️": "Temporale",
    "🌙": "Sereno Notturno",
    "❔": "Dato Mancante",
    "": "Dato Mancante" // Per i valori mancanti
};

// --- FUNZIONE AGGIORNATA PER PREPARARE I DATI DA ALL.JS ---
const prepareMeteogramData = async () => {
    try {
        // Recupera tutti i dati parsificati (Array di Oggetti)
        const parsedData = await getParsedData();

        if (!parsedData || parsedData.length === 0) {
            throw new Error("Dati parsati da all.js non disponibili per il meteogramma.");
        }

        // Estrai e formatta i dati dalle chiavi normalizzate da all.js
        const stationRainfallData = parsedData.map(row => {
            // Utilizza la chiave normalizzata (minuscola, senza spazi)
            const value = row.stazionepioggiaoraria;
            // Assicura che la virgola sia sostituita dal punto e parsifica
            return parseFloat(String(value || 0).replace(',', '.'));
        });

        const forecastRainfallData = parsedData.map(row => {
            const value = row.previsionepioggiaoraria;
            return parseFloat(String(value || 0).replace(',', '.'));
        });

        const weatherIcons = parsedData.map(row => row.iconemeteo || '');

        return {
            stationRainfall: stationRainfallData,
            forecastRainfall: forecastRainfallData,
            weatherIcons: weatherIcons
        };

    } catch (error) {
        console.error('Errore nella preparazione dei dati meteo:', error);
        // Fallback robusto con 24 valori a zero in caso di errore
        return {
            stationRainfall: Array(24).fill(0),
            forecastRainfall: Array(24).fill(0),
            weatherIcons: Array(24).fill('')
        };
    }
};
// --- FINE FUNZIONE AGGIORNATA ---


export const initMeteogram = async () => {
    // Chiama la nuova funzione che usa all.js
    const weatherData = await prepareMeteogramData();
    const body = document.body;

    // Genera un array orario che parte dalla mezzanotte del giorno corrente
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    
    // Usiamo la lunghezza dei dati effettivamente ricevuti, con un max di 24 ore
    const dataLength = Math.min(weatherData.stationRainfall.length, 24); 
    
    const timeArray = Array.from({ length: dataLength }, (_, i) => {
        const date = new Date(startOfDay);
        date.setHours(date.getHours() + i);
        return date.toISOString();
    });
    
    // Rimuoviamo il padding dinamico superfluo se usiamo dataLength
    const paddedStationRainfall = weatherData.stationRainfall.slice(0, dataLength);
    const paddedForecastRainfall = weatherData.forecastRainfall.slice(0, dataLength);
    const paddedWeatherIcons = weatherData.weatherIcons.slice(0, dataLength);

    const xAxisHours = [];
    const xAxisEmojiAndHourLabels = [];

    for (let i = 0; i < timeArray.length; i++) {
        const date = new Date(timeArray[i]);
        const formattedHour = date.toLocaleTimeString('it-IT', { hour: '2-digit' });
        xAxisHours.push(formattedHour);
        const emoji = paddedWeatherIcons[i] || '☁️'; 
        xAxisEmojiAndHourLabels[i] = `${emoji}<br/>${formattedHour}`;
    }

    const plotLines = [];
    let previousDayLine = new Date(timeArray[0]).toLocaleDateString('en-US');

    for (let i = 1; i < timeArray.length; i++) {
        const date = new Date(timeArray[i]);
        const currentDayLine = date.toLocaleDateString('en-US');

        if (currentDayLine !== previousDayLine) {
            plotLines.push({
                color: 'rgba(255, 255, 255, 1)',
                value: i - 0.5,
                width: 5,
                dashStyle: 'Dot',
                label: {
                    text: date.toLocaleDateString('it-IT', { weekday: 'long' }),
                    align: 'left',
                    x: 5,
                    style: { color: 'white', fontWeight: 'bold' }
                }
            });
            previousDayLine = currentDayLine;
        }
    }

    const isDarkTheme = body.classList.contains('dark-theme');
    const themeColors = {
        backgroundColor: isDarkTheme ? '#31363b' : '#212121',
        textColor: isDarkTheme ? '#ecf0f1' : '#ecf0f1',
        gridColor: isDarkTheme ? '#4a657c' : '#4a657c'
    };

    // Calcola l'indice attuale per il plotline
    const nowHours = now.getHours();
    const nowIndex = nowHours;
    if (nowIndex < paddedStationRainfall.length) {
        plotLines.push({
            color: 'red',
            value: nowIndex,
            width: 2,
            zIndex: 10,
            label: {
                text: `${paddedStationRainfall[nowIndex]?.toFixed(1) || 0} mm`,
                align: 'center',
                style: {
                    color: 'white',
                    fontWeight: 'bold'
                },
                y: 10,
                verticalAlign: 'top',
                x: 0
            }
        });
    }

    let titleText = 'Nessuna Pioggia prevista';
    const currentPrecipitationForecast = paddedForecastRainfall[nowIndex];
    const currentPrecipitationStation = paddedStationRainfall[nowIndex];

    if (currentPrecipitationStation > 0) {
        titleText = `🟢 Sta piovendo: ${currentPrecipitationStation.toFixed(1)} mm dalla Stazione`;
    } else if (currentPrecipitationForecast > 0) {
        titleText = `💧 Non piove al momento. È Previsto: ${currentPrecipitationForecast.toFixed(1)} mm`;
    }

    let subtitleText = '';
    const totalForecastAccumulation = paddedForecastRainfall.reduce((sum, p) => sum + p, 0);
    const totalStationAccumulation = paddedStationRainfall.reduce((sum, p) => sum + p, 0);

    if (totalForecastAccumulation > 0 || totalStationAccumulation > 0) {
        let firstRainIndex = -1;
        let lastRainIndex = -1;

        for (let i = 0; i < paddedForecastRainfall.length; i++) {
            if (paddedForecastRainfall[i] > 0) {
                if (firstRainIndex === -1) {
                    firstRainIndex = i;
                }
                lastRainIndex = i;
            }
        }

        if (firstRainIndex !== -1) {
            const startDate = new Date(timeArray[firstRainIndex]);
            const endDate = new Date(timeArray[lastRainIndex]);

            const startHour = startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            const endHour = endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

            subtitleText = `Pioverà dalle ${startHour} - ${endHour} | Totale registrato: ${totalStationAccumulation.toFixed(1)} mm su previsti ${totalForecastAccumulation.toFixed(1)} mm`;
        }
    } else {
        subtitleText = 'Nessuna pioggia prevista o registrata nelle prossime 24h';
    }

    const precipitationSpaceGray = paddedForecastRainfall.map(p => Math.max(0, 4 - p));

    combinedHighchart = Highcharts.chart('combinedChart', {
        chart: {
            type: 'column',
            backgroundColor: themeColors.backgroundColor,
            spacingBottom: 50,
            reflow: true,
            zoomType: 'x'
        },
        title: {
            text: titleText,
            style: { color: themeColors.textColor }
        },
        subtitle: {
            text: subtitleText,
            style: { color: themeColors.textColor }
        },
        xAxis: [{
            categories: xAxisHours,
            crosshair: true,
            tickPositions: [...Array(timeArray.length).keys()],
            plotLines: plotLines,
            labels: {
                // *** AGGIUNTA CHIAVE PER VEDERE SUL DESKTOP ***
                enabled: true,  
                // *** FINE AGGIUNTA ***
                useHTML: true,
                style: { color: themeColors.textColor, fontSize: '14px' },
                formatter: function() {
                    return xAxisEmojiAndHourLabels[this.pos];
                }
            },
            lineColor: themeColors.textColor,
            tickColor: themeColors.textColor
        }],
        yAxis: [{
            visible: false,
            title: {
                text: 'mm',
                style: { color: themeColors.textColor }
            },
            labels: {
                enabled: true,
                style: { color: themeColors.textColor }
            },
            gridLineColor: 'rgba(255, 255, 255, 0.4)',
            max: 4,
            min: 0
        }],
        tooltip: {
            shared: true,
            followPointer: true,
            stickOnContact: true,
            zIndex: 9,
            formatter: function() {
                const pointIndex = this.x !== undefined ? this.x : (this.points && this.points[0] ? this.points[0].point.index : undefined);

                if (pointIndex === undefined || !timeArray || timeArray.length <= pointIndex) {
                    return false;
                }

                const time = timeArray[pointIndex];
                const weatherIcon = paddedWeatherIcons[pointIndex];
                const rainfallForecast = paddedForecastRainfall[pointIndex];
                const rainfallStation = paddedStationRainfall[pointIndex];

                const weatherName = weatherMap[weatherIcon] || 'Previsione';

                let tooltipHtml = `<b>${new Date(time).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} ${new Date(time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</b><br/>`;
                tooltipHtml += `${weatherIcon} ${weatherName}<br/>`; 
                tooltipHtml += `💧 Previsione: ${rainfallForecast.toFixed(1)} mm<br/>`;
                tooltipHtml += `🧭 Stazione: ${rainfallStation.toFixed(1)} mm<br/>`;

                return tooltipHtml;
            }
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                grouping: false,
                pointPadding: 0,
                groupPadding: 0.1
            }
        },
        legend: { itemStyle: { color: themeColors.textColor } },
        series: [{
            name: 'Spazio Pioggia',
            data: precipitationSpaceGray,
            color: 'rgba(102, 102, 153, 0.4)',
            borderWidth: 0,
            showInLegend: false,
            tooltip: { pointFormat: '' },
            enableMouseTracking: false
        }, {
            name: 'Previsione',
            data: paddedForecastRainfall,
            color: 'rgba(153, 204, 255, 0.3)',
            borderColor: '#00f2ff',
            borderWidth: 1,
            tooltip: { valueSuffix: ' mm' }
        }, {
            name: 'Stazione',
            type: 'column',
            data: paddedStationRainfall,
            color: '#00fff7',
            borderColor: '#00f2ff',
            borderWidth: 1,
            tooltip: { valueSuffix: ' mm' }
        }],
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    xAxis: {
                        labels: {
                            // Nonostante 'enabled: true' sia ora sopra, 
                            // questa sezione modifica il *formatter* per il mobile,
                            // riducendo il numero di etichette mostrate.
                            enabled: true, 
                            formatter: function() {
                                const date = new Date(timeArray[this.pos]);
                                const hour = date.getHours();
                                if (hour % 4 === 0) {
                                    return xAxisEmojiAndHourLabels[this.pos];
                                }
                            }
                        },
                        tickPositions: [0, 4, 8, 12, 16, 20]
                    }
                }
            }]
        }
    });
};

// Chiama la funzione per inizializzare il grafico
initMeteogram();