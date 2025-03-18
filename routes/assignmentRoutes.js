const express = require("express");
const path = require("path");
const db = require("../config/db");
const fs = require("fs");
const multer = require("multer");

const router = express.Router();

// 📌 Configure Multer for file uploads
const uploadDir = path.join(__dirname, "../public/uploads/assignments/");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const facultyId = req.session.user.faculty_id.toString();
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
        const tempFilename = Date.now().toString();
        const ext = path.extname(file.originalname);
        cb(null, `${tempFilename}${ext}`);
    }
});
const upload = multer({ storage }).single('file');

// 📌 Serve Assignment Page (HTML)
router.get("/assignment", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "../public/html/assignment.html"));
});

// // 📌 API to fetch assignment details and submissions
// router.get("/assignment/data", async (req, res) => {
//     const assignmentId = req.query.assignment_id;
//     if (!assignmentId) {
//         return res.status(400).json({success:false, error: "Assignment ID is required" });
//     }
//     try {
//         const [assignment] = await db.promise().query("SELECT * FROM assignments WHERE assignment_id = ?", [assignmentId]);
//         if (assignment.length === 0) {
//             return res.status(404).json({success:false, error: "Assignment not found" });
//         }

//         const [submissions] = await db.promise().query(`
//             SELECT s.submission_id, s.roll_no, s.submission_date, s.file_link, st.name, g.grade
//             FROM assignment_submissions s
//             JOIN students st ON s.roll_no = st.roll_no
//             LEFT JOIN grades g ON s.submission_id = g.submission_id
//             WHERE s.assignment_id = ?
//         `, [assignmentId]);

//         res.json({success:true, assignment: assignment[0], submissions });
//     } catch (error) {
//         console.error("Error fetching assignment data:", error);
//         res.status(500).json({success:false, error: "Internal server error" });
//     }
// });

// router.get("/assignment/data", async (req, res) => {
//     const assignmentId = req.query.assignment_id;
//     if (!assignmentId) {
//         return res.status(400).json({ success: false, error: "Assignment ID is required" });
//     }
//     try {
//         const [assignment] = await db.promise().query(`
//             SELECT a.*, c.course_name
//             FROM assignments a
//             JOIN courses c ON a.course_id = c.course_id
//             WHERE a.assignment_id = ?
//         `, [assignmentId]);
//         if (assignment.length === 0) {
//             return res.status(404).json({ success: false, error: "Assignment not found" });
//         }

//         const [submissions] = await db.promise().query(`
//             SELECT s.submission_id, s.roll_no, s.submission_date, s.file_link, st.name, g.grade
//             FROM assignment_submissions s
//             JOIN students st ON s.roll_no = st.roll_no
//             LEFT JOIN grades g ON s.submission_id = g.submission_id
//             WHERE s.assignment_id = ?
//         `, [assignmentId]);

//         res.json({ success: true, assignment: assignment[0], submissions });
//     } catch (error) {
//         console.error("Error fetching assignment data:", error);
//         res.status(500).json({ success: false, error: "Internal server error" });
//     }
// });

