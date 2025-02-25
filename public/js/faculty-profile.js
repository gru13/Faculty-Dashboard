document.addEventListener("DOMContentLoaded", function () {
    fetchProfile();
});

// ✅ Fetch Faculty Profile Data
function fetchProfile() {
    fetch("/profile")
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            document.getElementById("facultyName").textContent = data.name;
            document.getElementById("facultyEmail").textContent = data.email;
            document.getElementById("facultyDepartment").textContent = data.department;
            document.getElementById("facultyPhone").textContent = data.phone;
        })
        .catch(error => console.error("Error fetching profile:", error));
}

// ✅ Edit Profile Function
function editProfile() {
    document.getElementById("editForm").classList.remove("hidden");

    document.getElementById("editName").value = document.getElementById("facultyName").textContent;
    document.getElementById("editDepartment").value = document.getElementById("facultyDepartment").textContent;
    document.getElementById("editPhone").value = document.getElementById("facultyPhone").textContent;
}

// ✅ Cancel Edit Function
function cancelEdit() {
    document.getElementById("editForm").classList.add("hidden");
}

// ✅ Save Edited Profile
document.getElementById("profileForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const updatedData = {
        name: document.getElementById("editName").value,
        department: document.getElementById("editDepartment").value,
        phone: document.getElementById("editPhone").value
    };

    fetch("/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Profile updated!");
            fetchProfile(); // Refresh UI
            document.getElementById("editForm").classList.add("hidden");
        } else {
            alert("Update failed: " + data.error);
        }
    })
    .catch(error => console.error("Error updating profile:", error));
});
