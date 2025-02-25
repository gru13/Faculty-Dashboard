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
    const { email_id } = req.body;
    const otp = generateOTP();

    await db.promise().query("REPLACE INTO PasswordReset (email_id, otp) VALUES (?, ?)", [email_id, otp]);

    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email_id,
        subject: "Password Reset OTP",
        text: `Your OTP is: ${otp}`
    });

    res.json({ message: "OTP sent to your email" });
});

module.exports = router;
