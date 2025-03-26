const express = require("express");
const path = require("path");
const router = express.Router();

// Serve Login Page (Default)
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/html/login.html"));
});

// Serve Register Page
router.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/html/register.html"));
});

// Serve Forgot Password Page
router.get("/forgot-password", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/html/forgot-password.html"));
});

// Serve Dashboard Page (Protected Route)
router.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    if (req.session.user.role === 'admin') {
        return res.redirect("/admin");
    }
    res.sendFile(path.join(__dirname, "../public/html/dashboard.html"));
});

// Serve Admin Page (Protected Route)
router.get("/admin", (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "../public/html/admin.html"));
});

router.get("/profile", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "../public/html/faculty-profile.html"));
});

router.get("/attendance", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "../public/html/attendance.html"));
});

module.exports = router;
