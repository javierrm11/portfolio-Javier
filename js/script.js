document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("meGusta").addEventListener("click", () => {
        document.getElementById("meGusta").classList.remove("fa-regular");
        document.getElementById("meGusta").classList.add("fa-solid");
        document.getElementById("meGusta").style.color = "red";
    });
});