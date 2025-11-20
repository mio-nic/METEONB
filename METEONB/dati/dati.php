<?php
// Includi il file della versione all'inizio
require_once '../version.php'; 
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>MeteoNB</title>
    <link rel="manifest" href="/METEONB/manifest.js">
    <link rel="icon" type="image/x-icon" href="/METEONB/favicon.ico">
    
    <link rel="stylesheet" href="../style.css?v=<?php echo $GLOBAL_VERSION; ?>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">

<style>

/* * AGGIUNTO STILE PER ORDINAMENTO */
.tabella-meteo th {
    cursor: pointer; /* Indica che è cliccabile */
    user-select: none; /* Impedisce la selezione del testo durante il click */
    position: relative;
    /* Aggiungi un piccolo spazio per l'icona se non è già gestito dal padding */
}

/* Stile per l'icona di ordinamento */
.sort-indicator {
    font-weight: bold;
    color: #ffd700; /* Colore dorato per evidenziare l'ordinamento */
}

/* * MEDIA QUERY PER SCROLL ORIZZONTALE (MOBILE)
* Il contenitore della tabella diventa scorrevole solo su schermi piccoli.
*/
@media (max-width: 768px) {
    
    /* Avvolgiamo la tabella in un contenitore che gestisce lo scroll */
    .container { /* Usando .container come classe esterna */
        /* Rimuove padding e margini laterali per massimizzare lo spazio utile */
        padding: 15px 5px; 
        box-shadow: none; /* Rimuove l'ombra per look mobile più pulito */
        width: 100%;
        border-radius: 0;
        /* IMPORTANTE: Non deve esserci overflow-x: hidden qui */
    }

    /* NUOVO: Questo div sarà il vero elemento scorrevole */
    .tabella-wrapper-mobile {
        overflow-x: auto !important; /* Abilita lo scroll orizzontale */
        -webkit-overflow-scrolling: touch; /* Migliora lo scroll su iOS */
    }

    /* La tabella stessa non ha limiti di larghezza, forzando lo scroll nel wrapper */
    .tabella-meteo {
        min-width: 700px; /* Imposta una larghezza minima sufficiente a contenere tutte le colonne */
    }
    
    /* Adattamenti estetici minori per il mobile */
    .tabella-meteo th, .tabella-meteo td {
        padding: 10px 8px; /* Riduci il padding delle celle */
        font-size: 0.85em;
    }
}


</style>

</head>
<body class="dark-theme">
    <div class="container">
        <div class="title-container" id="titleContainer">
            <h>Lista live delle stazioni meteo</h>
        </div>  
        
        <div class="tabella-wrapper-mobile"> 
            <table class="tabella-meteo">
                <thead>
                    <tr>
                        
                        <th>Luogo</th>
                        <th>Temperatura</th>
                        <th>Umidità</th>
                        <th>Pressione</th>
                        <th>Vento</th>
                        <th>Tasso Pioggia</th> 
                        <th>Pioggia Totale</th>
                        <th>Solare</th>
                    </tr>
                </thead>
                <tbody id="corpo-tabella-meteo">
                    <tr>
                        <td colspan="8">Caricamento dati in corso...</td> 
                    </tr>
                </tbody>
            </table>
        </div> </div>

    
    <div class="bottom-nav">
        <a href="/METEONB/index.php" class="nav-button">
            <i class="fas fa-home"></i>
            <span>HOME</span>
        </a>
        <a href="/METEONB/notizie/notizie.php" class="nav-button active">
            <i class="fas fa-database"></i>
            <span>NOTIZIE</span>
        </a>
        <a href="/METEONB/pre/pre.php" class="nav-button">
            <i class="fas fa-satellite-dish"></i>
            <span>ALLERTA</span>
        </a>
        <a href="/METEONB/altro/altro.php" class="nav-button">
            <i class="fas fa-ellipsis-h"></i>
            <span>ALTRO</span>
        </a>
    </div>
    

    <script src="dati.js?v=<?php echo $GLOBAL_VERSION; ?>"></script> 
 
    
</body>
</html>