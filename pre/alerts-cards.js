/* eslint-disable */
// alerts-cards.js
// Aggiornato per utilizzare i dati parsificati (Array di Oggetti) forniti da all.js.

// Importa le funzioni dal modulo centrale
import { getParsedData } from '../pre/all.js'; 

// Elemento contenitore delle card
const container = document.getElementById('alerts-container');


// --- 1. MAPPATURA ALLERTE CON DESCRIZIONI E CHIAVI ---

const ALERT_LEVELS = [
    { color: '#4CAF50', name: 'Nessuna Allerta', description: 'Nessun pericolo rilevato. Le condizioni sono normali.' },    
    { color: '#FFEB3B', name: 'Allerta Bassa', description: 'Monitoraggio richiesto. Potrebbero verificarsi disagi minori.' },      
    { color: '#FF9800', name: 'Allerta Moderata', description: 'Rischio significativo. Si raccomanda cautela e preparazione.' },    
    { color: '#F44336', name: 'Allerta Alta', description: 'Pericolo elevato. Si consiglia vivamente di adottare misure di protezione immediate.' },        
    { color: '#9C27B0', name: 'Allerta Massima', description: 'Pericolo estremo. Rimanere in luogo sicuro e seguire le istruzioni delle autorità.' }
];

// Le chiavi nel codice JS devono essere normalizzate (tutto minuscolo e senza spazi/caratteri speciali)
// per corrispondere a quelle generate da all.js.
const ALERT_ICONS = {
    "allertacaldo": "fa-thermometer-half",
    "allertafreddo": "fa-icicles",
    "allertaneve": "fa-snowflake",
    "allertapioggia": "fa-cloud-showers-heavy", 
    "allertavento": "fa-wind",
    "allertatemporale": "fa-bolt", 
    "default": "fa-exclamation-triangle"
};

// Mappa per convertire la chiave normalizzata (del dato) nel titolo descrittivo (da visualizzare)
const ALERT_TITLES = {
    "allertacaldo": "Allerta Caldo",
    "allertafreddo": "Allerta Freddo",
    "allertaneve": "Allerta Neve",
    "allertapioggia": "Allerta Pioggia",
    "allertavento": "Allerta Vento",
    "allertatemporale": "Allerta Temporale"
};


// --- 2. FUNZIONI PER GESTIRE IL MODALE CUSTOM ---

/**
 * Funzione per creare e mostrare il modale custom.
 */
function showCustomModal(title, level, levelName, description, color) {
    let modal = document.getElementById('custom-alert-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'custom-alert-modal';
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'custom-alert-modal') {
                modal.style.display = 'none';
            }
        });
    }

    modal.innerHTML = `
        <div class="modal-content" style="border-top: 5px solid ${color};">
            <span class="close-btn">&times;</span>
            <h3 class="modal-title">${title}</h3>
            <p><strong>Livello:</strong> ${level} (${levelName})</p>
            <p><strong>Descrizione:</strong></p>
            <p class="modal-description">${description}</p>
        </div>
    `;
    
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.style.display = 'flex';
}


// --- 3. CSS INIETTATO ---
const CSS_STYLES = `
/* Stili Base per il corpo della pagina */

h1 {
    color: #3c3c3c;
    text-align: center;
    margin-top: 0 !important;  
    margin-bottom: 20px !important;  
}

/* Stili per il Modale (Pop-up Custom) */
#custom-alert-modal {
    display: none; /* Nascosto di default */
    position: fixed;  
    z-index: 9999; /* Alto z-index per sovrapporsi a tutto */
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.6); /* Sfondo semi-trasparente */
    justify-content: center;
    align-items: center;
}

.modal-content {
    background-color: #292933; /* Sfondo scuro come il tema */
    color: #fff;
    margin: auto;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    width: 80%;
    max-width: 400px;    
    position: relative;
    animation: fadeIn 0.3s;
}

.modal-title {
    color: #fff;
    margin-top: 5px;
    font-size: 1.3em;
}

.modal-description {
    line-height: 1.4;
    font-size: 0.9em;
}

.close-btn {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    position: absolute;
    top: 5px;
    right: 10px;
}

.close-btn:hover,
.close-btn:focus {
    color: #fff;
    text-decoration: none;
    cursor: pointer;
}

@keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}

/* Stili Card */
#alerts-container {
    display: flex;
    flex-wrap: nowrap;  
    gap: 10px;  
    justify-content: center;
    overflow-x: auto;  
    margin-top: 5px !important;  
    margin-bottom: 5px !important;
}

#alerts-container .alert-card {
    background-color: #3c3c3c;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    padding: 10px !important;  
    margin: 0 !important;  
    height: auto !important;  
    text-align: center;
    width: 150px !important;  
    min-width: 150px !important;  
    position: relative;
    flex-shrink: 0;  
    
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;  
}

/* Cerchio e Icona */
.alert-icon-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;  
    height: 40px;
    border-radius: 50%;  
    background-color: transparent;  
    border-style: solid;  
    border-width: 3px;  
    margin-bottom: 5px;  
    margin-top: 5px;  
}
#alerts-container .alert-icon {
    font-size: 1.5em;  
    color: #fff;  
}
#alerts-container .alert-title {
    font-size: 0.8em;
    margin-top: 5px;  
    color: #ffffff;
    font-weight: 600;
}

/* Stili Mobile (560px) */
@media (max-width: 560px) {  
    body { padding: 0px; }
    #alerts-container {
        flex-wrap: nowrap !important;  
        overflow-x: auto !important;  
        justify-content: flex-start;  
        gap: 5px;  
    }
    #alerts-container .alert-card {
        padding: 3px !important;  
        width: 65px !important;  
        min-width: 65px !important;  
    }
    .alert-icon-circle {
        width: 30px;  
        height: 30px;
        border-width: 2px;
        margin-bottom: 3px;  
        margin-top: 3px;
    }
    #alerts-container .alert-icon { font-size: 0.9em; }
    #alerts-container .alert-title { font-size: 0.6em; margin-top: 3px; }
    
    /* Modale su Mobile */
    .modal-content {
        width: 90%;
        margin: 10px;
    }
}
`;

