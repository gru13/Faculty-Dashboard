document.querySelector('.sidebar-icon.logout').addEventListener('click', () => {
    const logoutPopup = document.getElementById('logoutPopup');
    requestAnimationFrame(() => {
        logoutPopup.classList.add('active');
    });
});

document.getElementById('cancelLogout').addEventListener('click', () => {
    const logoutPopup = document.getElementById('logoutPopup');
    logoutPopup.classList.remove('active');
});


document.getElementById('confirmLogout').addEventListener('click', () => {
    // Logout the user by sending a POST request to /logout
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = data.redirect;
        } else {
            alert('Error logging out');
        }
    })
    .catch(error => {
        console.error('Error logging out:', error);
    });
});

// Close popup when clicking outside
document.getElementById('logoutPopup').addEventListener('click', (e) => {
    if (e.target === document.getElementById('logoutPopup')) {
        logoutPopup.classList.remove('active');
    }
});

document.addEventListener("DOMContentLoaded", async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get("assignment_id");

    if (!assignmentId) {
        alert("Assignment ID is missing");
        return;
    }

    try {
        const response = await fetch(`/assignment/data?assignment_id=${assignmentId}`);
        const data = await response.json();

        if (!data.success) {
            alert("Failed to load assignment data");
            return;
        }

        // Store IDs globally for form submission
        window.assignmentData = {
            courseId: data.assignment.course_id,
            classId: data.assignment.class_id,
            assignmentId: assignmentId
        };

        updateAssignmentInfo(data.assignment);
        setupSubmissionsList(data.submissions);
        setupFormHandlers();
        setupActionHandlers();

    } catch (error) {
        console.error("Error fetching assignment data:", error);
        alert("Failed to load assignment details");
    }
});

function updateAssignmentInfo(assignment) {
    // Update bento grid items
    document.querySelector('.title-item .info-value').textContent = assignment.title;
    document.querySelector('.description-item .info-value').textContent = assignment.details;
    document.querySelector('.course-badge .info-value').textContent = `${assignment.course_id} ${assignment.course_name}`;
    document.querySelector('.class-badge .info-value').textContent = assignment.class_name;
    document.querySelector('.deadline-badge .info-value').textContent = new Date(assignment.deadline).toLocaleString();
    document.querySelector('.marks-badge .info-value').textContent = assignment.max_marks;

    // Update form fields for editing
    document.getElementById('title').value = assignment.title;
    document.getElementById('details').value = assignment.details;
    
    const deadline = new Date(assignment.deadline);
    document.getElementById('date').value = deadline.toISOString().split('T')[0];
    document.getElementById('time').value = deadline.toTimeString().slice(0,5);
    
    document.getElementById('submissionLink').value = assignment.submission_link;
    document.getElementById('maxMarks').value = assignment.max_marks;

    const viewPdfItem = document.getElementById('view-pdf');
    const visitSubmissionItem = document.getElementById('visit-submission');

    viewPdfItem.addEventListener('click', () => {
        if (assignment.assignment_doc_url) {
            window.open(assignment.assignment_doc_url, '_blank');
        } else {
            alert('Assignment document is not available');
        }
    });

    visitSubmissionItem.addEventListener('click', () => {
        if (assignment.submission_link) {
            window.open(assignment.submission_link, '_blank');
        } else {
            alert('Submission link is not available');
        }
    });
}

function setupSubmissionsList(submissions) {
    const submissionsList = document.querySelector('.submissions-list');
    const submissionCount = document.querySelector('.student-count');
    
    if (!submissions || submissions.length === 0) {
        submissionsList.innerHTML = '<div class="empty-state">No submissions yet</div>';
        submissionCount.textContent = "0 Submissions";
        return;
    }

    submissionCount.textContent = `${submissions.length} Submissions`;
    
    submissionsList.innerHTML = submissions.map(submission => {
        const submittedAt = new Date(submission.submission_date); // Changed from submitted_at
        const deadline = new Date(window.assignmentData.assignment.deadline);
        const isLate = submittedAt > deadline;
        const fileUrl = submission.file_link; // Changed from file_url
        const studentName = submission.name; // Changed from student_name

        return `
        <div class="submission-item">
            <div class="student-info">
                <span class="roll-no">${submission.roll_no}</span>
                <span class="student-name">${studentName}</span>
            </div>
            <div class="submission-details">
                <div class="status-badge ${isLate ? 'late' : 'on-time'}">
                    <span class="material-symbols-rounded">schedule</span>
                    <span class="submission-time">${new Date(submittedAt).toLocaleString()}</span>
                </div>
                <div class="grade-field">
                    <input type="number" max="100" placeholder="Grade" value="${submission.grade || ''}"
                           data-submission-id="${submission.submission_id}">
                    <span class="max-grade">/100</span>
                </div>
            </div>
            <div class="submission-actions">
                <button class="action-button view" title="View Submission" data-file="${fileUrl}">
                    <span class="material-symbols-rounded">visibility</span>
                </button>
                <button class="action-button save" title="Save Grade" data-id="${submission.submission_id}">
                    <span class="material-symbols-rounded">save</span>
                </button>
                <button class="action-button delete" title="Delete Submission" data-id="${submission.submission_id}">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
        </div>
    `}).join('');
}

function setupFormHandlers() {
    const form = document.querySelector('.assignment-form');
    const fileInput = document.getElementById('pdf');
    const fileLabel = document.querySelector('.file-name');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        fileLabel.textContent = file ? file.name : 'No file chosen';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append("assignmentId", window.assignmentData.assignmentId);
        formData.append("courseId", window.assignmentData.courseId);
        formData.append("classId", window.assignmentData.classId);
        formData.append("title", form.title.value);
        formData.append("details", form.details.value);
        formData.append("deadline", `${form.date.value}T${form.time.value}`);
        formData.append("link", form.submissionLink.value);
        formData.append("maxMarks", form.maxMarks.value);
        
        if (fileInput.files[0]) {
            formData.append("file", fileInput.files[0]);
        }

        try {
            const response = await fetch("/assignment/update", {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                alert("Assignment updated successfully!");
                location.reload();
            } else {
                alert("Failed to update assignment");
            }
        } catch (error) {
            console.error("Error updating assignment:", error);
            alert("An error occurred");
        }
    });
}

function setupActionHandlers() {
    document.querySelectorAll('.submission-actions .action-button').forEach(button => {
        button.addEventListener('click', async function() {
            const submissionId = this.dataset.id;
            
            if (this.classList.contains('save')) {
                const submissionItem = this.closest('.submission-item');
                const rollNo = submissionItem.querySelector('.roll-no').textContent;
                const gradeInput = this.closest('.submission-item').querySelector('.grade-field input');
                const grade = gradeInput.value;
                
                try {
                    const response = await fetch(`/assignment/grade`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ submissionId, rollNo, grade })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        alert('Grade saved successfully!');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to save grade');
                }
            } else if (this.classList.contains('delete')) {
                if (confirm('Are you sure you want to delete this submission?')) {
                    try {
                        const response = await fetch(`/assignment/delete-submission/${submissionId}`, {
                            method: 'DELETE'
                        });
                        const result = await response.json();
                        if (result.success) {
                            this.closest('.submission-item').remove();
                            alert('Submission deleted successfully!');
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Failed to delete submission');
                    }
                }
            } else if (this.classList.contains('view')) {
                window.open(this.dataset.file, '_blank');
            }
        });
    });
}
