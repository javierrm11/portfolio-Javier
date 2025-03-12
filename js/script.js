document.addEventListener('DOMContentLoaded', () => {
    let meGustas = document.querySelectorAll('.meGusta');
    let retwittear = document.querySelectorAll('.retwittear');
    let comments = document.querySelectorAll('.comentar');
    let faellipsish = document.querySelectorAll('.fa-ellipsis-h');
    meGustas.forEach(meGusta =>{
        console.log(meGusta);
        meGusta.addEventListener('click', () => {
            meGusta.classList.toggle('meGustaActivo');
            meGusta.classList.toggle('fa-solid');
            meGusta.style.color = meGusta.classList.contains('meGustaActivo') ? 'red' : '';
        });
    })
    retwittear.forEach(retwittear =>{
        console.log(retwittear);
        retwittear.addEventListener('click', () => {
            retwittear.classList.toggle('retwittearActivo');
            retwittear.style.color = retwittear.classList.contains('retwittearActivo') ? 'green' : '';
        });
    })
    comments.forEach(comment =>{
        console.log(comment);
        comment.addEventListener('click', () => {
            comment.classList.toggle('comentarActivo');
            comment.classList.toggle('fa-solid');
            comment.style.color = comment.classList.contains('comentarActivo') ? 'blue' : '';
        });
    })
    faellipsish.forEach(faellipsish =>{
        console.log(faellipsish);
        faellipsish.addEventListener('click', () => {
            alert('Ellipsis icon clicked!');
        });
    })

    

});