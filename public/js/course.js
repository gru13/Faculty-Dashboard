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

    const activeClass = data.courses.find(course => course.class_id === classId);
    const courseId = activeClass ? activeClass.course_id : null;

    // Update course info header with active class
    if (activeClass) {
        document.querySelector('.course-meta .batch').textContent = activeClass.class_name;
    }

    const classStudents = data.students.filter(s => s.class_id === classId);
    const classAssignments = data.assignments.filter(a => a.class_id === classId);

    console.log(`Switching to classId: ${classId}, courseId: ${courseId}`); // Debugging log

    fetchCourseOutcomes(courseId, classId)
        .then(outcomes => {
            updateOutcomesList(outcomes);
            updateCompletionStats(classId, courseId); // Pass courseId correctly
        })
        .catch(error => {
            console.error('Error updating outcomes:', error);
            updateOutcomesList([]);
            updateCompletionStats(classId, courseId); // Pass courseId correctly
        });

    // Update UI
    updateStudentsList(classStudents);
    updateAssignmentsList(classAssignments);
    updateDeadlinesList(classAssignments);
    updateCompletionStats(classId, courseId); // Pass courseId correctly

    // Fetch and display deadlines specific to the class and course
    if (courseId && classId) {
        fetchAndDisplayDeadlines(courseId, classId);
    }
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

async function setupAssignmentForm(courseId) {
    const form = document.querySelector('.assignment-form');
    const fileInput = document.getElementById('pdf');
    const fileLabel = document.querySelector('.file-name');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileName = file.name.length > 30 
                ? file.name.substring(0, 27) + '...' 
                : file.name;
            fileLabel.textContent = fileName;
            fileLabel.title = file.name;
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
        formData.append("classId", classId);
        formData.append("title", form.title.value);
        formData.append("details", form.details.value);
        formData.append("deadline", `${form.date.value}T${form.time.value}`);
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

                // Fetch and update deadlines after assignment creation
                fetchAndDisplayDeadlines(courseId);

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

async function fetchCourseOutcomes(courseId, classId) {
    try {
        console.log(`Fetching outcomes for courseId: ${courseId}, classId: ${classId}`); // Debugging log
        const response = await fetch(`/course/outcomes?course_id=${courseId}&class_id=${classId}`);
        const data = await response.json();

        if (!data.success) {
            console.error("Failed to fetch course outcomes:", data.message);
            return [];
        }

        console.log("Fetched outcomes:", data.outcomes); // Debugging log
        return data.outcomes;
    } catch (error) {
        console.error("Error fetching outcomes:", error);
        return [];
    }
}

function updateOutcomesList(outcomes) {
    console.log("Updating outcomes list with:", outcomes); // Debugging log
    const outcomesList = document.querySelector('.outcomes-list');
    if (!outcomes || outcomes.length === 0) {
        outcomesList.innerHTML = '<div class="empty-state">No course outcomes defined</div>';
        updateCompletionRatio(0, 0);
        return;
    }

    outcomesList.innerHTML = outcomes.map(outcome => `
        <div class="outcome-item${outcome.completed ? ' completed' : ''}">
            <div class="outcome-info">
                <h4>${outcome.title}</h4>
            </div>
            <span class="material-symbols-rounded">
                ${outcome.completed ? 'task_alt' : 'radio_button_unchecked'}
            </span>
        </div>
    `).join('');

    console.log("Outcomes list updated successfully."); // Debugging log
    updateCompletionRatio();
}

function updateCompletionRatio() {
    const totalOutcomes = document.querySelectorAll('.outcome-item').length;
    const completedOutcomes = document.querySelectorAll('.outcome-item.completed').length;

    console.log(`Completion ratio: ${completedOutcomes}/${totalOutcomes}`); // Debugging log

    const completedSpan = document.querySelector('.completion-ratio .completed');
    const totalSpan = document.querySelector('.completion-ratio .total');

    if (completedSpan && totalSpan) {
        completedSpan.textContent = completedOutcomes;
        totalSpan.textContent = totalOutcomes;
    }
}

function updateCompletionStats(classId, courseId) {
    const totalOutcomes = document.querySelectorAll('.outcome-item').length;
    const completedOutcomes = document.querySelectorAll('.outcome-item.completed').length;
    const completionPercentage = Math.round((completedOutcomes / totalOutcomes) * 100) || 0;

    const assignmentsCount = document.querySelectorAll('.assignment-item').length;

    const completionCircle = document.querySelector('.completion-circle path:last-child');
    const percentageDisplay = document.querySelector('.completion-percentage');
    if (completionCircle && percentageDisplay) {
        completionCircle.setAttribute('stroke-dasharray', `${completionPercentage}, 100`);
        percentageDisplay.textContent = `${completionPercentage}%`;
    }

    const completionDetails = document.querySelector('.completion-details');
    completionDetails.innerHTML = `
        <div class="stat-row">
            <span class="label">Assignments posted</span>
            <span class="value">${assignmentsCount}</span>
        </div>
        <div class="stat-row loading-classes">
            <span class="label">Total classes</span>
            <span class="value">Loading...</span>
        </div>
    `;

    fetchTotalClasses(classId, courseId); // Pass courseId correctly
}

async function fetchTotalClasses(classId, courseId) {
    try {
        const response = await fetch(`/course/${classId}/total-classes?course_id=${courseId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch total classes: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const classesRow = document.querySelector('.loading-classes');
        if (classesRow && data.success) {
            classesRow.innerHTML = `
                <span class="label">Total classes</span>
                <span class="value">${data.total_classes}</span>
            `;
        } else {
            throw new Error('Invalid response format or missing data.');
        }
    } catch (error) {
        console.error('Error fetching total classes:', error);
        const classesRow = document.querySelector('.loading-classes');
        if (classesRow) {
            classesRow.innerHTML = `
                <span class="label">Total classes</span>
                <span class="value">--</span>
            `;
        }
    }
}

async function fetchAndDisplayDeadlines(courseId, classId) {
    try {
        const response = await fetch(`/course/${courseId}/${classId}/upcoming-deadlines`);
        if (!response.ok) {
            throw new Error(`Failed to fetch deadlines: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Upcoming Deadlines:", data.deadlines); // Log the deadlines to the console

        const deadlinesList = document.querySelector('.deadlines-list');

        if (data.success && data.deadlines.length > 0) {
            deadlinesList.innerHTML = data.deadlines.map(deadline => `
                <div class="deadline-item">
                    <span class="date">${new Date(deadline.date).toLocaleDateString('default', { month: 'short', day: 'numeric' })}</span>
                    <div class="deadline-info">
                        <h4>${deadline.deadline_name}</h4>
                    </div>
                    <span class="material-symbols-rounded">schedule</span>
                </div>
            `).join('');
        } else {
            deadlinesList.innerHTML = '<div class="empty-state">No upcoming deadlines</div>';
        }
    } catch (error) {
        console.error("Error fetching deadlines:", error);
        const deadlinesList = document.querySelector('.deadlines-list');
        deadlinesList.innerHTML = '<div class="empty-state">Failed to load deadlines</div>';
    }
}
