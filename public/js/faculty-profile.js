
document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("/session-data");
        const data = await response.json();

        if (response.ok) {
            document.getElementById("facultyName").textContent = data.user.name;
            document.getElementById("facultyEmail").textContent = data.user.email_id;
            document.getElementById("facultyDepartment").textContent = data.user.department;
            document.getElementById("facultyPhone").textContent = data.user.mobile_no;

            const profileImg = document.getElementById("facultyProfilePic");
            profileImg.src = data.user.profile_pic ? data.user.profile_pic : "/uploads/default.jpg";

            // Pre-fill form
            document.getElementById("editName").value = data.user.name;
            document.getElementById("editDepartment").value = data.user.department;
            document.getElementById("editPhone").value = data.user.mobile_no;
            document.getElementById("previewImage").src = data.user.profile_pic || "/uploads/default.jpg";
        } else {
            console.error("Error fetching faculty profile:", data.message);
        }
    } catch (error) {
        console.error("Failed to load profile:", error);
    }
});

// 📌 Show edit form
function editProfile() {
    document.getElementById("editForm").classList.remove("hidden");
}

// 📌 Hide edit form
function cancelEdit() {
    document.getElementById("editForm").classList.add("hidden");
}

// 📌 Handle image preview
document.getElementById("editProfilePic").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("previewImage").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 📌 Handle form submission
document.getElementById("profileForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("editName").value);
    formData.append("department", document.getElementById("editDepartment").value);
    formData.append("mobile_no", document.getElementById("editPhone").value);

    const fileInput = document.getElementById("editProfilePic");
    if (fileInput.files.length > 0) {
        formData.append("profile_pic", fileInput.files[0]);
    }

    try {
        const response = await fetch("/update-profile", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        if (response.ok) {
            alert("Profile updated successfully!");
            window.location.reload();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Error updating profile:", error);
    }
});
