// module.exports = router;
const express = require("express");
const path = require("path");
const multer = require("multer");
const db = require("../config/db");
const fs = require("fs");

const router = express.Router();


// 📌 Serve Faculty Profile Page
router.get("/faculty", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "../public/html/faculty-profile.html"));
});

// 📌 Get Session Data
router.get("/session-data", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not logged in" });
    }

    if (!req.session.user.profile_pic) {
        req.session.user.profile_pic = "/uploads/default.png"; // Default profile image
    }

    res.json({ user: req.session.user });
});


// 📌 Ensure the upload directory exists
const uploadDir = path.join(__dirname, "../public/uploads/");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 📌 Configure Multer (Store files directly in `public/uploads`)
const upload = multer({ dest: uploadDir });

// 📌 Update Profile Picture (Ensure File is Stored)
router.post("/update-profile-picture", upload.single("profile_pic"), (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const faculty_id = req.session.user.faculty_id;
    const ext = path.extname(req.file.originalname);
    const newFilename = `${faculty_id}${ext}`;

    const oldPath = path.resolve(req.file.path); // Temp file path from Multer
    const newPath = path.join(uploadDir, newFilename); // Permanent file path

    console.log("📂 Original Path:", oldPath);
    console.log("📂 Moving to:", newPath);

    try {
        // Move the file to ensure it stays
        fs.renameSync(oldPath, newPath);

        const profile_pic = `/uploads/${newFilename}`;

        // Update database
        const query = "UPDATE Faculty SET profile_pic=? WHERE faculty_id=?";
        db.query(query, [profile_pic, faculty_id], (err, result) => {
            if (err) {
                console.error("❌ Database Error:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }

            // Update session
            req.session.user.profile_pic = profile_pic;

            console.log("✅ Profile Picture Updated:", profile_pic);
            res.json({ success: true, profile_pic });
        });
    } catch (err) {
        console.error("❌ File Move Error:", err);
        return res.status(500).json({ success: false, message: "File processing error" });
    }
});


router.post("/update-profile", (req, res) => {
    console.log("Received Data:", req.body);

    if (!req.session.user) {
        return res.status(401).json({ message: "Not logged in" });
    }

    const { name, mobile_no, degree, department } = req.body;
    const facultyId = req.session.user.faculty_id;

    if (!name || !mobile_no || !department) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const updateQuery = `UPDATE Faculty SET name = ?, mobile_no = ?, degree = ?, department = ? WHERE faculty_id = ?`;

    db.query(updateQuery, [name, mobile_no, degree || "", department, facultyId], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Faculty not found" });
        }

        req.session.user = { ...req.session.user, name, mobile_no, degree: degree || "", department };

        return res.status(200).json({ message: "Profile updated successfully", user: req.session.user });
    });
});



module.exports = router;
