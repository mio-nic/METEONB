/* eslint-disable */
document.addEventListener('DOMContentLoaded', function() {
    // Funzione per ottenere il valore di una variabile CSS
    function getCssVariable(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    
    // Funzione per trovare l'ultimo valore non nullo
    const findLastNonNullIndex = (dataArray) => {
        for (let i = dataArray.length - 1; i >= 0; i--) {
            if (dataArray[i] !== null && dataArray[i] !== undefined) {
                return i;
            }
        }
        return -1;
    };

    // Funzione helper per formattare il valore con unità e virgola (per le data labels)
    const formatValueWithUnit = (value, decimals, unit) => {
        if (value === null || value === undefined) return 'N/A';
        // Formatta il numero con i decimali specificati e usa la virgola come separatore
        return `${value.toFixed(decimals).replace('.', ',')} ${unit}`;
    };

    // Imposta le opzioni globali di Highcharts per semplificare il codice
    Highcharts.setOptions({
        chart: {
            backgroundColor: getCssVariable('--chart-bg-color'),
            style: {
                fontFamily: 'Segoe UI, Arial, sans-serif'
            }
        },
        credits: { enabled: false },
        yAxis: {
            gridLineColor: getCssVariable('--chart-grid-color'),
            lineColor: getCssVariable('--chart-grid-color'),
            labels: { style: { color: getCssVariable('--secondary-text-color') } }
        },
        xAxis: {
            labels: { enabled: false }
        },
        legend: {
            enabled: false // Le legende sono state rimosse
        },
        plotOptions: {
            series: {
                marker: { enabled: false },
                dataLabels: { enabled: false }
            }
        },
        // !!! AGGIUNTO IL FORMATTO ORARIO GLOBALE NEL TOOLTIP !!!
        tooltip: {
            // Formato personalizzato per il tempo nel tooltip (HH:mm)
            dateTimeLabelFormats: {
                hour: '%H:%M', 
                minute: '%H:%M'
            }
        }
    });

    // Colori personalizzati
    const colorStazioneSolare = '#FFFF00';
    const colorStazionePressione = '#FF8C00';
    const colorStazioneUmidita = '#1E90FF';
    const colorStazioneVento = '#32CD32';
    // --- NUOVO COLORE PER LA PIOGGIA ---
    const colorStazionePioggia = '#00CED1'; // Un colore come Turchese scuro
    const colorPrevisione = '#FFFFFF';

    // L'URL deve essere aggiornato per includere le colonne S e T
    // k1:t30 ora copre le 10 colonne: Pressione(K,L), Solare(M,N), Umidità(O,P), Vento(Q,R), Pioggia(S,T)
    const dataUrl = 'https://sheets.googleapis.com/v4/spreadsheets/1AySWKvTZTfwKG8HjK3QA1jchC6ESWly5RgUeX7kGJfU/values/SHEET!k1:t30?key=AIzaSyCWyLCGhaapvmQy4em7k5UY6O7yYA3TzZI';

    fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
            if (!data.values || data.values.length < 2) {
                console.error('Dati non validi o assenti.');
                return;
            }
            const rows = data.values.slice(1);
            
            const pressioneStazione = [];
            const pressionePrevisione = [];
            const solareStazione = [];
            const solarePrevisione = [];
            const umiditaStazione = [];
            const umiditaPrevisione = [];
            const ventoStazione = [];
            const ventoPrevisione = [];
            // --- NUOVI ARRAY PER LA PIOGGIA (COLONNE S e T, indici 8 e 9 dell'array row) ---
            const pioggiaStazione = [];
            const pioggiaPrevisione = [];


            rows.forEach(row => {
                pressioneStazione.push(row[0] === '' ? null : parseFloat(row[0].replace(',', '.')));
                pressionePrevisione.push(row[1] === '' ? null : parseFloat(row[1].replace(',', '.')));
                solareStazione.push(row[2] === '' ? null : parseFloat(row[2].replace(',', '.')));
                solarePrevisione.push(row[3] === '' ? null : parseFloat(row[3].replace(',', '.')));
                umiditaStazione.push(row[4] === '' ? null : parseFloat(row[4].replace(',', '.').replace('%', '')));
                umiditaPrevisione.push(row[5] === '' ? null : parseFloat(row[5].replace(',', '.').replace('%', '')));
                ventoStazione.push(row[6] === '' ? null : parseFloat(row[6].replace(',', '.')));
                ventoPrevisione.push(row[7] === '' ? null : parseFloat(row[7].replace(',', '.')));
                // --- PARSING DATI PIOGGIA (colonne S e T) ---
                pioggiaStazione.push(row[8] === '' ? null : parseFloat(row[8].replace(',', '.')));
                pioggiaPrevisione.push(row[9] === '' ? null : parseFloat(row[9].replace(',', '.')));
            });
            
            // Funzione helper per ottenere il valore e la differenza
            const getLastValueAndDifference = (stazioneData, previsioneData, unit, decimals) => {
                const lastIndex = findLastNonNullIndex(stazioneData);
                const lastVal = stazioneData[lastIndex];
                const previsioneVal = previsioneData[lastIndex];
                
                if (lastVal === null || previsioneVal === null) {
                    return { currentValue: `N/A ${unit}`, difference: 'N/A' };
                }
                
                const diff = lastVal - previsioneVal;
                const sign = diff >= 0 ? '+' : '';
                
                // Usa la funzione helper per formattare il valore attuale e la differenza
                const formattedCurrentValue = formatValueWithUnit(lastVal, decimals, unit);
                const formattedDifference = `${sign}${diff.toFixed(decimals).replace('.', ',')} ${unit}`;
                
                return { currentValue: formattedCurrentValue, difference: formattedDifference };
            };
            
            /* -------------------------------------------
             * GRAFICO PRESSIONE (Resto invariato)
             * ------------------------------------------- */
            const pressioneInfo = getLastValueAndDifference(pressioneStazione, pressionePrevisione, 'hPa', 1);
            const lastPressioneIndex = findLastNonNullIndex(pressioneStazione);

            Highcharts.chart('container-pressione', {
                title: null,
                tooltip: { valueSuffix: ' hPa' },
                yAxis: { title: null },
                series: [{
                    name: 'Stazione Pressione', type: 'spline',
                    data: pressioneStazione.map((val, index) => {
                        if (index === lastPressioneIndex && val !== null) {
                            return { 
                                y: val, 
                                marker: { enabled: true, radius: 5, fillColor: colorStazionePressione, lineColor: colorStazionePressione }, 
                                dataLabels: { 
                                    enabled: true, 
                                    formatter: function() { return formatValueWithUnit(this.y, 1, 'hPa'); },
                                    align: 'left', x: 5, style: { fontWeight: 'bold' } 
                                } 
                            };
                        }
                        return val;
                    }),
                    color: colorStazionePressione, lineWidth: 2, dashStyle: 'Solid'
                }, {
                    name: 'Previsione Pressione', type: 'spline',
                    data: pressionePrevisione,
                    color: colorPrevisione, lineWidth: 2, marker: { enabled: false }, dashStyle: 'Dot'
                }]
            });
            
            /* -------------------------------------------
             * GRAFICO SOLARE (Resto invariato)
             * ------------------------------------------- */
            const solareInfo = getLastValueAndDifference(solareStazione, solarePrevisione, 'W/m²', 1);
            const lastSolareIndex = findLastNonNullIndex(solareStazione);
            
            Highcharts.chart('container-solare', {
                title: null,
                tooltip: { valueSuffix: ' W/m²' },
                yAxis: { title: null },
                series: [{
                    name: 'Stazione Solare', type: 'spline',
                    data: solareStazione.map((val, index) => {
                        if (index === lastSolareIndex && val !== null) {
                            return { 
                                y: val, 
                                marker: { enabled: true, radius: 5, fillColor: colorStazioneSolare, lineColor: colorStazioneSolare }, 
                                dataLabels: { 
                                    enabled: true, 
                                    formatter: function() { return formatValueWithUnit(this.y, 1, 'W/m²'); },
                                    align: 'left', x: 5, style: { fontWeight: 'bold' } 
                                } 
                            };
                        }
                        return val;
                    }),
                    color: colorStazioneSolare, lineWidth: 2, dashStyle: 'Solid'
                }, {
                    name: 'Previsione Solare', type: 'spline',
                    data: solarePrevisione,
                    color: colorPrevisione, lineWidth: 2, marker: { enabled: false }, dashStyle: 'Dot'
                }]
            });

            /* -------------------------------------------
             * GRAFICO UMIDITÀ (Resto invariato)
             * ------------------------------------------- */
            const umiditaInfo = getLastValueAndDifference(umiditaStazione, umiditaPrevisione, '%', 0);
            const lastUmiditaIndex = findLastNonNullIndex(umiditaStazione);
            
            Highcharts.chart('container-umidita', {
                title: null,
                tooltip: { valueSuffix: '%' },
                yAxis: { title: null },
                series: [{
                    name: 'Stazione Umidità', type: 'spline',
                    data: umiditaStazione.map((val, index) => {
                        if (index === lastUmiditaIndex && val !== null) {
                            return { 
                                y: val, 
                                marker: { enabled: true, radius: 5, fillColor: colorStazioneUmidita, lineColor: colorStazioneUmidita }, 
                                dataLabels: { 
                                    enabled: true, 
                                    formatter: function() { return formatValueWithUnit(this.y, 0, '%'); },
                                    align: 'left', x: 5, style: { fontWeight: 'bold' } 
                                } 
                            };
                        }
                        return val;
                    }),
                    color: colorStazioneUmidita, lineWidth: 2, dashStyle: 'Solid'
                }, {
                    name: 'Previsione Umidità', type: 'spline',
                    data: umiditaPrevisione,
                    color: colorPrevisione, lineWidth: 2, marker: { enabled: false }, dashStyle: 'Dot'
                }]
            });

            /* -------------------------------------------
             * GRAFICO VENTO (Resto invariato)
             * ------------------------------------------- */
            const ventoInfo = getLastValueAndDifference(ventoStazione, ventoPrevisione, 'km/h', 0);
            const lastVentoIndex = findLastNonNullIndex(ventoStazione);
            
            Highcharts.chart('container-vento', {
                title: null,
                tooltip: { valueSuffix: ' km/h' },
                yAxis: { title: null },
                series: [{
                    name: 'Stazione Vento', type: 'spline',
                    data: ventoStazione.map((val, index) => {
                        if (index === lastVentoIndex && val !== null) {
                            return { 
                                y: val, 
                                marker: { enabled: true, radius: 5, fillColor: colorStazioneVento, lineColor: colorStazioneVento }, 
                                dataLabels: { 
                                    enabled: true, 
                                    formatter: function() { return formatValueWithUnit(this.y, 0, 'km/h'); },
                                    align: 'left', x: 5, style: { fontWeight: 'bold' } 
                                } 
                            };
                        }
                        return val;
                    }),
                    color: colorStazioneVento, lineWidth: 2, dashStyle: 'Solid'
                }, {
                    name: 'Previsione Vento', type: 'spline',
                    data: ventoPrevisione,
                    color: colorPrevisione, lineWidth: 2, marker: { enabled: false }, dashStyle: 'Dot'
                }]
            });
            
            
            /* -------------------------------------------
             * GRAFICO PRECIPITAZIONI (NUOVO)
             * ------------------------------------------- */
            const pioggiaInfo = getLastValueAndDifference(pioggiaStazione, pioggiaPrevisione, 'mm', 1);
            const lastPioggiaIndex = findLastNonNullIndex(pioggiaStazione);

            Highcharts.chart('container-pioggia', {
                title: null,
                tooltip: { valueSuffix: ' mm' },
                yAxis: { 
                    title: null,
                    min: 0, // Le precipitazioni non possono essere negative
                },
                series: [{
                    name: 'Stazione Pioggia', 
                    type: 'spline', // Uso il tipo 'column' (barre) che è più adatto alle precipitazioni
                    data: pioggiaStazione.map((val, index) => {
                        if (index === lastPioggiaIndex && val !== null) {
                            return { 
                                y: val, 
                                marker: { enabled: true, radius: 5, fillColor: colorStazionePioggia, lineColor: colorStazionePioggia },
                                dataLabels: { 
                                    enabled: true, 
                                    formatter: function() { return formatValueWithUnit(this.y, 1, 'mm'); },
                                    align: 'center', 
                                    verticalAlign: 'top', 
                                    x: 5, // Sposta l'etichetta sopra la barra
                                    style: { fontWeight: 'bold' } 
                                } 
                            };
                        }
                        return val;
                    }),
                    color: colorStazionePioggia, 
                    // Uso un colore semitrasparente per le barre
                    pointWidth: 15 // Larghezza della barra
                }, {
                    name: 'Previsione Pioggia', 
                    type: 'spline', // Manteniamo la previsione come linea spline
                    data: pioggiaPrevisione,
                    color: colorPrevisione, 
                    lineWidth: 2, 
                    marker: { enabled: false }, 
                    dashStyle: 'Dot'
                }]
            });

        })
        .catch(error => {
            console.error('Errore durante l\'operazione di fetch:', error);
        });
});