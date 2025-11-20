// temp.js
// Aggiornato per utilizzare i dati parsificati (Array di Oggetti) forniti da all.js.

import { getParsedData } from '../pre/all.js'; // Importa la funzione di recupero dati da all.js

document.addEventListener('DOMContentLoaded', () => {

    // Funzione helper per ottenere variabili CSS (es. colori dal tema)
    const getCssVariable = (name) => {
        return getComputedStyle(document.body).getPropertyValue(name).trim();
    };

    /**
     * Funzione per renderizzare il grafico della temperatura utilizzando i dati parsificati.
     * @param {Array<Object>} parsedData - Array di oggetti riga forniti da all.js.
     */
    const renderTempChart = (parsedData) => {
        // Controllo base sulla validità dei dati ricevuti
        if (!parsedData || parsedData.length < 1) {
            console.warn("Dati insufficienti dal foglio di calcolo per il grafico della temperatura.");
            return;
        }

        // Le chiavi sono normalizzate in minuscolo e senza spazi da all.js
        const timeKey = 'ora';
        const stationKey = 'stazione';
        const forecastKey = 'previsione';
        const forecastMaxKey = 'previsionemax'; // Corrisponde a 'previsione max'
        const forecastMinKey = 'previsionemin'; // Corrisponde a 'previsione min'

        // Inizializzazione degli array per i dati del grafico e delle categorie (ore)
        const historicalData = [];
        const mainForecastData = [];
        const forecastMaxData = [];
        const forecastMinData = [];
        const categories = [];
        const now = new Date();
        const currentHour = now.getHours();
        let lastHistoricalIndex = -1; // Indice del dato storico più recente

        // Processamento delle righe dei dati parsificati (Array di oggetti)
        parsedData.forEach((row, index) => {
            // Verifica che l'oggetto riga contenga un'ora valida
            if (row[timeKey] && row[timeKey] !== "") {
                const hour = parseInt(row[timeKey].split(':')[0], 10); // Estrae l'ora dalla colonna 'ora'
                categories.push(row[timeKey]); // Aggiunge l'ora alle categorie dell'asse X

                // Conversione dei valori delle colonne in numeri, gestendo stringhe vuote/null
                const safeParse = (key) => {
                    const value = row[key];
                    if (value === null || value === undefined || value === "") return null;
                    return parseFloat(String(value).replace(',', '.'));
                };
                
                const stationValue = safeParse(stationKey);
                const forecastValue = safeParse(forecastKey);
                const forecastMaxValue = safeParse(forecastMaxKey);
                const forecastMinValue = safeParse(forecastMinKey);
                
                // Popolamento degli array dei dati del grafico
                historicalData.push(stationValue);
                mainForecastData.push(forecastValue);
                forecastMaxData.push(forecastMaxValue);
                forecastMinData.push(forecastMinValue);

                // Identifica l'indice del dato storico corrispondente all'ora attuale
                if (hour === currentHour) {
                    lastHistoricalIndex = index;
                }
            }
        });
        
        // Trova l'indice dell'ultimo dato storico non nullo per l'etichetta e il marcatore grande
        let lastValidDataIndex = -1;
        for (let i = historicalData.length - 1; i >= 0; i--) {
            if (typeof historicalData[i] === 'number') {
                lastValidDataIndex = i;
                break;
            }
        }
        
        // Creazione dell'array per i dati con l'etichetta e il marcatore ingrandito solo sull'ultimo punto valido
        const historicalDataWithLabel = historicalData.map((value, index) => {
            if (index === lastValidDataIndex) {
                // Configurazione dell'etichetta per l'ultimo punto
                return {
                    y: value,
                    // Marcatore ingrandito solo sull'ultimo punto
                    marker: {
                        enabled: true,
                        radius: 6, // Raggio ingrandito per l'ultimo punto
                        fillColor: '#f73b3b', // Colore del punto
                        lineColor: '#f73b3b', // Colore del bordo (come la linea storica)
                        lineWidth: 2, // Spessore del bordo
                        symbol: 'circle'
                    },
                    dataLabels: {
                        enabled: true,
                        align: 'center', // Centra rispetto al punto
                        verticalAlign: 'bottom', // Metti l'etichetta sotto il punto
                        formatter: function() {
                            return `${this.y.toFixed(1)}°C`; // Formatta il valore
                        },
                        style: {
                            color: 'white', // Etichetta in bianco come richiesto
                            fontWeight: 'bold',
                            textOutline: '1px black' // Contorno per migliore visibilità
                        },
                        y: -10 // Sposta l'etichetta 10 pixel sopra il punto
                    }
                };
            }
            // Per tutti gli altri punti (se si desidera comunque un piccolo marcatore)
            return value;
        });

        // Prepara i dati per la serie arearange (min, max)
        const forecastRangeData = [];
        for (let i = 0; i < forecastMinData.length; i++) {
            if (forecastMinData[i] !== null && forecastMaxData[i] !== null) {
                forecastRangeData.push([forecastMinData[i], forecastMaxData[i]]);
            } else {
                forecastRangeData.push(null); // Gestisce i punti dati mancanti
            }
        }

        // Definizione dei colori basati sulle variabili CSS per il tema corrente
        const themeColors = {
            backgroundColor: getCssVariable('--chart-bg-color'),
            textColor: getCssVariable('--text-color'),
            gridColor: getCssVariable('--chart-grid-color'),
            historicalColor: '#f73b3b', // Colore per la temperatura storica (rossa)
            forecastColor: '#f1c40f', // Colore per la previsione principale (gialla)
            forecastMaxColor: '#ffa200', // Colore per la previsione massima (arancione)
            forecastMinColor: '#00fff7', // Colore per la previsione minima (ciano)
            chartTextColor: getCssVariable('--chart-text-color') // Colore testo specifico per il grafico
        };
        
        // Calcola la differenza tra temperatura attuale e previsione (il titolo non è visualizzato)
        const currentTemp = historicalData[lastHistoricalIndex];
        const currentForecast = mainForecastData[lastHistoricalIndex];
        let chartTitle = 'Temperatura: Dati Storici vs. Previsioni';
        if (typeof currentTemp === 'number' && typeof currentForecast === 'number') {
            const difference = (currentTemp - currentForecast).toFixed(1);
            const sign = difference > 0 ? '+' : '';
            chartTitle = `Temp. Attuale: ${currentTemp.toFixed(1)}°C | ${sign}${difference}°C del previsto`;
        }

        // Configurazione e creazione del grafico Highcharts per la temperatura
        Highcharts.chart('temperatureChartContainer', {
            // NUOVO: Disattiva i crediti di Highcharts
            credits: { enabled: false }, 
            
            chart: {
                type: 'spline', // Tipo di grafico a linea con curve morbide
                backgroundColor: themeColors.backgroundColor, // Sfondo del grafico dal tema
                reflow: true // Permette al grafico di ridimensionarsi
            },
            title: {
                text: null // Titolo rimosso
            },
            xAxis: { // Configurazione dell'asse X (tempo)
                categories: categories,
                crosshair: true, // Mostra un indicatore verticale quando si passa sopra
                labels: { style: { color: themeColors.chartTextColor } }, // Colore delle etichette dell'asse X
                lineColor: themeColors.chartTextColor, // Colore della linea dell'asse X
                tickColor: themeColors.chartTextColor, // Colore dei tick dell'asse X
                plotLines: [] // Rimosso l'indicatore dell'ora attuale
            },
            yAxis: { // Configurazione dell'asse Y (temperatura)
                visible: true,
                title: { 
                    text: null // Titolo rimosso
                },
                labels: { style: { color: themeColors.chartTextColor } },
                gridLineColor: themeColors.gridColor,
                minPadding: 0.1, // Spazio minimo sopra e sotto la scala del grafico
                maxPadding: 0.1
            },
            tooltip: { // Configurazione dei tooltip (info al passaggio del mouse)
                shared: true, // Mostra tooltip per tutte le serie contemporaneamente
                valueSuffix: '°C', // Aggiunge "°C" ai valori mostrati nel tooltip
                // Funzione per filtrare solo i dati di interesse (Range e Temperatura)
                formatter: function() {
                    let s = `<span style="font-size: 10px">${this.x}</span><br/>`;
                    this.points.forEach(function(point) {
                        // Mostra solo Range Previsione (min/max) e Temperatura (storica)
                        if (point.series.name === 'Range Previsione') {
                             // Il valore è in point.point.low/high perché è una serie arearange
                             s += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: ${point.point.low.toFixed(1)}°C - ${point.point.high.toFixed(1)}°C<br/>`;
                        } else if (point.series.name === 'Temperatura') {
                             s += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: ${point.y.toFixed(1)}°C<br/>`;
                        }
                    });
                    return s;
                }
            },
            legend: { // Configurazione della legenda
                itemStyle: { color: themeColors.chartTextColor } // Colore delle voci della legenda
            },
            series: [{ 
                // Serie arearange per l'area sfumata (Range Previsione)
                name: 'Range Previsione',
                data: forecastRangeData,
                type: 'arearange', // Tipo di serie arearange
                lineWidth: 0, // Nessuna linea per i bordi dell'area
                linkedTo: ':previous', // Collega al tooltip della serie precedente (forecastMin)
                color: themeColors.forecastMinColor, // Colore di base, ma useremo fillColor
                fillOpacity: 0.2, // Opacità per la semitrasparenza
                // Configurazione del colore sfumato (gradient)
                fillColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, // Gradiente verticale
                    stops: [
                        [0, Highcharts.color(themeColors.forecastMaxColor).setOpacity(0.3).get('rgba')], // Inizio con previsione massima (più trasparente)
                        [1, Highcharts.color(themeColors.forecastMinColor).setOpacity(0.3).get('rgba')]  // Fine con previsione minima (più trasparente)
                    ]
                },
                marker: {
                    enabled: false
                },
                showInLegend: true, 
            }, {
                name: 'Temperatura', // Serie per i dati storici della temperatura
                data: historicalDataWithLabel, // Usa l'array modificato che contiene la configurazione del marcatore
                color: themeColors.historicalColor,
                lineWidth: 4,
                // Rimosso il marcatore di default, poiché viene configurato a livello di singolo punto
                marker: {
                    enabled: true, // Abilita il marcatore di default (piccolo) per tutti i punti NON configurati
                    radius: 3 // Raggio piccolo per tutti i punti eccetto l'ultimo
                },
                dataLabels: {
                    enabled: false
                }
            }, {
                name: 'Previsione max', // Serie per la previsione massima
                data: forecastMaxData,
                color: 'transparent', // Rende la linea invisibile
                lineWidth: 0, // Assicura che non ci sia spessore
                showInLegend: false, // Non appare nella legenda
                dashStyle: 'Solid',
                marker: { enabled: false }, // Nessun punto visibile
                enableMouseTracking: false // Non risponde al mouse
            }, {
                name: 'Previsione', // Serie per la previsione principale
                data: mainForecastData,
                color: 'white', // Colore bianco
                dashStyle: 'Dot', // Stile puntinato
                lineWidth: 1.5, // Linea sottile
                marker: { enabled: false },
                showInLegend: true
            }, {
                name: 'Previsione min', // Serie per la previsione minima
                data: forecastMinData,
                color: 'transparent', // Rende la linea invisibile
                lineWidth: 0, // Assicura che non ci sia spessore
                showInLegend: false, // Non appare nella legenda
                dashStyle: 'Solid',
                marker: { enabled: false },
                enableMouseTracking: false // Non risponde al mouse
            }]
        });
    };

    /**
     * Funzione per recuperare i dati da all.js e renderizzare il grafico.
     */
    const fetchAndRenderTempData = async () => {
        try {
            // Utilizza getParsedData per recuperare i dati
            const parsedData = await getParsedData(); 
            // Passa i dati parsificati (Array di oggetti) alla funzione di rendering
            renderTempChart(parsedData);
        } catch (error) {
            console.error('Si è verificato un errore nel caricamento dei dati della temperatura:', error);
            // Opzionale: Aggiungi un messaggio di errore all'interfaccia utente
            const container = document.getElementById('temperatureChartContainer');
            if (container) {
                container.innerHTML = '<p style="color: red; text-align: center;">Impossibile caricare il grafico della temperatura.</p>';
            }
        }
    };

    // Chiamata iniziale per caricare e visualizzare i dati
    fetchAndRenderTempData();
});