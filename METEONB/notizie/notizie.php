<?php
// FILE: notizie.php

// 1. HEADER ANTI-CACHE PER BROWSER
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// 2. AGGIUNGI QUESTO: Istruisce i proxy e i server a non usare la cache basata su intestazioni
header("Vary: *"); 

// Include la connessione al database
require_once 'db_config.php'; 

// Definisce una variabile per la cache busting
$version = time();

// ===========================================
// BLOCCO 1: RECUPERO SOLO LE ULTIME 10 NOTIZIE
// ===========================================
$sql = "SELECT id, titolo, contenuto, immagine_path, data_creazione FROM notizie 
        ORDER BY data_creazione DESC 
        LIMIT 10";

$result = $conn->query($sql);

$news_data = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $news_data[] = $row;
    }
}
$conn->close();
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>MeteoNB - Canale Notizie</title>
    <link rel="manifest" href="/METEONB/manifest.json">
    <link rel="icon" type="image/x-icon" href="/METEONB/favicon.ico">
    
    <link rel="stylesheet" href="../style.css?v=<?php echo $version; ?>"> 
    <link rel="stylesheet" href="notizie.css?v=<?php echo $version; ?>">  
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body class="news-page">

    <header class="generic-page-header">
    <button onclick="history.back()" class="back-button-page">
        <i class="fas fa-arrow-left"></i>
    </button>
               <div class="title-container" id="titleContainer">
                <h>NOTIZIE</h>
            </div>
</header>

    <main class="news-main-content">
        
        <section class="news-list">
            

            <?php if (!empty($news_data)): ?>
                <?php foreach ($news_data as $row): 
                    $data = date('d/m/Y H:i', strtotime($row["data_creazione"]));
                    $titolo = htmlspecialchars($row["titolo"]);
                    $contenuto = htmlspecialchars($row["contenuto"]);
                    $immagine = htmlspecialchars($row["immagine_path"]);
                ?>
                
                <article class="news-item" 
                         onclick="openModal(
                            '<?php echo $titolo; ?>', 
                            '<?php echo $immagine; ?>', 
                            '<?php echo str_replace(["\r\n", "\r", "\n"], '\n', htmlspecialchars($row["contenuto"], ENT_QUOTES)); ?>',
                            '<?php echo $data; ?>'
                         )">
                    
                    <?php if (!empty($immagine)): ?>
                        <img src="<?php echo $immagine; ?>" alt="<?php echo $titolo; ?>">
                    <?php endif; ?>
                    
                    <h3><?php echo $titolo; ?></h3>
                    <p>
                        <?php echo $contenuto; ?>
                    </p>
                    <p><i class="far fa-clock"></i> Pubblicato il: <?php echo $data; ?></p>
                </article>

                <?php endforeach; ?>
            <?php else: ?>
                <p>Non ci sono notizie da mostrare. Inseriscine una da <a href='crea.php'>qui</a>!</p>
            <?php endif; ?>
            
        </section>

    </main>
    
    <div id="newsModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2 id="modal-title"></h2>
            <p><i class="far fa-clock"></i> Pubblicato il: <span id="modal-date"></span></p>
            <img id="modal-image" src="" alt="Immagine Notizia">
            <p id="modal-content"></p>
        </div>
    </div>
    
    
    
    <footer class="footer">
        <p>&copy; 2025 MeteoNotizie. Tutti i diritti riservati.</p>
    </footer>

    <script>
        // Funzione per aprire il modale
        function openModal(title, image, content, date) {
            const modal = document.getElementById('newsModal');
            document.getElementById('modal-title').innerText = title;
            document.getElementById('modal-date').innerText = date;
            
            const modalImage = document.getElementById('modal-image');
            const modalContent = document.getElementById('modal-content');
            
            // Imposta il contenuto testuale
            modalContent.innerText = content; 

            // Gestione dell'immagine
            if (image && image.trim() !== '') {
                modalImage.src = image;
                modalImage.style.display = 'block';
            } else {
                modalImage.style.display = 'none';
                modalImage.src = '';
            }
            
            modal.style.display = "block";
        }

        // Funzione per chiudere il modale
        function closeModal() {
            const modal = document.getElementById('newsModal');
            modal.style.display = "none";
        }

        // Chiudi il modale cliccando fuori
        window.onclick = function(event) {
            const modal = document.getElementById('newsModal');
            if (event.target == modal) {
                closeModal();
            }
        }
    </script>
    <script src="notizie.js?v=<?php echo $version; ?>"></script> 
</body>
</html>