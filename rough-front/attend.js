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
        
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    const coursesGrid = document.querySelector('.courses-grid');
    const classTabs = document.querySelector('.class-tabs');
    const attendanceList = document.querySelector('.attendance-list');
    
    // Set up mutation observer for student count
    const observer = new MutationObserver(updateStudentCount);
    observer.observe(attendanceList, {
        childList: true,
        subtree: true
    });

    // Initially hide class tabs and show empty states
    classTabs.style.display = 'none';
    hideAttendanceBoxes();

    // Set current date in header
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.querySelector('.current-date').textContent = currentDate;

    // Fetch and display courses
    updateCourses();

    // Course selection handler is now in handleCourseSelection function
    coursesGrid.addEventListener('click', async (e) => {
        const courseBox = e.target.closest('.course-box');
        if (!courseBox) return;
        await handleCourseSelection(courseBox);
    });
    
    // Class selection handler
    classTabs.addEventListener('click', async (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        
        // Update active state
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');
        
        // Update batch info and show attendance
        const className = tab.querySelector('span').textContent;
        const classId = tab.dataset.classId;
        
        updateBatchInfo(className);
        showAttendanceBoxes();
        await loadAttendanceData(classId);
    });
});

function hideAttendanceBoxes() {
    // Show empty states
    document.querySelector('.attendance-list').innerHTML = 
        '<div class="empty-state">Select a course and class to view attendance</div>';
    document.querySelector('.attendance-form').innerHTML = 
        '<div class="empty-state">Select a course and class to update attendance</div>';
}


async function fetchClassStudents(classId) {
    try {
        const response = await fetch(`/api/class/${classId}/students`);
        const data = await response.json();
        
        /* Expected response format:
        {
            "success": true,
            "students": [
                {
                    "roll_no": "CSE001",
                    "name": "Alex Johnson",
                    "class_id": "CSE22A"
                },
                // ... more students
            ]
        }
        */
        
        return data.students;
    } catch (error) {
        console.error('Error fetching students:', error);
        // Return dummy data for testing
        return Array.from({ length: 60 }, (_, i) => ({
            roll_no: `CSE${String(i + 1).padStart(3, '0')}`,
            name: `Student ${i + 1}`,
            class_id: classId
        }));
    }
}

