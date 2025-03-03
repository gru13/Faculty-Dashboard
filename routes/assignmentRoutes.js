const express = require("express");
const path = require("path");
const db = require("../config/db");

const router = express.Router();

// 📌 Serve Assignment Page (HTML)
router.get("/assignment", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "../public/html/assignment.html"));
});

// 📌 API to fetch assignment details and submissions
router.get("/assignment/data", async (req, res) => {
    const assignmentId = req.query.assignment_id;
    if (!assignmentId) {
        return res.status(400).json({ error: "Assignment ID is required" });
    }
    try {
        const [assignment] = await db.promise().query("SELECT * FROM assignments WHERE assignment_id = ?", [assignmentId]);
        if (assignment.length === 0) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        const [submissions] = await db.promise().query(`
            SELECT s.submission_id, s.roll_no, s.submission_date, s.file_link, st.name, g.grade
            FROM assignment_submissions s
            JOIN students st ON s.roll_no = st.roll_no
            LEFT JOIN grades g ON s.submission_id = g.submission_id
            WHERE s.assignment_id = ?
        `, [assignmentId]);

        res.json({ assignment: assignment[0], submissions });
    } catch (error) {
        console.error("Error fetching assignment data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 📌 API to edit assignment details
router.post("/assignment/edit", async (req, res) => {
    const { assignmentId, title, details, deadline, link, maxMarks } = req.body;

    if (!assignmentId || !title || !details || !deadline || !link || !maxMarks) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        await db.promise().query(`
            UPDATE assignments
            SET title = ?, details = ?, deadline = ?, submission_link = ?, max_marks = ?
            WHERE assignment_id = ?
        `, [title, details, deadline, link, maxMarks, assignmentId]);

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating assignment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// 📌 API to grade assignment
router.post("/assignment/grade", async (req, res) => {
    const { submissionId, rollNo, grade } = req.body;

    if (!submissionId || !rollNo || !grade) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        console.log("Grading submission:", { submissionId, rollNo, grade }); // Add logging

        await db.promise().query(`
            INSERT INTO grades (submission_id, roll_no, class_id, course_id, assignment_id, grade)
            VALUES (?, ?, (SELECT class_id FROM students WHERE roll_no = ?), (SELECT course_id FROM assignments WHERE assignment_id = ?), ?, ?)
            ON DUPLICATE KEY UPDATE grade = VALUES(grade)
        `, [submissionId, rollNo, rollNo, submissionId, submissionId, grade]);

        res.json({ success: true });
    } catch (error) {
        console.error("Error saving grade:", error); // Add logging
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
