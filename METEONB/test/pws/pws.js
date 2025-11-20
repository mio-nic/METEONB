/* pws.js — 5 grafici a linea sincronizzati aggiornati ogni 16 secondi */

// Converte da UTC a fuso orario Europe/Rome e formatta per un decimale
function toEuropeRomeTimestampAndFormat(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) {
    console.error("Data non valida ricevuta:", dateString);
    return null;
  }

  // Opzioni per la formattazione in ora locale italiana (Europe/Rome)
  const options = {
    timeZone: 'Europe/Rome',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  };
  const dtf = new Intl.DateTimeFormat('it-IT', options); // Usiamo 'it-IT' per l'Italia

  try {
    const parts = dtf.formatToParts(date).reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

    // Costruisce il timestamp per Highcharts usando le parti formattate
    // Convertiamo le ore, minuti, secondi dalla data *originale* in UTC
    // perché Date.UTC lavora con i valori UTC e vogliamo mantenere quella coerenza
    // ma la visualizzazione (tooltip, assi) sarà basata sull'ora locale italiana
    const utcDate = new Date(dateString); // Ricarica per essere sicuro che sia UTC di base
    return {
      // Timestamp UTC grezzo per Highcharts
      timestamp: Date.UTC(
        utcDate.getUTCFullYear(),
        utcDate.getUTCMonth(),
        utcDate.getUTCDate(),
        utcDate.getUTCHours(),
        utcDate.getUTCMinutes(),
        utcDate.getUTCSeconds()
      ),
      // Parti formattate per la visualizzazione
      formattedTime: `${parts.hour}:${parts.minute}:${parts.second}` // Solo ora:minuti:secondi per l'asse X
    };
  } catch (e) {
    console.error("Errore nella formattazione della data:", e);
    return null;
  }
}

// Imposta le opzioni globali per Highcharts
Highcharts.setOptions({
  global: { useUTC: true }, // Lasciamo useUTC a true per coerenza interna, ma gestiamo la conversione per la visualizzazione
  chart: { backgroundColor: "#1e1e1e", style: { color: "#eee" } },
  xAxis: { labels: { style: { color: "#e3e3e3" } } },
  yAxis: { labels: { style: { color: "#e3e3e3" } } },
  title: { style: { color: "#fff" } },
  legend: { enabled: false },
  tooltip: {
    shared: true,
    crosshairs: true,
    // Formattatore personalizzato per mostrare solo l'ora e il valore
    formatter: function() {
      // Converte il timestamp in ora locale italiana (solo ore, minuti e secondi)
      const date = new Date(this.x);
      const timeOptions = {
        timeZone: 'Europe/Rome',
        hour: '2-digit',
        minute: '2-digit'
        
      };
      const formattedTime = new Intl.DateTimeFormat('it-IT', timeOptions).format(date);

      // Crea il contenuto del tooltip con l'ora formattata
      let tooltipContent = `<span style="font-size: 10px">${formattedTime}</span><br/>`;

      // Aggiunge il valore del punto dati selezionato
      this.points.forEach(point => {
        // Formatta il valore e lo aggiunge al messaggio a comparsa
        tooltipContent += `<span style="color:${point.color}">\u25CF</span> ` +
          `<b>${point.y.toFixed(1)}</b> ${point.series.yAxis.options.title.text}<br/>`;
      });

      return tooltipContent;
    }
  },
  // Formattazione globale per i numeri (un decimale)
  // Questo influisce sulle etichette dell'asse Y e potenzialmente sui dati se non specificato diversamente
  numberFormat: {
    decimalPoint: ',', // Usiamo la virgola come separatore decimale per l'italiano
    thousandsSep: '.', // Usiamo il punto come separatore delle migliaia per l'italiano
  }
});

let charts = []; // Array per contenere gli oggetti Highcharts
const chartColors = [
  'rgba(220, 20, 60, 1)', // rosso chiaro con trasparenza
  'rgba(144, 237, 125, 1)', // Verde chiaro con trasparenza
  'rgba(247, 163, 92, 1)', // Arancione con trasparenza
  'rgba(20, 209, 219, 1)', // azzurro con trasparenza
  'rgba(209, 219, 20, 1)' // giallo con trasparenza
];

