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
            const classSelect = document.getElementById('class-select');
            classSelect.innerHTML = result.classes.map(cls => `
                <option value="${cls.class_id}">${cls.class_name}</option>
            `).join('');
        } catch (error) {
            console.error('Error fetching classes:', error);
            alert('Failed to load classes.');
        }
    }

    // View students by class
    const viewStudentsButton = document.getElementById('view-students');
    if (viewStudentsButton) {
        viewStudentsButton.addEventListener('click', async () => {
            const classId = document.getElementById('class-select').value;
            try {
                const response = await fetch(`/admin/students/${classId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch students');
                }
                const result = await response.json();
                const studentsList = document.getElementById('students-list');
                studentsList.innerHTML = result.students.map(student => `
                    <div class="student-item">
                        <span class="roll-no">${student.roll_no}</span>
                        <span class="student-name">${student.name}</span>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error fetching students:', error);
                alert('Failed to fetch students.');
            }
        });
    }

    // Fetch and display faculty list
    async function fetchFacultyList() {
        try {
            const response = await fetch('/admin/faculty');
            if (!response.ok) {
                throw new Error('Failed to fetch faculty list');
            }
            const result = await response.json();
            if (result.success) {
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
                alert('Failed to load faculty list.');
            }
        } catch (error) {
            console.error('Error fetching faculty list:', error);
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

    // Initial fetch of faculty list
    fetchFacultyList();

    // Initial fetch of classes
    fetchClasses();
});