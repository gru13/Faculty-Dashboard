const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = 3000;

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, maxAge: 3600000 }, // 1 hour session
    })
);

// ✅ Database Connection
const db = require("./config/db");

// ✅ Serve Static Files
app.use(express.static("public"));

// ✅ Import Routes
const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");
const pageRoutes = require("./routes/pageRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const courseRoutes = require("./routes/courseRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes"); // New assignment routes
const assignmentSubmissionRoutes = require("./routes/assignmentSubmissionRoutes"); // New assignment submission routes

// ✅ Use Routes
app.use("/", facultyRoutes);
app.use("/", pageRoutes);
app.use("/", authRoutes);  // Now `/login` & `/register` work directly
app.use("/", otpRoutes);   // Now `/forgot-password` works directly
app.use("/", dashboardRoutes);   
app.use("/", courseRoutes);   
app.use("/", assignmentRoutes); // Use the new assignment routes
app.use("/", assignmentSubmissionRoutes); // Use the new assignment submission routes

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
