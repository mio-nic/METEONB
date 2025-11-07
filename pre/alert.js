// alert.js
import { getParsedData } from '../pre/all.js'; 

/**
 * Funzione per renderizzare il messaggio di allerta nell'elemento HTML.
 * @param {Array<Object>} parsedData Array di oggetti con i dati di previsione parsati.
 */
const renderAlertMessage = (parsedData) => {
    const alertStatusElement = document.getElementById('currentTempStatus');
    
    // Cerchiamo i dati di allerta nella prima riga di dati (ora corrente)
    const currentAlertData = parsedData.length > 0 ? parsedData[0] : null;

    if (!alertStatusElement) {
        console.error("Elemento HTML con ID 'currentTempStatus' non trovato.");
        return;
    }
    
    // Il check su currentAlertData è fondamentale se parsedData è []
    if (!currentAlertData) {
        console.warn("Dati di allerta non disponibili (array dati vuoto).");
        alertStatusElement.innerHTML = `
            <div class="alert-scroll-container">
                <div class="alert-content alert-info">
                    ❓ Dati di allerta non disponibili.
                </div>
            </div>
        `;
        return;
    }

    // Estrazione dei dati: 'livelloallerta' e 'scritta' sono le chiavi normalizzate
    const alertLevel = parseInt(currentAlertData.livelloallerta, 10);
    let alertMessage = currentAlertData.scritta;
    let alertClass = '';

    // Mappatura del livello di allerta alle classi CSS
    switch (alertLevel) {
        case 1:
            alertClass = 'alert-1'; // Basso rischio
            break;
        case 2:
            alertClass = 'alert-2'; // Rischio moderato
            break;
        case 3:
            alertClass = 'alert-3'; // Rischio significativo
            break;
        case 4:
            alertClass = 'alert-4'; // Rischio elevato
            break;
        case 5:
            alertClass = 'alert-5'; // Rischio estremo
            break;
        default:
            alertClass = 'alert-info'; // Nessun livello specifico
            if (!alertMessage || alertMessage.trim() === '') {
                 alertMessage = "Nessuna allerta significativa al momento.";
            }
    }

    // Aggiorna l'elemento HTML
    alertStatusElement.innerHTML = `
        <div class="alert-scroll-container">
            <div class="alert-content ${alertClass}">
                ${alertMessage}
            </div>
        </div>
    `;
};

/**
 * Funzione principale per recuperare i dati da all.js e renderizzare l'allerta.
 */
const initAlerts = async () => {
    try {
        // Chiama la funzione di fetch (ora è immediata e usa la chiave 'valori' corretta)
        const data = await getParsedData(); 
        
        // **AGGIUNTO/CORRETTO**: Controllo esplicito sui dati vuoti (anche se la funzione all.js lo fa, questo è più sicuro)
        if (!data || data.length === 0) {
            throw new Error("Il foglio non contiene righe di previsione oltre l'intestazione.");
        }
        
        // Renderizza il messaggio con i dati parsati
        renderAlertMessage(data); 

    } catch (error) {
        // Gestione degli errori sollevati da all.js (es. Errore HTTP o dati non parsabili)
        console.error('Si è verificato un errore nel caricamento dei dati di allerta:', error);
        const alertStatusElement = document.getElementById('currentTempStatus');
        
        // Visualizza l'errore in modo visibile all'utente
        if (alertStatusElement) {
            alertStatusElement.innerHTML = `
                <div class="alert-scroll-container">
                    <div class="alert-content alert-error">
                        ❌ Errore critico nel caricamento: ${error.message || 'Controlla la console per i dettagli.'}
                    </div>
                </div>
            `;
        }
    }
};

// Avvia l'inizializzazione immediatamente dopo che il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Alert] Avvio fetch dati allerta principale.");
    initAlerts();
});