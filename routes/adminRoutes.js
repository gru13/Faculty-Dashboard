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
        console.log('Classes retrieved from database:', classes); // Debug log
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

// Add a new class
router.post('/classes', async (req, res) => {
    const { className } = req.body;
    try {
        await db.promise().query('INSERT INTO class_list (class_name) VALUES (?)', [className]); // class_id is now AUTO_INCREMENT
        res.json({ success: true, message: 'Class added successfully.' });
    } catch (error) {
        console.error('Error adding class:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Update a class
router.put('/classes/:classId', async (req, res) => {
    const { classId } = req.params;
    const { className } = req.body;
    try {
        await db.promise().query('UPDATE class_list SET class_name = ? WHERE class_id = ?', [className, classId]); // Use 'class_list'
        res.json({ success: true, message: 'Class updated successfully.' });
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Delete a class
router.delete('/classes/:classId', async (req, res) => {
    const { classId } = req.params;

    try {
        // Start a transaction
        await db.promise().query('START TRANSACTION');

        // Delete related students
        await db.promise().query('DELETE FROM students WHERE class_id = ?', [classId]);

        // Delete related courses
        await db.promise().query('DELETE FROM courses WHERE class_id = ?', [classId]);

        // Delete related assignments
        await db.promise().query('DELETE FROM assignments WHERE class_id = ?', [classId]);

        // Delete related assignment submissions
        await db.promise().query('DELETE FROM assignment_submissions WHERE class_id = ?', [classId]);

        // Delete related grades
        await db.promise().query('DELETE FROM grades WHERE class_id = ?', [classId]);

        // Delete related timetable entries
        await db.promise().query('DELETE FROM timetable WHERE class_id = ?', [classId]);

        // Delete related academic calendar entries
        await db.promise().query('DELETE FROM academic_calendar WHERE class_id = ?', [classId]);

        // Delete the class itself
        await db.promise().query('DELETE FROM class_list WHERE class_id = ?', [classId]);

        // Commit the transaction
        await db.promise().query('COMMIT');

        res.json({ success: true, message: 'Class and all related data deleted successfully.' });
    } catch (error) {
        // Rollback the transaction in case of an error
        await db.promise().query('ROLLBACK');
        console.error('Error deleting class:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Fetch students in a class
router.get('/classes/:classId/students', async (req, res) => {
    const { classId } = req.params;
    try {
        const [students] = await db.promise().query('SELECT roll_no, name FROM students WHERE class_id = ?', [classId]);
        res.json({ success: true, students });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Add a student to a class
router.post('/classes/:classId/students', async (req, res) => {
    const { classId } = req.params;
    const { rollNo, name } = req.body;

    if (!rollNo || !name) {
        return res.status(400).json({ success: false, message: 'Roll number and name are required.' });
    }

    try {
        await db.promise().query(
            'INSERT INTO students (roll_no, name, class_id) VALUES (?, ?, ?)',
            [rollNo, name, classId]
        );
        res.json({ success: true, message: 'Student added successfully.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, error, message: 'Duplicate entry for roll number.' });
        } else {
            console.error('Error adding student:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    }
});

// Update a student's details
router.put('/classes/:classId/students/:rollNo', async (req, res) => {
    const { classId, rollNo } = req.params;
    const { roll_no, name } = req.body;

    if (!roll_no || !name) {
        return res.status(400).json({ success: false, message: 'Roll number and name are required.' });
    }

    try {
        // Update the student's details
        await db.promise().query(
            'UPDATE students SET roll_no = ?, name = ? WHERE roll_no = ? AND class_id = ?',
            [roll_no, name, rollNo, classId]
        );
        res.json({ success: true, message: 'Student updated successfully.' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Delete a student from a class
router.delete('/classes/:classId/students/:rollNo', async (req, res) => {
    const { rollNo } = req.params;
    try {
        await db.promise().query('DELETE FROM students WHERE roll_no = ?', [rollNo]);
        res.json({ success: true, message: 'Student removed successfully.' });
    } catch (error) {
        console.error('Error removing student:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Fetch courses in a class
router.get('/classes/:classId/courses', async (req, res) => {
    const { classId } = req.params;
    try {
        // Ensure the query is fetching from the correct table
        const [courses] = await db.promise().query(
            'SELECT course_id, course_name, faculty_id FROM courses WHERE class_id = ?',
            [classId]
        );
        res.json({ success: true, courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Add a course to a class
router.post('/classes/:classId/courses', async (req, res) => {
    const { classId } = req.params;
    const { courseId, courseName, facultyId } = req.body;

    if (!courseId || !courseName || !facultyId) {
        return res.status(400).json({ success: false, message: 'Course ID, Course Name, and Faculty ID are required.' });
    }

    try {
        // Check if the course is already assigned to the class
        const [existingCourse] = await db.promise().query(
            'SELECT * FROM courses WHERE course_id = ? AND class_id = ?',
            [courseId, classId]
        );
        if (existingCourse.length > 0) {
            return res.status(400).json({ success: false, message: 'This course is already assigned to the class.' });
        }

        // Insert the course into the class
        await db.promise().query(
            'INSERT INTO courses (course_id, course_name, class_id, faculty_id) VALUES (?, ?, ?, ?)',
            [courseId, courseName, classId, facultyId]
        );
        res.json({ success: true, message: 'Course added successfully.' });
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Update a course
router.put('/classes/courses/:courseId', async (req, res) => {
    const { courseId } = req.params;
    const { course_name, faculty_id } = req.body;

    if (!course_name || !faculty_id) {
        return res.status(400).json({ success: false, message: 'Course Name and Faculty ID are required.' });
    }

    try {
        // Check if the course exists in the courses table
        const [existingCourse] = await db.promise().query('SELECT * FROM courses WHERE course_id = ?', [courseId]);
        if (existingCourse.length === 0) {
            return res.status(400).json({ success: false, message: 'Course does not exist in the courses table.' });
        }

        // Check if the faculty exists in the faculty table
        const [existingFaculty] = await db.promise().query('SELECT * FROM Faculty WHERE faculty_id = ?', [faculty_id]);
        if (existingFaculty.length === 0) {
            return res.status(400).json({ success: false, message: 'Faculty does not exist in the faculty table.' });
        }

        // Update the course
        await db.promise().query(
            'UPDATE courses SET course_name = ?, faculty_id = ? WHERE course_id = ?',
            [course_name, faculty_id, courseId]
        );
        res.json({ success: true, message: 'Course updated successfully.' });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Delete a course from a class
router.delete('/classes/:classId/courses/:courseId', async (req, res) => {
    const { courseId } = req.params;
    try {
        await db.promise().query('DELETE FROM courses WHERE course_id = ?', [courseId]);
        res.json({ success: true, message: 'Course removed successfully.' });
    } catch (error) {
        console.error('Error removing course:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Fetch distinct courses (all-course)
router.get('/all-course', async (req, res) => {
    try {
        console.log('Fetching distinct courses...'); // Debug log
        const [courses] = await db.promise().query(
            'SELECT DISTINCT course_id, course_name FROM courses'
        );
        console.log('Courses fetched successfully:', courses); // Debug log
        res.json({ success: true, courses });
    } catch (error) {
        console.error('Error fetching distinct courses:', error); // Log the error
        res.status(500).json({ success: false, message: 'Internal server error while fetching courses.' });
    }
});

// Fetch course outcomes
router.get('/courses/:courseId/outcomes', async (req, res) => {
    const { courseId } = req.params;
    try {
        const [outcomes] = await db.promise().query(
            'SELECT * FROM course_outcomes WHERE course_id = ?',
            [courseId]
        );
        res.json({ success: true, outcomes });
    } catch (error) {
        console.error('Error fetching course outcomes:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Add a course outcome
router.post('/courses/:courseId/outcomes', async (req, res) => {
    const { courseId } = req.params;
    const { outcomeDescription } = req.body;

    if (!outcomeDescription) {
        return res.status(400).json({ success: false, message: 'Outcome description is required.' });
    }

    try {
        await db.promise().query(
            'INSERT INTO course_outcomes (course_id, outcome_description) VALUES (?, ?)',
            [courseId, outcomeDescription]
        );
        res.json({ success: true, message: 'Course outcome added successfully.' });
    } catch (error) {
        console.error('Error adding course outcome:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Update a course outcome
router.put('/courses/outcomes/:outcomeId', async (req, res) => {
    const { outcomeId } = req.params;
    const { outcomeDescription } = req.body;

    if (!outcomeDescription) {
        return res.status(400).json({ success: false, message: 'Outcome description is required.' });
    }

    try {
        await db.promise().query(
            'UPDATE course_outcomes SET outcome_description = ? WHERE outcome_id = ?',
            [outcomeDescription, outcomeId]
        );
        res.json({ success: true, message: 'Course outcome updated successfully.' });
    } catch (error) {
        console.error('Error updating course outcome:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Delete a course outcome
router.delete('/courses/outcomes/:outcomeId', async (req, res) => {
    const { outcomeId } = req.params;

    try {
        await db.promise().query(
            'DELETE FROM course_outcomes WHERE outcome_id = ?',
            [outcomeId]
        );
        res.json({ success: true, message: 'Course outcome deleted successfully.' });
    } catch (error) {
        console.error('Error deleting course outcome:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Fetch timetable data
router.get('/timetable', async (req, res) => {
    try {
        const [timetable] = await db.promise().query(`
            SELECT day, slot, course_name, class_name 
            FROM timetable 
            JOIN courses ON timetable.course_id = courses.course_id 
            JOIN class_list ON timetable.class_id = class_list.class_id
        `);
        res.json({ success: true, timetable });
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Add timetable entry
router.post('/timetable', async (req, res) => {
    const { day, slot, courseId, facultyId, classId } = req.body;
    try {
        await db.promise().query(
            'INSERT INTO timetable (day, slot, course_id, faculty_id, class_id) VALUES (?, ?, ?, ?, ?)',
            [day, slot, courseId, facultyId, classId]
        );
        res.json({ success: true, message: 'Timetable entry added successfully.' });
    } catch (error) {
        console.error('Error adding timetable entry:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Fetch faculties for a course
router.get('/faculties/:courseId', async (req, res) => {
    const { courseId } = req.params;
    try {
        const [faculties] = await db.promise().query(
            'SELECT faculty_id, name FROM Faculty WHERE faculty_id IN (SELECT faculty_id FROM courses WHERE course_id = ?)',
            [courseId]
        );
        res.json({ success: true, faculties });
    } catch (error) {
        console.error('Error fetching faculties:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Fetch all courses
router.get('/courses', async (req, res) => {
    try {
        const [courses] = await db.promise().query('SELECT distinct course_id, course_name FROM courses');
        res.json({ success: true, courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
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

// Fetch classes for a specific course
router.get('/classes/:courseId', async (req, res) => {
    const { courseId } = req.params;
    try {
        const [classes] = await db.promise().query(
            'SELECT DISTINCT class_list.class_id, class_list.class_name FROM class_list JOIN courses ON class_list.class_id = courses.class_id WHERE courses.course_id = ?',
            [courseId]
        );
        res.json({ success: true, classes });
    } catch (error) {
        console.error('Error fetching classes for course:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

module.exports = router;