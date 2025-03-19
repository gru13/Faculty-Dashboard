document.addEventListener('DOMContentLoaded', () => {
    const classTabsContainer = document.querySelector('.class-tabs-container'); // Define classTabsContainer
    const classTabsWrapper = document.querySelector('.class-tabs-wrapper');
    const classTabs = document.querySelector('.class-tabs');
    const detailsTabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    // Removed static reference to `createClassTab` since it is dynamically created

    // Fetch and display classes
    async function fetchClasses() {
        try {
            const response = await fetch('/admin/classes');
            const data = await response.json();
            console.log('Classes fetched from backend:', data); // Debug log
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

                // Re-add the "Add Class" button outside the scrollable area
                const addClassButton = document.getElementById('add-class-tab');
                if (!addClassButton) {
                    const newAddClassButton = document.createElement('button');
                    newAddClassButton.id = 'add-class-tab';
                    newAddClassButton.classList.add('add-class-tab');
                    newAddClassButton.textContent = '+ Add Class';
                    classTabsContainer.appendChild(newAddClassButton); // Append to the container
                }

                attachClassTabListeners();
                attachAddClassListener();
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

    // Attach listener to the "Add Class" button
    function attachAddClassListener() {
        const addClassButton = document.getElementById('add-class-tab');
        if (addClassButton) {
            addClassButton.addEventListener('click', async () => {
                const className = prompt('Enter the name of the new class:');
                if (!className) {
                    alert('Class name cannot be empty.');
                    return;
                }

                try {
                    const response = await fetch('/admin/classes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ className })
                    });
                    const data = await response.json();
                    if (data.success) {
                        alert('Class added successfully!');
                        fetchClasses(); // Refresh the class list
                    } else {
                        alert('Failed to add class: ' + data.message);
                    }
                } catch (error) {
                    console.error('Error adding class:', error);
                    alert('An error occurred while adding the class.');
                }
            });
        }
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
                        <td><button class="delete-student" data-roll-no="${student.roll_no}">Delete</button></td>
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
                const rollNo = button.dataset.rollNo;
                if (!rollNo) {
                    console.warn('Invalid roll number.');
                    return;
                }
                try {
                    const response = await fetch(`/admin/classes/${classId}/students/${rollNo}`, { method: 'DELETE' });
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
                        <td class="editable" data-field="faculty_id">${course.faculty_id}</td>
                        <td>
                            <button class="edit-course" data-course-id="${course.course_id}">Edit</button>
                            <button class="delete-course" data-course-id="${course.course_id}">Delete</button>
                        </td>
                    </tr>
                `).join('');
                attachCourseListeners(classId);
                attachAddCourseListener(classId); // Attach the "Add Course" button listener after courses are loaded
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
                const result = await response.json();
                if (result.success) {
                    alert('Course updated successfully!');
                    row.classList.remove('editing');
                    row.querySelector('.edit-course').textContent = 'Edit';
                    fetchCourses(document.querySelector('.class-tab.active').dataset.classId);
                } else {
                    alert(`Failed to update course: ${result.message}`);
                }
            } catch (error) {
                console.error('Error updating course:', error);
                alert('An error occurred while updating the course.');
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

    // Handle tab switching
    detailsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            detailsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach(content => content.style.display = 'none');
            document.getElementById(tab.dataset.tab).style.display = 'block';
        });
    });

    document.getElementById('add-student-button').addEventListener('click', async () => {
        const rollNo = document.getElementById('new-student-roll').value.trim();
        const name = document.getElementById('new-student-name').value.trim();
        const classId = document.querySelector('.class-tab.active').dataset.classId;

        if (!rollNo || !name) {
            alert('Please fill in all fields to add a new student.');
            return;
        }

        try {
            const response = await fetch(`/admin/classes/${classId}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rollNo, name })
            });

            const result = await response.json();
            if (result.success) {
                alert('Student added successfully!');
                fetchStudents(classId); // Refresh the students list
                document.getElementById('new-student-roll').value = '';
                document.getElementById('new-student-name').value = '';
            } else {
                if (result.error && result.error.code === 'ER_DUP_ENTRY') {
                    alert('Error: A student with this roll number already exists.');
                } else {
                    alert('Failed to add student: ' + result.message);
                }
            }
        } catch (error) {
            console.error('Error adding student:', error);
            alert('An error occurred while adding the student.');
        }
    });

    // Attach event listener to the "Add Course" button dynamically
    function attachAddCourseListener(classId) {
        const addCourseButton = document.getElementById('add-course-button');
        if (addCourseButton) {
            addCourseButton.addEventListener('click', async () => {
                const courseId = document.getElementById('new-course-id').value.trim();
                const courseName = document.getElementById('new-course-name').value.trim();
                const facultyId = document.getElementById('new-course-faculty-id').value.trim();

                if (!courseId || !courseName || !facultyId) {
                    alert('Please fill in all fields to add a new course.');
                    return;
                }

                try {
                    const response = await fetch(`/admin/classes/${classId}/courses`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ courseId, courseName, facultyId })
                    });

                    const result = await response.json();
                    if (response.ok) {
                        alert('Course added successfully!');
                        fetchCourses(classId); // Refresh the courses list
                        document.getElementById('new-course-id').value = '';
                        document.getElementById('new-course-name').value = '';
                        document.getElementById('new-course-faculty-id').value = '';
                    } else {
                        alert(`Failed to add course: ${result.message}`);
                    }
                } catch (error) {
                    console.error('Error adding course:', error);
                    alert('An error occurred while adding the course.');
                }
            });
        } else {
            console.warn('Add Course button not found in the DOM.');
        }
    }

    // Helper function to show alerts
    function showAlert(message, type = 'success') {
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove(); // Remove any existing alert
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;

        document.body.appendChild(alertDiv);

        // Automatically remove the alert after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // Attach listener to "Edit Class Name" button
    const modifyClassNameButton = document.getElementById('modify-class-name-button');
    const editClassNameContainer = document.getElementById('edit-class-name-container');
    const editClassNameInput = document.getElementById('edit-class-name-input');
    const saveClassNameButton = document.getElementById('save-class-name-button');
    const cancelClassNameButton = document.getElementById('cancel-class-name-button');

    if (modifyClassNameButton) {
        modifyClassNameButton.addEventListener('click', () => {
            const activeClassTab = document.querySelector('.class-tab.active');
            if (!activeClassTab) {
                alert('No class selected.');
                return;
            }

            // Show the input box with the existing class name
            editClassNameContainer.style.display = 'flex';
            editClassNameInput.value = activeClassTab.textContent.trim();
            modifyClassNameButton.style.display = 'none';
        });
    }

    if (saveClassNameButton) {
        saveClassNameButton.addEventListener('click', async () => {
            const activeClassTab = document.querySelector('.class-tab.active');
            if (!activeClassTab) {
                alert('No class selected.');
                return;
            }

            const newClassName = editClassNameInput.value.trim();
            const classId = activeClassTab.dataset.classId;

            if (!newClassName) {
                alert('Class name cannot be empty.');
                return;
            }

            try {
                const response = await fetch(`/admin/classes/${classId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ className: newClassName })
                });

                const result = await response.json();
                if (result.success) {
                    activeClassTab.textContent = newClassName;
                    alert('Class name updated successfully!');
                } else {
                    alert(`Failed to update class name: ${result.message}`);
                }
            } catch (error) {
                console.error('Error updating class name:', error);
                alert('An error occurred while updating the class name.');
            }

            // Hide the input box and show the "Edit Class Name" button
            editClassNameContainer.style.display = 'none';
            modifyClassNameButton.style.display = 'inline-block';
        });
    }

    if (cancelClassNameButton) {
        cancelClassNameButton.addEventListener('click', () => {
            // Hide the input box and show the "Edit Class Name" button
            editClassNameContainer.style.display = 'none';
            modifyClassNameButton.style.display = 'inline-block';
        });
    }

    const deleteClassButton = document.getElementById('delete-class-button');

    if (deleteClassButton) {
        deleteClassButton.addEventListener('click', async () => {
            const activeClassTab = document.querySelector('.class-tab.active');
            if (!activeClassTab) {
                alert('No class selected.');
                return;
            }

            const classId = activeClassTab.dataset.classId;
            const className = activeClassTab.textContent.trim();

            // Double verification
            const confirmFirst = confirm(`Are you sure you want to delete the class "${className}"?`);
            if (!confirmFirst) return;

            const confirmSecond = confirm(`This action is irreversible. Confirm deletion of "${className}"?`);
            if (!confirmSecond) return;

            try {
                const response = await fetch(`/admin/classes/${classId}`, { method: 'DELETE' });
                const result = await response.json();

                if (result.success) {
                    alert('Class deleted successfully!');
                    fetchClasses(); // Refresh the class list
                } else {
                    alert(`Failed to delete class: ${result.message}`);
                }
            } catch (error) {
                console.error('Error deleting class:', error);
                alert('An error occurred while deleting the class.');
            }
        });
    }

    // Call attachAddCourseListener after the DOM is fully loaded
    setTimeout(() => {
        const classId = document.querySelector('.class-tab.active')?.dataset.classId;
        if (classId) {
            attachAddCourseListener(classId);
        }
    }, 0);

    // Initial fetch
    fetchClasses();
});
