document.addEventListener("DOMContentLoaded", () => {
    const coursesGrid = document.querySelector(".courses-grid");
    const classTabs = document.querySelector(".class-tabs");
    const attendanceList = document.querySelector(".attendance-list");

    // Set current date in header
    document.querySelector(".current-date").textContent = new Date().toLocaleDateString(
        "en-US",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    );

    // Hide class tabs and attendance boxes initially
    classTabs.style.display = "none";
    hideAttendanceBoxes();

    // Set up mutation observer for student count
    new MutationObserver(updateStudentCount).observe(attendanceList, {
        childList: true,
        subtree: true,
    });

    // Load and handle course selection
    updateCourses();
    coursesGrid.addEventListener("click", (e) => {
        const courseBox = e.target.closest(".course-box");
        if (courseBox) handleCourseSelection(courseBox);
    });

    // Handle class selection
    classTabs.addEventListener("click", (e) => {
        const tab = e.target.closest(".tab");
        if (!tab) return;

        document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        updateBatchInfo(tab.querySelector("span").textContent);
        showAttendanceBoxes();
        loadAttendanceData(tab.dataset.classId);
    });
});

function hideAttendanceBoxes() {
    const emptyState = '<div class="empty-state">Select a course and class to view attendance</div>';
    document.querySelector(".attendance-list").innerHTML = emptyState;
    document.querySelector(".attendance-form").innerHTML = emptyState.replace("view", "update");
}

async function fetchClassStudents(classId) {
    try {
        const response = await fetch("/api/attendance/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classId }),
        });

        const data = await response.json();
        if (!data.success) {
            console.error("Failed to fetch students:", data.message);
            return [];
        }

        return data.students; // Ensure the returned data is used correctly
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
}

async function populateStudentsGrid(classId) {
    const students = await fetchClassStudents(classId);
    const grid = document.querySelector(".students-grid");
    console.log(students+"Hello");
    if (!grid) {
        console.error("Students grid container not found.");
        return;
    }

    function shortenRollNumber(rollNo) {
        const dept = rollNo.substring(0, 3);
        const number = rollNo.slice(-3);
        return `${dept}${number}`;
    }

    grid.innerHTML =
        students.length > 0
            ? students
                  .map(
                      (student) => `
            <div class="student-tile" data-roll="${student.roll_no}" title="${student.name}">
                ${shortenRollNumber(student.roll_no)}<!-- Display roll number -->
            </div>
        `
                  )
                  .join("")
            : '<div class="empty-state">No students enrolled</div>';

    // Add click handlers to toggle 'absent' class
    grid.querySelectorAll(".student-tile").forEach((tile) => {
        tile.addEventListener("click", () => tile.classList.toggle("absent"));
    });
}

async function showAttendanceBoxes() {
    const selectedCourse = document.querySelector(".course-box.active");
    const activeTab = document.querySelector(".class-tabs .tab.active");

    if (!selectedCourse || !activeTab) {
        console.error("No course or class selected.");
        return;
    }

    const courseCode = selectedCourse.querySelector(".course-code").textContent;
    const classId = activeTab.dataset.classId;
    const outcomes = await fetchCourseOutcomes(courseCode);

    const attendanceForm = document.querySelector(".attendance-form");
    attendanceForm.innerHTML = `
        <div class="form-group">
            <label>Select Class Hours</label>
            <div class="hours-grid">
                ${[...Array(7)]
                    .map(
                        (_, i) => `
                    <button class="hour-box" data-hour="${i + 1}">
                        ${i + 1}${getHourSuffix(i + 1)} Hour
                    </button>
                `
                    )
                    .join("")}
            </div>
        </div>

        <div class="form-group">
            <label>Course Outcome</label>
            <select id="courseOutcome">
                <option value="">Select outcome covered</option>
                ${outcomes
                    .map(
                        (outcome) => `
                    <option value="${outcome.outcome_id}" ${outcome.completed ? "disabled" : ""}>
                        ${outcome.outcome_id}: ${outcome.outcome_description} ${outcome.completed ? "(Completed)" : ""}
                    </option>
                `
                    )
                    .join("")}
            </select>
        </div>

        <div class="attendance-grid">
            <div class="grid-header">Click to mark absent</div>
            <div class="students-grid"></div> <!-- Ensure this is the correct container -->
        </div>

        <button class="submit-attendance">
            <span class="material-symbols-rounded">save</span> Save Attendance
        </button>
    `;

    // Add click handlers to hour boxes
    document.querySelectorAll(".hour-box").forEach((box) => {
        box.addEventListener("click", () => box.classList.toggle("selected"));
    });

    // Populate students grid dynamically
    try {
        console.log("hey");
        await populateStudentsGrid(classId);
    } catch (error) {
        console.error("Error populating students grid:", error);
    }

    // Remove any existing event listener to avoid duplicate submissions
    const submitButton = document.querySelector(".submit-attendance");
    const newSubmitButton = submitButton.cloneNode(true);
    submitButton.parentNode.replaceChild(newSubmitButton, submitButton);

    // Add click handler for the submit button
    newSubmitButton.addEventListener("click", async () => {
        await handleAttendanceSubmission(classId, courseCode);
    });
}

