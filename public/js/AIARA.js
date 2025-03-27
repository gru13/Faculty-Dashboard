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


document.addEventListener('DOMContentLoaded', async () => {
    // Update initial greeting
    await updateAIARAGreeting();
}); 


const textarea = document.getElementById('userInput');
textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    // Limit max height
    if (parseInt(this.style.height) > 120) {
        this.style.height = '120px';
    }
});

textarea.addEventListener('keydown', async function(e) {
    if (e.key === 'Enter') {
        // If shift key is pressed, allow new line
        if (e.shiftKey) {
            return;
        }
        
        // Prevent default Enter behavior
        e.preventDefault();
        
        // Trigger send button click if message isn't empty
        if (this.value.trim()) {
            document.querySelector('.send-button').click();
        }
    }
});


async function createAIMessage(text, attachment = null) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageHTML = `
        <div class="message ai-message">
            <span class="material-symbols-rounded">brightness_empty</span>
            <div class="message-content">
                <p class="typewriter"></p>
                ${attachment ? `
                    <div class="assignment-preview">
                        <div class="preview-header">
                            <span class="material-symbols-rounded">description</span>
                            <span class="file-name">${attachment.fileName}</span>
                        </div>
                        <div class="preview-actions">
                            <button class="download-button" data-url="${attachment.downloadUrl}">
                                <span class="material-symbols-rounded">download</span>
                            </button>
                        </div>
                    </div>
                ` : ''}
                <span class="timestamp">${timestamp}</span>
            </div>
        </div>
    `;
    
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
    
    // Get the last message's typewriter element
    const lastMessage = chatMessages.lastElementChild;
    const typewriter = lastMessage.querySelector('.typewriter');
    
    // Add typing animation
    typewriter.classList.add('typing');
    
    // Split text into paragraphs and handle line breaks
    const paragraphs = text.split('\n').filter(p => p.trim());
    let displayedText = '';
    
    for (const paragraph of paragraphs) {
        const words = paragraph.trim().split(' ');
        
        for (const word of words) {
            await new Promise(resolve => setTimeout(resolve, 20));
            displayedText += word + ' ';
            typewriter.textContent = displayedText.trim();
            
            // Keep scrolling to bottom while typing
            requestAnimationFrame(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        }
        
        // Add line break after each paragraph except the last one
        if (paragraphs.indexOf(paragraph) < paragraphs.length - 1) {
            displayedText += '\n\n';
            typewriter.textContent = displayedText;
        }
    }
    
    // Remove typing animation
    typewriter.classList.remove('typing');
    
    // Final scroll to ensure everything is visible
    requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    
    // Setup attachment handlers
    if (attachment) {
        const downloadBtn = lastMessage.querySelector('.download-button');
        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = attachment.downloadUrl;
            link.download = attachment.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}



// Update the send button click handler
document.querySelector('.send-button').addEventListener('click', async () => {
    const input = document.querySelector('#userInput');
    const userMessage = input.value.trim();
    
    if (!userMessage) return;
    
    // Remove greeting box if exists
    const greetingBox = document.querySelector('.greeting-box');
    if (greetingBox) {
        greetingBox.remove();
    }
    
    // Get user data including faculty_id
    const userData = await fetchUserData();
    if (!userData || !userData.faculty_id) {
        console.error("Failed to fetch user data or faculty_id is missing.");
        await createAIMessage("Unable to send your message. Please try again later.");
        return;
    }
    
    // Add user message to chat
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.insertAdjacentHTML('beforeend', `
        <div class="message user-message">
            <div class="message-content">
                <p>${userMessage}</p>
                <span class="timestamp">${timestamp}</span>
            </div>
            <span class="material-symbols-rounded">person</span>
        </div>
    `);
    
    input.value = '';
    
    // Scroll to bottom after sending message
    requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    
    // Show loading state
    document.querySelector('.chat-input').classList.add('loading');
    
    try {
        // Send message to backend with faculty_id
        console.log("Sending message to AIARA:", userMessage);
        console.log("Faculty ID:", userData.faculty_id);
        const response = await fetch('/aiara/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMessage,
                faculty_id: userData.faculty_id,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const data = await response.json();
        
        /* Expected response format:
        {
            "success": true,
            "response": {
                "message": "AI response text",
                "attachment": {        // Optional
                    "fileName": "document.pdf",
                    "downloadUrl": "/path/to/file"
                }
            }
        }
        */
        
        // Create AI response message
        await createAIMessage(
            data.response.message,
            data.response.attachment || null
        );

    } catch (error) {
        console.error('Error sending message:', error);
        await createAIMessage('Sorry, I encountered an error. Please try again later.');
    } finally {
        // Hide loading state
        document.querySelector('.chat-input').classList.remove('loading');
    }
});


async function fetchUserData() {
    try {
        const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        console.log("Fetched user data:", data); // Log the entire user data for debugging

        // Ensure faculty_id is included in the response
        if (!data.user || typeof data.user.faculty_id === 'undefined') {
            console.error("faculty_id is missing in the fetched user data:", data);
            return { name: data.user.name || 'Faculty', faculty_id: null }; // Fallback with null faculty_id
        }

        return data.user;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return { name: 'Faculty', faculty_id: null }; // Fallback with null faculty_id
    }
}

function getGreeting(hour) {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}


async function updateAIARAGreeting() {
    const greetingBox = document.querySelector('.greeting-box');
    const user = await fetchUserData();
    const hour = new Date().getHours();

    const greeting = getGreeting(hour);
    const name = user.preferredName || user.name.split(' ')[0];

    // Fallback to session user faculty_id if faculty_id is missing
    const facultyId = user.faculty_id || (window.session && window.session.user ? window.session.user.faculty_id : null);

    greetingBox.innerHTML = `
        <span class="material-symbols-rounded">brightness_empty</span>
        <h1>${greeting}, ${name}!</h1>
        <p>I can help you with your assignments and academic queries.<br>Feel free to ask me anything!</p>
    `;
}