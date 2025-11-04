//*service
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/METEONB/service-worker.js')
      .then(reg => {
        console.log('Service Worker registrato con successo:', reg.scope);
      })
      .catch(err => {
        console.log('Registrazione del Service Worker fallita:', err);
      });
  });

}
