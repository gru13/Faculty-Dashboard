document.addEventListener("DOMContentLoaded", function () {
    // Fetch Dashboard Data
    fetch("/dashboard/data")
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                window.location.href = "/";
                return;
            }

            // Populate Course List
            const courseList = document.getElementById("courseList");
            courseList.innerHTML = ""; // Clear previous data

            // Create table element
            const table = document.createElement("table");
            table.border = "1"; // Add border for visibility

            // Create table header
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            // Define column names (adjust based on actual DB fields)
            const columns = ["Course Name", "Course id", "Class ID", "Faculty ID", "Resources Link"];
            columns.forEach(colName => {
                const th = document.createElement("th");
                th.textContent = colName;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create table body
            const tbody = document.createElement("tbody");
            data.courses.forEach(course => {
                const row = document.createElement("tr");

                // Add each field as a cell
                const fields = [course.course_name, course.course_id, course.class_id, course.faculty_id, course.resources_link];
                fields.forEach(field => {
                    const td = document.createElement("td");
                    td.textContent = field;
                    row.appendChild(td);
                });

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            courseList.appendChild(table); // Append the table to the container


            // Populate Time Table
            document.getElementById("timeTable").textContent = data.timeTable || "No timetable available.";

            // Populate Academic Calendar
            document.getElementById("academicCalendar").textContent = data.academicCalendar || "No academic calendar available.";

            // Populate Notifications
            const notifications = document.getElementById("notifications");
            notifications.innerHTML = "";
            data.notifications.forEach(notification => {
                const li = document.createElement("li");
                li.textContent = notification;
                notifications.appendChild(li);
            });
        })
        .catch(error => console.error("Error loading dashboard:", error));
});

// Logout Functionality
document.getElementById("logoutBtn").addEventListener("click", function () {
    fetch("/logout", { method: "POST" })
        .then(() => window.location.href = "/")
        .catch(error => console.error("Logout failed:", error));
});