// Funzione principale per recuperare i dati CSV e disegnare/aggiornare i grafici
async function fetchAndDrawCharts() {
  const formattedDate = new Date().toISOString().slice(0, 10); // Ottiene la data corrente in formato YYYY-MM-DD
  const CSV_URL = `https://meteofree.altervista.org/template/plugins/ecowitt/files/weather_BA5BE9C3C5EEBE6AE29A50997664BFFE_${formattedDate}.csv?t=${Date.now()}`; // URL del file CSV, aggiunge timestamp per evitare cache

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      console.error(`Errore HTTP ${response.status}: Impossibile trovare il file CSV all'URL: ${CSV_URL}. Assicurati che il file esista per la data odierna.`);
      return; // Interrompe l'esecuzione se il file non è raggiungibile
    }
    const csvText = await response.text();

    // Utilizza PapaParse per analizzare il CSV
    Papa.parse(csvText, {
      header: true, // La prima riga contiene le intestazioni delle colonne
      skipEmptyLines: true, // Salta le righe vuote nel file CSV
      dynamicTyping: true, // Tenta di convertire automaticamente i tipi di dato (numeri, booleani)
      complete: ({ data }) => { // Callback eseguita al completamento dell'analisi
        const seriesData = {
          temp: [],
          wind: [],
          pressure: [],
          rain: [],
          solar: []
        };

        // Definisci il limite temporale per i dati (es. ultime 24 ore)
        const twentyFourHoursAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
        
        // Aggiungi un timestamp di riferimento per il filtro ogni 5 minuti
        let lastTimestamp = 0; // Inizializza a 0 per includere il primo punto dati

        // Estrae il dato più recente per ogni serie
        let latestData = {
          temp: null,
          wind: null,
          pressure: null,
          rain: null,
          solar: null
        };

        // Elabora ogni riga del CSV
        data.forEach(row => {
          const tsInfo = toEuropeRomeTimestampAndFormat(row.dateutc); // Ottiene timestamp UTC e ora formattata
          if (!tsInfo) return; // Salta se la conversione del timestamp fallisce

          // Filtra i dati per includere solo quelli delle ultime 24 ore E solo quelli con un intervallo di 5 minuti
          if (tsInfo.timestamp >= twentyFourHoursAgo && (tsInfo.timestamp - lastTimestamp) >= 5 * 60 * 1000) {
            
            // Aggiunge i dati ai rispettivi array, verificando che siano numeri validi
            // Usiamo i dati grezzi per x (timestamp UTC), y e il nome per la serie
            if (typeof row.tempc === "number") {
              const dataPoint = { x: tsInfo.timestamp, y: row.tempc, name: 'Temperatura (°C)' };
              seriesData.temp.push(dataPoint);
              latestData.temp = dataPoint; // Aggiorna il dato più recente
            }
            if (typeof row.windspeedkmh === "number") {
              const dataPoint = { x: tsInfo.timestamp, y: row.windspeedkmh, name: 'Vento (km/h)' };
              seriesData.wind.push(dataPoint);
              latestData.wind = dataPoint;
            }
            if (typeof row.baromrelhpa === "number") {
              const dataPoint = { x: tsInfo.timestamp, y: row.baromrelhpa, name: 'Pressione (hPa)' };
              seriesData.pressure.push(dataPoint);
              latestData.pressure = dataPoint;
            }
            if (typeof row.rainratemm === "number") {
              const dataPoint = { x: tsInfo.timestamp, y: row.rainratemm, name: 'Pioggia (mm/h)' };
              seriesData.rain.push(dataPoint);
              latestData.rain = dataPoint;
            }
            if (typeof row.solarradiation === "number") {
              const dataPoint = { x: tsInfo.timestamp, y: row.solarradiation, name: 'Radiazione solare (W/m²)' };
              seriesData.solar.push(dataPoint);
              latestData.solar = dataPoint;
            }
            
            // Aggiorna il timestamp di riferimento con il timestamp del punto appena aggiunto
            lastTimestamp = tsInfo.timestamp;
          }
        });

        drawCharts(seriesData, latestData); // Passa anche i dati più recenti alla funzione drawCharts
      }
    });
  } catch (err) {
    console.error("Errore durante il recupero o l'analisi del file CSV:", err);
  }
}

