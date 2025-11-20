let slideIndex = 0;
showSlides();

function showSlides() {
  let i;
  let slides = document.getElementsByClassName("slide");
  
  // Nasconde tutte le slide
  for (i = 0; i < slides.length; i++) {
    slides[i].classList.remove('active');
  }
  
  // Passa alla slide successiva
  slideIndex++;
  if (slideIndex > slides.length) {slideIndex = 1}
  
  // Mostra la slide corrente
  slides[slideIndex-1].classList.add('active');
  
  // Cambia slide ogni 5 secondi (5000 millisecondi)
  setTimeout(showSlides, 5000); 
}

// Funzione opzionale per i controlli manuali (prev/next)
function plusSlides(n) {
  slideIndex += n;
  
  let slides = document.getElementsByClassName("slide");
  if (slideIndex < 1) {slideIndex = slides.length}
  if (slideIndex > slides.length) {slideIndex = 1}
  
  for (let i = 0; i < slides.length; i++) {
    slides[i].classList.remove('active');
  }
  slides[slideIndex-1].classList.add('active');
}