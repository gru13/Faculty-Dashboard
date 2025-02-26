const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const db = require("../config/db");
const bcrypt = require("bcryptjs");

const router = express.Router();
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

// 📌 Forgot Password - Request OTP
router.post("/forgot-password", async (req, res) => {
    try {
        const { email_id } = req.body;
        const otp = generateOTP();

        console.log("Received email:", email_id);
        console.log("otp:", otp);

        // 🔹 Check if the email exists in the database
        const [rows] = await db.promise().query("SELECT * FROM Login WHERE email_id = ?", [email_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Email not found in database" });
        }

        // 🔹 Store OTP in the PasswordReset table
        await db.promise().query("REPLACE INTO PasswordReset (email_id, otp) VALUES (?, ?)", [email_id, otp]);

        // 🔹 Send OTP email (with error handling)
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email_id,
                subject: "Password Reset OTP",
                text: `Your OTP is: ${otp}`
            });
            res.json({ message: "OTP sent to your email" });
        } catch (emailError) {
            console.error("❌ Email Sending Error:", emailError);
        
            if (emailError.code === "ECONNREFUSED") {
                return res.status(500).json({ error: "Email service is unavailable. Please try again later." });
            }
        
            res.status(500).json({ error: "Failed to send OTP email. Please check your email settings." });
        }        

    } catch (error) {
        console.error("Error in forgot-password route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 📌 Verify OTP & Reset Password
router.post("/reset-password", async (req, res) => {
    const { email_id, otp, new_password } = req.body;

    // ✅ Validate Input
    if (!email_id || !otp || !new_password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check OTP
    const [otpRecords] = await db.promise().query("SELECT * FROM PasswordReset WHERE email_id = ? AND otp = ?", [email_id, otp]);

    if (otpRecords.length === 0) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Hash New Password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // ✅ Update Password in Database
    await db.promise().query("UPDATE Login SET password = ? WHERE email_id = ?", [hashedPassword, email_id]);

    // ✅ Delete OTP Record (One-time use)
    await db.promise().query("DELETE FROM PasswordReset WHERE email_id = ?", [email_id]);

    res.json({ message: "Password reset successful" });
});

module.exports = router;
