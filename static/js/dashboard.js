
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

const hackProject = document.getElementById('hack-project');
const hoursDisplay = document.getElementById('project-hours'); 
const addProjectForm = document.getElementById('add-project-form');


hackProject?.addEventListener("change", async()=>{
    const projectName = hackProject.value;
    hoursDisplay.textContent="";
    if (!projectName){
        return;
    }
    try{
        const response = await fetch('/api/project-hours?project-name=${projectName}');
        const data = await response.json();
        if (response.ok){
            hoursDisplay.textContent= 'Hours Spent: ${data.hours || 0';
        } else {
            hoursDisplay.textContent = 'Error: ${ error || "Failed to Fetch Hours"}';
        }
    } catch(e){
        hoursDisplay.textContent = 'Failed to fetch hours!';
    }
});

const addProjectIcon = document.getElementById('icon');
const addProjectOverlay = document.getElementById('add-project');
const closeOverlay = document.getElementById('close-overlay');
const mainOverlay = document.getElementById('overlay');

addProjectIcon?.addEventListener("click", ()=>{
    addProjectOverlay.style.display = "flex";
    mainOverlay.style.display = "block";
});
closeOverlay?.addEventListener("click", ()=>{
    addProjectOverlay.style.display="none";
    mainOverlay.style.display = "none";
});