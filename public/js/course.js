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
            alert("No course details found.");
            return;
        }
        console.log(data);

        // Use the first course row to set a global title (assuming course_name is same across classes)
        document.title = `Course: ${data.courses[0].course_name}`;

        // Build a mapping from class_id to course details (e.g., class_name)
        const courseMap = {};
        data.courses.forEach(course => {
            courseMap[course.class_id] = course;
        });

        // Group students by class_id
        const studentsByClass = {};
        data.students.forEach(student => {
            if (!studentsByClass[student.class_id]) {
                studentsByClass[student.class_id] = [];
            }
            studentsByClass[student.class_id].push(student);
        });

        // Group assignments by class_id
        const assignmentsByClass = {};
        data.assignments.forEach(assignment => {
            if (!assignmentsByClass[assignment.class_id]) {
                assignmentsByClass[assignment.class_id] = [];
            }
            assignmentsByClass[assignment.class_id].push(assignment);
        });

        // Group grades by class_id
        const gradesByClass = {};
        data.grades.forEach(grade => {
            if (!gradesByClass[grade.class_id]) {
                gradesByClass[grade.class_id] = [];
            }
            gradesByClass[grade.class_id].push(grade);
        });

        // Generate Tabs based on class IDs available in courseMap
        const tabsContainer = document.getElementById("classTabs");
        const contentContainer = document.getElementById("tabContents");

        Object.keys(courseMap).forEach((classId, index) => {
            const classInfo = courseMap[classId];

            // Create a tab for the class
            const tab = document.createElement("div");
            tab.className = `tab ${index === 0 ? "active" : ""}`;
            tab.innerText = classInfo.class_name;
            tab.dataset.classId = classId;
            tabsContainer.appendChild(tab);

            // Create tab content for the class
            const contentDiv = document.createElement("div");
            contentDiv.className = `tab-content ${index === 0 ? "active" : ""}`;
            contentDiv.dataset.classId = classId;

            // Students Table
            let studentsTable = `
                <h2>Students (${classInfo.class_name})</h2>
                <table>
                    <tr><th>Roll No</th><th>Name</th></tr>
                    ${ (studentsByClass[classId] || []).map(student => `
                        <tr>
                            <td>${student.roll_no}</td>
                            <td>${student.name}</td>
                        </tr>
                    `).join("")}
                </table>
            `;

            // Assignments Table
            let assignmentsTable = `
                <h2>Assignments (${classInfo.class_name})</h2>
                <table>
                    <tr><th>ID</th><th>Title</th><th>Deadline</th><th>Submission Link</th></tr>
                    ${ (assignmentsByClass[classId] || []).map(assignment => `
                        <tr>
                            <td>${assignment.assignment_id}</td>
                            <td>${assignment.title}</td>
                            <td>${assignment.deadline}</td>
                            <td><a href="${assignment.submission_link}" target="_blank">Submit</a></td>
                        </tr>
                    `).join("")}
                </table>
            `;

            // Grades Table
            let gradesTable = `
                <h2>Grades (${classInfo.class_name})</h2>
                <table>
                    <tr><th>Roll No</th><th>Student Name</th><th>Assignment ID</th><th>Grade</th></tr>
                    ${ (gradesByClass[classId] || []).map(grade => `
                        <tr>
                            <td>${grade.roll_no}</td>
                            <td>${grade.name}</td>
                            <td>${grade.assignment_id}</td>
                            <td>${grade.grade}</td>
                        </tr>
                    `).join("")}
                </table>
            `;

            // Deadlines are course-specific (not per class) so we show them once in every tab
            let deadlinesTable = `
                <h2>Deadlines</h2>
                <table>
                    <tr><th>Deadline Name</th><th>Date</th></tr>
                    ${ data.deadlines.map(deadline => `
                        <tr>
                            <td>${deadline.deadline_name}</td>
                            <td>${deadline.date}</td>
                        </tr>
                    `).join("")}
                </table>
            `;

            contentDiv.innerHTML = studentsTable + assignmentsTable + gradesTable + deadlinesTable;
            contentContainer.appendChild(contentDiv);
        });

        // Tab Switching Logic
        document.querySelectorAll(".tab").forEach(tab => {
            tab.addEventListener("click", function () {
                document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
                document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

                this.classList.add("active");
                document.querySelector(`.tab-content[data-class-id="${this.dataset.classId}"]`).classList.add("active");
            });
        });

    } catch (error) {
        console.error("Error fetching course data:", error);
        alert("Failed to load course details.");
    }
});
