const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db"); // Separate DB Connection File (Optional)
const router = express.Router();

// 📌 Register Route
router.post("/register", async (req, res) => {
    // console.log("📌 Received Register Request:", req.body);
    const { email_id, password, role, name, mobile_no, degree, profile_pic, department } = req.body;

    if (!email_id || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required" });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    if (!/^\d{10}$/.test(mobile_no)) {
        return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
    }

    try {
        const [existingUsers] = await db.promise().query("SELECT email_id FROM Login WHERE email_id = ?", [email_id]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.promise().beginTransaction();
        await db.promise().query("INSERT INTO Login (email_id, password, role) VALUES (?, ?, ?)", [email_id, hashedPassword, role]);

        if (role === "faculty") {
            await db.promise().query(
                "INSERT INTO Faculty (email_id, name, mobile_no, degree, profile_pic, department) VALUES (?, ?, ?, ?, ?, ?)", 
                [email_id, name, mobile_no, degree, profile_pic, department]
            );
        }

        await db.promise().commit();
        res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully` });

    } catch (error) {
        await db.promise().rollback();
        return res.status(500).json({ message: "Server error during registration" });
    }
});

// 📌 Login Route
router.post("/login", async (req, res) => {
    const { email_id, password } = req.body;

    if (!email_id || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const query = `
        SELECT l.email_id, l.password, l.role, 
               f.faculty_id, f.name, f.mobile_no, f.degree, f.profile_pic, f.department
        FROM Login l
        LEFT JOIN Faculty f ON l.email_id = f.email_id
        WHERE l.email_id = ?`;

    db.query(query, [email_id], async (err, results) => {
        if (err) return res.status(500).json({ message: "Server error" });

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = results[0];
        // console.log(user);
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        req.session.user = { ...user };
        res.json({ message: "Login successful", user: req.session.user });
    });
});

// 📌 Logout Route
router.post("/logout", (req, res) => {
    // console.log("/logout is called");

    if (!req.session) {
        return res.status(400).json({ success: false, message: "No active session" });
    }

    req.session.destroy((err) => {
        if (err) {
            console.error("❌ Error destroying session:", err);
            return res.status(500).json({ success: false, message: "Failed to log out" });
        }

        // console.log("✅ Session destroyed successfully");
        res.clearCookie("connect.sid");  // Ensure session cookie is removed
        return res.json({ success: true, message: "Logged out successfully", redirect: "/" });
    });
});



module.exports = router;
