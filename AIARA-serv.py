import google.generativeai as genai
import json
from typing import List, Dict, Any
from flask import Flask, request, jsonify
import mysql.connector
from dotenv import load_dotenv
import os
import decimal  # Import for handling Decimal values
from datetime import datetime  # Import for handling datetime serialization

# Initialize Flask
app = Flask(__name__)


# Configure Gemini API
genai.configure(api_key="AIzaSyD265zFLfr_qFumowWwfrcpRwQp_MlvXZE")
model = genai.GenerativeModel("gemini-2.0-flash")

db_config = {
    "host": os.getenv('DB_HOST', 'localhost'),
    "user": os.getenv('DB_USER', 'root'),
    "password": os.getenv('DB_PASSWORD', ''),
    "database": os.getenv('DB_NAME', 'backend_flow')
}

# Persistent DB path (your populated database)

# Full database schema (used in prompts)
DB_SCHEMA = """
CREATE TABLE Login (
    email_id VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('faculty', 'admin') NOT NULL
);

-- Faculty Table
CREATE TABLE Faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY, -- Changed to AUTO_INCREMENT
    email_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile_no VARCHAR(10) UNIQUE NOT NULL,
    degree VARCHAR(255) NOT NULL,
    profile_pic VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL
);

-- Modify Class List Table
DROP TABLE IF EXISTS class_list;

CREATE TABLE class_list (
    class_id INT AUTO_INCREMENT PRIMARY KEY, -- Changed to AUTO_INCREMENT
    class_name VARCHAR(255) UNIQUE NOT NULL
) AUTO_INCREMENT = 101; -- Start AUTO_INCREMENT from 101

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
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    class_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    details VARCHAR(255) NOT NULL,
    deadline DATETIME NOT NULL,
    submission_link TEXT,
    assignment_doc_url TEXT, -- New column for storing assignment document URL
    max_marks DECIMAL(5,2) NOT NULL -- New column for maximum marks
);

-- Assignment Submissions Table
CREATE TABLE assignment_submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    class_id INT NOT NULL,
    assignment_id INT NOT NULL,
    roll_no VARCHAR(255) NOT NULL,
    submission_date DATETIME NOT NULL,
    file_link TEXT
);

-- Grades Table
CREATE TABLE grades (
    submission_id INT NOT NULL,
    roll_no VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,
    course_id INT NOT NULL,
    assignment_id INT NOT NULL,
    grade DECIMAL(5,2) DEFAULT 0 NOT NULL, -- Set initial grading to 0
    PRIMARY KEY (submission_id)
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
    day VARCHAR(10) NOT NULL, -- Changed from date to day
    slot INT CHECK (slot BETWEEN 1 AND 7) NOT NULL,
    faculty_id INT NOT NULL,
    course_id INT NOT NULL,
    class_id INT NOT NULL,
    UNIQUE (day, slot, faculty_id, course_id, class_id) -- Ensure unique combination of all columns
);

-- Academic Calendar Table
CREATE TABLE academic_calendar (
    date DATE NOT NULL,
    class_id int not null,
    work_description VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    faculty_id INT NOT NULL
);

-- Course Outcomes Table
CREATE TABLE course_outcomes (
    outcome_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    outcome_description TEXT NOT NULL
);

-- Completed Outcomes Table
CREATE TABLE completed_outcomes (
    completion_id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    outcome_id INT NOT NULL,
    completion_date DATE NOT NULL
);

CREATE TABLE RecentUpdates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id)
);

-- AIARA Logs Table
CREATE TABLE aiara_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id)
);
"""

