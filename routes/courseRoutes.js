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
            SELECT assignment_id, class_id, title, details, deadline, submission_link
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
