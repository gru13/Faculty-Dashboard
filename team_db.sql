create database team_db;

use team_db;

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