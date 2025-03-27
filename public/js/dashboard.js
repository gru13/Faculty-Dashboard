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


function getNotificationIcon(type) {
    const icons = {
        assignment: 'assignment',
        exam: 'quiz',
        announcement: 'campaign',
        default: 'notifications'
    };
    
    return icons[type] || icons.default;
}

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

const monthElement = document.querySelector('.current-month');
const navButtons = document.querySelectorAll('.nav-button');
        
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    updateCourses();
    updateCalendar();
    generateCalendar(currentDate);
    updateEmptyState();
    updateNotifications();
    updateTimetable();
    setInterval(updateNotifications, 60000);
    setInterval(updateTimetable, 60000);
});

function updateCalendar() {
    monthElement.textContent = currentDate.toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
    });
}


navButtons.forEach(button => {
    button.addEventListener('click', async () => {
        currentDate.setMonth(currentDate.getMonth() + 
            (button.querySelector('span').textContent === 'chevron_left' ? -1 : 1));
        updateCalendar();
        await generateCalendar(currentDate);
    });
});

document.querySelectorAll('.circular-progress').forEach(progress => {
    const percentage = parseInt(progress.style.background.match(/(\d+)%/)[1]);
    progress.style.background = 
            `radial-gradient(closest-side, white 79%, transparent 80% 100%),
             conic-gradient(#5562da ${percentage}%, #e0e7ff 0)`;
});

/**
 * Fetch agenda data from backend
 * Expected API Response Format:
 * {
 *   "agendaData": {
 *     "2025-03-15": [
 *       { 
 *         "time": "10:00",      // 24-hour format
 *         "title": "CS-410 Assignment Due",
 *         "type": "assignment"  // optional: assignment, meeting, exam, etc.
 *       }
 *     ],
 *     "2025-03-30": [
 *       {
 *         "time": "11:00",
 *         "title": "Mid-term Exam",
 *         "type": "exam"
 *       }
 *     ]
 *   }
 * 
 * }
 */


async function fetchAgendaData() {
    try {
        const response = await fetch('/api/calendar/agenda', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch agenda data');
        }

        const data = await response.json();
        return data.agendaData;
    } catch (error) {
        console.error('Error fetching agenda data:', error);
        return {}; // Return empty object if fetch fails
    }
}

/**
 * Fetch notifications from backend
 * Expected API Response Format:
 * {
 *   "notifications": [
 *     {
 *       "id": 1,
 *       "title": "New assignment posted in CS-410",
 *       "time_stamp": "2024-03-02T14:30:00Z", // ISO 8601 format
 *       "type": "assignment",                  // Optional
 *       "courseCode": "CS-410",               // Optional
 *       "link": "/assignments/123"            // Optional
 *     }
 *   ]
 * }
 */
async function fetchNotifications() {
    try {
        const response = await fetch('/api/notifications', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        return processNotifications(data.notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Fetch timetable from backend
 * Expected API Response Format:
 * {
 *   "timetable": [
 *     {
 *       "id": "class_1",
 *       "start_time": "09:00",        // 24-hour format
 *       "end_time": "10:30",          // 24-hour format
 *       "title": "Data Structures",
 *       "room_no": "305",
 *       "class_id": "CS2001"          // Professor/Class identifier
 *     }
 *   ]
 * }
 */
async function fetchTimetable() {
    try {
        const response = await fetch('/api/timetable', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch timetable');
        }

        const data = await response.json();
        return processTimetable(data.timetable);
    } catch (error) {
        console.error('Error fetching timetable:', error);
        return [];
    }
}

/**
 * Fetch courses from backend
 * Expected API Response Format:
 * {
 *   "courses": [
 *     {
 *       "courseCode": "CS-410",          // Course code
 *       "courseName": "Machine Learning", // Course name
 *       "classId": "AI22",              // Class identifier
 *       "completionPercentage": 65,      // Progress percentage (0-100)
 *       "department": "CSE"              // Optional: department/type
 *     }
 *   ]
 * }
 */
async function fetchCourses() {
    try {
        const response = await fetch('/api/courses', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }

        const data = await response.json();
        console.log(data+"::hello")
        return data.courses;
    } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
}

/**
 * Fetch user data from backend
 * Expected API Response Format:
 * {
 *   "user": {
 *     "name": "John Doe",     // User's full name
 *     "preferredName": "John" // Optional: user's preferred first name
 *   }
 * }
 */
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
        return data.user;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return { name: 'Faculty' }; // Fallback name
    }
}

async function generateCalendar(date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startPadding = firstDay.getDay();
    const calendarGrid = document.querySelector('.calendar-grid');
    
    // Clear existing calendar days except headers
    const headerDays = Array.from(calendarGrid.querySelectorAll('.calendar-header-day'));
    calendarGrid.innerHTML = '';
    headerDays.forEach(day => calendarGrid.appendChild(day));

    // Add padding days from previous month
    const prevMonthLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day prev-month';
        dayElement.textContent = prevMonthLastDay - i;
        calendarGrid.appendChild(dayElement);
    }

    // Replace static agenda data with fetched data
    const agendaData = await fetchAgendaData();

    // Add current month days
    const today = new Date();
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Create number container
        const numberSpan = document.createElement('span');
        numberSpan.textContent = i;
        dayElement.appendChild(numberSpan);
        
        // Check if it's today
        if (date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear() && 
            i === today.getDate()) {
            dayElement.classList.add('current-day');
        }
        
        // Create date string for checking agenda
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        

        // Add dots if there are agenda items
        if (agendaData[dateString]) {
            const dots = document.createElement('div');
            dots.className = 'agenda-dots';
            const dotCount = Math.min(agendaData[dateString].length, 3);
            for (let j = 0; j < dotCount; j++) {
                const dot = document.createElement('div');
                dot.className = 'agenda-dot';
                dots.appendChild(dot);
            }
            dayElement.appendChild(dots);

            // Add click handler for showing agenda
            dayElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showAgendaPopup(calendarGrid, agendaData[dateString], dateString);
            });
        }

        calendarGrid.appendChild(dayElement);
    }

    // Add padding days from next month
    const endPadding = 42 - (startPadding + lastDay.getDate()); // 42 = 6 rows * 7 days
    for (let i = 1; i <= endPadding; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day next-month';
        dayElement.textContent = i;
        calendarGrid.appendChild(dayElement);
    }
}

