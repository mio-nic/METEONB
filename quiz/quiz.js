/**
 * =================================================================
 * QUIZ.JS - LOGICA E STILI ESSENZIALI DEL QUIZ SUL METEO
 * Lo stile è ridotto al minimo e si basa sul file style.css esterno.
 * =================================================================
 */

// NOTA BENE: Questo file si aspetta che l'array 'allQuestions' sia definito
// nel file 'domande.js' che deve essere caricato PRIMA di questo script in quiz.html.

// Costante per il numero di domande da visualizzare
const NUMBER_OF_QUESTIONS = 10; 

// Variabili di Configurazione (Mantengo solo quelle specifiche del quiz)
const QUIZ_VARIABLES = {
    '--correct-color': '#2ecc71', // Verde
    '--wrong-color': '#e74c3c',  // Rosso
    '--title-color-active': '#FFD700'
};

// -------------------------------------------------------------
// FUNZIONE HELPER: Mescola un array
// Usata sia per le domande che per le opzioni
// -------------------------------------------------------------
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
// -------------------------------------------------------------


// -------------------------------------------------------------
// LOGICA: SELEZIONE CASUALE DELLE DOMANDE (Invariata)
// -------------------------------------------------------------
let selectedQuestions = [];

/**
 * Seleziona un numero specificato di domande casuali dall'array completo.
 */
function selectRandomQuestions(sourceArray, numQuestions) {
    if (sourceArray.length <= numQuestions) {
        return [...sourceArray];
    }
    
    // Usa la funzione di shuffling per selezionare un sottoinsieme casuale
    const shuffled = shuffleArray(sourceArray);
    
    // Restituisce solo le prime 'numQuestions' domande
    return shuffled.slice(0, numQuestions);
}
// -------------------------------------------------------------


// 3. Stato del Quiz e Riferimenti DOM
let currentQuestionIndex = 0;
let score = 0;
let answered = false;

// Variabili per il DOM
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextButton = document.getElementById('next-button');
const questionNumberDisplay = document.getElementById('question-number');
const quizContainer = document.getElementById('quiz-container');
const resultScreen = document.getElementById('result-screen');
const finalScoreDisplay = document.getElementById('final-score');
const scoreDescriptionDisplay = document.getElementById('score-description');


/**
 * Funzione per iniettare SOLO gli stili CSS specifici del quiz nel documento. (Invariata)
 */
