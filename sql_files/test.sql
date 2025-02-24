create database team;

use team;

CREATE TABLE Login (
    email_id VARCHAR(255) unique not null,
    password VARCHAR(255) NOT NULL, -- In a real application, store password hashes, not plain passwords
    role ENUM('faculty', 'admin') NOT NULL
);

Create Table Faculty(
	faculty_id int unique not null,
    email_id VARCHAR(255) unique not null,
    name varchar(255) not null,
    mobile_no varchar(10) unique not null,
    degree varchar(255) not null,
    profile_pic varchar(255) not null,
    department varchar(255) not null
);

CREATE TABLE class_list (
    class_id int unique not null,
    class_name VARCHAR(255) UNIQUE NOT NULL
);


CREATE TABLE courses (
    course_id INT not null,
    course_name VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,
    faculty_id INT NOT NULL,
    resources_link TEXT
);


CREATE TABLE students (
    roll_no varchar(255) unique not null,
    name VARCHAR(255) NOT NULL,
    class_id INT NOT NULL
);

-- Attendance Table
CREATE TABLE attendance (
    roll_no varchar(255) unique not null,
    course_id INT NOT NULL,
    class_id int not null,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
	slot int not null
);

CREATE TABLE assignments (
    assignment_id INT not null,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    details varchar(255) not null,
    deadline DATETIME NOT NULL,
    submission_link TEXT
);


CREATE TABLE assignment_submissions (
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_date DATETIME NOT NULL,
    file_link TEXT
);


CREATE TABLE grades (
    roll_no varchar(255) unique not null,
    course_id INT NOT NULL,
    assignment_id INT NOT NULL,
    grade DECIMAL(3,1) NOT NULL
);


CREATE TABLE course_deadlines (
    course_id INT NOT NULL,
    date DATETIME NOT NULL,
    deadline_name VARCHAR(255) NOT NULL
);


-- Inserting into Login table
INSERT INTO Login (email_id, password, role) 
VALUES 
('john.doe@university.com', 'password123', 'faculty'),
('jane.smith@university.com', 'securePassword@321', 'admin'),
('alice.jones@university.com', 'qwerty789', 'faculty');

-- Inserting into Faculty table
INSERT INTO Faculty (faculty_id, email_id, name, mobile_no, degree, profile_pic, department)
VALUES 
(101, 'john.doe@university.com', 'John Doe', '9876543210', 'PhD in Computer Science', 'john_doe_pic.jpg', 'Computer Science'),
(102, 'jane.smith@university.com', 'Jane Smith', '9123456789', 'MSc in Mathematics', 'jane_smith_pic.jpg', 'Mathematics'),
(103, 'alice.jones@university.com', 'Alice Jones', '9988776655', 'MBA', 'alice_jones_pic.jpg', 'Business Administration');

-- Inserting into class_list table
INSERT INTO class_list (class_id, class_name)
VALUES 
(1, 'CS101 - Introduction to Computer Science'),
(2, 'MATH202 - Advanced Calculus'),
(3, 'BUS301 - Management Fundamentals');

-- Inserting into courses table
INSERT INTO courses (course_id, course_name, class_id, faculty_id, resources_link)
VALUES 
(201, 'Computer Science Fundamentals', 1, 101, 'www.cs101resources.com'),
(202, 'Calculus Theory', 2, 102, 'www.math202resources.com'),
(203, 'Business Management Concepts', 3, 103, 'www.bus301resources.com');

-- Inserting into students table
INSERT INTO students (roll_no, name, class_id)
VALUES 
('S001', 'Michael Scott', 1),
('S002', 'Pam Beesly', 2),
('S003', 'Jim Halpert', 3);

-- Inserting into attendance table
INSERT INTO attendance (roll_no, course_id, class_id, date, status, slot)
VALUES 
('S001', 201, 1, '2025-02-20', 'present', 1),
('S002', 202, 2, '2025-02-20', 'absent', 2),
('S003', 203, 3, '2025-02-20', 'late', 3);

-- Inserting into assignments table
INSERT INTO assignments (assignment_id, course_id, title, details, deadline, submission_link)
VALUES 
(301, 201, 'Assignment 1', 'Intro to Computer Science - Basic Questions', '2025-03-01 23:59:59', 'www.cs101assignment1.com'),
(302, 202, 'Assignment 1', 'Advanced Calculus - Problem Set', '2025-03-02 23:59:59', 'www.math202assignment1.com'),
(303, 203, 'Assignment 1', 'Management Theory - Case Study Analysis', '2025-03-03 23:59:59', 'www.bus301assignment1.com');

-- Inserting into assignment_submissions table
INSERT INTO assignment_submissions (assignment_id, student_id, submission_date, file_link)
VALUES 
(301, 1, '2025-02-25 10:00:00', 'www.cs101submission.com/file1.pdf'),
(302, 2, '2025-02-25 11:00:00', 'www.math202submission.com/file2.pdf'),
(303, 3, '2025-02-25 12:00:00', 'www.bus301submission.com/file3.pdf');

-- Inserting into grades table
INSERT INTO grades (roll_no, course_id, assignment_id, grade)
VALUES 
('S001', 201, 301, 85.5),
('S002', 202, 302, 92.0),
('S003', 203, 303, 78.0);

-- Inserting into course_deadlines table
INSERT INTO course_deadlines (course_id, date, deadline_name)
VALUES 
(201, '2025-03-01 23:59:59', 'Assignment 1 Deadline'),
(202, '2025-03-02 23:59:59', 'Assignment 1 Deadline'),
(203, '2025-03-03 23:59:59', 'Assignment 1 Deadline');
