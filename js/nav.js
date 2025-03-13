document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll("#nav ul li a");

    // Obtener la URL actual sin el dominio
    let currentPath = window.location.pathname;

    navLinks.forEach((link) => {
        // Extraer solo el pathname del enlace (sin el dominio)
        let linkPath = new URL(link.href).pathname;

        // Caso especial para la página de inicio
        if ((currentPath === "/" || currentPath === "/index.html") && (linkPath === "/" || linkPath === "/index.html")) {
            link.classList.add("active");
        } else if (currentPath !== "/" && currentPath === linkPath) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
});
