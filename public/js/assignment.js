document.querySelector('.sidebar-icon.logout').addEventListener('click', () => {
    console.log('Logout icon clicked');
try {
    const logoutPopup = document.getElementById('logoutPopup');
    requestAnimationFrame(() => {
        logoutPopup.classList.add('active');
        console.log('Logout popup activated');
    });
} catch (error) {
        console.error('Error activating logout popup:', error);
    }
});

document.getElementById('cancelLogout').addEventListener('click', () => {
    console.log('Cancel logout clicked');
try {
    const logoutPopup = document.getElementById('logoutPopup');
    logoutPopup.classList.remove('active');
    console.log('Logout popup deactivated');
} catch (error) {
        console.error('Error deactivating logout popup:', error);
    }
});

document.getElementById('confirmLogout').addEventListener('click', () => {
    console.log('Confirm logout clicked');
try {
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Logout response received:', data);
        if (data.success) {
            console.log('Logout successful, redirecting to:', data.redirect);
            window.location.href = data.redirect;
        } else {
            console.error('Error logging out:', data);
            alert('Error logging out');
        }
    })
    .catch(error => {
        console.error('Error logging out:', error);
    });
} catch (error) {
        console.error('Error in confirmLogout handler:', error);
    }
});

// Close popup when clicking outside
document.getElementById('logoutPopup').addEventListener('click', (e) => {
try {
    if (e.target === document.getElementById('logoutPopup')) {
        console.log('Clicked outside logout popup, closing it');
        logoutPopup.classList.remove('active');
    }
} catch (error) {
        console.error('Error closing logout popup:', error);
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    console.log('DOM fully loaded and parsed');
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const assignmentId = urlParams.get("assignment_id");
        console.log('Assignment ID from URL:', assignmentId);

        if (!assignmentId) {
            console.error('Assignment ID is missing');
            alert("Assignment ID is missing");
            return;
        }
        console.log('Fetching assignment data for ID:', assignmentId);
        const response = await fetch(`/assignment/data?assignment_id=${assignmentId}`);
        const data = await response.json();
        console.log("Assignment Data:", data);

        if (!data.success) {
            console.error('Failed to load assignment data:', data);
            alert("Failed to load assignment data");
            return;
        }

        window.assignmentData = {
            courseId: data.assignment.course_id,
            classId: data.assignment.class_id,
            assignmentId: assignmentId,
            submissionLink: data.assignment.submission_link,
            title: data.assignment.title,
            details: data.assignment.details,
            deadline: data.assignment.deadline,
            maxMarks: data.assignment.max_marks
        };
        console.log('Global assignment data set:', window.assignmentData);

        updateAssignmentInfo(data.assignment);
        populateFormDefaults();
        setupSubmissionsList(data.submissions);
        setupFormHandlers();
        setupActionHandlers();

    } catch (error) {
        console.error("Error fetching assignment data:", error);
        alert("Failed to load assignment details");
    }
});

function populateFormDefaults() {
    console.log('Populating form with default values');
    const form = document.querySelector('.assignment-form');
    if (!form) return;

    const titleInput = form.querySelector('#title');
    const detailsInput = form.querySelector('#details');
    const dateInput = form.querySelector('#date');
    const timeInput = form.querySelector('#time');
    const maxMarksInput = form.querySelector('#maxMarks');

    if (titleInput) titleInput.value = window.assignmentData.title || '';
    if (detailsInput) detailsInput.value = window.assignmentData.details || '';
    if (dateInput && timeInput && window.assignmentData.deadline) {
        const deadline = new Date(window.assignmentData.deadline);
        dateInput.value = deadline.toISOString().split('T')[0];
        timeInput.value = deadline.toTimeString().slice(0, 5);
    }
    if (maxMarksInput) maxMarksInput.value = window.assignmentData.maxMarks || '';
}