function injectStyles() {
    const style = document.createElement('style');
    let css = `
        /* Aggiungo le variabili specifiche del quiz al root se style.css non le ha */
        :root {
            --correct-color: ${QUIZ_VARIABLES['--correct-color']};
            --wrong-color: ${QUIZ_VARIABLES['--wrong-color']};
            --title-color-active: ${QUIZ_VARIABLES['--title-color-active']};
        }

        /* 1. Stile per l'Header del Quiz */
        .quiz-header {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            max-width: 980px; 
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            padding: 15px 10px;
            box-sizing: border-box;
            border-bottom: 1px solid var(--border-color);
            background-color: var(--chart-bg-color); 
        }

        .quiz-header .title-container {
            flex-grow: 1; 
            padding: 0; 
            margin: 0;
            text-align: center;
        }

        .quiz-header h {
            color: var(--text-color);
            font-size: 1.8em; 
            margin: 0;
            text-shadow: 0 0 5px rgba(66, 161, 255, 0.4);
            flex-direction: column;
        }

        /* Pulsante Indietro (Modificato il left per distaccarlo) */
        .back-button-page {
            position: absolute;
            left: 25px; 
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-color); 
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
            z-index: 10;
        }

        .back-button-page:hover {
            color: var(--primary-color);
        }

        /* 2. Stili specifici del Contenuto del Quiz */
        .quiz-container-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            padding-bottom: 60px;
        }

        .quiz-container {
            max-width: 600px;
            width: 90%;
            margin-top: 20px;
        }

        .question-card {
            background-color: var(--chart-bg-color);
            border: 1px solid var(--border-color);
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 0 15px rgba(66, 161, 255, 0.2);
            text-align: center;
        }
        
        .question-text {
            font-size: 1.2em;
            margin: 20px 0;
            color: var(--text-color);
            font-weight: 500;
        }

        .options-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 20px;
        }

        /* Stili Pulsanti Risposta (Opzioni) */
        .option-button {
            background-color: var(--table-row-odd-bg);
            color: var(--text-color);
            border: 1px solid var(--border-color);
            padding: 15px 20px;
            text-align: left;
            font-size: 1em;
            cursor: pointer;
            border-radius: 8px;
            transition: background-color 0.3s, border-color 0.3s;
            user-select: none;
            width: 100%;
        }

        .option-button:hover:not(:disabled) {
            background-color: var(--table-row-even-bg);
            border-color: var(--primary-color);
        }

        /* Colori Risposta */
        .option-button.correct {
            background-color: var(--correct-color);
            border-color: var(--correct-color);
            color: var(--background-color);
            font-weight: bold;
        }

        .option-button.wrong {
            background-color: var(--wrong-color);
            border-color: var(--wrong-color);
            color: var(--background-color);
            font-weight: bold;
        }

        .option-button:disabled {
            cursor: default;
            opacity: 0.7;
        }

        /* Pulsante Prossima Domanda */
        .next-button {
            margin-top: 25px;
            padding: 12px 25px;
            background-color: var(--button-bg-color);
            color: var(--text-color);
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: 600;
            transition: background-color 0.3s;
            width: auto;
        }

        .next-button:hover {
            background-color: var(--button-hover-color);
        }

        .hidden {
            display: none !important;
        }

        /* Stili Risultato */
        .result-title {
            color: var(--title-color-active);
            font-size: 2em;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
        }

        .final-score {
            font-size: 1.5em;
            color: var(--primary-color);
            margin: 15px 0 25px 0;
            font-weight: 700;
        }

        .score-description {
            background-color: var(--table-row-even-bg);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            text-align: center;
            font-size: 1.1em;
            border: 1px solid var(--primary-color);
        }

        .score-description p {
            margin: 5px 0;
            line-height: 1.4;
        }

        /* Pulsante Riprova */
        .back-button { 
            margin-top: 15px;
            padding: 12px 25px;
            background-color: var(--correct-color);
            color: var(--background-color);
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: 600;
            transition: background-color 0.3s;
            width: auto;
        }

        .back-button:hover {
            background-color: #27ae60;
        }
        
        /* Media Query: Adattamento mobile per l'header del quiz */
        @media (max-width: 520px) {
            .quiz-header {
                padding: 10px 5px;
                
            }
            .quiz-header h {
                font-size: 1.5em;
            }
            /* Aumentato il distacco mobile */
            .back-button-page {
                left: 15px; 
                padding-bottom: 50px;
            }
        }
    `;
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Carica e visualizza la domanda corrente.
 */
function loadQuestion() {
    const totalQuestions = selectedQuestions.length;

    if (currentQuestionIndex >= totalQuestions) {
        showResult();
        return;
    }

    answered = false;
    const currentQ = selectedQuestions[currentQuestionIndex]; 

    // Nasconde la schermata dei risultati se è visibile (nel caso di Riprova)
    resultScreen.classList.add('hidden');
    quizContainer.classList.remove('hidden');

    // Aggiorna testo domanda e numero
    questionNumberDisplay.textContent = `Domanda ${currentQuestionIndex + 1} / ${totalQuestions}`;
    questionText.textContent = currentQ.question;
    
    // Pulisce le opzioni precedenti
    optionsContainer.innerHTML = '';
    
    // Nasconde il pulsante "Prossima Domanda"
    nextButton.classList.add('hidden');
    
    // 🛑 NUOVA LOGICA: MESCOLA LE OPZIONI PRIMA DI VISUALIZZARLE
    const shuffledOptions = shuffleArray(currentQ.options);
    
    // Crea i pulsanti delle opzioni usando l'array mescolato
    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        // Importante: passiamo la risposta corretta originale (currentQ.answer) alla funzione selectAnswer
        button.onclick = () => selectAnswer(button, option, currentQ.answer);
        optionsContainer.appendChild(button);
    });
}

