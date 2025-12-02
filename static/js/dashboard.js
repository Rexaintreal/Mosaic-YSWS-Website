
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
                projectBox.style.height = "60px";
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
    if (!hoursDisplay) return;
    if (!projectName){
        hoursDisplay.textContent = "No Project Selected";
        return;
    }
    try{
        const params = new URLSearchParams({'project_name': projectName})
        const response = await fetch('/api/project-hours?'+params.toString());
        const data = await response.json();
        if (response.ok){
            hoursDisplay.textContent= 'Hours Spent: ' + (data.hours ?? 0);
        } else {
            hoursDisplay.textContent = 'Error: ' + (data.error || "Failed to fetch hours");
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
    addProjectOverlay.style.display = "block";
    mainOverlay.style.display = "block";
    mainOverlay.addEventListener('click', overlayClickClose)
});
closeOverlay?.addEventListener("click", ()=>{
    addProjectOverlay.style.display = "none";
    mainOverlay.style.display = "none";
    mainOverlay.removeEventListener('click', overlayClickClose)
    resetOverlay();
});
function overlayClickClose(e){
    if (e.target == mainOverlay){
        addProjectOverlay.style.display = "none";
        mainOverlay.style.display = "none";
        mainOverlay.removeEventListener('click', overlayClickClose)
        resetOverlay();
    }
}
function resetOverlay(){
    addProjectForm.reset();
    if (hackProject) hackProject.value = "";
    if (hoursDisplay) hoursDisplay.textContent = "No Project Selected";
}
addProjectForm.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const projectName = document.getElementById('project-name').value;
    const projectDetail = document.getElementById('project-detail').value;
    const hackProjectValue = document.getElementById('hack-project').value;
    
    const projectBox = document.createElement('div');
    projectBox.classList.add('project-box');
    projectBox.innerHTML = `
        <p class="open">${projectName}</p>
        <div class="hidden">
            <p class="hours-display">Hours Spent: 0</p>
            <p><span style="font-style: italic;">${projectDetail || "No Description"}</span></p>
            <input type="checkbox" value="review" name="review"  class="review-status">
            <label for="checkbox">In Review</label>
            <input type="checkbox" value="shipped" class="last-part shipped-status"> 
            <label for="checkbox">Shipped</label>
        </div>
    `;
    const line3 = document.getElementById('line3');
    line3.appendChild(projectBox);

    const openButton = projectBox.querySelector('.open');
    const hiddenDetails = projectBox.querySelector('.hidden');
    let isOpen = false;
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
            projectBox.style.height = "60px";
            projectBox.style.transition = "all 0.3s ease";
            isOpen = false;
        }
    });
    
    const newReview = projectBox.querySelector('.review-status');
    const newShipped = projectBox.querySelector('.shipped-status');
    newReview.addEventListener("click", (e) => e.preventDefault());
    newShipped.addEventListener("click", (e) => e.preventDefault());

    if (hackProjectValue){
    try{
        const params = new URLSearchParams({'project_name': hackProjectValue});
        const response = await fetch('/api/project-hours?'+params.toString());
        const data = await response.json();
        const hoursDisplay = projectBox.querySelector('.hours-display');
        if (response.ok){
            hoursDisplay.textContent= 'Hours Spent: ' + (data.hours ?? 0);
        } else {
            hoursDisplay.textContent = 'Error: ' + (data.error || "Failed to fetch hours");
        } 
    } catch(e){
        projectBox.querySelector('.hours-display').textContent = 'Failed to fetch hours!';    
    }
    }
    addProjectOverlay.style.display = "none";
    mainOverlay.style.display = "none";
    mainOverlay.removeEventListener('click', overlayClickClose)

    addProjectForm.reset();
    resetOverlay();
});

