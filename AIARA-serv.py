import google.generativeai as genai
import json
from typing import List, Dict, Any
from flask import Flask, request, jsonify
import mysql.connector
from dotenv import load_dotenv
import os

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
-- Login Table
CREATE TABLE Login (
    email_id TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('faculty', 'admin')) NOT NULL
);
-- Faculty Table
CREATE TABLE Faculty (
    faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mobile_no TEXT UNIQUE NOT NULL,
    degree TEXT NOT NULL,
    profile_pic TEXT NOT NULL,
    department TEXT NOT NULL
);
-- Class List Table
CREATE TABLE class_list (
    class_id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT UNIQUE NOT NULL
);
-- Courses Table
CREATE TABLE courses (
    course_id INTEGER NOT NULL,
    course_name TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL,
    resources_link TEXT
);
-- Students Table
CREATE TABLE students (
    roll_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    class_id INTEGER NOT NULL
);
-- Attendance Table
CREATE TABLE attendance (
    roll_no TEXT NOT NULL,
    course_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('present', 'absent', 'late')) NOT NULL,
    slot INTEGER NOT NULL
);
-- Assignments Table
CREATE TABLE assignments (
    assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    deadline TEXT NOT NULL,
    submission_link TEXT,
    assignment_doc_url TEXT,
    max_marks REAL NOT NULL
);
-- Assignment Submissions Table
CREATE TABLE assignment_submissions (
    submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL,
    roll_no TEXT NOT NULL,
    submission_date TEXT NOT NULL,
    file_link TEXT
);
-- Grades Table
CREATE TABLE grades (
    submission_id INTEGER PRIMARY KEY,
    roll_no TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL,
    grade REAL DEFAULT 0 NOT NULL
);
-- Course Deadlines Table
CREATE TABLE course_deadlines (
    course_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    deadline_name TEXT NOT NULL
);
-- Password Reset Table
CREATE TABLE PasswordReset (
    email_id TEXT NOT NULL,
    otp TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
-- Timetable Table
CREATE TABLE timetable (
    date TEXT NOT NULL,
    slot INTEGER CHECK (slot BETWEEN 1 AND 7) NOT NULL,
    faculty_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL
);
-- Academic Calendar Table
CREATE TABLE academic_calendar (
    date TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    work_description TEXT NOT NULL,
    course_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL
);
-- Course Outcomes Table
CREATE TABLE course_outcomes (
    outcome_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    outcome_description TEXT NOT NULL
);
-- Completed Outcomes Table
CREATE TABLE completed_outcomes (
    completion_id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    outcome_id INTEGER NOT NULL,
    completion_date TEXT NOT NULL
);
"""

############################################
# SQL Agent: Executes SQL queries
############################################
class SQLAgent:
    def __init__(self):
        self.conn = mysql.connector.connect(**db_config)
        self.cursor = self.conn.cursor(dictionary=True)
    
    def execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        try:
            self.cursor.execute(query, params)
            return self.cursor.fetchall()
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
- "queries": a JSON array of valid SQLite SQL queries that retrieve the data needed to generate a summary for the following request:
'{user_request}',  Assume faculty_id '{fac_id}' is logged in, so filter data accordingly using WHERE clauses.


The queries should cover aspects such as:
  - The average grade for the course,
  - The top 5 highest scoring students,
  - The bottom 5 lowest scoring students,
  - Any additional relevant grade distribution information.
(This is just an example for a grades summary; please consider the schema and the request to output appropriate queries.)

Use the following SQLite database schema:
{DB_SCHEMA}

Your output must be a valid JSON object without any extra text.
"""
        try:
            response = model.generate_content(gemini_prompt)
            raw_response = response.text.strip()
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
CREATE TABLE attendance (
    roll_no TEXT NOT NULL,
    course_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('present', 'absent', 'late')) NOT NULL,
    slot INTEGER NOT NULL
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
  "present_query": a valid SQLite INSERT statement that adds attendance records marking the specified students as 'present'.
  "absent_query": a valid SQLite INSERT statement that adds attendance records marking all other students in the class as 'absent'. For the absent query, use the "students" table to select roll numbers for students in the specified class that are not in the provided list.
Ensure that:
  - Each query uses a single INSERT statement (with multiple VALUES if needed).
  - The output is a valid JSON object without any extra text or markdown formatting.
"""
        try:
            response = model.generate_content(gemini_prompt)
            raw_response = response.text.strip()
            cleaned_response = raw_response.replace("```json", "").replace("```", "").strip()
            print("Raw Gemini response (AttendanceUpdateAgent):", cleaned_response)
            
            data = json.loads(cleaned_response)
            present_query = data.get("present_query", "")
            absent_query = data.get("absent_query", "")
            full_query = f"{present_query}\n{absent_query}"
            print("Generated Full SQL Query (AttendanceUpdateAgent):\n", full_query)
            
            result = self.sql_agent.executescript(full_query)
            return result
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
            return "Nonsense request. Please provide a valid query."


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
            
        sql_agent = SQLAgent()
        master_agent = MasterAgent(sql_agent)
        result = master_agent.route_request(user_request)
        sql_agent.close_connection()
        
        return jsonify({'result': result})
        
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
    
