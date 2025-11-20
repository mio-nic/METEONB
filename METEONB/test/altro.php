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
    <link rel="manifest" href="/METEONB/manifest.json">
    <link rel="icon" type="image/x-icon" href="/METEONB/favicon.ico">
    <link rel="stylesheet" href="../style.css?v=<?php echo $GLOBAL_VERSION; ?>"> 
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">

    <style>
      /* ------------------------------------- */
/* BASE E DARK THEME (Desktop/Default) */
/* ------------------------------------- */
body {
    background-color: #1a1a1a;
    color: #f0f0f0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    
    /* ATTIVA IL CENTRAMENTO FLEXBOX SOLO PER DESKTOP/DEFAULT */
    display: flex; 
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

/* ------------------------------------- */
/* STILE MENU CENTRALIZZATO (Desktop/Default) */
/* ------------------------------------- */
.menu-container {
    width: 100%; /* Larghezza massima del contenitore */
    max-width: 600px;
    padding: 20px;
    background-color: #2c2c2c; /* Sfondo del contenitore più scuro */
    border-radius: 15px;
    /* Ombra esterna (Effetto 3D / Luce indiretta) */
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 50px rgba(100, 100, 255, 0.2);
    text-align: center;
}

.menu-container h1 {
    color: white; /* Colore accento per il titolo */
    /* Ombra per il testo (Effetto Luce al Neon) */
    text-shadow: 0 0 5px #00bcd4, 0 0 10px #00bcd4;
    margin-bottom: 20px;
}

.menu-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.menu-list li {
    /* AUMENTO DI SPAZIO: 20px sopra e sotto ogni pulsante */
    margin: 20px 0;
}

/* ------------------------------------- */
/* STILE LINK (I BOTTONI) */
/* ------------------------------------- */
.menu-list a {
    display: block;
    padding: 15px 25px; /* Leggero aumento del padding verticale */
    text-decoration: none;
    color: #f0f0f0;
    font-size: 1.2em;
    letter-spacing: 1px;
    background-color: #3a3a3a; /* Sfondo del bottone */
    border-radius: 8px;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.5);
}

.menu-list a:hover {
    background-color: #00bcd4; /* Colore accento al passaggio del mouse */
    color: #1a1a1a; /* Testo scuro in hover */
    /* Effetto di 'sollevamento' e luce intensa */
    transform: translateY(-3px);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 188, 212, 0.6);
    /* Ombra per il testo in hover (effetto luce) */
    text-shadow: 0 0 3px #fff;
}

.menu-list a:active {
    /* Effetto click */
    transform: translateY(0);
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.7);
}



</style>
  
</head>
<body style="height: 100vh; margin: 0; padding: 0;">
    <div class="menu-container">

        <h1>Navigazione Principale</h1>
<ul class="menu-list">
    <li><a href="https://www.pwsweather.com/station/pws/rustega">STAZIONE</a></li>
    <li><a href="https://neige.meteociel.fr/satellite/anim_ir_color.gif">SATELLITE</a></li>
    <li><a href="https://www.tropicaltidbits.com/analysis/models/?model=ecmwf&region=eu&pkg=z500_mslp">MAPPE</a></li>
    <li><a href="https://starwalk.space/it/moon-calendar">ASTRONOMIA</a></li>
    <li><a href="blog.html">NOTIZIE</a></li>
    <li><a href="../dati/dati.php">STATISTICHE</a></li>
    <li><a href="blog.html">STATISTICHE</a></li>
</ul>
    </div>
    

    
        <div class="bottom-nav">
        <a href="/METEONB/index.php" class="nav-button">
            <i class="fas fa-home"></i>
            <span>HOME</span>
        </a>
        <a href="/METEONB/notizie/notizie.php" class="nav-button">
            <i class="fas fa-database"></i>
            <span>NOTIZIE</span>
        </a>
        <a href="/METEONB/pre/pre.php" class="nav-button">
            <i class="fas fa-satellite-dish"></i>
            <span>STAZIONE</span>
        </a>
        <a href="/METEONB/altro/altro.php" class="nav-button active">
            <i class="fas fa-ellipsis-h"></i>
            <span>ALTRO</span>
        </a>
    </div>
    


 
    
</body>
</html>