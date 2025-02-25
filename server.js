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

// ✅ Use Routes (🔥 Removed `/auth` & `/otp`)
app.use("/", pageRoutes);
app.use("/", authRoutes);  // Now `/login` & `/register` work directly
app.use("/", otpRoutes);   // Now `/forgot-password` works directly

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