async function populateStudentsGrid(classId) {
    const students = await fetchClassStudents(classId);
    const grid = document.querySelector('.students-grid');
    
    if (!students || students.length === 0) {
        grid.innerHTML = '<div class="empty-state">No students enrolled</div>';
        return;
    }
    
    grid.innerHTML = students.map(student => `
        <div class="student-tile" data-roll="${student.roll_no}" title="${student.name}">
            ${student.roll_no}
        </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.student-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            tile.classList.toggle('absent');
        });
    });
}


async function showAttendanceBoxes() {
    const selectedCourse = document.querySelector('.course-box.active');
    const activeTab = document.querySelector('.class-tabs .tab.active');
    
    if (!selectedCourse || !activeTab) return;
    
    const courseCode = selectedCourse.querySelector('.course-code').textContent;
    const classId = activeTab.dataset.classId;
    const outcomes = await fetchCourseOutcomes(courseCode);
    
    const attendanceForm = document.querySelector('.attendance-form');
    attendanceForm.innerHTML = `
        <div class="form-group">
            <label>Select Class Hours</label>
            <div class="hours-grid">
                <button class="hour-box" data-hour="1">1st Hour</button>
                <button class="hour-box" data-hour="2">2nd Hour</button>
                <button class="hour-box" data-hour="3">3rd Hour</button>
                <button class="hour-box" data-hour="4">4th Hour</button>
                <button class="hour-box" data-hour="5">5th Hour</button>
                <button class="hour-box" data-hour="6">6th Hour</button>
                <button class="hour-box" data-hour="7">7th Hour</button>
            </div>
        </div>

        <div class="form-group">
            <label>Course Outcome</label>
            <select id="courseOutcome">
                <option value="">Select outcome covered</option>
                ${outcomes.map(outcome => `
                    <option value="${outcome.id}" ${outcome.completed ? 'disabled' : ''}>
                        ${outcome.id}: ${outcome.description}
                        ${outcome.completed ? '(Completed)' : ''}
                    </option>
                `).join('')}
            </select>
        </div>

        <div class="attendance-grid">
            <div class="grid-header">
                <span>Click to mark absent</span>
            </div>
            <div class="students-grid">
                <!-- Will be populated dynamically -->
            </div>
        </div>

        <button class="submit-attendance">
            <span class="material-symbols-rounded">save</span>
            Save Attendance
        </button>
    `;

    // Add click handlers for hour boxes
    document.querySelectorAll('.hour-box').forEach(box => {
        box.addEventListener('click', () => {
            box.classList.toggle('selected');
        });
    });

    // Populate students grid
    await populateStudentsGrid(classId);
}


function updateCourseInfo(courseName, courseCode) {
    const header = document.querySelector('.course-info-header');
    header.querySelector('h1').textContent = courseName;
    header.querySelector('.course-code').textContent = courseCode;
    header.querySelector('.batch').textContent = 'Select a class';
}

function updateBatchInfo(className) {
    document.querySelector('.course-meta .batch').textContent = className;
}

function updateStudentCount() {
    const attendanceItems = document.querySelectorAll('.attendance-item');
    const studentCount = document.querySelector('.student-count');
    const count = attendanceItems.length;
    
    studentCount.textContent = `${count} Student${count !== 1 ? 's' : ''}`;
}


/* Expected response format for Attendance API:
    {
        "success": true,
        "students": [
            {
                "name": "Alex Johnson",
                "rollNo": "CSE001",
                "attended": 24,
                "total": 32,
                "percentage": 75,
                "absences": [
                    {
                        "date": "2025-03-20",
                        "course": "Machine Learning",
                        "hours": "2nd - 3rd Hour",
                        "courseOutcome": "CO2: Implementing CNNs"
                    },
                    {
                        "date": "2025-03-15",
                        "course": "Machine Learning",
                        "hours": "1st Hour",
                        "courseOutcome": "CO1: Understanding Neural Networks"
                    }
                ]
            },
            // ... more students with their attendance records
        ]
    }
*/

async function loadAttendanceData(classId) {
    // Dummy student data for testing
    const dummyStudents = [
        {
            name: "Alex Johnson",
            rollNo: "CSE001",
            attended: 24,
            total: 32,
            percentage: 75,
            absences: [
                {
                    date: '2025-03-20',
                    course: 'Machine Learning',
                    hours: '2nd - 3rd Hour',
                    courseOutcome: 'CO2: Implementing CNNs'
                },
                {
                    date: '2025-03-15',
                    course: 'Machine Learning',
                    hours: '1st Hour',
                    courseOutcome: 'CO1: Understanding Neural Networks'
                }
            ]
        },
        // ... more students
    ];

    try {
        // Try to fetch real data
        const response = await fetch(`/api/attendance/${classId}`);
        const data = await response.json();
        
        // If successful, use real data instead of dummy data
        if (response.ok) {
            updateAttendanceList(data.students);
            return;
        }
    } catch (error) {
        console.error('Error loading attendance data:', error);
        // On error, fall back to dummy data
    }

    // Use dummy data if API call fails
    updateAttendanceList(dummyStudents);
}

// Helper function to update the attendance list
function updateAttendanceList(students) {
    const attendanceList = document.querySelector('.attendance-list');
    attendanceList.innerHTML = students.map(student => `
        <div class="attendance-item" data-student='${JSON.stringify(student)}'>
            <div class="student-info">
                <span class="roll-no">${student.rollNo}</span>
                <span class="student-name">${student.name}</span>
            </div>
            <div class="attendance-stats">
                <div class="hours">
                    <span class="attended">${student.attended}</span>
                    <span class="separator">/</span>
                    <span class="total">${student.total}</span>
                </div>
                <div class="percentage ${getAttendanceClass(student.percentage)}">
                    ${student.percentage}%
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers
    attendanceList.querySelectorAll('.attendance-item').forEach(item => {
        item.addEventListener('click', () => {
            const student = JSON.parse(item.dataset.student);
            showAbsenceDetails(student);
        });
    });

    updateStudentCount();
}

function getAttendanceClass(percentage) {
    if (percentage >= 75) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
}

function showAbsenceDetails(student) {
    const popup = document.querySelector('.absence-popup');
    const list = popup.querySelector('.absence-list');
    const attendanceList = document.querySelector('.attendance-list');
    
    // Update header with student info
    popup.querySelector('h3').textContent = `Absence Details - ${student.name} (${student.rollNo})`;
    
    // Populate absence list
    list.innerHTML = student.absences.map(absence => `
        <div class="absence-item">
            <div class="details">
                <span class="course">${absence.course}</span>
                <span class="hours">${absence.hours}</span>
                <small class="date">${new Date(absence.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</small>
            </div>
            <span class="course-outcome">${absence.courseOutcome}</span>
        </div>
    `).join('');
    
    // Show popup
    attendanceList.classList.add('blur');
    popup.classList.add('show');

        popup.querySelector('.absence-popup-close').addEventListener('click', () => {
        popup.classList.remove('show');
        attendanceList.classList.remove('blur');
    });
}

// Close popup when clicking outside
document.addEventListener('click', (e) => {
    const popup = document.querySelector('.absence-popup');
    const attendanceList = document.querySelector('.attendance-list');
    
    if (popup && !popup.contains(e.target) && !e.target.closest('.attendance-item')) {
        popup.classList.remove('show');
        attendanceList.classList.remove('blur');
    }
});

async function fetchCourses() {
    try {
        const response = await fetch('/api/courses', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }

        const data = await response.json();
        return data.courses;
    } catch (error) {
        console.error('Error fetching courses:', error);
        // Return dummy data for testing
        return [
            {
                courseCode: "CS-410",
                courseName: "Machine Learning",
                classId: "AI22",
                completionPercentage: 65,
                department: "CSE"
            },
            {
                courseCode: "CS-420",
                courseName: "Deep Learning",
                classId: "AI23",
                completionPercentage: 45,
                department: "CSE"
            },
            {
                courseCode: "CS-430",
                courseName: "Computer Vision",
                classId: "AI24",
                completionPercentage: 85,
                department: "CSE"
            }
        ];
    }
}

async function updateCourses() {
    const coursesGrid = document.querySelector('.courses-grid');
    coursesGrid.innerHTML = '<div class="loading">Loading courses...</div>';
    try {
        const courses = await fetchCourses();
        
        coursesGrid.innerHTML = courses.map(course => `
            <div class="course-box">
                <div class="course-content">
                    <div class="course-icon" style="background: ${getDepartmentColor(course.department)};">
                        <span class="material-symbols-rounded">${getDepartmentIcon(course.department)}</span>
                    </div>
                    <h3>${course.courseName}</h3>
                    <p class="course-info">
                        <span class="course-code">${course.courseCode}</span>
                        <span class="separator">•</span>
                        <span class="class-id">${course.classId}</span>
                    </p>
                </div>
            </div>
        `).join('');

        // Add click handlers
        coursesGrid.querySelectorAll('.course-box').forEach(box => {
            box.addEventListener('click', () => {
                handleCourseSelection(box);
            });
        });
    } catch (error) {
        coursesGrid.innerHTML = '<div class="error">Failed to load courses</div>';
    }
}

/* Expected response format for Course Outcomes API :
        {
            "success": true,
            "outcomes": [
                {
                    "id": "CO1",
                    "description": "Understanding Neural Networks",
                    "completed": false
                },
                {
                    "id": "CO2",
                    "description": "Implementing CNNs",
                    "completed": true
                }
                // ... more outcomes
            ]
        }
*/
        

async function fetchCourseOutcomes(courseCode) {
    try {
        const response = await fetch(`/api/courses/${courseCode}/outcomes`);
        if (!response.ok) throw new Error('Failed to fetch course outcomes');
        const data = await response.json();
        return data.outcomes;
    } catch (error) {
        console.error('Error fetching course outcomes:', error);
        // Return dummy data for testing
        return [
            { id: 'CO1', description: 'Understanding Neural Networks', completed: false },
            { id: 'CO2', description: 'Implementing CNNs', completed: true },
            { id: 'CO3', description: 'Training Models', completed: false }
        ];
    }
}



// Add helper functions from dash-git.js
function getDepartmentIcon(department) {
    const icons = {
        'CSE': 'code',
        'MECH': 'build',
        'EEE': 'electric_bolt',
        'CIVIL': 'architecture',
        'default': 'school'
    };
    
    return icons[department] || icons.default;
}

function getDepartmentColor(department) {
    const colors = {
        'CSE': '#e0e7ff',
        'MECH': '#ffe0e0',
        'EEE': '#fff0e0',
        'CIVIL': '#e0ffe0',
        'default': '#e0e7ff'
    };
    
    return colors[department] || colors.default;
}

async function handleCourseSelection(courseBox) {
    // Remove active state from all courses
    document.querySelectorAll('.course-box').forEach(box => {
        box.classList.remove('active');
    });
    
    // Add active state to selected course
    courseBox.classList.add('active');
    
    // Get course data
    const courseCode = courseBox.querySelector('.course-code').textContent;
    const courseName = courseBox.querySelector('h3').textContent;
    
    try {
        // Fetch course data including classes
        const response = await fetch(`/course/data?course_id=${courseCode}`);
        const data = await response.json();
        
        if (!data.courses || data.courses.length === 0) {
            alert("Failed to load course data");
            return;
        }

        // Setup class tabs based on course data
        setupClassTabs(data.courses);
        
        // Update course info using first course entry
        updateCourseInfo(courseName, courseCode);

        // Initially hide attendance boxes
        hideAttendanceBoxes();

    } catch (error) {
        console.error("Error fetching course data:", error);
        alert("Failed to load course details.");
    }
}

function setupClassTabs(courses) {
    const tabsContainer = document.querySelector('.class-tabs');
    tabsContainer.innerHTML = '';
    tabsContainer.style.display = 'flex';
    
    courses.forEach((course, index) => {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.classId = course.class_id;
        tab.innerHTML = `<span>${course.class_name}</span>`;
        
        tab.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.class-tabs .tab').forEach(t => {
                t.classList.remove('active');
            });
            tab.classList.add('active');
            
            // Update batch info
            updateBatchInfo(course.class_name);
            
            // Show attendance boxes and load data
            showAttendanceBoxes();
            loadAttendanceData(course.class_id);
        });
        
        tabsContainer.appendChild(tab);
    });
}