/**
 * Gestisce la selezione di una risposta. (Invariata)
 */
function selectAnswer(selectedButton, selectedOption, correctAnswer) {
    if (answered) return;
    
    answered = true;
    let isCorrect = selectedOption === correctAnswer;
    
    if (isCorrect) {
        score++;
        selectedButton.classList.add('correct');
    } else {
        selectedButton.classList.add('wrong');
        Array.from(optionsContainer.children).forEach(button => {
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            }
        });
    }

    Array.from(optionsContainer.children).forEach(button => {
        button.disabled = true;
    });

    nextButton.textContent = (currentQuestionIndex === selectedQuestions.length - 1) ? "Visualizza Risultato 🎉" : "Prossima Domanda →";
    nextButton.classList.remove('hidden');
}

/**
 * Funzione globale per passare alla prossima domanda (chiamata dal HTML). (Invariata)
 */
window.nextQuestion = function() {
    currentQuestionIndex++;
    loadQuestion();
}

/**
 * Visualizza la schermata dei risultati. (Invariata)
 */
function showResult() {
    quizContainer.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    finalScoreDisplay.textContent = `Hai totalizzato ${score} punti su ${selectedQuestions.length}.`;
    
    let descriptionHTML = '';
    const percentage = (score / selectedQuestions.length) * 100;
    
    if (percentage === 100) {
        descriptionHTML = `
            <p style="color: var(--correct-color);">🌟 **Perfetto! Genio del Meteo!** 🌟</p>
            <p>Con ${score} risposte esatte, le tue conoscenze sulla meteorologia sono eccezionali. Non hai rivali!</p>
        `;
    } else if (percentage >= 70) {
        descriptionHTML = `
            <p style="color: var(--primary-color);">✨ **Ottimo Lavoro!** ✨</p>
            <p>Con ${score} risposte esatte, hai dimostrato una solida comprensione del tempo atmosferico. Ben fatto!</p>
        `;
    } else if (percentage >= 40) {
        descriptionHTML = `
            <p style="color: var(--secondary-text-color);">🌤️ **Discreto Inizio!** 🌤️</p>
            <p>Con ${score} risposte esatte, hai delle buone basi, ma c'è ancora spazio per migliorare! Continua a studiare.</p>
        `;
    } else {
        descriptionHTML = `
            <p style="color: var(--wrong-color);">🌧️ **Riprova!** 🌧️</p>
            <p>Con ${score} risposte esatte, è ora di dare una rinfrescata alle tue conoscenze sul meteo. Non scoraggiarti, il prossimo giro andrà meglio!</p>
        `;
    }

    scoreDescriptionDisplay.innerHTML = descriptionHTML;
}

/**
 * Funzione di inizializzazione principale (Invariata)
 */
function initializeQuiz() {
    if (typeof allQuestions === 'undefined' || allQuestions.length === 0) {
        questionText.textContent = "Errore: File 'domande.js' non caricato o array 'allQuestions' è vuoto.";
        return;
    }

    // Seleziona le 10 domande casuali
    selectedQuestions = selectRandomQuestions(allQuestions, NUMBER_OF_QUESTIONS);

    // Resetta lo stato del quiz
    currentQuestionIndex = 0;
    score = 0;
    answered = false;

    // Carica gli stili e la prima domanda
    injectStyles();
    loadQuestion();
}

// Inizializzazione: Chiama la funzione di setup all'avvio
document.addEventListener('DOMContentLoaded', initializeQuiz);