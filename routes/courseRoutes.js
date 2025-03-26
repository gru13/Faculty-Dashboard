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

// 📌 API to fetch course outcomes
router.get("/course/outcomes", async (req, res) => {
    const { course_id, class_id } = req.query;
    if (!course_id || !class_id) {
        return res.status(400).json({ success: false, message: "Course ID and Class ID are required." });
    }

    try {
        const query = `
            SELECT co.outcome_id AS id, co.outcome_description AS title, 
                   CASE WHEN coo.completion_id IS NOT NULL THEN TRUE ELSE FALSE END AS completed
            FROM course_outcomes co
            LEFT JOIN completed_outcomes coo 
            ON co.outcome_id = coo.outcome_id AND coo.class_id = ?
            WHERE co.course_id = ?;
        `;
        const [outcomes] = await db.promise().query(query, [class_id, course_id]);
        res.json({ success: true, outcomes });
    } catch (error) {
        console.error("Error fetching course outcomes:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// 📌 API to update course outcome completion status
router.post("/course/outcomes/update", async (req, res) => {
    const { outcomeId, classId, completed } = req.body;

    if (!outcomeId || !classId || completed === undefined) {
        return res.status(400).json({ success: false, message: "Outcome ID, Class ID, and completion status are required." });
    }

    try {
        if (completed) {
            // Mark as completed
            const query = `
                INSERT INTO completed_outcomes (class_id, outcome_id, completion_date)
                VALUES (?, ?, CURDATE())
                ON DUPLICATE KEY UPDATE completion_date = CURDATE();
            `;
            await db.promise().query(query, [classId, outcomeId]);
        } else {
            // Mark as incomplete
            const query = `
                DELETE FROM completed_outcomes
                WHERE class_id = ? AND outcome_id = ?;
            `;
            await db.promise().query(query, [classId, outcomeId]);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating course outcome:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
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

        // Log the action in RecentUpdates
        await db.promise().query(
            'INSERT INTO RecentUpdates (faculty_id, action, details, timestamp) VALUES (?, ?, ?, NOW())',
            [facultyId, 'Assignment Added', `Added assignment "${title}" to course ${courseId}, class ${classId}`]
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
        // Get the assignment details
        const [assignment] = await db.promise().query(
            "SELECT title, assignment_doc_url, course_id, class_id FROM assignments WHERE assignment_id = ?",
            [assignmentId]
        );
        if (assignment.length === 0) {
            return res.status(404).json({ success: false, message: "Assignment not found" });
        }

        const { title, assignment_doc_url, course_id, class_id } = assignment[0];
        const filePath = path.join(__dirname, "../public", assignment_doc_url);

        // Delete the assignment record from the database
        await db.promise().query("DELETE FROM assignments WHERE assignment_id = ?", [assignmentId]);

        // Log the deletion in RecentUpdates
        await db.promise().query(
            'INSERT INTO RecentUpdates (faculty_id, action, details, timestamp) VALUES (?, ?, ?, NOW())',
            [facultyId, 'Assignment Deleted', `Deleted assignment "${title}" from course ${course_id}, class ${class_id}`]
        );

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
