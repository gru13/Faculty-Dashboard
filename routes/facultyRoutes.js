const express = require("express");
const path = require("path");
const db = require("../config/db");

const router = express.Router();

// Serve Faculty Page
router.get("/faculty", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "../public/html/faculty-profile.html"));
});

router.get("/session-data", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not logged in" });
    }
    console.log(req.session.user);
    res.json({ user: req.session.user });
});

router.post("/update-profile", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Not logged in" });
    }

    const { name, department, mobile_no } = req.body;
    const email_id = req.session.user.email_id;

    const query = `UPDATE Faculty SET name=?, department=?, mobile_no=? WHERE email_id=?`;

    db.query(query, [name, department, mobile_no, email_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });

        // Update session with new data
        req.session.user.name = name;
        req.session.user.department = department;
        req.session.user.mobile_no = mobile_no;

        res.json({ message: "Profile updated successfully", user: req.session.user });
    });
});


module.exports = router;