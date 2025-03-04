document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('traducir').addEventListener('click', function() {
        // Verificar si el script ya está cargado
        if (!document.getElementById('google_translate_script')) {
            let script = document.createElement('script');
            script.id = 'google_translate_script'; // Evitar múltiples cargas
            script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            document.body.appendChild(script);
        } else {
            // Si ya está cargado, inicializa la traducción
            googleTranslateElementInit();
        }
    });
});

// Esta función se ejecuta automáticamente cuando la API se carga
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'es', // Define el idioma original de la página (por ejemplo, español 'es')
        includedLanguages: 'en', // Solo inglés disponible
        autoDisplay: false // No mostrar el selector
    }, 'google_translate_element');

    // Forzar la traducción al inglés
    let translateElement = document.querySelector('.goog-te-combo');
    if (translateElement) {
        translateElement.value = 'en';
        translateElement.dispatchEvent(new Event('change'));
    }
}
