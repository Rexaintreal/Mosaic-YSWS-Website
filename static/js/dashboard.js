const temp = document.getElementById('connect')

function stop(){
    temp.style.display = "none";
}

stop();

const reviewCheckbox = document.querySelectorAll('.review-status');
const shippedCheckbox = document.querySelectorAll('.shipped-status');

reviewCheckbox.forEach(checkbox =>{
    checkbox.addEventListener("click", (e) => e.preventDefault())
});

shippedCheckbox.forEach(checkbox => {
    checkbox.addEventListener("click", (e) => e.preventDefault())
});

const openButtons = document.querySelectorAll(".open");

openButtons.forEach(openButton =>{
    const projectBox = openButton.closest('.project-box');
    const hiddenDetails = projectBox ? projectBox.querySelector('.hidden') :  null;
    let isOpen = false;
    if (projectBox && hiddenDetails){
        openButton.addEventListener("click", ()=>{
            if (!isOpen) {
                setTimeout(()=>{
                    hiddenDetails.style.display="block";
                }, 200);
                projectBox.style.height = "150px";
                projectBox.style.transition = "all 0.3s ease";
                isOpen = true;
            } else {
                hiddenDetails.style.display = "none";
                projectBox.style.height = "30px";
                projectBox.style.transition = "all 0.3s ease";
                isOpen = false;
            }
        });
    }
});