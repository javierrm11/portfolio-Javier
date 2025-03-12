document.addEventListener('DOMContentLoaded', () => {
    const espana = document.getElementById('espana');
    const ingles = document.getElementById('ingles');

    if(localStorage.getItem('lang')){
        translate(localStorage.getItem('lang'));
    }

    espana.addEventListener('click', () => translate('es'));
    ingles.addEventListener('click', () => translate('en'));
});

function translate(lang) {
    localStorage.setItem('lang', lang);
    const elements = document.querySelectorAll('[data-es], [data-en]');
    elements.forEach(element => {
        element.textContent = element.getAttribute(`data-${lang}`);
    });
}