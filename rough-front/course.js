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
// Close popup when clicking outside
document.getElementById('logoutPopup').addEventListener('click', (e) => {
    if (e.target === document.getElementById('logoutPopup')) {
        logoutPopup.classList.remove('active');
    }
});

// ...existing logout code...

document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get("course_id");

    if (!courseId) {
        alert("Course ID is missing in the URL.");
        return;
    }

    try {
        const response = await fetch(`/course/data?course_id=${courseId}`);
        const data = await response.json();
        
        if (!data.courses || data.courses.length === 0) {
            alert("Failed to load course data");
            return;
        }

        // Setup class tabs based on course data
        setupClassTabs(data.courses);
        
        // Update course info using first course entry
        updateCourseInfo(data.courses[0]);

        // Initial load with first class
        const firstClass = data.courses[0];
        if (firstClass) {
            switchClass(firstClass.class_id, data);
        }

        // Setup form handlers
        setupAssignmentForm(courseId);

    } catch (error) {
        console.error("Error fetching course data:", error);
        alert("Failed to load course details.");
    }
});

function setupClassTabs(courses) {
    const tabsContainer = document.querySelector('.class-tabs');
    tabsContainer.innerHTML = '';
    
    courses.forEach((course, index) => {
        const tab = document.createElement('div');
        tab.className = `tab${index === 0 ? ' active' : ''}`;
        tab.dataset.classId = course.class_id;
        tab.innerHTML = `<span>${course.class_name}</span>`;
        
        tab.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.class-tabs .tab').forEach(t => 
                t.classList.toggle('active', t === tab));
            
            // Switch content
            switchClass(course.class_id, window.courseData);
        });
        
        tabsContainer.appendChild(tab);
    });
}

function updateCourseInfo(course) {
    document.querySelector('.course-info-header h1').textContent = course.course_name;
    document.querySelector('.course-meta .course-code').textContent = course.course_id;
    document.querySelector('.course-meta .batch').textContent = course.class_name;
}

function switchClass(classId, data) {
    // Filter students for this class
    window.courseData = data;

    const classStudents = data.students.filter(s => s.class_id === classId);
    
    // Filter assignments for this class
    const classAssignments = data.assignments.filter(a => a.class_id === classId);
    
    // Update UI
    updateStudentsList(classStudents);
    updateAssignmentsList(classAssignments);
    updateDeadlinesList(classAssignments);
}

function updateStudentsList(students) {
    const studentsList = document.querySelector('.students-list');
    if (!students || students.length === 0) {
        studentsList.innerHTML = '<div class="empty-state">No students enrolled</div>';
        return;
    }

    studentsList.innerHTML = students.map(student => `
        <div class="student-item">
            <span class="roll-no">${student.roll_no}</span>
            <span class="student-name">${student.name}</span>
        </div>
    `).join('');
}

function updateAssignmentsList(assignments) {
    const assignmentsList = document.querySelector('.assignments-list');
    if (!assignments || assignments.length === 0) {
        assignmentsList.innerHTML = '<div class="empty-state">No assignments posted</div>';
        return;
    }

    assignmentsList.innerHTML = assignments.map(assignment => `
        <div class="assignment-item">
            <a href="/assignment?assignment_id=${assignment.assignment_id}" class="assignment-info">
                <h4>${assignment.title}</h4>
                <small>Due ${new Date(assignment.deadline).toLocaleDateString()}</small>
                <p>${assignment.details}</p>
            </div>
            <div class="assignment-actions">
                ${assignment.assignment_doc_url ? `
                    <a href="${assignment.assignment_doc_url}" class="action-button view" target="_blank">
                        <span class="material-symbols-rounded">visibility</span>
                    </a>
                ` : ''}
                <a href="${assignment.submission_link}" class="action-button submit" target="_blank">
                    <span class="material-symbols-rounded">upload_file</span>
                </a>
                <button class="action-button delete" data-id="${assignment.assignment_id}">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
        </div>
    `).join('');

    setupAssignmentActions();
}

function updateDeadlinesList(assignments) {
    const deadlinesList = document.querySelector('.deadlines-list');
    if (!assignments || assignments.length === 0) {
        deadlinesList.innerHTML = '<div class="empty-state">No upcoming deadlines</div>';
        return;
    }

    const upcomingDeadlines = assignments
        .filter(a => new Date(a.deadline) > new Date())
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

    deadlinesList.innerHTML = upcomingDeadlines.map(deadline => `
        <div class="deadline-item">
            <span class="date">${new Date(deadline.deadline).toLocaleDateString('default', { month: 'short', day: 'numeric' })}</span>
            <div class="deadline-info">
                <h4>${deadline.title}</h4>
                <p>${new Date(deadline.deadline).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <span class="material-symbols-rounded">schedule</span>
        </div>
    `).join('');
}

function setupAssignmentForm(courseId) {
    const form = document.querySelector('.assignment-form');
    const fileInput = document.getElementById('pdf');
    const fileLabel = document.querySelector('.file-name');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Truncate long file names
            const fileName = file.name.length > 30 
                ? file.name.substring(0, 27) + '...' 
                : file.name;
            fileLabel.textContent = fileName;
            fileLabel.title = file.name; // Show full name on hover
            
            // Add a visual indication that file is selected
            fileLabel.parentElement.classList.add('has-file');
        } else {
            fileLabel.textContent = 'No file chosen';
            fileLabel.title = '';
            fileLabel.parentElement.classList.remove('has-file');
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const activeTab = document.querySelector('.class-tabs .tab.active');
        const classId = activeTab.dataset.classId;
        const formData = new FormData();
        formData.append("courseId", courseId);
        formData.append("classId", classId); // Add this
        formData.append("title", form.title.value);
        formData.append("details", form.details.value);
        formData.append("deadline", `${form.date.value}T${form.time.value}`);
        formData.append("link", form.submissionLink.value);
        formData.append("maxMarks", form.maxMarks.value);
        formData.append("file", fileInput.files[0]);

        try {
            const response = await fetch("/course/add-assignment", {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                alert("Assignment added successfully!");
                location.reload();
            } else {
                alert("Failed to add assignment.");
            }
        } catch (error) {
            console.error("Error adding assignment:", error);
            alert("An error occurred.");
        }
    });
}

function setupAssignmentActions() {
    document.querySelectorAll('.action-button').forEach(button => {
        button.addEventListener('click', async function() {
            const assignmentId = this.dataset.id;
            
            if (this.classList.contains('delete')) {
                if (confirm('Are you sure you want to delete this assignment?')) {
                    try {
                        const response = await fetch(`/course/delete-assignment/${assignmentId}`, {
                            method: 'DELETE'
                        });
                        const result = await response.json();
                        if (result.success) {
                            alert('Assignment deleted successfully!');
                            location.reload();
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Failed to delete assignment');
                    }
                }
            }
            // Add view and submit handlers as needed
        });
    });
}


