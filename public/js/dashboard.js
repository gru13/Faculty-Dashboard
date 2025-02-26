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

            if (data.courses.length === 0) {
                courseList.textContent = "No courses available.";
                return;
            }

            // Create table element
            const table = document.createElement("table");
            table.border = "1"; // Add border for visibility

            // Create table header dynamically
            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            const columns = Object.keys(data.courses[0]); // Get field names dynamically
            columns.forEach(colName => {
                const th = document.createElement("th");
                th.textContent = colName.replace(/_/g, " "); // Format column names
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create table body
            const tbody = document.createElement("tbody");
            data.courses.forEach(course => {
                const row = document.createElement("tr");
                row.style.cursor = "pointer"; // Make it clickable
                row.dataset.courseId = course.course_id; // Store course_id in dataset

                columns.forEach(field => {
                    const td = document.createElement("td");
                    td.textContent = course[field] !== null ? course[field] : "N/A"; // Handle null values
                    row.appendChild(td);
                });

                // Click event to navigate to course page
                row.addEventListener("click", function () {
                    const courseId = this.dataset.courseId;
                    
                    // Store course_id in session
                    fetch("/dashboard/select-course", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ course_id: courseId })
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            window.location.href = `/course?course_id=${courseId}`;

                        } else {
                            alert("Error selecting course");
                        }
                    })
                    .catch(error => console.error("Error selecting course:", error));
                });

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            courseList.appendChild(table);

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
