// Funzione per aprire il menu laterale
function openNav() {
    const sidebar = document.getElementById("sidebarMenu");
    const overlay = document.getElementById("sidebarOverlay");

    // Imposta la larghezza del menu (es. 250px)
    sidebar.style.width = "250px"; 
    
    // Mostra l'overlay per oscurare lo sfondo
    overlay.style.display = "block"; 
}

// Funzione per chiudere il menu laterale
function closeNav() {
    const sidebar = document.getElementById("sidebarMenu");
    const overlay = document.getElementById("sidebarOverlay");
    
    // Chiude il menu
    sidebar.style.width = "0"; 
    
    // Nasconde l'overlay
    overlay.style.display = "none"; 
}

// Aggiunge gli ascoltatori di eventi solo quando il DOM è completamente caricato
document.addEventListener('DOMContentLoaded', (event) => {
    // Apri il menu cliccando l'icona hamburger
    const openBtn = document.getElementById("openSidebar");
    if (openBtn) {
        openBtn.addEventListener('click', openNav);
    }

    // Chiudi il menu cliccando il pulsante 'x'
    const closeBtn = document.getElementById("closeSidebar");
    if (closeBtn) {
        closeBtn.addEventListener('click', closeNav);
    }

    // Chiudi il menu cliccando sull'overlay (lo sfondo scuro)
    const overlay = document.getElementById("sidebarOverlay");
    if (overlay) {
        overlay.addEventListener('click', closeNav);
    }
});