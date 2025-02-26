const express = require("express");
const path = require("path");
const multer = require("multer");
const db = require("../config/db");

const router = express.Router();

// 📌 Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/"); // Store images in /public/uploads
    },
    filename: (req, file, cb) => {
        const faculty_id = req.session.user.faculty_id; // Get faculty_id from session
        const ext = path.extname(file.originalname); // Get file extension
        cb(null, `${faculty_id}${ext}`); // Save as faculty_id.extension
    }
});

const upload = multer({ storage });

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

    // Ensure profile_pic is set or default
    if (!req.session.user.profile_pic) {
        req.session.user.profile_pic = "/uploads/default.png"; // Default profile image
    }

    res.json({ user: req.session.user });
});

// 📌 Update Faculty Profile
router.post("/update-profile", upload.single("profile_pic"), (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not logged in" });
    }

    console.log("🔹 Received Form Data:", req.body);
    console.log("🔹 Uploaded File:", req.file); // Check if file is being received

    const { name, department, mobile_no } = req.body;
    const email_id = req.session.user.email_id;
    const faculty_id = req.session.user.faculty_id;
    
    // Set profile picture path
    let profile_pic = req.session.user.profile_pic; // Retain existing profile picture

    if (req.file) {
        const ext = path.extname(req.file.originalname); // Extract file extension
        profile_pic = `/uploads/${faculty_id}${ext}`; // New file path
    }

    // Update database
    const query = `UPDATE Faculty SET name=?, department=?, mobile_no=?, profile_pic=? WHERE email_id=?`;

    db.query(query, [name, department, mobile_no, profile_pic, email_id], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        // Update session with new data
        req.session.user.name = name;
        req.session.user.department = department;
        req.session.user.mobile_no = mobile_no;
        req.session.user.profile_pic = profile_pic;

        console.log("✅ Profile Updated Successfully:", req.session.user);
        res.json({ message: "Profile updated successfully", user: req.session.user });
    });
});

module.exports = router;
