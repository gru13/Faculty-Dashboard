const express = require('express');
const router = express.Router();
const path = require('path');
const db = require("../config/db");

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).send('Access denied. Admins only.');
};

// Serve Admin Page
router.get('/admin', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/admin.html'));
});

// Fetch all students
router.get('/students', async (req, res) => {
    try {
        const [students] = await db.promise().query('SELECT * FROM students');
        res.json({ success: true, students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Fetch students by class
router.get('/students/:classId', async (req, res) => {
    const { classId } = req.params;
    try {
        const [students] = await db.promise().query('SELECT roll_no, name FROM students WHERE class_id = ?', [classId]);
        res.json({ success: true, students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Fetch all classes
router.get('/classes', async (req, res) => {
    try {
        const [classes] = await db.promise().query('SELECT class_id, class_name FROM class_list');
        res.json({ success: true, classes });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Fetch all faculty details
router.get('/faculty', async (req, res) => {
    try {
        const [faculty] = await db.promise().query('SELECT faculty_id, name, email_id, mobile_no, department FROM Faculty');
        res.json({ success: true, faculty });
    } catch (error) {
        console.error('Error fetching faculty details:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Add a new faculty
router.post('/add-faculty', async (req, res) => {
    const { name, email, mobile, department, degree = 'To be updated' } = req.body;
    const defaultProfilePic = 'uploads/default.jpg'; // Path to the default profile image
    const defaultPassword = '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i';

    if (!name || !email || !mobile || !department) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        // Start transaction
        await db.promise().query('START TRANSACTION');

        // Check if the email already exists in the Login table
        const [existingLogin] = await db.promise().query(
            'SELECT * FROM Login WHERE email_id = ?',
            [email]
        );

        if (existingLogin.length > 0) {
            // Verify if the existing record matches the new data
            const [existingFaculty] = await db.promise().query(
                'SELECT * FROM Faculty WHERE email_id = ?',
                [email]
            );

            if (existingFaculty.length > 0) {
                const faculty = existingFaculty[0];
                if (
                    faculty.name === name &&
                    faculty.mobile_no === mobile &&
                    faculty.department === department &&
                    faculty.degree === degree &&
                    faculty.profile_pic === defaultProfilePic
                ) {
                    await db.promise().query('ROLLBACK'); // Rollback the transaction
                    return res.json({ success: true, message: 'Faculty already exists with the same details.' });
                } else {
                    await db.promise().query('ROLLBACK'); // Rollback the transaction
                    return res.status(400).json({
                        success: false,
                        message: 'A faculty with this email already exists but with different details.'
                    });
                }
            } else {
                await db.promise().query('ROLLBACK'); // Rollback the transaction
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists in the Login table but no corresponding faculty record found.'
                });
            }
        }

        // Insert into Faculty table (faculty_id is auto-generated)
        await db.promise().query(
            'INSERT INTO Faculty (email_id, name, mobile_no, degree, profile_pic, department) VALUES (?, ?, ?, ?, ?, ?)',
            [email, name, mobile, degree, defaultProfilePic, department]
        );

        // Insert into Login table with default password
        await db.promise().query(
            'INSERT INTO Login (email_id, password, role) VALUES (?, ?, ?)',
            [email, defaultPassword, 'faculty']
        );

        // Commit the transaction
        await db.promise().query('COMMIT');
        res.json({ success: true, message: 'Faculty added successfully.' });
    } catch (error) {
        await db.promise().query('ROLLBACK'); // Rollback the transaction in case of an error
        console.error('Error adding faculty:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Modify faculty details
router.put('/modify-faculty/:id', async (req, res) => {
    console.log('Raw request body:', req.body); // Debug log to check the raw request body
    const { id } = req.params;
    const { name, email_id, mobile_no, department } = req.body; // Use correct field names

    console.log(`Received request to modify faculty with ID: ${id}`);
    console.log(`Request body:`, { name, email_id, mobile_no, department });

    try {
        // Fetch existing faculty details
        console.log(`Fetching existing details for faculty ID: ${id}`);
        const [existingFaculty] = await db.promise().query(
            'SELECT name, email_id, mobile_no, department FROM Faculty WHERE faculty_id = ?',
            [id]
        );

        if (existingFaculty.length === 0) {
            console.log(`Faculty with ID ${id} not found.`);
            return res.status(404).json({ success: false, message: 'Faculty not found.' });
        }

        const currentFaculty = existingFaculty[0];
        console.log(`Current faculty details:`, currentFaculty);

        // Use provided values or fallback to current ones
        const updatedName = name || currentFaculty.name;
        const updatedEmail = email_id || currentFaculty.email_id; // Use email_id
        const updatedMobile = mobile_no || currentFaculty.mobile_no; // Use mobile_no
        const updatedDepartment = department || currentFaculty.department;

        console.log(`Updated details:`, { updatedName, updatedEmail, updatedMobile, updatedDepartment });

        // Start transaction
        console.log(`Starting transaction for updating faculty ID: ${id}`);
        await db.promise().query('START TRANSACTION');

        // Update faculty details
        console.log(`Updating Faculty table for faculty ID: ${id}`);
        await db.promise().query(
            'UPDATE Faculty SET name = ?, email_id = ?, mobile_no = ?, department = ? WHERE faculty_id = ?',
            [updatedName, updatedEmail, updatedMobile, updatedDepartment, id]
        );

        // Update email in Login table if it has changed
        if (updatedEmail !== currentFaculty.email_id) {
            console.log(`Email has changed. Updating Login table from ${currentFaculty.email_id} to ${updatedEmail}`);
            await db.promise().query(
                'UPDATE Login SET email_id = ? WHERE email_id = ?',
                [updatedEmail, currentFaculty.email_id]
            );
        } else {
            console.log(`Email has not changed or is not provided. No update required in Login table.`);
        }

        // Commit transaction
        console.log(`Committing transaction for faculty ID: ${id}`);
        await db.promise().query('COMMIT');

        console.log(`Faculty details updated successfully for ID: ${id}`);
        res.json({ success: true, message: 'Faculty details updated successfully.' });
    } catch (error) {
        console.error(`Error modifying faculty details for ID: ${id}:`, error);
        await db.promise().query('ROLLBACK'); // Rollback transaction in case of an error
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Delete faculty
router.delete('/delete-faculty/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await db.promise().query('DELETE FROM Faculty WHERE faculty_id = ?', [id]);
        res.json({ success: true, message: 'Faculty deleted successfully.' });
    } catch (error) {
        console.error('Error deleting faculty:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

module.exports = router;