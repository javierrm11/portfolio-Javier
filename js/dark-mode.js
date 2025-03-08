document.addEventListener("DOMContentLoaded", () => {
    const darkMode = document.querySelector("#modo-toogle");
    const body = document.body;

    // Comprobar si el usuario prefiere el modo oscuro según su configuración del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add("active"); // Activar el modo oscuro al cargar
    }

    darkMode.addEventListener("click", () => {
        body.classList.toggle("active"); // Cambiar de tema al hacer clic
    });
    
});
