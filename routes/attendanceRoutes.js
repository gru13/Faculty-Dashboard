const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Fetch students for a given class
router.post("/api/attendance/students", (req, res) => {
    const { classId } = req.body;

    if (!classId) {
        return res.status(400).json({ success: false, message: "Class ID is required" });
    }

    const query = "SELECT roll_no, name FROM students WHERE class_id = ?";
    db.query(query, [classId], (err, results) => {
        if (err) {
            console.error("Error fetching students:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        res.json({ success: true, students: results });
    });
});

// Fetch attendance data for a class
router.get("/api/attendance/:classId", (req, res) => {
    const { classId } = req.params;

    if (!classId) {
        return res.status(400).json({ success: false, message: "Class ID is required" });
    }

    const query = `
        SELECT s.roll_no, s.name, 
               COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS attended,
               COUNT(a.slot) AS total,
               ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END) / COUNT(a.slot)) * 100, 2) AS percentage
        FROM students s
        LEFT JOIN attendance a ON s.roll_no = a.roll_no AND s.class_id = a.class_id
        WHERE s.class_id = ?
        GROUP BY s.roll_no, s.name
    `;
    db.query(query, [classId], (err, results) => {
        if (err) {
            console.error("Error fetching attendance data:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        const students = results.map(student => ({
            rollNo: student.roll_no,
            name: student.name,
            attended: student.attended || 0,
            total: student.total || 0,
            percentage: student.percentage || 0
        }));

        res.json({ success: true, students });
    });
});

// Submit or update attendance for a class
router.post("/api/attendance/update", (req, res) => {
    const { date, hours, absentStudents, classId, courseId, courseOutcome } = req.body;

    if (!date || !hours || !classId || !courseId || !courseOutcome) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const attendanceRecords = [];
    const absentSet = new Set(absentStudents);

    // Fetch all students in the class
    const fetchStudentsQuery = "SELECT roll_no FROM students WHERE class_id = ?";
    db.query(fetchStudentsQuery, [classId], (err, students) => {
        if (err) {
            console.error("Error fetching students for attendance:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        // Prepare attendance records
        students.forEach(student => {
            const status = absentSet.has(student.roll_no) ? "absent" : "present";
            hours.forEach(hour => {
                attendanceRecords.push([student.roll_no, courseId, classId, date, status, hour]);
            });
        });

        // Insert or update attendance records
        const insertQuery = `
            INSERT INTO attendance (roll_no, course_id, class_id, date, status, slot)
            VALUES ?
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        `;
        db.query(insertQuery, [attendanceRecords], (err) => {
            if (err) {
                console.error("Error inserting/updating attendance records:", err);
                return res.status(500).json({ success: false, message: "Internal server error" });
            }

            // Mark course outcome as completed
            const outcomeQuery = `
                INSERT INTO completed_outcomes (class_id, outcome_id, completion_date)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE completion_date = VALUES(completion_date)
            `;
            db.query(outcomeQuery, [classId, courseOutcome, date], (err) => {
                if (err) {
                    console.error("Error updating course outcome:", err);
                    return res.status(500).json({ success: false, message: "Internal server error" });
                }

                res.json({ success: true, message: "Attendance and course outcome updated successfully" });
            });
        });
    });
});

// Fetch absence details for a student
router.get("/api/attendance/absences/:rollNo", (req, res) => {
    const { rollNo } = req.params;

    if (!rollNo) {
        return res.status(400).json({ success: false, message: "Roll number is required" });
    }

    const query = `
        SELECT a.date, a.slot, c.course_name
        FROM attendance a
        JOIN courses c ON a.course_id = c.course_id
        WHERE a.roll_no = ? AND a.status = 'absent'
        ORDER BY a.date, a.slot
    `;
    db.query(query, [rollNo], (err, results) => {
        if (err) {
            console.error("Error fetching absence details:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        res.json({ success: true, absences: results });
    });
});

// Fetch course outcomes for a given course
router.get("/api/courses/:courseId/outcomes", (req, res) => {
    const { courseId } = req.params;

    if (!courseId) {
        return res.status(400).json({ success: false, message: "Course ID is required" });
    }

    const query = "SELECT outcome_id, outcome_description FROM course_outcomes WHERE course_id = ?";
    db.query(query, [courseId], (err, results) => {
        if (err) {
            console.error("Error fetching course outcomes:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        res.json({ success: true, outcomes: results });
    });
});

module.exports = router;
