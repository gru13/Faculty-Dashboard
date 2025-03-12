const express = require("express");
const path = require("path");
const db = require("../config/db");

const router = express.Router();

// Middleware for authentication
const authenticate = (req, res, next) => {
    if (!req.session.user || !req.session.user.faculty_id) {
        return res.status(401).json({ error: "Not authenticated or faculty ID missing" });
    }
    next();
};

// Serve Dashboard Page
router.get("/dashboard", authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/html/dashboard.html"));
});


router.get('/api/courses', authenticate, async (req, res) => {
    try {
        const faculty_id = req.session.user.faculty_id;

        if (!faculty_id) {
            return res.status(400).json({ error: "Faculty ID is missing" });
        }

        db.query(
            'SELECT * FROM courses WHERE faculty_id = ?',
            [faculty_id],
            (error, results) => {
                if (error) {
                    console.error('Database query error:', error);
                    return res.status(500).json({ error: 'Failed to fetch courses data' });
                }
        
                // If results is empty, send an empty array
                if (!results || results.length === 0) {
                    return res.json([]); // ✅ Fix: Return empty array instead of object
                }
        
                // Convert each item properly to an array
                const formattedData = results.map(item => ({
                    courseCode: item.course_id,
                    courseName: item.course_name,
                    classId: item.class_id,
                    completionPercentage: 50,
                    department: 'CSE'
                }));
        
                console.log("Formatted courses:", formattedData);
                res.json({'courses':formattedData}); // ✅ Fix: Return as an array
            }
        );
        
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Failed to fetch agenda data' });
    }
});


router.get('/api/calendar/agenda', authenticate, async (req, res) => {
    try {
        const faculty_id = req.session && req.session.user ? req.session.user.faculty_id : null;

        if (!faculty_id) {
            return res.status(400).json({ error: "Faculty ID is missing or invalid." });
        }

        // First, get distinct dates for the given faculty_id
        db.query(
            'SELECT DISTINCT date FROM academic_calendar WHERE faculty_id = ? ORDER BY date ASC',
            [faculty_id],
            (error, dateResults) => {
                if (error) {
                    console.error('❌ Database query error (Fetching Dates):', error);
                    return res.status(500).json({ error: 'Failed to fetch agenda dates.' });
                }

                if (!dateResults || dateResults.length === 0) {
                    return res.status(200).json({ agendaData: {} });
                }

                // Now, fetch records for each date
                const agendaData = {};
                let completedQueries = 0;

                dateResults.forEach(({ date }) => {
                    console.log(date)
                    db.query(
                        'SELECT work_description, course_id FROM academic_calendar WHERE faculty_id = ? AND date = ?',
                        [faculty_id, date],
                        (error, records) => {
                            if (error) {
                                console.error(`❌ Database query error (Fetching Records for ${date}):`, error);
                                return res.status(500).json({ error: `Failed to fetch agenda data for ${date}.` });
                            }

                            const dateKey = new Date(date).toISOString().split('T')[0];

                            if (!agendaData[dateKey]) {
                                agendaData[dateKey] = [];
                            }

                            records.forEach(record => {
                                agendaData[dateKey].push({
                                    time: "00:00",
                                    title: record.work_description,
                                    type: "event",
                                    courseId: record.course_id || null
                                });
                            });

                            completedQueries++;

                            // Once all queries are complete, send response
                            if (completedQueries === dateResults.length) {
                                console.log("✅ Formatted Agenda Data:", agendaData);
                                res.status(200).json({ agendaData });
                            }
                        }
                    );
                });
            }
        );

    } catch (error) {
        console.error('❌ Unexpected server error:', error);
        res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
    }
});


router.get('/api/timetable', authenticate, async (req, res) => {
    try {
        const faculty_id = req.session && req.session.user ? req.session.user.faculty_id : null;

        if (!faculty_id) {
            return res.status(400).json({ error: "Faculty ID is missing" });
        }

        db.query(
            `SELECT DISTINCT t.date, t.slot, t.class_id, t.course_id, c.course_name, cl.class_name
             FROM timetable t
             JOIN courses c ON t.course_id = c.course_id 
             JOIN class_list cl ON t.class_id = cl.class_id
             WHERE t.faculty_id = ? 
             AND t.date = CURDATE() 
             ORDER BY t.date ASC, t.slot ASC`,
            [faculty_id],
            (error, results) => {
                if (error) {
                    console.error('❌ Database query error:', error);
                    return res.status(500).json({ error: 'Failed to fetch timetable data' });
                }
        
                if (!results || results.length === 0) {
                    return res.status(200).json({ timetable: [] });
                }
        
                // Slot-to-time mapping
                const slotTimings = {
                    1: { start_time: "09:00", end_time: "10:00" },
                    2: { start_time: "10:00", end_time: "11:00" },
                    3: { start_time: "11:00", end_time: "12:00" },
                    4: { start_time: "12:00", end_time: "01:00" },
                    5: { start_time: "02:00", end_time: "03:00" },
                    6: { start_time: "03:00", end_time: "04:00" },
                    7: { start_time: "04:00", end_time: "05:00" }
                };
        
                // Format the response properly
                const formattedTimetable = results.map(function (item) {
                    return {
                        id: "class_" + item.course_id,
                        date: new Date(item.date).toISOString().split('T')[0], // Convert to YYYY-MM-DD
                        start_time: slotTimings[item.slot] ? slotTimings[item.slot].start_time : "Unknown",
                        end_time: slotTimings[item.slot] ? slotTimings[item.slot].end_time : "Unknown",
                        title: item.course_name,
                        room_no: item.class_id,
                        class_id: item.class_name // Fixed key name
                    };
                });
        
                console.log("✅ Fixed Timetable:", formattedTimetable);
                res.status(200).json({ timetable: formattedTimetable });
            }
        );
        
    } catch (error) {
        console.error('❌ Unexpected server error:', error);
        res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
    }
});


router.get('/api/user', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "User not found" });
    }

    const faculty_id = req.session.user.faculty_id; // Get faculty_id from session

    db.query(
        'SELECT name FROM Faculty WHERE faculty_id = ?',
        [faculty_id],
        (error, results) => {
            if (error) {
                console.error('Database query error:', error);
                return res.status(500).json({ error: 'Failed to fetch user data' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: "User not found in database" });
            }

            const { name } = results[0];
            res.json({
                user: {
                    name: name || "Unknown",
                    preferredName: name || "User"
                }
            });
        }
    );
});


// API to Select Course and Store in Session
router.post("/dashboard/select-course", authenticate, (req, res) => {
    const { course_id } = req.body;

    if (!course_id) {
        return res.status(400).json({ error: "Course ID is required" });
    }

    req.session.course_id = course_id;
    res.json({ success: true, message: "Course selected successfully" });
});

// Logout API
router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ success: true, message: "Logged out successfully" });
    });
});

module.exports = router;
