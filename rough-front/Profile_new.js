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

document.querySelector('.edit-button').addEventListener('click', function() {
    const container = document.querySelector('.container');
    const cancelButton = document.querySelector('.cancel-button');
    const caMsg = document.getElementById('ca_msg');
    const isEditing = this.classList.contains('active');
    
    if (isEditing) {
        // Collecting and sending form data
        const formData = {
            name: document.querySelector('.field-value.first-name').textContent,
            department: document.querySelector('.field-value.department').textContent,
            mobile: document.querySelector('.field-value.mobile').textContent,
            profile_pic: null, 
        };

        console.log('Form Data:', formData);

        fetch('/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // On success: close editing mode and clear any error messages
                container.classList.remove('editing-mode');
                this.classList.remove('active');
                cancelButton.classList.remove('active');
                caMsg.style.display = 'none';
                
                // Reset button text
                this.innerHTML = 'Edit Details <span class="material-symbols-rounded">edit</span>';
                
                // Make fields non-editable
                const fieldValues = document.querySelectorAll('.field-value:not(.email)');
                fieldValues.forEach(field => {
                    field.contentEditable = false;
                });
            } else {
                // On error: keep editing mode and show error
                showError('> ' + data.error, 'red');
            }
        })
        .catch(error => {
            showError('> An error occurred while processing your request.', 'red');
            console.error('Error:', error);
        });
    } else {
        // Entering edit mode
        this.classList.add('active');
        cancelButton.classList.add('active');
        container.classList.add('editing-mode');
        caMsg.style.display = 'none'; // Clear any previous error messages
        
        const fieldValues = document.querySelectorAll('.field-value:not(.email)');
        fieldValues.forEach(field => {
            field.setAttribute('data-original', field.textContent);
            field.contentEditable = true;
        });
        
        this.innerHTML = 'Save Changes <span class="material-symbols-rounded">save</span>';
    }
});


document.querySelector('.cancel-button').addEventListener('click', function() {
    const editButton = document.querySelector('.edit-button');
    const container = document.querySelector('.container');
    const fieldValues = document.querySelectorAll('.field-value:not(.email)');
    const caMsg = document.getElementById('ca_msg');
    caMsg.style.display = 'none';
    // Store current values before animation
    const originalValues = {};
    fieldValues.forEach(field => {
        originalValues[field.className] = field.getAttribute('data-original') || field.textContent;
    });

    // Start transition
    container.classList.remove('editing-mode');
    this.classList.remove('active');
    editButton.classList.remove('active');

    // Animate field values
    fieldValues.forEach(field => {
        field.style.transition = 'all 0.3s ease';
        field.style.opacity = '0';
        field.contentEditable = false;
        
        setTimeout(() => {
            field.textContent = originalValues[field.className];
            field.style.opacity = '1';
        }, 150);
    });

    // Reset button text with transition
    editButton.style.opacity = '0';
    setTimeout(() => {
        editButton.innerHTML = 'Edit Details <span class="material-symbols-rounded">edit</span>';
        editButton.style.opacity = '1';
    }, 150);
});

function showError(message, color = 'red') {
    const caMsg = document.getElementById('ca_msg');
    caMsg.textContent = message;
    caMsg.style.color = color;
    caMsg.style.display = 'block';
}

// ... rest of your existing code ...

document.getElementById('confirmLogout').addEventListener('click', () => {
    // Logout the user by sending a POST request to /logout
    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
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

// Close popup when clicking outside
// Close popup when clicking outside
document.getElementById('logoutPopup').addEventListener('click', (e) => {
    if (e.target === document.getElementById('logoutPopup')) {
        logoutPopup.classList.remove('active');
    }
});
