-- Create Database
CREATE DATABASE team_db;
USE team_db;

-- Login Table
CREATE TABLE Login (
    email_id VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('faculty', 'admin') NOT NULL
);

-- Faculty Table
CREATE TABLE Faculty (
    faculty_id INT UNIQUE NOT NULL,
    email_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile_no VARCHAR(10) UNIQUE NOT NULL,
    degree VARCHAR(255) NOT NULL,
    profile_pic VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL
);

-- Class List Table
CREATE TABLE class_list (
    class_id INT UNIQUE NOT NULL,
    class_name VARCHAR(255) UNIQUE NOT NULL
);

-- Courses Table
CREATE TABLE courses (
    course_id INT NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,
    faculty_id INT NOT NULL,
    resources_link TEXT
);

-- Students Table
CREATE TABLE students (
    roll_no VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    class_id INT NOT NULL
);

-- Attendance Table
CREATE TABLE attendance (
    roll_no VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    class_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    slot INT NOT NULL
);

-- Assignments Table
CREATE TABLE assignments (
    assignment_id INT NOT NULL,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    details VARCHAR(255) NOT NULL,
    deadline DATETIME NOT NULL,
    submission_link TEXT
);

-- Assignment Submissions Table
CREATE TABLE assignment_submissions (
    assignment_id INT NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    submission_date DATETIME NOT NULL,
    file_link TEXT
);

-- Grades Table
CREATE TABLE grades (
    roll_no VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    assignment_id INT NOT NULL,
    grade DECIMAL(3,1) NOT NULL
);

-- Course Deadlines Table
CREATE TABLE course_deadlines (
    course_id INT NOT NULL,
    date DATETIME NOT NULL,
    deadline_name VARCHAR(255) NOT NULL
);