############################################
# SQL Agent: Executes SQL queries
############################################
# Helper function to convert Decimal to float
def convert_decimal_to_float(data):
    if isinstance(data, list):
        return [convert_decimal_to_float(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_decimal_to_float(value) for key, value in data.items()}
    elif isinstance(data, decimal.Decimal):
        return float(data)
    return data

# Helper function to convert datetime to string
def convert_datetime_to_string(data):
    if isinstance(data, list):
        return [convert_datetime_to_string(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_datetime_to_string(value) for key, value in data.items()}
    elif isinstance(data, datetime):
        return data.isoformat()  # Convert datetime to ISO 8601 string
    return data

class SQLAgent:
    def __init__(self):
        self.conn = mysql.connector.connect(**db_config)
        self.cursor = self.conn.cursor(dictionary=True)
    
    def execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        try:
            self.cursor.execute(query, params)
            results = self.cursor.fetchall()
            return convert_decimal_to_float(results)  # Convert Decimal values to float
        except mysql.connector.Error as e:
            print(f"Database error: {str(e)}")
            return [{"error": str(e)}]
    
    def executescript(self, script: str) -> str:
        try:
            for statement in script.split(';'):
                if statement.strip():
                    self.cursor.execute(statement)
            self.conn.commit()
            return "Query executed successfully."
        except mysql.connector.Error as e:
            print(f"Database error: {str(e)}")
            return f"Database error: {str(e)}"
    
    def close_connection(self):
        self.cursor.close()
        self.conn.close()

############################################
# DataGatherAgent: Generates labeled queries for summary/report requests

############################################
class DataGatherAgent:
    def __init__(self, sql_agent: SQLAgent):
        self.sql_agent = sql_agent
    
    def gather_data(self, user_request: str) -> Dict[str, Any]:
        gemini_prompt = f"""
Provide a JSON object with two keys: "descriptions" and "queries".

- "descriptions": a JSON array of short descriptions explaining what each SQL query is intended to retrieve.
- "queries": a JSON array of valid MySQL SQL queries that retrieve the data needed to generate a summary for the following request:
'{user_request}',  Assume faculty_id '{fac_id}' is logged in, so filter data accordingly using WHERE clauses.


The queries should cover aspects such as:
  - The average grade for the course,
  - The top 5 highest scoring students,
  - The bottom 5 lowest scoring students,
  - Any additional relevant grade distribution information.
(This is just an example for a grades summary; please consider the schema and the request to output appropriate queries.)
Note: all grades and marks are maximum 10.
Use the following MySQL database schema:
{DB_SCHEMA}

Your output must be a valid JSON object without any extra text.
"""
        try:
            response = model.generate_content(gemini_prompt)
            raw_response = response.text.strip()
            print("Raw Gemini response (DataGatherAgent):", raw_response)
            # cleaned_response = raw_response
            cleaned_response = raw_response.replace("```json", "").replace("```", "").strip()
            print("Raw Gemini response (DataGatherAgent):", cleaned_response)
            
            data = json.loads(cleaned_response)
            descriptions = data.get("descriptions", [])
            queries = data.get("queries", [])
            if len(descriptions) != len(queries):
                raise ValueError("The number of descriptions does not match the number of queries.")
            
            labeled_queries = {descriptions[i]: queries[i] for i in range(len(descriptions))}
            print("Labeled queries:\n", labeled_queries)
            
            aggregated_data = {}
            for label, query in labeled_queries.items():
                result = self.sql_agent.execute_query(query)
                aggregated_data[label] = result
            return aggregated_data
        except Exception as e:
            print("Error in DataGatherAgent:", str(e))
            return {}

############################################
# SummaryAgent: Generates a natural language summary from aggregated data
############################################
class SummaryAgent:
    def generate_summary(self, user_request: str, aggregated_data: Dict[str, Any]) -> str:
        gemini_prompt = f"""
You are given the following aggregated data, where each key describes what the data represents and each value is the result from a SQL query:
{json.dumps(aggregated_data, indent=2)}

Use this data as your knowledge and answer the user request using that knowledge, user request:
'{user_request}'
"""
        try:
            response = model.generate_content(gemini_prompt)
            summary = response.text.strip()
            return summary
        except Exception as e:
            print("Error in SummaryAgent:", str(e))
            return "Error generating summary."

############################################
# AttendanceUpdateAgent: Generates and executes attendance update queries
############################################
ATTENDANCE_SCHEMA = """
-- Attendance Table
CREATE TABLE attendance (
    roll_no VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    class_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL,
    slot INT NOT NULL
);
"""
class AttendanceUpdateAgent:
    def __init__(self, sql_agent: SQLAgent):
        self.sql_agent = sql_agent

    def update_attendance(self, user_request: str) -> str:
        gemini_prompt = f"""
You are given the following attendance table schema:
{ATTENDANCE_SCHEMA}

Full schema:
{DB_SCHEMA}

A user has provided this request:
'{user_request}'

Generate a JSON object with two keys:
  "present_query": a valid MySQL INSERT statement that adds attendance records marking the specified students as 'present'.
  "absent_query": a valid MySQL INSERT statement that adds attendance records marking all other students in the class as 'absent'. For the absent query, use the "students" table to select roll numbers for students in the specified class that are not in the provided list.
Ensure that:
  - Each query uses a single INSERT statement (with multiple VALUES if needed).
  - The output is a valid JSON object without any extra text or markdown formatting.
"""
        try:
            response = model.generate_content(gemini_prompt)
            raw_response = response.text.strip()
            cleaned_response = raw_response.replace("```json", "").replace("```", "").strip()  # Ensure proper cleaning
            print("Raw Gemini response (AttendanceUpdateAgent):", cleaned_response)
            
            # Parse the cleaned JSON response
            data = json.loads(cleaned_response)
            present_query = data.get("present_query", "")
            absent_query = data.get("absent_query", "")
            full_query = f"{present_query}\n{absent_query}"
            print("Generated Full SQL Query (AttendanceUpdateAgent):\n", full_query)
            
            # Execute the generated SQL queries
            result = self.sql_agent.executescript(full_query)
            return result
        except json.JSONDecodeError as e:
            print("JSON parsing error in AttendanceUpdateAgent:", str(e))
            return "Error parsing JSON response from Gemini."
        except Exception as e:
            print("Error in AttendanceUpdateAgent:", str(e))
            return "Error updating attendance."

############################################
# MasterAgent: Uses Gemini to classify and route the user request
############################################
class MasterAgent:
    def __init__(self, sql_agent: SQLAgent):
        self.sql_agent = sql_agent
        self.data_gather_agent = DataGatherAgent(sql_agent)
        self.summary_agent = SummaryAgent()
        self.attendance_update_agent = AttendanceUpdateAgent(sql_agent)

    def classify_request(self, user_request: str) -> str:
        classification_prompt = f"""
Given the following user request:
'{user_request}'
and the context of a university backend system, classify this request into one of the following categories (output only one word):
- attendance_update
- summary_report
- nonsense

Output the appropriate category exactly as one of these words.
"""
        try:
            response = model.generate_content(classification_prompt)
            category = response.text.strip().lower()
            for marker in ["```", "sqlite", "json"]:
                category = category.replace(marker, "")
            print("MasterAgent - Classified request as:", category)
            return category
        except Exception as e:
            print("Error classifying request:", str(e))
            return "nonsense"

    def route_request(self, user_request: str) -> str:
        category = self.classify_request(user_request)
        if category == "attendance_update":
            print("Routing to AttendanceUpdateAgent")
            return self.attendance_update_agent.update_attendance(user_request)
        elif category == "summary_report":
            print("Routing to DataGatherAgent and SummaryAgent for summary/report")
            aggregated_data = self.data_gather_agent.gather_data(user_request)
            print("Aggregated Data:\n", json.dumps(aggregated_data, indent=2))
            return self.summary_agent.generate_summary(user_request, aggregated_data)
        else:
            return "Please provide a valid query."


@app.route('/query', methods=['POST'])
def handle_query():
    try:
        data = request.json
        user_request = data.get('request')
        faculty_id = data.get('faculty_id')
        
        if not user_request or not faculty_id:
            return jsonify({'error': 'Request and faculty_id are required'}), 400
            
        global fac_id
        fac_id = faculty_id
        print("1")
        sql_agent = SQLAgent()
        print("2")
        master_agent = MasterAgent(sql_agent)
        print("3")
        result = master_agent.route_request(user_request)
    
        sql_agent.close_connection()
        print("Result:", result)
        # Convert datetime objects in the result to strings
        return jsonify({'result': convert_datetime_to_string(result)})
        
    except Exception as e:
        print(f"Error in handle_query: {str(e)}")
        return jsonify({'error': str(e)}), 500


############################################
# Orchestration Example
############################################
if __name__ == "__main__":
    from flask_cors import CORS
    CORS(app)
    app.run(debug=True, port=5000)
    # Example user request for attendance update
    # user_request_attendance = """
    # Add attendance: Roll number format 'CSE2021XXX'
    # - Mark present for students with roll numbers: CSE2021001, CSE2021002
    # - Mark absent for all other students in class 101, slot 2, on date '2027-03-27'
    # """
    # print("\nUser Request (Attendance Update):")
    # output_attendance = master_agent.route_request(user_request_attendance)
    # print("Output:\n", output_attendance)

