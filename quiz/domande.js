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
        options: ["500 hPa", "760 hPa", "1013 hPa", "1200 hPa"],
        answer: "1013 hPa"
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
    },
    {
    question: "Quale strato dell'atmosfera contiene la maggior parte dell'ozono che assorbe la radiazione UV?",
    options: ["Troposfera", "Stratosfera", "Mesosfera", "Termosfera"],
    answer: "Stratosfera"
},
{
    question: "Come viene chiamato il processo di trasformazione del vapore acqueo in acqua liquida nelle nubi?",
    options: ["Sublimazione", "Evaporazione", "Condensazione", "Convezione"],
    answer: "Condensazione"
},
{
    question: "Quale tra queste è una nube di sviluppo verticale, spesso associata ai temporali?",
    options: ["Cirrostrato", "Nembostrato", "Cumulonembo", "Alto Cumulo"],
    answer: "Cumulonembo"
},
{
    question: "Cosa misura un pluviometro?",
    options: ["La pressione atmosferica", "La quantità di precipitazioni (pioggia)", "L'umidità relativa", "L'intensità della luce solare"],
    answer: "La quantità di precipitazioni (pioggia)"
},
{
    question: "Il fenomeno dell'effetto Foehn (o Favonio) è associato a...",
    options: ["Venti freddi e umidi in discesa", "Venti caldi e secchi in discesa lungo il versante sottovento di una montagna", "Aree di alta pressione stazionarie", "Raffreddamento radiativo notturno"],
    answer: "Venti caldi e secchi in discesa lungo il versante sottovento di una montagna"
},
{
    question: "Cos'è la 'isobara' su una mappa meteorologica?",
    options: ["Una linea che congiunge punti di uguale pressione atmosferica", "Una linea che congiunge punti di uguale temperatura", "Una linea che congiunge punti di uguale velocità del vento", "Una linea che congiunge punti di uguale precipitazione"],
    answer: "Una linea che congiunge punti di uguale pressione atmosferica"
},
{
    question: "In quale emisfero la rotazione dei cicloni (aree di bassa pressione) avviene in senso antiorario?",
    options: ["Emisfero Australe", "Emisfero Boreale", "Non dipende dall'emisfero", "Solo all'equatore"],
    answer: "Emisfero Boreale"
},
{
    question: "La 'Scala Beaufort' classifica...",
    options: ["L'intensità dei terremoti", "La velocità del vento in base agli effetti osservati", "L'acidità della pioggia", "L'altezza delle onde marine"],
    answer: "La velocità del vento in base agli effetti osservati"
},
{
    question: "Quale principio fisico spiega la deviazione dei venti a causa della rotazione terrestre?",
    options: ["Legge di Boyle", "Legge di Pascal", "Forza di Coriolis", "Legge di Hooke"],
    answer: "Forza di Coriolis"
},
{
    question: "La temperatura alla quale l'aria è *attualmente* rispetto al punto di rugiada è correlata a quale misurazione?",
    options: ["Pressione atmosferica", "Umidità relativa", "Temperatura effettiva", "Altezza della base delle nubi"],
    answer: "Umidità relativa"
},
{
    question: "Qual è il nome dato alla regione di calma o venti deboli vicino all'equatore, dove convergono gli Alisei?",
    options: ["Horse Latitudes", "Jet Stream", "Zona di Convergenza Intertropicale (ITCZ)", "Cella di Hadley"],
    answer: "Zona di Convergenza Intertropicale (ITCZ)"
},
{
    question: "Un fronte occluso si verifica quando...",
    options: ["Un fronte freddo e uno caldo si muovono alla stessa velocità", "Un fronte caldo raggiunge un fronte stazionario", "Un fronte freddo supera un fronte caldo", "L'aria calda solleva l'aria fredda"],
    answer: "Un fronte freddo supera un fronte caldo"
},
{
    question: "Quale fenomeno ottico è causato dalla rifrazione della luce solare attraverso le goccioline d'acqua dopo la pioggia?",
    options: ["Corona", "Alone", "Miraggio", "Arcobaleno"],
    answer: "Arcobaleno"
},
{
    question: "Qual è la componente predominante del vapore acqueo nell'atmosfera?",
    options: ["Ossigeno", "Azoto", "Idrogeno", "Acqua (H2O)"],
    answer: "Acqua (H2O)"
},
{
    question: "I venti che si sviluppano a livello locale, come la Brezza di Terra e la Brezza di Mare, sono causati da...",
    options: ["Forza di Coriolis", "Fattori stagionali", "Differenze di riscaldamento tra terra e mare", "L'influenza del Jet Stream"],
    answer: "Differenze di riscaldamento tra terra e mare"
},
{
    question: "L'unità di misura utilizzata per l'altezza delle nubi o l'altitudine è generalmente...",
    options: ["Metri", "Nodi", "Gradi Celsius", "Litri"],
    answer: "Metri"
},
{
    question: "Un 'Anticiclone' è un'area di...",
    options: ["Bassa pressione", "Alta pressione", "Temperatura elevata", "Forte umidità"],
    answer: "Alta pressione"
},
{
    question: "Quale strumento viene utilizzato per misurare l'umidità dell'aria?",
    options: ["Barometro", "Igrometro", "Anemometro", "Piranometro"],
    answer: "Igrometro"
},
{
    question: "La radiazione che la Terra emette verso lo spazio (a onda lunga) è principalmente nella forma di...",
    options: ["Raggi Gamma", "Luce Visibile", "Infrarossi Termici", "Ultravioletti"],
    answer: "Infrarossi Termici"
},
{
    question: "La 'Scala Saffir-Simpson' è utilizzata per classificare l'intensità di quale fenomeno meteorologico?",
    options: ["Tornado", "Tempeste di neve", "Uragani", "Ondate di calore"],
    answer: "Uragani"
},
{
    question: "Il fenomeno El Niño è associato principalmente al riscaldamento anomalo delle acque superficiali in quale oceano?",
    options: ["Oceano Atlantico Settentrionale", "Oceano Indiano", "Oceano Pacifico Tropicale Orientale", "Oceano Artico"],
    answer: "Oceano Pacifico Tropicale Orientale"
},
{
    question: "Il vapore acqueo nell'atmosfera si trova principalmente nello stato di...",
    options: ["Liquido", "Solido", "Gassoso", "Plasma"],
    answer: "Gassoso"
},
{
    question: "Le nubi 'Nembostrati' sono tipicamente associate a che tipo di precipitazione?",
    options: ["Grandine e forti temporali", "Pioggia o neve continua e leggera", "Rovesci isolati", "Piogge acide"],
    answer: "Pioggia o neve continua e leggera"
},
{
    question: "L'energia necessaria per l'evaporazione dell'acqua è chiamata...",
    options: ["Calore specifico", "Calore sensibile", "Calore latente di vaporizzazione", "Temperatura potenziale"],
    answer: "Calore latente di vaporizzazione"
},
{
    question: "L'unità di misura Hertz (Hz) è talvolta usata per descrivere quale proprietà dei fulmini?",
    options: ["La loro lunghezza", "La loro frequenza (quante volte al secondo)", "La loro temperatura", "La loro energia potenziale"],
    answer: "La loro frequenza (quante volte al secondo)"
},
{
    question: "Come viene chiamato il vento che in Italia soffia da sud-est, spesso portando aria calda e umida?",
    options: ["Maestrale", "Tramontana", "Scirocco", "Libeccio"],
    answer: "Scirocco"
},
{
    question: "Qual è il nome dato alla linea che congiunge i punti di uguale altitudine su una mappa topografica, non meteorologica?",
    options: ["Isobare", "Isoterme", "Isoipsa (o Curva di livello)", "Isobata"],
    answer: "Isoipsa (o Curva di livello)"
},
{
    question: "Il fenomeno della 'inversione termica' si verifica quando...",
    options: ["La temperatura diminuisce con l'altezza più velocemente del normale", "La temperatura aumenta con l'altezza", "La pressione diminuisce rapidamente", "Il vento cambia direzione improvvisamente"],
    answer: "La temperatura aumenta con l'altezza"
},
{
    question: "Qual è il nome dello strato atmosferico immediatamente sopra la Stratosfera?",
    options: ["Troposfera", "Mesosfera", "Termosfera", "Esosfera"],
    answer: "Mesosfera"
},
{
    question: "La differenza tra umidità assoluta e umidità relativa è che l'umidità relativa considera...",
    options: ["Solo l'acqua liquida", "La temperatura dell'aria", "La pressione atmosferica", "La presenza di inquinanti"],
    answer: "La temperatura dell'aria"
},
{
    question: "I venti prevalenti della media latitudine che soffiano da ovest verso est sono noti come:",
    options: ["Alisei", "Venti polari", "Westerlies (Venti occidentali)", "Brezze"],
    answer: "Westerlies (Venti occidentali)"
},
{
    question: "Cosa si intende per 'Albedo' terrestre in meteorologia?",
    options: ["L'emissione di calore della Terra", "Il grado di assorbimento della luce solare", "Il rapporto tra la radiazione solare riflessa e quella incidente", "La temperatura media globale"],
    answer: "Il rapporto tra la radiazione solare riflessa e quella incidente"
},
{
    question: "Quale tipo di fronte meteorologico è generalmente associato a precipitazioni intense ma di breve durata, seguite da un calo di temperatura?",
    options: ["Fronte caldo", "Fronte stazionario", "Fronte freddo", "Fronte occluso"],
    answer: "Fronte freddo"
},
{
    question: "Il 'Jet Stream' è una corrente di vento veloce che si trova principalmente in quale strato atmosferico?",
    options: ["Troposfera superiore e Stratosfera inferiore", "Mesosfera", "Termosfera", "Solo nella Troposfera inferiore"],
    answer: "Troposfera superiore e Stratosfera inferiore"
},
{
    question: "La nebbia che si forma quando l'aria calda e umida si muove su una superficie più fredda è chiamata nebbia da:",
    options: ["Irraggiamento", "Avvezione", "Evaporazione", "Pendio"],
    answer: "Avvezione"
},
{
    question: "Per 'gradiente barico' si intende...",
    options: ["La variazione di temperatura con l'altitudine", "La variazione di pressione atmosferica nello spazio orizzontale", "La variazione di umidità", "La velocità massima del vento"],
    answer: "La variazione di pressione atmosferica nello spazio orizzontale"
},
{
    question: "Il processo di 'sublimazione' in meteorologia si riferisce al passaggio diretto da...",
    options: ["Liquido a gas", "Gas a liquido", "Solido a gas (o viceversa)", "Liquido a solido"],
    answer: "Solido a gas (o viceversa)"
},
{
    question: "Quale gas è il più abbondante nell'atmosfera terrestre?",
    options: ["Ossigeno", "Anidride Carbonica", "Azoto", "Argon"],
    answer: "Azoto"
},
{
    question: "Le nubi che si formano tra i 2000 e i 7000 metri di altitudine sono classificate come nubi di tipo...",
    options: ["Basse", "Medie", "Alte", "Verticali"],
    answer: "Medie"
},
{
    question: "Cosa causa il suono del 'tuono' durante un temporale?",
    options: ["L'impatto del fulmine sul terreno", "La rapida espansione e contrazione dell'aria riscaldata dal fulmine", "Il crollo della nube cumulonembo", "La vibrazione dei cristalli di ghiaccio"],
    answer: "La rapida espansione e contrazione dell'aria riscaldata dal fulmine"
},
{
    question: "Come viene chiamato il sistema di nubi e venti che si sviluppa attorno a un'area di bassa pressione?",
    options: ["Anticiclone", "Ciclone (o Depressione)", "Fronte", "Inversione"],
    answer: "Ciclone (o Depressione)"
},
{
    question: "Il termometro a bulbo umido e bulbo secco è usato per calcolare...",
    options: ["Solo la temperatura", "Solo la pressione", "La velocità del vento", "L'umidità relativa"],
    answer: "L'umidità relativa"
},
{
    question: "Quale dei seguenti non è considerato un gas serra primario?",
    options: ["Anidride Carbonica)", "Metano", "Azoto", "Ossido di Azoto"],
    answer: "Azoto"
},
{
    question: "La forza che contrasta la Forza di Coriolis e che agisce sempre perpendicolarmente alle isobare verso la bassa pressione è la:",
    options: ["Forza di gravità", "Forza di attrito", "Forza di gradiente di pressione", "Forza centrifuga"],
    answer: "Forza di gradiente di pressione"
},
{
    question: "I fenomeni di Aurora Boreale e Australe avvengono principalmente in quale strato atmosferico?",
    options: ["Troposfera", "Stratosfera", "Mesosfera", "Termosfera (o Ionosfera)"],
    answer: "Termosfera (o Ionosfera)"
},
{
    question: "La pioggia che congela all'impatto con il terreno (o un oggetto) è chiamata...",
    options: ["Pioviggine", "Neve granulosa", "Pioggia congelante", "Rugiada"],
    answer: "Pioggia congelante"
},
{
    question: "Quale strumento viene utilizzato per misurare la quantità di radiazione solare?",
    options: ["Barometro", "Igrometro", "Piranometro", "Altimetro"],
    answer: "Piranometro"
},
{
    question: "Il processo di accrescimento di cristalli di ghiaccio o goccioline d'acqua nelle nubi è noto come...",
    options: ["Nucleazione", "Cristallogenesi", "Convezione", "Diffusione"],
    answer: "Cristallogenesi"
}
];

