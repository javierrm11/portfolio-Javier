document.addEventListener("DOMContentLoaded", () => {
    const espana = document.getElementById('espana');
    const ingles = document.getElementById('ingles');

    // Función para traducir el contenido de la página
    const translatePage = (languageCode) => {
        const bodyContent = document.body.innerHTML; // Obtiene todo el contenido HTML de la página

        // Envía el contenido al servicio de traducción
        fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: bodyContent,
                source: 'auto', // Detecta automáticamente el idioma
                target: languageCode, // El idioma al que se va a traducir
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.translatedText) {
                // Reemplaza todo el contenido de la página con la traducción
                document.body.innerHTML = data.translatedText;
            }
        })
        .catch(error => console.error('Error al traducir el texto:', error));
    };

    // Traducir al español
    espana.addEventListener("click", () => {
        console.log('Traducir a español');
        translatePage('es'); // Traducir a español
    });

    // Traducir al inglés
    ingles.addEventListener("click", () => {
        translatePage('en'); // Traducir a inglés
    });
});
