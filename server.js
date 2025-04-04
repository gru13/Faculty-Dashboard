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
const attendanceRoutes = require("./routes/attendanceRoutes"); // Corrected import
const assignmentRoutes = require("./routes/assignmentRoutes");
const assignmentSubmissionRoutes = require("./routes/assignmentSubmissionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiaraRoutes = require("./routes/aiaraRoutes");

// ✅ Use Routes
app.use("/", facultyRoutes);
app.use("/", pageRoutes);
app.use("/", authRoutes);
app.use("/", otpRoutes);
app.use("/", dashboardRoutes);
app.use("/", courseRoutes);
app.use("/", attendanceRoutes); // Use the new attendance routes
app.use("/", assignmentRoutes);
app.use("/", assignmentSubmissionRoutes);
app.use("/admin", adminRoutes);
app.use("/", aiaraRoutes);

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
