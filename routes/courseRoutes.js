// this is courseRoutes.js
const express = require("express");
const path = require("path");
const db = require("../config/db");
const multer = require("multer");
const fs = require("fs");

const router = express.Router();

// 📌 Ensure the upload directory exists
const uploadDir = path.join(__dirname, "../public/uploads/assignments/");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 📌 Configure Multer (Store files directly in `public/uploads/assignments`)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const facultyId = req.session.user.faculty_id.toString();
        console.log("facultyId:", facultyId); // Add logging

        if (!facultyId) {
            return cb(new Error("Missing facultyId"));
        }
        const dir = path.join(uploadDir, facultyId);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const tempFilename = Date.now().toString(); // Generate temporary filename
        console.log("tempFilename:", tempFilename); // Add logging

        const ext = path.extname(file.originalname);
        cb(null, `${tempFilename}${ext}`);
    }
});
const upload = multer({ storage }).single('file');

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
        const courses = await getCourseById(courseId);
        if (!courses || courses.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        const students = await getStudentsByCourse(courseId);
        const assignments = await getAssignmentsByCourse(courseId);
        const grades = await getGradesByCourse(courseId);
        const deadlines = await getDeadlinesByCourse(courseId);

        // Return all data – note that "courses" is now an array (one per class)
        res.json({ courses, students, assignments, grades, deadlines });
    } catch (error) {
        console.error("Error fetching course data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// 📌 Add Assignment Route
router.post("/course/add-assignment", upload, async (req, res) => {
    const { courseId, classId, title, details, deadline, maxMarks } = req.body;
    const file = req.file;
    const facultyId = req.session.user.faculty_id.toString();
    console.log(req.body);
    if (!courseId || !classId || !title || !details || !deadline || !maxMarks || !file || !facultyId) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        const query = `
            INSERT INTO assignments (course_id, class_id, title, details, deadline, submission_link, assignment_doc_url, max_marks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const [result] = await db.promise().query(query, [courseId, classId, title, details, deadline, '', '', maxMarks]);
        const assignmentId = result.insertId.toString();
        const assignmentDocUrl = `/uploads/assignments/${facultyId}/${assignmentId}${path.extname(file.originalname)}`;
        const submissionLink = `/assignment-submission/?course_id=${courseId}&class_id=${classId}&assignment_id=${assignmentId}`;

        // Update the assignment record with the correct assignment_doc_url and submission_link
        await db.promise().query(
            "UPDATE assignments SET assignment_doc_url = ?, submission_link = ? WHERE assignment_id = ?",
            [assignmentDocUrl, submissionLink, assignmentId]
        );

        // Move the file to the correct location with the correct filename
        const oldPath = path.join(uploadDir, facultyId, file.filename);
        const newPath = path.join(uploadDir, facultyId, `${assignmentId}${path.extname(file.originalname)}`);
        fs.renameSync(oldPath, newPath);

        res.json({ success: true });
    } catch (error) {
        console.error("Error adding assignment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});


// 📌 Delete Assignment Route
router.delete("/course/delete-assignment/:assignmentId", async (req, res) => {
    const { assignmentId } = req.params;
    const facultyId = req.session.user.faculty_id.toString();

    try {
        // Get the assignment document URL
        const [assignment] = await db.promise().query("SELECT assignment_doc_url FROM assignments WHERE assignment_id = ?", [assignmentId]);
        if (assignment.length === 0) {
            return res.status(404).json({ success: false, message: "Assignment not found" });
        }

        const assignmentDocUrl = assignment[0].assignment_doc_url;
        const filePath = path.join(__dirname, "../public", assignmentDocUrl);

        // Delete the assignment record from the database
        await db.promise().query("DELETE FROM assignments WHERE assignment_id = ?", [assignmentId]);

        // Delete the assignment file from the filesystem
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// 📌 Helper function to fetch course details (returns multiple rows)
async function getCourseById(courseId) {
    try {
        const query = `
            SELECT c.course_id, c.course_name, c.resources_link, 
                   c.class_id, cl.class_name, f.name AS faculty_name
            FROM courses c
            JOIN Faculty f ON c.faculty_id = f.faculty_id
            JOIN class_list cl ON c.class_id = cl.class_id
            WHERE c.course_id = ?;
        `;
        const [result] = await db.promise().query(query, [courseId]);
        return result; // Return an array of course rows (each for a different class)
    } catch (error) {
        console.error("Error fetching course details:", error);
        throw error;
    }
}

// 📌 Helper function to fetch students (including class_id)
async function getStudentsByCourse(courseId) {
    try {
        const query = `
            SELECT s.roll_no, s.name, s.class_id 
            FROM students s
            JOIN courses c ON s.class_id = c.class_id
            WHERE c.course_id = ?;
        `;
        const [result] = await db.promise().query(query, [courseId]);
        return result;
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
}

// 📌 Helper function to fetch assignments (including class_id)
async function getAssignmentsByCourse(courseId) {
    try {
        const query = `
            SELECT assignment_id, class_id, title, details, deadline, submission_link, assignment_doc_url, max_marks
            FROM assignments
            WHERE course_id = ?;
        `;
        const [result] = await db.promise().query(query, [courseId]);
        return result;
    } catch (error) {
        console.error("Error fetching assignments:", error);
        throw error;
    }
}

// 📌 Helper function to fetch grades (including class_id)
async function getGradesByCourse(courseId) {
    try {
        const query = `
            SELECT g.roll_no, s.name, g.assignment_id, g.grade, g.class_id
            FROM grades g
            JOIN students s ON g.roll_no = s.roll_no
            WHERE g.course_id = ?;
        `;
        const [result] = await db.promise().query(query, [courseId]);
        return result;
    } catch (error) {
        console.error("Error fetching grades:", error);
        throw error;
    }
}

// 📌 Helper function to fetch deadlines (remains course-specific)
async function getDeadlinesByCourse(courseId) {
    try {
        const query = `
            SELECT date, deadline_name
            FROM course_deadlines
            WHERE course_id = ?;
        `;
        const [result] = await db.promise().query(query, [courseId]);
        return result;
    } catch (error) {
        console.error("Error fetching deadlines:", error);
        throw error;
    }
}

module.exports = router;
