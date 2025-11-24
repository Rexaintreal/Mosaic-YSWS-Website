const temp = document.getElementById('connect')

function stop(){
    temp.style.display = "none";
}

stop();

const checkbox = document.getElementById('review-status');
const checkbox2 = document.getElementById('shipped-status');

checkbox.addEventListener("click", e => e.preventDefault());
checkbox2.addEventListener("click", e => e.preventDefault());

const open = document.getElementById('open');
const projectBox = document.getElementById('project-box');
const hidden = document.getElementById('hidden');
let isOpen = false;
open.addEventListener("click", ()=>{
    if (!isOpen){
        hidden.style.display = "block";
        projectBox.style.height = "150px";
        projectBox.style.transition = "all 0.3s ease";
        isOpen = true;
    } else {
        hidden.style.display = "none";
        projectBox.style.height = "30px";
        projectBox.style.transition = "all 0.3s ease";
        isOpen = false;
    }
})