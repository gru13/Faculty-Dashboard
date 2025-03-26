const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Database connection

// Fetch students for a given class
router.post("/api/students", (req, res) => {
    const { classId } = req.body;

    if (!classId) {
        return res.status(400).json({ success: false, message: "Class ID is required" });
    }

    const query = "SELECT roll_no, name, class_id FROM students WHERE class_id = ?";

    // Use db.query() with callback
    db.query(query, [classId], (err, results) => {
        if (err) {
            console.error("Error fetching students:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        res.json({
            success: true,
            students: results,
        });
    });
});

module.exports = router;
