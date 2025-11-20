<?php
// FILE: crea.php
// Gestisce l'upload delle immagini e l'inserimento/cancellazione delle notizie nel database.

// 1. INCLUSIONE CONFIGURAZIONE DB
// Assicurati che 'db_config.php' contenga la variabile $conn con la connessione attiva.
require_once 'db_config.php';

$message = '';
$upload_dir = 'img/'; // ASSICURATI che questa cartella esista su Altervista!

// --- GESTIONE CANCELLAZIONE NOTIZIA ---
if (isset($_GET['delete_id']) && is_numeric($_GET['delete_id'])) {
    $delete_id = $conn->real_escape_string($_GET['delete_id']);
    $news_to_delete_title = ''; // Variabile per salvare il titolo prima della cancellazione

    // 1. Prima di cancellare dal DB, recupera il path dell'immagine e il titolo
    $sql_select = "SELECT titolo, immagine_path FROM notizie WHERE id = '$delete_id'";
    $result_select = $conn->query($sql_select);

    if ($result_select && $result_select->num_rows > 0) {
        $row = $result_select->fetch_assoc();
        $image_path_to_delete = $row['immagine_path'];
        $news_to_delete_title = $row['titolo'];

        // 2. Query SQL di CANCELLAZIONE
        $sql_delete = "DELETE FROM notizie WHERE id = '$delete_id'";

        if ($conn->query($sql_delete) === TRUE) {
            // 3. Cancella l'immagine fisica se esiste e non è vuota
            if (!empty($image_path_to_delete) && file_exists($image_path_to_delete)) {
                // Tentativo di cancellazione del file
                unlink($image_path_to_delete); 
                // Nota: non controlliamo strettamente il successo di unlink, ma il messaggio può indicarlo
            }

            // Reindirizzamento per aggiornare la lista e mostrare il messaggio di successo
            header("Location: crea.php?status=deleted&title=" . urlencode($news_to_delete_title));
            exit(); 

        } else {
            // Errore DB nella cancellazione
            $message = "Errore durante la cancellazione della notizia: " . $conn->error;
        }
    } else {
        // Notizia non trovata
        $message = "Errore: Notizia con ID $delete_id non trovata.";
    }
}
// --- FINE GESTIONE CANCELLAZIONE ---


// Controlla se il modulo di INSERIMENTO è stato inviato tramite POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // --- GESTIONE UPLOAD IMMAGINE ---
    $image_path = ''; // Inizializza il percorso per il database
    
    if (isset($_FILES['newsFile']) && $_FILES['newsFile']['error'] === UPLOAD_ERR_OK) {
        
        $file_tmp_name = $_FILES['newsFile']['tmp_name'];
        $file_name = $_FILES['newsFile']['name'];
        $file_extension = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif'];
        
        // 1.1 Validazione estensione
        if (!in_array($file_extension, $allowed_extensions)) {
            $message = "Errore: Solo file JPG, JPEG, PNG e GIF sono permessi.";
            goto end_script;
        }

        // 1.2 Genera un nome file univoco (sicurezza contro sovrascritture)
        $new_file_name = uniqid('news_', true) . '.' . $file_extension;
        $file_destination = $upload_dir . $new_file_name;

        // 1.3 Sposta il file
        if (move_uploaded_file($file_tmp_name, $file_destination)) {
            $image_path = $file_destination;
        } else {
            $message = "Errore: Impossibile caricare il file. Controlla i permessi della cartella '$upload_dir'.";
            goto end_script; 
        }
    }
    
    // --- INSERIMENTO DATI NEL DATABASE ---
    
    // 2. Sanitizzazione dei dati testuali
    $title = $conn->real_escape_string($_POST['newsTitle']);
    $content = $conn->real_escape_string($_POST['newsContent']);
    
    // 3. Query SQL di INSERIMENTO (Usa data_creazione)
    $sql = "INSERT INTO notizie (titolo, contenuto, immagine_path, data_creazione) 
            VALUES ('$title', '$content', '$image_path', NOW())"; 
            
    if ($conn->query($sql) === TRUE) {
        // Reindirizzamento per mostrare il messaggio di successo e ricaricare la pagina
        header("Location: crea.php?status=success&title=" . urlencode($title));
        exit(); 
    } else {
        $message = "Errore durante l'inserimento nel database: " . $conn->error;
        // In caso di errore DB, l'immagine caricata resta, ma non è grave qui.
    }
}

// --- GESTIONE MESSAGGI DOPO REINDIRIZZAMENTO ---
if (isset($_GET['status'])) {
    $title_display = htmlspecialchars($_GET['title'] ?? 'Record');
    if ($_GET['status'] == 'success') {
        $message = "Notizia \"$title_display\" caricata con successo! ✅";
    } elseif ($_GET['status'] == 'deleted') {
        $message = "Notizia \"$title_display\" cancellata con successo! 🗑️";
    }
    // Rimuovi i parametri GET per pulire l'URL (opzionale ma pulito)
    // Non lo facciamo qui per semplicità, ma il reindirizzamento risolve già il loop.
}


// Inizializza l'array per le notizie
$latest_news = [];