// Funzione per disegnare o aggiornare i grafici di Highcharts
function drawCharts(seriesData, latestData) {
  // Calcola il timestamp della mezzanotte di oggi (00:00:00) in fuso orario locale
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Configurazione per ciascun grafico
  const chartConfigs = [
    { renderTo: 'chart-temp', title: 'Temperatura (°C)', data: seriesData.temp, unit: '°C', latestValue: latestData.temp },
    { renderTo: 'chart-wind', title: 'Vento (km/h)', data: seriesData.wind, unit: 'km/h', latestValue: latestData.wind },
    { renderTo: 'chart-pressure', title: 'Pressione (hPa)', data: seriesData.pressure, unit: 'hPa', latestValue: latestData.pressure },
    { renderTo: 'chart-rain', title: 'Pioggia (mm/h)', data: seriesData.rain, unit: 'mm/h', latestValue: latestData.rain },
    { renderTo: 'chart-solar', title: 'Radiazione solare (W/m²)', data: seriesData.solar, unit: 'W/m²', latestValue: latestData.solar }
  ];

  // Se i grafici esistono già, aggiorna solo i dati e i titoli
  if (charts.length) {
    charts.forEach((chart, index) => {
      const config = chartConfigs[index];
      chart.series[0].setData(config.data); // Aggiorna i dati della prima serie del grafico
      // Aggiorna gli estremi dell'asse X per mantenere la finestra temporale di 24 ore
      chart.xAxis[0].setExtremes(todayMidnight, now.getTime(), false, false, { trigger: 'sync' });

      // Aggiorna il titolo del grafico con il dato più recente, formattato a un decimale
      if (config.latestValue) {
        chart.setTitle({ text: `${config.title} (${config.latestValue.y.toFixed(1)}${config.unit})` });
      } else {
        // Se non ci sono dati recenti, reimposta il titolo originale
        chart.setTitle({ text: config.title });
      }
    });
    return; // Esce dalla funzione dopo l'aggiornamento
  }

  // Se i grafici non esistono, creali
  charts = chartConfigs.map((config, index) => {
    return new Highcharts.Chart({
      chart: {
        height: 200,
        zoomType: "x", // Permette lo zoom sull'asse X
        renderTo: config.renderTo, // ID dell'elemento HTML dove disegnare il grafico
        backgroundColor: "#31363b", // Colore di sfondo del grafico
        events: {
          load: function() { // Evento che si scatena quando il grafico è caricato
            const chart = this; // Riferimento al grafico corrente
            // Imposta gli estremi iniziali dell'asse X alle ultime 24 ore, a partire dalla mezzanotte
            chart.xAxis[0].setExtremes(todayMidnight, now.getTime(), true, false, { trigger: 'sync' });

            // Aggiunge listener per mousemove, touchmove e touchstart per sincronizzare i tooltip
            ['mousemove', 'touchmove', 'touchstart'].forEach(eventType => {
              const element = document.getElementById(config.renderTo);
              if (element) {
                element.addEventListener(eventType, e => {
                  let event = chart.pointer.normalize(e); // Normalizza l'evento del puntatore
                  charts.forEach(c => { // Itera su tutti gli altri grafici
                    if (c !== chart) { // Se non è il grafico corrente
                      let point = c.series[0].searchPoint(event, true); // Cerca il punto corrispondente nel grafico
                      if (point) {
                        c.tooltip.refresh(point); // Aggiorna la tooltip dell'altro grafico
                        c.xAxis[0].drawCrosshair(e, point); // Disegna il crosshair sull'asse X
                      }
                    }
                  });
                });
              }
            });
          }
        }
      },
      title: {
        // Imposta il titolo iniziale con il dato più recente, se disponibile
        text: config.latestValue ? `${config.title} (${config.latestValue.y.toFixed(1)}${config.unit})` : config.title
      },
      xAxis: {
        type: "datetime", // Tipo di asse: data e ora
        reversed: false, // Inverte l'asse X (dal più recente al più vecchio)
        crosshair: true, // Mostra una linea verticale che segue il cursore
        labels: {
          // Formattatore per le etichette dell'asse X (solo ora e minuti)
          formatter: function() {
            // Utilizza la nostra funzione di conversione per mostrare l'ora italiana
            const date = new Date(this.value);
            const options = {
              timeZone: 'Europe/Rome',
              hour: '2-digit', minute: '2-digit'
            };
            return new Intl.DateTimeFormat('it-IT', options).format(date);
          }
        },
        events: {
          // Gestisce la sincronizzazione dello zoom/panning tra i grafici
          setExtremes: e => {
            if (e.trigger !== 'sync') { // Evita loop infiniti se l'evento è scatenato da una sincronizzazione interna
              charts.forEach(c => {
                if (c !== chart) c.xAxis[0].setExtremes(e.min, e.max, undefined, false, { trigger: 'sync' }); // Sincronizza gli estremi dell'asse X
              });
            }
          }
        }
      },
      yAxis: {
        title: { text: config.unit }, // Titolo dell'asse Y (l'unità di misura)
        showFirstLabel: false, // Nasconde la prima etichetta sull'asse Y per pulizia
        labels: {
          enabled: true, // Abilita le etichette sull'asse Y per una migliore leggibilità
          // Usa la formattazione globale per un decimale e separatori italiani
          format: `{value:.0f}` // :.1f indica un decimale
        },
        minPadding: 0.05, // Piccolo padding per evitare che i dati tocchino il bordo inferiore
        maxPadding: 0.05, // Piccolo padding per evitare che i dati tocchino il bordo superiore
      },
      series: [{
        type: "line", // Tipo di grafico: linea semplice
        name: config.title, // Nome della serie (usato nella tooltip)
        data: config.data, // I dati da visualizzare
        color: chartColors[index], // Colore della serie
        lineWidth: 1.5, // Aumenta lo spessore della linea
        marker: { enabled: false } // Disabilita i marcatori sui punti dati per un aspetto più pulito
      }]
    });
  });
}

// Gestisce il caricamento di PapaParse se non è già disponibile
if (typeof Papa !== 'undefined') {
  fetchAndDrawCharts(); // Chiama la funzione subito al caricamento
  setInterval(fetchAndDrawCharts, 16000); // Imposta l'aggiornamento automatico ogni 16 secondi
} else {
  // Se PapaParse non è definito, crea dinamicamente un tag script per caricarlo
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js';
  script.onload = () => { // Quando lo script è caricato completamente
    fetchAndDrawCharts(); // Avvia il fetching e il disegno dei grafici
    setInterval(fetchAndDrawCharts, 16000); // Imposta l'aggiornamento automatico
  };
  script.onerror = (e) => { // Gestisce eventuali errori nel caricamento dello script
    console.error("Errore nel caricamento della libreria PapaParse:", e);
  };
  document.head.appendChild(script); // Aggiunge lo script all'header del documento per eseguirlo
}