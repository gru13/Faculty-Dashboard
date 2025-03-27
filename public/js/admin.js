document.addEventListener('DOMContentLoaded', () => {
    // Logout functionality
    document.querySelector('.sidebar-icon.logout').addEventListener('click', () => {
        const logoutPopup = document.getElementById('logoutPopup');
        requestAnimationFrame(() => {
            logoutPopup.classList.add('active');
        });
    });

    document.getElementById('cancelLogout').addEventListener('click', () => {
        const logoutPopup = document.getElementById('logoutPopup');
        logoutPopup.classList.remove('active');
    });

    document.getElementById('confirmLogout').addEventListener('click', () => {
        fetch('/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect;
            } else {
                alert('Error logging out');
            }
        })
        .catch(error => {
            console.error('Error logging out:', error);
        });
    });

    // Fetch and populate class dropdown
    async function fetchClasses() {
        try {
            const response = await fetch('/admin/classes');
            if (!response.ok) {
                throw new Error('Failed to fetch classes');
            }
            const result = await response.json();
        } catch (error) {
            console.error('Error fetching classes:', error);
            alert('Failed to load classes.');
        }
    }

    // Fetch and display faculty list
    async function fetchFacultyList() {
        console.log('fetchFacultyList function called'); // Debug log to verify function execution
        try {
            const response = await fetch('/admin/faculty');
            console.log('Response received from /admin/faculty:', response); // Debug log for response
            if (!response.ok) {
                throw new Error('Failed to fetch faculty list');
            }
            const result = await response.json();
            console.log('Parsed JSON result:', result); // Debug log for parsed JSON
            if (result.success) {
                console.log('Fetched Faculty List:', result.faculty); // Log the faculty list
                const facultyTable = document.getElementById('faculty-table').querySelector('tbody');
                facultyTable.innerHTML = result.faculty.map(faculty => `
                    <tr data-id="${faculty.faculty_id}">
                        <td>${faculty.faculty_id}</td>
                        <td class="editable" data-field="name">${faculty.name}</td>
                        <td class="editable" data-field="email_id">${faculty.email_id}</td>
                        <td class="editable" data-field="mobile_no">${faculty.mobile_no}</td>
                        <td class="editable" data-field="department">${faculty.department}</td>
                        <td>
                            <button class="edit-faculty">Edit</button>
                            <button class="delete-faculty">Delete</button>
                        </td>
                    </tr>
                `).join('');

                // Add event listeners for Edit and Delete buttons
                document.querySelectorAll('.edit-faculty').forEach(button => {
                    button.addEventListener('click', handleEditFaculty);
                });
                document.querySelectorAll('.delete-faculty').forEach(button => {
                    button.addEventListener('click', handleDeleteFaculty);
                });
            } else {
                console.warn('Failed to load faculty list:', result.message); // Debug log for failure
                alert('Failed to load faculty list.');
            }
        } catch (error) {
            console.error('Error fetching faculty list:', error); // Debug log for errors
            alert('Error fetching faculty list.');
        }
    }

    // Handle editing faculty details
    function handleEditFaculty(event) {
        const row = event.target.closest('tr');
        const isEditing = row.classList.contains('editing');

        if (isEditing) {
            // Save changes
            handleSaveFaculty(row);
        } else {
            // Enable editing
            row.classList.add('editing');
            row.querySelectorAll('.editable').forEach(cell => {
                const value = cell.textContent.trim();
                cell.innerHTML = `<input type="text" value="${value}" class="edit-input" />`;
            });
            event.target.textContent = 'Save';
        }
    }

    // Handle saving faculty details
    async function handleSaveFaculty(row) {
        const facultyId = row.dataset.id;
        const updatedData = {};

        row.querySelectorAll('.editable').forEach(cell => {
            const field = cell.dataset.field;
            const input = cell.querySelector('input');
            if (input) {
                updatedData[field] = input.value.trim();
                cell.textContent = input.value.trim();
            } else {
                updatedData[field] = cell.textContent.trim();
            }
        });

        console.log(`Sending updated data for faculty ID ${facultyId}:`, updatedData);

        try {
            const response = await fetch(`/admin/modify-faculty/${facultyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }, // Ensure correct Content-Type
                body: JSON.stringify(updatedData) // Ensure data is sent as JSON
            });
            const result = await response.json();
            if (result.success) {
                alert(result.message);
                row.classList.remove('editing');
                row.querySelector('.edit-faculty').textContent = 'Edit';
            } else {
                alert('Failed to update faculty: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving faculty details:', error);
            alert('Failed to save faculty details.');
        }
    }

    // Handle deleting faculty
    async function handleDeleteFaculty(event) {
        const row = event.target.closest('tr');
        const facultyId = row.dataset.id;

        if (confirm('Are you sure you want to delete this faculty?')) {
            try {
                const response = await fetch(`/admin/delete-faculty/${facultyId}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                alert(result.message);
                fetchFacultyList();
            } catch (error) {
                console.error('Error deleting faculty:', error);
                alert('Failed to delete faculty.');
            }
        }
    }

    // Handle adding new faculty
    document.getElementById('add-faculty-button').addEventListener('click', async () => {
        const newFacultyName = document.getElementById('new-faculty-name').value.trim();
        const newFacultyEmail = document.getElementById('new-faculty-email').value.trim();
        const newFacultyMobile = document.getElementById('new-faculty-mobile').value.trim();
        const newFacultyDepartment = document.getElementById('new-faculty-department').value.trim();
        const defaultDegree = 'To be updated'; // Default value for degree
        const defaultProfilePic = 'default.jpg'; // Default value for profile_pic

        if (!newFacultyName || !newFacultyEmail || !newFacultyMobile || !newFacultyDepartment) {
            alert('Please fill in all fields to add a new faculty.');
            return;
        }

        try {
            const response = await fetch('/admin/add-faculty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newFacultyName,
                    email: newFacultyEmail,
                    mobile: newFacultyMobile,
                    department: newFacultyDepartment,
                    degree: defaultDegree, // Include default degree
                    profile_pic: defaultProfilePic // Include default profile_pic
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Faculty added successfully!');
                fetchFacultyList(); // Refresh the faculty list
                document.getElementById('new-faculty-name').value = '';
                document.getElementById('new-faculty-email').value = '';
                document.getElementById('new-faculty-mobile').value = '';
                document.getElementById('new-faculty-department').value = '';
            } else {
                alert('Failed to add faculty: ' + result.message);
            }
        } catch (error) {
            console.error('Error adding faculty:', error);
            alert('An error occurred while adding the faculty.');
        }
    });

    // Remove any event listeners or functionality related to the "Add Class" button
    const addClassButton = document.getElementById('add-class-tab');
    if (addClassButton) {
        addClassButton.remove(); // Remove the button from the DOM
    }

    // Initial fetch of faculty list
    fetchFacultyList();

    // Initial fetch of classes
    fetchClasses();

    async function fetchCourseOutcomes(courseId) {
        try {
            const response = await fetch(`/admin/courses/${courseId}/outcomes`);
            const result = await response.json();
            const outcomesList = document.getElementById('course-outcomes-list');
            if (result.success) {
                if (result.outcomes.length > 0) {
                    outcomesList.innerHTML = result.outcomes.map(outcome => `
                        <li data-id="${outcome.outcome_id}">
                            <span>${outcome.outcome_description}</span>
                            <div class="outcome-actions">
                                <button class="edit-outcome">Edit</button>
                                <button class="delete-outcome">Delete</button>
                            </div>
                        </li>
                    `).join('');
                    attachOutcomeListeners(courseId);
                } else {
                    outcomesList.innerHTML = '<li>No course outcomes added.</li>';
                }
            } else {
                alert('Failed to fetch course outcomes.');
            }
        } catch (error) {
            console.error('Error fetching course outcomes:', error);
        }
    }

    function attachOutcomeListeners(courseId) {
        document.querySelectorAll('.edit-outcome').forEach(button => {
            button.addEventListener('click', handleEditOutcome);
        });

        document.querySelectorAll('.delete-outcome').forEach(button => {
            button.addEventListener('click', async (event) => {
                const outcomeId = event.target.closest('li').dataset.id;
                if (confirm('Are you sure you want to delete this outcome?')) {
                    try {
                        const response = await fetch(`/admin/courses/outcomes/${outcomeId}`, { method: 'DELETE' });
                        const result = await response.json();
                        if (result.success) {
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

    document.getElementById('add-outcome-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get the selected course ID from the active course in the course list
        const activeCourse = document.querySelector('#course-list li.active');
        const courseId = activeCourse ? activeCourse.dataset.courseId : null;

        if (!courseId) {
            alert('Please select a course before adding an outcome.');
            return;
        }

        const description = document.getElementById('new-outcome-description').value.trim();

        if (!description) {
            alert('Outcome description cannot be empty.');
            return;
        }

        try {
            const response = await fetch(`/admin/courses/${courseId}/outcomes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ outcomeDescription: description })
            });
            const result = await response.json();
            if (result.success) {
                fetchCourseOutcomes(courseId); // Refresh the outcomes list for the selected course
                document.getElementById('new-outcome-description').value = '';
            } else {
                alert('Failed to add outcome.');
            }
        } catch (error) {
            console.error('Error adding outcome:', error);
        }
    });

    function handleEditOutcome(event) {
        const li = event.target.closest('li');
        const isEditing = li.classList.contains('editing');

        if (isEditing) {
            // Save changes
            handleSaveOutcome(li);
        } else {
            // Enable editing
            li.classList.add('editing');
            const outcomeDescription = li.querySelector('span').textContent.trim();
            li.innerHTML = `
                <textarea class="edit-textarea">${outcomeDescription}</textarea>
                <div class="outcome-actions">
                    <button class="save-outcome">Save</button>
                    <button class="cancel-edit">Cancel</button>
                </div>
            `;
            attachEditOutcomeListeners(li);
        }
    }

    function attachEditOutcomeListeners(li) {
        li.querySelector('.save-outcome').addEventListener('click', () => handleSaveOutcome(li));
        li.querySelector('.cancel-edit').addEventListener('click', () => handleCancelEdit(li));
    }

    function handleCancelEdit(li) {
        const outcomeId = li.dataset.id;
        const originalDescription = li.dataset.originalDescription;
        li.classList.remove('editing');
        li.innerHTML = `
            <span>${originalDescription}</span>
            <div class="outcome-actions">
                <button class="edit-outcome">Edit</button>
                <button class="delete-outcome">Delete</button>
            </div>
        `;
        attachOutcomeListeners(outcomeId);
    }

    async function handleSaveOutcome(li) {
        const outcomeId = li.dataset.id;
        const textarea = li.querySelector('textarea');
        const updatedDescription = textarea.value.trim();

        if (!updatedDescription) {
            alert('Outcome description cannot be empty.');
            return;
        }

        try {
            const response = await fetch(`/admin/courses/outcomes/${outcomeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ outcomeDescription: updatedDescription })
            });
            const result = await response.json();
            if (result.success) {
                alert('Outcome updated successfully!');
                li.classList.remove('editing');
                li.innerHTML = `
                    <span>${updatedDescription}</span>
                    <div class="outcome-actions">
                        <button class="edit-outcome">Edit</button>
                        <button class="delete-outcome">Delete</button>
                    </div>
                `;
                attachOutcomeListeners(outcomeId);
            } else {
                alert('Failed to update outcome: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving outcome:', error);
            alert('Failed to save outcome.');
        }
    }

    async function fetchAllCourses() {
        try {
            console.log('Fetching all courses...'); // Debug log
            const response = await fetch('/admin/all-course'); // Ensure the URL matches the backend route
            if (!response.ok) {
                throw new Error(`Failed to fetch courses. Status: ${response.status}`);
            }
            const result = await response.json();
            console.log('Fetched courses response:', result); // Debug log
            if (result.success) {
                const courseList = document.getElementById('course-list');
                courseList.innerHTML = result.courses.map(course => `
                    <li data-course-id="${course.course_id}">
                        ${course.course_name} (ID: ${course.course_id})
                    </li>
                `).join('');

                // Add click listeners to course list items
                document.querySelectorAll('#course-list li').forEach(item => {
                    item.addEventListener('click', () => {
                        document.querySelectorAll('#course-list li').forEach(li => li.classList.remove('active'));
                        item.classList.add('active');
                        fetchCourseOutcomes(item.dataset.courseId);
                    });
                });

                // Automatically select the first course in the list and load its outcomes
                const firstCourse = courseList.querySelector('li');
                if (firstCourse) {
                    firstCourse.classList.add('active');
                    fetchCourseOutcomes(firstCourse.dataset.courseId);
                }
            } else {
                console.warn('Failed to fetch courses:', result.message); // Debug log
                alert('Failed to fetch courses: ' + result.message);
            }
        } catch (error) {
            console.error('Error fetching all courses:', error); // Debug log
            alert('An error occurred while fetching the course list.');
        }
    }

    // Call fetchAllCourses when the page loads
    fetchAllCourses();
    
    function autoExpandTextarea(textarea) {
        textarea.style.height = 'auto'; // Reset height to calculate the new height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set height to fit content
    }

    // Attach the auto-expand logic to all textareas with the class 'edit-textarea'
    document.addEventListener('input', (event) => {
        if (event.target.classList.contains('edit-textarea')) {
            autoExpandTextarea(event.target);
        }
    });

    // Ensure the textarea is expanded when it is first loaded with content
    document.querySelectorAll('.edit-textarea').forEach((textarea) => {
        autoExpandTextarea(textarea);
    });

    document.getElementById('course-search').addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const courseItems = document.querySelectorAll('#course-list li');

        courseItems.forEach((item) => {
            const courseName = item.textContent.toLowerCase();
            if (courseName.includes(searchTerm)) {
                item.style.display = ''; // Show the item
            } else {
                item.style.display = 'none'; // Hide the item
            }
        });
    });

    // Search functionality for faculty list
    document.getElementById('faculty-search').addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const facultyRows = document.querySelectorAll('#faculty-table tbody tr');

        facultyRows.forEach((row) => {
            const facultyName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const facultyEmail = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            if (facultyName.includes(searchTerm) || facultyEmail.includes(searchTerm)) {
                row.style.display = ''; // Show the row
            } else {
                row.style.display = 'none'; // Hide the row
            }
        });
    });

    // Search functionality for class list
    document.getElementById('class-search').addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const classTabs = document.querySelectorAll('.class-tabs .class-tab');

        classTabs.forEach((tab) => {
            const className = tab.textContent.toLowerCase();
            if (className.includes(searchTerm)) {
                tab.style.display = ''; // Show the tab
            } else {
                tab.style.display = 'none'; // Hide the tab
            }
        });
    });

    async function populateDropdowns() {
        try {
            const [coursesResponse, classesResponse] = await Promise.all([
                fetch('/admin/courses'),
                fetch('/admin/classes')
            ]);
            const courses = await coursesResponse.json();
            const classes = await classesResponse.json();

            if (courses.success) {
                const courseDropdown = document.getElementById('timetable-course');
                courseDropdown.innerHTML = '<option value="" disabled selected>Select Course</option>';
                courses.courses.forEach(course => {
                    courseDropdown.innerHTML += `<option value="${course.course_id}">${course.course_name}</option>`;
                });
            }

            if (classes.success) {
                const classDropdown = document.getElementById('timetable-class');
                classDropdown.innerHTML = '<option value="" disabled selected>Select Class</option>';
                classes.classes.forEach(cls => {
                    classDropdown.innerHTML += `<option value="${cls.class_id}">${cls.class_name}</option>`;
                });
            }
        } catch (error) {
            console.error('Error populating dropdowns:', error);
        }
    }

    document.getElementById('timetable-course').addEventListener('change', async (event) => {
        const courseId = event.target.value;

        // Fetch faculties for the selected course
        try {
            const facultyResponse = await fetch(`/admin/faculties/${courseId}`);
            const facultyResult = await facultyResponse.json();
            const facultyDropdown = document.getElementById('timetable-faculty');
            facultyDropdown.disabled = false;
            facultyDropdown.innerHTML = '<option value="" disabled selected>Select Faculty</option>';
            if (facultyResult.success) {
                facultyResult.faculties.forEach(faculty => {
                    facultyDropdown.innerHTML += `<option value="${faculty.faculty_id}">${faculty.name}</option>`;
                });
            }
        } catch (error) {
            console.error('Error fetching faculties:', error);
        }

        // Fetch classes for the selected course
        try {
            const classResponse = await fetch(`/admin/classes/${courseId}`);
            const classResult = await classResponse.json();
            const classDropdown = document.getElementById('timetable-class');
            classDropdown.disabled = false;
            classDropdown.innerHTML = '<option value="" disabled selected>Select Class</option>';
            if (classResult.success) {
                classResult.classes.forEach(cls => {
                    classDropdown.innerHTML += `<option value="${cls.class_id}">${cls.class_name}</option>`;
                });
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    });

    document.getElementById('add-timetable-entry').addEventListener('click', async () => {
        const day = document.getElementById('timetable-day').value;
        const slot = document.getElementById('timetable-slot').value;
        const courseId = document.getElementById('timetable-course').value;
        const facultyId = document.getElementById('timetable-faculty').value;
        const classId = document.getElementById('timetable-class').value;

        if (!day || !slot || !courseId || !facultyId || !classId) {
            alert('Please fill all fields.');
            return;
        }

        try {
            // Disable button to prevent multiple clicks
            const button = document.getElementById('add-timetable-entry');
            button.disabled = true;

            const response = await fetch('/admin/timetable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day, slot, courseId, facultyId, classId })
            });

            const result = await response.json();
            if (result.success) {
                alert(result.message);
                fetchTimetable();
            } else {
                alert(result.message || 'Failed to add timetable entry.');
            }
        } catch (error) {
            console.error('Error adding timetable entry:', error);
        } finally {
            // Re-enable button
            document.getElementById('add-timetable-entry').disabled = false;
        }
    });

    async function fetchTimetable(classId) {
        const timetableList = document.querySelector('.timetable-list');
        timetableList.innerHTML = ''; // Clear existing timetable to prevent duplicates
    
        try {
            const response = await fetch(`/classes/${classId}/timetable`);
            if (!response.ok) {
                throw new Error('Failed to fetch timetable');
            }
    
            const result = await response.json();
            if (result.success) {
                const uniqueEntries = new Set(); // Track unique entries to avoid duplicates
                result.timetable.forEach(entry => {
                    const key = `${entry.day}-${entry.slot}-${entry.course_id}-${entry.faculty_id}`;
                    if (!uniqueEntries.has(key)) {
                        uniqueEntries.add(key);
                        const timetableItem = document.createElement('div');
                        timetableItem.className = 'timetable-item';
                        timetableItem.innerHTML = `
                            <span>${entry.day}</span>
                            <span>${entry.slot}</span>
                            <span>${entry.course_name}</span>
                            <span>${entry.faculty_name}</span>
                        `;
                        timetableList.appendChild(timetableItem);
                    }
                });
            } else {
                alert('Failed to load timetable.');
            }
        } catch (error) {
            console.error('Error fetching timetable:', error);
        }
    }

    // Initial load
    populateDropdowns();
});