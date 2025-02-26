const express = require("express");
const path = require("path");
const db = require("../config/db");

const router = express.Router();

// Serve Dashboard Page
router.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "../public/html/dashboard.html"));
});

// API to Fetch Dashboard Data
router.get("/dashboard/data", async (req, res) => {
    if (!req.session.user) {
        return res.json({ error: "Not authenticated" });
    }

    const faculty_id = req.session.user.faculty_id;

    try {
        // Fetch Courses
        const [courses] = await db.promise().query(
            "SELECT * FROM courses WHERE faculty_id = ?", 
            [faculty_id]
        );

        // Fetch Time Table
        const [timeTable] = await db.promise().query(
            "SELECT * FROM timetable WHERE faculty_id = ?", 
            [faculty_id]
        );

        // Fetch Academic Calendar
        const [academicCalendar] = await db.promise().query(
            "SELECT * FROM academic_calendar WHERE faculty_id = ?", 
            [faculty_id]
        );

        res.json({
            courses,
            timeTable,
            academicCalendar
        });

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// API to Select Course and Store in Session
router.post("/dashboard/select-course", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    const { course_id } = req.body;
    if (!course_id) {
        return res.status(400).json({ error: "Course ID is required" });
    }

    console.log(course_id);
    req.session.course_id = course_id; // Store course_id in session
    res.json({ success: true });
});

module.exports = router;
