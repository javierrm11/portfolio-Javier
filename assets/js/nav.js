document.addEventListener("DOMContentLoaded",function(){const navLinks=document.querySelectorAll("#nav ul li a");let currentPath=window.location.pathname;navLinks.forEach((link)=>{let linkPath=new URL(link.href).pathname;if((currentPath==="/"||currentPath==="/index.html")&&(linkPath==="/"||linkPath==="/index.html")){link.classList.add("active");}else if(currentPath!=="/"&&currentPath===linkPath){link.classList.add("active");}else{link.classList.remove("active");}});});