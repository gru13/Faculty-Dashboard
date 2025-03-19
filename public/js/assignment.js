document.querySelector('.sidebar-icon.logout').addEventListener('click', () => {
    console.log("Logout button clicked");
    const logoutPopup = document.getElementById('logoutPopup');
    requestAnimationFrame(() => {
        logoutPopup.classList.add('active');
        console.log("Logout popup activated");
    });
});

document.getElementById('cancelLogout').addEventListener('click', () => {
    console.log("Cancel logout button clicked");
    const logoutPopup = document.getElementById('logoutPopup');
    logoutPopup.classList.remove('active');
    console.log("Logout popup deactivated");
});

document.getElementById('confirmLogout').addEventListener('click', () => {
    console.log("Confirm logout button clicked");
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("Logout response received:", data);
        if (data.success) {
            console.log("Logout successful, redirecting to:", data.redirect);
            window.location.href = data.redirect;
        } else {
            console.error("Logout failed");
            alert('Error logging out');
        }
    })
    .catch(error => {
        console.error("Error logging out:", error);
    });
});

// Close popup when clicking outside
document.getElementById('logoutPopup').addEventListener('click', (e) => {
    if (e.target === document.getElementById('logoutPopup')) {
        console.log("Clicked outside logout popup, closing popup");
        logoutPopup.classList.remove('active');
    }
});

document.addEventListener("DOMContentLoaded", async function() {
    console.log("DOM fully loaded and parsed");
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get("assignment_id");
    console.log("Assignment ID from URL:", assignmentId);

    if (!assignmentId) {
        console.error("Assignment ID is missing");
        alert("Assignment ID is missing");
        return;
    }

    try {
        console.log("Fetching assignment data for ID:", assignmentId);
        const response = await fetch(`/assignment/data?assignment_id=${assignmentId}`);
        const data = await response.json();
        console.log("Assignment data fetched:", data);

        if (!data.success) {
            console.error("Failed to load assignment data");
            alert("Failed to load assignment data");
            return;
        }

        console.log("Storing assignment data globally");
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

        console.log("Updating assignment info");
        updateAssignmentInfo(data.assignment);

        console.log("Setting up submissions list");
        setupSubmissionsList(data.submissions);

        console.log("Setting up form handlers");
        setupFormHandlers();

        console.log("Setting up action handlers");
        setupActionHandlers();

    } catch (error) {
        console.error("Error fetching assignment data:", error);
        alert("Failed to load assignment details");
    }
});

function updateAssignmentInfo(assignment) {
    console.log("Updating assignment information in the UI");
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

    // Pre-fill form fields with existing data
    const titleInput = document.getElementById('title');
    if (titleInput && !titleInput.value.trim()) titleInput.value = assignment.title;

    const detailsInput = document.getElementById('details');
    if (detailsInput && !detailsInput.value.trim()) detailsInput.value = assignment.details;

    const deadline = new Date(assignment.deadline);
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value.trim()) dateInput.value = deadline.toISOString().split('T')[0];

    const timeInput = document.getElementById('time');
    if (timeInput && !timeInput.value.trim()) timeInput.value = deadline.toTimeString().slice(0, 5);

    const submissionLinkInput = document.getElementById('submissionLink');
    if (submissionLinkInput && !submissionLinkInput.value.trim()) submissionLinkInput.value = assignment.submission_link;

    const maxMarksInput = document.getElementById('maxMarks');
    if (maxMarksInput && !maxMarksInput.value.trim()) maxMarksInput.value = assignment.max_marks;

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
    console.log("Assignment information updated");
}

function setupSubmissionsList(submissions) {
    console.log("Setting up submissions list");
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
        const deadline = window.assignmentData.deadline ? new Date(window.assignmentData.deadline) : null;
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
    console.log("Submissions list setup complete");
}

function setupFormHandlers() {
    console.log("Setting up form handlers");
    const form = document.querySelector('.assignment-form');
    const fileInput = document.getElementById('pdf');
    const fileLabel = document.querySelector('.file-name');

    if (fileInput && fileLabel) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            fileLabel.textContent = file ? file.name : 'No file chosen';
            console.log("File selected:", file ? file.name : "No file chosen");
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Form submitted");

        const titleInput = form.title;
        const detailsInput = form.details;
        const dateInput = form.date;
        const timeInput = form.time;
        const submissionLinkInput = form.submissionLink;
        const maxMarksInput = form.maxMarks;

        if (!titleInput || !detailsInput || !dateInput || !timeInput || !maxMarksInput) {
            console.error("One or more form fields are missing");
            alert("One or more form fields are missing.");
            return;
        }

        const title = titleInput.value.trim() || window.assignmentData.title;
        const details = detailsInput.value.trim() || window.assignmentData.details;
        const date = dateInput.value.trim() || new Date(window.assignmentData.deadline).toISOString().split('T')[0];
        const time = timeInput.value.trim() || new Date(window.assignmentData.deadline).toTimeString().slice(0, 5);
        const submissionLink = submissionLinkInput ? submissionLinkInput.value.trim() || window.assignmentData.submissionLink : window.assignmentData.submissionLink;
        const maxMarks = maxMarksInput.value.trim() || window.assignmentData.maxMarks;

        const formData = new FormData();
        formData.append("assignmentId", window.assignmentData.assignmentId);
        formData.append("courseId", window.assignmentData.courseId);
        formData.append("classId", window.assignmentData.classId);
        formData.append("title", title);
        formData.append("details", details);
        formData.append("deadline", `${date}T${time}`);
        formData.append("link", submissionLink);
        formData.append("maxMarks", maxMarks);

        if (fileInput && fileInput.files[0]) {
            formData.append("file", fileInput.files[0]);
            console.log("New file selected:", fileInput.files[0].name);
        } else if (window.assignmentData.assignment_doc_url) {
            formData.append("filePath", window.assignmentData.assignment_doc_url);
            console.log("Using existing file path:", window.assignmentData.assignment_doc_url);
        }

        console.log("Sending data to backend:", {
            assignmentId: window.assignmentData.assignmentId,
            courseId: window.assignmentData.courseId,
            classId: window.assignmentData.classId,
            title,
            details,
            deadline: `${date}T${time}`,
            link: submissionLink,
            maxMarks,
            file: fileInput && fileInput.files[0] ? fileInput.files[0].name : window.assignmentData.assignment_doc_url
        });

        try {
            const response = await fetch("/assignment/update", {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            console.log("Response from backend:", result);

            if (result.success) {
                alert("Assignment updated successfully!");
                location.reload();
            } else {
                console.error("Failed to update assignment");
                alert("Failed to update assignment");
            }
        } catch (error) {
            console.error("Error updating assignment:", error);
            alert("An error occurred");
        }
    });
}

function setupActionHandlers() {
    console.log("Setting up action handlers");
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
    console.log("Action handlers setup complete");
}