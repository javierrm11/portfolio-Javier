document.addEventListener('DOMContentLoaded', () => {
    let meGustas = document.querySelectorAll('.meGusta');
    console.log("meGustas", meGustas);
    meGustas.forEach(meGusta =>{
        console.log(meGusta);
        meGusta.addEventListener('click', () => {
            meGusta.classList.toggle('meGustaActivo');
            meGusta.classList.toggle('fa-solid');
            meGusta.style.color = meGusta.classList.contains('meGustaActivo') ? 'red' : '';
        });
    })
});