-- Password Reset Table
CREATE TABLE PasswordReset (
    email_id VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Data into Login Table
INSERT INTO Login (email_id, password, role) VALUES
('faculty1@example.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'faculty'),
('faculty2@example.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'faculty'),
('faculty3@example.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'faculty'),
('admin1@example.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'admin'),
('admin2@example.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'admin');
('guruprasath1302@gmail.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'faculty');

-- Insert Data into Faculty Table
INSERT INTO Faculty (faculty_id, email_id, name, mobile_no, degree, profile_pic, department) VALUES
(1, 'faculty1@example.com', 'Alice Johnson', '9876543210', 'PhD CS', '/uploads/default.png', 'CS'),
(2, 'faculty2@example.com', 'Bob Smith', '9876543211', 'PhD Math', '/uploads/default.png', 'Math'),
(3, 'faculty3@example.com', 'Charlie Brown', '9876543212', 'PhD Physics', '/uploads/default.png', 'Physics'),
(4, 'faculty4@example.com', 'David White', '9876543213', 'PhD Chemistry', '/uploads/default.png', 'Chemistry'),
(5, 'faculty5@example.com', 'Emma Black', '9876543214', 'PhD Biology', '/uploads/default.png', 'Biology'),
(6, 'guruprasath1302@gmail.com', 'Guruprasath M R', '8148781026','PhD AIE', '/uploads/default.png', 'AIE');

-- Insert Data into Class List
INSERT INTO class_list (class_id, class_name) VALUES
(101, 'CS101'),
(102, 'Math101'),
(103, 'Physics101'),
(104, 'Chemistry101'),
(105, 'Biology101');

-- Insert Data into Courses
INSERT INTO courses (course_id, course_name, class_id, faculty_id, resources_link) VALUES
(201, 'Data Structures', 101, 1, 'ds_resources.pdf'),
(202, 'Calculus', 102, 2, 'calculus_notes.pdf'),
(203, 'Quantum Physics', 103, 3, 'quantum.pdf'),
(204, 'Organic Chemistry', 104, 4, 'organic_chem.pdf'),
(205, 'Genetics', 105, 5, 'genetics_resources.pdf');

-- Insert Data into Students
INSERT INTO students (roll_no, name, class_id) VALUES
('S001', 'Alice Green', 101),
('S002', 'Bob White', 102),
('S003', 'Charlie Black', 103),
('S004', 'David Blue', 104),
('S005', 'Emma Red', 105);

-- Insert Data into Attendance
INSERT INTO attendance (roll_no, course_id, class_id, date, status, slot) VALUES
('S001', 201, 101, '2025-02-20', 'present', 1),
('S002', 202, 102, '2025-02-20', 'absent', 1),
('S003', 203, 103, '2025-02-20', 'late', 2),
('S004', 204, 104, '2025-02-20', 'present', 3),
('S005', 205, 105, '2025-02-20', 'absent', 4);

-- Insert Data into Assignments
INSERT INTO assignments (assignment_id, course_id, title, details, deadline, submission_link) VALUES
(301, 201, 'Linked List', 'Implement linked list', '2025-03-01 23:59:59', 'linked_list_assignment.pdf'),
(302, 202, 'Differentiation', 'Solve differentiation problems', '2025-03-02 23:59:59', 'differentiation_assignment.pdf'),
(303, 203, 'Wave Functions', 'Explain wave-particle duality', '2025-03-03 23:59:59', 'wave_assignment.pdf'),
(304, 204, 'Chemical Bonds', 'Describe ionic and covalent bonds', '2025-03-04 23:59:59', 'chem_assignment.pdf'),
(305, 205, 'DNA Structure', 'Explain DNA double helix', '2025-03-05 23:59:59', 'dna_assignment.pdf');

-- Insert Data into Assignment Submissions
INSERT INTO assignment_submissions (assignment_id, student_id, submission_date, file_link) VALUES
(301, 'S001', '2025-02-25 18:00:00', 'submission1.pdf'),
(302, 'S002', '2025-02-25 19:00:00', 'submission2.pdf'),
(303, 'S003', '2025-02-25 20:00:00', 'submission3.pdf'),
(304, 'S004', '2025-02-25 21:00:00', 'submission4.pdf'),
(305, 'S005', '2025-02-25 22:00:00', 'submission5.pdf');

-- Insert Data into Grades
INSERT INTO grades (roll_no, course_id, assignment_id, grade) VALUES
('S001', 201, 301, 9.5),
('S002', 202, 302, 8.0),
('S003', 203, 303, 7.5),
('S004', 204, 304, 9.0),
('S005', 205, 305, 8.5);

-- Insert Data into Course Deadlines
INSERT INTO course_deadlines (course_id, date, deadline_name) VALUES
(201, '2025-03-01 23:59:59', 'Assignment 1'),
(202, '2025-03-02 23:59:59', 'Assignment 2'),
(203, '2025-03-03 23:59:59', 'Assignment 3'),
(204, '2025-03-04 23:59:59', 'Assignment 4'),
(205, '2025-03-05 23:59:59', 'Assignment 5');


-- Timetable Table
CREATE TABLE timetable (
    date DATE NOT NULL,
    slot INT CHECK (slot BETWEEN 1 AND 7) NOT NULL,
    faculty_id INT NOT NULL,
    course_id INT NOT NULL,
    class_id INT NOT NULL
);

-- Academic Calendar Table
CREATE TABLE academic_calendar (
    date DATE NOT NULL,
    work_description VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    faculty_id INT NOT NULL
);

-- Insert Dummy Data into Timetable
INSERT INTO timetable (date, slot, faculty_id, course_id, class_id) VALUES
('2025-02-27', 1, 1, 201, 101),
('2025-02-27', 2, 2, 202, 102),
('2025-02-27', 3, 3, 203, 103),
('2025-02-28', 4, 4, 204, 104),
('2025-02-28', 5, 5, 205, 105),
('2025-03-01', 6, 1, 201, 101),
('2025-03-01', 7, 2, 202, 102);

-- Insert Dummy Data into Academic Calendar
INSERT INTO academic_calendar (date, work_description, course_id, faculty_id) VALUES
('2025-03-05', 'Assignment 1 submission deadline', 201, 1),
('2025-03-10', 'Midterm Exam', 202, 2),
('2025-03-15', 'Lab Practical Exam', 203, 3),
('2025-03-20', 'Assignment 2 submission deadline', 204, 4),
('2025-03-25', 'Final Project Submission', 205, 5),
('2025-04-01', 'End Semester Exams Begin', 201, 1),
('2025-04-15', 'End Semester Exams End', 202, 2);