function injectStyles() {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = CSS_STYLES;
    document.head.appendChild(styleSheet);
}
injectStyles();


// --- 4. LOGICA DI CREAZIONE CARD ---

function createAlertCard(title, level) {
    const card = document.createElement('div');
    card.className = 'alert-card';

    const maxLevel = ALERT_LEVELS.length - 1;
    const effectiveLevel = Math.min(Math.max(0, level), maxLevel);
    const alertInfo = ALERT_LEVELS[effectiveLevel];
    
    // Normalizza la chiave per la ricerca dell'icona (questa logica è corretta)
    const iconKey = title.trim().toLowerCase().replace(/ /g, '').replace(/[^\w]/g, ''); 
    
    // Trova l'icona usando la chiave normalizzata
    const iconClass = ALERT_ICONS[iconKey] || ALERT_ICONS["default"];
    
    // Icona e Cerchio
    const iconCircle = document.createElement('div');
    iconCircle.className = 'alert-icon-circle';
    iconCircle.style.borderColor = alertInfo.color;  
    iconCircle.innerHTML = `<i class="fas ${iconClass} alert-icon"></i>`;  
    card.appendChild(iconCircle);

    // Titolo dell'allerta
    const titleElement = document.createElement('div');
    titleElement.className = 'alert-title';
    titleElement.textContent = title.trim();
    card.appendChild(titleElement);

    // Gestore di eventi click che chiama showCustomModal
    card.addEventListener('click', () => {
        showCustomModal(
            title.trim(), 
            level,  
            alertInfo.name,  
            alertInfo.description,  
            alertInfo.color
        );
    });

    container.appendChild(card);
}


// --- 5. FUNZIONE PRINCIPALE PER IL RECUPERO E IL RENDERING (CORRETTA) ---

async function fetchAndRenderAlerts() {
    if (!container) {
        console.error("Elemento 'alerts-container' non trovato.");
        return;
    }
    
    // Mostra un caricamento temporaneo
    container.innerHTML = '<p style="text-align: center; color: #aaa;">Caricamento allerte...</p>';

    try {
        // 1. Recupera i dati parsati da all.js (fetch con caching)
        const parsedData = await getParsedData(); 

        // CONTROLLO CRUCIALE: Se i dati non sono validi o vuoti, genera errore gestibile.
        if (!parsedData || parsedData.length === 0) {
             throw new Error("Dati parsati non disponibili o foglio vuoto dopo il filtro.");
        }
        
        // Prendiamo i dati della riga corrente (la prima riga dei dati, indice 0)
        const currentData = parsedData[0];
        
        // Le chiavi delle allerte nel set di dati normalizzato (minuscole, senza spazi)
        // Dobbiamo includere tutte le chiavi che vogliamo visualizzare come card.
        const alertKeys = [
            "allertacaldo", 
            "allertafreddo", 
            "allertavento", 
            "allertapioggia", 
            "allertatemporale",
            "allertaneve" 
        ];
        
        // Pulisce il container prima di inserire le nuove card
        container.innerHTML = ''; 

        // 2. Itera sulle chiavi di allerta e crea le card
        alertKeys.forEach(key => {
            const levelValue = currentData[key];
            const level = parseInt(levelValue, 10);
            
            // Usiamo la mappa ALERT_TITLES per trovare il titolo leggibile
            const titleToDisplay = ALERT_TITLES[key] || key.replace('allerta', 'Allerta ');

            // Crea la card se il livello è un numero valido (incluso 0) e il titolo esiste
            if (!isNaN(level) && titleToDisplay) {
                createAlertCard(titleToDisplay, level);
            }
        });
        
        // Non è più necessario il codice di fallback se tutte le card vengono create.

    } catch (error) {
        console.error("Errore nel recupero dei dati delle allerte da all.js:", error);
        container.innerHTML = '<p style="color: red; text-align: center;">Impossibile caricare i dati delle allerte. Controllare la console per i dettagli.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("[Alerts-Cards] Avvio fetch dati delle card.");
    // Esecuzione immediata
    fetchAndRenderAlerts();
});