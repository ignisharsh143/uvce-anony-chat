// Socket.IO connection
const socket = io();

// DOM elements
const termsModal = document.getElementById('termsModal');
const agreeBtn = document.getElementById('agreeBtn');
const chatContainer = document.getElementById('chatContainer');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const userIdentity = document.getElementById('userIdentity');
const onlineCount = document.getElementById('onlineCount');
const charCount = document.getElementById('charCount');

// User state
let currentUser = '';
let hasAgreedToTerms = false;

// Profanity filter (basic implementation)
const profanityWords = [
    'asd'
    // Add more words as needed
];

// Anonymous identity generators
const adjectives = [
    'Curious', 'Brave', 'Mysterious', 'Clever', 'Friendly', 'Witty', 'Smart', 'Cool',
    'Amazing', 'Awesome', 'Brilliant', 'Creative', 'Daring', 'Energetic', 'Fantastic',
    'Genuine', 'Happy', 'Inspiring', 'Joyful', 'Kind', 'Lively', 'Magnificent'
];

const animals = [
    'Owl', 'Fox', 'Wolf', 'Eagle', 'Lion', 'Tiger', 'Bear', 'Dolphin',
    'Penguin', 'Panda', 'Koala', 'Rabbit', 'Deer', 'Hawk', 'Falcon', 'Raven',
    'Phoenix', 'Dragon', 'Unicorn', 'Griffin', 'Lynx', 'Jaguar'
];

// Generate random anonymous identity
function generateAnonymousIdentity() {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${adjective} ${animal} #${number}`;
}

// Initialize the app
function initializeApp() {
    // Show terms modal on first visit
    if (!localStorage.getItem('hasAgreedToTerms')) {
        termsModal.classList.remove('hidden');
    } else {
        startChat();
    }
}

// Handle terms agreement
agreeBtn.addEventListener('click', () => {
    localStorage.setItem('hasAgreedToTerms', 'true');
    hasAgreedToTerms = true;
    termsModal.classList.add('hidden');
    startChat();
});

// Start chat functionality
function startChat() {
    chatContainer.classList.remove('hidden');
    currentUser = generateAnonymousIdentity();
    userIdentity.textContent = currentUser;
    
    // Focus on input
    messageInput.focus();
    
    // Connect to socket
    socket.emit('user joined', currentUser);
}

// Character counter
messageInput.addEventListener('input', () => {
    const length = messageInput.value.length;
    charCount.textContent = length;
    
    const counter = document.querySelector('.char-counter');
    counter.classList.remove('warning', 'danger');
    
    if (length > 400) {
        counter.classList.add('danger');
    } else if (length > 300) {
        counter.classList.add('warning');
    }
    
    // Enable/disable send button
    sendBtn.disabled = length === 0 || length > 500;
});

// Send message function
function sendMessage() {
    const message = messageInput.value.trim();
    if (message && message.length <= 500) {
        // Apply basic profanity filter
        const filteredMessage = filterProfanity(message);
        
        socket.emit('chat message', {
            text: filteredMessage,
            user: currentUser,
            timestamp: new Date().toISOString()
        });
        
        messageInput.value = '';
        charCount.textContent = '0';
        sendBtn.disabled = true;
        messageInput.focus();
    }
}

// Basic profanity filter
function filterProfanity(text) {
    let filteredText = text;
    profanityWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    return filteredText;
}

// Send button click
sendBtn.addEventListener('click', sendMessage);

// Enter key to send
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Socket event listeners
socket.on('chat message', (data) => {
    displayMessage(data);
});

socket.on('chat history', (messages) => {
    // Clear existing messages except welcome message
    const existingMessages = messagesContainer.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Display historical messages
    messages.forEach(message => {
        const messageData = {
            id: message._id,
            user: message.user,
            text: message.text,
            timestamp: message.timestamp,
            reactions: message.reactions
        };
        displayMessage(messageData, true); // true indicates it's a historical message
    });
    
    console.log(`Loaded ${messages.length} messages from chat history`);
});

socket.on('user count', (count) => {
    onlineCount.textContent = count;
});

socket.on('message reported', (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.style.opacity = '0.5';
        messageElement.querySelector('.report-btn').textContent = '✅';
        messageElement.querySelector('.report-btn').disabled = true;
    }
});