router.get("/assignment/data", async (req, res) => {
    const assignmentId = req.query.assignment_id;
    if (!assignmentId) {
        return res.status(400).json({ success: false, error: "Assignment ID is required" });
    }
    try {
        const [assignment] = await db.promise().query(`
            SELECT a.*, c.course_name, cl.class_name
            FROM assignments a
            JOIN courses c ON a.course_id = c.course_id
            JOIN class_list cl ON a.class_id = cl.class_id
            WHERE a.assignment_id = ?
        `, [assignmentId]);
        if (assignment.length === 0) {
            return res.status(404).json({ success: false, error: "Assignment not found" });
        }

        const [submissions] = await db.promise().query(`
            SELECT s.submission_id, s.roll_no, s.submission_date, s.file_link, st.name, g.grade
            FROM assignment_submissions s
            JOIN students st ON s.roll_no = st.roll_no
            LEFT JOIN grades g ON s.submission_id = g.submission_id
            WHERE s.assignment_id = ?
        `, [assignmentId]);

        res.json({ success: true, assignment: assignment[0], submissions });
    } catch (error) {
        console.error("Error fetching assignment data:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});

// 📌 API to edit assignment details
router.post("/assignment/edit", upload, async (req, res) => {
    const { assignmentId, title, details, deadline, link, maxMarks } = req.body;
    const file = req.file;

    if (!assignmentId || !title || !details || !deadline || !link || !maxMarks) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        let assignmentDocUrl = null;
        if (file) {
            const facultyId = req.session.user.faculty_id.toString();
            assignmentDocUrl = `/uploads/assignments/${facultyId}/${assignmentId}${path.extname(file.originalname)}`;

            // Move the file to the correct location with the correct filename
            const oldPath = path.join(uploadDir, facultyId, file.filename);
            const newPath = path.join(uploadDir, facultyId, `${assignmentId}${path.extname(file.originalname)}`);
            fs.renameSync(oldPath, newPath);
        }

        await db.promise().query(`
            UPDATE assignments
            SET title = ?, details = ?, deadline = ?, submission_link = ?, max_marks = ?, assignment_doc_url = COALESCE(?, assignment_doc_url)
            WHERE assignment_id = ?
        `, [title, details, deadline, link, maxMarks, assignmentDocUrl, assignmentId]);

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating assignment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// 📌 API to update assignment details
router.post("/assignment/update", upload, async (req, res) => {
    const { assignmentId, title, details, deadline, link, maxMarks } = req.body;
    const file = req.file;

    if (!assignmentId || !title || !details || !deadline || !link || !maxMarks) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        let assignmentDocUrl = null;
        if (file) {
            const facultyId = req.session.user.faculty_id.toString();
            assignmentDocUrl = `/uploads/assignments/${facultyId}/${assignmentId}${path.extname(file.originalname)}`;

            // Move the file to the correct location with the correct filename
            const oldPath = path.join(uploadDir, facultyId, file.filename);
            const newPath = path.join(uploadDir, facultyId, `${assignmentId}${path.extname(file.originalname)}`);
            fs.renameSync(oldPath, newPath);
        }

        await db.promise().query(`
            UPDATE assignments
            SET title = ?, details = ?, deadline = ?, submission_link = ?, max_marks = ?, assignment_doc_url = COALESCE(?, assignment_doc_url)
            WHERE assignment_id = ?
        `, [title, details, deadline, link, maxMarks, assignmentDocUrl, assignmentId]);

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

        // Fetch the course_id and class_id for the given submission
        const [assignment] = await db.promise().query(`
            SELECT a.course_id, s.class_id, s.assignment_id
            FROM assignments a
            JOIN assignment_submissions s ON a.assignment_id = s.assignment_id
            WHERE s.submission_id = ?
        `, [submissionId]);

        if (assignment.length === 0) {
            console.error("Assignment not found for submissionId:", submissionId); // Add logging
            return res.status(404).json({ success: false, message: "Assignment not found" });
        }

        const { course_id, class_id, assignment_id } = assignment[0];
        console.log("Fetched course_id:", course_id, "class_id:", class_id, "assignment_id:", assignment_id); // Add logging

        await db.promise().query(`
            INSERT INTO grades (submission_id, roll_no, class_id, course_id, assignment_id, grade)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE grade = VALUES(grade)
        `, [submissionId, rollNo, class_id, course_id, assignment_id, grade]);

        res.json({ success: true });
    } catch (error) {
        console.error("Error saving grade:", error); // Add logging
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// 📌 API to delete a submitted assignment
router.delete("/assignment/delete-submission/:submissionId", async (req, res) => {
    const { submissionId } = req.params;

    try {
        // Get the submission details
        const [submission] = await db.promise().query("SELECT * FROM assignment_submissions WHERE submission_id = ?", [submissionId]);
        if (submission.length === 0) {
            return res.status(404).json({ success: false, message: "Submission not found" });
        }

        const submissionDocUrl = submission[0].file_link;
        const filePath = path.join(__dirname, "../public", submissionDocUrl);

        // Delete the submission record from the database
        await db.promise().query("DELETE FROM assignment_submissions WHERE submission_id = ?", [submissionId]);

        // Delete the grade record from the database
        await db.promise().query("DELETE FROM grades WHERE submission_id = ?", [submissionId]);

        // Delete the submission file from the filesystem
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting submission:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
