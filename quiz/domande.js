/**
 * =================================================================
 * DOMANDE.JS - ARRAY COMPLETO DI TUTTE LE DOMANDE DEL QUIZ
 * Per aggiungere una nuova domanda:
 * 1. Copia l'ultima entry {question: "...", options: [...], answer: "..."}.
 * 2. Incolla la nuova entry prima dell'ultima parentesi quadra (]) e prima del punto e virgola (;).
 * 3. Assicurati che ogni entry sia separata da una virgola.
 * =================================================================
 */
const allQuestions = [
    {
        question: "Qual è l'unità di misura standard della pressione atmosferica nel sistema internazionale (SI)?",
        options: ["Kelvin", "Pascal", "Joule", "Watt"],
        answer: "Pascal"
    },
    {
        question: "Quale strumento viene utilizzato per misurare la velocità del vento?",
        options: ["Termometro", "Barometro", "Anemometro", "Igrometro"],
        answer: "Anemometro"
    },
    {
        question: "Le nubi 'Cirri' sono composte principalmente da...",
        options: ["Goccioline d'acqua", "Cristalli di ghiaccio", "Vapore acqueo", "Polvere e fumo"],
        answer: "Cristalli di ghiaccio"
    },
    {
        question: "Qual è il nome del vento che soffia dalla terra verso il mare durante la notte?",
        options: ["Brezza di mare", "Brezza di terra", "Tramontana", "Scirocco"],
        answer: "Brezza di terra"
    },
    {
        question: "A quale tipo di precipitazione è associata la grandine?",
        options: ["Pioggia stratiforme", "Pioviggine", "Rovesci (a carattere temporalesco)", "Nebbia"],
        answer: "Rovesci (a carattere temporalesco)"
    },
    {
        question: "Qual è il gas serra più abbondante nell'atmosfera terrestre?",
        options: ["Anidride Carbonica ", "Metano ", "Ossido di Azoto ", "Vapore Acqueo "],
        answer: "Vapore Acqueo "
    },
    {
        question: "Cosa indica un rapido calo della pressione barometrica?",
        options: ["Tempo sereno", "Avvicinamento di un'area di alta pressione", "Arrivo di una perturbazione o maltempo", "Aumento dell'umidità"],
        answer: "Arrivo di una perturbazione o maltempo"
    },
    {
        question: "Il 'punto di rugiada' è la temperatura alla quale l'aria deve essere raffreddata per raggiungere...",
        options: ["Il punto di ebollizione", "Il punto di congelamento", "La saturazione (100% di umidità relativa)", "La pressione atmosferica standard"],
        answer: "La saturazione (100% di umidità relativa)"
    },
    {
        question: "Quale fenomeno meteorologico è definito come una vasta area di bassa pressione attorno a un nucleo caldo?",
        options: ["Tornado", "Tromba d'aria", "Uragano (o Ciclone/Tifone)", "Tempesta di neve"],
        answer: "Uragano (o Ciclone/Tifone)"
    },
    {
        question: "Il colore del cielo al tramonto è causato principalmente da...",
        options: ["Riflessione", "Diffrazione", "Rifrazione", "Dispersione di Rayleigh"],
        answer: "Dispersione di Rayleigh"
    },
    // Aggiungi qui le tue nuove domande, sempre separate da virgole
    {
        question: "Qual è il simbolo che rappresenta la velocità del vento su una mappa sinottica?",
        options: ["Isobare", "Isoterme", "Barbe e frecce", "Simboli frontali"],
        answer: "Barbe e frecce"
    },
    {
        question: "Come viene chiamata una linea che connette punti di uguale temperatura su una mappa meteorologica?",
        options: ["Isobare", "Isolinea", "Isoterma", "Isobata"],
        answer: "Isoterma"
    },
    {
        question: "Quale fenomeno ottico-meteorologico è causato dalla rifrazione della luce solare attraverso i cristalli di ghiaccio sospesi nell'atmosfera?",
        options: ["L'arcobaleno", "La corona", "L'alone solare (o lunare)", "La fata Morgana"],
        answer: "L'alone solare (o lunare)"
    },
    {
        question: "In che strato dell'atmosfera avvengono la maggior parte dei fenomeni meteorologici, come pioggia e vento?",
        options: ["Stratosfera", "Troposfera", "Mesosfera", "Termosfera"],
        answer: "Troposfera"
    },
    {
        question: "Il sistema di classificazione dei venti che utilizza i nomi dei punti cardinali e intercardinali è chiamato...",
        options: ["Scala Beaufort", "Rosa dei Venti", "Scala Saffir-Simpson", "Indice Palmer"],
        answer: "Rosa dei Venti"
    },
    {
        question: "Cos'è la nebbia dal punto di vista meteorologico?",
        options: ["Una nube di alta quota", "Una nube al livello del suolo", "Vapore acqueo trasparente", "Particelle di polvere in sospensione"],
        answer: "Una nube al livello del suolo"
    },
    {
        question: "Quale tipo di fronte meteorologico si verifica quando una massa d'aria fredda avanza e solleva rapidamente l'aria calda?",
        options: ["Fronte caldo", "Fronte stazionario", "Fronte freddo", "Fronte occluso"],
        answer: "Fronte freddo"
    },
    {
        question: "Il valore medio di pressione atmosferica a livello del mare (standard) è di circa...",
        options: ["500 hPa", "760 hPa", "1013,25 hPa", "1200 hPa"],
        answer: "1013,25 hPa"
    },
    {
        question: "Qual è la principale fonte di energia che guida il sistema meteorologico terrestre?",
        options: ["Il calore geotermico", "L'energia lunare", "La radiazione solare", "Le forze mareali"],
        answer: "La radiazione solare"
    },
    {
        question: "I venti prevalenti che soffiano da est verso ovest nelle regioni tropicali e equatoriali sono noti come:",
        options: ["Westerlies (Venti occidentali)", "Jet Stream", "Alisei", "Venti polari"],
        answer: "Alisei"
    },
    {
        question: "Quale misurazione viene effettuata tramite un pallone sonda (radiosonda)?",
        options: ["La velocità di rotazione terrestre", "Le correnti oceaniche", "I dati atmosferici verticali (temperatura, umidità, pressione)", "L'inquinamento atmosferico superficiale"],
        answer: "I dati atmosferici verticali (temperatura, umidità, pressione)"
    }
];