
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course_id');

    if (!courseId) {
        alert("Course ID is missing in the URL.");
        return;
    }

    try {
        const response = await fetch(`/course?course_id=${courseId}`);
        const data = await response.json();

        if (!data.course.course_id) {
            alert("Invalid Course ID.");
            return;
        }

        document.getElementById("course-title").innerText = `${data.course.course_name} - ${data.course.class_name}`;
        document.getElementById("faculty-name").innerText = `Faculty: ${data.course.faculty_name}`;
        document.getElementById("resources").href = data.course.resources_link;

        // Populate student list
        const studentList = document.getElementById("student-list");
        data.students.forEach(student => {
            const li = document.createElement("li");
            li.innerText = `${student.roll_no} - ${student.name}`;
            studentList.appendChild(li);
        });

        // Populate assignments
        const assignmentList = document.getElementById("assignment-list");
        data.assignments.forEach(assignment => {
            const li = document.createElement("li");
            li.innerHTML = `<b>${assignment.title}</b>: ${assignment.details} (Due: ${assignment.deadline}) 
                            <a href="${assignment.submission_link}">View</a>`;
            assignmentList.appendChild(li);
        });

        // Populate grades
        const gradeList = document.getElementById("grade-list");
        data.grades.forEach(grade => {
            const li = document.createElement("li");
            li.innerText = `${grade.roll_no} - ${grade.name}: Grade ${grade.grade}`;
            gradeList.appendChild(li);
        });

        // Populate deadlines
        const deadlineList = document.getElementById("deadline-list");
        data.deadlines.forEach(deadline => {
            const li = document.createElement("li");
            li.innerText = `${deadline.deadline_name}: ${deadline.date}`;
            deadlineList.appendChild(li);
        });

    } catch (error) {
        console.error("Error fetching course details:", error);
        alert("Failed to fetch course data.");
    }
});
