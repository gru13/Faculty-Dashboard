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

// ...existing logout code...

// document.addEventListener("DOMContentLoaded", async function () {
//     const urlParams = new URLSearchParams(window.location.search);
//     const courseId = urlParams.get("course_id");

//     if (!courseId) {
//         alert("Course ID is missing in the URL.");
//         return;
//     }

//     try {
//         const response = await fetch(`/course/data?course_id=${courseId}`);
//         const data = await response.json();
        
//         if (!data.courses || data.courses.length === 0) {
//             alert("Failed to load course data");
//             return;
//         }

//         // Setup class tabs based on course data
//         setupClassTabs(data.courses);
        
//         // Update course info using first course entry
//         updateCourseInfo(data.courses[0]);

//         // Initial load with first class
//         const firstClass = data.courses[0];
//         if (firstClass) {
//             switchClass(firstClass.class_id, data);
//         }

//         // Setup form handlers
//         setupAssignmentForm(courseId);

//     } catch (error) {
//         console.error("Error fetching course data:", error);
//         alert("Failed to load course details.");
//     }
// });

// Add to existing JavaScript

const textarea = document.getElementById('userInput');
textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    // Limit max height
    if (parseInt(this.style.height) > 120) {
        this.style.height = '120px';
    }
});

const chatInput = document.querySelector('.chat-input');
const sendButton = document.querySelector('.send-button');

sendButton.addEventListener('click', () => {
    // Show loading state
    chatInput.classList.add('loading');
    
    // Simulate AI response time
    setTimeout(() => {
        // Hide loading state
        chatInput.classList.remove('loading');
    }, 2000); // Adjust time as needed
});


/* filepath: c:\Coding\soft-engg\public\AIARA.js */
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

// Example usage when handling user input
document.querySelector('.send-button').addEventListener('click', async () => {
    const input = document.querySelector('#userInput');
    const userMessage = input.value.trim();
    
    if (!userMessage) return;
    
    // Remove greeting box if exists
    const greetingBox = document.querySelector('.greeting-box');
    if (greetingBox) {
        greetingBox.remove();
    }
    
    // Add user message
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
    
    // Example response with attachment
    if (userMessage.toLowerCase().includes('assignment details')) {
        setTimeout(() => {
            createAIMessage(
                `Based on your request, here's a detailed analysis of the Neural Networks assignment:
                    
                            The assignment focuses on implementing a Convolutional Neural Network (CNN) for image classification. The main objectives include:
                    
                            1. Understanding the fundamental architecture of CNNs
                            2. Implementing convolution and pooling layers
                            3. Training the network on the MNIST dataset
                            4. Analyzing the model's performance and accuracy
                            
                            Key requirements:
                            • Use PyTorch or TensorFlow framework
                            • Implement at least 3 convolution layers
                            • Include dropout for regularization
                            • Achieve minimum 95% accuracy on test set
                            • Submit detailed documentation with results
                    
                            Deadline: March 30, 2025`,
                {
                    fileName: "Neural_Networks_Assignment.pdf",
                    previewUrl: "/assignments/preview/123",
                    downloadUrl: "/assignments/download/123"
                }
            );
            document.querySelector('.chat-input').classList.remove('loading');
        }, 1500);
    }
});
