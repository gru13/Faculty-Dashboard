document.addEventListener('DOMContentLoaded', () => {
    const classTabs = document.querySelector('.class-tabs');
    const detailsTabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    // Removed static reference to `createClassTab` since it is dynamically created

    // Fetch and display classes
    async function fetchClasses() {
        try {
            const response = await fetch('/admin/classes');
            const data = await response.json();
            console.log('Classes fetched from backend:', data.classes); // Debug log
            if (data.success && classTabs) {
                classTabs.innerHTML = ''; // Clear existing class tabs
                data.classes.forEach((cls, index) => {
                    const classTab = document.createElement('button');
                    classTab.classList.add('class-tab');
                    classTab.dataset.classId = cls.class_id;
                    classTab.textContent = cls.class_name;

                    if (index === 0) {
                        classTab.classList.add('active');
                        loadClassDetails(cls.class_id); // Load details for the first class
                    }

                    classTabs.appendChild(classTab);
                });
                attachClassTabListeners();
            } else {
                console.warn('Failed to fetch classes or class-tabs element not found.');
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            alert('An error occurred while fetching classes.');
        }
    }

    // Attach listeners to class tabs
    function attachClassTabListeners() {
        document.querySelectorAll('.class-tab:not(.add-class-tab)').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.class-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                loadClassDetails(tab.dataset.classId);
            });
        });
    }

    // Function to create a new class
    async function createClass(className) {
        try {
            const response = await fetch('/admin/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ className })
            });
            const data = await response.json();
            if (data.success) {
                alert('Class created successfully!');
                fetchClasses(); // Refresh the class list
            } else {
                alert('Failed to create class: ' + data.message);
            }
        } catch (error) {
            console.error('Error creating class:', error);
            alert('An error occurred while creating the class.');
        }
    }

    // Load class details
    async function loadClassDetails(classId) {
        if (!classId) {
            console.warn('Invalid class ID.');
            return;
        }
        fetchStudents(classId);
        fetchCourses(classId);
    }

    // Fetch and display students
    async function fetchStudents(classId) {
        try {
            const response = await fetch(`/admin/classes/${classId}/students`);
            const data = await response.json();
            const studentsTable = document.querySelector('#students-table tbody');
            if (data.success && studentsTable) {
                studentsTable.innerHTML = data.students.map(student => `
                    <tr>
                        <td>${student.roll_no}</td>
                        <td>${student.name}</td>
                        <td><button class="delete-student" data-student-id="${student.student_id}">Delete</button></td>
                    </tr>
                `).join('');
                attachDeleteStudentListeners(classId);
            } else {
                console.warn('Failed to fetch students or students-table element not found.');
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            alert('An error occurred while fetching students.');
        }
    }

    // Attach delete student listeners
    function attachDeleteStudentListeners(classId) {
        document.querySelectorAll('.delete-student').forEach(button => {
            button.addEventListener('click', async () => {
                const studentId = button.dataset.studentId;
                if (!studentId) {
                    console.warn('Invalid student ID.');
                    return;
                }
                try {
                    const response = await fetch(`/admin/classes/${classId}/students/${studentId}`, { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                        fetchStudents(classId);
                    } else {
                        alert('Failed to delete student.');
                    }
                } catch (error) {
                    console.error('Error deleting student:', error);
                    alert('An error occurred while deleting the student.');
                }
            });
        });
    }

    // Fetch and display courses
    async function fetchCourses(classId) {
        try {
            const response = await fetch(`/admin/classes/${classId}/courses`);
            const data = await response.json();
            const coursesTable = document.querySelector('#courses-table tbody');
            if (data.success && coursesTable) {
                coursesTable.innerHTML = data.courses.map(course => `
                    <tr>
                        <td>${course.course_id}</td>
                        <td class="editable" data-field="course_name">${course.course_name}</td>
                        <td>
                            <button class="edit-course" data-course-id="${course.course_id}">Edit</button>
                            <button class="delete-course" data-course-id="${course.course_id}">Delete</button>
                            <button class="manage-outcomes" data-course-id="${course.course_id}">Manage Outcomes</button>
                        </td>
                    </tr>
                `).join('');
                attachCourseListeners(classId);
            } else {
                console.warn('Failed to fetch courses or courses-table element not found.');
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            alert('An error occurred while fetching courses.');
        }
    }

    function attachCourseListeners(classId) {
        document.querySelectorAll('.edit-course').forEach(button => {
            button.addEventListener('click', handleEditCourse);
        });
        document.querySelectorAll('.delete-course').forEach(button => {
            button.addEventListener('click', async (event) => {
                const courseId = event.target.dataset.courseId;
                if (!courseId) {
                    console.warn('Invalid course ID.');
                    return;
                }
                if (confirm('Are you sure you want to delete this course?')) {
                    try {
                        const response = await fetch(`/admin/classes/${classId}/courses/${courseId}`, { method: 'DELETE' });
                        const data = await response.json();
                        if (data.success) {
                            fetchCourses(classId);
                        } else {
                            alert('Failed to delete course.');
                        }
                    } catch (error) {
                        console.error('Error deleting course:', error);
                    }
                }
            });
        });
        document.querySelectorAll('.manage-outcomes').forEach(button => {
            button.addEventListener('click', (event) => {
                const courseId = event.target.dataset.courseId;
                fetchCourseOutcomes(courseId);
            });
        });
    }

    async function handleEditCourse(event) {
        const row = event.target.closest('tr');
        const isEditing = row.classList.contains('editing');

        if (isEditing) {
            const courseId = row.querySelector('.edit-course').dataset.courseId;
            const updatedData = {};
            row.querySelectorAll('.editable').forEach(cell => {
                const field = cell.dataset.field;
                const input = cell.querySelector('input');
                updatedData[field] = input ? input.value.trim() : cell.textContent.trim();
            });

            try {
                const response = await fetch(`/admin/classes/courses/${courseId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                const data = await response.json();
                if (data.success) {
                    alert('Course updated successfully!');
                    row.classList.remove('editing');
                    row.querySelector('.edit-course').textContent = 'Edit';
                    fetchCourses(document.querySelector('.class-tab.active').dataset.classId);
                } else {
                    alert('Failed to update course.');
                }
            } catch (error) {
                console.error('Error updating course:', error);
            }
        } else {
            row.classList.add('editing');
            row.querySelectorAll('.editable').forEach(cell => {
                const value = cell.textContent.trim();
                cell.innerHTML = `<input type="text" value="${value}" />`;
            });
            event.target.textContent = 'Save';
        }
    }

    async function fetchCourseOutcomes(courseId) {
        try {
            const response = await fetch(`/admin/courses/${courseId}/outcomes`);
            const data = await response.json();
            if (data.success) {
                const outcomesList = document.getElementById('course-outcomes-list');
                outcomesList.innerHTML = data.outcomes.map(outcome => `
                    <li data-outcome-id="${outcome.outcome_id}">
                        <span class="editable" data-field="outcome_description">${outcome.outcome_description}</span>
                        <button class="delete-outcome" data-outcome-id="${outcome.outcome_id}">Delete</button>
                    </li>
                `).join('');
                attachOutcomeListeners(courseId);
            } else {
                alert('Failed to fetch course outcomes.');
            }
        } catch (error) {
            console.error('Error fetching course outcomes:', error);
        }
    }

    function attachOutcomeListeners(courseId) {
        document.querySelectorAll('.delete-outcome').forEach(button => {
            button.addEventListener('click', async (event) => {
                const outcomeId = event.target.dataset.outcomeId;
                if (confirm('Are you sure you want to delete this outcome?')) {
                    try {
                        const response = await fetch(`/admin/courses/outcomes/${outcomeId}`, { method: 'DELETE' });
                        const data = await response.json();
                        if (data.success) {
                            fetchCourseOutcomes(courseId);
                        } else {
                            alert('Failed to delete outcome.');
                        }
                    } catch (error) {
                        console.error('Error deleting outcome:', error);
                    }
                }
            });
        });
    }

    const modifyCourseOutcomeForm = document.getElementById('modify-course-outcome-form');
    if (modifyCourseOutcomeForm) {
        modifyCourseOutcomeForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const courseId = document.querySelector('.manage-outcomes.active')?.dataset.courseId;
            const outcomeDescription = document.getElementById('new-course-outcome').value.trim();

            if (!outcomeDescription) {
                alert('Please enter an outcome description.');
                return;
            }

            try {
                const response = await fetch(`/admin/courses/${courseId}/outcomes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ outcomeDescription })
                });
                const data = await response.json();
                if (data.success) {
                    document.getElementById('new-course-outcome').value = '';
                    fetchCourseOutcomes(courseId);
                } else {
                    alert('Failed to add or modify course outcome.');
                }
            } catch (error) {
                console.error('Error adding or modifying course outcome:', error);
            }
        });
    } else {
        console.error('modify-course-outcome-form element not found in the DOM.');
    }

    // Handle tab switching
    detailsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            detailsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach(content => content.style.display = 'none');
            document.getElementById(tab.dataset.tab).style.display = 'block';
        });
    });

    // Update the form submission for adding a course
    document.getElementById('add-course-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const courseName = document.getElementById('course-name').value.trim();
        const courseId = document.getElementById('course-id').value.trim();
        const classId = document.querySelector('.class-tab.active').dataset.classId;

        if (!courseName || !courseId) {
            alert('Please fill in all fields to add a course.');
            return;
        }

        try {
            const response = await fetch(`/admin/classes/${classId}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseName, courseId })
            });
            const data = await response.json();
            if (data.success) {
                alert('Course added successfully!');
                fetchCourses(classId); // Refresh the courses list
                document.getElementById('course-name').value = '';
                document.getElementById('course-id').value = '';
            } else {
                alert('Failed to add course: ' + data.message);
            }
        } catch (error) {
            console.error('Error adding course:', error);
            alert('An error occurred while adding the course.');
        }
    });

    // Initial fetch
    fetchClasses();
});
