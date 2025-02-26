const express = require("express");
const path = require("path");
const db = require("../config/db");

const router = express.Router();

// 📌 Serve Course Profile Page (HTML)
router.get("/course", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "../public/html/course.html"));
});

// 📌 API to fetch course details
router.get("/course/data", async (req, res) => {
    const courseId = req.query.course_id;

    if (!courseId) {
        return res.status(400).json({ error: "Course ID is required" });
    }

    try {
        const courseDetailsQuery = `
            SELECT c.course_id, c.course_name, c.resources_link, f.name AS faculty_name, cl.class_name
            FROM courses c
            JOIN Faculty f ON c.faculty_id = f.faculty_id
            JOIN class_list cl ON c.class_id = cl.class_id
            WHERE c.course_id = ?;
        `;

        const studentsQuery = `
            SELECT s.roll_no, s.name 
            FROM students s
            JOIN courses c ON s.class_id = c.class_id
            WHERE c.course_id = ?;
        `;

        const assignmentsQuery = `
            SELECT assignment_id, title, details, deadline, submission_link
            FROM assignments
            WHERE course_id = ?;
        `;

        const gradesQuery = `
            SELECT g.roll_no, s.name, g.assignment_id, g.grade
            FROM grades g
            JOIN students s ON g.roll_no = s.roll_no
            WHERE g.course_id = ?;
        `;

        const deadlinesQuery = `
            SELECT date, deadline_name
            FROM course_deadlines
            WHERE course_id = ?;
        `;

        const [courseDetails] = await db.promise().query(courseDetailsQuery, [courseId]);
        const [students] = await db.promise().query(studentsQuery, [courseId]);
        const [assignments] = await db.promise().query(assignmentsQuery, [courseId]);
        const [grades] = await db.promise().query(gradesQuery, [courseId]);
        const [deadlines] = await db.promise().query(deadlinesQuery, [courseId]);

        res.json({
            course: courseDetails[0] || {},
            students,
            assignments,
            grades,
            deadlines
        });
    } catch (error) {
        console.error("Error fetching course data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
