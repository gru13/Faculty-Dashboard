document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get("assignment_id");

    if (!assignmentId) {
        alert("Assignment ID is missing in the URL.");
        return;
    }

    try {
        const response = await fetch(`/assignment/data?assignment_id=${assignmentId}`);
        const data = await response.json();
        
        if (!data.assignment) {
            alert("No assignment details found.");
            return;
        }
        console.log(data);

        // Populate assignment details
        document.getElementById("assignment-title").innerText = data.assignment.title;
        document.getElementById("assignment-details").innerText = data.assignment.details;
        document.getElementById("assignment-deadline").innerText = new Date(data.assignment.deadline).toLocaleString();
        document.getElementById("assignment-link").href = data.assignment.submission_link;
        document.getElementById("assignment-doc").href = data.assignment.assignment_doc_url;
        document.getElementById("assignment-max-marks").innerText = data.assignment.max_marks; // Ensure max marks are populated

        // Populate submissions table
        const submissionsTableBody = document.getElementById("submissionsTableBody");
        if (data.submissions.length === 0) {
            submissionsTableBody.innerHTML = `<tr><td colspan="6">No submissions made yet.</td></tr>`;
        } else {
            submissionsTableBody.innerHTML = data.submissions.map(submission => `
                <tr>
                    <td>${submission.roll_no}</td>
                    <td>${submission.name}</td>
                    <td>${new Date(submission.submission_date).toLocaleString()}</td>
                    <td><a href="${submission.file_link}" target="_blank">View</a></td>
                    <td contenteditable="true" class="editable-grade" data-submission-id="${submission.submission_id}" data-roll-no="${submission.roll_no}" data-assignment-id="${assignmentId}">${submission.grade || ''}</td>
                    <td>
                        <button class="save-grade-btn" data-submission-id="${submission.submission_id}" data-roll-no="${submission.roll_no}" data-assignment-id="${assignmentId}">Save</button>
                    </td>
                </tr>
            `).join("");
        }

        document.querySelector(".edit-assignment-btn").addEventListener("click", function () {
            document.getElementById("edit-assignment-title").value = data.assignment.title;
            document.getElementById("edit-assignment-details").value = data.assignment.details;
            document.getElementById("edit-assignment-deadline").value = new Date(data.assignment.deadline).toISOString().slice(0, 16);
            document.getElementById("edit-assignment-link").value = data.assignment.submission_link;
            document.getElementById("edit-assignment-max-marks").value = data.assignment.max_marks;
            document.getElementById("assignmentForm").style.display = "block";
        });

        document.getElementById("save-assignment").addEventListener("click", async function () {
            const title = document.getElementById("edit-assignment-title").value;
            const details = document.getElementById("edit-assignment-details").value;
            const deadline = document.getElementById("edit-assignment-deadline").value;
            const link = document.getElementById("edit-assignment-link").value;
            const maxMarks = document.getElementById("edit-assignment-max-marks").value;

            if (!title || !details || !deadline || !link || !maxMarks) {
                alert("All fields are required.");
                return;
            }

            try {
                const response = await fetch(`/assignment/edit`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ assignmentId, title, details, deadline, link, maxMarks })
                });

                const result = await response.json();
                if (result.success) {
                    alert("Assignment updated successfully!");
                    location.reload();
                } else {
                    alert("Failed to update assignment.");
                }
            } catch (error) {
                console.error("Error updating assignment:", error);
                alert("An error occurred.");
            }
        });

        document.querySelectorAll(".save-grade-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const submissionId = this.dataset.submissionId;
                const rollNo = this.dataset.rollNo;
                const gradeCell = document.querySelector(`.editable-grade[data-submission-id="${submissionId}"]`);
                const grade = gradeCell.innerText;

                if (!grade) {
                    alert("Grade is required.");
                    return;
                }

                try {
                    const response = await fetch(`/assignment/grade`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ submissionId, rollNo, grade })
                    });

                    const result = await response.json();
                    if (result.success) {
                        alert("Grade saved successfully!");
                    } else {
                        alert("Failed to save grade.");
                    }
                } catch (error) {
                    console.error("Error saving grade:", error);
                    alert("An error occurred.");
                }
            });
        });

    } catch (error) {
        console.error("Error fetching assignment data:", error);
        alert("Failed to load assignment details.");
    }
});
