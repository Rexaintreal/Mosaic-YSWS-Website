// Theme Dropdown 
async function loadThemesDropdown() {
    try {
        const response = await fetch('/api/themes');
        const data = await response.json();
        const dropdownContent = document.getElementById('themes-list-content');
        
        if (data.themes && data.themes.length > 0) {
            dropdownContent.innerHTML = data.themes.map(theme => `
                <div class="theme-dropdown-item">
                    <div class="theme-item-name">${theme.name}</div>
                    ${theme.description ? `<div class="theme-item-desc">${theme.description}</div>` : ''}
                </div>
            `).join('');
        } else {
            dropdownContent.innerHTML = `
                <div class="no-themes-msg">
                    <p>No active themes yet</p>
                </div>
            `;
        }
    } catch (e) {
        console.error('Error loading themes:', e);
    }
}

function toggleThemesDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('themes-dropdown');
    dropdown.classList.toggle('active');
}

document.addEventListener('click', (event) => {
    const dropdown = document.getElementById('themes-dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

window.addEventListener("DOMContentLoaded", () => {
    const addProjectBtn = document.getElementById("add-project-btn");
    const addProjectForm = document.getElementById("add-project-form");
    const overlay = document.getElementById("overlay");
    const closeOverlay = document.getElementById("close-overlay");
    const hackProject = document.getElementById("hack-project");
    const hoursPreview = document.getElementById("project-hours");
    const screenshotInput = document.getElementById("screenshot-url");
    const screenshotPreview = document.getElementById("screenshot-preview");
    const detailsOverlay = document.getElementById("project-details-overlay");
    const closeDetails = document.getElementById("close-details");
    const submitOverlay = document.getElementById("submit-overlay");
    const closeSubmit = document.getElementById("close-submit");
    const submitForm = document.getElementById("submit-project-form");
    loadThemesDropdown();
    function resetAddForm(){
        addProjectForm.reset();
        hoursPreview.textContent = "";
    }
    window.openSubmitForm = function(projectId){
        const submitProjectId = document.getElementById("submit-project-id");
        const detailsOverlay = document.getElementById("project-details-overlay");
        const submitOverlay = document.getElementById("submit-overlay");
        
        if (submitProjectId) {
            submitProjectId.value = projectId;
        }
        
        if (detailsOverlay) {
            detailsOverlay.classList.add("hidden");
        }
        
        if (submitOverlay) {
            submitOverlay.classList.remove("hidden");
        }
    };

    window.deleteProject = async function(projectId) {
        const confirmed = await showConfirm('Are you sure you want to delete this project? This action cannot be undone.');
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/delete-project/${projectId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await showAlert('Project deleted successfully!', 'success');
                detailsOverlay.classList.add('hidden');
                window.location.reload();
            } else {
                const error = await response.json();
                await showAlert(error.error || 'Error deleting project', 'error');
            }
        } catch (e) {
            console.error('Error deleting project:', e);
            await showAlert('Error deleting project', 'error');
        }
    };
    async function showProjectDetails(projectId) {
        try {
            const response = await fetch(`/api/project-details/${projectId}`);
            const project = await response.json();

            if (!response.ok){
                await showAlert('Error Loading Project Details', 'error');
                return;
            }
            const detailsHTML = `
            <div class="project-details-header">
                <h2>${project.name}</h2>
                <button class="delete-project-btn" onclick="deleteProject('${project.id}')">
                    <i class="fas fa-trash"></i>
                    Delete Project
                </button>
            </div>
            <div class="details-grid">
                <div class="details-section">
                    <h3>Project Information</h3>
                    <p><strong>Description:</strong> ${project.detail || 'No Description'}</p>
                    ${project.theme ? `<p><strong>Theme:</strong> <span class="theme-tag">${project.theme}</span></p>` : ''}
                    ${project.languages ? `<p><strong>Languages:</strong> ${project.languages}</p>` : ''}
                </div>
                
                <div class="details-section">
                    <h3>Hours Tracking</h3>
                    <table class="hours-table">
                        <tr>
                            <td>Raw Hours (Hackatime):</td>
                            <td>${project.raw_hours} hrs</td>
                        </tr>
                        <tr>
                            <td>Approved Hours:</td>
                            <td>${project.approved_hours} hrs</td>
                        </tr>
                    </table>
                </div>
                ${project.summary ? `
                    <div class="details-section">
                        <h3>Project Summary</h3>
                        <p>${project.summary}</p>
                    </div>
                ` : ''}
                ${project.screenshot_url || project.github_url || project.demo_url ? `
                    <div class="details-section">
                        <h3>Links</h3>
                        ${project.screenshot_url ? `<p><a href="${project.screenshot_url}" target="_blank"><i class="fas fa-image"></i> View Screenshot</a></p>` : ''}
                        ${project.github_url ? `<p><a href="${project.github_url}" target="_blank"><i class="fab fa-github"></i> Github Repository</a></p>` : ''}
                        ${project.demo_url ? `<p><a href="${project.demo_url}" target="_blank"><i class="fas fa-external-link-alt"></i> Live Demo</a></p>` : ''}
                    </div>
                ` : ''}

                ${project.comments && project.comments.length > 0 ? `
                    <div class="details-section">
                        <h3>Admin Comments</h3>
                        <div class="comment-list">
                            ${project.comments.map(comment => `
                                <div class="comment-item">
                                    <div class="comment-author">${comment.admin_name}</div>
                                    <div class="comment-date">${comment.created_at}</div>
                                    <div class="comment-text">${comment.comment}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            ${project.status === 'draft' ? `
                <button class="btn-primary" onclick="openSubmitForm('${project.id}')">Submit for Review</button>
            ` : ''}
            `;

            document.getElementById("project-details-content").innerHTML = detailsHTML;
            detailsOverlay.classList.remove("hidden");
        } catch (e){
            await showAlert("Error Loading project details", 'error');
            console.error(e);
        }  
    }

async function fetchProjectHours(projectCard) {
    const hoursDisplay = projectCard.querySelector(".hours-display");
    let projectName = projectCard.getAttribute('data-hackatime-project');

    if (!projectName || projectName.trim() === '') {
        if (hoursDisplay) hoursDisplay.textContent = "No project linked";
        return;
    }
    
    projectName = projectName.trim();
    hoursDisplay.textContent = "Fetching...";

    try {
        const params = new URLSearchParams({'project_name': projectName});
        const response = await fetch('/api/project-hours?' + params.toString());
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.hours !== undefined) {
                hoursDisplay.textContent = `${(data.hours ?? 0).toFixed(2)} hrs`;
            } else if (data.message) {
                hoursDisplay.textContent = data.message;
            } else {
                hoursDisplay.textContent = '0.00 hrs';
            }
        } else {
            console.error('Error fetching hours:', response.status);
            hoursDisplay.textContent = 'Unable to fetch';
        }
    } catch (e) {
        console.error('Network error fetching hours:', e);
        hoursDisplay.textContent = 'Network error';
    }
}
    submitForm?.addEventListener("submit", async(e) => {
        e.preventDefault();
        const projectId = document.getElementById("submit-project-id").value;
        const screenshotUrl = document.getElementById("screenshot-url").value;
        const githubUrl = document.getElementById("github-url").value;
        const demoUrl = document.getElementById("demo-url").value;
        const languages = document.getElementById("languages").value;
        const summary = document.getElementById("summary").value;
        try {
            const response = await fetch(`/api/submit-project/${projectId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    screenshot_url: screenshotUrl,
                    github_url: githubUrl,
                    demo_url: demoUrl,
                    languages: languages,
                    summary: summary,
                })
            });
            if (response.ok) {
                await showAlert('Project Submitted Successfully!', 'success');
                submitOverlay.classList.add("hidden");
                detailsOverlay.classList.add("hidden");
                window.location.reload();
            } else {
                const err = await response.json();
                await showAlert('Error: ' + (err.error || 'Could not be submitted!'), 'error');
            }
        } catch (e){
            await showAlert("Error submitting project!", 'error');
            console.error(e);
        }
    });

    addProjectForm?.addEventListener("submit", async(e) => {
        e.preventDefault();
        const projectName = document.getElementById("project-name").value.trim();
        const projectDetail = document.getElementById("project-detail").value;
        const hackProjectValue = document.getElementById("hack-project").value;
        if (!projectName){
            await showAlert("Project name cannot be empty", 'warning');
            return;
        }
        try {
            const response = await fetch('/api/add-project', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: projectName,
                    detail: projectDetail,
                    hack_project: hackProjectValue
                })
            });
            if (!response.ok){
                const err = await response.json();
                await showAlert('Error Adding Project: ' + (err.error || 'Unknown Error'), 'error');
                return;
            }
            const newProject = await response.json();
            const projectsGrid = document.getElementById("projects-grid");
            const projectCard = document.createElement("div");
            projectCard.className = "project-card";
            projectCard.dataset.projectId = newProject.id;
            projectCard.setAttribute('data-hackatime-project', newProject.hackatime_project || '');

            projectCard.innerHTML = `
            <div class="project-card-header">
                <h3>${newProject.name}</h3>
                <span class="status-badge status-draft">Draft</span>
            </div>
            <p class="project-description">${newProject.detail || 'No Description'}</p>
            <div class="project-card-footer">
                <span class="hours-display">Fetching hours...</span>
                <button class="view-details-btn">View Details</button>
            </div>
            `;
            projectsGrid.appendChild(projectCard);
            fetchProjectHours(projectCard);

            projectCard.addEventListener("click", () => {
                showProjectDetails(newProject.id);
            });
            overlay.classList.add("hidden");
            resetAddForm();
        } catch (e){
            await showAlert('Error adding project.', 'error');
            console.error(e);
        }
    });

    screenshotInput?.addEventListener("input", () => {
        const url = screenshotInput.value;
        if (url) {
            screenshotPreview.innerHTML = `<img src="${url}" alt="Screenshot preview" onerror="this.style.display='none'">`;
        } else {
            screenshotPreview.innerHTML = "";
        }
    });

    hackProject?.addEventListener("change", async() => {
        const projectName = hackProject.value;
        if (!projectName) {
            hoursPreview.textContent = '';
            return;
        }

        hoursPreview.textContent = "Fetching hours...";

        try {
            const params = new URLSearchParams({project_name: projectName});
            const response = await fetch('/api/project-hours?' + params.toString());
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.hours !== undefined) {
                    hoursPreview.textContent = `Hours Spent: ${(data.hours ?? 0).toFixed(2)} hr(s)`;
                } else if (data.message) {
                    hoursPreview.textContent = `Note: ${data.message}`;
                } else {
                    hoursPreview.textContent = 'Hours Spent: 0.00 hr(s)';
                }
            } else {
                hoursPreview.textContent = 'Unable to fetch hours';
            }
        } catch (e) {
            console.error('Error fetching hours:', e);
            hoursPreview.textContent = "Network error";
        }
    });

    submitOverlay?.addEventListener("click", (e) => {
        if (e.target === submitOverlay){
            submitOverlay.classList.add("hidden");
        }
    });

    closeSubmit?.addEventListener("click", () => {
        submitOverlay.classList.add("hidden");
    });

    detailsOverlay?.addEventListener("click", (e) => {
        if (e.target === detailsOverlay){
            detailsOverlay.classList.add("hidden");
        }
    });

    closeDetails?.addEventListener("click", () => {
        detailsOverlay.classList.add("hidden");
    });

    overlay?.addEventListener("click", (e) => {
        if (e.target === overlay){
            overlay.classList.add("hidden");
            resetAddForm();
        }
    });

    closeOverlay?.addEventListener("click", () => {
        overlay.classList.add("hidden");
        resetAddForm();
    });

    addProjectBtn?.addEventListener("click", () => {
        overlay.classList.remove("hidden");
    });
    const projectCards = document.querySelectorAll(".project-card");
    projectCards.forEach(card => {
        fetchProjectHours(card);
        card.addEventListener("click", () => {
            const projectId = card.dataset.projectId;
            showProjectDetails(projectId);
        });
    });
});

async function refreshTilesBalance() {
    try {
        const response = await fetch('/dashboard');
        if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const statCards = doc.querySelectorAll('.stat-card');
            if (statCards.length >= 4) {
                const newTilesValue = statCards[3].querySelector('.stat-value').textContent.trim();
                
                const currentStatCards = document.querySelectorAll('.stat-card');
                if (currentStatCards.length >= 4) {
                    const tilesElement = currentStatCards[3].querySelector('.stat-value');
                    if (tilesElement && tilesElement.textContent.trim() !== newTilesValue) {
                        tilesElement.textContent = newTilesValue;
                        tilesElement.style.color = '#4CAF50';
                        setTimeout(() => {
                            tilesElement.style.color = '';
                        }, 1500);
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error refreshing tiles balance:', e);
    }
}

setInterval(refreshTilesBalance, 10000);
window.addEventListener('focus', refreshTilesBalance);