async function updateNotifications() {
    const notificationsList = document.querySelector('.notifications-list');
    const notifications = await fetchNotifications();
    
    // Clear existing notifications
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
        updateEmptyState();
        return;
    }

    // Add notifications to the list
    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item${notification.isNew ? ' new' : ''}`;
        
        // Create inner HTML based on notification type and available data
        notificationItem.innerHTML = `
            <span class="material-symbols-rounded">
                ${getNotificationIcon(notification.type)}
            </span>
            <div class="notification-content">
                <p>${notification.title}</p>
                <small>${notification.timeAgo}</small>
            </div>
        `;

        if (notification.link) {
            notificationItem.style.cursor = 'pointer';
            notificationItem.addEventListener('click', () => {
                window.location.href = notification.link;
            });
        }

        notificationsList.appendChild(notificationItem);
    });

    updateNotificationBadge();
    updateEmptyState();
}

async function updateTimetable() {
    const timetableList = document.querySelector('.timetable-list');
    const timetable = await fetchTimetable();
    
    // Clear existing timetable
    timetableList.innerHTML = '';
    
    if (timetable.length === 0) {
        updateEmptyState();
        return;
    }

    // Add classes to the list
    timetable.forEach(entry => {
        const timetableItem = document.createElement('div');
        timetableItem.className = `timetable-item${entry.isFinished ? ' finished' : ''}`;
        
        timetableItem.innerHTML = `
            <span class="class-time">${entry.displayTime}</span>
            <div class="class-info">
                <h4>${entry.title}</h4>
                <p>Room ${entry.room_no} • ${entry.class_id}</p>
            </div>
            <span class="material-symbols-rounded">
                ${entry.isFinished ? 'check_circle' : 'arrow_forward'}
            </span>
        `;

        timetableList.appendChild(timetableItem);
    });

    updateEmptyState();
}

async function updateCourses() {
    const coursesGrid = document.querySelector('.courses-grid');
    const courses = await fetchCourses();
    
    console.log("hello"+courses)

    // Clear existing courses
    coursesGrid.innerHTML = '';
    
    if (courses.length === 0) {
        updateEmptyState();
        return;
    }

    // Add courses to the grid
    courses.forEach(course => {
        const courseBox = document.createElement('div');
        courseBox.className = 'course-box';
        courseBox.style.cursor = 'pointer'; // Add pointer cursor
        
        // Add click handler for course navigation
        courseBox.addEventListener('click', () => {
            window.location.href = `/course?course_id=${course.courseCode}`;
        });

        courseBox.innerHTML = `
            <div class="course-content">
                <div class="course-icon" style="background: #ffe0e0;">
                    <span class="material-symbols-rounded">${getDepartmentIcon(course.department)}</span>
                </div>
                <h3>${course.courseName}</h3>
                <p class="course-info">
                    <span class="course-code">${course.courseCode}</span>
                    <span class="separator">•</span>
                    <span class="class-id">${course.classId}</span>
                </p>
            </div>
        `;

        // Update progress percentage text
        const progress = courseBox.querySelector('.circular-progress');
        progress.setAttribute('data-progress', `${course.completionPercentage}%`);

        coursesGrid.appendChild(courseBox);
    });

    updateEmptyState();
}

async function updateGreeting() {
    const greetingBox = document.querySelector('.greeting-box');
    const user = await fetchUserData();
    const hour = new Date().getHours();
    
    const greeting = getGreeting(hour);
    const name = user.preferredName || user.name.split(' ')[0];
    
    greetingBox.innerHTML = `
        <h1>${greeting}, ${name}!</h1>
        <p class="text-gray">Welcome back to your dashboard</p>
    `;
}

function getDepartmentIcon(department) {
    const icons = {
        'CSE': 'code',
        'MECH': 'build',
        'EEE': 'electric_bolt',
        'CIVIL': 'architecture',
        'default': 'school'
    };
    
    return icons[department] || icons.default;
}

function showAgendaPopup(dayElement, agendaItems, dateString) {
    // Remove any existing popup
    const existingPopup = document.querySelector('.agenda-popup');
    if (existingPopup) existingPopup.remove();

    // Format the date nicely
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Create new popup
    const popup = document.createElement('div');
    popup.className = 'agenda-popup';
    
    // Add header with date and close button
    const header = document.createElement('div');
    header.className = 'agenda-popup-header';
    header.innerHTML = `
        <h3>${formattedDate}</h3>
        <button class="agenda-popup-close">
            <span class="material-symbols-rounded">close</span>
        </button>
    `;
    
    const list = document.createElement('div');
    list.className = 'agenda-list';
    
    agendaItems.forEach(item => {
        const agendaItem = document.createElement('div');
        agendaItem.className = 'agenda-item';
        agendaItem.innerHTML = `
            <span class="time">${item.time}</span>
            <span class="title">${item.title}</span>
        `;
        list.appendChild(agendaItem);
    });
    
    popup.appendChild(header);
    popup.appendChild(list);
    dayElement.appendChild(popup);
    
    // Show popup with animation
    requestAnimationFrame(() => popup.classList.add('show'));

    // Add close button handler
    popup.querySelector('.agenda-popup-close').addEventListener('click', (e) => {
        e.stopPropagation();
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 200);
    });
}

// Close popup when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.calendar-day')) {
        const popup = document.querySelector('.agenda-popup');
        if (popup) {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 200);
        }
    }
});

function updateNotificationBadge() {
    const newNotifications = document.querySelectorAll('.notification-item.new').length;
    const badge = document.querySelector('.notification-badge');
    
    if (newNotifications > 0) {
        badge.textContent = `${newNotifications} New`;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}
    
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    
    return 'Just now';
}

function processNotifications(notifications) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    return notifications.map(notification => {
        const notificationTime = new Date(notification.time_stamp);
        const timeAgo = getTimeAgo(notificationTime);
        
        return {
            ...notification,
            isNew: notificationTime > tenMinutesAgo,
            timeAgo
        };
    });
}

function updateEmptyState() {
    const containers = [
        { 
            element: document.querySelector('.courses-grid'),
            message: 'No courses to display'
        },
        { 
            element: document.querySelector('.timetable-list'),
            message: 'No classes scheduled'
        },
        { 
            element: document.querySelector('.notifications-list'),
            message: 'No new notifications'
        }
    ];

    containers.forEach(({ element, message }) => {
        if (!element) return;

        const emptyState = element.querySelector('.empty-state');
        
        console.log(element, emptyState);

        // If there's more than one child OR one child that's not empty-state
        if (element.children.length > 1 ) {
            if (emptyState) {
                emptyState.remove();
            }
            return;
        }

        // Only add empty state if truly empty
        if (element.children.length === 0 || 
            (element.children.length === 1 && element.children[0].classList.contains('empty-state'))) {
            if (!emptyState) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-state';
                emptyDiv.textContent = message;
                element.appendChild(emptyDiv);
            }
        }
    });
}

function processTimetable(timetable) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes

    return timetable.map(entry => {
        // Convert time strings to minutes for comparison
        const [endHours, endMinutes] = entry.end_time.split(':').map(Number);
        const endTimeInMinutes = endHours * 60 + endMinutes;

        return {
            ...entry,
            isFinished: currentTime > endTimeInMinutes,
            displayTime: `${entry.start_time} - ${entry.end_time}`
        };
    }).sort((a, b) => {
        // Sort by start time
        const [aHours, aMinutes] = a.start_time.split(':').map(Number);
        const [bHours, bMinutes] = b.start_time.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });
}

function getGreeting(hour) {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

// Initial calendar generation

function getSlotTime(slot) {
    const slotTimings = {
        1: { start_time: "09:00", end_time: "10:00" },
        2: { start_time: "10:00", end_time: "11:00" },
        3: { start_time: "11:00", end_time: "12:00" },
        4: { start_time: "12:00", end_time: "01:00" },
        5: { start_time: "02:00", end_time: "03:00" },
        6: { start_time: "03:00", end_time: "04:00" },
        7: { start_time: "04:00", end_time: "05:00" },
        8: { start_time: "05:00", end_time: "06:00" }
    };
    return slotTimings[slot] || { start_time: "Unknown", end_time: "Unknown" };
}