async function handleAttendanceSubmission(classId, courseCode) {
    const selectedHours = getSelectedHours();
    const absentStudents = getAbsentStudents();
    const courseOutcome = document.getElementById("courseOutcome").value;

    if (selectedHours.length === 0) {
        alert("Please select at least one hour.");
        return;
    }

    if (!courseOutcome) {
        alert("Please select a course outcome.");
        return;
    }

    const attendanceData = {
        date: getCurrentDate(),
        hours: selectedHours,
        absentStudents,
        classId,
        courseId: courseCode,
        courseOutcome,
    };

    try {
        const response = await submitAttendance(attendanceData);
        if (response.ok) {
            alert("Attendance updated successfully.");
            window.location.reload();
        } else {
            throw new Error("Failed to update attendance.");
        }
    } catch (error) {
        console.error("Error updating attendance:", error);
        alert("An error occurred while updating attendance.");
    }
}

async function fetchCourseOutcomes(courseCode) {
    try {
        const response = await fetch(`/api/courses/${courseCode}/outcomes`);
        if (!response.ok) {
            throw new Error("Failed to fetch course outcomes");
        }

        const { outcomes } = await response.json();
        return outcomes;
    } catch (error) {
        console.error("Error fetching course outcomes:", error);
        return [];
    }
}

// Utility to get ordinal suffix for hour numbers
function getHourSuffix(hour) {
    if (hour === 1) return "st";
    if (hour === 2) return "nd";
    if (hour === 3) return "rd";
    return "th";
}

function updateCourseInfo(courseName, courseCode) {
    const header = document.querySelector(".course-info-header");
    header.querySelector("h1").textContent = courseName;
    header.querySelector(".course-code").textContent = courseCode;
    header.querySelector(".batch").textContent = "Select a class";
}

function updateBatchInfo(className) {
    document.querySelector(".course-meta .batch").textContent = className;
}

function updateStudentCount() {
    const count = document.querySelectorAll(".attendance-item").length;
    document.querySelector(".student-count").textContent = `${count} Student${count !== 1 ? "s" : ""}`;
}

// ✅ Load and update attendance data
async function loadAttendanceData(classId) {
    try {
        const response = await fetch(`/api/attendance/${classId}`);
        if (!response.ok) throw new Error("Failed to load attendance data");
        
        const { students } = await response.json();
        updateAttendanceList(students);
    } catch (error) {
        console.error("Error loading attendance data:", error);
    }
}

// ✅ Update the attendance list dynamically
function updateAttendanceList(students) {
    const attendanceList = document.querySelector(".attendance-list");

    attendanceList.innerHTML = students
        .map(
            ({ rollNo, name, attended, total, percentage }) => `
        <div class="attendance-item" data-student='${JSON.stringify({
            rollNo,
            name,
            attended,
            total,
            percentage,
        })}'>
            <div class="student-info">
                <span class="roll-no">${rollNo}</span> <!-- Display roll number -->
                <span class="student-name">${name}</span>
            </div>
            <div class="attendance-stats">
                <div class="hours">${attended}/${total}</div>
                <div class="percentage ${getAttendanceClass(percentage)}">
                    ${percentage}%
                </div>
            </div>
        </div>
    `
        )
        .join("");

    // ✅ Attach click handlers
    attendanceList.querySelectorAll(".attendance-item").forEach((item) => {
        item.addEventListener("click", () =>
            showAbsenceDetails(JSON.parse(item.dataset.student))
        );
    });

    updateStudentCount();
}

// ✅ Get attendance class based on percentage
function getAttendanceClass(percentage) {
    return percentage >= 75 ? "high" : percentage >= 60 ? "medium" : "low";
}

// ✅ Show absence details popup
function showAbsenceDetails({ name, rollNo, absences }) {
    const popup = document.querySelector(".absence-popup");
    const list = popup.querySelector(".absence-list");
    const attendanceList = document.querySelector(".attendance-list");

    // ✅ Update header with student info
    popup.querySelector("h3").textContent = `Absence Details - ${name} (${rollNo})`;

    // ✅ Populate absence list
    list.innerHTML = absences
        .map(
            ({ course, hours, date, courseOutcome }) => `
        <div class="absence-item">
            <div class="details">
                <span class="course">${course}</span>
                <span class="hours">${hours}</span>
                <small class="date">${formatDate(date)}</small>
            </div>
            <span class="course-outcome">${courseOutcome}</span>
        </div>
    `
        )
        .join("");

    // ✅ Show popup and blur background
    togglePopup(popup, attendanceList, true);
}

