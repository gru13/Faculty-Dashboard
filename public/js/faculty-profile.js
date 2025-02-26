document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("/session-data"); // API to get session user data
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch session data");
        }

        if (!data.user) {
            window.location.href = "/login.html"; // Redirect to login if no session
            return;
        }

        // Set session data to UI
        document.getElementById("facultyName").textContent = data.user.name || "N/A";
        document.getElementById("facultyEmail").textContent = data.user.email_id || "N/A";
        document.getElementById("facultyDepartment").textContent = data.user.department || "N/A";
        document.getElementById("facultyPhone").textContent = data.user.mobile_no || "N/A";

        // Store data for editing
        sessionStorage.setItem("facultyData", JSON.stringify(data.user));
    } catch (error) {
        console.error("Error fetching profile:", error);
    }
});

function editProfile() {
    const user = JSON.parse(sessionStorage.getItem("facultyData"));

    if (!user) {
        alert("No profile data found.");
        return;
    }

    document.getElementById("editName").value = user.name || "";
    document.getElementById("editDepartment").value = user.department || "";
    document.getElementById("editPhone").value = user.mobile_no || "";

    document.querySelector(".profile").style.display = "none";
    document.getElementById("editForm").style.display = "block";
}

function cancelEdit() {
    document.getElementById("editForm").style.display = "none";
    document.querySelector(".profile").style.display = "block";
}

document.getElementById("profileForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const updatedProfile = {
        name: document.getElementById("editName").value,
        department: document.getElementById("editDepartment").value,
        mobile_no: document.getElementById("editPhone").value
    };

    try {
        const response = await fetch("/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedProfile)
        });

        const result = await response.json();
        alert(result.message);

        if (response.ok) {
            sessionStorage.setItem("facultyData", JSON.stringify({ ...JSON.parse(sessionStorage.getItem("facultyData")), ...updatedProfile }));
            window.location.reload(); // Refresh to update UI
        }
    } catch (error) {
        console.error("Update failed:", error);
        alert("Failed to update profile.");
    }
});
