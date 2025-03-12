document.addEventListener("DOMContentLoaded", () => {
    const darkMode = document.querySelector("#modo-toogle");
    const body = document.body;

    // Comprobar si hay una preferencia guardada en localStorage
    const darkModePreference = localStorage.getItem("darkMode");

    if (darkModePreference === "enabled") {
        body.classList.add("active"); // Activar el modo oscuro si está guardado
    } else if (darkModePreference === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add("active"); // Activar el modo oscuro según la configuración del sistema
    }

    darkMode.addEventListener("click", () => {
        body.classList.toggle("active"); // Cambiar de tema al hacer clic

        // Guardar la preferencia en localStorage
        if (body.classList.contains("active")) {
            localStorage.setItem("darkMode", "enabled");
        } else {
            localStorage.setItem("darkMode", "disabled");
        }
    });
});
