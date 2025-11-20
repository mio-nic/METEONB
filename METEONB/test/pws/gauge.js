document.addEventListener('DOMContentLoaded', () => {

    const addCss = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            body {
                color: white;
                background-color: #0d1217;
                font-family: 'Montserrat', sans-serif;
            }
            .gauge-container {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                align-items: center;
                gap: 0px;
                padding: 0px;
                margin: 0px ;
                max-width: 1200px;
            }
            .gauge-item {
                width: 100%;
                max-width: 150px;
                height: 180px;
                flex-grow: 1;
                flex-basis: 180px;
                margin-bottom: 10px;
            }
            h1, h2 {
                text-align: center;
                font-weight: 300;
                color: #ffffff;
            }
            .countdown-container {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-top: 20px;
                margin-bottom: 30px;
                font-size: 1.5em;
                color: #ffffff;
            }
            .countdown-box {
                background-color: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 5px 10px;
                margin-left: 10px;
                border-radius: 5px;
                font-family: monospace;
            }
            .highcharts-background {
                fill: #31363b;
            }
            .pulse-dot {
                height: 12px;
                width: 12px;
                background-color: #66BB6A;
                border-radius: 50%;
                display: inline-block;
                margin-right: 8px;
                box-shadow: 0 0 0 rgba(102, 187, 106, 0.4);
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(102, 187, 106, 0.7); }
                70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(102, 187, 106, 0); }
                100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(102, 187, 106, 0); }
            }
        `;
        document.head.appendChild(style);
    };

    const addCountdownElement = () => {
        const countdownContainer = document.createElement('div');
        countdownContainer.className = 'countdown-container';
        countdownContainer.innerHTML = '<span class="pulse-dot"></span> Live <span id="countdown" class="countdown-box"></span> secondi.';
        
        const gaugeContainer = document.querySelector('.gauge-container');
        if (gaugeContainer) {
            gaugeContainer.parentNode.insertBefore(countdownContainer, gaugeContainer);
        } else {
            document.body.appendChild(countdownContainer);
        }
    };

    addCss();
    addCountdownElement();

    const chartSettings = {
        temp: { min: 0, max: 40, suffix: '°C' },
        wlatest: { min: 0, max: 40, suffix: ' km/h' },
        press: { min: 990, max: 1030, suffix: ' hPa' },
        rfall: { min: 0, max: 10, suffix: ' mm' },
        SolarRad: { min: 0, max: 1000, suffix: ' W/m²' }
    };
    
    const UPDATE_INTERVAL = 16000;
    let secondsLeft = UPDATE_INTERVAL / 1000;

    const previousValues = {
        temp: null,
        wlatest: null,
        press: null,
        rfall: null,
        SolarRad: null
    };

    const gaugeOptions = {
        chart: {
            type: 'solidgauge'
        },
        title: {
            text: '',
            style: {
                color: '#ffffff',
                fontSize: '1em'
            },
            y: 60
        },
        pane: {
            center: ['50%', '85%'],
            size: '95%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderColor: 'transparent',
                borderRadius: 5,
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },
        exporting: {
            enabled: false
        },
        tooltip: {
            enabled: false
        },
        yAxis: {
            stops: [
                [0.1, '#66BB6A'],
                [0.5, '#FFD54F'],
                [0.9, '#EF5350']
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 2,
            title: null,
            labels: {
                y: 16,
                style: {
                    color: '#ffffff'
                },
                formatter: function() {
                    return Highcharts.numberFormat(this.value, 0); 
                }
            }
        },
        plotOptions: {
            solidgauge: {
                borderRadius: 5,
                dataLabels: {
                    borderWidth: 0,
                    style: {
                        textOutline: 'none',
                    }
                }
            }
        }
    };

    const createGaugeElements = (dataKey) => {
        const gaugeContainer = document.querySelector('.gauge-container');
        const gaugeDiv = document.createElement('div');
        gaugeDiv.id = 'container-' + dataKey;
        gaugeDiv.className = 'gauge-item';
        if (gaugeContainer) {
            gaugeContainer.appendChild(gaugeDiv);
        } else {
            document.body.appendChild(gaugeDiv);
        }
    };

    createGaugeElements('temp');
    createGaugeElements('wlatest');
    createGaugeElements('press');
    createGaugeElements('rfall');
    createGaugeElements('SolarRad');

    const getChartOptions = (title, dataKey, yAxisMin, yAxisMax, suffix, color) => {
        const options = Highcharts.merge(gaugeOptions, {
            chart: {
                renderTo: 'container-' + dataKey
            },
            title: {
                text: `${title}`
            },
            yAxis: {
                min: yAxisMin,
                max: yAxisMax,
                title: null,
            },
            credits: {
                enabled: false
            },
            series: [{
                name: title,
                data: [{ y: 0, dataLabels: { style: { color: '#ffffff' } } }],
                dataLabels: {
                    y: -30,
                    formatter: function() {
                        const formattedValue = Highcharts.numberFormat(this.y, 1);
                        return `<div style="text-align:center;">
                                     <span style="font-size: 1.2em; font-weight: bold; color: ${this.options.dataLabels.style.color};">${formattedValue}</span>
                                 </div>`;
                    },
                    useHTML: true
                },
                color: color
            }]
        });
        return options;
    };

    const charts = {};

    charts.temp = new Highcharts.Chart(getChartOptions('Temperatura', 'temp', chartSettings.temp.min, chartSettings.temp.max, chartSettings.temp.suffix, Highcharts.getOptions().colors[0]));
    charts.wlatest = new Highcharts.Chart(getChartOptions('Vento', 'wlatest', chartSettings.wlatest.min, chartSettings.wlatest.max, chartSettings.wlatest.suffix, Highcharts.getOptions().colors[1]));
    charts.press = new Highcharts.Chart(getChartOptions('Pressione', 'press', chartSettings.press.min, chartSettings.press.max, chartSettings.press.suffix, Highcharts.getOptions().colors[2]));
    charts.rfall = new Highcharts.Chart(getChartOptions('Pioggia', 'rfall', chartSettings.rfall.min, chartSettings.rfall.max, chartSettings.rfall.suffix, Highcharts.getOptions().colors[3]));
    charts.solar = new Highcharts.Chart(getChartOptions('Radiazione Solare', 'SolarRad', chartSettings.SolarRad.min, chartSettings.SolarRad.max, chartSettings.SolarRad.suffix, Highcharts.getOptions().colors[4]));

    const getWeatherData = async () => {
        const pulseDot = document.querySelector('.pulse-dot');
        try {
            // Aggiungi un parametro univoco per prevenire la cache del browser
            const cacheBuster = `?_cb=${new Date().getTime()}`;
            const response = await fetch(`https://meteofree.altervista.org/template/plugins/steelSeries/ssMeteotemplate.php${cacheBuster}`);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            // Controllo per assicurarsi che i dati siano un oggetto valido
            if (!data || typeof data !== 'object') {
                console.error('Risposta JSON non valida:', data);
                throw new Error('Invalid JSON data received');
            }
            
            const updateChart = (chart, dataKey) => {
                if (chart && data[dataKey] !== undefined) {
                    let value = parseFloat(data[dataKey]);
                    if (isNaN(value)) {
                        console.warn(`Dato non valido per ${dataKey}:`, data[dataKey]);
                        return;
                    }
                    
                    let newMin = chartSettings[dataKey].min;
                    let newMax = chartSettings[dataKey].max;

                    chart.yAxis[0].update({
                        min: newMin,
                        max: newMax
                    }, false);

                    let newColor = '#ffffff';
                    if (previousValues[dataKey] !== null) {
                        if (value > previousValues[dataKey]) {
                            newColor = '#EF5350';
                        } else if (value < previousValues[dataKey]) {
                            newColor = '#66BB6A';
                        }
                    }

                    chart.series[0].points[0].update({
                        y: value,
                        dataLabels: {
                            style: {
                                color: newColor
                            }
                        }
                    });

                    setTimeout(() => {
                        chart.series[0].points[0].update({
                            dataLabels: {
                                style: {
                                    color: '#ffffff'
                                }
                            }
                        });
                    }, 10000);

                    previousValues[dataKey] = value;
                }
            };
            
            updateChart(charts.temp, 'temp');
            updateChart(charts.wlatest, 'wlatest');
            updateChart(charts.press, 'press');
            updateChart(charts.rfall, 'rfall');
            updateChart(charts.solar, 'SolarRad');

            // Reset del contatore solo in caso di aggiornamento riuscito
            secondsLeft = UPDATE_INTERVAL / 1000;
            if (pulseDot) {
                pulseDot.style.backgroundColor = '#66BB6A'; // Verde per successo
            }
        } catch (error) {
            console.error('Si è verificato un errore durante il recupero dei dati meteo:', error);
            if (pulseDot) {
                pulseDot.style.backgroundColor = 'red'; // Rosso per errore
            }
        }
    };
    
    const updateCountdown = () => {
        secondsLeft--;
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            countdownElement.innerText = secondsLeft.toString().padStart(2, '0');
        }
    };

    // Esegui l'aggiornamento iniziale e poi imposta gli intervalli
    getWeatherData();
    setInterval(getWeatherData, UPDATE_INTERVAL);
    setInterval(updateCountdown, 1000);
});