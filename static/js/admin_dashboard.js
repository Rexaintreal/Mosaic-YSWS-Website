document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', ()=>{
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.dataset + '-tab';
        document.getElementById(tabId).classList.add('active');
    });
});
async function viewProject(projectId) {
    try {
        const response = await fetch(`/api/project-details/${projectId}`);
        const project = await response.json();
        if (!response.ok){
            alert('Error loading project details');
            return;
        }
        const reviewHTML = `
        <div class="review-header">
            <h2>${project.name}</h2>
            <p>Submitted by: User</p>
        </div>
        <div class="review-section">
            <h3>Project Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">${project.status.replace('_', ' ').toUpperCase()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Raw Hours (Hackatime)</div>
                    <div class="info-value">${project.approved_hours}</div>
                </div>
                ${project.languages ?`
                    <div class="info-item">
                        <div class="info-label">Languages</div>
                        <div class="info-value">${project.languages}</div>
                    </div>
                ` : ''}
            </div>
            <p><strong>Description:</strong>${project.detail || 'No Description'}</p>
        </div>
        ${project.summary ?`
            <div class="review-section">
                <h3>Project Summary</h3>
                <p>${project.summary}</p>
            </div>
            ` : ''}
        
        ${project.screenshot_url ? `
            <div class="review-section">
                <h3>Screenshot</h3>
                <img src="${project.screenshot_url}" alt="Project Screenshot" class="project-screenshot">
            </div>` : ''}
            
        ${project.github_url || project.demo_url ? `
            <div class="review-section">
                <h3>Links</h3>
                <ul class="link-list">
                    ${project.github_url ? `<li><a href="${project.github_url}" target="_blank">Github Repository </a></li>` : ''}
                    ${project.demo_url ? `<li><a href=${project.demo_url}" target="_blank">Live Demo </a></li>` : ''}
                </ul>
            </div> ` : ''}
        
        ${project.comments && project.comments.length > 0 ? `
            <div class="review-section">
                <h3>Previous Comments</h3>
                ${project.comments.map(comment => `
                    <div class="info-item" style="margin-bottom: 10px;">
                        <div class="info-label">${comment.admin_name}- ${comment.created_at}</div>`
                    ).join('')}
                    </div>
                    ` : ''}
                    <div class="review-form">
                        <h3>Review Project</h3>
                        <form id="review-form-${projectId}" onsubmit="submitReview(event, ${projectId})">
                            <div class="form-group">
                                <label for="approved-hours-${projectId}"> Approved Hours</label>
                                <input type="text" id="approved-hours-${projectId}" step="0.01" min="0" value="${project.approved_hours}" required>
                            </div>
                            <div class="form-group">
                                <label for="theme-${projectId}">Theme/Category</label>
                                <input type="text" id="theme-${projectId}">value="${project.theme || ''}" placeholder="e.g., Web Development, Game, AI>
                            </div>
                            <div class="form-group">
                                <label for="status-${projectId}">Status</label>
                                <select id="status-${projectId}" required>
                                    <option value="in_review" ${project.status==='in_review' ? 'selected': ''}>In Review</option>
                                    <option value="approved" ${project.status === 'approved' ? 'selected': ''}>Approved</option>
                                    <option value="rejected" ${project.status === 'rejected' ? 'selected': ''}>Rejected</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="comment-${projectId}">Add Comment</label>
                                <textarea id="comment-${projectId}" rows="4" placeholder="Leave feedback for the particpant..."></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-approve">Save Review</button>
                                <button type="button" class="btn-reject" onclick="quickReject(${projectId})">Quick Reject</button>
                            </div>
                        </form>
                    </div>
                `;

                document.getElementById('review-content').innerHTML = reviewHTML;
                document.getElementById('review-modal').classList.remove('hidden');
    } catch (e) {
        alert('Error Loading Project Details');
        console.error(e);
    }
}
 async function submitReview(event, projectId) {
        event.preventDefault();
        const approvedHours = document.getElementById(`approved-hours-${projectId}`).value;
        const theme = document.getElementById(`theme-${projectId}`).value;
        const status = document.getElementById(`status-${projectId}`).value;
        const comment = document.getElementById(`comment-${projectId}`).value;

        try {
            const reviewResponse = await fetch(`/admin/api/review-project/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    approved_hours: approvedHours,
                    theme: theme,
                    status: status
                })
            });
            if (!reviewResponse.ok){
                alert('Error Updating project review!');
                return;
            }
            if (comment.trim()){
                const commentResponse = await fetch(`/admin/api/add-comment/${projectId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        comment: comment
                    })
                });
                if (!commentResponse.ok){
                    console.error('Error addibng comment');
                }
            }
            alert('Review saved successfully!')
            closeReviewModal();
            location.reload(); 
        } catch (e) {
            alert('Error submitting review');
            console.error(e);
        }
}
async function quickReject(projectId) {
    const comment = prompt('Please provide a reason for rejetion!');
    if (!comment) reutrn;

    try {
        const reviewResponse = await fetch(`/admin/api/review-project/${projectId}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                status: 'rejected',
                approved_hours: 0
            })
        });
        if (!reviewResponse.ok){
            alert('Error Rejecting project!');
            return;
        }
        await fetch(`/admin/api/add-comment${projectId}`, {
            method: 'POST',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({'comment': comment})
        });
        alert('Projecct rejected');
        closeReviewModal();
        location.reload();

    } catch (e) {
        alert('Error Rejecting Project');
        console.error(e);
    }  
}
async function assignToSelf(projectId) {
    if (!confirm('Assign this project to yourself?')) reutrn;
    try {
        const response = await fetch (`/admin/api/assign-project/${projectId}`, {
            method: 'POST',
            headers: {'Content-Type' : 'application/json'}
        });
        if (response.ok) {
            alert('Project assigned to you!');
            location.reload()
        } else {
            alert ('Error Assigning project!');
        }
    } catch (e) {
        alert('Error assigning project');
        console.error(e);
    }    
}
function closeReviewModal(){
    document.getElementById('review-modal').classList.add('hidden');
}
document.getElementById('review-modal')?.addEventListener('click', (e)=>{
    if (e.targetid === 'review-modal'){
        closeReviewModal()
    }
});