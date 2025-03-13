const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const db = require("../config/db");

const router = express.Router();

// 📌 Ensure the upload directory exists
const uploadDir = path.join(__dirname, "../public/uploads/submissions/");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 📌 Configure Multer (Store files in `public/uploads/submissions/<facultyId>/<courseId>/<assignmentId>/`)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { course_id, assignment_id } = req.body; // Change from req.query to req.body
        const facultyId = req.session.user.faculty_id.toString();
        const studentId = req.body.roll_no;

        if (!facultyId || !course_id || !assignment_id || !studentId) {
            return cb(new Error("Missing required parameters"));
        }

        const dir = path.join(uploadDir, facultyId, course_id, assignment_id);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const studentId = req.body.roll_no;
        const ext = path.extname(file.originalname);
        cb(null, `${studentId}${ext}`);
    }
});
const upload = multer({ storage }).single('file');

// 📌 Serve Assignment Submission Page (HTML)
router.get("/assignment-submission", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "../public/html/assignmentSubmission.html"));
});

// 📌 Check if a student has already submitted the assignment
router.get("/assignment/check-submission", async (req, res) => {
    const { roll_no, assignment_id } = req.query;
    if (!roll_no || !assignment_id) {
        return res.status(400).json({ error: "Roll number and assignment ID are required" });
    }

    try {
        const [submission] = await db.promise().query(
            "SELECT * FROM assignment_submissions WHERE roll_no = ? AND assignment_id = ?",
            [roll_no, assignment_id]
        );

        if (submission.length > 0) {
            return res.json({ submitted: true });
        } else {
            return res.json({ submitted: false });
        }
    } catch (error) {
        console.error("Error checking submission:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 📌 Assignment Submission Route
router.post("/submit-assignment", upload, async (req, res) => {
    const { course_id, class_id, assignment_id } = req.body; // Change from req.query to req.body
    const file = req.file;
    const studentId = req.body.roll_no;
    const facultyId = req.session.user.faculty_id.toString();

    if (!course_id || !class_id || !assignment_id || !file || !studentId || !facultyId) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        // Check if the student is enrolled in the course and class
        const [enrollment] = await db.promise().query(
            "SELECT * FROM students WHERE roll_no = ? AND class_id = ?",
            [studentId, class_id]
        );

        if (enrollment.length === 0) {
            return res.status(400).json({ success: false, message: "Student is not enrolled in the specified course and class." });
        }

        const submissionDocUrl = `/uploads/submissions/${facultyId}/${course_id}/${assignment_id}/${studentId}${path.extname(file.originalname)}`;

        // Insert the submission record into the database
        const [result] = await db.promise().query(
            `INSERT INTO assignment_submissions (course_id, class_id, assignment_id, roll_no, submission_date, file_link)
             VALUES (?, ?, ?, ?, NOW(), ?)`,
            [course_id, class_id, assignment_id, studentId, submissionDocUrl]
        );

        const submissionId = result.insertId;

        // Insert the initial grade record into the grades table
        await db.promise().query(
            `INSERT INTO grades (submission_id, roll_no, class_id, course_id, assignment_id, grade)
             VALUES (?, ?, ?, ?, ?, 0)`,
            [submissionId, studentId, class_id, course_id, assignment_id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error submitting assignment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;