// ✅ Format date to a readable format
function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// ✅ Toggle popup visibility
function togglePopup(popup, attendanceList, show) {
    popup.classList.toggle("show", show);
    attendanceList.classList.toggle("blur", show);
}

// ✅ Close popup on button click
document.querySelector(".absence-popup-close").addEventListener("click", () => {
    const popup = document.querySelector(".absence-popup");
    const attendanceList = document.querySelector(".attendance-list");
    togglePopup(popup, attendanceList, false);
});

// ✅ Close popup when clicking outside
document.addEventListener("click", (e) => {
    const popup = document.querySelector(".absence-popup");
    if (popup.classList.contains("show") && !popup.contains(e.target) && !e.target.closest(".attendance-item")) {
        togglePopup(popup, document.querySelector(".attendance-list"), false);
    }
});

// ✅ Fetch course list from API
async function fetchCourses() {
    try {
        const response = await fetch("/api/courses", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch courses");
        }

        const { courses } = await response.json();
        return courses;
    } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
}

// ✅ Update course list in the UI
async function updateCourses() {
    const coursesGrid = document.querySelector(".courses-grid");
    coursesGrid.innerHTML = '<div class="loading">Loading courses...</div>';

    try {
        const courses = await fetchCourses();

        if (!courses.length) {
            coursesGrid.innerHTML = '<div class="error">No courses available</div>';
            return;
        }

        coursesGrid.innerHTML = courses
            .map(
                ({ courseName, courseCode, classId, department }) => `
                <div class="course-box" data-course='${JSON.stringify({ courseName, courseCode, classId })}'>
                    <div class="course-content">
                        <div class="course-icon" style="background: ${getDepartmentColor(department)};">
                            <span class="material-symbols-rounded">${getDepartmentIcon(department)}</span>
                        </div>
                        <h3>${courseName}</h3>
                        <p class="course-info">
                            <span class="course-code">${courseCode}</span>
                            <span class="separator">•</span>
                            <span class="class-id">${classId}</span>
                        </p>
                    </div>
                </div>
            `
            )
            .join("");

        // ✅ Add click handlers for course selection
        coursesGrid.querySelectorAll(".course-box").forEach((box) => {
            box.addEventListener("click", () => handleCourseSelection(box));
        });
    } catch (error) {
        coursesGrid.innerHTML = '<div class="error">Failed to load courses</div>';
    }
}

// ✅ Fetch course outcomes based on course code
async function fetchCourseOutcomes(courseCode) {
    try {
        const response = await fetch(`/api/courses/${courseCode}/outcomes`);
        if (!response.ok) {
            throw new Error("Failed to fetch course outcomes");
        }

        const { outcomes } = await response.json();
        return outcomes;
    } catch (error) {
        console.error("Error fetching course outcomes:", error);
        return [];
    }
}

// ✅ Get department-specific color (dummy function, replace with actual logic)
function getDepartmentColor(department) {
    const colors = {
        CSE: "#4CAF50",
        ECE: "#FF9800",
        MECH: "#2196F3",
        DEFAULT: "#9E9E9E",
    };
    return colors[department] || colors.DEFAULT;
}

// ✅ Get department-specific icon (dummy function, replace with actual logic)
function getDepartmentIcon(department) {
    const icons = {
        CSE: "computer",
        ECE: "settings_input_antenna",
        MECH: "build",
        DEFAULT: "school",
    };
    return icons[department] || icons.DEFAULT;
}

// ✅ Handle course selection (dummy function, add your logic)
function handleCourseSelection(box) {
    const courseData = JSON.parse(box.dataset.course);
    console.log("Selected Course:", courseData);
}
// ✅ Get department-specific icon
function getDepartmentIcon(department) {
    const icons = {
        CSE: "code",
        MECH: "build",
        EEE: "electric_bolt",
        CIVIL: "architecture",
        default: "school",
    };
    return icons[department] || icons.default;
}

// ✅ Get department-specific color
function getDepartmentColor(department) {
    const colors = {
        CSE: "#e0e7ff",
        MECH: "#ffe0e0",
        EEE: "#fff0e0",
        CIVIL: "#e0ffe0",
        default: "#e0e7ff",
    };
    return colors[department] || colors.default;
}

