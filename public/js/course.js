// //  this is course.js

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

        document.title = `Course: ${data.courses[0].course_name}`;

        const courseMap = {};
        data.courses.forEach(course => {
            courseMap[course.class_id] = course;
        });

        const studentsByClass = {};
        data.students.forEach(student => {
            if (!studentsByClass[student.class_id]) {
                studentsByClass[student.class_id] = [];
            }
            studentsByClass[student.class_id].push(student);
        });

        const assignmentsByClass = {};
        data.assignments.forEach(assignment => {
            if (!assignmentsByClass[assignment.class_id]) {
                assignmentsByClass[assignment.class_id] = [];
            }
            assignmentsByClass[assignment.class_id].push(assignment);
        });

        const tabsContainer = document.getElementById("classTabs");
        const contentContainer = document.getElementById("tabContents");

        Object.keys(courseMap).forEach((classId, index) => {
            const classInfo = courseMap[classId];

            const tab = document.createElement("div");
            tab.className = `tab ${index === 0 ? "active" : ""}`;
            tab.innerText = classInfo.class_name;
            tab.dataset.classId = classId;
            tabsContainer.appendChild(tab);

            const contentDiv = document.createElement("div");
            contentDiv.className = `tab-content ${index === 0 ? "active" : ""}`;
            contentDiv.dataset.classId = classId;

            let addAssignmentButton = `<button class="add-assignment-btn" data-class-id="${classId}">+ Add Assignment</button>`;

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

            let assignmentsTable = `
                <h2>Assignments (${classInfo.class_name})</h2>
                <table>
                    <tr><th>ID</th><th>Title</th><th>Deadline</th><th>Submission Link</th><th>Document</th><th>Actions</th></tr>
                    ${ (assignmentsByClass[classId] || []).map(assignment => `
                        <tr>
                            <td>${assignment.assignment_id}</td>
                            <td>${assignment.title}</td>
                            <td>${new Date(assignment.deadline).toLocaleString()}</td> <!-- Format the date -->
                            <td><a href="${assignment.submission_link}" target="_blank">Submit</a></td>
                            <td><a href="${assignment.assignment_doc_url}" target="_blank">View</a></td>
                            <td>
                                <a href="/assignment?assignment_id=${assignment.assignment_id}" class="view-assignment-btn">View</a>
                                <button class="delete-assignment-btn" data-assignment-id="${assignment.assignment_id}">Delete</button>
                            </td>
                        </tr>
                    `).join("")}
                </table>
            `;

            let deadlinesTable = `
                <h2>Deadlines</h2>
                <table>
                    <tr><th>Deadline Name</th><th>Date</th></tr>
                    ${ data.deadlines.map(deadline => `
                        <tr>
                            <td>${deadline.deadline_name}</td>
                            <td>${new Date(deadline.date).toLocaleString()}</td> <!-- Format the date -->
                        </tr>
                    `).join("")}
                </table>
            `;

            contentDiv.innerHTML = addAssignmentButton + studentsTable + assignmentsTable + deadlinesTable;
            contentContainer.appendChild(contentDiv);
        });

        document.querySelectorAll(".tab").forEach(tab => {
            tab.addEventListener("click", function () {
                document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
                document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

                this.classList.add("active");
                document.querySelector(`.tab-content[data-class-id="${this.dataset.classId}"]`).classList.add("active");
            });
        });

        document.querySelectorAll(".add-assignment-btn").forEach(button => {
            button.addEventListener("click", function () {
                document.getElementById("assignmentForm").style.display = "block";
                document.getElementById("assignmentForm").dataset.classId = this.dataset.classId;
            });
        });

        document.querySelectorAll(".delete-assignment-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const assignmentId = this.dataset.assignmentId;
                if (confirm("Are you sure you want to delete this assignment?")) {
                    try {
                        const response = await fetch(`/course/delete-assignment/${assignmentId}`, {
                            method: "DELETE"
                        });
                        const result = await response.json();
                        if (result.success) {
                            alert("Assignment deleted successfully!");
                            location.reload();
                        } else {
                            alert("Failed to delete assignment.");
                        }
                    } catch (error) {
                        console.error("Error deleting assignment:", error);
                        alert("An error occurred.");
                    }
                }
            });
        });

        document.getElementById("save-assignment").addEventListener("click", async function () {
            const classId = document.getElementById("assignmentForm").dataset.classId;
            const title = document.getElementById("assignment-title").value;
            const details = document.getElementById("assignment-details").value;
            const deadline = document.getElementById("assignment-deadline").value;
            const link = document.getElementById("assignment-link").value;
            const maxMarks = document.getElementById("assignment-max-marks").value;
            const fileInput = document.getElementById("assignment-file");
            const file = fileInput.files[0];

            if (!title || !details || !deadline || !link || !maxMarks || !file) {
                alert("All fields are required.");
                return;
            }

            const formData = new FormData();
            formData.append("courseId", courseId);
            formData.append("classId", classId);
            formData.append("title", title);
            formData.append("details", details);
            formData.append("deadline", deadline);
            formData.append("link", link);
            formData.append("maxMarks", maxMarks);
            formData.append("file", file);
            formData.append("assignmentId", Date.now().toString()); // Generate assignmentId as string

            console.log("📂 Uploading file...", formData);

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

    } catch (error) {
        console.error("Error fetching course data:", error);
        alert("Failed to load course details.");
    }
});