// --- RECUPERO ULTIME 5 NOTIZIE (USANDO data_creazione) ---
$sql_latest = "SELECT id, titolo, data_creazione FROM notizie ORDER BY data_creazione DESC LIMIT 5";
$result_latest = $conn->query($sql_latest);

if ($result_latest && $result_latest->num_rows > 0) {
    while ($row = $result_latest->fetch_assoc()) {
        $latest_news[] = $row;
    }
}
// --- FINE RECUPERO ULTIME 5 NOTIZIE ---


end_script:
// Chiudi la connessione al database
$conn->close();
?>

<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crea Nuova Notizia</title>
    <link rel="stylesheet" href="../style.css"> 
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        /* Stili per il form */
        .form-container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: var(--container-bg-color, #333); 
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            color: var(--text-color, #fff);
        }
        .form-container label {
            display: block;
            margin-top: 15px;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-container input[type="text"],
        .form-container textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--border-color, #555);
            border-radius: 4px;
            box-sizing: border-box;
            background-color: var(--background-color, #222);
            color: var(--text-color, #fff);
        }
        .form-container input[type="file"] {
             width: 100%;
             padding: 10px 0;
             border: none;
        }
        .form-container button {
            background-color: #28a745; 
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
            font-size: 1.1em;
            transition: background-color 0.3s;
        }
        .form-container button:hover {
            background-color: #218838;
        }
        /* Stili per la lista delle ultime notizie */
        .latest-news-list {
            max-width: 600px;
            margin: 30px auto;
            padding: 20px;
            background-color: var(--container-bg-color, #333);
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            color: var(--text-color, #fff);
        }
        .latest-news-list h2 {
            border-bottom: 2px solid var(--border-color, #555);
            padding-bottom: 10px;
            margin-bottom: 15px;
            text-align: center;
        }
        .news-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px dashed var(--border-color, #444);
        }
        .news-item:last-child {
            border-bottom: none;
        }
        .news-info {
            flex-grow: 1;
        }
        .news-title {
            font-weight: bold;
            display: block;
            max-width: 75%; 
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .news-date {
            font-size: 0.8em;
            color: #aaa;
        }
        .delete-btn {
            background-color: #dc3545; 
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
            transition: background-color 0.3s;
            text-decoration: none;
            font-size: 0.9em;
        }
        .delete-btn:hover {
            background-color: #c82333;
        }
    </style>
</head>
<body class="news-page">
    
    <header class="news-page-header">
        <h1>Inserisci Nuova Notizia</h1>
        <a href="notizie.php" style="color: var(--title-color-active); text-decoration: none; font-size: 1.2em; float: right; margin-top: 10px;">&lt; Torna alle Notizie</a>
    </header>

    <div class="form-container">
        
        <?php if ($message): ?>
            <p style='color: <?php echo (strpos($message, 'successo') !== false || strpos($message, 'cancellata') !== false) ? '#28a745' : '#dc3545'; ?>; 
                        font-weight: bold; 
                        text-align: center;
                        padding-bottom: 10px;'>
                <?php echo htmlspecialchars($message); ?>
            </p>
        <?php endif; ?>

        <form method="POST" action="crea.php" enctype="multipart/form-data">
            
            <label for="newsTitle">Titolo Notizia:</label>
            <input type="text" id="newsTitle" name="newsTitle" required>
            
            <label for="newsContent">Contenuto/Argomento:</label>
            <textarea id="newsContent" name="newsContent" rows="5" required></textarea>
            
            <label for="newsFile">Carica Immagine:</label>
            <input type="file" id="newsFile" name="newsFile" accept="image/*" required>
            
            <button type="submit">Pubblica Notizia</button>
        </form>
    </div>

<div class="latest-news-list">
    <h2><i class="fas fa-list-ul"></i> Ultime 5 Notizie Pubblicate</h2>
    <?php if (empty($latest_news)): ?>
        <p style="text-align: center; color: #aaa;">Nessuna notizia trovata nel database.</p>
    <?php else: ?>
        <?php foreach ($latest_news as $news): ?>
            <div class="news-item">
                <div class="news-info">
                    <span class="news-title" title="<?php echo htmlspecialchars($news['titolo']); ?>">
                        <?php echo htmlspecialchars($news['titolo']); ?> (ID: <?php echo $news['id']; ?>)
                    </span>
                    <span class="news-date">
                        Creazione: <?php echo date('d/m/Y H:i', strtotime($news['data_creazione'])); ?>
                    </span>
                </div>
                <a href="crea.php?delete_id=<?php echo $news['id']; ?>" 
                   onclick="return confirm('Sei sicuro di voler cancellare la notizia: \'<?php echo addslashes(htmlspecialchars($news['titolo'])); ?>\'? L\'azione è irreversibile e cancellerà anche l\'immagine fisica.');" 
                   class="delete-btn">
                    <i class="fas fa-trash"></i> Cancella
                </a>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</div>
<div class="bottom-nav">
    </div>
    
    <footer class="footer">
        <p>&copy; 2025 MeteoNotizie. Tutti i diritti riservati.</p>
    </footer>

</body>
</html>