const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.message);
        return;
    }
    console.log("✅ Connected to MySQL database.");
});

// 📌 User Registration (Faculty/Admin)
app.post("/register", async (req, res) => {
    const { email_id, password, role } = req.body;

    if (!email_id || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into Login table
    const query = "INSERT INTO Login (email_id, password, role) VALUES (?, ?, ?)";
    db.query(query, [email_id, hashedPassword, role], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error creating account", error: err });
        }
        res.status(201).json({ message: "Account created successfully" });
    });
});

// 📌 User Login
app.post("/login", (req, res) => {
    const { email_id, password } = req.body;

    if (!email_id || !password) {
        return res.status(400).json({ message: "Email and password required" });
    }

    // Fetch user from DB
    const query = "SELECT * FROM Login WHERE email_id = ?";
    db.query(query, [email_id], async (err, results) => {
        if (err) return res.status(500).json({ message: "Server error" });

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Create session
        req.session.user = {
            email_id: user.email_id,
            role: user.role,
        };

        res.json({ message: "Login successful", role: user.role });
    });
});

// 📌 Protected Route - Dashboard
app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({ message: `Welcome ${req.session.user.role}`, user: req.session.user });
});

// 📌 Logout
app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Logged out successfully" });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
