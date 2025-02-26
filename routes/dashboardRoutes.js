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
        // const [timeTableResult] = await db.promise().query(
        //     "SELECT timetable FROM FacultyTimeTable WHERE faculty_id = ?", 
        //     [faculty_id]
        // );
        // const timeTable = timeTableResult.length ? timeTableResult[0].timetable : null;

        // // Fetch Academic Calendar
        // const [academicCalendarResult] = await db.promise().query(
        //     "SELECT calendar FROM AcademicCalendar WHERE faculty_id = ?", 
        //     [faculty_id]
        // );
        // const academicCalendar = academicCalendarResult.length ? academicCalendarResult[0].calendar : null;

        // // Fetch Notifications
        // const [notificationsResult] = await db.promise().query(
        //     "SELECT message FROM Notifications WHERE faculty_id = ?", 
        //     [faculty_id]
        // );
        // const notifications = notificationsResult.map(n => n.message);

        res.json({
            courses,
            // timeTable,
            // academicCalendar,
            // notifications
        });

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
