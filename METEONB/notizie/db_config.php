<?php
// ===============================================
// FILE: db_config.php - Configurazione Connessione MySQL
// ===============================================

// 1. Definisci le Costanti (Modifica i placeholder con i tuoi dati reali)
define('DB_HOST', 'sql.meteofree.altervista.org'); // L'host fornito da Altervista
define('DB_USER', 'meteofree');                     // Il tuo nome utente Altervista
define('DB_PASS', 'XAtwdSJ53vTG');        // La password che hai impostato
define('DB_NAME', 'my_meteofree');                     // Il tuo nome utente Altervista (solitamente)

// 2. Tenta la Connessione al Database
// Utilizziamo la classe mysqli per una connessione sicura e moderna
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// 3. Controllo dell'Errore di Connessione
if ($conn->connect_error) {
    // Se la connessione fallisce, interrompi lo script e mostra un messaggio (solo in fase di debug)
    die("Connessione al database fallita: " . $conn->connect_error);
    
    // In produzione (dopo il debug), potresti mostrare un messaggio generico:
    // die("Siamo spiacenti, il servizio è temporaneamente non disponibile.");
}

// 4. Imposta la Codifica dei Caratteri
// Questo è fondamentale per gestire correttamente caratteri speciali e accenti (es. à, è, ò)
$conn->set_charset("utf8mb4");

// A questo punto, la variabile $conn contiene l'oggetto connessione attiva
// e può essere utilizzata in crea.php e notizie.php.
?>