document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const toggleRegister = document.getElementById("toggleRegister");
    const toggleLogin = document.getElementById("toggleLogin");
    const formTitle = document.getElementById("formTitle");
    const message = document.getElementById("message");

    // Toggle between login and register form
    toggleRegister.addEventListener("click", function () {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
        toggleRegister.style.display = "none";
        toggleLogin.style.display = "inline-block";
        formTitle.textContent = "Sign Up";
    });

    toggleLogin.addEventListener("click", function () {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        toggleRegister.style.display = "inline-block";
        toggleLogin.style.display = "none";
        formTitle.textContent = "Login";
    });

    // Login Form Submission
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        const email_id = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email_id, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Login successful! Role: ${data.role}`);
            window.location.href = "dashboard.html"; // Redirect on success
        } else {
            message.textContent = "Login failed: " + data.message;
            message.style.color = "red";
        }
    });

    // Registration Form Submission
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email_id = document.getElementById("regEmail").value;
        const password = document.getElementById("regPassword").value;
        const role = document.getElementById("role").value;

        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email_id, password, role }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration successful! You can now log in.");
            toggleLogin.click(); // Switch to login form
        } else {
            message.textContent = "Registration failed: " + data.message;
            message.style.color = "red";
        }
    });
});
