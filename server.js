const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mysql = require("mysql2");

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 } // 1 hour session
}));    

// Database Connection (Single Connection)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1); // Exit the process if the connection fails
    }
    console.log("✅ Connected to the database");
});

// 📌 Serve Static Files (Frontend)
app.use(express.static("public"));


// 📌 Route: Home (`/`)
app.get("/", (req, res) => {
    if (req.session.user) {
        return res.redirect("/dashboard");
    }
    res.sendFile(__dirname + "/public/html/login.html");
});


app.post("/register", async (req, res) => {
    console.log("📌 Received Register Request:", req.body); // Log request data

    const { email_id, password, role, name, mobile_no, degree, profile_pic, department } = req.body;

    // ✅ Check Required Fields
    if (!email_id || !password || !role) {
        console.log("❌ Missing required fields");
        return res.status(400).json({ message: "Email, password, and role are required" });
    }

    if (password.length < 8) {
        console.log("❌ Password too short");
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    if (!/^\d{10}$/.test(mobile_no)) {
        console.log("❌ Invalid mobile number");
        return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
    }

    try {
        // ✅ Check if Email Already Exists
        const [existingUsers] = await db.promise().query("SELECT email_id FROM Login WHERE email_id = ?", [email_id]);

        if (existingUsers.length > 0) {
            console.log("❌ Email already registered");
            return res.status(400).json({ message: "Email already registered" });
        }

        if (role === "faculty") {
            // ✅ Check if Mobile Number Already Exists
            const [existingFaculty] = await db.promise().query("SELECT mobile_no FROM Faculty WHERE mobile_no = ?", [mobile_no]);

            if (existingFaculty.length > 0) {
                console.log("❌ Mobile number already registered");
                return res.status(400).json({ message: "Mobile number already registered" });
            }
        }

        // ✅ Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("🔑 Hashed password generated");

        // ✅ Start Transaction
        await db.promise().beginTransaction();

        // ✅ Insert into Login Table
        await db.promise().query("INSERT INTO Login (email_id, password, role) VALUES (?, ?, ?)", [email_id, hashedPassword, role]);
        console.log("✅ User added to Login table");

        if (role === "faculty") {
            // ✅ Insert into Faculty Table
            await db.promise().query(
                "INSERT INTO Faculty (email_id, name, mobile_no, degree, profile_pic, department) VALUES (?, ?, ?, ?, ?, ?)", 
                [email_id, name, mobile_no, degree, profile_pic, department]
            );
            console.log("✅ Faculty registration successful");
        }

        // ✅ Commit Transaction
        await db.promise().commit();

        res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully` });

    } catch (error) {
        console.error("❌ Error in registration:", error);

        // ✅ Rollback Transaction on Error
        await db.promise().rollback();

        // ✅ Handle Duplicate Entry Error
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Duplicate entry detected: " + error.sqlMessage });
        }

        res.status(500).json({ message: "Server error during registration", error });
    }
});


app.post("/login", (req, res) => {
    console.log("📌 Received Login Request:", req.body); // Log request data

    const { email_id, password } = req.body;

    // ✅ Validate Input
    if (!email_id || !password) {
        console.log("❌ Missing Email or Password");
        return res.status(400).json({ message: "Email and password are required" });
    }

    const query = `
        SELECT 
            l.email_id, l.password, l.role, 
            f.faculty_id, f.name, f.mobile_no, f.degree, f.profile_pic, f.department
        FROM Login l
        LEFT JOIN Faculty f ON l.email_id = f.email_id
        WHERE l.email_id = ?`;

    db.query(query, [email_id], async (err, results) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ message: "Server error, please try again later" });
        }

        if (results.length === 0) {
            console.log("❌ Invalid Email (Not Found)");
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = results[0];

        // ✅ Securely Compare Hashed Password
        try {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                console.log("❌ Invalid Password");
                return res.status(401).json({ message: "Invalid email or password" });
            }
        } catch (hashErr) {
            console.error("❌ Password Hashing Error:", hashErr);
            return res.status(500).json({ message: "Error processing password, please try again" });
        }

        // ✅ Store Session Data
        req.session.user = {
            email_id: user.email_id,
            role: user.role,
            faculty_id: user.faculty_id || null,
            name: user.name || null,
            mobile_no: user.mobile_no || null,
            degree: user.degree || null,
            profile_pic: user.profile_pic || null,
            department: user.department || null
        };

        console.log("✅ Login Successful:", req.session.user);

        res.json({ message: "Login successful", role: user.role, user: req.session.user });
    });
});



// 📌 Dashboard Route (Protected)
app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(__dirname + "/public/dashboard.html");
});

// 📌 Logout
app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Logged out successfully" });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