function updateAssignmentInfo(assignment) {
    console.log('Updating assignment info:', assignment);
    try {
        // Update bento grid items
        const titleElement = document.querySelector('.title-item .info-value');
        if (titleElement) titleElement.textContent = assignment.title;

        const descriptionElement = document.querySelector('.description-item .info-value');
        if (descriptionElement) descriptionElement.textContent = assignment.details;

        const courseBadgeElement = document.querySelector('.course-badge .info-value');
        if (courseBadgeElement) courseBadgeElement.textContent = `${assignment.course_id} ${assignment.course_name}`;

        const classBadgeElement = document.querySelector('.class-badge .info-value');
        if (classBadgeElement) classBadgeElement.textContent = assignment.class_name;

        const deadlineBadgeElement = document.querySelector('.deadline-badge .info-value');
        if (deadlineBadgeElement) deadlineBadgeElement.textContent = new Date(assignment.deadline).toLocaleString();

        const marksBadgeElement = document.querySelector('.marks-badge .info-value');
        if (marksBadgeElement) marksBadgeElement.textContent = assignment.max_marks;

        // Update form fields for editing
        const titleInput = document.getElementById('title');
        if (titleInput) titleInput.value = assignment.title;

        const detailsInput = document.getElementById('details');
        if (detailsInput) detailsInput.value = assignment.details;

        const deadline = window.assignmentData && window.assignmentData.assignment
            ? new Date(window.assignmentData.assignment.deadline)
            : null;

        const dateInput = document.getElementById('date');
        const timeInput = document.getElementById('time');
        if (deadline) {
            if (dateInput) dateInput.value = deadline.toISOString().split('T')[0];
            if (timeInput) timeInput.value = deadline.toTimeString().slice(0, 5);
        } else {
            if (dateInput) dateInput.value = "";
            if (timeInput) timeInput.value = "";
        }

        const submissionLinkInput = document.getElementById('submissionLink');
        if (submissionLinkInput) submissionLinkInput.value = assignment.submission_link;

        const maxMarksInput = document.getElementById('maxMarks');
        if (maxMarksInput) maxMarksInput.value = assignment.max_marks;

        const viewPdfItem = document.getElementById('view-pdf');
        if (viewPdfItem) {
            viewPdfItem.addEventListener('click', () => {
                if (assignment.assignment_doc_url) {
                    window.open(assignment.assignment_doc_url, '_blank');
                } else {
                    alert('Assignment document is not available');
                }
            });
        }

        const visitSubmissionItem = document.getElementById('visit-submission');
        if (visitSubmissionItem) {
            visitSubmissionItem.addEventListener('click', () => {
                if (assignment.submission_link) {
                    window.open(assignment.submission_link, '_blank');
                } else {
                    alert('Submission link is not available');
                }
            });
        }

        console.log('Assignment info updated');
    } catch (error) {
        console.error('Error updating assignment info:', error);
    }
}

function setupSubmissionsList(submissions) {
    console.log('Setting up submissions list:', submissions);
    const submissionsList = document.querySelector('.submissions-list');
    const submissionCount = document.querySelector('.student-count');
    
    if (!submissions || submissions.length === 0) {
        submissionsList.innerHTML = '<div class="empty-state">No submissions yet</div>';
        submissionCount.textContent = "0 Submissions";
        return;
    }

    submissionCount.textContent = `${submissions.length} Submissions`;
    

    submissionsList.innerHTML = submissions.map(submission => {
        const submittedAt = new Date(submission.submission_date);
        const deadline = window.assignmentData && window.assignmentData.assignment
            ? new Date(window.assignmentData.assignment.deadline)
            : null;
        const isLate = deadline && submittedAt > deadline;
        const fileUrl = submission.file_link;
        const studentName = submission.name;

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
    console.log('Submissions list setup complete');
}

function setupFormHandlers() {
    console.log('Setting up form handlers');
    const form = document.querySelector('.assignment-form');
    const fileInput = document.getElementById('pdf');
    const fileLabel = document.querySelector('.file-name');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        fileLabel.textContent = file ? file.name : 'No file chosen';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        console.log('Form submission triggered');
        const dateValue = form.date.value.trim();
        const timeValue = form.time.value.trim();

        let deadline;
        if (dateValue && timeValue) {
            deadline = `${dateValue}T${timeValue}`;
        } else if (window.assignmentData.deadline) {
            const existingDeadline = new Date(window.assignmentData.deadline);
            deadline = `${existingDeadline.toISOString().split('T')[0]}T${existingDeadline.toTimeString().slice(0, 5)}`;
        } else {
            console.error('Invalid deadline: Both date and time are missing.');
            alert('Please provide a valid deadline.');
            return;
        }

        const updatedData = {
            assignmentId: window.assignmentData.assignmentId,
            courseId: window.assignmentData.courseId,
            classId: window.assignmentData.classId,
            title: form.title.value.trim() || window.assignmentData.title,
            details: form.details.value.trim() || window.assignmentData.details,
            deadline: deadline,
            link: form.submissionLink?.value.trim() || window.assignmentData.submissionLink,
            maxMarks: form.maxMarks.value.trim() || window.assignmentData.maxMarks
        };

        const formData = new FormData();
        Object.keys(updatedData).forEach(key => {
            formData.append(key, updatedData[key]);
        });

        if (fileInput.files[0]) {
            formData.append("file", fileInput.files[0]);
        }

        try {
            console.log('Sending updated data:', updatedData);
            const response = await fetch("/assignment/update", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                console.error(`Server returned status: ${response.status}`);
                const text = await response.text();
                console.error('Response text:', text);
                alert('Failed to update assignment. Please check the server.');
                return;
            }

            const result = await response.json();
            if (result.success) {
                alert("Assignment updated successfully!");
                location.reload();
            } else {
                alert("Failed to update assignment");
            }
        } catch (error) {
            console.error("Error updating assignment:", error);
            alert("An error occurred while updating the assignment.");
        }
    });
    console.log('Form handlers setup complete');
}

function setupActionHandlers() {
    console.log('Setting up action handlers');
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
    console.log('Action handlers setup complete');
}