// ✅ Handle course selection
async function handleCourseSelection(courseBox) {
    // Remove active state from all courses
    document.querySelectorAll(".course-box").forEach((box) => box.classList.remove("active"));

    // Add active state to selected course
    courseBox.classList.add("active");

    // Extract course details
    const courseCode = courseBox.querySelector(".course-code").textContent;
    const courseName = courseBox.querySelector("h3").textContent;

    try {
        // Fetch course data including classes
        const response = await fetch(`/course/data?course_id=${courseCode}`);
        if (!response.ok) {
            throw new Error("Failed to load course data");
        }

        const data = await response.json();

        if (!data.courses || data.courses.length === 0) {
            alert("No class data found for this course.");
            return;
        }

        // ✅ Setup class tabs based on course data
        setupClassTabs(data.courses);

        // ✅ Update course info
        updateCourseInfo(courseName, courseCode);

        // ✅ Hide attendance boxes initially
        hideAttendanceBoxes();
    } catch (error) {
        console.error("Error fetching course data:", error);
        alert("Failed to load course details.");
    }
}

// ✅ Setup class tabs dynamically
function setupClassTabs(courses) {
    const tabsContainer = document.querySelector(".class-tabs");
    tabsContainer.innerHTML = "";
    tabsContainer.style.display = "flex";

    courses.forEach((course, index) => {
        const tab = document.createElement("div");
        tab.className = "tab";
        tab.dataset.classId = course.class_id;
        tab.innerHTML = `<span>${course.class_name}</span>`;

        // ✅ Handle tab click
        tab.addEventListener("click", () => handleClassSelection(tab, course.class_name, course.class_id));

        tabsContainer.appendChild(tab);

        // ✅ Set first tab as active initially
        if (index === 0) {
            tab.classList.add("active");
            updateBatchInfo(course.class_name);
            showAttendanceBoxes();
            loadAttendanceData(course.class_id);
        }
    });
}

// ✅ Handle class selection on tab click
function handleClassSelection(tab, className, classId) {
    // Remove active state from all tabs
    document.querySelectorAll(".class-tabs .tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // ✅ Update batch info
    updateBatchInfo(className);

    // ✅ Show attendance and load data
    showAttendanceBoxes();
    loadAttendanceData(classId);
}

// ✅ Update course information in the UI
function updateCourseInfo(courseName, courseCode) {
    const header = document.querySelector(".course-info-header");
    header.querySelector("h1").textContent = courseName;
    header.querySelector(".course-code").textContent = courseCode;
    header.querySelector(".batch").textContent = "Select a class";
}

// ✅ Update batch information in the UI
function updateBatchInfo(className) {
    document.querySelector(".course-meta .batch").textContent = className;
}

// ✅ Hide attendance boxes initially
function hideAttendanceBoxes() {
    document.querySelectorAll(".attendance-box").forEach((box) => (box.style.display = "none"));
}



// ✅ Load attendance data for the selected class
async function loadAttendanceData(classId) {
    try {
        const response = await fetch(`/api/attendance/${classId}`);
        if (!response.ok) throw new Error("Failed to load attendance data");

        const data = await response.json();
        if (data.students) {
            updateAttendanceList(data.students);
        }
    } catch (error) {
        console.error("Error loading attendance data:", error);
        alert("Failed to load attendance data.");
    }
}

/* ✅ Expected request format for attendance submission:
{
    "date": "2025-03-23",  // Current date in YYYY-MM-DD format
    "hours": [1, 2, 3],    // Array of selected hour numbers
    "absentStudents": [    // Array of roll numbers of absent students
        "CSE001",
        "CSE002"
    ],
    "classId": "CSE101",   // Class ID
    "courseId": "CS101"    // Course ID
}
*/

// ✅ Get selected hours
function getSelectedHours() {
    return Array.from(document.querySelectorAll(".hour-box.selected"))
        .map((box) => parseInt(box.dataset.hour))
        .sort((a, b) => a - b);
}

// ✅ Get absent students
function getAbsentStudents() {
    return Array.from(document.querySelectorAll(".student-tile.absent")).map(
        (tile) => tile.dataset.roll
    );
}

// ✅ Get current date in YYYY-MM-DD format
function getCurrentDate() {
    return new Date().toISOString().split("T")[0];
}

// ✅ Submit attendance to API
async function submitAttendance(attendanceData) {
    return await fetch("/api/attendance/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceData),
    });
}

// ✅ Add click handlers for hour and student selection
document.querySelectorAll(".hour-box").forEach((box) => {
    box.addEventListener("click", () => box.classList.toggle("selected"));
});

document.querySelectorAll(".student-tile").forEach((tile) => {
    tile.addEventListener("click", () => tile.classList.toggle("absent"));
});
