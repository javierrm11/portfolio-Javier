document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll("#nav ul li a");

    // Obtener la URL actual
    const currentPath = window.location.pathname;

    navLinks.forEach((link) => {
        if (link.href.includes(currentPath)) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
});
