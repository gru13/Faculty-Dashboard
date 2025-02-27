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

// Add this to your existing JavaScript
document.querySelector('.edit-profile-pic').addEventListener('click', function() {
    const container = document.querySelector('.container');
    const profilePicInput = document.getElementById('profilePicInput');
    
    if (this.classList.contains('cancel')) {
        // Cancel mode
        container.classList.remove('profile-editing-mode');
        document.querySelector('.profile-pic-actions').style.display = 'none';
        document.getElementById('profilePreview').style.display = 'none';
        this.classList.remove('cancel');
        this.innerHTML = '<span class="material-symbols-rounded">edit</span>';
        profilePicInput.value = ''; // Reset file input
    } else {
        // Edit mode
        container.classList.add('profile-editing-mode');
        this.classList.add('cancel');
        this.innerHTML = '<span class="material-symbols-rounded">close</span>';
        profilePicInput.click();
    }
});

document.getElementById('profilePicInput').addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const preview = document.getElementById('profilePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            
            // Show filename and save button
            const actions = document.querySelector('.profile-pic-actions');
            const filename = document.querySelector('.selected-file');
            filename.textContent = file.name;
            actions.style.display = 'flex';
        }
        
        reader.readAsDataURL(file);
    }
});

document.querySelector('.save-profile-pic').addEventListener('click', function() {
    const file = document.getElementById('profilePicInput').files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_pic', file);

    fetch('/update-profile-picture', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reset UI after successful upload
            document.querySelector('.profile-pic-actions').style.display = 'none';
            document.querySelector('.container').classList.remove('profile-editing-mode');
            const editButton = document.querySelector('.edit-profile-pic');
            editButton.classList.remove('cancel');
            editButton.innerHTML = '<span class="material-symbols-rounded">edit</span>';
        } else {
            showImageError('> Failed to update profile picture');
        }
    })
    .catch(error => {
        showImageError('> An error occurred while updating profile picture');
        console.error('Error:', error);
    });
});

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


function showImageError(message) {
    const imgMsg = document.getElementById('img_msg');
    imgMsg.textContent = message;
    imgMsg.style.display = 'block';
    
    // Force reflow to ensure transition works
    imgMsg.offsetHeight;
    
    imgMsg.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        imgMsg.classList.remove('show');
        setTimeout(() => {
            imgMsg.style.display = 'none';
        }, 300); // Match transition duration
    }, 3000);
}
