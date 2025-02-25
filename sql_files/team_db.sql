CREATE DATABASE team_db;
USE team_db;

-- Login Table (Authentication)
CREATE TABLE Login (
    email_id VARCHAR(255) UNIQUE NOT NULL PRIMARY KEY,
    password VARCHAR(255) NOT NULL, -- Store password hashes, not plain passwords
    role ENUM('faculty', 'admin') NOT NULL
);

-- Faculty Table (Linked to Login)
CREATE TABLE Faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    email_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile_no VARCHAR(10) UNIQUE NOT NULL,
    degree VARCHAR(255) NOT NULL,
    profile_pic VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    FOREIGN KEY (email_id) REFERENCES Login(email_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Class List
CREATE TABLE class_list (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(255) UNIQUE NOT NULL
);

-- Courses Table (Linked to Faculty and Class)
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,
    faculty_id INT NOT NULL,
    resources_link TEXT,
    FOREIGN KEY (class_id) REFERENCES class_list(class_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id) ON DELETE CASCADE
);

-- Students Table (Linked to Class)
CREATE TABLE students (
    roll_no VARCHAR(255) UNIQUE NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES class_list(class_id) ON DELETE CASCADE
);

-- Attendance Table (Linked to Students, Courses, and Class)
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    class_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    slot INT NOT NULL,
    FOREIGN KEY (roll_no) REFERENCES students(roll_no) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES class_list(class_id) ON DELETE CASCADE
);

-- Assignments Table (Linked to Courses)
CREATE TABLE assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    details VARCHAR(255) NOT NULL,
    deadline DATETIME NOT NULL,
    submission_link TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Assignment Submissions Table (Linked to Assignments and Students)
CREATE TABLE assignment_submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    roll_no VARCHAR(255) NOT NULL,
    submission_date DATETIME NOT NULL,
    file_link TEXT,
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (roll_no) REFERENCES students(roll_no) ON DELETE CASCADE
);

-- Grades Table (Linked to Students and Assignments)
CREATE TABLE grades (
    grade_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    assignment_id INT NOT NULL,
    grade DECIMAL(3,1) NOT NULL,
    FOREIGN KEY (roll_no) REFERENCES students(roll_no) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE
);

-- Course Deadlines Table (Linked to Courses)
CREATE TABLE course_deadlines (
    deadline_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    date DATETIME NOT NULL,
    deadline_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE PasswordReset (
    email_id VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES Login(email_id) ON DELETE CASCADE
);
