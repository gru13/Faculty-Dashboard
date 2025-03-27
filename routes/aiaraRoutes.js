const express = require("express");
const router = express.Router();
const path = require("path"); 
const db = require("../config/db");

// Mock AI response generator (replace with actual AI logic if available)
async function generateAIResponse(faculty_id, message) {
    console.log("Sending request to AI:", { faculty_id, message });
    
    try {
        const response = await fetch('http://localhost:5000/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                faculty_id: faculty_id,
                request: message
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.result || "I'm sorry, I couldn't process that request.";
        
    } catch (error) {
        console.error("Error calling AI service:", error);
        return "Sorry, I'm having trouble connecting to my backend service.";
    }
}

router.get('/aiara', (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, '../public/html/AIARA.html'));
});

// AIARA Chat API
router.post("/aiara/chat", async (req, res) => {
    const { message, faculty_id, timestamp } = req.body;

    // Log the incoming request payload for debugging
    console.log("Received payload:", { message, faculty_id, timestamp });
    console.log("Faculty ID:", faculty_id);
    
    if (!message || !faculty_id) {
        console.error("Missing required fields:", { message, faculty_id });
        return res.status(400).json({ success: false, message: "Message and faculty ID are required." });
    }

    try {
        // Log the chat message in the database (optional)
        await db.promise().query(
            "INSERT INTO aiara_logs (faculty_id, message, timestamp) VALUES (?, ?, ?)",
            [faculty_id, message, timestamp]
        );

        // Generate AI response
        const aiResponse = await generateAIResponse(faculty_id, message);

        // Respond with AI message
        res.json({
            success: true,
            response: {
                message: aiResponse,
                attachment: null // Add attachment logic if needed
            }
        });
    } catch (error) {
        console.error("Error handling AIARA chat:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

module.exports = router;
