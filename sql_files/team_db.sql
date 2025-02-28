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
    class_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    details VARCHAR(255) NOT NULL,
    deadline DATETIME NOT NULL,
    submission_link TEXT
);

-- Assignment Submissions Table
CREATE TABLE assignment_submissions (
    course_id INT NOT NULL,
    class_id INT NOT NULL,
    assignment_id INT NOT NULL,
    roll_no VARCHAR(255) NOT NULL,
    submission_date DATETIME NOT NULL,
    file_link TEXT
);

-- Grades Table
CREATE TABLE grades (
    roll_no VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,
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
    class_id int not null,
    work_description VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    faculty_id INT NOT NULL
);

-- Insert Data into Login Table
INSERT INTO Login (email_id, password, role) VALUES
('faculty1@example.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'faculty'),
('faculty2@example.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'faculty'),
('faculty3@example.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'faculty'),
('admin1@example.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'admin'),
('admin2@example.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'admin'),
('guruprasath1302@gmail.com', '$2b$10$PeB5G.W1H0fQIjfJR.AkA.lkrUgX/UMcx/Y72yS0QI7m4CgcPUn/i', 'faculty');

-- Insert Data into Faculty Table
INSERT INTO Faculty (faculty_id, email_id, name, mobile_no, degree, profile_pic, department) VALUES
(1, 'faculty1@example.com', 'Dr. John Smith', '9876543210', 'PhD in Computer Science', 'john_smith.jpg', 'Computer Science'),
(2, 'faculty2@example.com', 'Dr. Alice Brown', '8765432109', 'PhD in Mathematics', 'alice_brown.jpg', 'Mathematics'),
(3, 'faculty3@example.com', 'Dr. Robert White', '7654321098', 'PhD in Physics', 'robert_white.jpg', 'Physics'),
(4, 'faculty4@example.com', 'Dr. Sarah Green', '6543210987', 'PhD in Chemistry', 'sarah_green.jpg', 'Chemistry'),
(5, 'faculty5@example.com', 'Dr. Mark Taylor', '5432109876', 'PhD in Biology', 'mark_taylor.jpg', 'Biology');

-- Insert Data into Class List Table
INSERT INTO class_list (class_id, class_name) VALUES
(101, 'B.Tech CSE A'),
(102, 'B.Tech CSE B'),
(103, 'B.Tech IT A'),
(104, 'B.Tech IT B'),
(105, 'B.Sc Mathematics A'),
(106, 'B.Sc Mathematics B'),
(107, 'B.Sc Physics A'),
(108, 'B.Sc Physics B'),
(109, 'B.Tech AI A'),
(110, 'B.Tech AI B'),
(111, 'B.Sc Chemistry A'),
(112, 'B.Sc Chemistry B'),
(113, 'B.Sc Biology A'),
(114, 'B.Sc Biology B');

-- Insert Data into Courses Table (allowing one course to be assigned to multiple classes)
INSERT INTO courses (course_id, course_name, class_id, faculty_id, resources_link) VALUES
-- Faculty 1 courses (Computer Science)
(201, 'Data Structures', 101, 1, 'ds_resources.pdf'),
(201, 'Data Structures', 102, 1, 'ds_resources.pdf'),
(201, 'Data Structures', 103, 1, 'ds_resources.pdf'),
(202, 'Algorithms', 101, 1, 'algo_resources.pdf'),
(202, 'Algorithms', 104, 1, 'algo_resources.pdf'),
(203, 'Computer Networks', 102, 1, 'cn_resources.pdf'),
(203, 'Computer Networks', 103, 1, 'cn_resources.pdf'),
(204, 'Operating Systems', 102, 1, 'os_resources.pdf'),
(204, 'Operating Systems', 104, 1, 'os_resources.pdf'),
(213, 'Machine Learning', 109, 1, 'ml_resources.pdf'),
(213, 'Machine Learning', 110, 1, 'ml_resources.pdf'),
(214, 'Artificial Intelligence', 109, 1, 'ai_resources.pdf'),
(214, 'Artificial Intelligence', 110, 1, 'ai_resources.pdf'),

-- Faculty 2 courses (Mathematics)
(205, 'Linear Algebra', 105, 2, 'la_resources.pdf'),
(205, 'Linear Algebra', 106, 2, 'la_resources.pdf'),
(206, 'Probability Theory', 105, 2, 'pt_resources.pdf'),
(206, 'Probability Theory', 106, 2, 'pt_resources.pdf'),
(207, 'Real Analysis', 105, 2, 'ra_resources.pdf'),
(207, 'Real Analysis', 106, 2, 'ra_resources.pdf'),
(208, 'Discrete Mathematics', 105, 2, 'dm_resources.pdf'),
(208, 'Discrete Mathematics', 106, 2, 'dm_resources.pdf'),
(215, 'Numerical Methods', 105, 2, 'nm_resources.pdf'),
(215, 'Numerical Methods', 106, 2, 'nm_resources.pdf'),
(216, 'Topology', 105, 2, 'topology_resources.pdf'),
(216, 'Topology', 106, 2, 'topology_resources.pdf'),

-- Faculty 3 courses (Physics)
(209, 'Quantum Physics', 103, 3, 'qp_resources.pdf'),
(209, 'Quantum Physics', 104, 3, 'qp_resources.pdf'),
(210, 'Thermodynamics', 103, 3, 'thermo_resources.pdf'),
(210, 'Thermodynamics', 104, 3, 'thermo_resources.pdf'),
(211, 'Electromagnetism', 103, 3, 'em_resources.pdf'),
(211, 'Electromagnetism', 104, 3, 'em_resources.pdf'),
(212, 'Statistical Mechanics', 103, 3, 'sm_resources.pdf'),
(212, 'Statistical Mechanics', 104, 3, 'sm_resources.pdf'),
(217, 'Classical Mechanics', 107, 3, 'cm_resources.pdf'),
(217, 'Classical Mechanics', 108, 3, 'cm_resources.pdf'),
(218, 'Optics', 107, 3, 'optics_resources.pdf'),
(218, 'Optics', 108, 3, 'optics_resources.pdf'),

-- Faculty 4 courses (Chemistry)
(219, 'Organic Chemistry', 111, 4, 'orgchem_resources.pdf'),
(219, 'Organic Chemistry', 112, 4, 'orgchem_resources.pdf'),
(220, 'Inorganic Chemistry', 111, 4, 'inorgchem_resources.pdf'),
(220, 'Inorganic Chemistry', 111, 4, 'inorgchem_resources.pdf'),
(221, 'Physical Chemistry', 111, 4, 'physchem_resources.pdf'),
(221, 'Physical Chemistry', 112, 4, 'physchem_resources.pdf'),
(222, 'Analytical Chemistry', 111, 4, 'analchem_resources.pdf'),
(222, 'Analytical Chemistry', 112, 4, 'analchem_resources.pdf'),

-- Faculty 5 courses (Biology)
(223, 'Genetics', 113, 5, 'genetics_resources.pdf'),
(223, 'Genetics', 114, 5, 'genetics_resources.pdf'),
(224, 'Microbiology', 113, 5, 'microbio_resources.pdf'),
(224, 'Microbiology', 114, 5, 'microbio_resources.pdf'),
(225, 'Biochemistry', 113, 5, 'biochem_resources.pdf'),
(225, 'Biochemistry', 114, 5, 'biochem_resources.pdf'),
(226, 'Botany', 113, 5, 'botany_resources.pdf'),
(226, 'Botany', 114, 5, 'botany_resources.pdf');

-- Insert Data into Students Table
INSERT INTO students (roll_no, name, class_id) VALUES
('CSE2021001', 'Alice Johnson', 101),
('CSE2021002', 'Bob Martin', 101),
('CSE2021003', 'Charlie Davis', 102),
('CSE2021004', 'David Lee', 102),
('IT2021001', 'Emma Wilson', 103),
('IT2021002', 'Frank Thomas', 103),
('IT2021003', 'Grace Hall', 104),
('IT2021004', 'Hank Lewis', 104),
('MATH2021001', 'Ivy Carter', 105),
('MATH2021002', 'Jack Young', 105),
('MATH2021003', 'Kelly Adams', 106),
('MATH2021004', 'Liam Nelson', 106),
('PHYS2021001', 'Nathan Clark', 107),
('PHYS2021002', 'Olivia Moore', 107),
('PHYS2021003', 'Peter Wright', 108),
('PHYS2021004', 'Quincy Harris', 108),
('AI2021001', 'Rachel Scott', 109),
('AI2021002', 'Steve Turner', 110),
('CHEM2021001', 'Tina Roberts', 111),
('CHEM2021002', 'Umar Patel', 112),
('BIO2021001', 'Victor Hall', 113),
('BIO2021002', 'Wendy Scott', 114);

-- Insert Data into Assignments Table
INSERT INTO assignments (assignment_id, course_id, class_id, title, details, deadline, submission_link) VALUES
(301, 201, 101, 'DS Assignment 1', 'Implement linked list', '2025-02-10 23:59:59', 'ds_assignment1.pdf'),
(302, 202, 101, 'Algorithms Assignment 1', 'Solve sorting problems', '2025-02-12 23:59:59', 'algo_assignment1.pdf'),
(303, 205, 105, 'Linear Algebra Assignment 1', 'Matrix operations', '2025-02-14 23:59:59', 'la_assignment1.pdf'),
(304, 213, 109, 'ML Assignment 1', 'Build a regression model', '2025-02-15 23:59:59', 'ml_assignment1.pdf'),
(305, 214, 110, 'AI Assignment 1', 'Implement a chatbot', '2025-02-17 23:59:59', 'ai_assignment1.pdf'),
(306, 219, 111, 'Organic Chemistry Assignment 1', 'Analyze hydrocarbons', '2025-02-18 23:59:59', 'orgchem_assignment1.pdf'),
(307, 223, 113, 'Genetics Assignment 1', 'Study DNA sequencing', '2025-02-19 23:59:59', 'genetics_assignment1.pdf');

-- Insert Data into Assignment Submissions Table
INSERT INTO assignment_submissions (course_id, class_id, assignment_id, roll_no, submission_date, file_link) VALUES
(201, 101, 301, 'CSE2021001', '2025-02-09 20:00:00', 'ds_submission1.pdf'),
(201, 101, 301, 'CSE2021002', '2025-02-09 21:00:00', 'ds_submission2.pdf'),
(202, 101, 302, 'CSE2021001', '2025-02-11 20:30:00', 'algo_submission1.pdf'),
(202, 101, 302, 'CSE2021002', '2025-02-11 21:00:00', 'algo_submission2.pdf'),
(205, 105, 303, 'MATH2021001', '2025-02-13 18:00:00', 'la_submission1.pdf'),
(205, 105, 303, 'MATH2021002', '2025-02-13 18:30:00', 'la_submission2.pdf'),
(213, 109, 304, 'AI2021001', '2025-02-14 19:00:00', 'ml_submission1.pdf'),
(214, 110, 305, 'AI2021002', '2025-02-16 20:00:00', 'ai_submission1.pdf'),
(219, 111, 306, 'CHEM2021001', '2025-02-17 17:00:00', 'orgchem_submission1.pdf'),
(223, 113, 307, 'BIO2021001', '2025-02-18 16:30:00', 'genetics_submission1.pdf'),
(223, 113, 307, 'BIO2021002', '2025-02-18 17:00:00', 'genetics_submission2.pdf');

-- Insert Data into Grades Table
INSERT INTO grades (roll_no, class_id, course_id, assignment_id, grade) VALUES
('CSE2021001', 101, 201, 301, 8.5),
('CSE2021002', 101, 201, 301, 7.8),
('CSE2021001', 101, 202, 302, 8.0),
('CSE2021002', 101, 202, 302, 7.5),
('MATH2021001', 105, 205, 303, 9.0),
('MATH2021002', 105, 205, 303, 8.5),
('AI2021001', 109, 213, 304, 8.7),
('AI2021002', 110, 214, 305, 8.2),
('CHEM2021001', 111, 219, 306, 8.9),
('BIO2021001', 113, 223, 307, 9.2),
('BIO2021002', 113, 223, 307, 9.0);

-- Insert Data into Course Deadlines Table
INSERT INTO course_deadlines (course_id, date, deadline_name) VALUES
(201, '2025-02-10 23:59:59', 'DS Assignment 1 Due Date'),
(202, '2025-02-12 23:59:59', 'Algorithms Assignment 1 Due Date'),
(205, '2025-02-14 23:59:59', 'Linear Algebra Assignment 1 Due Date'),
(213, '2025-02-15 23:59:59', 'ML Assignment 1 Due Date'),
(214, '2025-02-17 23:59:59', 'AI Assignment 1 Due Date'),
(219, '2025-02-18 23:59:59', 'Organic Chemistry Assignment 1 Due Date'),
(223, '2025-02-19 23:59:59', 'Genetics Assignment 1 Due Date');

-- Insert Data into Password Reset Table
INSERT INTO PasswordReset (email_id, otp) VALUES
('faculty1@example.com', '123456'),
('faculty2@example.com', '654321'),
('faculty3@example.com', '112233'),
('faculty4@example.com', '445566'),
('faculty5@example.com', '778899');

-- Insert Data into Timetable Table
INSERT INTO timetable (date, slot, faculty_id, course_id, class_id) VALUES
('2025-02-01', 1, 1, 201, 101),
('2025-02-01', 2, 1, 202, 101),
('2025-02-01', 3, 2, 205, 105),
('2025-02-01', 4, 3, 209, 103),
('2025-02-01', 5, 4, 219, 111),
('2025-02-01', 6, 5, 223, 113);

-- Insert Data into Academic Calendar Table
INSERT INTO academic_calendar (date, class_id, work_description, course_id, faculty_id) VALUES
('2025-02-01', 101, 'Mid-Semester Exam', 201, 1),
('2025-02-15', 102, 'Final Exam', 202, 1),
('2025-03-01', 105, 'Quiz', 205, 2),
('2025-03-05', 103, 'Lab Experiment', 209, 3),
('2025-03-10', 111, 'Practical Exam', 219, 4),
('2025-03-15', 113, 'Seminar', 223, 5);