socket.on('message deleted', (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.remove();
    }
});

// Display message in chat
function displayMessage(data, isHistorical = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.setAttribute('data-message-id', data.id || Date.now());
    
    const timestamp = new Date(data.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Get reaction counts from data if available
    const likeCount = data.reactions ? data.reactions.like || 0 : 0;
    const heartCount = data.reactions ? data.reactions.heart || 0 : 0;
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user">${data.user}</span>
            <span class="message-time">${timestamp}</span>
            ${isHistorical ? '<span class="historical-badge">📜</span>' : ''}
        </div>
        <div class="message-text">${data.text}</div>
        <div class="message-actions">
            <div class="reactions">
                <button class="reaction-btn" data-reaction="like">
                    <span>👍</span>
                    <span class="count">${likeCount}</span>
                </button>
                <button class="reaction-btn" data-reaction="heart">
                    <span>❤️</span>
                    <span class="count">${heartCount}</span>
                </button>
            </div>
            <button class="report-btn" title="Report inappropriate content">
                🚩
            </button>
        </div>
    `;
    
    // Add event listeners for reactions
    const reactionBtns = messageDiv.querySelectorAll('.reaction-btn');
    reactionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            handleReaction(btn, data.id || Date.now());
        });
    });
    
    // Add event listener for report button
    const reportBtn = messageDiv.querySelector('.report-btn');
    reportBtn.addEventListener('click', () => {
        handleReport(data.id || Date.now(), reportBtn);
    });
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle reactions
function handleReaction(button, messageId) {
    const reaction = button.getAttribute('data-reaction');
    const isActive = button.classList.contains('active');
    
    if (isActive) {
        button.classList.remove('active');
        socket.emit('remove reaction', { messageId, reaction, user: currentUser });
    } else {
        // Remove other active reactions from this user
        const messageDiv = button.closest('.message');
        const otherReactions = messageDiv.querySelectorAll('.reaction-btn.active');
        otherReactions.forEach(btn => btn.classList.remove('active'));
        
        button.classList.add('active');
        socket.emit('add reaction', { messageId, reaction, user: currentUser });
    }
}

// Handle message reporting
function handleReport(messageId, reportBtn) {
    if (confirm('Are you sure you want to report this message as inappropriate?')) {
        socket.emit('report message', { messageId, reporter: currentUser });
        reportBtn.textContent = '⏳';
        reportBtn.disabled = true;
        
        // Show feedback
        showNotification('Message reported. Thank you for keeping our community safe! 🛡️');
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Handle reaction updates from server
socket.on('reaction updated', (data) => {
    const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (messageElement) {
        const reactionBtn = messageElement.querySelector(`[data-reaction="${data.reaction}"]`);
        if (reactionBtn) {
            const countSpan = reactionBtn.querySelector('.count');
            countSpan.textContent = data.count;
        }
    }
});

// Auto-delete messages after 24 hours (client-side cleanup)
setInterval(() => {
    const messages = document.querySelectorAll('.message');
    const now = new Date();
    
    messages.forEach(message => {
        const timeElement = message.querySelector('.message-time');
        if (timeElement) {
            const messageTime = timeElement.textContent;
            // This is a simplified check - in production, you'd want more robust time handling
            const messageDate = new Date();
            messageDate.setHours(parseInt(messageTime.split(':')[0]));
            messageDate.setMinutes(parseInt(messageTime.split(':')[1]));
            
            // If message is older than 24 hours, fade it out
            const hoursDiff = (now - messageDate) / (1000 * 60 * 60);
            if (hoursDiff > 24) {
                message.style.opacity = '0.3';
                message.style.pointerEvents = 'none';
            }
        }
    });
}, 60000); // Check every minute

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page visibility change (for ephemeral identity)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && hasAgreedToTerms) {
        // Generate new identity when user returns to tab
        currentUser = generateAnonymousIdentity();
        userIdentity.textContent = currentUser;
        socket.emit('user identity changed', currentUser);
    }
});

// Prevent right-click context menu on messages (optional security measure)
messagesContainer.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.message')) {
        e.preventDefault();
    }
});