/* Expected request format for attendance submission:
{
    "date": "2025-03-23",  // Current date in YYYY-MM-DD format
    "hours": [1, 2, 3],    // Array of selected hour numbers
    "courseOutcome": "CO2", // Selected course outcome ID
    "absentStudents": [    // Array of roll numbers of absent students
        "CSE001",
        "CSE002"
    ]
}
*/

// Submit attendance handler
document.querySelector('.submit-attendance').addEventListener('click', async function() {
    const selectedHours = Array.from(document.querySelectorAll('.hour-box.selected'))
        .map(box => parseInt(box.dataset.hour))
        .sort((a, b) => a - b);
    
    const courseOutcome = document.getElementById('courseOutcome').value;
    const selectedClass = document.querySelector('.tab.active');
    const selectedCourse = document.querySelector('.course-box.active');
    
    if (!selectedClass || !selectedCourse) {
        alert('Please select a course and class first');
        return;
    }
    
    if (selectedHours.length === 0) {
        alert('Please select at least one hour');
        return;
    }
    
    if (!courseOutcome) {
        alert('Please select a course outcome');
        return;
    }

    const absentStudents = Array.from(document.querySelectorAll('.student-tile.absent'))
        .map(tile => tile.dataset.roll);

    try {
        const response = await fetch('/api/attendance/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: new Date().toISOString().split('T')[0],
                hours: selectedHours,
                courseOutcome,
                absentStudents
            })
        });

        if (response.ok) {
            alert('Attendance updated successfully');
        }
    } catch (error) {
        console.error('Error updating attendance:', error);
    }
});

// Update existing code to add click handlers

